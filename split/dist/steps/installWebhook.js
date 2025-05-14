"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.installWebhook = installWebhook;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const inquirer_1 = __importDefault(require("inquirer"));
const writeFileSafe_1 = require("../utils/writeFileSafe");
/**
 * Install the webhook endpoint in the user's Next.js project
 */
async function installWebhook(options) {
    const projectDir = process.cwd();
    console.log(chalk_1.default.cyan('\nSplit credentials are required to connect your site to the Split AI content delivery system.'));
    console.log(chalk_1.default.cyan('These credentials can be obtained from your Split dashboard at https://split.dev\n'));
    // Get credentials from user
    const credentials = await inquirer_1.default.prompt([
        {
            type: 'input',
            name: 'agentId',
            message: 'Enter your SPLIT_AGENT_ID from the dashboard:',
            validate: (input) => {
                // Simple validation for UUID format
                return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(input)
                    ? true
                    : 'Please enter a valid agent ID (UUID format)';
            },
        },
        {
            type: 'password',
            name: 'agentSecret',
            message: 'Enter your SPLIT_AGENT_SECRET from the dashboard:',
            validate: (input) => {
                return input.length >= 32
                    ? true
                    : 'Agent secret should be at least 32 characters long';
            },
        },
    ]);
    const agentId = credentials.agentId;
    const agentSecret = credentials.agentSecret;
    console.log(chalk_1.default.green('✅ Credentials accepted'));
    // Update or create .env.local with the secrets
    await updateEnvFile(projectDir, {
        SPLIT_AGENT_ID: agentId,
        SPLIT_AGENT_SECRET: agentSecret,
    });
    // Determine webhook file path based on router type
    let webhookPath;
    let webhookEndpoint;
    if (options.usesAppRouter) {
        webhookPath = path_1.default.join(projectDir, 'app', 'api', 'split-agent', 'route.ts');
        webhookEndpoint = '/api/split-agent';
    }
    else {
        webhookPath = path_1.default.join(projectDir, 'pages', 'api', 'split-agent.ts');
        webhookEndpoint = '/api/split-agent';
    }
    // Get the appropriate webhook template
    const webhookTemplate = options.usesAppRouter
        ? await fs_extra_1.default.readFile(path_1.default.join(__dirname, '../templates/split-agent-app.ts'), 'utf8')
        : await fs_extra_1.default.readFile(path_1.default.join(__dirname, '../templates/split-agent-pages.ts'), 'utf8');
    // Write the webhook file
    await (0, writeFileSafe_1.writeFileSafe)(webhookPath, webhookTemplate);
    console.log(chalk_1.default.green(`Webhook endpoint installed at: ${webhookEndpoint}`));
    console.log(chalk_1.default.dim('This endpoint will receive content from the Split AI agent.'));
}
/**
 * Update or create .env.local with Split agent credentials
 */
async function updateEnvFile(projectDir, envVars) {
    const envPath = path_1.default.join(projectDir, '.env.local');
    let envContent = '';
    // Read existing .env.local if it exists
    if (await fs_extra_1.default.pathExists(envPath)) {
        envContent = await fs_extra_1.default.readFile(envPath, 'utf8');
    }
    // Add or update environment variables
    for (const [key, value] of Object.entries(envVars)) {
        // Check if var already exists
        const regex = new RegExp(`^${key}=.*`, 'm');
        if (regex.test(envContent)) {
            // Update existing variable
            envContent = envContent.replace(regex, `${key}=${value}`);
        }
        else {
            // Add new variable
            envContent += `\n${key}=${value}`;
        }
    }
    // Write updated .env.local
    await (0, writeFileSafe_1.writeFileSafe)(envPath, envContent.trim());
    console.log(chalk_1.default.dim('Updated .env.local with Split agent credentials'));
}
