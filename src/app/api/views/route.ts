import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const runtime = 'edge';
// Allow dynamic access to prevent caching this route's response
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    // Fetch all view counts from the hash
    // HGETALL returns an object like { slug1: '5', slug2: '10', ... } or null if empty
    const slugViews = await redis.hgetall('page_views');
    // Fetch the total count
    const totalViews = await redis.get<number>('page_views::total') ?? 0;

    // Format the slugViews: hgetall returns strings, convert to numbers
    const formattedSlugViews: Record<string, number> = {};
    if (slugViews) {
      for (const [slug, countValue] of Object.entries(slugViews)) {
        // More robust check and parsing
        let count = 0;
        if (typeof countValue === 'string') {
           const parsed = parseInt(countValue, 10);
           if (!isNaN(parsed)) {
               count = parsed;
           }
        } else if (typeof countValue === 'number') {
            // Handle if Redis somehow returns a number directly
            count = countValue;
        }
        // If countValue is not a string or number, or fails parsing, count remains 0
        formattedSlugViews[slug] = count;
      }
    }

    const responseData = {
      totalViews: totalViews,
      slugViews: formattedSlugViews,
    };

    return NextResponse.json(responseData);

  } catch (error) {
    console.error("Error fetching view counts:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 