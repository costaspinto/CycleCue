import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { Bot, CalendarDays, Check, Clipboard, LockKeyhole, RotateCcw, Send, ShieldCheck, Sparkles, Trash2, UserRound } from 'lucide-react';
import type { TrackerState } from '../types';
import { useAuth } from '../auth/auth-context';
import { supabase } from '../lib/supabase';
import {
  AI_CONSENT_POLICY_VERSION,
  loadAiConsent,
  loadTrackerContextConsent,
  requestHealthAssistant,
  saveAiConsent,
  saveTrackerContextConsent,
  type AssistantTurn,
} from '../lib/ai-client';
import { buildAssistantTrackerContext } from '../lib/assistant-context';
import { getAssistantReply } from '../lib/assistant';

type MessageSource = 'offline' | 'ai' | 'safety';
type ChatMessage = { id: string; role: 'assistant' | 'user'; text: string; source?: MessageSource; model?: string };

const WELCOME: ChatMessage = {
  id: 'welcome', role: 'assistant', source: 'offline',
  text: 'Welcome to CycleCue. Ask me about cycle patterns, fertility observations, pregnancy dating, sexual wellness, nutrition or everyday habits. I can explain your tracker summary when you choose to share it. I provide general education, not diagnosis or personal medical care.',
};
const SUGGESTIONS = [
  'Explain my recent cycle pattern',
  'What can an OPK tell me?',
  'What does an estimated due date mean?',
  'How can I manage period cramps safely?',
];

function createMessage(role: ChatMessage['role'], text: string, source?: MessageSource, model?: string): ChatMessage {
  return { id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`, role, text, source, model };
}

export function Assistant({ state, onOpenAccount }: { state: TrackerState; onOpenAccount: () => void }) {
  const auth = useAuth();
  const userId = auth.user?.id ?? null;
  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [aiConsent, setAiConsent] = useState(false);
  const [trackerContextConsent, setTrackerContextConsent] = useState(false);
  const [consentBusy, setConsentBusy] = useState(false);
  const [consentLoadedFor, setConsentLoadedFor] = useState<string | null>(null);
  const [consentNotice, setConsentNotice] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const consentReady = Boolean(userId && consentLoadedFor === userId);
  const aiAvailable = Boolean(userId && supabase && consentReady && aiConsent);

  useEffect(() => {
    if (!supabase || !userId) return;
    let active = true;
    const requestedUserId = userId;
    void Promise.all([loadAiConsent(supabase), loadTrackerContextConsent(supabase)]).then(([aiGranted, contextGranted]) => {
      if (!active) return;
      setAiConsent(aiGranted);
      setTrackerContextConsent(contextGranted);
      setConsentLoadedFor(requestedUserId);
    }).catch(() => {
      if (!active) return;
      setAiConsent(false);
      setTrackerContextConsent(false);
      setConsentLoadedFor(requestedUserId);
      setConsentNotice('Your AI privacy settings could not be loaded. AI and tracker sharing remain disabled until you choose again.');
    }).finally(() => { if (active) setConsentBusy(false); });
    return () => { active = false; };
  }, [userId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, busy]);

  const changeAiConsent = async (granted: boolean) => {
    const requestedUserId = userId;
    if (!supabase || !requestedUserId) return;
    setConsentBusy(true);
    setConsentNotice('');
    try {
      await saveAiConsent(supabase, granted);
      setAiConsent(granted);
      setConsentLoadedFor(requestedUserId);
      setConsentNotice(granted
        ? `AI chat enabled under privacy policy ${AI_CONSENT_POLICY_VERSION}. Only your conversation is sent unless you separately enable tracker-summary sharing.`
        : 'AI chat disabled. The offline guide remains available.');
    } catch (error) {
      setConsentNotice(error instanceof Error ? error.message : 'Could not update your AI preference.');
    } finally { setConsentBusy(false); }
  };

  const changeTrackerContextConsent = async (granted: boolean) => {
    const requestedUserId = userId;
    if (!supabase || !requestedUserId) return;
    setConsentBusy(true);
    setConsentNotice('');
    try {
      await saveTrackerContextConsent(supabase, granted);
      setTrackerContextConsent(granted);
      setConsentLoadedFor(requestedUserId);
      setConsentNotice(granted
        ? 'Tracker-summary sharing enabled. Only the limited cycle, symptom-count and fertility-observation summary described below is included.'
        : 'Tracker-summary sharing disabled. Your tracker information will not be sent to the AI provider.');
    } catch (error) {
      setConsentNotice(error instanceof Error ? error.message : 'Could not update tracker-sharing preference.');
    } finally { setConsentBusy(false); }
  };

  const submit = async (event?: FormEvent<HTMLFormElement>, value = input) => {
    event?.preventDefault();
    const question = value.trim();
    if (!question || question.length > 1200 || busy) return;
    const userMessage = createMessage('user', question);
    const nextMessages = [...messages, userMessage].slice(-11);
    setMessages((current) => [...current, userMessage]);
    setInput('');
    setBusy(true);
    try {
      if (aiAvailable && supabase) {
        const turns: AssistantTurn[] = nextMessages
          .filter((item) => item.id !== 'welcome' && (item.role === 'user' || item.role === 'assistant'))
          .slice(-10)
          .map((item) => ({ role: item.role, content: item.text }));
        const trackerContext = trackerContextConsent ? buildAssistantTrackerContext(state) : undefined;
        const response = await requestHealthAssistant(supabase, turns, trackerContext);
        setMessages((current) => [...current, createMessage('assistant', response.answer, response.source, response.model)]);
      } else {
        const answer = getAssistantReply(question).answer;
        setMessages((current) => [...current, createMessage('assistant', answer, 'offline')]);
      }
    } catch (error) {
      const fallback = getAssistantReply(question).answer;
      const note = error instanceof Error ? error.message : 'The AI service is temporarily unavailable.';
      setMessages((current) => [...current, createMessage('assistant', `${note}\n\nOffline guidance: ${fallback}`, 'offline')]);
    } finally { setBusy(false); }
  };

  const handleComposerKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void submit(undefined, input);
    }
  };

  const copyMessage = async (message: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(message.text);
      setCopiedId(message.id);
      window.setTimeout(() => setCopiedId((current) => current === message.id ? null : current), 1500);
    } catch {
      setConsentNotice('Clipboard access is unavailable in this browser. Select the response to copy it manually.');
    }
  };

  const retryLast = () => {
    const lastQuestion = [...messages].reverse().find((message) => message.role === 'user');
    if (lastQuestion) void submit(undefined, lastQuestion.text);
  };

  return (
    <>
      <div className="assistant-page-heading">
        <div><p className="eyebrow">YOUR PRIVATE WELLNESS GUIDE</p><h1>Ask CycleCue</h1><p>Clear, practical women's health education, with optional context from your tracker.</p></div>
        <div className={`assistant-mode-chip ${aiAvailable ? 'is-ai' : ''}`}><span />{aiAvailable ? 'OpenRouter AI ready' : 'Offline guide ready'}</div>
      </div>
      <div className="assistant-layout assistant-layout-upgraded">
        <section className="surface chat-panel chat-panel-upgraded" aria-label="CycleCue AI chat">
          <div className="chat-heading chat-heading-upgraded">
            <div className="assistant-avatar assistant-avatar-upgraded"><Sparkles size={20} /></div>
            <div className="chat-heading-copy"><strong>CycleCue Companion</strong><span>{aiAvailable ? 'Free OpenRouter models · guarded health education' : 'General education · private fallback'}</span></div>
            <button className="chat-clear-button" type="button" onClick={() => setMessages([WELCOME])} disabled={busy} title="Clear conversation"><Trash2 size={15} /><span>Clear chat</span></button>
          </div>
          <div className="chat-messages chat-messages-upgraded" aria-live="polite" aria-relevant="additions text">
            {messages.map((message) => (
              <article className={`chat-message chat-message-upgraded message-${message.role}`} key={message.id}>
                <div className="message-avatar">{message.role === 'assistant' ? <Bot size={16} /> : <UserRound size={15} />}</div>
                <div className="message-content"><p>{message.text}</p>
                  {message.role === 'assistant' && <div className="message-tools"><span className={`message-source source-${message.source ?? 'offline'}`}>{message.source === 'ai' ? `OpenRouter AI${message.model ? ` · ${message.model}` : ''}` : message.source === 'safety' ? 'Safety guidance' : 'Offline guidance'}</span><button type="button" onClick={() => { void copyMessage(message); }} aria-label="Copy response">{copiedId === message.id ? <Check size={13} /> : <Clipboard size={13} />}{copiedId === message.id ? 'Copied' : 'Copy'}</button></div>}
                </div>
              </article>
            ))}
            {busy && <div className="chat-message chat-message-upgraded message-assistant"><div className="message-avatar"><Bot size={16} /></div><div className="typing-bubble" aria-label="CycleCue is preparing a response"><span /><span /><span /></div></div>}
            <div ref={messagesEndRef} />
          </div>
          {messages.length <= 1 && <div className="assistant-starters"><span>START WITH A QUESTION</span><div>{SUGGESTIONS.map((prompt) => <button key={prompt} type="button" onClick={() => { void submit(undefined, prompt); }} disabled={busy}>{prompt}</button>)}</div></div>}
          <form className="chat-input-row chat-input-row-upgraded" onSubmit={(event) => { void submit(event); }}>
            <textarea value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={handleComposerKeyDown} maxLength={1200} rows={2} placeholder="Ask about your cycle, symptoms, fertility or wellbeing…" aria-label="Ask the CycleCue companion" disabled={busy} />
            <button className="send-button send-button-upgraded" type="submit" disabled={!input.trim() || busy || input.trim().length > 1200} aria-label="Send message"><Send size={18} /></button>
            <span className="composer-hint">Enter to send · Shift + Enter for a new line</span>
          </form>
          {userId && supabase ? <div className="ai-consent-box ai-consent-box-upgraded">
            <label><input type="checkbox" checked={consentReady && aiConsent} onChange={(event) => { void changeAiConsent(event.target.checked); }} disabled={consentBusy || !consentReady} /><span><strong>{consentReady ? 'Enable AI answers' : 'Loading AI privacy choices…'}</strong><small>When enabled, your recent chat messages are sent to OpenRouter and the model provider serving the request. Provider data-handling and retention policies can vary. Do not include identifying details.</small></span></label>
            <label className="tracker-context-consent"><input type="checkbox" checked={consentReady && trackerContextConsent} onChange={(event) => { void changeTrackerContextConsent(event.target.checked); }} disabled={consentBusy || !consentReady || !aiConsent} /><span><strong>Allow CycleCue to include a short tracker summary</strong><small>Optional. Includes your usual cycle and period lengths, number and latest date of recorded periods, common symptom counts from the last 30 days, and OPK/cervical-mucus observation counts. It does not include your name, email, full symptom diary, pregnancy details, basal temperatures or documents. This summary is sent to OpenRouter and its serving model provider; retention policies can vary. You can turn this off at any time.</small></span></label>
            {consentNotice && <p role="status">{consentNotice}</p>}
          </div> : <div className="assistant-login-prompt"><LockKeyhole size={16} /><span>Sign in with Google and enable AI answers to use the online companion. The offline guide is available without an account.</span><button type="button" onClick={onOpenAccount}>Sign in <span>→</span></button></div>}
          <p className="chat-privacy chat-privacy-upgraded"><ShieldCheck size={13} /> AI answers are educational, not medical advice. Optional tracker context is only sent after separate consent. Chat history stays in this page session.</p>
        </section>
        <aside className="assistant-side-column assistant-side-upgraded">
          <article className="surface assistant-info-card assistant-highlight-card"><div className="assistant-info-icon"><ShieldCheck size={19} /></div><h3>Education, not diagnosis</h3><p>CycleCue explains general health topics. It cannot diagnose, prescribe, confirm ovulation or determine pregnancy. For urgent symptoms, contact a medical service instead of waiting for AI.</p></article>
          <article className="surface assistant-info-card"><div className="assistant-info-icon sage-icon"><CalendarDays size={19} /></div><h3>Use your tracker data carefully</h3><p>{state.periodStarts.length} period start dates are currently recorded. A short, de-identified summary can help explain patterns when you separately opt in; individual health entries are not shared by default.</p></article>
          <article className="surface help-links-card"><h3>Trusted reading</h3><a href="https://www.nhs.uk/conditions/periods/fertility-in-the-menstrual-cycle/" target="_blank" rel="noreferrer">NHS · Periods and fertility <span>↗</span></a><a href="https://www.acog.org/womens-health/faqs/fertility-awareness-based-methods-of-family-planning" target="_blank" rel="noreferrer">ACOG · Fertility awareness <span>↗</span></a></article>
          {messages.some((message) => message.role === 'user') && <button className="chat-retry-button" type="button" onClick={retryLast} disabled={busy}><RotateCcw size={14} /> Ask the last question again</button>}
        </aside>
      </div>
    </>
  );
}
