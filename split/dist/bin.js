#!/usr/bin/env node
"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Suppress punycode deprecation warning
process.removeAllListeners('warning');
const commander_1 = require("commander");
const chalk_1 = __importDefault(require("chalk"));
const index_1 = require("./index");
// CLI configuration
const program = new commander_1.Command();
program
    .name('create-split')
    .description('Connect your Next.js site to Split AI content delivery system')
    .version('0.1.0')
    .action(async () => {
    console.log(chalk_1.default.bold.cyan('\n🔀 Welcome to Split - AI Content Delivery for Next.js\n'));
    try {
        await (0, index_1.runCLI)();
        console.log(chalk_1.default.green('\n✅ Setup completed successfully!\n'));
        console.log(chalk_1.default.cyan('Your Next.js site is now connected to Split.'));
        console.log(chalk_1.default.cyan('Visit https://split.dev to manage your content strategy and'));
        console.log(chalk_1.default.cyan('monitor AI-generated content delivery to your site.'));
    }
    catch (error) {
        // Handle specific errors
        if (typeof error === 'object' && error !== null && 'message' in error &&
            typeof error.message === 'string' && error.message.includes('credentials')) {
            console.error(chalk_1.default.red('\n❌ Setup failed: Invalid credentials'));
            console.error(chalk_1.default.yellow('Please ensure you have valid credentials from the Split dashboard'));
            console.error(chalk_1.default.yellow('Sign up or log in at https://split.dev to get your credentials'));
        }
        else {
            console.error(chalk_1.default.red('\n❌ Setup failed:'), error);
        }
        process.exit(1);
    }
});
program.parse(process.argv);
