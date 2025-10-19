-- Add image_url column to notions table
ALTER TABLE notions 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment
COMMENT ON COLUMN notions.image_url IS 'URL of the image associated with the notion';

