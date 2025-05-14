"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCLI = runCLI;
const installWebhook_1 = require("./steps/installWebhook");
const createContentFolder_1 = require("./steps/createContentFolder");
const updateSitemap_1 = require("./steps/updateSitemap");
const updateLlmsTxt_1 = require("./steps/updateLlmsTxt");
const registerSite_1 = require("./steps/registerSite");
const inquirer_1 = __importDefault(require("inquirer"));
/**
 * Get basic project configuration
 */
async function getConfig() {
    const answers = await inquirer_1.default.prompt([
        {
            type: 'confirm',
            name: 'hasBlog',
            message: 'Do you have a blog?',
            default: false,
        },
        {
            type: 'input',
            name: 'contentPath',
            message: 'Content directory:',
            default: 'content/split',
        },
        {
            type: 'confirm',
            name: 'usesTailwind',
            message: 'Using Tailwind?',
            default: false,
        },
        {
            type: 'list',
            name: 'routerType',
            message: 'Router type:',
            choices: [
                { name: 'App Router', value: 'app' },
                { name: 'Pages Router', value: 'pages' },
            ],
            default: 'app',
        },
        {
            type: 'input',
            name: 'domain',
            message: 'Production domain:',
            validate: (input) => {
                return /^[a-zA-Z0-9][a-zA-Z0-9-]{1,61}[a-zA-Z0-9](?:\.[a-zA-Z]{2,})+$/.test(input)
                    ? true
                    : 'Enter valid domain (e.g. example.com)';
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
async function runCLI() {
    console.log('Setting up Split webhook for your Next.js site');
    try {
        // Get project config
        const options = await getConfig();
        // Install webhook
        try {
            await (0, installWebhook_1.installWebhook)(options);
        }
        catch (error) {
            console.error('Failed to install webhook:', error);
            process.exit(1);
        }
        // Create content folder
        try {
            await (0, createContentFolder_1.createContentFolder)(options);
        }
        catch (error) {
            console.error('Warning: Could not create content folder');
        }
        // Update sitemap
        try {
            await (0, updateSitemap_1.updateSitemap)(options);
        }
        catch (error) {
            console.error('Warning: Could not update sitemap');
        }
        // Update llms.txt
        try {
            await (0, updateLlmsTxt_1.updateLlmsTxt)(options);
        }
        catch (error) {
            console.error('Warning: Could not update llms.txt');
        }
        // Register site
        try {
            await (0, registerSite_1.registerSite)(options);
        }
        catch (error) {
            console.error('Warning: Could not register site');
        }
        console.log('Setup complete!');
    }
    catch (error) {
        console.error('Setup failed:', error);
        process.exit(1);
    }
}
