import fetch from 'node-fetch';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { CLIOptions } from '../index';

/**
 * Register the site with Split backend
 */
export async function registerSite(options: CLIOptions): Promise<void> {
  const projectDir = process.cwd();
  let agentId = options.agentId || '';
  let agentSecret = options.agentSecret || '';
  
  // If agent credentials aren't in options, read from .env.local
  if (!agentId || !agentSecret) {
    const envPath = path.join(projectDir, '.env.local');
    
    if (await fs.pathExists(envPath)) {
      const envContent = await fs.readFile(envPath, 'utf8');
      
      // Extract the agent ID and secret using regex
      const idMatch = envContent.match(/SPLIT_AGENT_ID=([a-f0-9-]+)/);
      const secretMatch = envContent.match(/SPLIT_AGENT_SECRET=([a-f0-9]+)/);
      
      if (idMatch && idMatch[1]) {
        agentId = idMatch[1];
      }
      
      if (secretMatch && secretMatch[1]) {
        agentSecret = secretMatch[1];
      }
    }
  }
  
  if (!agentId || !agentSecret) {
    throw new Error('Could not find agent credentials. Please make sure you entered the credentials from the Split dashboard correctly.');
  }
  
  // Determine the webhook endpoint based on router type
  const webhookEndpoint = '/api/split-agent';
  
  try {
    // Register with Split backend
    const response = await fetch('https://api.split.run/sites/connect', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        domain: options.domain,
        webhook_url: `https://${options.domain}${webhookEndpoint}`,
        agent_id: agentId,
        agent_secret_truncated: agentSecret.substring(0, 8), // Only send first 8 chars for verification
        content_path: options.contentPath,
        has_blog: options.hasBlog,
        uses_tailwind: options.usesTailwind,
        uses_app_router: options.usesAppRouter,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to register site: ${response.status} ${errorText}`);
    }
    
    const data = await response.json();
    
    if (data.success) {
      console.log(chalk.green(`Site registered successfully with Split!`));
      console.log(chalk.dim(`Site ID: ${data.site_id}`));
      
      // Save the site ID to .env.local
      if (data.site_id) {
        const envPath = path.join(projectDir, '.env.local');
        let envContent = await fs.readFile(envPath, 'utf8');
        envContent += `\nSPLIT_SITE_ID=${data.site_id}`;
        await fs.writeFile(envPath, envContent);
      }
    } else {
      console.log(chalk.yellow(`Site registration response: ${data.message || 'Unknown error'}`));
    }
  } catch (error) {
    console.error(chalk.yellow('Could not connect to Split backend. Your local setup is complete, but remote registration failed.'));
    console.error(chalk.dim('This could be due to:'));
    console.error(chalk.dim('- Network connectivity issues'));
    console.error(chalk.dim('- Split API being temporarily unavailable'));
    console.error(chalk.dim('- Invalid domain name format'));
    console.error(chalk.dim(`Technical details: ${error instanceof Error ? error.message : String(error)}`));
    
    console.log(chalk.cyan('\nYou can manually register your site later at https://app.split.run'));
  }
} 