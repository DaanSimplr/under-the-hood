/** Pure quiz helpers. */

export type Answerable = { answerIndex: number; options: string[] };

export function isCorrect(q: Answerable, choice: number | null): boolean {
  return choice !== null && choice === q.answerIndex;
}

export function scoreAnswers(questions: Answerable[], answers: Array<number | null>) {
  const correct = questions.filter((q, i) => isCorrect(q, answers[i] ?? null)).length;
  return {
    correct,
    total: questions.length,
    pct: questions.length ? correct / questions.length : 0,
  };
}

export function scoreMessage(correct: number, total: number): string {
  if (total === 0) return "";
  const pct = correct / total;
  if (pct === 1) return "Perfect score. You know this system well.";
  if (pct >= 0.75) return "Great work. Review the one you missed and try again.";
  if (pct >= 0.5) return "Good start. Read the part pages for the ones you missed.";
  return "Keep going. The system page is a good place to start.";
}
