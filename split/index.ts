import chalk from 'chalk';
import ora from 'ora';
import { promptUser } from './steps/promptUser';
import { installWebhook } from './steps/installWebhook';
import { createContentFolder } from './steps/createContentFolder';
import { updateSitemap } from './steps/updateSitemap';
import { updateLlmsTxt } from './steps/updateLlmsTxt';
import { registerSite } from './steps/registerSite';

export interface CLIOptions {
  hasBlog: boolean;
  contentPath: string;
  usesTailwind: boolean;
  usesAppRouter: boolean;
  domain: string;
  agentId?: string;
  agentSecret?: string;
}

export async function runCLI(): Promise<void> {
  console.log(chalk.cyan('Setting up Split for your Next.js site...\n'));
  
  // Step 1: Get user inputs
  const spinner = ora('Gathering information...').start();
  const options = await promptUser();
  spinner.succeed('Information gathered');
  
  // Step 2: Install webhook endpoint
  spinner.text = 'Installing webhook endpoint...';
  spinner.start();
  await installWebhook(options);
  spinner.succeed('Webhook endpoint installed');
  
  // Step 3: Create content folder
  spinner.text = 'Setting up content folder...';
  spinner.start();
  await createContentFolder(options);
  spinner.succeed('Content folder created');
  
  // Step 4: Update sitemap.xml
  spinner.text = 'Updating sitemap.xml...';
  spinner.start();
  await updateSitemap(options);
  spinner.succeed('Sitemap.xml updated');
  
  // Step 5: Update llms.txt
  spinner.text = 'Setting up LLM crawler support...';
  spinner.start();
  await updateLlmsTxt(options);
  spinner.succeed('LLM crawler support configured');
  
  // Step 6: Register site with Split backend
  spinner.text = 'Registering your site with Split...';
  spinner.start();
  await registerSite(options);
  spinner.succeed('Site registered successfully');
  
  console.log(chalk.bold.green('\nYour site is now connected to Split!'));
} 