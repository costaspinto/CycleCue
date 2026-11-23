import { describe, expect, it, vi } from 'vitest';
import type { SupabaseClient } from '@supabase/supabase-js';
import { AI_CONSENT_POLICY_VERSION, requestHealthAssistant, type AssistantTurn } from '../lib/ai-client';
import type { AssistantTrackerContext } from '../lib/assistant-context';

function mockClient(result: { data: unknown; error: unknown }) {
  const invoke = vi.fn().mockResolvedValue(result);
  const client = { functions: { invoke } } as unknown as SupabaseClient;
  return { client, invoke };
}

describe('AI companion request contract', () => {
  it('uses an explicit, versioned AI consent policy', () => {
    expect(AI_CONSENT_POLICY_VERSION).toBe('2026-11-24-v3');
  });

  it('sends bounded recent chat context to the authenticated Edge Function', async () => {
    const { client, invoke } = mockClient({ data: { answer: 'A general educational answer.' }, error: null });
    const turns: AssistantTurn[] = Array.from({ length: 12 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' : 'assistant',
      content: `message ${index}`,
    })) as AssistantTurn[];
    // The backend contract requires the newest message to be from the user.
    turns[11] = { role: 'user', content: 'Latest question?' };
    await expect(requestHealthAssistant(client, turns)).resolves.toEqual({ answer: 'A general educational answer.', source: 'ai' });
    expect(invoke).toHaveBeenCalledWith('health-assistant', {
      body: { messages: expect.arrayContaining([{ role: 'user', content: 'Latest question?' }]) },
    });
    const sent = invoke.mock.calls[0]?.[1] as { body: { messages: AssistantTurn[] } };
    expect(sent.body.messages).toHaveLength(10);
  });

  it('rejects oversized or malformed messages before calling the function', async () => {
    const { client, invoke } = mockClient({ data: { answer: 'unused' }, error: null });
    await expect(requestHealthAssistant(client, [])).rejects.toThrow('conversation is too long');
    await expect(requestHealthAssistant(client, [{ role: 'user', content: 'x'.repeat(1201) }])).rejects.toThrow('empty or too long');
    await expect(requestHealthAssistant(client, [{ role: 'assistant', content: 'Not a question.' }])).rejects.toThrow('Send a question');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('rejects malformed provider responses', async () => {
    const { client } = mockClient({ data: { answer: ' ' }, error: null });
    await expect(requestHealthAssistant(client, [{ role: 'user', content: 'What is a cycle?' }])).rejects.toThrow('invalid response');
  });

  it('labels urgent server-side fallback responses as safety guidance', async () => {
    const { client } = mockClient({ data: { answer: 'Seek urgent care now.', source: 'safety_fallback' }, error: null });
    await expect(requestHealthAssistant(client, [{ role: 'user', content: 'I have sudden severe pain.' }])).resolves.toEqual({ answer: 'Seek urgent care now.', source: 'safety' });
  });



  it('sends only a whitelisted, opt-in tracker summary', async () => {
    const { client, invoke } = mockClient({ data: { answer: 'Your recent entries show a pattern, but they do not confirm ovulation.' }, error: null });
    const trackerContext: AssistantTrackerContext & { email?: string } = {
      usualCycleLengthDays: 29,
      usualPeriodLengthDays: 5,
      recordedPeriodStarts: 3,
      recentAverageCycleDays: 29,
      lastPeriodStart: '2026-10-29',
      commonSymptomsLast30Days: [{ symptom: 'Cramps', count: 2 }],
      fertilityObservationsLast30Days: 1,
      positiveOpkResultsLast30Days: 1,
      fertileMucusObservationsLast30Days: 1,
      email: 'should-not-be-sent@example.com',
    };
    await requestHealthAssistant(client, [{ role: 'user', content: 'Explain my recent pattern.' }], trackerContext);
    const request = invoke.mock.calls[0]?.[1] as { body: { tracker_context: Record<string, unknown> } };
    expect(request.body.tracker_context).toEqual({
      usualCycleLengthDays: 29,
      usualPeriodLengthDays: 5,
      recordedPeriodStarts: 3,
      recentAverageCycleDays: 29,
      lastPeriodStart: '2026-10-29',
      commonSymptomsLast30Days: [{ symptom: 'Cramps', count: 2 }],
      fertilityObservationsLast30Days: 1,
      positiveOpkResultsLast30Days: 1,
      fertileMucusObservationsLast30Days: 1,
    });
    expect(request.body.tracker_context).not.toHaveProperty('email');
  });

  it('rejects tracker summaries outside the approved field ranges', async () => {
    const { client, invoke } = mockClient({ data: { answer: 'unused' }, error: null });
    const invalidContext = {
      usualCycleLengthDays: 2,
      usualPeriodLengthDays: 5,
      recordedPeriodStarts: 3,
      recentAverageCycleDays: 29,
      lastPeriodStart: null,
      commonSymptomsLast30Days: [],
      fertilityObservationsLast30Days: 0,
      positiveOpkResultsLast30Days: 0,
      fertileMucusObservationsLast30Days: 0,
    } as AssistantTrackerContext;
    await expect(requestHealthAssistant(client, [{ role: 'user', content: 'Explain my data.' }], invalidContext))
      .rejects.toThrow('tracker summary is invalid');
    expect(invoke).not.toHaveBeenCalled();
  });

  it('uses a safe error when the Edge Function is unavailable', async () => {
    const { client } = mockClient({ data: null, error: new Error('network detail') });
    await expect(requestHealthAssistant(client, [{ role: 'user', content: 'What is a cycle?' }])).rejects.toThrow('offline guide is ready instead');
  });
});
