import type { SupabaseClient } from '@supabase/supabase-js';
import type { AssistantTrackerContext } from './assistant-context';
import { isDateOnly } from './date';

export const AI_CONSENT_POLICY_VERSION = '2026-11-24-v3';
export const AI_TRACKER_CONTEXT_POLICY_VERSION = '2026-11-24-v1';

export interface AssistantTurn {
  role: 'user' | 'assistant';
  content: string;
}

export interface AssistantResponse {
  answer: string;
  source: 'ai' | 'safety';
  model?: string;
}

function validateTrackerContext(value: AssistantTrackerContext): AssistantTrackerContext {
  const isOptionalDay = (number: number | null, minimum: number, maximum: number) =>
    number === null || (Number.isInteger(number) && number >= minimum && number <= maximum);
  if (!isOptionalDay(value.usualCycleLengthDays, 15, 60)
    || !isOptionalDay(value.usualPeriodLengthDays, 1, 10)
    || !isOptionalDay(value.recentAverageCycleDays, 15, 60)
    || !Number.isInteger(value.recordedPeriodStarts) || value.recordedPeriodStarts < 0 || value.recordedPeriodStarts > 12
    || !Number.isInteger(value.fertilityObservationsLast30Days) || value.fertilityObservationsLast30Days < 0 || value.fertilityObservationsLast30Days > 100
    || !Number.isInteger(value.positiveOpkResultsLast30Days) || value.positiveOpkResultsLast30Days < 0 || value.positiveOpkResultsLast30Days > value.fertilityObservationsLast30Days
    || !Number.isInteger(value.fertileMucusObservationsLast30Days) || value.fertileMucusObservationsLast30Days < 0 || value.fertileMucusObservationsLast30Days > value.fertilityObservationsLast30Days
    || (value.lastPeriodStart !== null && !isDateOnly(value.lastPeriodStart))
    || !Array.isArray(value.commonSymptomsLast30Days) || value.commonSymptomsLast30Days.length > 5) {
    throw new Error('The tracker summary is invalid. Refresh the page and try again.');
  }
  for (const item of value.commonSymptomsLast30Days) {
    if (!item || typeof item !== 'object' || !['Cramps', 'Headache', 'Bloating', 'Tender breasts', 'Fatigue', 'Acne', 'Backache', 'Nausea'].includes(item.symptom)
      || !Number.isInteger(item.count) || item.count < 1 || item.count > 30) {
      throw new Error('The tracker summary contains an unsupported symptom.');
    }
  }
  // Return a whitelisted object, not the caller's original object. Runtime inputs
  // may contain extra keys even when the TypeScript interface does not.
  return {
    usualCycleLengthDays: value.usualCycleLengthDays,
    usualPeriodLengthDays: value.usualPeriodLengthDays,
    recordedPeriodStarts: value.recordedPeriodStarts,
    recentAverageCycleDays: value.recentAverageCycleDays,
    lastPeriodStart: value.lastPeriodStart,
    commonSymptomsLast30Days: value.commonSymptomsLast30Days.map(({ symptom, count }) => ({ symptom, count })),
    fertilityObservationsLast30Days: value.fertilityObservationsLast30Days,
    positiveOpkResultsLast30Days: value.positiveOpkResultsLast30Days,
    fertileMucusObservationsLast30Days: value.fertileMucusObservationsLast30Days,
  };
}

export async function requestHealthAssistant(
  client: SupabaseClient,
  turns: AssistantTurn[],
  trackerContext?: AssistantTrackerContext,
): Promise<AssistantResponse> {
  if (!Array.isArray(turns) || turns.length < 1 || turns.length > 12) {
    throw new Error('The conversation is too long. Start a new chat and try again.');
  }
  const bounded = turns.slice(-10).map((turn) => {
    if (!turn || (turn.role !== 'user' && turn.role !== 'assistant') || typeof turn.content !== 'string') {
      throw new Error('The conversation contains an invalid message.');
    }
    const content = turn.content.trim();
    const maxLength = turn.role === 'user' ? 1200 : 5000;
    if (!content || content.length > maxLength) throw new Error('A chat message is empty or too long.');
    return { role: turn.role, content };
  });
  if (bounded.at(-1)?.role !== 'user') throw new Error('Send a question before requesting an answer.');

  const body: { messages: AssistantTurn[]; tracker_context?: AssistantTrackerContext } = { messages: bounded };
  if (trackerContext) body.tracker_context = validateTrackerContext(trackerContext);
  const { data, error } = await client.functions.invoke('health-assistant', { body });
  if (error) throw new Error("The AI service is busy or unavailable. CycleCue's offline guide is ready instead.");
  const answer = data && typeof data.answer === 'string' ? data.answer.trim() : '';
  if (!answer || answer.length > 5000) throw new Error('The AI provider returned an invalid response.');
  return {
    answer,
    source: data.source === 'safety_fallback' ? 'safety' : 'ai',
    model: typeof data.model === 'string' ? data.model : undefined,
  };
}

async function saveConsent(client: SupabaseClient, consentType: 'ai_context' | 'ai_tracker_context', policyVersion: string, granted: boolean): Promise<void> {
  const { error } = await client.from('user_consents').upsert({
    consent_type: consentType,
    granted,
    policy_version: policyVersion,
  }, { onConflict: 'user_id,consent_type,policy_version' });
  if (error) throw new Error('Your AI privacy preference could not be saved.');
}

async function loadConsent(client: SupabaseClient, consentType: 'ai_context' | 'ai_tracker_context', policyVersion: string): Promise<boolean> {
  const { data, error } = await client.from('user_consents')
    .select('granted')
    .eq('consent_type', consentType)
    .eq('policy_version', policyVersion)
    .order('recorded_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error('Your AI privacy preference could not be loaded.');
  return data?.granted === true;
}

export function saveAiConsent(client: SupabaseClient, granted: boolean): Promise<void> {
  return saveConsent(client, 'ai_context', AI_CONSENT_POLICY_VERSION, granted);
}

export function loadAiConsent(client: SupabaseClient): Promise<boolean> {
  return loadConsent(client, 'ai_context', AI_CONSENT_POLICY_VERSION);
}

export function saveTrackerContextConsent(client: SupabaseClient, granted: boolean): Promise<void> {
  return saveConsent(client, 'ai_tracker_context', AI_TRACKER_CONTEXT_POLICY_VERSION, granted);
}

export function loadTrackerContextConsent(client: SupabaseClient): Promise<boolean> {
  return loadConsent(client, 'ai_tracker_context', AI_TRACKER_CONTEXT_POLICY_VERSION);
}
