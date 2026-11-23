export interface WellnessCard {
  title: string;
  summary: string;
  actions: string[];
  note?: string;
}

export const NUTRITION_GUIDANCE: WellnessCard[] = [
  { title: 'Build a balanced plate', summary: 'Use variety rather than restrictive rules: vegetables and fruit, whole grains, protein foods, and sources of calcium and healthy fats.', actions: ['Add a fruit or vegetable to meals', 'Choose a protein source you enjoy', 'Include fibre-rich grains or pulses'], note: 'Needs vary by age, medical history, pregnancy stage, allergies and culture.' },
  { title: 'Hydration', summary: 'Keep water accessible and drink regularly. Needs change with climate, activity, illness and pregnancy.', actions: ['Keep a refillable bottle nearby', 'Drink more during hot weather or exercise', 'Use thirst and urine colour as general cues, not strict targets'] },
  { title: 'Iron and folate awareness', summary: 'Iron and folate are important nutrients. Food sources include pulses, leafy greens, beans, nuts and fortified foods.', actions: ['Pair plant iron sources with vitamin C foods', 'Discuss supplements and blood tests with a clinician', 'Do not start high-dose supplements based on app advice'], note: 'Pregnancy supplement guidance is country- and person-specific; follow a clinician or local public-health guidance.' },
  { title: 'Pregnancy food safety', summary: 'Pregnancy can change food-safety recommendations. Use current local clinical guidance for foods to avoid, safe cooking and food handling.', actions: ['Wash produce and hands', 'Cook foods thoroughly', 'Check local guidance on unpasteurized foods, seafood and caffeine'] },
];

export const MOVEMENT_GUIDANCE: WellnessCard[] = [
  { title: 'Gentle daily movement', summary: 'Walking, mobility work and everyday movement can support general wellbeing.', actions: ['Start at a comfortable pace', 'Build duration gradually', 'Choose supportive footwear and hydration'] },
  { title: 'Strength and mobility', summary: 'Appropriate resistance and mobility activities can support function and confidence.', actions: ['Use controlled movements', 'Keep effort manageable', 'Ask for modifications if pregnant, postpartum or managing a condition'] },
  { title: 'Yoga and relaxation', summary: 'Gentle stretching, breathing and relaxation can help you unwind.', actions: ['Avoid painful positions', 'Use props for comfort', 'Choose pregnancy-specific classes where relevant'] },
  { title: 'Recovery matters', summary: 'Rest, sleep and recovery are part of a sustainable movement routine.', actions: ['Include easier days', 'Notice pain, dizziness or unusual breathlessness', 'Stop and seek medical advice for concerning symptoms'] },
];

export const SEXUAL_WELLNESS_GUIDANCE: WellnessCard[] = [
  { title: 'Consent and communication', summary: 'Healthy sexual relationships are based on freely given, informed, reversible and ongoing consent.', actions: ['Talk about boundaries and preferences', 'Respect a no or a change of mind', 'Seek support if you feel pressured or unsafe'] },
  { title: 'STI prevention and testing', summary: 'Many sexually transmitted infections can have no obvious symptoms. Testing and barrier protection can reduce risk.', actions: ['Discuss testing with a healthcare provider', 'Use condoms or other barrier methods correctly', 'Ask about HPV and hepatitis B vaccination eligibility'] },
  { title: 'Vulvovaginal care', summary: 'Avoid fragranced products and internal cleansing. The vagina is self-cleaning; gentle external washing is usually sufficient.', actions: ['Use mild, fragrance-free external care', 'Avoid vaginal douching', 'Seek care for persistent, unusual, painful or concerning symptoms'] },
  { title: 'Contraception awareness', summary: 'There are multiple contraception options with different effectiveness, benefits and considerations.', actions: ['Discuss options with a qualified provider', 'Do not rely on calendar predictions as contraception', 'Ask about emergency contraception promptly when needed'] },
];

export const HABIT_OPTIONS = [
  { id: 'water', label: 'Drink water regularly', detail: 'Keep a bottle nearby.' },
  { id: 'movement', label: 'Move in a way that feels good', detail: 'Walking, stretching or other comfortable activity.' },
  { id: 'sleep', label: 'Protect a regular sleep routine', detail: 'Create a calm wind-down when possible.' },
  { id: 'nutrition', label: 'Eat a balanced meal or snack', detail: 'Aim for variety, not perfection.' },
  { id: 'mindfulness', label: 'Take a mindful pause', detail: 'A few slow breaths or a quiet moment.' },
  { id: 'checkin', label: 'Notice how you feel', detail: 'Track symptoms or mood only when useful.' },
] as const;

export const HEALTH_SAFETY_NOTE = 'CycleCue provides general educational information and estimates. It does not diagnose, prescribe, confirm pregnancy or ovulation, or replace care from a qualified healthcare professional.';
