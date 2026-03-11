
-- Update the videos bucket to allow files up to 5GB (5368709120 bytes)
UPDATE storage.buckets SET file_size_limit = 5368709120 WHERE id = 'videos';
