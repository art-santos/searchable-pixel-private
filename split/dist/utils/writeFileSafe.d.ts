/**
 * Safely writes a file, ensuring the directory exists
 * and optionally backing up existing files
 */
export declare function writeFileSafe(filePath: string, content: string, options?: {
    backup?: boolean;
    overwrite?: boolean;
}): Promise<boolean>;
