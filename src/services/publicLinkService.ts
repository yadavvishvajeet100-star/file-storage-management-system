import { supabase } from '@/lib/supabase';
import type { PublicLink, ItemType, Permission } from '@/types';

export async function createPublicLink(
  itemType: ItemType,
  itemId: string,
  options?: { permission?: Permission; password?: string; expiresAt?: string }
): Promise<PublicLink> {
  const insertData: Record<string, unknown> = {
    item_type: itemType,
    item_id: itemId,
    permission: options?.permission || 'viewer',
  };

  if (options?.expiresAt) {
    insertData.expires_at = options.expiresAt;
  }

  const { data, error } = await supabase
    .from('public_links')
    .insert(insertData)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getPublicLinks(itemId: string): Promise<PublicLink[]> {
  const { data, error } = await supabase
    .from('public_links')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function getPublicLinkByToken(token: string): Promise<PublicLink | null> {
  const { data, error } = await supabase
    .from('public_links')
    .select('*')
    .eq('token', token)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function disablePublicLink(id: string): Promise<void> {
  const { error } = await supabase
    .from('public_links')
    .update({ disabled: true })
    .eq('id', id);

  if (error) throw error;
}

export async function deletePublicLink(id: string): Promise<void> {
  const { error } = await supabase.from('public_links').delete().eq('id', id);
  if (error) throw error;
}
