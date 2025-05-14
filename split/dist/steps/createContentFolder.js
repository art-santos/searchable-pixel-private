"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createContentFolder = createContentFolder;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const writeFileSafe_1 = require("../utils/writeFileSafe");
/**
 * Create the content folder for Split-generated content
 */
async function createContentFolder(options) {
    const projectDir = process.cwd();
    const contentPath = path_1.default.join(projectDir, options.contentPath);
    // Create the content directory
    await fs_extra_1.default.ensureDir(contentPath);
    // Create a sample MDX file to demonstrate the format
    const sampleMdxPath = path_1.default.join(contentPath, 'example-post.mdx');
    const sampleMdxContent = await fs_extra_1.default.readFile(path_1.default.join(__dirname, '../templates/example-post.mdx'), 'utf8');
    await (0, writeFileSafe_1.writeFileSafe)(sampleMdxPath, sampleMdxContent);
    console.log(chalk_1.default.green(`Content folder created at: ${options.contentPath}`));
    console.log(chalk_1.default.dim(`Sample MDX file added at: ${options.contentPath}/example-post.mdx`));
    // If user doesn't have a blog system, create one for them
    if (!options.hasBlog) {
        await createBlogRenderer(options);
    }
}
/**
 * Create a simple blog renderer for users without one
 */
async function createBlogRenderer(options) {
    const projectDir = process.cwd();
    // Determine the blog renderer path based on router type
    let rendererPath;
    let layoutPath = null;
    if (options.usesAppRouter) {
        rendererPath = path_1.default.join(projectDir, 'app', 'blog', '[slug]', 'page.tsx');
        layoutPath = path_1.default.join(projectDir, 'app', 'blog', 'layout.tsx');
    }
    else {
        rendererPath = path_1.default.join(projectDir, 'pages', 'blog', '[slug].tsx');
    }
    // Read the appropriate renderer template
    const rendererTemplateName = options.usesTailwind
        ? options.usesAppRouter
            ? 'blog-renderer-app-tailwind.tsx'
            : 'blog-renderer-pages-tailwind.tsx'
        : options.usesAppRouter
            ? 'blog-renderer-app.tsx'
            : 'blog-renderer-pages.tsx';
    const rendererTemplate = await fs_extra_1.default.readFile(path_1.default.join(__dirname, '../templates', rendererTemplateName), 'utf8');
    // Ensure the blog directory exists
    await fs_extra_1.default.ensureDir(path_1.default.dirname(rendererPath));
    // Write the renderer file
    await (0, writeFileSafe_1.writeFileSafe)(rendererPath, rendererTemplate);
    // If using App Router, also create a layout file
    if (layoutPath) {
        const layoutTemplateName = options.usesTailwind
            ? 'blog-layout-tailwind.tsx'
            : 'blog-layout.tsx';
        const layoutTemplate = await fs_extra_1.default.readFile(path_1.default.join(__dirname, '../templates', layoutTemplateName), 'utf8');
        await (0, writeFileSafe_1.writeFileSafe)(layoutPath, layoutTemplate);
    }
    console.log(chalk_1.default.green('Created a basic blog renderer for your content'));
    // Create styles if needed
    if (!options.usesTailwind) {
        await createBasicStyles(options);
    }
}
/**
 * Create basic CSS styles for non-Tailwind projects
 */
async function createBasicStyles(options) {
    const projectDir = process.cwd();
    let stylesPath;
    if (options.usesAppRouter) {
        stylesPath = path_1.default.join(projectDir, 'app', 'blog', 'blog.css');
    }
    else {
        stylesPath = path_1.default.join(projectDir, 'styles', 'blog.css');
        // Ensure styles directory exists for Pages Router
        await fs_extra_1.default.ensureDir(path_1.default.join(projectDir, 'styles'));
    }
    const stylesTemplate = await fs_extra_1.default.readFile(path_1.default.join(__dirname, '../templates', 'blog.css'), 'utf8');
    await (0, writeFileSafe_1.writeFileSafe)(stylesPath, stylesTemplate);
    console.log(chalk_1.default.dim('Added basic CSS styles for the blog'));
}
