import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server' // Use server client for session check
import { createAdminClient } from '@/lib/supabase/admin' // Import admin client
import { cookies } from 'next/headers'

// Define admin IDs array
const ADMIN_USER_IDS = [
  "b08cef29-b691-4a5a-aa18-870ffa33fffd", // Sam
  "888de7f8-93ae-49ea-a3cf-4659a39a440e"  // Second admin
];

export async function GET(request: Request) {
    console.log(`--- GET /api/admin/users ---`);
    const supabase = createClient(); // Client for checking requestor's auth

    try {
        // --- 1. Verify Requesting User is Admin ---
        const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !requestingUser) {
            console.error('GET Users Error: Auth error getting requesting user', authError);
            return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
        }

        // Check if requesting user is in the admin array
        if (!ADMIN_USER_IDS.includes(requestingUser?.id ?? '')) { 
            console.warn(`GET Users Warning: User ${requestingUser?.id} attempted unauthorized list.`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        console.log(`Admin user ${requestingUser?.id} authorized to list users`);

        // --- 2. Use Admin Client to List Users ---
        const supabaseAdmin = createAdminClient();
        console.log('Listing all users...');
        
        // Fetch users, potentially handling pagination if needed in the future
        const { data: { users }, error: listUsersError } = await supabaseAdmin.auth.admin.listUsers({
             page: 1,
             perPage: 1000, // Adjust as needed, max 1000 for listUsers
        }); 

        if (listUsersError) {
            console.error('GET Users Error: Failed listing users:', listUsersError);
            throw new Error(`Failed to list users: ${listUsersError.message}`);
        }

        console.log(`Successfully listed ${users.length} users.`);
        
        // --- 3. Return Success --- 
        // We send the raw list, client can format/display as needed
        return NextResponse.json(users, { status: 200 });

    } catch (error: any) {
        console.error('--- UNEXPECTED ERROR in GET Users Handler ---', error);
        return NextResponse.json({ error: error.message || 'An unexpected server error occurred.' }, { status: 500 });
    }
} 