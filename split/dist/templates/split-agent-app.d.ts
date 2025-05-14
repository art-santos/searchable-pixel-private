import { NextRequest, NextResponse } from 'next/server';
/**
 * Webhook handler for Split AI content delivery
 * This endpoint receives content from Split and saves it to your designated content directory
 */
export declare function POST(req: NextRequest): Promise<NextResponse<unknown>>;
