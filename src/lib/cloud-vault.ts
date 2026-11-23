import type { SupabaseClient, User } from '@supabase/supabase-js';
import type { TrackerState } from '../types';
import { isTrackerState } from './storage';

const MAX_VAULT_BYTES = 220 * 1024;

export async function backupTrackerState(client: SupabaseClient, user: User, state: TrackerState): Promise<void> {
  if (!isTrackerState(state)) throw new Error('Your local tracker data is invalid and cannot be backed up.');
  const serialized = JSON.stringify(state);
  if (new TextEncoder().encode(serialized).byteLength > MAX_VAULT_BYTES) {
    throw new Error('Your tracker backup is too large. Export your data and contact support.');
  }
  const { error } = await client.from('user_health_vault').upsert({
    user_id: user.id,
    user_data: state,
    updated_at: new Date().toISOString(),
  }, { onConflict: 'user_id' });
  if (error) throw new Error('Cloud backup could not be saved. Check your connection and database setup.');
}

export async function restoreTrackerState(client: SupabaseClient, user: User): Promise<TrackerState | null> {
  const { data, error } = await client.from('user_health_vault').select('user_data').eq('user_id', user.id).maybeSingle();
  if (error) throw new Error('Cloud backup could not be loaded. Check your connection and permissions.');
  if (!data) return null;
  if (!isTrackerState(data.user_data)) throw new Error('The cloud backup is not in a supported format. Your local data has not been changed.');
  return data.user_data;
}
