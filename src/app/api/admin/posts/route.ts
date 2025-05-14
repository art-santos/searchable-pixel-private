import { createClient as createServerSupabaseClient } from '@/lib/supabase/server' // Renamed import
import { createAdminClient } from '@/lib/supabase/admin' // Import Admin Client
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import slugify from 'slugify' // We'll need a slug library
import { z } from 'zod' // For validation

// Define schema for FORM DATA fields (non-file fields)
const postSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  category: z.string().optional(),
  authorIds: z.array(z.string().uuid()).min(1, "At least one author must be selected"), // Expect array of UUIDs
  // imageFile is handled separately
});

export async function POST(request: Request) {
  // Use the consistent helper function from server.ts for auth check
  const supabaseUserClient = createServerSupabaseClient();
  // Get admin client for privileged operations
  const supabaseAdminClient = createAdminClient();

  // 1. Check Authentication
  const { data: { session } } = await supabaseUserClient.auth.getSession()
  if (!session?.user) {
    console.log('API: No user session found.')
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  console.log('API: User authenticated:', session.user.id);

  // 2. REMOVED Authorization Check (Admin Role)
  /*
  const { data: adminCheck, error: adminError } = await supabase
    .from('admins')
    .select('user_id')
    .eq('user_id', session.user.id)
    .maybeSingle()

  if (adminError) {
    console.error('Admin check error:', adminError);
    return NextResponse.json({ error: 'Error checking admin status' }, { status: 500 });
  }
  if (!adminCheck) {
    console.warn('Admin access denied for user:', session.user.id);
    return NextResponse.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
  }
  */

  // 3. Parse FormData
  let formData;
  let imageFile: File | null = null;
  let textFields: Record<string, any> = {};

  try {
    formData = await request.formData();
    // Extract text fields
    for (const [key, value] of formData.entries()) {
      if (key !== 'imageFile') { // Separate the file
        textFields[key] = value;
      }
    }
    // Extract file if present
    const fileValue = formData.get('imageFile');
    if (fileValue instanceof File && fileValue.size > 0) {
      imageFile = fileValue;
      console.log('API: Received image file:', imageFile.name);
    }
  } catch (error) {
    console.error("FormData parsing error:", error);
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
  }
  
  // 4. Validate Text Fields + authorIds
  let validatedData;
  try {
     let authorIdsRaw = textFields.authorIds;
     let parsedAuthorIds: string[] = [];
     if (typeof authorIdsRaw === 'string') {
       try {
         parsedAuthorIds = JSON.parse(authorIdsRaw);
         if (!Array.isArray(parsedAuthorIds)) throw new Error('authorIds is not an array');
       } catch (e) {
         return NextResponse.json({ error: 'Invalid format for authorIds' }, { status: 400 });
       }
     } else {
         return NextResponse.json({ error: 'authorIds field is missing or not a string' }, { status: 400 });
     }
     
    // Validate extracted/parsed data - EXCLUDE raw authorIds from textFields
    const { authorIds: rawAuthorIdsString, ...otherTextFields } = textFields; 
    validatedData = postSchema.parse({
        ...otherTextFields, 
        authorIds: parsedAuthorIds 
    });
  } catch (error) {
    // Log the detailed Zod error structure if available
    if (error instanceof z.ZodError) {
        console.error("Zod Validation Failed:", JSON.stringify(error.errors, null, 2));
        // Return specific Zod issues to the client for better debugging
        return NextResponse.json({ error: 'Invalid post data', details: error.errors }, { status: 400 });
    } else {
        // Log generic error if it's not a Zod error
        console.error("Validation error (Non-Zod):", error);
        return NextResponse.json({ error: 'Invalid post data', details: (error as Error).message }, { status: 400 });
    }
  }

  // 5. Handle Image Upload (if file exists)
  let imageUrl: string | null = null;
  if (imageFile) {
    try {
      // Remove direct creation with service key, use admin client helper
      // const supabaseAdminClient = createClient(...);

      // Generate a unique file path
      const fileExt = imageFile.name.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `public/${uniqueFileName}`; // Store in a 'public' folder within the bucket

      console.log(`API: Uploading ${filePath} to blog-images bucket...`);
      const { data: uploadData, error: uploadError } = await supabaseAdminClient.storage // Use Admin Client
        .from('blog-images') 
        .upload(filePath, imageFile);

      if (uploadError) {
        throw new Error(`Storage upload error: ${uploadError.message}`);
      }
      
      console.log('API: Upload successful, getting public URL...');
      // Get the public URL
      const { data: urlData } = supabaseAdminClient.storage // Use Admin Client
        .from('blog-images')
        .getPublicUrl(filePath);

      imageUrl = urlData?.publicUrl || null;
      console.log('API: Public URL obtained:', imageUrl);

    } catch (error: any) {
      console.error("Image upload failed:", error);
      return NextResponse.json({ error: 'Image upload failed', details: error.message }, { status: 500 });
    }
  }

  // 6. Generate Slug
  const slug = slugify(validatedData.title, { lower: true, strict: true });

  // 7. Prepare Data for DB Insertion (posts table - no author name/avatar here)
  const postToInsert = {
    title: validatedData.title,
    content: validatedData.content,
    slug: slug,
    category: validatedData.category || null,
    image_url: imageUrl, // Use the uploaded image URL or null
    published: true, 
  };

  // 8. Insert into `posts` Table
  const { data: newPost, error: insertPostError } = await supabaseAdminClient // Use Admin Client
    .from('posts')
    .insert(postToInsert)
    .select('id') // Only need the id
    .single()

  if (insertPostError) {
    console.error('DB Insert post error:', insertPostError);
    if (insertPostError.code === '23505') { 
        return NextResponse.json({ error: 'A post with this title already exists (slug conflict).' }, { status: 409 });
    }
    return NextResponse.json({ error: 'Failed to create post base data', details: insertPostError.message }, { status: 500 });
  }

  if (!newPost || !newPost.id) {
    return NextResponse.json({ error: 'Failed to retrieve new post ID after insert.'}, { status: 500 });
  }

  // 9. Insert into `post_authors` Table
  const authorLinks = validatedData.authorIds.map((authorId: string) => ({
    post_id: newPost.id,
    author_user_id: authorId, 
  }));

  const { error: insertAuthorsError } = await supabaseAdminClient // Use Admin Client
    .from('post_authors')
    .insert(authorLinks);

  if (insertAuthorsError) {
    // Important: Consider rolling back the post insert or marking it as draft if authors fail?
    // For now, just log error and return failure, post might exist without authors.
    console.error('DB Insert post_authors error:', insertAuthorsError);
    return NextResponse.json({ error: 'Failed to link authors to post', details: insertAuthorsError.message }, { status: 500 });
  }

  // 10. Trigger Revalidation
  try {
    console.log('Revalidating paths...');
    revalidatePath('/blog') // Revalidate the main blog list
    revalidatePath(`/blog/${slug}`) // Revalidate the new post page
    console.log('Revalidation triggered for /blog and /blog/' + slug);
  } catch (err) {
    console.error("Error revalidating paths:", err);
    // Don't fail the whole request if revalidation fails, but log it
  }

  // 11. Return Success Response (maybe return post ID or limited data)
  return NextResponse.json({ id: newPost.id, message: "Post created successfully" }, { status: 201 });
} 