import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { RotateCcw, ArrowRight, Sparkles, CheckCircle2 } from "lucide-react";
import { getTopic, subjectOfTopic } from "../content/registry";
import type { Question, Topic } from "../content/types";
import { QuestionCard } from "../components/quiz/QuestionCard";
import { useProgress } from "../game/store";
import { useSubject } from "../game/subject";

interface ReviewItem {
  topic: Topic;
  question: Question;
}

export function ReviewPage() {
  const { state, recordAnswer, recordFlashcard } = useProgress();
  const { subject } = useSubject();

  // Snapshot the queue once per mount so items don't vanish mid-session as they're cleared.
  const [items] = useState<ReviewItem[]>(() => {
    const list: ReviewItem[] = [];
    for (const { topicId, qId } of Object.values(state.wrongLog)) {
      const topic = getTopic(topicId);
      const question = topic?.quiz.find((q) => q.id === qId);
      if (topic && question && subjectOfTopic(topic) === subject) list.push({ topic, question });
    }
    return list;
  });

  const [index, setIndex] = useState(0);
  const [graded, setGraded] = useState(false);
  const [fixed, setFixed] = useState(0);
  const [done, setDone] = useState(false);

  const current = items[index];
  const isLast = index === items.length - 1;

  const empty = items.length === 0;

  function handleGraded(correct: boolean, score?: number) {
    setGraded(true);
    if (correct) setFixed((f) => f + 1);
    if (current.question.type === "flashcard") recordFlashcard(current.topic.meta.id, current.question.id, correct, { isReview: true });
    else recordAnswer(current.topic.meta.id, current.question.id, correct, { isReview: true, score });
  }

  function next() {
    if (isLast) {
      setDone(true);
    } else {
      setIndex((i) => i + 1);
      setGraded(false);
    }
  }

  if (empty) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "color-mix(in srgb, var(--ok) 16%, transparent)" }}>
          <CheckCircle2 size={32} color="var(--ok)" />
        </div>
        <h1 className="text-2xl font-extrabold">Nothing to review</h1>
        <p className="mt-2" style={{ color: "var(--text-muted)" }}>
          Questions you miss get saved here automatically so you can master them later. Go get a few wrong — it’s how you learn!
        </p>
        <Link to="/" className="mt-5 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16 text-center">
        <div className="cq-pop mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: "color-mix(in srgb, var(--color-quest-500) 18%, transparent)" }}>
          <Sparkles size={30} color="var(--color-quest-600)" />
        </div>
        <h1 className="text-2xl font-extrabold">Review complete</h1>
        <p className="mt-2 text-lg" style={{ color: "var(--text-muted)" }}>
          You fixed <strong style={{ color: "var(--color-brand-500)" }}>{fixed}</strong> of {items.length} missed questions.
        </p>
        <Link to="/" className="mt-5 inline-block rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-[760px] px-5 py-7 sm:px-8">
      <div className="mb-5 flex items-center gap-2">
        <RotateCcw size={22} color="var(--color-quest-600)" />
        <h1 className="text-2xl font-extrabold">Review session</h1>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
          {index + 1} / {items.length}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
          <div className="h-full rounded-full transition-all" style={{ width: `${((index + (graded ? 1 : 0)) / items.length) * 100}%`, background: "var(--color-quest-500)" }} />
        </div>
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        From: {current.topic.meta.title}
      </p>

      <QuestionCard key={`${index}-${current.question.id}`} question={current.question} onGraded={handleGraded} />

      {graded && (
        <div className="mt-4 flex justify-end">
          <button onClick={next} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
            {isLast ? "Finish" : "Next"} <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
