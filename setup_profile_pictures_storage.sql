-- Enable storage for profile pictures bucket if not already enabled
-- Note: This assumes the 'profile_pictures' bucket already exists

-- Enable RLS on the profile_pictures bucket
UPDATE storage.buckets SET public = true WHERE id = 'profile_pictures';

-- Policy to allow users to upload their own profile pictures
CREATE POLICY "Users can upload their own profile pictures" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'profile_pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to view all profile pictures (public read)
CREATE POLICY "Profile pictures are publicly viewable" ON storage.objects
FOR SELECT USING (bucket_id = 'profile_pictures');

-- Policy to allow users to update their own profile pictures
CREATE POLICY "Users can update their own profile pictures" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'profile_pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Policy to allow users to delete their own profile pictures
CREATE POLICY "Users can delete their own profile pictures" ON storage.objects
FOR DELETE USING (
  bucket_id = 'profile_pictures' 
  AND auth.uid()::text = (storage.foldername(name))[1]
); 