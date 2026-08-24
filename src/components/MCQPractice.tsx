"use client";

import { useState } from "react";
import type { MCQQuestion } from "@/lib/geography-data";

type MCQPracticeProps = {
  questions: MCQQuestion[];
};

export default function MCQPractice({ questions }: MCQPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState(0);

  if (!questions.length) {
    return null;
  }

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const isCorrect = selectedOption === currentQuestion.answer;
  const isLastQuestion = currentIndex === questions.length - 1;

  function handleSelect(option: string) {
    if (submitted) return;
    setSelectedOption(option);
  }

  function handleSubmit() {
    if (!selectedOption || submitted) return;

    setSubmitted(true);

    if (selectedOption === currentQuestion.answer) {
      setScore((previous) => previous + 1);
    }
  }

  function handleNext() {
    if (!isLastQuestion) {
      setCurrentIndex((previous) => previous + 1);
      setSelectedOption(null);
      setSubmitted(false);
    }
  }

  function handleRestart() {
    setCurrentIndex(0);
    setSelectedOption(null);
    setSubmitted(false);
    setScore(0);
  }

  if (submitted && isLastQuestion) {
    const finalScore = score;

    return (
      <section className="mcq-practice">
        <div className="mcq-heading">
          <p className="mcq-eyebrow">BCS PRACTICE ENGINE</p>
          <h2>Test Your Knowledge</h2>
          <p className="mcq-subtitle">Practice complete</p>
        </div>

        <div className="mcq-result-card">
          <div className="mcq-result-label">YOUR SCORE</div>

          <div className="mcq-result-score">
            {finalScore}
            <span> / {questions.length}</span>
          </div>

          <p className="mcq-result-message">
            {finalScore === questions.length
              ? "Excellent. All answers are correct."
              : finalScore >= Math.ceil(questions.length * 0.6)
                ? "Good performance. Review the missed concepts."
                : "Keep practicing. Focus on the explanations and BCS traps."}
          </p>

          <button
            type="button"
            className="mcq-button mcq-button-primary"
            onClick={handleRestart}
          >
            Practice Again
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="mcq-practice">
      <div className="mcq-heading">
        <p className="mcq-eyebrow">BCS PRACTICE ENGINE</p>
        <h2>Test Your Knowledge</h2>
        <p className="mcq-subtitle">
          Select the best answer, then check your response.
        </p>
      </div>

      <div className="mcq-progress-area">
        <div className="mcq-progress-meta">
          <span>
            Question <strong>{currentIndex + 1}</strong> of{" "}
            <strong>{questions.length}</strong>
          </span>

          <span>{Math.round(progress)}%</span>
        </div>

        <div className="mcq-progress-track">
          <div
            className="mcq-progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      <article className="mcq-question-card">
        <div className="mcq-question-number">
          QUESTION {String(currentIndex + 1).padStart(2, "0")}
        </div>

        <h3 className="mcq-question">{currentQuestion.question}</h3>

        <div className="mcq-options">
          {currentQuestion.options.map((option, index) => {
            const isSelected = selectedOption === option;
            const isAnswer = option === currentQuestion.answer;

            let optionClass = "mcq-option";

            if (submitted && isAnswer) {
              optionClass += " mcq-option-correct";
            } else if (submitted && isSelected && !isAnswer) {
              optionClass += " mcq-option-wrong";
            } else if (isSelected) {
              optionClass += " mcq-option-selected";
            }

            return (
              <button
                key={option}
                type="button"
                className={optionClass}
                onClick={() => handleSelect(option)}
                disabled={submitted}
              >
                <span className="mcq-option-letter">
                  {String.fromCharCode(65 + index)}
                </span>

                <span className="mcq-option-text">{option}</span>

                <span className="mcq-option-indicator">
                  {submitted && isAnswer
                    ? "✓"
                    : submitted && isSelected
                      ? "✕"
                      : isSelected
                        ? "●"
                        : ""}
                </span>
              </button>
            );
          })}
        </div>

        {!submitted && (
          <button
            type="button"
            className="mcq-button mcq-button-primary mcq-check-button"
            onClick={handleSubmit}
            disabled={!selectedOption}
          >
            Check Answer
          </button>
        )}

        {submitted && (
          <div
            className={`mcq-feedback ${
              isCorrect ? "mcq-feedback-correct" : "mcq-feedback-wrong"
            }`}
          >
            <div className="mcq-feedback-title">
              {isCorrect ? "✓ Correct Answer" : "✕ Incorrect Answer"}
            </div>

            {!isCorrect && (
              <p className="mcq-feedback-answer">
                <strong>Your answer:</strong> {selectedOption}
              </p>
            )}

            <p className="mcq-feedback-answer">
              <strong>Correct answer:</strong> {currentQuestion.answer}
            </p>

            <div className="mcq-explanation">
              <p className="mcq-info-label">WHY?</p>
              <p>{currentQuestion.explanation}</p>
            </div>

            <div className="mcq-shortcut">
              <p className="mcq-info-label">BCS SHORTCUT / TRAP</p>
              <p>{currentQuestion.shortcutOrTrap}</p>
            </div>
          </div>
        )}

        {submitted && !isLastQuestion && (
          <button
            type="button"
            className="mcq-button mcq-button-next"
            onClick={handleNext}
          >
            Next Question
            <span>→</span>
          </button>
        )}
      </article>

      <div className="mcq-scoreline">
        Current score:
        <strong>{score}</strong>
      </div>
    </section>
  );
}