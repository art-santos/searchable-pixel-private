"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.writeFileSafe = writeFileSafe;
const fs_extra_1 = __importDefault(require("fs-extra"));
const path_1 = __importDefault(require("path"));
const chalk_1 = __importDefault(require("chalk"));
/**
 * Safely writes a file, ensuring the directory exists
 * and optionally backing up existing files
 */
async function writeFileSafe(filePath, content, options = { backup: true, overwrite: true }) {
    try {
        const dirPath = path_1.default.dirname(filePath);
        // Ensure the directory exists
        await fs_extra_1.default.ensureDir(dirPath);
        // Check if file already exists
        const fileExists = await fs_extra_1.default.pathExists(filePath);
        if (fileExists) {
            if (options.backup) {
                // Create backup with timestamp
                const backupPath = `${filePath}.${Date.now()}.bak`;
                await fs_extra_1.default.copy(filePath, backupPath);
                console.log(chalk_1.default.yellow(`Backed up existing file to: ${backupPath}`));
            }
            if (!options.overwrite) {
                console.log(chalk_1.default.yellow(`File already exists, skipping: ${filePath}`));
                return false;
            }
        }
        // Write the file
        await fs_extra_1.default.writeFile(filePath, content);
        return true;
    }
    catch (error) {
        console.error(chalk_1.default.red(`Error writing file ${filePath}:`), error);
        throw error;
    }
}
