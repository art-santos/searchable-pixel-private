import { NextResponse, NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server' // Server client for initial auth check
import { createAdminClient } from '@/lib/supabase/admin' // Admin client for privileged actions
import { v4 as uuidv4 } from 'uuid'

const ADMIN_USER_ID = "b08cef29-b691-4a5a-aa18-870ffa33fffd"; // Define admin ID

// PATCH Handler for updating a specific post
export async function PATCH(request: NextRequest, context: any) {
    const params = context.params as { postId: string }; // Assert type inside
    console.log(`--- PATCH /api/admin/posts/${params.postId} ---`);
    const supabase = createClient(); // Client for checking requestor's auth
    const supabaseAdmin = createAdminClient(); // Admin client for DB/Storage ops
    const postId = params.postId;
    let newImageUrl: string | null = null;

    if (!postId) {
        console.error('PATCH Error: Missing postId');
        return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    try {
        // --- 1. Verify Requesting User is Admin ---
        const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !requestingUser) {
            console.error('PATCH Error: Auth error getting requesting user', authError);
            return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
        }
        if (requestingUser.id !== ADMIN_USER_ID) {
            console.warn(`PATCH Warning: User ${requestingUser.id} attempted unauthorized patch.`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        console.log(`Admin user ${requestingUser.id} authorized to patch post ${postId}`);

        // --- 2. Parse FormData ---
        console.log('Parsing FormData...');
        const formData = await request.formData();
        const title = formData.get('title') as string;
        const content = formData.get('content') as string;
        const category = formData.get('category') as string | null;
        const authorIdsString = formData.get('authorIds') as string;
        const imageFile = formData.get('imageFile') as File | null;
        const removeCurrentImage = formData.get('removeCurrentImage') === 'true';
        console.log('FormData parsed:', { title, category, hasImageFile: !!imageFile, removeCurrentImage });

        if (!title || !content || !authorIdsString) {
             console.error('PATCH Error: Missing required fields');
            return NextResponse.json({ error: 'Missing required fields: title, content, authorIds' }, { status: 400 });
        }

        let authorIds: string[];
        try {
            authorIds = JSON.parse(authorIdsString);
            if (!Array.isArray(authorIds) || authorIds.length === 0) {
                throw new Error('Invalid authorIds format or empty array.');
            }
            console.log('Author IDs parsed:', authorIds);
        } catch (e: any) {
             console.error('PATCH Error: Invalid authorIds format:', e.message);
            return NextResponse.json({ error: 'Invalid authorIds format.' }, { status: 400 });
        }

        // --- 3. Fetch existing post data (use Admin client) ---
        console.log('Fetching existing post data...');
        const { data: existingPost, error: fetchError } = await supabaseAdmin // Use Admin Client
            .from('posts')
            .select('image_url')
            .eq('id', postId)
            .single();

        if (fetchError) {
             console.error('PATCH Error: Error fetching existing post:', fetchError);
             if (fetchError.code === 'PGRST116') { // Not found
                return NextResponse.json({ error: 'Post to update not found.' }, { status: 404 });
             }
            return NextResponse.json({ error: 'Failed to verify existing post data.' }, { status: 500 });
        }
        console.log('Existing post data fetched:', existingPost);

        // --- 4. Handle Image Update/Removal (use Admin client for storage) ---
        console.log('Handling image update/removal...');
        let imagePathToDelete: string | null = null;
        if (existingPost?.image_url) {
            try {
                const urlParts = existingPost.image_url.split('/post-images/');
                if (urlParts.length > 1) {
                    imagePathToDelete = `post-images/${urlParts[1]}`;
                    console.log('Existing image path to delete:', imagePathToDelete);
                }
            } catch (e) {
                console.error('PATCH Warning: Error parsing existing image URL:', e);
            }
        }

        if (imageFile) {
             console.log('New image file detected. Processing...');
            if (imagePathToDelete) {
                console.log('Deleting old image from storage...');
                const { error: deleteError } = await supabaseAdmin.storage // Use Admin Client
                    .from('post-images')
                    .remove([imagePathToDelete]);
                if (deleteError) {
                    console.error('PATCH Error: Error deleting old image:', deleteError);
                    return NextResponse.json({ error: `Failed to remove old image: ${deleteError.message}` }, { status: 500 });
                }
                 console.log('Old image deleted successfully.');
            }
            
            const fileExtension = imageFile.name.split('.').pop();
            const newFileName = `${uuidv4()}.${fileExtension}`;
            const newPath = `post-images/${newFileName}`;
             console.log('Uploading new image to:', newPath);

            const { error: uploadError } = await supabaseAdmin.storage // Use Admin Client
                .from('post-images')
                .upload(newPath, imageFile, {
                    cacheControl: '3600',
                    upsert: false, 
                });

            if (uploadError) {
                console.error('PATCH Error: Image upload error:', uploadError);
                return NextResponse.json({ error: `Image upload failed: ${uploadError.message}` }, { status: 500 });
            }
             console.log('New image uploaded successfully.');

            const { data: urlData } = supabaseAdmin.storage.from('post-images').getPublicUrl(newPath); // Use Admin Client
            newImageUrl = urlData?.publicUrl || null;
             console.log('New image public URL:', newImageUrl);

        } else if (removeCurrentImage) {
            console.log('Remove current image flag detected. Processing...');
            if (imagePathToDelete) {
                 console.log('Deleting image from storage due to removal flag...');
                const { error: deleteError } = await supabaseAdmin.storage // Use Admin Client
                    .from('post-images')
                    .remove([imagePathToDelete]);
                if (deleteError) {
                    console.error('PATCH Error: Error deleting image for removal:', deleteError);
                    return NextResponse.json({ error: `Failed to remove image: ${deleteError.message}` }, { status: 500 });
                }
                 console.log('Image deleted successfully due to removal flag.');
            }
            newImageUrl = null; 
        } else {
            console.log('Image unchanged. Keeping existing URL.');
            newImageUrl = existingPost?.image_url || null;
        }

        // --- 5. Update Post Data (use Admin client) ---
        console.log('Updating post data in database...');
        const updateData: { title: string; content: string; category: string | null; image_url: string | null, slug?: string } = {
            title,
            content,
            category: category || null,
            image_url: newImageUrl,
        };

        const { error: updatePostError } = await supabaseAdmin // Use Admin Client
            .from('posts')
            .update(updateData)
            .eq('id', postId);

        if (updatePostError) {
            console.error('PATCH Error: Error updating post:', updatePostError);
            return NextResponse.json({ error: `Failed to update post: ${updatePostError.message}` }, { status: 500 });
        }
        console.log('Post data updated successfully.');

        // --- 6. Update Author Associations (use Admin client) ---
        console.log('Updating author associations...');
        // a) Delete existing associations
         console.log(`Deleting old author associations for post_id: ${postId}...`);
        const deleteResponse = await supabaseAdmin // Use Admin Client
            .from('post_authors')
            .delete()
            .eq('post_id', postId);
        
        const deleteAuthorsError = deleteResponse.error;
        const deleteAuthorsData = deleteResponse.data;
        if (deleteAuthorsError) {
            console.error('PATCH Error: Error explicitly caught during deleteAuthorsError check:', JSON.stringify(deleteAuthorsError, null, 2));
             return NextResponse.json({ error: 'Failed to update author associations (delete step).', }, { status: 500 });
        } else {
             console.log('Old author associations deletion step completed without error reported by Supabase. Delete response data:', deleteAuthorsData);
        }

        // b) Insert new associations
        const newAuthorLinks = authorIds.map(authorId => ({
            post_id: postId,
            author_user_id: authorId,
        }));
        console.log('Inserting new author associations:', newAuthorLinks);

        const { error: insertAuthorsError } = await supabaseAdmin // Use Admin Client
            .from('post_authors')
            .insert(newAuthorLinks);

        if (insertAuthorsError) {
            console.error('PATCH Error: Full details of insertAuthorsError:', JSON.stringify(insertAuthorsError, null, 2)); 
            return NextResponse.json({ error: 'Failed to update author associations (insert step).' }, { status: 500 });
        }
        console.log('New author associations inserted successfully.');

        // --- 7. Return Success Response ---
        console.log('PATCH successful. Returning success response.');
        return NextResponse.json({ 
            message: 'Post updated successfully', 
            updatedImageUrl: newImageUrl
        }, { status: 200 });

    } catch (error: any) {
        console.error('--- UNEXPECTED ERROR in PATCH Handler ---', error);
        return NextResponse.json({ error: error.message || 'An unexpected server error occurred.' }, { status: 500 });
    }
}

// DELETE Handler - Refactor to use Admin Client for DB/Storage operations
export async function DELETE(request: NextRequest, context: any) {
    const params = context.params as { postId: string }; // Assert type inside
    console.log(`--- DELETE /api/admin/posts/${params.postId} ---`);
    const supabase = createClient(); // Client for auth check
    const supabaseAdmin = createAdminClient(); // Admin client for DB/Storage ops
    const postId = params.postId;

    if (!postId) {
        console.error('DELETE Error: Missing postId');
        return NextResponse.json({ error: 'Post ID is required' }, { status: 400 });
    }

    try {
        // --- 1. Verify Requesting User is Admin ---
        const { data: { user: requestingUser }, error: authError } = await supabase.auth.getUser();
        if (authError || !requestingUser) {
            console.error('DELETE Error: Auth error getting requesting user', authError);
            return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
        }
        if (requestingUser.id !== ADMIN_USER_ID) {
            console.warn(`DELETE Warning: User ${requestingUser.id} attempted unauthorized delete.`);
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }
        console.log(`Admin user ${requestingUser.id} authorized to delete post ${postId}`);

        // --- 2. Fetch Post to get Image URL (use Admin Client) ---
        console.log('Fetching post data to get image URL before delete...');
        const { data: postToDelete, error: fetchError } = await supabaseAdmin // Use Admin Client
            .from('posts')
            .select('image_url')
            .eq('id', postId)
            .single();

        if (fetchError) {
            console.error('DELETE Error: Error fetching post before delete:', fetchError);
            if (fetchError.code === 'PGRST116') { // Not found
                console.log('Post not found during pre-delete fetch, assuming already deleted.');
                return NextResponse.json({ message: 'Post already deleted or not found' }, { status: 200 });
            }
            return NextResponse.json({ error: 'Failed to verify post data before deletion.' }, { status: 500 });
        }
        console.log('Post data fetched for image URL check.');

        // --- 3. Delete Image from Storage (use Admin Client) ---
        if (postToDelete?.image_url) {
            let imagePathToDelete: string | null = null;
            try {
                const urlParts = postToDelete.image_url.split('/post-images/');
                if (urlParts.length > 1) {
                    imagePathToDelete = `post-images/${urlParts[1]}`;
                    console.log('Attempting to delete image from storage:', imagePathToDelete);
                    const { error: deleteImageError } = await supabaseAdmin.storage // Use Admin Client
                        .from('post-images')
                        .remove([imagePathToDelete]);
                    if (deleteImageError) {
                        console.error('DELETE Warning: Failed to delete image from storage:', deleteImageError);
                    } else {
                        console.log('Image deleted from storage successfully.');
                    }
                }
            } catch (e) {
                console.error('DELETE Warning: Error parsing or deleting image URL:', e);
            }
        }

        // --- 4. Delete Post from Database (use Admin Client) ---
        console.log('Attempting to delete post from database...');
        const { error: deletePostError } = await supabaseAdmin // Use Admin Client
            .from('posts')
            .delete()
            .eq('id', postId);

        if (deletePostError) {
            console.error('DELETE Error: Failed to delete post from database:', deletePostError);
            return NextResponse.json({ error: `Failed to delete post: ${deletePostError.message}` }, { status: 500 });
        }
        console.log('Post deleted from database successfully.');

        // --- 5. Return Success Response ---
        console.log('DELETE successful.');
        return NextResponse.json({ message: 'Post deleted successfully' }, { status: 200 });

    } catch (error: any) {
        console.error('--- UNEXPECTED ERROR in DELETE Handler ---', error);
        return NextResponse.json({ error: error.message || 'An unexpected server error occurred.' }, { status: 500 });
    }
}

// Optional: Add GET handler if you want to fetch post data via API too
// export async function GET(request: Request, { params }: { params: { postId: string } }) { ... }

// Optional: Add DELETE handler (though you have one at /api/admin/posts/[postId]/delete?)
// export async function DELETE(request: Request, { params }: { params: { postId: string } }) { ... } 