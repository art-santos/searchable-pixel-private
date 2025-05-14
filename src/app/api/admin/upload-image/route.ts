import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js'; // Import standard client
import { createClient as createServerClient } from '@/lib/supabase/server'; // For auth check
import { randomUUID } from 'crypto'; // For unique filenames

// Use standard client with Service Role Key for admin-level storage access
// Ensure these are set in your environment variables!
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const BUCKET_NAME = 'programmatic-images'; // Match your bucket name

export async function POST(request: Request) {
    const supabaseAuth = createServerClient(); // Use server client for auth check

    // 1. Check User Auth
    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Get File from FormData
    let file: File | null = null;
    let formData: FormData;
    try {
        formData = await request.formData();
        file = formData.get('file') as File;
    } catch (error) {
        return NextResponse.json({ error: 'Error parsing form data' }, { status: 400 });
    }

    if (!file) {
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // 3. Generate unique filename (e.g., user_id/uuid.extension)
    const fileExtension = file.name.split('.').pop();
    const fileName = `${user.id}/${randomUUID()}.${fileExtension}`;

    try {
        console.log(`API: Uploading file: ${fileName} to bucket: ${BUCKET_NAME}`);

        // 4. Upload file using Admin client
        const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
            .from(BUCKET_NAME)
            .upload(fileName, file, {
                // cacheControl: '3600', // Optional: Set cache control
                upsert: false, // Optional: Prevent overwriting existing files (shouldn't happen with UUIDs)
            });

        if (uploadError) {
            console.error("Supabase storage upload error:", uploadError);
            throw uploadError; // Throw error to be caught below
        }

        // 5. Get Public URL
        const { data: urlData } = supabaseAdmin.storage
            .from(BUCKET_NAME)
            .getPublicUrl(fileName);

        // Log the full response from getPublicUrl
        console.log(`API: getPublicUrl response for ${fileName}:`, JSON.stringify(urlData));

        if (!urlData || !urlData.publicUrl) {
             console.error("Failed to get public URL after upload for path:", fileName);
             // Attempt to delete the orphaned file if URL retrieval fails?
             await supabaseAdmin.storage.from(BUCKET_NAME).remove([fileName]);
             throw new Error('File uploaded but failed to retrieve public URL.');
         }

        console.log(`API: File uploaded successfully. Public URL: ${urlData.publicUrl}`);

        // 6. Return Success Response
        return NextResponse.json({ imageUrl: urlData.publicUrl }, { status: 200 });

    } catch (error: any) {
        console.error("Error during file upload process:", error);
        return NextResponse.json({ error: error.message || 'Failed to upload file' }, { status: 500 });
    }
} 