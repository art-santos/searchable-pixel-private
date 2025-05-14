import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Force Node.js runtime to avoid edge runtime issues
export const runtime = 'nodejs';

// --- GET handler (Fetch single page for editing) ---
export async function GET(request: NextRequest) {
    const pageId = request.nextUrl.pathname.split('/').pop() || '';
    const supabase = createClient();

    // 1. Check User Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    // 2. Validate ID
    if (!pageId) {
        return NextResponse.json({ error: 'Missing page ID' }, { status: 400 });
    }

    try {
        // 3. Fetch page data, ensuring user owns it
        const { data: pageData, error: fetchError } = await supabase
            .from('programmatic_pages')
            .select('*, content_faq') // Explicitly add content_faq just in case '*' is unreliable
            .match({ id: pageId, created_by: user.id })
            .single(); // Expect one row

        if (fetchError) {
             // Handle not found specifically (e.g., if ID is wrong or doesn't belong to user)
             if (fetchError.code === 'PGRST116') { // PostgREST code for "relation does not contain row"
                 return NextResponse.json({ error: 'Page not found or access denied' }, { status: 404 });
             }
            console.error("Supabase fetch error:", fetchError);
            throw new Error('Failed to fetch page data.');
        }

        if (!pageData) {
             return NextResponse.json({ error: 'Page not found' }, { status: 404 });
        }

        // 4. Return Success
        return NextResponse.json(pageData, { status: 200 });

    } catch (error: any) {
        console.error("Error fetching page:", error);
        return NextResponse.json({ error: error.message || 'Failed to fetch page' }, { status: 500 });
    }
}

// --- DELETE handler ---
export async function DELETE(request: NextRequest) {
    const pageId = request.nextUrl.pathname.split('/').pop() || '';
    const supabase = createClient();

    // 1. Check User Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate pageId (basic)
    if (!pageId) {
        return NextResponse.json({ error: 'Missing page ID' }, { status: 400 });
    }

    try {
        console.log(`API: Attempting to delete page ID: ${pageId} for user: ${user.id}`);

        // 3. Delete data from Supabase, ensuring user owns the page
        const { error: deleteError } = await supabase
            .from('programmatic_pages')
            .delete()
            .match({ id: pageId, created_by: user.id }); // Match both ID and user ID

        if (deleteError) {
            console.error("Supabase delete error:", deleteError);
            return NextResponse.json({ error: 'Failed to delete page from database.', details: deleteError.message }, { status: 500 });
        }

        console.log(`Page ${pageId} deleted successfully.`);

        // 4. Return Success Response
        return NextResponse.json({ message: 'Page deleted successfully' }, { status: 200 });

    } catch (error: any) {
        console.error("Error during page delete process:", error);
        return NextResponse.json({ error: error.message || 'Failed to delete page' }, { status: 500 });
    }
}

// --- PUT handler (Update existing page) ---
export async function PUT(request: NextRequest) {
    const pageId = request.nextUrl.pathname.split('/').pop() || '';
    const supabase = createClient();

    // 1. Check User Auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Validate ID
    if (!pageId) {
        return NextResponse.json({ error: 'Missing page ID' }, { status: 400 });
    }

    // 3. Parse request body
    let updateData: Partial<ProgrammaticPage>;
    try {
        updateData = await request.json();
        delete (updateData as any).id;
        delete (updateData as any).created_at;
        delete (updateData as any).created_by;
        updateData.updated_at = new Date().toISOString();
        // Ensure nullable fields are handled
        updateData.feature_image_url = updateData.feature_image_url || null;
        updateData.meta_description = updateData.meta_description || null;
        updateData.content_intro = updateData.content_intro || null;
    } catch (error) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // Validate only if title or slug are being updated
    if (updateData.title && !updateData.title.trim()) {
         return NextResponse.json({ error: 'Title cannot be empty' }, { status: 400 });
    }
    if (updateData.slug && !updateData.slug.trim()) {
        return NextResponse.json({ error: 'Slug cannot be empty' }, { status: 400 });
     }
    // No need to validate status specifically unless you have rules

    try {
        console.log(`API: Attempting to update page ID: ${pageId} for user: ${user.id}`);

        // 5. Update data in Supabase
        const { data: updatedData, error: updateError } = await supabase
            .from('programmatic_pages')
            .update(updateData)
            .match({ id: pageId, created_by: user.id })
            .select()
            .single();

        if (updateError) {
            console.error("Supabase update error:", updateError);
            // Check for duplicate slug error (code 23505) - though should be less common on update unless changing title
             if (updateError.code === '23505') { 
                 return NextResponse.json({ error: `Update failed: Slug '${updateData.slug}' already exists. Please change the title.`, details: updateError.message }, { status: 409 });
             }
            return NextResponse.json({ error: 'Failed to update page in database.', details: updateError.message }, { status: 500 });
        }

        console.log(`Page ${pageId} updated successfully.`);

        // 6. Return Success
        return NextResponse.json({ message: 'Page updated successfully', data: updatedData }, { status: 200 });

    } catch (error: any) {
        console.error("Error during page update process:", error);
        return NextResponse.json({ error: error.message || 'Failed to update page' }, { status: 500 });
    }
}

// Helper type (can be shared)
interface ProgrammaticPage {
    id: string;
    title: string;
    slug: string;
    status: 'draft' | 'published' | 'archived';
    created_at: string; 
    created_by?: string; // Included for validation
    updated_at?: string; // Added for update
    // Add other fields from your table schema
    type?: string;
    term?: string;
    meta_description?: string | null;
    content_intro?: string | null;
    content_main?: string | null;
    content_faq?: any | null; // Adjust type as needed
    feature_image_url?: string | null; // Added
} 