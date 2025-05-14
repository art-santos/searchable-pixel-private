import { NextResponse } from 'next/server';
import { redis } from '@/lib/redis';

export const runtime = 'edge';
export const dynamic = 'force-dynamic'; // Prevent caching

// Helper function to get date strings for the last N days
function getLastNDates(days: number): { dateStr: string; shortName: string }[] {
  const dates: { dateStr: string; shortName: string }[] = [];
  const today = new Date();
  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' }; // For short name like 'Jan 20'

  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setUTCDate(today.getUTCDate() - i); // Go back i days

    const year = date.getUTCFullYear();
    const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = date.getUTCDate().toString().padStart(2, '0');
    const dateStr = `${year}-${month}-${day}`;

    // Format short name (adjust locale/options as needed)
    const shortName = date.toLocaleDateString('en-US', options);

    dates.push({ dateStr, shortName });
  }
  return dates.reverse(); // Return in chronological order
}

export async function GET(request: Request) {
  const daysToFetch = 7; // Fetch last 7 days
  const dateInfo = getLastNDates(daysToFetch);
  const keys = dateInfo.map(d => `views::total::${d.dateStr}`);

  if (keys.length === 0) {
    return NextResponse.json([]);
  }

  try {
    // Fetch counts for all requested keys
    const counts = await redis.mget<number[]>(...keys);

    // Combine date short names with counts (handle nulls from mget as 0)
    const historicalData = dateInfo.map((d, index) => ({
      name: d.shortName,
      views: counts[index] ?? 0, // Use 0 if key didn't exist (null)
    }));

    return NextResponse.json(historicalData);

  } catch (error) {
    console.error("Error fetching historical view counts:", error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 