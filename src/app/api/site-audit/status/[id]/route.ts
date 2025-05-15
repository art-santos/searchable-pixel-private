import { NextRequest, NextResponse } from 'next/server';
import { getSiteAuditStatus } from '@/services/crawler';

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
    
    // Skip auth check for debugging - directly get status
    try {
      // Get the status directly - for troubleshooting
      const status = await getSiteAuditStatus(crawlId);
      return NextResponse.json(status);
    } catch (statusError) {
      console.error('Error getting site audit status:', statusError);
      return NextResponse.json(
        { error: statusError.message || 'Failed to get site audit status' },
        { status: 500 }
      );
    }
    
  } catch (error) {
    console.error('Error getting site audit status:', error);
    
    return NextResponse.json(
      { error: error.message || 'Failed to get site audit status' },
      { status: 500 }
    );
  }
} 