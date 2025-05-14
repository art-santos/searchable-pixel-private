import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { CLIOptions } from '../index';
import { writeFileSafe } from '../utils/writeFileSafe';

/**
 * Create or update the llms.txt file for LLM crawlers
 */
export async function updateLlmsTxt(options: CLIOptions): Promise<void> {
  const projectDir = process.cwd();
  const publicDir = path.join(projectDir, 'public');
  const llmsPath = path.join(publicDir, 'llms.txt');
  
  // Ensure public directory exists
  await fs.ensureDir(publicDir);
  
  // Check if llms.txt already exists
  const llmsExists = await fs.pathExists(llmsPath);
  
  if (llmsExists) {
    // Update existing llms.txt with a comment for Split integration
    let llmsContent = await fs.readFile(llmsPath, 'utf8');
    
    // Add comment to the file if not already present
    if (!llmsContent.includes('# Split AI content')) {
      llmsContent += `
# Split AI content pages
# These pages are automatically added by the Split agent webhook
`;
      
      await writeFileSafe(llmsPath, llmsContent);
      console.log(chalk.green('Updated existing llms.txt with Split integration'));
    } else {
      console.log(chalk.dim('llms.txt already contains Split integration'));
    }
  } else {
    // Create a new llms.txt
    const domain = options.domain;
    const llmsContent = `# LLM crawler instructions for ${domain}
# This file tells LLMs which pages they are allowed to index for use in AI responses.

# Main pages
https://${domain}/
https://${domain}/about
https://${domain}/contact

# Split AI content pages
# These pages are automatically added by the Split agent webhook
`;
    
    await writeFileSafe(llmsPath, llmsContent);
    console.log(chalk.green('Created new llms.txt with Split integration'));
  }
  
  // Add meta tag to notify about llms.txt
  await addLlmsMetaTag(options);
}

/**
 * Add meta tag for llms.txt to relevant layout files
 */
async function addLlmsMetaTag(options: CLIOptions): Promise<void> {
  const projectDir = process.cwd();
  let layoutPaths: string[] = [];
  
  if (options.usesAppRouter) {
    // For App Router, check layout.js/ts/jsx/tsx
    const extensions = ['tsx', 'jsx', 'ts', 'js'];
    for (const ext of extensions) {
      layoutPaths.push(path.join(projectDir, 'app', `layout.${ext}`));
    }
  } else {
    // For Pages Router, check _document.js/ts/jsx/tsx or _app.js/ts/jsx/tsx
    const fileNames = ['_document', '_app'];
    const extensions = ['tsx', 'jsx', 'ts', 'js'];
    
    for (const name of fileNames) {
      for (const ext of extensions) {
        layoutPaths.push(path.join(projectDir, 'pages', `${name}.${ext}`));
      }
    }
  }
  
  // Find the first layout file that exists
  for (const layoutPath of layoutPaths) {
    if (await fs.pathExists(layoutPath)) {
      let content = await fs.readFile(layoutPath, 'utf8');
      
      // Check if meta tag already exists
      if (!content.includes('llms.txt') && !content.includes('LLMS.txt')) {
        // Try to find the <head> section
        if (content.includes('<head>')) {
          content = content.replace(
            '<head>',
            `<head>
        {/* Split: LLM crawler support */}
        <link rel="llms-txt" href="/llms.txt" />`
          );
          
          await writeFileSafe(layoutPath, content);
          console.log(chalk.green(`Added LLMs meta tag to ${path.basename(layoutPath)}`));
          return;
        }
      } else {
        console.log(chalk.dim('LLMs meta tag already exists in layout file'));
        return;
      }
    }
  }
  
  console.log(chalk.yellow('Could not locate layout file to add LLMs meta tag'));
  console.log(chalk.dim('Please manually add: <link rel="llms-txt" href="/llms.txt" /> to your <head> section'));
} 