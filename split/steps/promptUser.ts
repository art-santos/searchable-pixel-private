import inquirer from 'inquirer';
import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
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
  
  // Detect project structure
  const projectDir = process.cwd();
  const hasAppRouter = await fs.pathExists(path.join(projectDir, 'app'));
  const hasPagesRouter = await fs.pathExists(path.join(projectDir, 'pages'));
  const hasTailwind = await detectTailwind(projectDir);
  const hasBlogSystem = await detectBlogSystem(projectDir);
  
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
    
    // Check package.json for tailwindcss dependency
    const packageJsonPath = path.join(projectDir, 'package.json');
    if (await fs.pathExists(packageJsonPath)) {
      const packageJson = await fs.readJson(packageJsonPath);
      const hasTailwindDep =
        (packageJson.dependencies && packageJson.dependencies.tailwindcss) ||
        (packageJson.devDependencies && packageJson.devDependencies.tailwindcss);
      
      return hasTailwindConfig || hasTailwindDep;
    }
    
    return hasTailwindConfig;
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
    // Check for common blog page patterns
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
    
    for (const pattern of blogPatterns) {
      if (await fs.pathExists(path.join(projectDir, pattern))) {
        return true;
      }
    }
    
    return false;
  } catch (error) {
    console.error(chalk.dim('Error detecting blog system:'), error);
    return false;
  }
} 