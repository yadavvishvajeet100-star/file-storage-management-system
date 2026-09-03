import { supabase } from '@/lib/supabase';
import type { Share, ItemType, Permission } from '@/types';

export async function getShares(itemId: string): Promise<Share[]> {
  const { data, error } = await supabase
    .from('shares')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}

export async function createShare(
  itemType: ItemType,
  itemId: string,
  sharedWithEmail: string,
  permission: Permission
): Promise<Share> {
  const { data, error } = await supabase
    .from('shares')
    .insert({
      item_type: itemType,
      item_id: itemId,
      shared_with_email: sharedWithEmail,
      permission,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateShare(shareId: string, permission: Permission): Promise<Share> {
  const { data, error } = await supabase
    .from('shares')
    .update({ permission })
    .eq('id', shareId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeShare(shareId: string): Promise<void> {
  const { error } = await supabase.from('shares').delete().eq('id', shareId);
  if (error) throw error;
}

export async function getSharedWithMe(): Promise<Share[]> {
  const { data: userData } = await supabase.auth.getUser();
  if (!userData.user?.email) return [];

  const { data, error } = await supabase
    .from('shares')
    .select('*')
    .eq('shared_with_email', userData.user.email)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
