import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import { Swords, ArrowRight, Trophy, Target, RotateCcw, Shuffle, Zap } from "lucide-react";
import {
  questionsForSubject,
  sampleQuestions,
  type FlatQuestion,
} from "../content/registry";
import { DIFFICULTY_META, SUBJECTS, type Difficulty } from "../content/types";
import { QuestionCard } from "../components/quiz/QuestionCard";
import { useProgress } from "../game/store";
import { useSubject } from "../game/subject";

type DiffChoice = Difficulty | "mixed";
const SIZES = [10, 20, 30] as const;
const DIFFS: DiffChoice[] = ["junior", "mid", "senior", "mixed"];

function diffLabel(d: DiffChoice): string {
  return d === "mixed" ? "Mixed" : DIFFICULTY_META[d].label;
}
function diffColor(d: DiffChoice): string {
  return d === "mixed" ? "var(--color-brand-500)" : DIFFICULTY_META[d].color;
}

export function ChallengePage() {
  const { subject } = useSubject();
  const [phase, setPhase] = useState<"config" | "run" | "done">("config");
  const [diff, setDiff] = useState<DiffChoice>("mixed");
  const [size, setSize] = useState<number>(20);
  const [items, setItems] = useState<FlatQuestion[]>([]);
  const [result, setResult] = useState({ correct: 0, total: 0 });

  const subjectPool = useMemo(() => questionsForSubject(subject), [subject]);
  const countFor = (d: DiffChoice) =>
    d === "mixed" ? subjectPool.length : subjectPool.filter((q) => q.difficulty === d).length;
  const available = countFor(diff);
  const effectiveSize = Math.min(size, available);

  function start() {
    setItems(sampleQuestions(size, diff, subject));
    setPhase("run");
  }

  if (phase === "config") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "color-mix(in srgb, var(--color-brand-500) 16%, transparent)" }}>
              <Swords size={24} color="var(--color-brand-600)" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight">Challenge mode</h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Random questions pulled from all {subjectPool.length} in {SUBJECTS[subject].label}.
              </p>
            </div>
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Difficulty
          </p>
          <div className="mb-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {DIFFS.map((d) => {
              const picked = d === diff;
              const c = diffColor(d);
              return (
                <button
                  key={d}
                  onClick={() => setDiff(d)}
                  className="flex cursor-pointer flex-col items-center gap-1 rounded-xl border px-3 py-3 text-sm font-semibold transition"
                  style={{
                    borderColor: picked ? c : "var(--border)",
                    background: picked ? `color-mix(in srgb, ${c} 14%, transparent)` : "var(--bg-elev)",
                    color: picked ? c : "var(--text)",
                  }}
                >
                  {d === "mixed" ? <Shuffle size={16} /> : <span className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />}
                  {diffLabel(d)}
                  <span className="text-[0.7rem] font-normal" style={{ color: "var(--text-muted)" }}>
                    {countFor(d)} Qs
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
            Length
          </p>
          <div className="mb-7 flex gap-2">
            {SIZES.map((s) => {
              const picked = s === size;
              return (
                <button
                  key={s}
                  onClick={() => setSize(s)}
                  className="flex-1 cursor-pointer rounded-xl border px-3 py-3 text-sm font-semibold transition"
                  style={{
                    borderColor: picked ? "var(--color-brand-500)" : "var(--border)",
                    background: picked ? "color-mix(in srgb, var(--color-brand-500) 12%, transparent)" : "var(--bg-elev)",
                    color: picked ? "var(--color-brand-600)" : "var(--text)",
                  }}
                >
                  {s} questions
                </button>
              );
            })}
          </div>

          <button
            onClick={start}
            disabled={available === 0}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-bold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Zap size={18} /> Start {effectiveSize}-question challenge
          </button>
          {available > 0 && effectiveSize < size && (
            <p className="mt-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>
              Only {available} {diffLabel(diff).toLowerCase()} questions exist right now — you'll get all of them.
            </p>
          )}
        </motion.div>
      </div>
    );
  }

  if (phase === "run") {
    return (
      <Runner
        items={items}
        onDone={(c, t) => {
          setResult({ correct: c, total: t });
          setPhase("done");
        }}
      />
    );
  }

  const accuracy = result.total ? Math.round((result.correct / result.total) * 100) : 0;
  const perfect = result.total > 0 && result.correct === result.total;
  return (
    <div className="mx-auto max-w-2xl px-5 py-16 text-center">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 220, damping: 16 }}
        className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-3xl"
        style={{ background: "color-mix(in srgb, var(--color-brand-500) 16%, transparent)" }}
      >
        <Trophy size={38} color="var(--color-brand-600)" />
      </motion.div>
      <h1 className="text-3xl font-extrabold">{perfect ? "Flawless!" : "Challenge complete"}</h1>
      <p className="mt-2 text-lg" style={{ color: "var(--text-muted)" }}>
        You scored <strong style={{ color: "var(--color-brand-500)" }}>{result.correct}</strong> / {result.total} — {accuracy}% accuracy.
      </p>
      <div className="mt-6 flex justify-center gap-3">
        <button
          onClick={() => setPhase("config")}
          className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
        >
          <RotateCcw size={16} /> New challenge
        </button>
        <Link to="/" className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition" style={{ borderColor: "var(--border)" }}>
          Dashboard
        </Link>
      </div>
    </div>
  );
}

function Runner({
  items,
  onDone,
}: {
  items: FlatQuestion[];
  onDone: (correct: number, total: number) => void;
}) {
  const { recordAnswer, recordFlashcard } = useProgress();
  const [index, setIndex] = useState(0);
  const [graded, setGraded] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);

  const current = items[index];
  const isLast = index === items.length - 1;

  function handleGraded(correct: boolean, score?: number) {
    setGraded(true);
    if (correct) setCorrectCount((c) => c + 1);
    if (current.question.type === "flashcard") recordFlashcard(current.topic.meta.id, current.question.id, correct);
    else recordAnswer(current.topic.meta.id, current.question.id, correct, { score });
  }

  function next() {
    if (isLast) {
      onDone(correctCount, items.length);
    } else {
      setIndex((i) => i + 1);
      setGraded(false);
    }
  }

  return (
    <div className="mx-auto max-w-[760px] px-5 py-7 sm:px-8">
      <div className="mb-5 flex items-center gap-2">
        <Swords size={22} color="var(--color-brand-600)" />
        <h1 className="text-2xl font-extrabold">Challenge</h1>
        <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--ok)" }}>
          <Target size={15} /> {correctCount} correct
        </span>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-medium tabular-nums" style={{ color: "var(--text-muted)" }}>
          {index + 1} / {items.length}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "var(--color-brand-500)" }}
            animate={{ width: `${((index + (graded ? 1 : 0)) / items.length) * 100}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        From: {current.topic.meta.title}
      </p>

      <AnimatePresence mode="wait">
        <motion.div
          key={`${index}-${current.question.id}`}
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -24 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
        >
          <QuestionCard question={current.question} onGraded={handleGraded} />
        </motion.div>
      </AnimatePresence>

      {graded && (
        <div className="mt-4 flex justify-end">
          <button onClick={next} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
            {isLast ? "See results" : "Next"} <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
