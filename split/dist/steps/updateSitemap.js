"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateSitemap = updateSitemap;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const writeFileSafe_1 = require("../utils/writeFileSafe");
/**
 * Create or update the sitemap.xml file
 */
async function updateSitemap(options) {
    const projectDir = process.cwd();
    const publicDir = path_1.default.join(projectDir, 'public');
    const sitemapPath = path_1.default.join(publicDir, 'sitemap.xml');
    // Ensure public directory exists
    await fs_extra_1.default.ensureDir(publicDir);
    // Check if sitemap already exists
    const sitemapExists = await fs_extra_1.default.pathExists(sitemapPath);
    if (sitemapExists) {
        // Update existing sitemap with a comment for Split integration
        let sitemapContent = await fs_extra_1.default.readFile(sitemapPath, 'utf8');
        // Add a comment before the closing </urlset> if it exists
        if (sitemapContent.includes('</urlset>')) {
            sitemapContent = sitemapContent.replace('</urlset>', `  <!-- Split AI content will be automatically added to this sitemap -->
</urlset>`);
            await (0, writeFileSafe_1.writeFileSafe)(sitemapPath, sitemapContent);
            console.log(chalk_1.default.green('Updated existing sitemap.xml with Split integration'));
        }
        else {
            console.log(chalk_1.default.yellow('Existing sitemap.xml has unexpected format, skipping update'));
        }
    }
    else {
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
        await (0, writeFileSafe_1.writeFileSafe)(sitemapPath, sitemapContent);
        console.log(chalk_1.default.green('Created new sitemap.xml with Split integration'));
    }
    // Additionally, for Next.js App Router, modify the sitemap route if it exists
    if (options.usesAppRouter) {
        await updateAppRouterSitemap(projectDir);
    }
}
/**
 * Update or create App Router sitemap generation
 */
async function updateAppRouterSitemap(projectDir) {
    // Check for common App Router sitemap file locations
    const possiblePaths = [
        path_1.default.join(projectDir, 'app', 'sitemap.ts'),
        path_1.default.join(projectDir, 'app', 'sitemap.js'),
        path_1.default.join(projectDir, 'app', 'sitemap.tsx'),
        path_1.default.join(projectDir, 'app', 'sitemap.jsx'),
    ];
    for (const filePath of possiblePaths) {
        if (await fs_extra_1.default.pathExists(filePath)) {
            let content = await fs_extra_1.default.readFile(filePath, 'utf8');
            // Look for exports array in the file
            if (content.includes('export default') && !content.includes('// Split integration')) {
                // Add a comment about Split integration
                content += `

// Split integration: Content URLs will be automatically added to sitemap via /public/sitemap.xml
// This is handled by the Split agent webhook, see /api/split-agent for details
`;
                await (0, writeFileSafe_1.writeFileSafe)(filePath, content);
                console.log(chalk_1.default.dim('Added Split note to App Router sitemap configuration'));
            }
            return; // Found and updated a file, so exit
        }
    }
    // No existing sitemap files found, no need to do anything
}
