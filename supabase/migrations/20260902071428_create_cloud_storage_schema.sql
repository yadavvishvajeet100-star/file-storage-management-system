/*
# Cloud Storage SaaS Schema

Creates the full database schema for a Google Drive / Dropbox-style cloud file storage application.

## New Tables

1. `profiles` — extends `auth.users` with display name and avatar URL.
   - `id` (uuid, PK, references auth.users)
   - `display_name` (text)
   - `avatar_url` (text, nullable)
   - `storage_limit_bytes` (bigint, default 5GB)
   - `created_at`, `updated_at`

2. `folders` — user-owned folders with nesting via `parent_id`.
   - `id` (uuid, PK)
   - `name` (text)
   - `owner_id` (uuid, references auth.users)
   - `parent_id` (uuid, nullable, self-reference for nesting)
   - `starred` (boolean, default false)
   - `trashed` (boolean, default false)
   - `trashed_at` (timestamptz, nullable)
   - `created_at`, `updated_at`

3. `files` — user-owned file metadata. Actual binary stored in Supabase Storage.
   - `id` (uuid, PK)
   - `name` (text)
   - `owner_id` (uuid, references auth.users)
   - `folder_id` (uuid, nullable, references folders)
   - `storage_path` (text) — path in the storage bucket
   - `mime_type` (text)
   - `size_bytes` (bigint)
   - `starred` (boolean, default false)
   - `trashed` (boolean, default false)
   - `trashed_at` (timestamptz, nullable)
   - `created_at`, `updated_at`

4. `shares` — per-user sharing grants for files and folders.
   - `id` (uuid, PK)
   - `item_type` (text: 'file' | 'folder')
   - `item_id` (uuid)
   - `shared_with_email` (text)
   - `shared_by` (uuid, references auth.users)
   - `permission` (text: 'viewer' | 'editor')
   - `created_at`

5. `public_links` — public, optionally password-protected / expiring links.
   - `id` (uuid, PK)
   - `token` (text, unique)
   - `item_type` (text: 'file' | 'folder')
   - `item_id` (uuid)
   - `created_by` (uuid, references auth.users)
   - `permission` (text: 'viewer' | 'editor')
   - `password_hash` (text, nullable)
   - `expires_at` (timestamptz, nullable)
   - `disabled` (boolean, default false)
   - `created_at`

6. `file_activities` — audit log of actions on files/folders.
   - `id` (uuid, PK)
   - `item_type` (text)
   - `item_id` (uuid)
   - `user_id` (uuid, references auth.users)
   - `action` (text: uploaded, renamed, moved, shared, deleted, restored, starred, unstarred, created)
   - `metadata` (jsonb, nullable)
   - `created_at`

## Security (RLS)

- All tables have RLS enabled.
- Owner-scoped CRUD on folders, files, file_activities.
- Profiles: users can read/update only their own profile.
- Shares: shared user (by email matching auth.users) can read; sharer can CRUD.
- Public links: anyone can read by token (anon + authenticated); only creator can manage.
- All owner columns default to `auth.uid()` where the client inserts without specifying owner.
*/

-- Profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL DEFAULT '',
  avatar_url text,
  storage_limit_bytes bigint NOT NULL DEFAULT 5368709120,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_profile" ON profiles;
CREATE POLICY "select_own_profile" ON profiles FOR SELECT
  TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "insert_own_profile" ON profiles;
CREATE POLICY "insert_own_profile" ON profiles FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "update_own_profile" ON profiles;
CREATE POLICY "update_own_profile" ON profiles FOR UPDATE
  TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Folders table
CREATE TABLE IF NOT EXISTS folders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id uuid REFERENCES folders(id) ON DELETE CASCADE,
  starred boolean NOT NULL DEFAULT false,
  trashed boolean NOT NULL DEFAULT false,
  trashed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_folders_owner ON folders(owner_id);
CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_folders_trashed ON folders(trashed);

ALTER TABLE folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_folders" ON folders;
CREATE POLICY "select_own_folders" ON folders FOR SELECT
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "insert_own_folders" ON folders;
CREATE POLICY "insert_own_folders" ON folders FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_folders" ON folders;
CREATE POLICY "update_own_folders" ON folders FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_folders" ON folders;
CREATE POLICY "delete_own_folders" ON folders FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- Files table
CREATE TABLE IF NOT EXISTS files (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  folder_id uuid REFERENCES folders(id) ON DELETE SET NULL,
  storage_path text NOT NULL,
  mime_type text NOT NULL DEFAULT 'application/octet-stream',
  size_bytes bigint NOT NULL DEFAULT 0,
  starred boolean NOT NULL DEFAULT false,
  trashed boolean NOT NULL DEFAULT false,
  trashed_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_files_owner ON files(owner_id);
CREATE INDEX IF NOT EXISTS idx_files_folder ON files(folder_id);
CREATE INDEX IF NOT EXISTS idx_files_starred ON files(starred);
CREATE INDEX IF NOT EXISTS idx_files_trashed ON files(trashed);

ALTER TABLE files ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_files" ON files;
CREATE POLICY "select_own_files" ON files FOR SELECT
  TO authenticated USING (auth.uid() = owner_id);

DROP POLICY IF EXISTS "insert_own_files" ON files;
CREATE POLICY "insert_own_files" ON files FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "update_own_files" ON files;
CREATE POLICY "update_own_files" ON files FOR UPDATE
  TO authenticated USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

DROP POLICY IF EXISTS "delete_own_files" ON files;
CREATE POLICY "delete_own_files" ON files FOR DELETE
  TO authenticated USING (auth.uid() = owner_id);

-- Shares table
CREATE TABLE IF NOT EXISTS shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL CHECK (item_type IN ('file', 'folder')),
  item_id uuid NOT NULL,
  shared_with_email text NOT NULL,
  shared_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text NOT NULL DEFAULT 'viewer' CHECK (permission IN ('viewer', 'editor')),
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_shares_shared_by ON shares(shared_by);
CREATE INDEX IF NOT EXISTS idx_shares_email ON shares(shared_with_email);

ALTER TABLE shares ENABLE ROW LEVEL SECURITY;

-- Users can see shares they created OR shares where they are the recipient (email match)
DROP POLICY IF EXISTS "select_shares" ON shares;
CREATE POLICY "select_shares" ON shares FOR SELECT
  TO authenticated USING (
    auth.uid() = shared_by
    OR shared_with_email IN (SELECT email FROM auth.users WHERE id = auth.uid())
  );

DROP POLICY IF EXISTS "insert_shares" ON shares;
CREATE POLICY "insert_shares" ON shares FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = shared_by);

DROP POLICY IF EXISTS "update_shares" ON shares;
CREATE POLICY "update_shares" ON shares FOR UPDATE
  TO authenticated USING (auth.uid() = shared_by) WITH CHECK (auth.uid() = shared_by);

DROP POLICY IF EXISTS "delete_shares" ON shares;
CREATE POLICY "delete_shares" ON shares FOR DELETE
  TO authenticated USING (auth.uid() = shared_by);

-- Public links table
CREATE TABLE IF NOT EXISTS public_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token text UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  item_type text NOT NULL CHECK (item_type IN ('file', 'folder')),
  item_id uuid NOT NULL,
  created_by uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  permission text NOT NULL DEFAULT 'viewer' CHECK (permission IN ('viewer', 'editor')),
  password_hash text,
  expires_at timestamptz,
  disabled boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_public_links_token ON public_links(token);
CREATE INDEX IF NOT EXISTS idx_public_links_creator ON public_links(created_by);

ALTER TABLE public_links ENABLE ROW LEVEL SECURITY;

-- Anyone (including anon) can look up a public link by token
DROP POLICY IF EXISTS "select_public_links" ON public_links;
CREATE POLICY "select_public_links" ON public_links FOR SELECT
  TO anon, authenticated USING (true);

-- Only the creator can insert/update/delete their own public links
DROP POLICY IF EXISTS "insert_public_links" ON public_links;
CREATE POLICY "insert_public_links" ON public_links FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "update_public_links" ON public_links;
CREATE POLICY "update_public_links" ON public_links FOR UPDATE
  TO authenticated USING (auth.uid() = created_by) WITH CHECK (auth.uid() = created_by);

DROP POLICY IF EXISTS "delete_public_links" ON public_links;
CREATE POLICY "delete_public_links" ON public_links FOR DELETE
  TO authenticated USING (auth.uid() = created_by);

-- File activities table
CREATE TABLE IF NOT EXISTS file_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  item_type text NOT NULL,
  item_id uuid NOT NULL,
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  action text NOT NULL,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activities_user ON file_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activities_item ON file_activities(item_id);

ALTER TABLE file_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_activities" ON file_activities;
CREATE POLICY "select_own_activities" ON file_activities FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_activities" ON file_activities;
CREATE POLICY "insert_own_activities" ON file_activities FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to get storage usage for a user
CREATE OR REPLACE FUNCTION public.get_storage_usage(p_user_id uuid)
RETURNS TABLE (used_bytes bigint, limit_bytes bigint) AS $$
BEGIN
  RETURN QUERY
    SELECT
      COALESCE(SUM(f.size_bytes), 0)::bigint AS used_bytes,
      COALESCE((SELECT storage_limit_bytes FROM profiles WHERE id = p_user_id), 5368709120)::bigint AS limit_bytes
    FROM files f
    WHERE f.owner_id = p_user_id AND f.trashed = false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
