-- Storage policies for error-images bucket

-- Create the bucket if it doesn't exist (for reference)
-- This should be done manually in Supabase Dashboard: Storage > New Bucket > "error-images" (Public)

-- Enable RLS on the storage.objects table
-- This is already enabled by default, but we need policies

-- Policy to allow authenticated users to upload their own images
CREATE POLICY "Users can upload own error images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'error-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow users to update their own images
CREATE POLICY "Users can update own error images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'error-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow users to delete their own images
CREATE POLICY "Users can delete own error images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'error-images' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy to allow everyone to read images (since bucket is public)
-- If you want only authenticated users to view, change 'public' to 'authenticated'
CREATE POLICY "Anyone can view error images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'error-images');


