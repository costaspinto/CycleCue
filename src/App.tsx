import { useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import {
  Activity, Apple, ArrowDownToLine, ArrowRight, Baby, CalendarDays, Check, ChevronLeft, ChevronRight, Clock3,
  CircleHelp, Droplets, Dumbbell, Heart, HeartHandshake, Home, Info, Leaf, LockKeyhole, LogIn,
  MessageCircle, MoreHorizontal, Plus, Recycle, Settings2, ShieldCheck, Sparkles, Sun, Trash2, TrendingUp, UserRound, X,
} from 'lucide-react';
import type { AppSection, FertilityObservation, FlowLevel, Mood, Symptom, TrackerState } from './types';
import { addDays, formatDate, formatMonthYear, getMonthGrid, isDateOnly, startOfCurrentDay } from './lib/date';
import { calculateCyclePrediction, getCycleDay, getCycleIntervals, isDateWithinRange } from './lib/cycle-engine';
import { createDemoState, createEmptyState, createSymptomEntry, exportTrackerState, loadTrackerState, saveTrackerState } from './lib/storage';
import { moveAllHealthRecordsToRecycleBin, moveCheckInToRecycleBin, moveFertilityObservationToRecycleBin, movePeriodToRecycleBin, permanentlyDeleteRecycleRecord, purgeExpiredRecords, restoreRecycleRecord } from './lib/recycle-bin';
import { PregnancyTracker, FertilityTracker, NutritionPlanner, MovementPlanner, WomensWellness, HabitTracker, RecycleBin, ModuleSafetyNote } from './components/HealthModules';
import { Assistant } from './components/Assistant';
import { AboutPage } from './components/AboutPage';
import { AuthScreen } from './auth/AuthScreen';
import { useAuth, type AuthContextValue } from './auth/auth-context';
import { supabase } from './lib/supabase';
import { backupTrackerState, restoreTrackerState } from './lib/cloud-vault';

const NAV_ITEMS: Array<{ id: AppSection; label: string; icon: typeof Home }> = [
  { id: 'overview', label: 'Overview', icon: Home },
  { id: 'calendar', label: 'Cycle calendar', icon: CalendarDays },
  { id: 'insights', label: 'Cycle insights', icon: TrendingUp },
  { id: 'pregnancy', label: 'Pregnancy', icon: Baby },
  { id: 'fertility', label: 'Fertility observations', icon: Sparkles },
  { id: 'nutrition', label: 'Nutrition', icon: Apple },
  { id: 'movement', label: 'Movement', icon: Dumbbell },
  { id: 'wellness', label: 'Women’s wellness', icon: HeartHandshake },
  { id: 'habits', label: 'Healthy habits', icon: Leaf },
  { id: 'recycle', label: 'Recycle Bin', icon: Recycle },
  { id: 'assistant', label: 'AI companion', icon: MessageCircle },
  { id: 'about', label: 'About CycleCue', icon: Info },
  { id: 'settings', label: 'Settings', icon: Settings2 },
];


const MOBILE_PRIMARY_SECTIONS: AppSection[] = ['overview', 'calendar', 'assistant', 'pregnancy', 'insights'];

const MOBILE_NAV_LABELS: Partial<Record<AppSection, string>> = {
  overview: 'Home',
  calendar: 'Calendar',
  assistant: 'Ask AI',
  pregnancy: 'Pregnancy',
  insights: 'Insights',
};
const SYMPTOMS: Symptom[] = ['Cramps', 'Headache', 'Bloating', 'Tender breasts', 'Fatigue', 'Acne', 'Backache', 'Nausea'];

function daysUntil(dateKey: string | null, today: string): number | null {
  if (!dateKey) return null;
  const a = new Date(`${today}T12:00:00`);
  const b = new Date(`${dateKey}T12:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86_400_000);
}

function plural(value: number, singular: string, pluralForm = `${singular}s`): string {
  return `${value} ${value === 1 ? singular : pluralForm}`;
}

function SectionTitle({ eyebrow, title, description, action }: {
  eyebrow?: string; title: string; description?: string; action?: ReactNode;
}) {
  return (
    <div className="section-title-row">
      <div>
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && <p className="section-description">{description}</p>}
      </div>
      {action && <div className="section-action">{action}</div>}
    </div>
  );
}

function MetricCard({ label, value, helper, icon: Icon, tone = 'rose' }: {
  label: string; value: string; helper: string; icon: typeof Heart; tone?: 'rose' | 'sage' | 'lavender' | 'amber';
}) {
  return (
    <article className="metric-card">
      <div className={`metric-icon metric-${tone}`}><Icon size={19} strokeWidth={1.8} /></div>
      <p className="metric-label">{label}</p>
      <p className="metric-value">{value}</p>
      <p className="metric-helper">{helper}</p>
    </article>
  );
}

function DemoNotice({ onStartFresh }: { onStartFresh: () => void }) {
  return (
    <div className="demo-notice">
      <div className="demo-notice-icon"><Info size={17} /></div>
      <div><strong>You're viewing sample data.</strong><span>Replace it with your own dates whenever you're ready.</span></div>
      <button className="text-button" onClick={onStartFresh}>Start fresh <ArrowRight size={14} /></button>
    </div>
  );
}

function PredictionCard({ state, today }: { state: TrackerState; today: string }) {
  const prediction = calculateCyclePrediction(state);
  const countdown = daysUntil(prediction.nextPeriodDate, today);
  return (
    <article className="surface prediction-card">
      <div className="surface-heading">
        <div><p className="eyebrow">NEXT CYCLE</p><h2>Looking ahead</h2></div>
        <span className="soft-icon"><CalendarDays size={18} /></span>
      </div>
      <div className="prediction-date-block">
        <div className="prediction-day">{prediction.nextPeriodDate ? new Date(`${prediction.nextPeriodDate}T12:00:00`).getDate() : '—'}</div>
        <div><p className="prediction-month">{prediction.nextPeriodDate ? formatDate(prediction.nextPeriodDate, { month: 'long' }) : 'Not available'}</p><p className="muted-copy">Estimated next period</p></div>
      </div>
      <div className="countdown-line">
        <span className="countdown-dot" />
        {countdown === null ? 'Add a period date to see an estimate' : countdown > 0 ? `About ${plural(countdown, 'day')} to go` : countdown === 0 ? 'Estimated to start today' : `Estimate was ${plural(Math.abs(countdown), 'day')} ago`}
      </div>
      <div className="prediction-divider" />
      <div className="prediction-foot">
        <div><span className="small-label">Estimated fertile window</span><strong>{prediction.fertileWindowStart && prediction.fertileWindowEnd ? `${formatDate(prediction.fertileWindowStart, { month: 'short', day: 'numeric' })} – ${formatDate(prediction.fertileWindowEnd, { month: 'short', day: 'numeric' })}` : 'Not available'}</strong></div>
        <span className="prediction-tag">Estimate</span>
      </div>
      <p className="card-disclaimer">Calendar estimates can be wrong and do not confirm ovulation or pregnancy.</p>
    </article>
  );
}

function CycleProgress({ state, today }: { state: TrackerState; today: string }) {
  const prediction = calculateCyclePrediction(state);
  const lastStart = [...state.periodStarts].sort().at(-1) ?? null;
  const cycleDay = getCycleDay(lastStart, today);
  const length = Math.max(15, Math.min(60, Math.round(prediction.averageCycleLength)));
  const progress = cycleDay === null ? 0 : Math.min(100, (cycleDay / length) * 100);
  const phases = [
    { label: 'Period', width: 18, color: 'phase-period' },
    { label: 'Follicular', width: 34, color: 'phase-follicular' },
    { label: 'Fertile estimate', width: 22, color: 'phase-fertile' },
    { label: 'Luteal', width: 26, color: 'phase-luteal' },
  ];
  return (
    <article className="surface cycle-card">
      <div className="surface-heading">
        <div><p className="eyebrow">YOUR CYCLE</p><h2>Where you are today</h2></div>
        <span className="cycle-day-pill">{cycleDay ? `Day ${cycleDay}` : 'Not set'}</span>
      </div>
      <div className="cycle-progress-wrap">
        <div className="cycle-progress-track">
          <div className="cycle-progress-fill" style={{ width: `${progress}%` }} />
          <span className="cycle-progress-marker" style={{ left: `${progress}%` }} />
        </div>
        <div className="cycle-track-labels"><span>Cycle begins</span><span>Next period estimate</span></div>
      </div>
      <div className="phase-list">
        {phases.map((phase) => <div className="phase-row" key={phase.label}><span className={`phase-dot ${phase.color}`} /><span>{phase.label}</span><div className="phase-mini-track"><span className={phase.color} style={{ width: `${phase.width}%` }} /></div></div>)}
      </div>
      <p className="card-disclaimer">Phase timing is illustrative and based on calendar estimates, not measured hormone or ovulation data.</p>
    </article>
  );
}

function MonthCalendar({ state, today, compact = false }: { state: TrackerState; today: string; compact?: boolean }) {
  const [month, setMonth] = useState(() => new Date(`${today}T12:00:00`));
  const prediction = calculateCyclePrediction(state);
  const cells = getMonthGrid(month.getFullYear(), month.getMonth());
  const lastStart = [...state.periodStarts].sort().at(-1) ?? null;
  const actualPeriodDates = useMemo(() => {
    const dates = new Set<string>();
    state.periodStarts.forEach((start) => {
      for (let index = 0; index < state.profile.periodLength; index += 1) dates.add(addDays(start, index));
    });
    return dates;
  }, [state.periodStarts, state.profile.periodLength]);
  const predictedPeriodDates = useMemo(() => {
    const dates = new Set<string>();
    if (prediction.nextPeriodDate) {
      for (let index = 0; index < state.profile.periodLength; index += 1) dates.add(addDays(prediction.nextPeriodDate, index));
    }
    return dates;
  }, [prediction.nextPeriodDate, state.profile.periodLength]);

  const shiftMonth = (amount: number) => setMonth((current) => new Date(current.getFullYear(), current.getMonth() + amount, 1, 12));
  return (
    <article className={`surface calendar-card ${compact ? 'calendar-compact' : ''}`}>
      <div className="calendar-header">
        <div><p className="eyebrow">CYCLE CALENDAR</p><h2>{formatMonthYear(month)}</h2></div>
        <div className="calendar-controls"><button aria-label="Previous month" className="icon-button" onClick={() => shiftMonth(-1)}><ChevronLeft size={18} /></button><button aria-label="Next month" className="icon-button" onClick={() => shiftMonth(1)}><ChevronRight size={18} /></button></div>
      </div>
      <div className="calendar-grid calendar-weekdays">{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => <span key={`${day}-${index}`}>{day}</span>)}</div>
      <div className="calendar-grid calendar-days">
        {cells.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} className="calendar-empty" />;
          const isToday = date === today;
          const isPeriod = actualPeriodDates.has(date);
          const isPredictedPeriod = predictedPeriodDates.has(date) && !isPeriod;
          const isFertile = isDateWithinRange(date, prediction.fertileWindowStart, prediction.fertileWindowEnd);
          const isOvulation = date === prediction.estimatedOvulationDate;
          const isCurrentCycle = lastStart ? date >= lastStart : false;
          const classes = ['calendar-day', isToday ? 'is-today' : '', isPeriod ? 'is-period' : '', isPredictedPeriod ? 'is-predicted' : '', isFertile && !isPeriod && !isPredictedPeriod ? 'is-fertile' : '', isOvulation ? 'is-ovulation' : '', isCurrentCycle ? 'is-current-cycle' : ''].filter(Boolean).join(' ');
          return <span className={classes} key={date} title={`${formatDate(date)}${isPeriod ? ' · Recorded period' : isPredictedPeriod ? ' · Estimated period' : isOvulation ? ' · Estimated ovulation' : isFertile ? ' · Estimated fertile window' : ''}`}>{Number(date.slice(-2))}</span>;
        })}
      </div>
      <div className="calendar-legend">
        <span><i className="legend-dot legend-period" />Period</span>
        <span><i className="legend-dot legend-predicted" />Predicted</span>
        <span><i className="legend-dot legend-fertile" />Fertile estimate</span>
      </div>
      {!compact && <p className="card-disclaimer">Estimated dates are informational only. The calendar cannot be used to prevent pregnancy.</p>}
    </article>
  );
}

function UpcomingCard({ state }: { state: TrackerState }) {
  const prediction = calculateCyclePrediction(state);
  const items = [
    { label: 'Estimated fertile window', date: prediction.fertileWindowStart && prediction.fertileWindowEnd ? `${formatDate(prediction.fertileWindowStart, { month: 'short', day: 'numeric' })} – ${formatDate(prediction.fertileWindowEnd, { month: 'short', day: 'numeric' })}` : 'Add cycle dates', icon: Leaf, color: 'sage' },
    { label: 'Estimated ovulation', date: prediction.estimatedOvulationDate ? formatDate(prediction.estimatedOvulationDate, { month: 'short', day: 'numeric' }) : 'Add cycle dates', icon: Sparkles, color: 'lavender' },
    { label: 'Next period', date: prediction.nextPeriodDate ? formatDate(prediction.nextPeriodDate, { month: 'short', day: 'numeric' }) : 'Add cycle dates', icon: Droplets, color: 'rose' },
  ];
  return (
    <article className="surface upcoming-card">
      <div className="surface-heading"><div><p className="eyebrow">UP NEXT</p><h2>Your timeline</h2></div><Clock3 size={18} className="muted-icon" /></div>
      <div className="timeline-list">
        {items.map((item, index) => <div className="timeline-item" key={item.label}><div className={`timeline-icon timeline-${item.color}`}><item.icon size={16} /></div><div className="timeline-content"><strong>{item.label}</strong><span>{item.date}</span></div>{index < items.length - 1 && <div className="timeline-connector" />}</div>)}
      </div>
      <p className="card-disclaimer">These are calendar estimates. Individual cycles can change.</p>
    </article>
  );
}

function CheckInCard({ entries, today, onLog }: { entries: TrackerState['entries']; today: string; onLog: () => void }) {
  const todayEntry = entries.find((entry) => entry.date === today);
  return (
    <article className="surface checkin-card">
      <div className="surface-heading"><div><p className="eyebrow">DAILY CHECK-IN</p><h2>How are you feeling?</h2></div><span className="soft-icon"><Sun size={18} /></span></div>
      {todayEntry ? (
        <div className="checkin-complete"><div className="checkin-check"><Check size={18} /></div><div><strong>Today's check-in is saved</strong><p>{[todayEntry.mood, todayEntry.flow, ...todayEntry.symptoms].filter(Boolean).join(' · ') || 'No symptoms selected'}</p></div></div>
      ) : <p className="muted-copy checkin-prompt">A small check-in can help you notice patterns over time.</p>}
      <button className="button button-soft button-full" onClick={onLog}><Plus size={16} /> {todayEntry ? 'Update check-in' : 'Log today'}</button>
      <p className="card-disclaimer">Your check-ins are saved locally first.</p>
    </article>
  );
}

function Overview({ state, today, onLogPeriod, onLogSymptoms, onStartFresh, onNavigate }: {
  state: TrackerState; today: string; onLogPeriod: () => void; onLogSymptoms: () => void; onStartFresh: () => void; onNavigate: (section: AppSection) => void;
}) {
  const prediction = calculateCyclePrediction(state);
  const countdown = daysUntil(prediction.nextPeriodDate, today);
  const lastStart = [...state.periodStarts].sort().at(-1) ?? null;
  const cycleDay = getCycleDay(lastStart, today);
  const intervals = getCycleIntervals(state.periodStarts);
  const loggedSymptoms = state.entries.filter((entry) => entry.symptoms.length > 0).length;
  return (
    <>
      <SectionTitle eyebrow="YOUR PERSONAL SPACE" title="Cycle overview" description="A little more awareness, one day at a time." action={<button className="button button-primary" onClick={onLogPeriod}><Plus size={16} /> Log period</button>} />
      {state.isDemo && <DemoNotice onStartFresh={onStartFresh} />}
      <div className="metric-grid">
        <MetricCard label="Next period" value={countdown === null ? '—' : countdown < 0 ? 'Overdue' : countdown === 0 ? 'Today' : `${countdown} days`} helper={prediction.nextPeriodDate ? `Estimated ${formatDate(prediction.nextPeriodDate, { month: 'short', day: 'numeric' })}` : 'Add your first period'} icon={Droplets} tone="rose" />
        <MetricCard label="Current cycle" value={cycleDay ? `Day ${cycleDay}` : '—'} helper={cycleDay ? 'Based on your last start date' : 'Your cycle day will appear here'} icon={Activity} tone="sage" />
        <MetricCard label="Average cycle" value={intervals.length ? `${prediction.averageCycleLength} days` : `${state.profile.cycleLength} days`} helper={intervals.length ? `From ${intervals.length} completed intervals` : 'Your starting estimate'} icon={CalendarDays} tone="lavender" />
        <MetricCard label="Check-ins" value={String(loggedSymptoms)} helper="Days with symptoms recorded" icon={Heart} tone="amber" />
      </div>
      <div className="dashboard-main-grid">
        <div className="dashboard-column">
          <CycleProgress state={state} today={today} />
          <MonthCalendar state={state} today={today} compact />
        </div>
        <div className="dashboard-column">
          <PredictionCard state={state} today={today} />
          <CheckInCard entries={state.entries} today={today} onLog={onLogSymptoms} />
          <UpcomingCard state={state} />
        </div>
      </div>
      <div className="bottom-prompt"><div className="bottom-prompt-icon"><MessageCircle size={18} /></div><div><strong>Questions about your cycle?</strong><span>Visit your Cycle Companion for general information and tracking guidance.</span></div><button className="text-button" onClick={() => onNavigate('assistant')}>Ask a question <ArrowRight size={14} /></button></div>
    </>
  );
}

function Insights({ state, onDeletePeriod, onDeleteCheckIn }: { state: TrackerState; onDeletePeriod: (date: string) => void; onDeleteCheckIn: (id: string) => void }) {
  const intervals = getCycleIntervals(state.periodStarts);
  const prediction = calculateCyclePrediction(state);
  const sortedStarts = [...state.periodStarts].sort();
  return (
    <>
      <SectionTitle eyebrow="YOUR PATTERNS" title="Cycle insights" description="Your history at a glance. Patterns are descriptive, not a medical assessment." />
      <div className="insight-summary-grid">
        <MetricCard label="Average cycle" value={intervals.length ? `${prediction.averageCycleLength} days` : 'Not enough data'} helper="Median of recorded intervals" icon={CalendarDays} tone="lavender" />
        <MetricCard label="Recorded periods" value={String(state.periodStarts.length)} helper="Period start dates saved" icon={Droplets} tone="rose" />
        <MetricCard label="Cycle variation" value={prediction.variabilityDays === null ? '—' : `${prediction.variabilityDays} days`} helper="Difference across recent intervals" icon={TrendingUp} tone="sage" />
      </div>
      <article className="surface insight-chart-card">
        <div className="surface-heading"><div><p className="eyebrow">RECENT HISTORY</p><h2>Cycle lengths</h2></div><span className="soft-icon"><Activity size={18} /></span></div>
        {intervals.length > 0 ? <div className="bar-chart" role="img" aria-label={`Recent cycle lengths: ${intervals.join(', ')} days`}>
          {intervals.map((length, index) => <div className="bar-column" key={`${sortedStarts[index] ?? 'cycle'}-${index}`}><span className="bar-value">{length}d</span><div className="bar-track"><div className="bar-fill" style={{ height: `${Math.max(14, Math.min(100, (length / 45) * 100))}%` }} /></div><span className="bar-label">Cycle {index + 1}</span></div>)}
        </div> : <div className="empty-state"><div className="empty-state-icon"><TrendingUp size={22} /></div><strong>Your trend will appear here</strong><p>Record at least two period start dates to compare cycle lengths.</p></div>}
      </article>
      <article className="surface history-card">
        <div className="surface-heading"><div><p className="eyebrow">MANAGE YOUR LOGS</p><h2>Recorded history</h2></div><span className="soft-icon"><Trash2 size={17} /></span></div>
        <div className="history-list">
          {[...state.periodStarts].sort((a, b) => b.localeCompare(a)).map((date) => <div className="history-row" key={`period-${date}`}><div><strong>Period start</strong><span>{formatDate(date)}</span></div><button className="text-button" onClick={() => onDeletePeriod(date)}>Move to bin <Trash2 size={13} /></button></div>)}
          {[...state.entries].sort((a, b) => b.date.localeCompare(a.date)).map((entry) => <div className="history-row" key={entry.id}><div><strong>Daily check-in</strong><span>{formatDate(entry.date)} · {entry.symptoms.length ? entry.symptoms.join(', ') : 'No symptoms selected'}</span></div><button className="text-button" onClick={() => onDeleteCheckIn(entry.id)}>Move to bin <Trash2 size={13} /></button></div>)}
          {state.periodStarts.length === 0 && state.entries.length === 0 && <p className="empty-copy">No records to manage yet.</p>}
        </div>
        <p className="module-disclaimer">Deleted tracker records move to the Recycle Bin for 30 days before expiry. You can restore them or permanently delete them sooner.</p>
      </article>
      <article className="surface insight-note-card"><div className="note-icon"><Info size={18} /></div><div><strong>How to read these insights</strong><p>CycleCue uses the dates you enter to calculate a median cycle length. A calendar estimate cannot identify the cause of changes, confirm ovulation, or determine pregnancy. If your pattern or symptoms concern you, speak with a qualified healthcare professional.</p></div></article>
      <div className="source-note">For general information, see <a href="https://www.nhsinform.scot/healthy-living/womens-health/girls-and-young-women-puberty-to-around-25/periods-and-menstrual-health/periods-and-pregnancy/" target="_blank" rel="noreferrer">NHS inform: Periods and pregnancy</a>.</div>
    </>
  );
}

function Settings({ state, onProfileChange, onExport, onDelete, storageMessage, accountEmail, cloudConfigured, cloudBusy, onBackup, onRestore, onSignOut }: {
  state: TrackerState; onProfileChange: (cycleLength: number, periodLength: number) => void; onExport: () => void; onDelete: () => void; storageMessage: string | null;
  accountEmail?: string; cloudConfigured: boolean; cloudBusy: boolean; onBackup: () => void; onRestore: () => void; onSignOut: () => void;
}) {
  const [cycleLength, setCycleLength] = useState(String(state.profile.cycleLength));
  const [periodLength, setPeriodLength] = useState(String(state.profile.periodLength));
  const [notice, setNotice] = useState('');
  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cycle = Number(cycleLength);
    const period = Number(periodLength);
    if (!Number.isInteger(cycle) || cycle < 15 || cycle > 60) { setNotice('Cycle length must be a whole number from 15 to 60 days.'); return; }
    if (!Number.isInteger(period) || period < 1 || period > 10) { setNotice('Period duration must be a whole number from 1 to 10 days.'); return; }
    onProfileChange(cycle, period);
    setNotice('Your settings have been saved.');
  };
  return (
    <>
      <SectionTitle eyebrow="YOUR PREFERENCES" title="Settings" description="Control your estimates and manage the information saved in this browser." />
      <div className="settings-layout">
        <section className="surface settings-card">
          <div className="surface-heading"><div><p className="eyebrow">CYCLE PREFERENCES</p><h2>Your typical cycle</h2></div><span className="soft-icon"><Settings2 size={18} /></span></div>
          <form className="settings-form" onSubmit={save}>
            <label className="form-field"><span>Typical cycle length <small>15–60 days</small></span><div className="number-input-wrap"><input type="number" min="15" max="60" value={cycleLength} onChange={(event) => setCycleLength(event.target.value)} required /><span>days</span></div></label>
            <label className="form-field"><span>Typical period duration <small>1–10 days</small></span><div className="number-input-wrap"><input type="number" min="1" max="10" value={periodLength} onChange={(event) => setPeriodLength(event.target.value)} required /><span>days</span></div></label>
            <button className="button button-primary" type="submit">Save preferences</button>
            {notice && <p className={`form-notice ${notice.includes('must') ? 'notice-error' : ''}`} role="status">{notice}</p>}
          </form>
        </section>
        <section className="surface settings-card privacy-card">
          <div className="surface-heading"><div><p className="eyebrow">DATA CONTROL</p><h2>Your data stays local</h2></div><span className="soft-icon sage-icon"><LockKeyhole size={18} /></span></div>
          <p className="settings-copy">Cycle dates and symptom check-ins are saved in this browser by default. Browser storage is not encrypted. When you sign in, you can explicitly back up or restore this tracker through your private Supabase account.</p>
          <div className="privacy-status"><span><ShieldCheck size={16} /> {cloudConfigured ? `Signed in as ${accountEmail ?? 'your account'}` : 'Local-only mode'}</span><span><Check size={15} /> No analytics</span><span><Check size={15} /> AI is opt-in only</span></div>
          {storageMessage && <p className="storage-warning" role="status">{storageMessage}</p>}
          <div className="settings-actions"><button className="button button-soft" onClick={onExport}><ArrowDownToLine size={16} /> Export my data</button><button className="button button-danger" onClick={onDelete}><Trash2 size={16} /> Move all records to Recycle Bin</button></div>
        </section>
        <section className="surface settings-card cloud-account-card">
          <div className="surface-heading"><div><p className="eyebrow">ACCOUNT & CLOUD BACKUP</p><h2>{cloudConfigured ? 'Your CycleCue account' : 'Personal account setup'}</h2></div><span className="soft-icon"><ShieldCheck size={18} /></span></div>
          {cloudConfigured ? <><p className="settings-copy">Signed in as <strong>{accountEmail}</strong>. Your local tracker is private to this browser profile. Use the actions below to explicitly back up or restore it in your account database.</p><div className="settings-actions"><button className="button button-primary" onClick={onBackup} disabled={cloudBusy}>{cloudBusy ? 'Working…' : 'Back up to my account'}</button><button className="button button-soft" onClick={onRestore} disabled={cloudBusy}>{cloudBusy ? 'Working…' : 'Restore from account'}</button><button className="button button-ghost" onClick={onSignOut}>Sign out</button></div></> : <p className="settings-copy">Configure Supabase in your deployment environment to enable secure account creation, sign-in and account backups. Without configuration, CycleCue stays in private local mode.</p>}
        </section>
        <section className="surface settings-card about-card"><h2>About CycleCue</h2>
<div className="about-developer-credit">
  <p className="about-developer-eyebrow">PRODUCT DEVELOPMENT</p>
  <p className="about-developer-name">Crafted by Costas Pinto</p>
  <p className="about-developer-description">
    Designed and developed with a passion for technology and women's wellness.
  </p>
  <div className="about-developer-links">
    <a href="https://www.linkedin.com/in/costaspinto"
       target="_blank" rel="noopener noreferrer">LinkedIn</a>
    <a href="https://github.com/costaspinto"
       target="_blank" rel="noopener noreferrer">GitHub</a>
    <a href="https://www.costaspinto.vercel.app"
       target="_blank" rel="noopener noreferrer">Portfolio</a>
  </div>
</div>
<p>CycleCue is an educational women's health platform. Calendar predictions are estimates and do not confirm ovulation, pregnancy or medical conditions.</p><p className="version-text">Version 1.3.0 · React + TypeScript · Supabase + Google OAuth-ready</p></section>
      </div>
    </>
  );
}

function Modal({ title, subtitle, onClose, children }: { title: string; subtitle: string; onClose: () => void; children: ReactNode }) {
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal-card" role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <div className="modal-heading"><div><h2 id="modal-title">{title}</h2><p>{subtitle}</p></div><button className="icon-button" onClick={onClose} aria-label="Close dialog"><X size={19} /></button></div>
        {children}
      </section>
    </div>
  );
}

function App() {
  const today = useMemo(() => startOfCurrentDay(), []);
  const auth = useAuth();
  const [showAccountPage, setShowAccountPage] = useState(false);
  if (auth.loading) return <div className="auth-screen"><div className="auth-card"><p>Restoring your secure session…</p></div></div>;
  if (auth.configured && !auth.user) return <AuthScreen serviceError={auth.error} />;
  const storageKey = auth.user ? `cyclecue.tracker.v3:${auth.user.id}` : 'cyclecue.tracker.v3:guest';
  return <CycleCueWorkspace key={storageKey} today={today} storageKey={storageKey} auth={auth} showAccountPage={showAccountPage} onOpenAccountPage={() => setShowAccountPage(true)} onCloseAccountPage={() => setShowAccountPage(false)} />;
}

function CycleCueWorkspace({ today, storageKey, auth, showAccountPage, onOpenAccountPage, onCloseAccountPage }: {
  today: string;
  storageKey: string;
  auth: AuthContextValue;
  showAccountPage: boolean;
  onOpenAccountPage: () => void;
  onCloseAccountPage: () => void;
}) {
  const initialLoad = useMemo(() => loadTrackerState(storageKey), [storageKey]);
  const initialState = initialLoad.state ?? (auth.configured ? createEmptyState() : createDemoState(today));
  const [tracker, setTracker] = useState<TrackerState>(() => purgeExpiredRecords(initialState));
  const trackerRef = useRef(tracker);
  const [section, setSection] = useState<AppSection>('overview');
  const [mobileMoreOpen, setMobileMoreOpen] = useState(false);
  const [modal, setModal] = useState<'period' | 'checkin' | null>(null);
  const [periodDate, setPeriodDate] = useState(today);
  const [checkinDate, setCheckinDate] = useState(today);
  const [flow, setFlow] = useState<FlowLevel | ''>('');
  const [mood, setMood] = useState<Mood | ''>('');
  const [symptoms, setSymptoms] = useState<Symptom[]>([]);
  const [formError, setFormError] = useState('');
  const [toast, setToast] = useState('');
  const [storageMessage, setStorageMessage] = useState<string | null>(
    initialLoad.status === 'corrupt'
      ? 'Saved data was invalid and could not be read. A fresh profile is shown.'
      : initialLoad.status === 'unavailable'
        ? 'Browser storage is unavailable. Changes may not persist after this page is closed.'
        : null,
  );
  const [cloudBusy, setCloudBusy] = useState(false);

  // All tracker mutations go through this event-time updater. It keeps the ref,
  // React state and local persistence in sync without side effects in a state updater.
  const updateTracker = (updater: TrackerState | ((current: TrackerState) => TrackerState)) => {
    const next = typeof updater === 'function' ? updater(trackerRef.current) : updater;
    trackerRef.current = next;
    setTracker(next);
    const status = saveTrackerState(next, storageKey);
    if (status === 'unavailable') {
      setStorageMessage('Browser storage is unavailable. Changes may not persist after this page is closed.');
    } else if (status === 'corrupt') {
      setStorageMessage('The updated tracker data failed validation and could not be saved.');
    } else {
      setStorageMessage((current) => current?.startsWith('Browser storage is unavailable') ? null : current);
    }
  };

  useEffect(() => {
    if (!toast) return;
    const timeoutId = window.setTimeout(() => setToast(''), 3200);
    return () => window.clearTimeout(timeoutId);
  }, [toast]);

  const closeModal = () => { setModal(null); setFormError(''); };
  const showToast = (message: string) => setToast(message);

  const addPeriod = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isDateOnly(periodDate) || periodDate > today) { setFormError('Choose a valid date that is today or earlier.'); return; }
    if (tracker.periodStarts.includes(periodDate)) { setFormError('That period start date is already recorded.'); return; }
    const next = [...tracker.periodStarts, periodDate].sort().slice(-60);
    updateTracker((current) => ({ ...current, periodStarts: next, isDemo: false }));
    closeModal();
    showToast('Period start date saved.');
  };

  const addCheckIn = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!isDateOnly(checkinDate) || checkinDate > today) { setFormError('Choose a valid date that is today or earlier.'); return; }
    const entry = createSymptomEntry({ date: checkinDate, flow: flow || null, mood: mood || null, symptoms });
    updateTracker((current) => ({ ...current, entries: [...current.entries.filter((item) => item.date !== checkinDate), entry].slice(-180), isDemo: false }));
    closeModal();
    showToast('Your check-in has been saved.');
  };

  const openCheckIn = () => {
    const existing = tracker.entries.find((entry) => entry.date === today);
    setCheckinDate(today);
    setFlow(existing?.flow ?? '');
    setMood(existing?.mood ?? '');
    setSymptoms(existing?.symptoms ?? []);
    setFormError('');
    setModal('checkin');
  };

  const startFresh = () => {
    updateTracker(createEmptyState());
    showToast('Sample data cleared. Add your own period dates to begin.');
  };

  const updateProfile = (cycleLength: number, periodLength: number) => {
    updateTracker((current) => ({ ...current, profile: { cycleLength, periodLength } }));
    showToast('Preferences updated.');
  };

  const exportData = () => {
    try {
      const content = exportTrackerState(tracker);
      const blob = new Blob([content], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `cyclecue-data-${today}.json`;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      showToast('Your data export has been prepared.');
    } catch {
      showToast('Export failed. Please try again.');
    }
  };

  const deleteData = () => {
    const confirmed = window.confirm('Move all period dates, symptom check-ins and fertility observations to the Recycle Bin for 30 days? You can restore them before they expire.');
    if (!confirmed) return;
    updateTracker((current) => moveAllHealthRecordsToRecycleBin(current));
    setSection('recycle');
    showToast('Your records were moved to the Recycle Bin.');
  };

  const handleCheckInDateChange = (date: string) => {
    setCheckinDate(date);
    const existing = tracker.entries.find((entry) => entry.date === date);
    setFlow(existing?.flow ?? '');
    setMood(existing?.mood ?? '');
    setSymptoms(existing?.symptoms ?? []);
  };

  const toggleSymptom = (symptom: Symptom) => setSymptoms((current) => current.includes(symptom) ? current.filter((item) => item !== symptom) : [...current, symptom]);
  const deletePeriodRecord = (date: string) => { updateTracker((current) => movePeriodToRecycleBin(current, date)); showToast('Period date moved to Recycle Bin for 30 days.'); };
  const deleteCheckInRecord = (id: string) => { updateTracker((current) => moveCheckInToRecycleBin(current, id)); showToast('Check-in moved to Recycle Bin for 30 days.'); };
  const addFertilityObservation = (input: Omit<FertilityObservation, 'id'>) => {
    if (!isDateOnly(input.date) || input.date > today) { showToast('Choose a valid observation date.'); return; }
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `fertility-${Date.now()}`;
    const observation: FertilityObservation = { ...input, id };
    updateTracker((current) => ({ ...current, fertilityObservations: [...current.fertilityObservations.filter((item) => item.date !== input.date), observation].sort((a, b) => a.date.localeCompare(b.date)).slice(-240), isDemo: false }));
    showToast('Fertility observation saved.');
  };
  const deleteFertilityObservation = (id: string) => { updateTracker((current) => moveFertilityObservationToRecycleBin(current, id)); showToast('Fertility observation moved to Recycle Bin for 30 days.'); };
  const restoreRecord = (id: string) => { updateTracker((current) => restoreRecycleRecord(current, id)); showToast('Record restored.'); };
  const permanentlyDeleteRecord = (id: string) => {
    const confirmed = window.confirm('Permanently delete this record? This cannot be undone.');
    if (!confirmed) return;
    updateTracker((current) => permanentlyDeleteRecycleRecord(current, id));
    showToast('Record permanently deleted.');
  };
  const emptyRecycleBin = () => {
    const confirmed = window.confirm('Permanently delete every record in the Recycle Bin? This cannot be undone.');
    if (!confirmed) return;
    updateTracker((current) => ({ ...current, recycleBin: [] }));
    showToast('Recycle Bin emptied.');
  };
  const cloudBackup = async () => {
    if (!supabase || !auth.user) return;
    setCloudBusy(true);
    try { await backupTrackerState(supabase, auth.user, tracker); showToast('Backup saved to your CycleCue account.'); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Backup failed.'); }
    finally { setCloudBusy(false); }
  };
  const cloudRestore = async () => {
    if (!supabase || !auth.user) return;
    const confirmed = window.confirm('Restore the latest account backup? This will replace the tracker currently open in this browser.');
    if (!confirmed) return;
    setCloudBusy(true);
    try {
      const restored = await restoreTrackerState(supabase, auth.user);
      if (!restored) { showToast('No account backup was found yet.'); return; }
      updateTracker(purgeExpiredRecords(restored));
      showToast('Your CycleCue account backup has been restored.');
    } catch (error) { showToast(error instanceof Error ? error.message : 'Restore failed.'); }
    finally { setCloudBusy(false); }
  };
  const handleSignOut = async () => {
    try { await auth.signOut(); setSection('overview'); }
    catch (error) { showToast(error instanceof Error ? error.message : 'Sign out failed.'); }
  };

  if (showAccountPage) return <AuthScreen serviceError={auth.error} onBack={onCloseAccountPage} />;

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-lockup"><div className="brand-mark"><img src="/brand/cyclecue-mark.png" alt="" /></div><div><strong>CycleCue</strong><span>your cycle companion</span></div></div>
        <div className="sidebar-label">WORKSPACE</div>
        <nav className="main-nav" aria-label="Main navigation">
          {NAV_ITEMS.map((item) => <button key={item.id} className={`nav-item ${section === item.id ? 'nav-active' : ''}`} aria-current={section === item.id ? 'page' : undefined} onClick={() => setSection(item.id)}><item.icon size={18} strokeWidth={1.8} /><span>{item.label}</span>{section === item.id && <span className="nav-active-indicator" />}</button>)}
        </nav>
        <div className="sidebar-bottom"><div className="privacy-mini"><div className="privacy-mini-icon"><LockKeyhole size={15} /></div><div><strong>Your data, your control</strong><span>Local first · cloud backup optional</span></div></div><div className="sidebar-profile"><div className="profile-avatar">{auth.user?.email?.slice(0, 1).toUpperCase() ?? 'G'}</div><div className="sidebar-profile-copy"><strong>{auth.user ? 'My account' : 'Guest profile'}</strong><span>{auth.user?.email ?? 'Sign in to enable your account'}</span></div><button className="profile-settings" aria-label={auth.user ? 'Open account settings' : 'Sign in or create an account'} onClick={() => auth.user ? setSection('settings') : onOpenAccountPage()}>{auth.user ? <Settings2 size={17} /> : <LogIn size={17} />}</button></div></div>
      </aside>
      <nav className="mobile-bottom-nav" aria-label="Quick navigation">
        {NAV_ITEMS.filter((item) => MOBILE_PRIMARY_SECTIONS.includes(item.id)).map((item) => (
          <button key={item.id} type="button" className={`mobile-nav-item ${section === item.id ? 'mobile-nav-active' : ''}`} aria-current={section === item.id ? 'page' : undefined} onClick={() => { setSection(item.id); setMobileMoreOpen(false); }}>
            <item.icon size={19} strokeWidth={1.9} />
            <span>{MOBILE_NAV_LABELS[item.id] ?? item.label}</span>
          </button>
        ))}
        <button type="button" className={`mobile-nav-item ${mobileMoreOpen ? 'mobile-nav-active' : ''}`} aria-expanded={mobileMoreOpen} aria-controls="cyclecue-mobile-more" onClick={() => setMobileMoreOpen((open) => !open)}>
          <MoreHorizontal size={20} strokeWidth={1.9} /><span>More</span>
        </button>
      </nav>
      {mobileMoreOpen && <>
        <button className="mobile-more-backdrop" type="button" aria-label="Close more navigation" onClick={() => setMobileMoreOpen(false)} />
        <nav id="cyclecue-mobile-more" className="mobile-more-panel" aria-label="More navigation">
          {NAV_ITEMS.filter((item) => !MOBILE_PRIMARY_SECTIONS.includes(item.id)).map((item) => (
            <button key={item.id} type="button" className={`mobile-more-item ${section === item.id ? 'mobile-more-active' : ''}`} onClick={() => { setSection(item.id); setMobileMoreOpen(false); }}>
              <item.icon size={18} /><span>{item.label}</span>
            </button>
          ))}
        </nav>
      </>}
      <div className="main-area">
        <header className="topbar"><div className="mobile-brand"><div className="brand-mark"><img src="/brand/cyclecue-mark.png" alt="" /></div><strong>CycleCue</strong></div><div className="breadcrumb"><span>Workspace</span><ChevronRight size={14} /><strong>{NAV_ITEMS.find((item) => item.id === section)?.label}</strong></div><div className="topbar-right"><span className="local-badge"><span /> {auth.user ? 'Account · backup on demand' : 'Private · local only'}</span><button className="topbar-help" onClick={() => setSection('assistant')}><CircleHelp size={17} /><span>Help</span></button><button className="topbar-account" onClick={() => auth.user ? setSection('settings') : onOpenAccountPage()}>{auth.user ? <UserRound size={16} /> : <LogIn size={16} />}<span>{auth.user ? 'My account' : 'Sign in'}</span></button></div></header>
        <main className="page-content">
          {section === 'overview' && <Overview state={tracker} today={today} onLogPeriod={() => { setPeriodDate(today); setFormError(''); setModal('period'); }} onLogSymptoms={openCheckIn} onStartFresh={startFresh} onNavigate={setSection} />}
          {section === 'calendar' && <><SectionTitle eyebrow="YOUR MONTH" title="Cycle calendar" description="Recorded period days and estimated cycle windows in one place." action={<button className="button button-primary" onClick={() => { setPeriodDate(today); setFormError(''); setModal('period'); }}><Plus size={16} /> Log period</button>} /><MonthCalendar state={tracker} today={today} /><div className="calendar-help surface"><Info size={18} /><p>Solid rose marks recorded period days. Dashed rose marks an estimated next period. Sage marks an estimated fertile window. These estimates are not a contraception method.</p></div></>}
          {section === 'insights' && <Insights state={tracker} onDeletePeriod={deletePeriodRecord} onDeleteCheckIn={deleteCheckInRecord} />}
          {section === 'pregnancy' && <PregnancyTracker today={today} />}
          {section === 'fertility' && <FertilityTracker observations={tracker.fertilityObservations} today={today} onAdd={addFertilityObservation} onDelete={deleteFertilityObservation} />}
          {section === 'nutrition' && <NutritionPlanner />}
          {section === 'movement' && <MovementPlanner />}
          {section === 'wellness' && <WomensWellness />}
          {section === 'habits' && <HabitTracker storageKey={storageKey} />}
          {section === 'recycle' && <RecycleBin records={purgeExpiredRecords(tracker).recycleBin} onRestore={restoreRecord} onPermanentDelete={permanentlyDeleteRecord} onEmpty={emptyRecycleBin} />}
          {section === 'assistant' && <Assistant state={tracker} onOpenAccount={onOpenAccountPage} />}
          {section === 'about' && <AboutPage />}
          {section === 'settings' && <Settings key={`${tracker.profile.cycleLength}:${tracker.profile.periodLength}`} state={tracker} onProfileChange={updateProfile} onExport={exportData} onDelete={deleteData} storageMessage={storageMessage} accountEmail={auth.user?.email} cloudConfigured={Boolean(auth.user && supabase)} cloudBusy={cloudBusy} onBackup={() => { void cloudBackup(); }} onRestore={() => { void cloudRestore(); }} onSignOut={() => { void handleSignOut(); }} />}
          <ModuleSafetyNote />
          <footer className="page-footer"><span>CycleCue · Made for awareness, not diagnosis.</span><span>Cycle and fertility dates are estimates only.</span></footer>
        </main>
      </div>
      {modal === 'period' && <Modal title="Log a period" subtitle="Record the first day of menstrual bleeding." onClose={closeModal}><form className="modal-form" onSubmit={addPeriod}><label className="form-field"><span>Period start date</span><input type="date" value={periodDate} max={today} onChange={(event) => setPeriodDate(event.target.value)} required /></label><p className="modal-helper">The first day of bleeding is counted as cycle day 1.</p>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="modal-actions"><button type="button" className="button button-ghost" onClick={closeModal}>Cancel</button><button type="submit" className="button button-primary">Save date</button></div></form></Modal>}
      {modal === 'checkin' && <Modal title="Daily check-in" subtitle="A quick note about how you feel today." onClose={closeModal}><form className="modal-form" onSubmit={addCheckIn}><label className="form-field"><span>Check-in date</span><input type="date" value={checkinDate} max={today} onChange={(event) => handleCheckInDateChange(event.target.value)} required /></label><label className="form-field"><span>Flow (optional)</span><select value={flow} onChange={(event) => setFlow(event.target.value as FlowLevel | '')}><option value="">Not tracking</option><option value="spotting">Spotting</option><option value="light">Light</option><option value="medium">Medium</option><option value="heavy">Heavy</option></select></label><label className="form-field"><span>Mood (optional)</span><select value={mood} onChange={(event) => setMood(event.target.value as Mood | '')}><option value="">Not selected</option><option value="good">Good</option><option value="okay">Okay</option><option value="low">Low</option><option value="anxious">Anxious</option></select></label><fieldset className="symptom-fieldset"><legend>Symptoms (optional)</legend><div className="symptom-chip-grid">{SYMPTOMS.map((symptom) => <label className={`symptom-chip ${symptoms.includes(symptom) ? 'symptom-selected' : ''}`} key={symptom}><input type="checkbox" checked={symptoms.includes(symptom)} onChange={() => toggleSymptom(symptom)} /><span>{symptom}</span>{symptoms.includes(symptom) && <Check size={13} />}</label>)}</div></fieldset>{formError && <p className="form-error" role="alert">{formError}</p>}<div className="modal-actions"><button type="button" className="button button-ghost" onClick={closeModal}>Cancel</button><button type="submit" className="button button-primary">Save check-in</button></div></form></Modal>}
      {toast && <div className="toast-message" role="status"><Check size={16} />{toast}</div>}
    </div>
  );
}

export default App;
