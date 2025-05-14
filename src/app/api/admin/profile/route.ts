import { createClient as createServerSupabaseClient } from '@/lib/supabase/server' // Renamed import for clarity
import { createAdminClient } from '@/lib/supabase/admin' // Import Admin Client
// Remove unused direct imports
// import { createServerClient, type CookieOptions } from '@supabase/ssr'
// import { createClient } from '@supabase/supabase-js' 
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { z } from 'zod'

// Schema for profile update data (optional avatar)
const profileUpdateSchema = z.object({
  display_name: z.string().min(1, "Display name cannot be empty."),
  linkedin_url: z.string().url("Invalid LinkedIn URL").optional().or(z.literal('')),
});

// Handles PATCH requests for /api/admin/profile
export async function PATCH(request: Request) {
  console.log("PATCH /api/admin/profile initiated");
  // Use consistent client helpers
  const supabaseUserClient = createServerSupabaseClient();
  const supabaseAdminClient = createAdminClient();
  
  // Remove direct client initialization block
  /*
  const cookieStore = cookies()
  const supabaseUserClient = createServerClient(...)
  */

  // 1. Check Authentication (using the correct user client)
  const { data: { session }, error: sessionError } = await supabaseUserClient.auth.getSession();
  if (sessionError || !session?.user) {
    console.error("API Profile PATCH: Auth Error", sessionError);
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  }
  const userId = session.user.id;
  console.log(`API Profile PATCH: User ${userId} authenticated`);

  // 2. Parse FormData
  let formData;
  let avatarFile: File | null = null;
  let textFields: Record<string, any> = {};
  try {
    formData = await request.formData();
    console.log("API Profile PATCH: FormData received");
    for (const [key, value] of formData.entries()) {
      if (key === 'avatarFile') {
        if (value instanceof File && value.size > 0) avatarFile = value;
      } else {
        textFields[key] = value;
      }
    }
    console.log("API Profile PATCH: FormData parsed. File exists:", !!avatarFile);
  } catch (e) { return NextResponse.json({ error: 'Invalid form data' }, { status: 400 }); }

  // 3. Validate Text Fields
  let validatedData;
  try {
    validatedData = profileUpdateSchema.parse(textFields);
    console.log("API Profile PATCH: Text fields validated:", validatedData);
  } catch (error) { return NextResponse.json({ error: 'Invalid profile data', details: (error as z.ZodError).errors }, { status: 400 }); }

  // 4. Handle Avatar Upload (using Admin Client)
  let newAvatarUrl: string | undefined = undefined;
  let oldAvatarPath: string | null = null;

  // Get current avatar path (use Admin Client)
  console.log("API Profile PATCH: Fetching current author data...");
  const { data: currentAuthorData, error: fetchAuthorError } = await supabaseAdminClient // Use Admin Client
      .from('authors')
      .select('avatar_url')
      .eq('user_id', userId)
      .single();
  
  if (fetchAuthorError) { console.warn("Couldn't fetch current author for avatar deletion check"); }
  if (currentAuthorData?.avatar_url) {
      try { oldAvatarPath = new URL(currentAuthorData.avatar_url).pathname.split('/author-avatars/')[1]; } catch(e){} 
  }

  if (avatarFile) {
    console.log("API Profile PATCH: Attempting avatar upload...");
    try {
      // Remove direct service role client creation
      // const supabaseAdminClient = createClient(...);
      
      // ... (filename/path logic fine) ...
      const fileExt = avatarFile.name.split('.').pop();
      const filePath = `${userId}/avatar-${Date.now()}.${fileExt}`;
      
      // Use Admin Client for upload
      const { data: uploadData, error: uploadError } = await supabaseAdminClient.storage
        .from('author-avatars') 
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) { throw new Error(`Storage upload error: ${uploadError.message}`); }

      // Use Admin Client for public URL
      const { data: urlData } = supabaseAdminClient.storage.from('author-avatars').getPublicUrl(filePath);
      newAvatarUrl = urlData?.publicUrl;

      // Delete old avatar (use Admin Client)
      if(oldAvatarPath && oldAvatarPath !== filePath) {
          console.log("API Profile PATCH: Removing old avatar:", oldAvatarPath);
          await supabaseAdminClient.storage.from('author-avatars').remove([oldAvatarPath]);
      }
    } catch (error: any) {
       console.error("API Profile PATCH: Avatar upload failed:", error);
       return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 });
    }
  } else {
      console.log("API Profile PATCH: No new avatar file provided.");
  }

  // 5. Prepare data for authors table update
  const dataToUpdate: { display_name: string, linkedin_url?: string | null, avatar_url?: string } = {
    display_name: validatedData.display_name,
    linkedin_url: validatedData.linkedin_url || null,
  };
  if (newAvatarUrl !== undefined) { 
    dataToUpdate.avatar_url = newAvatarUrl;
  }

  console.log("API Profile PATCH: Data prepared for DB update:", dataToUpdate);

  // 6. Update authors table (Use Admin Client)
  console.log("API Profile PATCH: Updating authors table...");
  const { data: updatedAuthor, error: updateAuthorsError } = await supabaseAdminClient // Use Admin Client
    .from('authors')
    .update(dataToUpdate)
    .eq('user_id', userId)
    .select('display_name, avatar_url, linkedin_url') 
    .single();

  if (updateAuthorsError) {
     console.error("API Profile PATCH: DB update failed:", updateAuthorsError);
     return NextResponse.json({ error: 'Failed to update author profile', details: updateAuthorsError.message }, { status: 500 }); 
   }
   console.log("API Profile PATCH: DB update successful:", updatedAuthor);
   
  // 7. Update auth.users metadata (Use Admin Client)
   try {
       console.log("API Profile PATCH: Attempting auth metadata update...");
       // Remove direct service role client creation
       // const supabaseAdminClient = createClient(...);
       
       // Use Admin Client
       await supabaseAdminClient.auth.admin.updateUserById(userId, {
           user_metadata: { 
               name: dataToUpdate.display_name, 
               avatar_url: dataToUpdate.avatar_url ?? currentAuthorData?.avatar_url ?? null // Ensure null if needed
             }
       });
       console.log("API Profile PATCH: Auth metadata updated.");
   } catch (authUpdateError) {
       console.error("API Profile PATCH: Auth metadata update failed:", authUpdateError);
       // Don't fail the whole request, just log the error
   }

  // 8. Return Success Response
  console.log("API Profile PATCH: Returning success response.");
  return NextResponse.json(updatedAuthor, { status: 200 });
} 