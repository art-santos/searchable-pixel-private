import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import inquirer from 'inquirer';
import { CLIOptions } from '../index';
import { writeFileSafe } from '../utils/writeFileSafe';

/**
 * Install the webhook endpoint in the user's Next.js project
 */
export async function installWebhook(options: CLIOptions): Promise<void> {
  const projectDir = process.cwd();
  
  console.log(chalk.cyan('\nSplit credentials are required to connect your site to the Split AI content delivery system.'));
  console.log(chalk.cyan('These credentials can be obtained from your Split dashboard at https://app.split.run\n'));
  
  // Get credentials from user
  const credentials = await inquirer.prompt([
    {
      type: 'input',
      name: 'agentId',
      message: 'Enter your SPLIT_AGENT_ID from the dashboard:',
      validate: (input: string) => {
        // Simple validation for UUID format
        return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input) 
          ? true 
          : 'Please enter a valid agent ID (UUID format)';
      },
    },
    {
      type: 'password',
      name: 'agentSecret',
      message: 'Enter your SPLIT_AGENT_SECRET from the dashboard:',
      validate: (input: string) => {
        return input.length >= 32 
          ? true 
          : 'Agent secret should be at least 32 characters long';
      },
    },
  ]);
  
  const agentId = credentials.agentId;
  const agentSecret = credentials.agentSecret;
  
  console.log(chalk.green('✅ Credentials accepted'));
  
  // Update or create .env.local with the secrets
  await updateEnvFile(projectDir, {
    SPLIT_AGENT_ID: agentId,
    SPLIT_AGENT_SECRET: agentSecret,
  });
  
  // Determine webhook file path based on router type
  let webhookPath: string;
  let webhookEndpoint: string;
  
  if (options.usesAppRouter) {
    webhookPath = path.join(projectDir, 'app', 'api', 'split-agent', 'route.ts');
    webhookEndpoint = '/api/split-agent';
  } else {
    webhookPath = path.join(projectDir, 'pages', 'api', 'split-agent.ts');
    webhookEndpoint = '/api/split-agent';
  }
  
  // Get the appropriate webhook template
  const webhookTemplate = options.usesAppRouter 
    ? await fs.readFile(path.join(__dirname, '../templates/split-agent-app.ts'), 'utf8')
    : await fs.readFile(path.join(__dirname, '../templates/split-agent-pages.ts'), 'utf8');
  
  // Write the webhook file
  await writeFileSafe(webhookPath, webhookTemplate);
  
  console.log(chalk.green(`Webhook endpoint installed at: ${webhookEndpoint}`));
  console.log(chalk.dim('This endpoint will receive content from the Split AI agent.'));
}

/**
 * Update or create .env.local with Split agent credentials
 */
async function updateEnvFile(
  projectDir: string, 
  envVars: Record<string, string>
): Promise<void> {
  const envPath = path.join(projectDir, '.env.local');
  let envContent = '';
  
  // Read existing .env.local if it exists
  if (await fs.pathExists(envPath)) {
    envContent = await fs.readFile(envPath, 'utf8');
  }
  
  // Add or update environment variables
  for (const [key, value] of Object.entries(envVars)) {
    // Check if var already exists
    const regex = new RegExp(`^${key}=.*`, 'm');
    if (regex.test(envContent)) {
      // Update existing variable
      envContent = envContent.replace(regex, `${key}=${value}`);
    } else {
      // Add new variable
      envContent += `\n${key}=${value}`;
    }
  }
  
  // Write updated .env.local
  await writeFileSafe(envPath, envContent.trim());
  
  console.log(chalk.dim('Updated .env.local with Split agent credentials'));
} 