#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import { runCLI } from './index';

// CLI configuration
const program = new Command();

program
  .name('create-split')
  .description('Connect your Next.js site to Split AI content delivery system')
  .version('0.1.0')
  .action(async () => {
    console.log(chalk.bold.cyan('\n🔀 Welcome to Split - AI Content Delivery for Next.js\n'));
    
    try {
      await runCLI();
      console.log(chalk.green('\n✅ Setup completed successfully!\n'));
      console.log(chalk.cyan('Your Next.js site is now connected to Split.'));
      console.log(chalk.cyan('Visit https://app.split.run to manage your content strategy and'));
      console.log(chalk.cyan('monitor AI-generated content delivery to your site.'));
    } catch (error: unknown) {
      // Handle specific errors
      if (typeof error === 'object' && error !== null && 'message' in error && 
          typeof error.message === 'string' && error.message.includes('credentials')) {
        console.error(chalk.red('\n❌ Setup failed: Invalid credentials'));
        console.error(chalk.yellow('Please ensure you have valid credentials from the Split dashboard'));
        console.error(chalk.yellow('Sign up or log in at https://app.split.run to get your credentials'));
      } else {
        console.error(chalk.red('\n❌ Setup failed:'), error);
      }
      process.exit(1);
    }
  });

program.parse(process.argv); 