import chalk from 'chalk';
import { installWebhook } from './steps/installWebhook';
import { createContentFolder } from './steps/createContentFolder';
import { updateSitemap } from './steps/updateSitemap';
import { updateLlmsTxt } from './steps/updateLlmsTxt';
import { registerSite } from './steps/registerSite';
import inquirer from 'inquirer';

export interface CLIOptions {
  domain: string;
  contentPath: string;
  hasBlog: boolean;
  usesTailwind: boolean;
  usesAppRouter: boolean;
  agentId?: string;
  agentSecret?: string;
  verifyWebhook?: boolean;
}

/**
 * Get basic project configuration
 */
async function getConfig(): Promise<CLIOptions> {
  const answers = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'hasBlog',
      message: 'Do you have a blog?',
      default: false,
    },
    {
      type: 'input',
      name: 'contentPath',
      message: 'Content directory:',
      default: 'content/split',
    },
    {
      type: 'confirm',
      name: 'usesTailwind',
      message: 'Using Tailwind?',
      default: false,
    },
    {
      type: 'list',
      name: 'routerType',
      message: 'Router type:',
      choices: [
        { name: 'App Router', value: 'app' },
        { name: 'Pages Router', value: 'pages' },
      ],
      default: 'app',
    },
    {
      type: 'input',
      name: 'domain',
      message: 'Production domain:',
      validate: (input: string) => {
        return /^[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)+$/.test(input)
          ? true
          : 'Enter valid domain (e.g. example.com)';
      },
    },
  ]);
  
  return {
    hasBlog: answers.hasBlog,
    contentPath: answers.contentPath.startsWith('/')
      ? answers.contentPath.slice(1)
      : answers.contentPath,
    usesTailwind: answers.usesTailwind,
    usesAppRouter: answers.routerType === 'app',
    domain: answers.domain,
  };
}

export async function runCLI(): Promise<void> {
  console.log('Setting up Split webhook for your Next.js site');
  
  try {
    // Get project config
    const options = await getConfig();
    
    // Install webhook
    try {
      await installWebhook(options);
    } catch (error) {
      console.error('Failed to install webhook:', error);
      process.exit(1);
    }
    
    // Create content folder
    try {
      await createContentFolder(options);
    } catch (error) {
      console.error('Warning: Could not create content folder:', error);
    }
    
    // Update sitemap
    try {
      await updateSitemap(options);
    } catch (error) {
      console.error('Warning: Could not update sitemap:', error);
    }
    
    // Update llms.txt
    try {
      await updateLlmsTxt(options);
    } catch (error) {
      console.error('Warning: Could not update llms.txt:', error);
    }
    
    // Register site
    try {
      await registerSite(options);
    } catch (error) {
      console.error('Warning: Could not register site:', error);
    }
    
    console.log('Setup complete!');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  }
} 