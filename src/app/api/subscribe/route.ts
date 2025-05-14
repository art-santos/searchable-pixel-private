import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const data = await request.formData();
    const email = data.get('email')?.toString();

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      );
    }

    // Forward the request to Loops.so
    const formBody = `email=${encodeURIComponent(email)}`;
    const response = await fetch('https://app.loops.so/api/newsletter-form/cm04gemhd01fki3j7f7ubcqt8', {
      method: 'POST',
      body: formBody,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const loopsData = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { success: false, message: 'Failed to subscribe to newsletter', details: loopsData },
        { status: response.status }
      );
    }

    return NextResponse.json({ success: true, message: 'Subscribed successfully' });
  } catch (error) {
    console.error('Error in subscribe API:', error);
    return NextResponse.json(
      { success: false, message: 'Server error' },
      { status: 500 }
    );
  }
} 