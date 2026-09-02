import type { MCQQuestion } from "./types";

/**
 * Exact existing semantic: selectedOption === question.answer.
 * Null/undefined selection is incorrect. Comparison is case-sensitive.
 */
export function isAnswerCorrect(
  question: Pick<MCQQuestion, "answer">,
  selectedOption: string | null | undefined,
): boolean {
  return selectedOption === question.answer;
}

/** Increment by 1 when correct; otherwise leave the score unchanged. */
export function nextScore(currentScore: number, correct: boolean): number {
  return correct ? currentScore + 1 : currentScore;
}
