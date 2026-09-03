import { supabase, STORAGE_BUCKET } from '@/lib/supabase';
import type { FileItem } from '@/types';
import { logActivity } from './activityService';

export async function getFiles(folderId: string | null): Promise<FileItem[]> {
  let query = supabase.from('files').select('*').eq('trashed', false);

  if (folderId === null) {
    query = query.is('folder_id', null);
  } else {
    query = query.eq('folder_id', folderId);
  }

  const { data, error } = await query.order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getStarredFiles(): Promise<FileItem[]> {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('starred', true)
    .eq('trashed', false)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getRecentFiles(limit = 20): Promise<FileItem[]> {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('trashed', false)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getTrashedFiles(): Promise<FileItem[]> {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('trashed', true)
    .order('trashed_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getFileById(id: string): Promise<FileItem | null> {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function searchFiles(query: string): Promise<FileItem[]> {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('trashed', false)
    .ilike('name', `%${query}%`)
    .order('updated_at', { ascending: false })
    .limit(50);

  if (error) throw error;
  return data;
}

export async function uploadFile(
  file: File,
  folderId: string | null,
  userId: string,
  onProgress?: (progress: number) => void
): Promise<FileItem> {
  const fileId = crypto.randomUUID();
  const storagePath = `${userId}/${fileId}/${file.name}`;

  let uploadError: unknown = null;
  try {
    const result = await supabase.storage.from(STORAGE_BUCKET).upload(storagePath, file);
    uploadError = result.error;
  } catch (e) {
    uploadError = e;
  }

  if (uploadError) throw uploadError;

  if (uploadError) throw uploadError;

  const { data, error } = await supabase
    .from('files')
    .insert({
      id: fileId,
      name: file.name,
      folder_id: folderId,
      storage_path: storagePath,
      mime_type: file.type || 'application/octet-stream',
      size_bytes: file.size,
    })
    .select()
    .single();

  if (error) throw error;

  await logActivity('file', fileId, 'uploaded', { name: file.name, size: file.size });
  return data;
}

export async function renameFile(id: string, name: string): Promise<FileItem> {
  const { data, error } = await supabase
    .from('files')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  await logActivity('file', id, 'renamed', { name });
  return data;
}

export async function moveFile(id: string, folderId: string | null): Promise<FileItem> {
  const { data, error } = await supabase
    .from('files')
    .update({ folder_id: folderId, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  await logActivity('file', id, 'moved', { folder_id: folderId });
  return data;
}

export async function trashFile(id: string): Promise<void> {
  const { error } = await supabase
    .from('files')
    .update({ trashed: true, trashed_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
  await logActivity('file', id, 'deleted', {});
}

export async function restoreFile(id: string): Promise<void> {
  const { error } = await supabase
    .from('files')
    .update({ trashed: false, trashed_at: null, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
  await logActivity('file', id, 'restored', {});
}

export async function deleteFilePermanently(id: string, storagePath: string): Promise<void> {
  const { error: storageError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .remove([storagePath]);

  if (storageError) throw storageError;

  const { error } = await supabase.from('files').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleFileStar(id: string, starred: boolean): Promise<void> {
  const { error } = await supabase
    .from('files')
    .update({ starred, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
  await logActivity('file', id, starred ? 'starred' : 'unstarred', {});
}

export async function getDownloadUrl(storagePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .createSignedUrl(storagePath, 3600);

  if (error) throw error;
  return data.signedUrl;
}

export async function getPublicUrl(storagePath: string): Promise<string> {
  const { data } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(storagePath);
  return data.publicUrl;
}
