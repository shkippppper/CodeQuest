import { useMemo, useState } from "react";
import { ArrowRight, RotateCcw, Trophy, PartyPopper } from "lucide-react";
import type { Question } from "../../content/types";
import { QuestionCard } from "./QuestionCard";
import { useProgress } from "../../game/store";
import { cn } from "../../lib/cn";

interface Props {
  topicId: string;
  questions: Question[];
  isReview?: boolean;
  onFinished?: (score: number) => void;
}

export function Quiz({ topicId, questions, isReview, onFinished }: Props) {
  const { recordAnswer, recordFlashcard, completeTopic } = useProgress();
  const [index, setIndex] = useState(0);
  const [results, setResults] = useState<(boolean | null)[]>(() => questions.map(() => null));
  const [done, setDone] = useState(false);
  const [runKey, setRunKey] = useState(0);

  const q = questions[index];
  const graded = results[index] !== null;
  const isLast = index === questions.length - 1;

  const score = useMemo(() => {
    const correct = results.filter((r) => r === true).length;
    return questions.length ? correct / questions.length : 0;
  }, [results, questions.length]);

  function handleGraded(correct: boolean) {
    setResults((prev) => {
      const next = [...prev];
      next[index] = correct;
      return next;
    });
    if (q.type === "flashcard") recordFlashcard(topicId, q.id, correct, { isReview });
    else recordAnswer(topicId, q.id, correct, { isReview });
  }

  function next() {
    if (isLast) {
      const correct = results.filter((r) => r === true).length;
      const finalScore = questions.length ? correct / questions.length : 0;
      if (!isReview) completeTopic(topicId, finalScore);
      setDone(true);
      onFinished?.(finalScore);
    } else {
      setIndex((i) => i + 1);
    }
  }

  function restart() {
    setResults(questions.map(() => null));
    setIndex(0);
    setDone(false);
    setRunKey((k) => k + 1);
  }

  if (questions.length === 0) {
    return (
      <p className="text-sm" style={{ color: "var(--text-muted)" }}>
        No questions for this topic yet.
      </p>
    );
  }

  if (done) {
    const correct = results.filter((r) => r === true).length;
    const pct = Math.round(score * 100);
    const perfect = correct === questions.length;
    return (
      <div
        className="cq-pop rounded-2xl border p-8 text-center"
        style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}
      >
        <div
          className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
          style={{ background: perfect ? "color-mix(in srgb, var(--color-brand-500) 22%, transparent)" : "color-mix(in srgb, var(--color-quest-500) 16%, transparent)" }}
        >
          {perfect ? <Trophy size={30} color="var(--color-brand-500)" /> : <PartyPopper size={30} color="var(--color-quest-600)" />}
        </div>
        <h3 className="text-xl font-bold">{perfect ? "Flawless!" : "Quiz complete"}</h3>
        <p className="mt-1 text-3xl font-extrabold" style={{ color: "var(--color-brand-500)" }}>
          {correct}/{questions.length}
        </p>
        <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
          {pct}% correct{perfect ? " — perfect score bonus earned!" : ""}
        </p>
        <button
          onClick={restart}
          className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition hover:border-brand-400"
          style={{ borderColor: "var(--border)" }}
        >
          <RotateCcw size={16} /> Retry quiz
        </button>
      </div>
    );
  }

  return (
    <div>
      {/* progress */}
      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          {index + 1} / {questions.length}
        </span>
        <div className="flex flex-1 gap-1.5">
          {questions.map((_, i) => (
            <span
              key={i}
              className="h-1.5 flex-1 rounded-full transition"
              style={{
                background:
                  results[i] === true
                    ? "var(--ok)"
                    : results[i] === false
                      ? "var(--bad)"
                      : i === index
                        ? "var(--color-brand-500)"
                        : "var(--border)",
              }}
            />
          ))}
        </div>
      </div>

      <QuestionCard key={`${runKey}-${q.id}`} question={q} onGraded={handleGraded} />

      {graded && (
        <div className="mt-4 flex justify-end">
          <button
            onClick={next}
            className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
          >
            {isLast ? "Finish" : "Next question"} <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
