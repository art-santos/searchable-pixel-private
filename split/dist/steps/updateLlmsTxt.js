"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateLlmsTxt = updateLlmsTxt;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const writeFileSafe_1 = require("../utils/writeFileSafe");
/**
 * Create or update the llms.txt file for LLM crawlers
 */
async function updateLlmsTxt(options) {
    const projectDir = process.cwd();
    const publicDir = path_1.default.join(projectDir, 'public');
    const llmsPath = path_1.default.join(publicDir, 'llms.txt');
    // Ensure public directory exists
    await fs_extra_1.default.ensureDir(publicDir);
    // Check if llms.txt already exists
    const llmsExists = await fs_extra_1.default.pathExists(llmsPath);
    if (llmsExists) {
        // Update existing llms.txt with a comment for Split integration
        let llmsContent = await fs_extra_1.default.readFile(llmsPath, 'utf8');
        // Add comment to the file if not already present
        if (!llmsContent.includes('# Split AI content')) {
            llmsContent += `
# Split AI content pages
# These pages are automatically added by the Split agent webhook
`;
            await (0, writeFileSafe_1.writeFileSafe)(llmsPath, llmsContent);
            console.log(chalk_1.default.green('Updated existing llms.txt with Split integration'));
        }
        else {
            console.log(chalk_1.default.dim('llms.txt already contains Split integration'));
        }
    }
    else {
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
        await (0, writeFileSafe_1.writeFileSafe)(llmsPath, llmsContent);
        console.log(chalk_1.default.green('Created new llms.txt with Split integration'));
    }
    // Add meta tag to notify about llms.txt
    await addLlmsMetaTag(options);
}
/**
 * Add meta tag for llms.txt to relevant layout files
 */
async function addLlmsMetaTag(options) {
    const projectDir = process.cwd();
    let layoutPaths = [];
    if (options.usesAppRouter) {
        // For App Router, check layout.js/ts/jsx/tsx
        const extensions = ['tsx', 'jsx', 'ts', 'js'];
        for (const ext of extensions) {
            layoutPaths.push(path_1.default.join(projectDir, 'app', `layout.${ext}`));
        }
    }
    else {
        // For Pages Router, check _document.js/ts/jsx/tsx or _app.js/ts/jsx/tsx
        const fileNames = ['_document', '_app'];
        const extensions = ['tsx', 'jsx', 'ts', 'js'];
        for (const name of fileNames) {
            for (const ext of extensions) {
                layoutPaths.push(path_1.default.join(projectDir, 'pages', `${name}.${ext}`));
            }
        }
    }
    // Find the first layout file that exists
    for (const layoutPath of layoutPaths) {
        if (await fs_extra_1.default.pathExists(layoutPath)) {
            let content = await fs_extra_1.default.readFile(layoutPath, 'utf8');
            // Check if meta tag already exists
            if (!content.includes('llms.txt') && !content.includes('LLMS.txt')) {
                // Try to find the <head> section
                if (content.includes('<head>')) {
                    content = content.replace('<head>', `<head>
        {/* Split: LLM crawler support */}
        <link rel="llms-txt" href="/llms.txt" />`);
                    await (0, writeFileSafe_1.writeFileSafe)(layoutPath, content);
                    console.log(chalk_1.default.green(`Added LLMs meta tag to ${path_1.default.basename(layoutPath)}`));
                    return;
                }
            }
            else {
                console.log(chalk_1.default.dim('LLMs meta tag already exists in layout file'));
                return;
            }
        }
    }
    console.log(chalk_1.default.yellow('Could not locate layout file to add LLMs meta tag'));
    console.log(chalk_1.default.dim('Please manually add: <link rel="llms-txt" href="/llms.txt" /> to your <head> section'));
}
