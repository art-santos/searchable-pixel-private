import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server' // Use server client for session check
import { createAdminClient } from '@/lib/supabase/admin' // Import admin client (needs to be created)
import { cookies } from 'next/headers'

// Define admin IDs array
const ADMIN_USER_IDS = [
  "b08cef29-b691-4a5a-aa18-870ffa33fffd", // Sam
  "888de7f8-93ae-49ea-a3cf-4659a39a440e"  // Second admin
];

export async function DELETE(request: Request, context: any) {
    const params = context.params as { userId: string }; // Assert type inside
    console.log(`--- DELETE /api/admin/users/${params.userId} ---`);
    const userIdToDelete = params.userId;
    const supabase = createClient(); // Client for checking requestor's auth

    if (!userIdToDelete) {
        return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    try {
        // --- 1. Verify Requesting User is Admin ---
        const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser();

        if (authError || !requestingUser) {
            console.error('DELETE Error: Auth error getting requesting user', authError);
            return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
        }

        // Check if requesting user is in the admin array
        if (!ADMIN_USER_IDS.includes(requestingUser?.id ?? '')) { 
            console.warn(`DELETE Warning: User ${requestingUser?.id} attempted unauthorized delete.`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        console.log(`Admin user ${requestingUser?.id} authorized to delete user ${userIdToDelete}`);

        // Prevent admin from deleting themselves (or other admins) via this route
        if (ADMIN_USER_IDS.includes(userIdToDelete)) {
           return NextResponse.json({ error: 'Cannot delete an admin account via this route.' }, { status: 400 });
        }

        // --- 2. Use Admin Client to Delete Auth User ---
        const supabaseAdmin = createAdminClient(); // Initialize admin client
        console.log(`Attempting to delete auth user ${userIdToDelete}...`);
        const { error: deleteAuthUserError } = await supabaseAdmin.auth.admin.deleteUser(userIdToDelete);

        if (deleteAuthUserError) {
             // Handle cases like user not found slightly differently?
            if (deleteAuthUserError.message.includes('User not found')) {
                 console.log(`Auth user ${userIdToDelete} not found, potentially already deleted.`);
                 // Proceed to attempt deleting from authors table anyway?
            } else {
                console.error('DELETE Error: Failed deleting auth user:', deleteAuthUserError);
                throw new Error(`Failed to delete authentication user: ${deleteAuthUserError.message}`);
            }
        }
        console.log(`Successfully deleted auth user ${userIdToDelete} (or user didn't exist).`);

        // --- 3. Delete from 'authors' table (using admin client for consistency) ---
        console.log(`Attempting to delete user ${userIdToDelete} from authors table...`);
        const { error: deleteAuthorError } = await supabaseAdmin
            .from('authors')
            .delete()
            .eq('user_id', userIdToDelete);

        if (deleteAuthorError) {
             // Log this error but maybe don't fail the whole request if auth user was deleted?
             console.error('DELETE Warning: Failed deleting user from authors table:', deleteAuthorError);
             // Depending on desired behavior, you might still return success here
             // For now, let's report it as an error to be safe
             return NextResponse.json({ error: `Auth user deleted, but failed to delete author profile: ${deleteAuthorError.message}` }, { status: 500 });
        }
         console.log(`Successfully deleted user ${userIdToDelete} from authors table.`);

        // --- 4. Return Success --- 
        return NextResponse.json({ message: 'User deleted successfully (auth and profile)' }, { status: 200 });

    } catch (error: any) {
        console.error('--- UNEXPECTED ERROR in DELETE User Handler ---', error);
        return NextResponse.json({ error: error.message || 'An unexpected server error occurred.' }, { status: 500 });
    }
} 