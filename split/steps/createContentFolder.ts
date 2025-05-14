import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { CLIOptions } from '../index';
import { writeFileSafe } from '../utils/writeFileSafe';

/**
 * Create the content folder for Split-generated content
 */
export async function createContentFolder(options: CLIOptions): Promise<void> {
  const projectDir = process.cwd();
  const contentPath = path.join(projectDir, options.contentPath);
  
  // Create the content directory
  await fs.ensureDir(contentPath);
  
  // Create a sample MDX file to demonstrate the format
  const sampleMdxPath = path.join(contentPath, 'example-post.mdx');
  const sampleMdxContent = await fs.readFile(
    path.join(__dirname, '../templates/example-post.mdx'),
    'utf8'
  );
  
  await writeFileSafe(sampleMdxPath, sampleMdxContent);
  
  console.log(chalk.green(`Content folder created at: ${options.contentPath}`));
  console.log(chalk.dim(`Sample MDX file added at: ${options.contentPath}/example-post.mdx`));
  
  // If user doesn't have a blog system, create one for them
  if (!options.hasBlog) {
    await createBlogRenderer(options);
  }
}

/**
 * Create a simple blog renderer for users without one
 */
async function createBlogRenderer(options: CLIOptions): Promise<void> {
  const projectDir = process.cwd();
  
  // Determine the blog renderer path based on router type
  let rendererPath: string;
  let layoutPath: string | null = null;
  
  if (options.usesAppRouter) {
    rendererPath = path.join(projectDir, 'app', 'blog', '[slug]', 'page.tsx');
    layoutPath = path.join(projectDir, 'app', 'blog', 'layout.tsx');
  } else {
    rendererPath = path.join(projectDir, 'pages', 'blog', '[slug].tsx');
  }
  
  // Read the appropriate renderer template
  const rendererTemplateName = options.usesTailwind
    ? options.usesAppRouter 
      ? 'blog-renderer-app-tailwind.tsx'
      : 'blog-renderer-pages-tailwind.tsx'
    : options.usesAppRouter
      ? 'blog-renderer-app.tsx'
      : 'blog-renderer-pages.tsx';
  
  const rendererTemplate = await fs.readFile(
    path.join(__dirname, '../templates', rendererTemplateName),
    'utf8'
  );
  
  // Ensure the blog directory exists
  await fs.ensureDir(path.dirname(rendererPath));
  
  // Write the renderer file
  await writeFileSafe(rendererPath, rendererTemplate);
  
  // If using App Router, also create a layout file
  if (layoutPath) {
    const layoutTemplateName = options.usesTailwind
      ? 'blog-layout-tailwind.tsx'
      : 'blog-layout.tsx';
    
    const layoutTemplate = await fs.readFile(
      path.join(__dirname, '../templates', layoutTemplateName),
      'utf8'
    );
    
    await writeFileSafe(layoutPath, layoutTemplate);
  }
  
  console.log(chalk.green('Created a basic blog renderer for your content'));
  
  // Create styles if needed
  if (!options.usesTailwind) {
    await createBasicStyles(options);
  }
}

/**
 * Create basic CSS styles for non-Tailwind projects
 */
async function createBasicStyles(options: CLIOptions): Promise<void> {
  const projectDir = process.cwd();
  let stylesPath: string;
  
  if (options.usesAppRouter) {
    stylesPath = path.join(projectDir, 'app', 'blog', 'blog.css');
  } else {
    stylesPath = path.join(projectDir, 'styles', 'blog.css');
    // Ensure styles directory exists for Pages Router
    await fs.ensureDir(path.join(projectDir, 'styles'));
  }
  
  const stylesTemplate = await fs.readFile(
    path.join(__dirname, '../templates', 'blog.css'),
    'utf8'
  );
  
  await writeFileSafe(stylesPath, stylesTemplate);
  
  console.log(chalk.dim('Added basic CSS styles for the blog'));
} 