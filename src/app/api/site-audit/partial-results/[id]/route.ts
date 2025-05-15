import { NextRequest, NextResponse } from 'next/server';
import { getPartialCrawlResults } from '@/services/crawler';

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
    
    // Get partial results - no auth check for simplicity
    try {
      const results = await getPartialCrawlResults(crawlId);
      return NextResponse.json(results);
    } catch (resultsError) {
      console.error('Error getting partial site audit results:', resultsError);
      return NextResponse.json(
        { error: resultsError.message || 'Failed to get partial site audit results' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error in partial results API:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to get partial site audit results' },
      { status: 500 }
    );
  }
} 