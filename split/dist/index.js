"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.runCLI = runCLI;
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const promptUser_1 = require("./steps/promptUser");
const installWebhook_1 = require("./steps/installWebhook");
const createContentFolder_1 = require("./steps/createContentFolder");
const updateSitemap_1 = require("./steps/updateSitemap");
const updateLlmsTxt_1 = require("./steps/updateLlmsTxt");
const registerSite_1 = require("./steps/registerSite");
async function runCLI() {
    console.log(chalk_1.default.cyan('Setting up Split for your Next.js site...\n'));
    // Step 1: Get user inputs
    const spinner = (0, ora_1.default)('Gathering information...').start();
    const options = await (0, promptUser_1.promptUser)();
    spinner.succeed('Information gathered');
    // Step 2: Install webhook endpoint
    spinner.text = 'Installing webhook endpoint...';
    spinner.start();
    await (0, installWebhook_1.installWebhook)(options);
    spinner.succeed('Webhook endpoint installed');
    // Step 3: Create content folder
    spinner.text = 'Setting up content folder...';
    spinner.start();
    await (0, createContentFolder_1.createContentFolder)(options);
    spinner.succeed('Content folder created');
    // Step 4: Update sitemap.xml
    spinner.text = 'Updating sitemap.xml...';
    spinner.start();
    await (0, updateSitemap_1.updateSitemap)(options);
    spinner.succeed('Sitemap.xml updated');
    // Step 5: Update llms.txt
    spinner.text = 'Setting up LLM crawler support...';
    spinner.start();
    await (0, updateLlmsTxt_1.updateLlmsTxt)(options);
    spinner.succeed('LLM crawler support configured');
    // Step 6: Register site with Split backend
    spinner.text = 'Registering your site with Split...';
    spinner.start();
    await (0, registerSite_1.registerSite)(options);
    spinner.succeed('Site registered successfully');
    console.log(chalk_1.default.bold.green('\nYour site is now connected to Split!'));
}
