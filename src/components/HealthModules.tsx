import { useMemo, useState, type FormEvent } from 'react';
import {
  Activity, Apple, Baby, CalendarClock, Check, HeartHandshake, Leaf,
  RotateCcw, ShieldCheck, Sparkles, Trash2, Utensils, Wind,
} from 'lucide-react';
import type { FertilityObservation, RecycleRecord } from '../types';
import { formatDate, toDateKey } from '../lib/date';
import { getPregnancyEstimate, type PregnancyDatingMethod, type PregnancyEstimate } from '../lib/pregnancy';
import {
  HABIT_OPTIONS, HEALTH_SAFETY_NOTE, MOVEMENT_GUIDANCE, NUTRITION_GUIDANCE,
  SEXUAL_WELLNESS_GUIDANCE, type WellnessCard,
} from '../lib/wellness-content';
import { getDaysUntilExpiry, getRecycleRecordDate, getRecycleRecordLabel } from '../lib/recycle-bin';

function PageHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <div className="module-heading"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p>{description}</p></div>;
}

function GuidanceCards({ cards, icon: Icon }: { cards: WellnessCard[]; icon: typeof Leaf }) {
  return <div className="guidance-grid">{cards.map((card) => <article className="surface guidance-card" key={card.title}>
    <div className="guidance-icon"><Icon size={19} /></div><h2>{card.title}</h2><p>{card.summary}</p>
    <ul>{card.actions.map((action) => <li key={action}>{action}</li>)}</ul>
    {card.note && <p className="guidance-note"><ShieldCheck size={14} />{card.note}</p>}
  </article>)}</div>;
}

export function PregnancyTracker({ today }: { today: string }) {
  const [method, setMethod] = useState<PregnancyDatingMethod>('lmp');
  const [date, setDate] = useState('');
  const [cycleLength, setCycleLength] = useState('28');
  const [embryoAgeDays, setEmbryoAgeDays] = useState<'3' | '5'>('5');
  const [estimate, setEstimate] = useState<PregnancyEstimate | null>(null);
  const [error, setError] = useState('');

  const calculate = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    try {
      const result = getPregnancyEstimate({
        method,
        date,
        today,
        cycleLength: Number(cycleLength),
        embryoAgeDays: Number(embryoAgeDays) as 3 | 5,
      });
      setEstimate(result);
    } catch (reason) {
      setEstimate(null);
      setError(reason instanceof Error ? reason.message : 'Unable to calculate this estimate.');
    }
  };

  const methodLabel = method === 'lmp' ? 'First day of last menstrual period' : method === 'conception' ? 'Estimated conception date' : 'Embryo transfer date';
  return <>
    <PageHeading eyebrow="PREGNANCY JOURNEY" title="Pregnancy tracker" description="Explore an estimated due date and gestational timeline using the dating information you choose." />
    <div className="pregnancy-layout">
      <section className="surface module-form-card">
        <div className="module-card-heading"><div className="guidance-icon"><Baby size={20} /></div><div><h2>Estimate your due date</h2><p>Choose the dating method advised for your situation.</p></div></div>
        <form className="settings-form" onSubmit={calculate}>
          <label className="form-field"><span>Dating method</span><select value={method} onChange={(event) => { setMethod(event.target.value as PregnancyDatingMethod); setEstimate(null); }}>
            <option value="lmp">Last menstrual period (LMP)</option><option value="conception">Conception date</option><option value="ivf-transfer">IVF embryo transfer</option>
          </select></label>
          <label className="form-field"><span>{methodLabel}</span><input type="date" value={date} max={today} onChange={(event) => setDate(event.target.value)} required /></label>
          {method === 'lmp' && <label className="form-field"><span>Usual cycle length <small>15–60 days</small></span><input type="number" min="15" max="60" value={cycleLength} onChange={(event) => setCycleLength(event.target.value)} required /></label>}
          {method === 'ivf-transfer' && <label className="form-field"><span>Embryo age at transfer</span><select value={embryoAgeDays} onChange={(event) => setEmbryoAgeDays(event.target.value as '3' | '5')}><option value="3">Day 3 embryo</option><option value="5">Day 5 embryo</option></select></label>}
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="button button-primary" type="submit"><CalendarClock size={16} /> Calculate estimate</button>
        </form>
        <p className="module-disclaimer">This is a dating estimate, not confirmation of pregnancy or fetal development. A clinician may adjust dating after assessment or ultrasound.</p>
      </section>
      <section className="surface pregnancy-result-card">
        {estimate ? <>
          <div className="pregnancy-result-top"><div className="guidance-icon"><Sparkles size={19} /></div><span className="estimate-pill">Estimated date</span></div>
          <p className="eyebrow">ESTIMATED DUE DATE</p><div className="edd-date">{formatDate(estimate.dueDate, { month: 'long', day: 'numeric', year: 'numeric' })}</div>
          <div className="pregnancy-stat-grid"><div><strong>{estimate.weeks}w {estimate.days}d</strong><span>Estimated gestational age</span></div><div><strong>{estimate.trimester}{estimate.trimester === 1 ? 'st' : estimate.trimester === 2 ? 'nd' : 'rd'}</strong><span>Trimester</span></div></div>
          <div className="pregnancy-progress"><div><span>Estimated timeline</span><strong>{Math.min(100, Math.round((estimate.gestationalDays / 280) * 100))}%</strong></div><div className="pregnancy-progress-track"><span style={{ width: `${Math.min(100, (estimate.gestationalDays / 280) * 100)}%` }} /></div></div>
          <p className="module-disclaimer">{estimate.isPastDue ? 'The estimated date has passed. Contact your maternity care team for individualized guidance.' : `${Math.max(0, estimate.daysUntilDue)} days until the estimated due date.`}</p>
        </> : <div className="pregnancy-empty"><div className="pregnancy-illustration"><Baby size={42} /></div><h2>Your timeline starts here</h2><p>Enter a dating reference to calculate an estimate. You can use the calculator without saving pregnancy details.</p></div>}
      </section>
    </div>
    <section className="surface pregnancy-info-card"><div className="guidance-icon"><ShieldCheck size={18} /></div><div><h2>Important dating guidance</h2><p>LMP-based calculations assume a typical 28-day cycle and ovulation around day 14. Cycle-length adjustment is approximate. Conception and IVF calculations use different reference points. Your clinician's dating should take priority.</p><p className="source-link"><a href="https://www.acog.org/womens-health/faqs/obstetric-estimate-of-gestation-and-due-date" target="_blank" rel="noreferrer">ACOG · Estimated due date guidance ↗</a></p></div></section>
  </>;
}

export function FertilityTracker({ observations, today, onAdd, onDelete }: {
  observations: FertilityObservation[];
  today: string;
  onAdd: (input: Omit<FertilityObservation, 'id'>) => void;
  onDelete: (id: string) => void;
}) {
  const [date, setDate] = useState(today);
  const [opkResult, setOpkResult] = useState<'positive' | 'negative' | 'not-tested'>('not-tested');
  const [cervicalMucus, setCervicalMucus] = useState<'dry' | 'sticky' | 'creamy' | 'watery' | 'egg-white' | 'unknown'>('unknown');
  const [temperature, setTemperature] = useState('');
  const [error, setError] = useState('');
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    const temp = temperature.trim() ? Number(temperature) : null;
    if (temp !== null && (!Number.isFinite(temp) || temp < 30 || temp > 42)) {
      setError('Enter a temperature between 30.00°C and 42.00°C.'); return;
    }
    if (opkResult === 'not-tested' && cervicalMucus === 'unknown' && temp === null) {
      setError('Add at least one observation before saving.'); return;
    }
    onAdd({ date, opkResult, cervicalMucus, basalBodyTempC: temp });
    setTemperature(''); setOpkResult('not-tested'); setCervicalMucus('unknown'); setDate(today);
  };
  return <>
    <PageHeading eyebrow="FERTILITY AWARENESS" title="Ovulation observations" description="Log optional ovulation predictor test results, cervical mucus observations and basal body temperature. These signals are not a diagnosis." />
    <div className="fertility-layout">
      <section className="surface module-form-card">
        <div className="module-card-heading"><div className="guidance-icon"><Sparkles size={19} /></div><div><h2>Add an observation</h2><p>Record observations from your own tracking routine.</p></div></div>
        <form className="settings-form" onSubmit={submit}>
          <label className="form-field"><span>Observation date</span><input type="date" value={date} max={today} onChange={(event) => setDate(event.target.value)} required /></label>
          <label className="form-field"><span>Ovulation predictor test (OPK)</span><select value={opkResult} onChange={(event) => setOpkResult(event.target.value as typeof opkResult)}><option value="not-tested">Not tested</option><option value="positive">Positive</option><option value="negative">Negative</option></select></label>
          <label className="form-field"><span>Cervical mucus observation</span><select value={cervicalMucus} onChange={(event) => setCervicalMucus(event.target.value as typeof cervicalMucus)}><option value="unknown">Not recorded</option><option value="dry">Dry</option><option value="sticky">Sticky</option><option value="creamy">Creamy</option><option value="watery">Watery</option><option value="egg-white">Clear / stretchy (egg-white-like)</option></select></label>
          <label className="form-field"><span>Basal body temperature <small>Optional · °C</small></span><input type="number" min="30" max="42" step="0.01" value={temperature} onChange={(event) => setTemperature(event.target.value)} placeholder="e.g. 36.45" /></label>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button type="submit" className="button button-primary">Save observation</button>
        </form>
      </section>
      <section className="surface fertility-education">
        <div className="guidance-icon"><ShieldCheck size={19} /></div><h2>Understanding the signals</h2>
        <div className="fertility-signal"><strong>OPK results</strong><p>A positive test suggests an LH surge may be occurring. It does not prove that ovulation happened.</p></div>
        <div className="fertility-signal"><strong>Basal body temperature</strong><p>A sustained temperature shift may help identify a pattern retrospectively. A single reading cannot predict ovulation.</p></div>
        <div className="fertility-signal"><strong>Cervical mucus</strong><p>Changes can be one observation among several, but can be affected by infection, medication and other factors.</p></div>
        <p className="module-disclaimer">Do not use these records or calendar estimates as contraception. Seek clinical advice for fertility concerns.</p>
      </section>
    </div>
    <section className="surface fertility-history"><div className="surface-heading"><div><p className="eyebrow">YOUR RECORDS</p><h2>Recent observations</h2></div><span className="soft-icon"><CalendarClock size={17} /></span></div>
      {observations.length ? <div className="history-list">{[...observations].sort((a, b) => b.date.localeCompare(a.date)).map((item) => <div className="history-row" key={item.id}><div><strong>{formatDate(item.date)} · OPK {item.opkResult.replace('-', ' ')}</strong><span>Mucus: {item.cervicalMucus.replace('-', ' ')} · BBT: {item.basalBodyTempC === null ? 'Not recorded' : `${item.basalBodyTempC.toFixed(2)}°C`}</span></div><button className="text-button" onClick={() => onDelete(item.id)}>Move to bin <Trash2 size={13} /></button></div>)}</div> : <div className="empty-state"><div className="empty-state-icon"><CalendarClock size={20} /></div><strong>No observations yet</strong><p>Your saved OPK, BBT and mucus observations will appear here.</p></div>}
    </section>
  </>;
}

export function NutritionPlanner() {
  const [preference, setPreference] = useState('No preference');
  const [goal, setGoal] = useState('Balanced everyday nutrition');
  const plans = useMemo(() => {
    const base = [
      { meal: 'Breakfast', ideas: ['Oats with fruit and nuts', 'Vegetable poha with yogurt', 'Whole-grain toast with eggs or tofu'] },
      { meal: 'Lunch', ideas: ['Dal, rice or roti and seasonal vegetables', 'Chickpea bowl with greens and grains', 'Grilled protein with vegetables and potatoes'] },
      { meal: 'Snack', ideas: ['Fruit with yogurt', 'Roasted chana or nuts', 'Hummus with vegetable sticks'] },
      { meal: 'Dinner', ideas: ['Vegetable khichdi with a protein side', 'Bean and vegetable wrap', 'Soup with whole-grain bread and paneer or tofu'] },
    ];
    return base.map((item) => ({ ...item, ideas: preference === 'Vegetarian' ? item.ideas.filter((idea) => !idea.toLowerCase().includes('eggs')) : item.ideas }));
  }, [preference]);
  return <>
    <PageHeading eyebrow="FOOD & NOURISHMENT" title="Nutrition planner" description="Flexible meal ideas and everyday nutrition habits. Adapt meals to your culture, budget, preferences and health needs." />
    <section className="surface nutrition-controls"><div><h2>Personalize your ideas</h2><p>These preferences are used only to adjust the suggestions on this screen.</p></div>
      <label className="form-field"><span>Food preference</span><select value={preference} onChange={(event) => setPreference(event.target.value)}><option>No preference</option><option>Vegetarian</option><option>Vegan</option><option>Gluten-free</option><option>Dairy-free</option></select></label>
      <label className="form-field"><span>Focus</span><select value={goal} onChange={(event) => setGoal(event.target.value)}><option>Balanced everyday nutrition</option><option>More fibre-rich foods</option><option>More plant-based variety</option><option>Pregnancy nutrition education</option><option>Menstrual wellbeing</option></select></label>
    </section>
    <div className="meal-plan-grid">{plans.map((item) => <article className="surface meal-card" key={item.meal}><div className="meal-icon"><Utensils size={18} /></div><p className="eyebrow">MEAL IDEAS</p><h2>{item.meal}</h2><ul>{item.ideas.map((idea) => <li key={idea}>{idea}</li>)}</ul></article>)}</div>
    <section className="surface nutrition-focus"><div><p className="eyebrow">YOUR CURRENT FOCUS</p><h2>{goal}</h2><p>Build a sustainable routine with variety and regular meals. This planner does not calculate calories, prescribe supplements or treat medical conditions.</p></div><div className="nutrition-badge"><Apple size={25} /></div></section>
    <GuidanceCards cards={NUTRITION_GUIDANCE} icon={Leaf} />
    <p className="module-disclaimer">For diabetes, eating disorders, allergies, kidney conditions, pregnancy or other medical needs, seek individualized nutrition guidance from a qualified professional.</p>
  </>;
}

export function MovementPlanner() {
  const [lifeStage, setLifeStage] = useState('Everyday movement');
  const [level, setLevel] = useState('Gentle / returning');
  return <>
    <PageHeading eyebrow="MOVEMENT & RECOVERY" title="Movement planner" description="Simple activity ideas designed around comfort, consistency and recovery—not performance pressure." />
    <section className="surface nutrition-controls"><div><h2>Choose your starting point</h2><p>These choices adjust the language and reminders, not medical clearance.</p></div>
      <label className="form-field"><span>Life stage</span><select value={lifeStage} onChange={(event) => setLifeStage(event.target.value)}><option>Everyday movement</option><option>Pregnancy</option><option>Postpartum recovery</option><option>Perimenopause / menopause</option></select></label>
      <label className="form-field"><span>Current activity</span><select value={level} onChange={(event) => setLevel(event.target.value)}><option>Gentle / returning</option><option>Regular movement</option><option>Active</option></select></label>
    </section>
    <div className="activity-week-grid">{[
      ['Monday', 'Comfortable walk', '10–30 minutes at a conversational pace'],
      ['Tuesday', 'Mobility', 'Gentle full-body mobility or stretching'],
      ['Wednesday', 'Strength basics', 'Light, controlled bodyweight movements'],
      ['Thursday', 'Recovery', 'Rest, breathing or an easy walk'],
      ['Friday', 'Enjoyable activity', 'Dance, swimming or another activity you like'],
      ['Saturday', 'Gentle yoga', 'Adapted movement with no painful positions'],
      ['Sunday', 'Rest and reflect', 'Notice energy, sleep and how your body feels'],
    ].map(([day, title, detail]) => <article className="surface activity-day" key={day}><span className="activity-day-label">{day}</span><div className="activity-day-icon"><Activity size={17} /></div><h3>{title}</h3><p>{detail}</p></article>)}</div>
    <section className="surface movement-note"><div className="guidance-icon"><Wind size={19} /></div><div><h2>{lifeStage} · {level}</h2><p>Use this as an idea list, not a prescribed training plan. Pregnancy, postpartum recovery, pelvic-floor symptoms, pain or chronic conditions can require individualized modifications and clinical advice.</p></div></section>
    <GuidanceCards cards={MOVEMENT_GUIDANCE} icon={Activity} />
  </>;
}

export function WomensWellness() {
  return <>
    <PageHeading eyebrow="REPRODUCTIVE & SEXUAL HEALTH" title="Women's wellness" description="Evidence-aware education for sexual wellbeing, preventive care, hygiene and reproductive health." />
    <GuidanceCards cards={SEXUAL_WELLNESS_GUIDANCE} icon={HeartHandshake} />
    <section className="surface wellness-check-card"><div className="guidance-icon"><ShieldCheck size={19} /></div><div><h2>When to seek care</h2><p>Seek prompt medical advice for new or persistent pelvic pain, unusual bleeding, sores, discharge with pain or fever, pain during sex, or concerns about possible STI exposure. Sudden severe pain, fainting, heavy bleeding with weakness, or immediate danger needs urgent local medical help.</p></div></section>
    <p className="module-disclaimer">This section is educational. It does not assess sexual function, diagnose infection or replace individual medical advice.</p>
  </>;
}

interface HabitStorageState {
  completed: string[];
  warning: string;
}

function loadHabitState(key: string): HabitStorageState {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { completed: [], warning: '' };
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.every((item) => typeof item === 'string' && HABIT_OPTIONS.some((habit) => habit.id === item))) {
      return { completed: parsed, warning: '' };
    }
    window.localStorage.removeItem(key);
    return { completed: [], warning: 'A saved habit check-in could not be read and was reset.' };
  } catch {
    return { completed: [], warning: 'Browser storage is unavailable; habit check-ins may not persist.' };
  }
}

export function HabitTracker({ storageKey }: { storageKey: string }) {
  const today = toDateKey(new Date());
  const key = `${storageKey}.habits.${today}`;
  return <HabitTrackerForDay key={key} storageKey={key} />;
}

function HabitTrackerForDay({ storageKey }: { storageKey: string }) {
  const [initialState] = useState(() => loadHabitState(storageKey));
  const [completed, setCompleted] = useState<string[]>(initialState.completed);
  const [storageWarning, setStorageWarning] = useState(initialState.warning);

  const toggle = (id: string) => {
    const next = completed.includes(id) ? completed.filter((item) => item !== id) : [...completed, id];
    setCompleted(next);
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(next));
      setStorageWarning('');
    } catch {
      setStorageWarning('Could not save this check-in in browser storage.');
    }
  };

  return <>
    <PageHeading eyebrow="DAILY WELLBEING" title="Healthy habits" description="Small, flexible check-ins. You do not need to complete everything to have a good day." />
    <section className="surface habit-progress-card"><div><p className="eyebrow">TODAY'S CHECK-IN</p><h2>{completed.length} of {HABIT_OPTIONS.length} habits checked in</h2><p>Progress is a gentle reminder, not a score.</p></div><div className="habit-progress-circle"><strong>{Math.round((completed.length / HABIT_OPTIONS.length) * 100)}%</strong><span>today</span></div></section>
    <div className="habit-list">{HABIT_OPTIONS.map((habit) => <label className={`surface habit-row ${completed.includes(habit.id) ? 'habit-done' : ''}`} key={habit.id}><input type="checkbox" checked={completed.includes(habit.id)} onChange={() => toggle(habit.id)} /><span className="habit-check"><Check size={15} /></span><span className="habit-copy"><strong>{habit.label}</strong><small>{habit.detail}</small></span></label>)}</div>
    {storageWarning && <p className="storage-warning" role="status">{storageWarning}</p>}
    <p className="module-disclaimer">Habits are saved in this browser for the current day. They are not yet included in cloud sync.</p>
  </>;
}

export function RecycleBin({ records, onRestore, onPermanentDelete, onEmpty }: {
  records: RecycleRecord[];
  onRestore: (id: string) => void;
  onPermanentDelete: (id: string) => void;
  onEmpty: () => void;
}) {
  return <>
    <PageHeading eyebrow="YOUR DATA, YOUR CONTROL" title="Recycle Bin" description="Deleted cycle records are kept here for 30 days so you can restore them before permanent deletion." />
    <section className="surface recycle-summary"><div className="guidance-icon"><Trash2 size={20} /></div><div><h2>{records.length} item{records.length === 1 ? '' : 's'} in your Recycle Bin</h2><p>Records past their retention date are automatically removed when your data is next loaded.</p></div>{records.length > 0 && <button className="button button-danger" onClick={onEmpty}>Empty bin</button>}</section>
    {records.length ? <div className="recycle-list">{[...records].sort((a, b) => b.deletedAt.localeCompare(a.deletedAt)).map((record) => <article className="surface recycle-row" key={record.id}><div className="recycle-item-icon"><Trash2 size={17} /></div><div className="recycle-item-copy"><strong>{getRecycleRecordLabel(record)}</strong><span>Original date: {formatDate(getRecycleRecordDate(record))} · {getDaysUntilExpiry(record)} day{getDaysUntilExpiry(record) === 1 ? '' : 's'} left</span></div><button className="button button-soft" onClick={() => onRestore(record.id)}><RotateCcw size={15} /> Restore</button><button className="icon-button recycle-delete" aria-label={`Permanently delete ${getRecycleRecordLabel(record)}`} onClick={() => onPermanentDelete(record.id)}><Trash2 size={16} /></button></article>)}</div> : <div className="surface recycle-empty"><div className="recycle-empty-icon"><Check size={26} /></div><h2>Your Recycle Bin is empty</h2><p>When you delete cycle dates or check-ins, they will appear here for up to 30 days.</p></div>}
    <p className="module-disclaimer">Cloud-account records use the same restore and permanent-delete workflow when cloud sync is enabled. This screen currently displays local cycle records.</p>
  </>;
}

export function ModuleSafetyNote() {
  return <div className="global-safety-note"><ShieldCheck size={15} />{HEALTH_SAFETY_NOTE}</div>;
}
