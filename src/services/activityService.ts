import { supabase } from '@/lib/supabase';
import type { FileActivity } from '@/types';

export async function logActivity(
  itemType: string,
  itemId: string,
  action: string,
  metadata?: Record<string, unknown>
): Promise<void> {
  const { error } = await supabase.from('file_activities').insert({
    item_type: itemType,
    item_id: itemId,
    action,
    metadata: metadata || null,
  });

  if (error) console.error('Failed to log activity:', error);
}

export async function getActivities(itemId: string): Promise<FileActivity[]> {
  const { data, error } = await supabase
    .from('file_activities')
    .select('*')
    .eq('item_id', itemId)
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw error;
  return data;
}
