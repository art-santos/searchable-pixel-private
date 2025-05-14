import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const runtime = 'edge';

// Helper function to get date in YYYY-MM-DD format (UTC)
function getUTCDateString() {
  const date = new Date();
  const year = date.getUTCFullYear();
  const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
  const day = date.getUTCDate().toString().padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function POST(request: Request) {
  let slug: string | undefined;
  try {
    // Extract slug from JSON body
    const body = await request.json();
    if (typeof body.slug !== 'string') {
      return new NextResponse('Slug parameter (string) is required in body', { status: 400 });
    }
    slug = body.slug;
  } catch (error) {
    return new NextResponse('Invalid JSON body', { status: 400 });
  }

  if (!slug) {
     // This check is slightly redundant due to the try/catch but good practice
    return new NextResponse('Slug parameter is required in body', { status: 400 });
  }

  try {
    const todayDate = getUTCDateString();
    const dailyTotalKey = `views::total::${todayDate}`;
    const slugHashKey = 'page_views'; // Keep consistent with the GET route
    const totalKey = 'page_views::total'; // Keep consistent with the GET route

    const pipeline = redis.pipeline();
    pipeline.hincrby(slugHashKey, slug, 1);   // Increment count for the specific slug hash field
    pipeline.incr(totalKey);                // Increment overall total count
    pipeline.incr(dailyTotalKey);           // Increment daily total count
    pipeline.expire(dailyTotalKey, 60 * 60 * 24 * 90); // Set ~90 day TTL for daily keys

    await pipeline.exec();

    return new NextResponse(null, { status: 202 }); // Accepted

  } catch (error) {
    console.error("Error incrementing view counts:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 