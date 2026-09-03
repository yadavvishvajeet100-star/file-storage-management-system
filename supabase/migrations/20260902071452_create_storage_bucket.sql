/*
# Storage Bucket for Cloud Files

Creates a private storage bucket `cloud-files` for storing user-uploaded files.
Files are stored at path: `{user_id}/{file_id}/{filename}`

## Storage Policies

- SELECT: authenticated users can read objects they own (path starts with their user_id)
- INSERT: authenticated users can upload to their own path prefix
- UPDATE: authenticated users can update objects in their own path prefix
- DELETE: authenticated users can delete objects in their own path prefix
*/

INSERT INTO storage.buckets (id, name, public)
VALUES ('cloud-files', 'cloud-files', false)
ON CONFLICT (id) DO NOTHING;

-- SELECT: users can read their own files
DROP POLICY IF EXISTS "read_own_files" ON storage.objects;
CREATE POLICY "read_own_files" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'cloud-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- INSERT: users can upload to their own folder
DROP POLICY IF EXISTS "insert_own_files" ON storage.objects;
CREATE POLICY "insert_own_files" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'cloud-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- UPDATE: users can update their own files
DROP POLICY IF EXISTS "update_own_files" ON storage.objects;
CREATE POLICY "update_own_files" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'cloud-files' AND (storage.foldername(name))[1] = auth.uid()::text)
  WITH CHECK (bucket_id = 'cloud-files' AND (storage.foldername(name))[1] = auth.uid()::text);

-- DELETE: users can delete their own files
DROP POLICY IF EXISTS "delete_own_files" ON storage.objects;
CREATE POLICY "delete_own_files" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'cloud-files' AND (storage.foldername(name))[1] = auth.uid()::text);
