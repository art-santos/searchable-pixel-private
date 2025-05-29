import { promises as fs } from 'fs'
import path from 'path'

export interface StorageManager {
  basePath: string
  hostname: string
}

/**
 * Creates a storage manager for a specific hostname
 */
export function createStorageManager(url: string): StorageManager {
  const hostname = extractHostname(url)
  const basePath = path.join(process.cwd(), 'tmp', hostname)
  
  return { basePath, hostname }
}

/**
 * Ensures the storage directory exists
 */
export async function ensureDirectory(storage: StorageManager): Promise<void> {
  try {
    await fs.mkdir(storage.basePath, { recursive: true })
  } catch (error) {
    console.error('Failed to create storage directory:', error)
    throw new Error(`Failed to create storage directory: ${storage.basePath}`)
  }
}

/**
 * Saves data to a JSON file
 */
export async function saveJSON(
  storage: StorageManager, 
  filename: string, 
  data: any
): Promise<string> {
  const filePath = path.join(storage.basePath, filename)
  
  try {
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    console.log(`✅ Saved ${filename} (${JSON.stringify(data).length} bytes)`)
    return filePath
  } catch (error) {
    console.error(`Failed to save ${filename}:`, error)
    throw new Error(`Failed to save ${filename}`)
  }
}

/**
 * Loads data from a JSON file
 */
export async function loadJSON(
  storage: StorageManager, 
  filename: string
): Promise<any> {
  const filePath = path.join(storage.basePath, filename)
  
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(content)
  } catch (error) {
    console.error(`Failed to load ${filename}:`, error)
    throw new Error(`Failed to load ${filename}`)
  }
}

/**
 * Checks if a file exists
 */
export async function fileExists(
  storage: StorageManager, 
  filename: string
): Promise<boolean> {
  const filePath = path.join(storage.basePath, filename)
  
  try {
    await fs.access(filePath)
    return true
  } catch {
    return false
  }
}

/**
 * Extracts hostname from URL for directory naming
 */
function extractHostname(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`)
    return urlObj.hostname.replace(/^www\./, '')
  } catch {
    // Fallback for invalid URLs
    return url.replace(/[^a-zA-Z0-9.-]/g, '_').substring(0, 50)
  }
} 