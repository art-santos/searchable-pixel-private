import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server' // Use server client for session check
import { createAdminClient } from '@/lib/supabase/admin' // Import admin client
import { cookies } from 'next/headers'

// Define admin IDs array
const ADMIN_USER_IDS = [
  "b08cef29-b691-4a5a-aa18-870ffa33fffd", // Sam
  "888de7f8-93ae-49ea-a3cf-4659a39a440e"  // Second admin
];

export async function POST(request: Request) {
    console.log(`--- POST /api/admin/users/invite ---`);
    const supabase = createClient(); // Client for checking requestor's auth
    let requestBody;

    try {
        requestBody = await request.json();
    } catch (e) {
        console.error('Invite Error: Invalid JSON body');
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { email } = requestBody;

    if (!email || typeof email !== 'string') {
        return NextResponse.json({ error: 'Email is required and must be a string' }, { status: 400 });
    }

    try {
        // --- 1. Verify Requesting User is Admin ---
        const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !requestingUser) {
            console.error('Invite Error: Auth error getting requesting user', authError);
            return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
        }

        // Check if requesting user is in the admin array
        if (!ADMIN_USER_IDS.includes(requestingUser?.id ?? '')) { 
            console.warn(`Invite Warning: User ${requestingUser?.id} attempted unauthorized invite.`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        console.log(`Admin user ${requestingUser?.id} authorized to invite ${email}`);

        // --- 2. Use Admin Client to Invite User ---
        const supabaseAdmin = createAdminClient(); // Initialize admin client
        console.log(`Attempting to invite user ${email}...`);
        
        const { data, error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(email);

        if (inviteError) {
            console.error('Invite Error: Failed inviting user:', inviteError);
            // Provide a slightly more user-friendly error if possible
            let errorMessage = inviteError.message;
            if (errorMessage.includes('User already registered')) {
                errorMessage = 'This email address is already registered.';
            }
            throw new Error(errorMessage);
        }

        console.log(`Successfully sent invitation to ${email}. Response data:`, data);

        // Note: This only sends the invite. The user needs to accept it.
        // We also don't automatically create an 'authors' profile here.
        // That would typically happen after the user signs up/logs in, potentially via a trigger or first profile edit.

        // --- 3. Return Success --- 
        return NextResponse.json({ message: 'Invitation sent successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('--- UNEXPECTED ERROR in Invite User Handler ---', error);
        return NextResponse.json({ error: error.message || 'An unexpected server error occurred.' }, { status: 500 });
    }
} 