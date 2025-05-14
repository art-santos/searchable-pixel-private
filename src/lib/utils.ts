import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Function to generate URL-friendly slugs
export function generateSlug(title: string): string {
  if (!title) return ''; // Handle empty title
  return title
    .toLowerCase() // Convert to lowercase
    .replace(/[^Ѐ-ӿa-z0-9\s-]/g, '') // Remove special chars except Cyrillic, spaces, and hyphens
    .trim() // Trim leading/trailing whitespace
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-'); // Replace multiple hyphens with a single one
}
