import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  // Log all environment variables for debugging
  console.log('Environment variables:');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Not set');
  console.log('SUPABASE_SERVICE_KEY:', process.env.SUPABASE_SERVICE_KEY ? 'Set' : 'Not set');
  console.log('APIFY_API_TOKEN:', process.env.APIFY_API_TOKEN ? 'Set' : 'Not set');
  
  return NextResponse.json({ 
    status: 'ok',
    message: 'Test API is working',
    time: new Date().toISOString()
  });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    return NextResponse.json({ 
      status: 'ok',
      message: 'POST test successful',
      receivedData: body,
      time: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in test API:', error);
    return NextResponse.json({
      status: 'error',
      message: error.message || 'Unknown error'
    }, { status: 500 });
  }
} 