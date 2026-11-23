import { ArrowUpRight, Baby, CalendarHeart, HeartHandshake, Leaf, ShieldCheck, Sparkles } from 'lucide-react';

const FEATURES = [
  { icon: CalendarHeart, title: 'Cycle awareness', text: 'Log periods, symptoms and patterns. Date-based predictions remain clearly labelled as estimates.' },
  { icon: Sparkles, title: 'Fertility observations', text: 'Keep optional OPK, cervical-mucus and basal-temperature observations together.' },
  { icon: Baby, title: 'Pregnancy dating', text: 'Explore estimated due dates and pregnancy milestones using the dating method you select.' },
  { icon: HeartHandshake, title: 'Whole-person wellness', text: 'Find general education for sexual health, nutrition, movement, habits and wellbeing.' },
];

export function AboutPage() {
  return (
    <div className="about-page">
      <section className="about-hero">
        <div className="about-hero-copy"><p className="eyebrow">A LITTLE MORE ABOUT US</p><h1>Women's health deserves a calmer, clearer space.</h1><p>CycleCue brings everyday cycle awareness, reproductive health education and personal wellness notes into one supportive place — with your data and your choices at the centre.</p><span className="about-version">CYCLECUE · VERSION 1.3</span></div>
        <div className="about-hero-art" aria-hidden="true"><div className="about-art-orbit orbit-one"/><div className="about-art-orbit orbit-two"/><div className="about-art-core"><span>✿</span></div><div className="about-art-spark spark-one">✧</div><div className="about-art-spark spark-two">✦</div></div>
      </section>
      <section className="about-feature-section"><div className="about-section-heading"><p className="eyebrow">WHAT YOU CAN DO</p><h2>One companion, across different life stages.</h2><p>Choose only the features that are relevant to you. Pregnancy and fertility tools are optional.</p></div><div className="about-feature-grid">{FEATURES.map(({ icon: Icon, title, text }) => <article className="surface about-feature-card" key={title}><span><Icon size={21} /></span><h3>{title}</h3><p>{text}</p></article>)}</div></section>
      <section className="about-principles"><div className="about-principle-mark"><ShieldCheck size={24} /></div><div><p className="eyebrow">OUR PRODUCT PRINCIPLES</p><h2>Private by choice. Transparent by design.</h2><p>CycleCue is designed to make its data behaviour visible. Local mode keeps tracker information in this browser. Supabase accounts enable sign-in and user-scoped cloud backup after configuration. AI chat is optional and requires a separate consent action; tracker records are not silently attached to prompts.</p></div></section>
      <section className="about-disclaimer"><div><p className="eyebrow">IMPORTANT TO KNOW</p><h2>Awareness tools, not medical decisions.</h2><p>Cycle dates, fertile windows and pregnancy calculations are estimates. CycleCue is not a medical device, contraceptive method or substitute for a qualified healthcare professional. For urgent symptoms, seek prompt medical attention.</p></div><a href="https://www.nhs.uk/conditions/periods/" target="_blank" rel="noreferrer">Read NHS period guidance <ArrowUpRight size={15} /></a></section>
      <footer className="about-footer"><span>Made with care for everyday health awareness.</span><span><Leaf size={14} /> Gentle guidance, informed choices.</span></footer>
    </div>
  );
}
