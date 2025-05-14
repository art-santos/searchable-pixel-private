"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSite = registerSite;
const node_fetch_1 = __importDefault(require("node-fetch"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * Register the site with Split backend
 */
async function registerSite(options) {
    const projectDir = process.cwd();
    let agentId = options.agentId || '';
    let agentSecret = options.agentSecret || '';
    // If agent credentials aren't in options, read from .env.local
    if (!agentId || !agentSecret) {
        const envPath = path_1.default.join(projectDir, '.env.local');
        if (await fs_extra_1.default.pathExists(envPath)) {
            const envContent = await fs_extra_1.default.readFile(envPath, 'utf8');
            // Extract the agent ID and secret using regex
            const idMatch = envContent.match(/SPLIT_AGENT_ID=([a-f0-9-]+)/);
            const secretMatch = envContent.match(/SPLIT_AGENT_SECRET=([a-f0-9]+)/);
            if (idMatch && idMatch[1]) {
                agentId = idMatch[1];
            }
            if (secretMatch && secretMatch[1]) {
                agentSecret = secretMatch[1];
            }
        }
    }
    if (!agentId || !agentSecret) {
        throw new Error('Could not find agent credentials. Please make sure you entered the credentials from the Split dashboard correctly.');
    }
    // Determine the webhook endpoint based on router type
    const webhookEndpoint = '/api/split-agent';
    try {
        // Register with Split backend
        const response = await (0, node_fetch_1.default)('https://api.split.run/sites/connect', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                domain: options.domain,
                webhook_url: `https://${options.domain}${webhookEndpoint}`,
                agent_id: agentId,
                agent_secret_truncated: agentSecret.substring(0, 8), // Only send first 8 chars for verification
                content_path: options.contentPath,
                has_blog: options.hasBlog,
                uses_tailwind: options.usesTailwind,
                uses_app_router: options.usesAppRouter,
            }),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to register site: ${response.status} ${errorText}`);
        }
        const data = await response.json();
        if (data.success) {
            console.log(chalk_1.default.green(`Site registered successfully with Split!`));
            console.log(chalk_1.default.dim(`Site ID: ${data.site_id}`));
            // Save the site ID to .env.local
            if (data.site_id) {
                const envPath = path_1.default.join(projectDir, '.env.local');
                let envContent = await fs_extra_1.default.readFile(envPath, 'utf8');
                envContent += `\nSPLIT_SITE_ID=${data.site_id}`;
                await fs_extra_1.default.writeFile(envPath, envContent);
            }
        }
        else {
            console.log(chalk_1.default.yellow(`Site registration response: ${data.message || 'Unknown error'}`));
        }
    }
    catch (error) {
        console.error(chalk_1.default.yellow('Could not connect to Split backend. Your local setup is complete, but remote registration failed.'));
        console.error(chalk_1.default.dim('This could be due to:'));
        console.error(chalk_1.default.dim('- Network connectivity issues'));
        console.error(chalk_1.default.dim('- Split API being temporarily unavailable'));
        console.error(chalk_1.default.dim('- Invalid domain name format'));
        console.error(chalk_1.default.dim(`Technical details: ${error instanceof Error ? error.message : String(error)}`));
        console.log(chalk_1.default.cyan('\nYou can manually register your site later at https://split.dev'));
    }
}
