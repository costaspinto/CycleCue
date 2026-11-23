export interface AssistantReply {
  answer: string;
  disclaimer?: string;
}

const RESPONSES: Array<{ keywords: string[]; answer: string }> = [
  {
    keywords: ['cycle', 'period', 'late', 'irregular'],
    answer: 'Cycle length can vary from month to month. Record the first day of each period and look at the pattern over several cycles. A calendar estimate cannot explain why a period is late or diagnose a condition. Speak with a healthcare professional if changes concern you.',
  },
  {
    keywords: ['ovulation', 'fertile', 'fertility', 'conceive', 'pregnant'],
    answer: 'Ovulation timing can shift, even when cycles seem regular. This app estimates a possible window from recorded period dates only; it does not confirm ovulation or predict whether pregnancy will occur. Ovulation tests and clinical guidance can provide additional information when appropriate.',
  },
  {
    keywords: ['cramp', 'pain', 'ache'],
    answer: 'Mild cramps can occur around menstruation, but pain that is severe, new, worsening, or disrupting everyday activities deserves medical assessment. Seek urgent medical help for sudden severe pain, fainting, heavy bleeding with weakness, or symptoms that feel alarming.',
  },
  {
    keywords: ['pregnancy test', 'test positive', 'missed period', 'pregnancy'],
    answer: 'A cycle tracker cannot confirm or rule out pregnancy. A home pregnancy test is the appropriate next step when pregnancy is possible; follow the test instructions and contact a healthcare professional about the result or any symptoms that concern you.',
  },
  {
    keywords: ['mood', 'stress', 'sleep', 'tired', 'fatigue'],
    answer: 'You can use the check-in to notice whether mood, energy, sleep, or symptoms change across cycles. A pattern in a tracker is a record, not a diagnosis. Consider discussing persistent or distressing symptoms with a healthcare professional.',
  },
  {
    keywords: ['data', 'privacy', 'private', 'delete', 'export'],
    answer: 'Your tracker records stay in this browser on this device. They are not sent to a CycleCue server. Browser storage is not encrypted and can be accessible to scripts running on this device, so avoid using shared devices and clear your data when needed. You can export or delete your records in Settings.',
  },
];

export function getAssistantReply(message: string): AssistantReply {
  const normalized = message.trim().toLowerCase();
  if (!normalized) {
    return { answer: 'Type a question about cycle tracking, predictions, symptoms, or privacy and I will point you to general information.' };
  }
  const match = RESPONSES.find((item) => item.keywords.some((keyword) => normalized.includes(keyword)));
  return {
    answer: match?.answer ?? 'I can help with general cycle-tracking information, how the estimates work, symptom logging, and data privacy. I cannot diagnose symptoms, confirm ovulation, or determine whether someone is pregnant. For personal medical advice, contact a qualified healthcare professional.',
    disclaimer: 'General information only — not a medical diagnosis or a substitute for professional care.',
  };
}
