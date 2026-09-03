import { supabase } from '@/lib/supabase';
import type { Folder } from '@/types';
import { logActivity } from './activityService';

export async function getFolders(parentId: string | null): Promise<Folder[]> {
  let query = supabase.from('folders').select('*').eq('trashed', false);

  if (parentId === null) {
    query = query.is('parent_id', null);
  } else {
    query = query.eq('parent_id', parentId);
  }

  const { data, error } = await query.order('name', { ascending: true });
  if (error) throw error;
  return data;
}

export async function getAllFolders(): Promise<Folder[]> {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('trashed', false)
    .order('name', { ascending: true });

  if (error) throw error;
  return data;
}

export async function getTrashedFolders(): Promise<Folder[]> {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('trashed', true)
    .order('trashed_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getStarredFolders(): Promise<Folder[]> {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('starred', true)
    .eq('trashed', false)
    .order('updated_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getRecentFolders(limit = 10): Promise<Folder[]> {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('trashed', false)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data;
}

export async function getFolderById(id: string): Promise<Folder | null> {
  const { data, error } = await supabase
    .from('folders')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createFolder(name: string, parentId: string | null): Promise<Folder> {
  const { data, error } = await supabase
    .from('folders')
    .insert({ name, parent_id: parentId })
    .select()
    .single();

  if (error) throw error;

  await logActivity('folder', data.id, 'created', { name });
  return data;
}

export async function renameFolder(id: string, name: string): Promise<Folder> {
  const { data, error } = await supabase
    .from('folders')
    .update({ name, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await logActivity('folder', id, 'renamed', { name });
  return data;
}

export async function moveFolder(id: string, parentId: string | null): Promise<Folder> {
  const { data, error } = await supabase
    .from('folders')
    .update({ parent_id: parentId, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;

  await logActivity('folder', id, 'moved', { parent_id: parentId });
  return data;
}

export async function deleteFolder(id: string): Promise<void> {
  const { error } = await supabase.from('folders').delete().eq('id', id);
  if (error) throw error;
}

export async function trashFolder(id: string): Promise<void> {
  const { error } = await supabase
    .from('folders')
    .update({ trashed: true, trashed_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
  await logActivity('folder', id, 'deleted', {});
}

export async function restoreFolder(id: string): Promise<void> {
  const { error } = await supabase
    .from('folders')
    .update({ trashed: false, trashed_at: null, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
  await logActivity('folder', id, 'restored', {});
}

export async function toggleFolderStar(id: string, starred: boolean): Promise<void> {
  const { error } = await supabase
    .from('folders')
    .update({ starred, updated_at: new Date().toISOString() })
    .eq('id', id);

  if (error) throw error;
  await logActivity('folder', id, starred ? 'starred' : 'unstarred', {});
}
