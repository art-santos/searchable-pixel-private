import { NextRequest, NextResponse } from 'next/server';
import { getSiteAuditResults } from '@/services/crawler';

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Get the crawl ID from the URL
    const crawlId = params.id;
    
    if (!crawlId) {
      return NextResponse.json(
        { error: 'Crawl ID is required' },
        { status: 400 }
      );
    }
    
    // Skip auth check for debugging
    try {
      // Get the results directly
      const results = await getSiteAuditResults(crawlId);
      return NextResponse.json(results);
    } catch (resultsError) {
      console.error('Error getting site audit results:', resultsError);
      return NextResponse.json(
        { error: resultsError.message || 'Failed to get site audit results' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error getting site audit results:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to get site audit results' },
      { status: 500 }
    );
  }
} 