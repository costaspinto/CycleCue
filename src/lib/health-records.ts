import type { SupabaseClient, User } from '@supabase/supabase-js';

export type HealthRecordType =
  | 'period'
  | 'symptom_checkin'
  | 'fertility_observation'
  | 'pregnancy_profile'
  | 'pregnancy_checkin'
  | 'nutrition_log'
  | 'activity_log'
  | 'habit_log'
  | 'sexual_wellness_note'
  | 'appointment'
  | 'medication_reminder'
  | 'health_note';

export interface HealthRecord<TPayload extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  user_id: string;
  record_type: HealthRecordType;
  record_date: string | null;
  payload: TPayload;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

const MAX_PAYLOAD_BYTES = 48 * 1024;

function assertPayload(payload: Record<string, unknown>): void {
  const encoded = JSON.stringify(payload);
  if (encoded.length > MAX_PAYLOAD_BYTES) throw new Error('This record is too large to save. Remove large attachments and try again.');
  if (!encoded || encoded === '{}' || encoded === 'null') throw new Error('Add some information before saving.');
}

export async function createHealthRecord<T extends Record<string, unknown>>(
  client: SupabaseClient,
  _user: User,
  input: { recordType: HealthRecordType; recordDate?: string | null; payload: T },
): Promise<HealthRecord<T>> {
  assertPayload(input.payload);
  const { data, error } = await client.from('health_records').insert({
    record_type: input.recordType,
    record_date: input.recordDate ?? null,
    payload: input.payload,
  }).select('*').single();
  if (error || !data) throw new Error('Could not save this health record. Check your connection and permissions.');
  return data as HealthRecord<T>;
}

export async function listHealthRecords<T extends Record<string, unknown> = Record<string, unknown>>(
  client: SupabaseClient,
  _user: User,
  options: { recordTypes?: HealthRecordType[]; includeDeleted?: boolean; limit?: number } = {},
): Promise<HealthRecord<T>[]> {
  const limit = Math.min(Math.max(options.limit ?? 250, 1), 500);
  let query = client.from('health_records').select('*').order('record_date', { ascending: false, nullsFirst: false }).limit(limit);
  if (options.recordTypes?.length) query = query.in('record_type', options.recordTypes);
  query = options.includeDeleted ? query.not('deleted_at', 'is', null) : query.is('deleted_at', null);
  const { data, error } = await query;
  if (error) throw new Error('Could not load your health records. Please retry.');
  return (data ?? []) as HealthRecord<T>[];
}

export async function softDeleteHealthRecord(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('health_records').update({ deleted_at: new Date().toISOString() }).eq('id', id).is('deleted_at', null);
  if (error) throw new Error('Could not move this record to the Recycle Bin.');
}

export async function restoreHealthRecord(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('health_records').update({ deleted_at: null }).eq('id', id).not('deleted_at', 'is', null);
  if (error) throw new Error('Could not restore this record. It may have expired or already been restored.');
}

export async function permanentlyDeleteHealthRecord(client: SupabaseClient, id: string): Promise<void> {
  const { error } = await client.from('health_records').delete().eq('id', id).not('deleted_at', 'is', null);
  if (error) throw new Error('Could not permanently delete this record.');
}
