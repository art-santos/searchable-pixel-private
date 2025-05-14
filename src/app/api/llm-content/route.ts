import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const file = searchParams.get('file') || 'llms'; // Default to llms.txt if no file parameter
  
  // Only allow specific files for security
  const allowedFiles = ['llms', 'llms-full'];
  if (!allowedFiles.includes(file)) {
    return new NextResponse('File not found', { status: 404 });
  }

  try {
    // Get file path
    const filePath = path.join(process.cwd(), 'public', `${file}.txt`);
    
    // Read file content
    const fileContent = await fs.readFile(filePath, 'utf8');
    
    // Return the file content as text
    return new NextResponse(fileContent, {
      headers: {
        'Content-Type': 'text/plain',
      },
    });
  } catch (error) {
    console.error('Error reading LLM file:', error);
    return new NextResponse('Error reading file', { status: 500 });
  }
} 