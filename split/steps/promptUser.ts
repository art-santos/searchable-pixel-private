import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import ora from 'ora';
import { CLIOptions } from '../index';

/**
 * Prompt the user for configuration options
 */
export async function promptUser(): Promise<CLIOptions> {
  console.log(chalk.cyan('\n🔀 Split: CLI for AEO for Next.js\n'));
  console.log(chalk.cyan('This CLI will configure your Next.js site for automated content delivery and AEO structure management'));
  console.log(chalk.cyan('Before proceeding, make sure you have:'));
  console.log(chalk.cyan('1. Created an account at https://split.dev'));
  console.log(chalk.cyan('2. Generated Split agent credentials from your dashboard'));
  console.log(chalk.cyan('3. Have your agent ID and client secret ready\n'));
  
  // Confirm user has signed up and has credentials
  const { hasAccount } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'hasAccount',
      message: 'Have you created a Split account and obtained your credentials?',
      default: false,
    },
  ]);
  
  if (!hasAccount) {
    console.log(chalk.yellow('\nPlease sign up at https://split.dev to get your credentials first.'));
    console.log(chalk.yellow('Run this CLI again after you have created an account and obtained your credentials.'));
    process.exit(0);
  }
  
  console.log(chalk.cyan('\nWe need some information about your Next.js project:'));
  
  // Show a spinner during detection
  const spinner = ora('Analyzing project structure...').start();
  
  // Detect project structure
  const projectDir = process.cwd();
  console.log(chalk.dim(`DEBUG: Current directory: ${projectDir}`));
  
  try {
    // Set timeout for detection (10 seconds max)
    const timeout = setTimeout(() => {
      spinner.fail('Project analysis timed out - continuing with defaults');
      console.log(chalk.yellow('Detection took too long. Using default configuration.'));
    }, 10000);
    
    // Detect project structure
    spinner.text = 'Checking for App Router...';
    const hasAppRouter = await fs.pathExists(path.join(projectDir, 'app'));
    console.log(chalk.dim(`DEBUG: App Router check completed: ${hasAppRouter}`));
    
    spinner.text = 'Checking for Pages Router...';
    const hasPagesRouter = await fs.pathExists(path.join(projectDir, 'pages'));
    console.log(chalk.dim(`DEBUG: Pages Router check completed: ${hasPagesRouter}`));
    
    spinner.text = 'Detecting Tailwind CSS...';
    const hasTailwind = await detectTailwind(projectDir);
    console.log(chalk.dim(`DEBUG: Tailwind check completed: ${hasTailwind}`));
    
    spinner.text = 'Looking for blog system...';
    const hasBlogSystem = await detectBlogSystem(projectDir);
    console.log(chalk.dim(`DEBUG: Blog system check completed: ${hasBlogSystem}`));
    
    // Clear the timeout as detection completed successfully
    clearTimeout(timeout);
    
    // Complete the spinner
    spinner.succeed('Project analysis complete');
    
    // Show detected values
    console.log(chalk.dim('Detected configuration:'));
    console.log(chalk.dim(`- App Router: ${hasAppRouter ? '✅' : '❌'}`));
    console.log(chalk.dim(`- Pages Router: ${hasPagesRouter ? '✅' : '❌'}`));
    console.log(chalk.dim(`- Tailwind CSS: ${hasTailwind ? '✅' : '❌'}`));
    console.log(chalk.dim(`- Blog System: ${hasBlogSystem ? '✅' : '❌'}`));
    console.log(''); // Empty line
    
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'hasBlog',
        message: 'Do you already have a blog system set up?',
        default: hasBlogSystem,
      },
      {
        type: 'input',
        name: 'contentPath',
        message: 'Where should we store AI-generated content?',
        default: '/content/split',
      },
      {
        type: 'confirm',
        name: 'usesTailwind',
        message: 'Are you using Tailwind CSS?',
        default: hasTailwind,
      },
      {
        type: 'list',
        name: 'routerType',
        message: 'Which router are you using?',
        choices: [
          { name: 'App Router (app directory)', value: 'app' },
          { name: 'Pages Router (pages directory)', value: 'pages' },
        ],
        default: hasAppRouter ? 'app' : 'pages',
      },
      {
        type: 'input',
        name: 'domain',
        message: 'What is your production domain (e.g., example.com)?',
        validate: (input: string) => {
          const valid = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(input);
          return valid ? true : 'Please enter a valid domain name (e.g., example.com)';
        },
      },
    ]);
    
    return {
      hasBlog: answers.hasBlog,
      contentPath: answers.contentPath.startsWith('/')
        ? answers.contentPath.slice(1) // Remove leading slash
        : answers.contentPath,
      usesTailwind: answers.usesTailwind,
      usesAppRouter: answers.routerType === 'app',
      domain: answers.domain,
    };
  } catch (error) {
    spinner.fail('Project analysis failed');
    console.error(chalk.red('Error during project analysis:'), error);
    
    // Fall back to manual configuration
    console.log(chalk.yellow('Using manual configuration instead.'));
    
    const answers = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'hasBlog',
        message: 'Do you already have a blog system set up?',
        default: false,
      },
      {
        type: 'input',
        name: 'contentPath',
        message: 'Where should we store AI-generated content?',
        default: '/content/split',
      },
      {
        type: 'confirm',
        name: 'usesTailwind',
        message: 'Are you using Tailwind CSS?',
        default: false,
      },
      {
        type: 'list',
        name: 'routerType',
        message: 'Which router are you using?',
        choices: [
          { name: 'App Router (app directory)', value: 'app' },
          { name: 'Pages Router (pages directory)', value: 'pages' },
        ],
        default: 'app',
      },
      {
        type: 'input',
        name: 'domain',
        message: 'What is your production domain (e.g., example.com)?',
        validate: (input: string) => {
          const valid = /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(input);
          return valid ? true : 'Please enter a valid domain name (e.g., example.com)';
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
}

/**
 * Detect if the project uses Tailwind CSS
 */
async function detectTailwind(projectDir: string): Promise<boolean> {
  try {
    // Check for tailwind.config.js or tailwind.config.ts
    const hasTailwindConfig =
      await fs.pathExists(path.join(projectDir, 'tailwind.config.js')) ||
      await fs.pathExists(path.join(projectDir, 'tailwind.config.ts'));
    
    // If we already found a config file, return true without checking package.json
    if (hasTailwindConfig) return true;
    
    // Check package.json for tailwindcss dependency
    const packageJsonPath = path.join(projectDir, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      try {
        const packageJson = await fs.readJson(packageJsonPath);
        const hasTailwindDep =
          (packageJson.dependencies && packageJson.dependencies.tailwindcss) ||
          (packageJson.devDependencies && packageJson.devDependencies.tailwindcss);
        
        return hasTailwindDep;
      } catch (err) {
        // If we can't parse package.json, just continue
        console.error(chalk.dim('Error parsing package.json:'), err);
      }
    }
    
    return false;
  } catch (error) {
    console.error(chalk.dim('Error detecting Tailwind CSS:'), error);
    return false;
  }
}

/**
 * Detect if the project has a blog system
 */
async function detectBlogSystem(projectDir: string): Promise<boolean> {
  try {
    // Check for common blog page patterns, breaking early if found
    const blogPatterns = [
      'pages/blog',
      'pages/blog/[slug].tsx',
      'pages/blog/[slug].jsx',
      'pages/blog/[slug].ts',
      'pages/blog/[slug].js',
      'app/blog',
      'app/blog/[slug]/page.tsx',
      'app/blog/[slug]/page.jsx',
      'app/blog/[slug]/page.ts',
      'app/blog/[slug]/page.js',
    ];
    
    // Check each pattern, but return immediately if we find a match
    for (const pattern of blogPatterns) {
      const exists = await fs.pathExists(path.join(projectDir, pattern));
      if (exists) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(chalk.dim('Error detecting blog system:'), error);
    return false;
  }
} 