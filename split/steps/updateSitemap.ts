import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { CLIOptions } from '../index';
import { writeFileSafe } from '../utils/writeFileSafe';

/**
 * Create or update the sitemap.xml file
 */
export async function updateSitemap(options: CLIOptions): Promise<void> {
  const projectDir = process.cwd();
  const publicDir = path.join(projectDir, 'public');
  const sitemapPath = path.join(publicDir, 'sitemap.xml');
  
  // Ensure public directory exists
  await fs.ensureDir(publicDir);
  
  // Check if sitemap already exists
  const sitemapExists = await fs.pathExists(sitemapPath);
  
  if (sitemapExists) {
    // Update existing sitemap with a comment for Split integration
    let sitemapContent = await fs.readFile(sitemapPath, 'utf8');
    
    // Add a comment before the closing </urlset> if it exists
    if (sitemapContent.includes('</urlset>')) {
      sitemapContent = sitemapContent.replace(
        '</urlset>',
        `  <!-- Split AI content will be automatically added to this sitemap -->
</urlset>`
      );
      
      await writeFileSafe(sitemapPath, sitemapContent);
      console.log(chalk.green('Updated existing sitemap.xml with Split integration'));
    } else {
      console.log(chalk.yellow('Existing sitemap.xml has unexpected format, skipping update'));
    }
  } else {
    // Create a new sitemap.xml
    const domain = options.domain;
    const currentDate = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    
    const sitemapContent = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://${domain}/</loc>
    <lastmod>${currentDate}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  <!-- Split AI content will be automatically added to this sitemap -->
</urlset>`;
    
    await writeFileSafe(sitemapPath, sitemapContent);
    console.log(chalk.green('Created new sitemap.xml with Split integration'));
  }
  
  // Additionally, for Next.js App Router, modify the sitemap route if it exists
  if (options.usesAppRouter) {
    await updateAppRouterSitemap(projectDir);
  }
}

/**
 * Update or create App Router sitemap generation
 */
async function updateAppRouterSitemap(projectDir: string): Promise<void> {
  // Check for common App Router sitemap file locations
  const possiblePaths = [
    path.join(projectDir, 'app', 'sitemap.ts'),
    path.join(projectDir, 'app', 'sitemap.js'),
    path.join(projectDir, 'app', 'sitemap.tsx'),
    path.join(projectDir, 'app', 'sitemap.jsx'),
  ];
  
  for (const filePath of possiblePaths) {
    if (await fs.pathExists(filePath)) {
      let content = await fs.readFile(filePath, 'utf8');
      
      // Look for exports array in the file
      if (content.includes('export default') && !content.includes('// Split integration')) {
        // Add a comment about Split integration
        content += `

// Split integration: Content URLs will be automatically added to sitemap via /public/sitemap.xml
// This is handled by the Split agent webhook, see /api/split-agent for details
`;
        
        await writeFileSafe(filePath, content);
        console.log(chalk.dim('Added Split note to App Router sitemap configuration'));
      }
      
      return; // Found and updated a file, so exit
    }
  }
  
  // No existing sitemap files found, no need to do anything
} 