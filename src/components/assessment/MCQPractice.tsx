"use client";

import { useState } from "react";
import type { MCQ } from "@/types/assessment";

export function MCQPractice({ questions }: { questions: MCQ[] }) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  if (!questions.length) return null;
  const question = questions[index];
  const answered = selected !== null;
  return <section className="topic-section" aria-labelledby="mcq-heading"><p className="eyebrow">Practice {index + 1}/{questions.length}</p><h2 id="mcq-heading">{question.question}</h2><div className="grid">{question.options.map((option) => <button key={option} className="card" type="button" onClick={() => setSelected(option)} disabled={answered} aria-pressed={selected === option}>{option}</button>)}</div>{answered ? <p role="status">{selected === question.answer ? "Correct." : `Answer: ${question.answer}.`} {question.explanation}</p> : null}{answered && index < questions.length - 1 ? <button className="cta primary" type="button" onClick={() => { setIndex((value) => value + 1); setSelected(null); }}>Next question →</button> : null}</section>;
}
