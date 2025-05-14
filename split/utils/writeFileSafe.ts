import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

/**
 * Safely writes a file, ensuring the directory exists
 * and optionally backing up existing files
 */
export async function writeFileSafe(
  filePath: string, 
  content: string, 
  options: { 
    backup?: boolean,
    overwrite?: boolean 
  } = { backup: true, overwrite: true }
): Promise<boolean> {
  try {
    const dirPath = path.dirname(filePath);
    
    // Ensure the directory exists
    await fs.ensureDir(dirPath);
    
    // Check if file already exists
    const fileExists = await fs.pathExists(filePath);
    
    if (fileExists) {
      if (options.backup) {
        // Create backup with timestamp
        const backupPath = `${filePath}.${Date.now()}.bak`;
        await fs.copy(filePath, backupPath);
        console.log(chalk.yellow(`Backed up existing file to: ${backupPath}`));
      }
      
      if (!options.overwrite) {
        console.log(chalk.yellow(`File already exists, skipping: ${filePath}`));
        return false;
      }
    }
    
    // Write the file
    await fs.writeFile(filePath, content);
    return true;
  } catch (error) {
    console.error(chalk.red(`Error writing file ${filePath}:`), error);
    throw error;
  }
} 