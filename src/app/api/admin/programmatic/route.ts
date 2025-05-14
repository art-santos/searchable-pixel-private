import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Define the expected structure for saving/updating a page
// This should align with your Supabase table columns
interface ProgrammaticPageData {
    id?: string; // Optional: ID might be provided for updates later
    type: 'glossary' | 'faq' | 'article' | 'use_case' | 'industry_page';
    term: string; // The original term/prompt might be useful
    slug: string;
    title: string;
    meta_description?: string | null;
    content_intro?: string | null;
    content_main?: string | null;
    content_faq?: { question: string; answer: string }[] | null;
    status: 'draft' | 'published' | 'archived';
    // created_by will be added based on the authenticated user
    feature_image_url?: string | null;
}

export async function POST(request: Request) {
    const supabase = createClient();

    // 1. Check User Authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let pageData: ProgrammaticPageData;
    try {
        pageData = await request.json();
        // Add created_by user ID
        // pageData.created_by = user.id; // We will add this in the insert operation instead
    } catch (error) {
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    // 2. Validate Input Data (Basic Example)
    if (!pageData.type || !pageData.slug || !pageData.title || !pageData.status || !pageData.term) {
         return NextResponse.json({ error: 'Missing required fields (type, slug, title, status, term)' }, { status: 400 });
    }
    if (!['draft', 'published', 'archived'].includes(pageData.status)) {
         return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
    }
     // Add more validation as needed (e.g., slug format/uniqueness check before insert?)

    try {
        console.log(`API: Saving programmatic page - Title: ${pageData.title}, Status: ${pageData.status}`);

        // 3. Insert data into Supabase
        // We spread the validated pageData and explicitly add created_by
        const { data: insertedData, error: insertError } = await supabase
            .from('programmatic_pages')
            .insert({
                ...pageData,
                created_by: user.id, // Add the user ID here
                // Ensure nullable fields are handled correctly
                meta_description: pageData.meta_description || null,
                content_intro: pageData.content_intro || null,
                content_main: pageData.content_main || null,
                content_faq: pageData.content_faq || null,
                feature_image_url: pageData.feature_image_url || null,
            })
            .select() // Select the inserted row to return it
            .single(); // Expect only one row to be inserted

        if (insertError) {
            console.error("Supabase insert error:", insertError);
            // Check specifically for unique constraint violation (PostgreSQL code 23505)
             if (insertError.code === '23505') { 
                 // Return 409 Conflict status
                return NextResponse.json({ error: `Slug already exists. Please change the title.`, details: insertError.message }, { status: 409 });
            }
            // For other errors, return 500
            return NextResponse.json({ error: 'Failed to save page to database.', details: insertError.message }, { status: 500 });
        }

        console.log("Page saved successfully:", insertedData);

        // 4. Return Success Response
        return NextResponse.json({ message: 'Page saved successfully', data: insertedData }, { status: 201 }); // 201 Created

    } catch (error: any) {
        console.error("Error during page save process:", error);
        return NextResponse.json({ error: error.message || 'Failed to save page' }, { status: 500 });
    }
}

// TODO: Add handlers for GET (to fetch pages for the list view, maybe with filters),
// PUT/PATCH (for updating existing pages), and DELETE if needed directly via API. 

// --- DELETE handler (Placeholder - actual logic will be in [pageId]/route.ts) ---
// This handler likely won't be hit if requests go to /api/admin/programmatic/[pageId]
export async function DELETE(request: Request) {
    return NextResponse.json({ error: 'Method Not Allowed. Use /api/admin/programmatic/[pageId]' }, { status: 405 });
} 