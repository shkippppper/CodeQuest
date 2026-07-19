import { useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ClipboardCheck, ArrowRight, RotateCcw, Timer, Trophy, Clock, Gauge } from "lucide-react";
import { sampleQuestions, type FlatQuestion } from "../content/registry";
import { CATEGORIES, DIFFICULTY_META, SUBJECTS, type CategoryId, type Difficulty } from "../content/types";
import { QuestionCard } from "../components/quiz/QuestionCard";
import { useProgress } from "../game/store";
import { useSubject } from "../game/subject";

const ROUND_SIZE = 10;
const ALL_DIFFS: Difficulty[] = ["junior", "mid", "senior"];

interface Result {
  correct: boolean;
  difficulty: Difficulty;
  category: CategoryId;
  timeMs: number;
  timedOut: boolean;
}

function timeLimitFor(type: FlatQuestion["question"]["type"]): number {
  if (type === "flashcard") return 45;
  if (type === "multi") return 40;
  return 30;
}

interface Verdict {
  label: string;
  color: string;
  blurb: string;
}
function verdictFor(accuracy: number): Verdict {
  if (accuracy >= 0.9) return { label: "Strong Hire", color: "var(--ok)", blurb: "Interview-ready. You'd clear this round comfortably." };
  if (accuracy >= 0.75) return { label: "Hire", color: "var(--color-brand-500)", blurb: "Solid performance — a few gaps to tighten." };
  if (accuracy >= 0.6) return { label: "Lean Hire", color: "var(--color-quest-500)", blurb: "On the bubble. Shore up the weak spots below." };
  return { label: "Keep practicing", color: "var(--bad)", blurb: "Not there yet — the breakdown shows where to focus." };
}

export function SimulatorPage() {
  const { subject } = useSubject();
  const [phase, setPhase] = useState<"intro" | "run" | "scorecard">("intro");
  const [items, setItems] = useState<FlatQuestion[]>([]);
  const [results, setResults] = useState<Result[]>([]);

  const poolSize = useMemo(() => sampleQuestions(ROUND_SIZE, "mixed", subject).length, [subject]);

  function start() {
    setItems(sampleQuestions(ROUND_SIZE, "mixed", subject));
    setResults([]);
    setPhase("run");
  }

  if (phase === "intro") {
    return (
      <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl" style={{ background: "color-mix(in srgb, var(--color-quest-500) 16%, transparent)" }}>
              <ClipboardCheck size={24} color="var(--color-quest-600)" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold leading-tight">Interview Simulator</h1>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                A timed mock interview in {SUBJECTS[subject].label}.
              </p>
            </div>
          </div>

          <div className="mb-7 grid gap-3 sm:grid-cols-3">
            <Rule icon={<Timer size={18} />} title={`${ROUND_SIZE} questions`} body="Random mix of topics and difficulty." />
            <Rule icon={<Clock size={18} />} title="Per-question clock" body="Beat the timer — time's up counts as a miss." />
            <Rule icon={<Gauge size={18} />} title="Scored & graded" body="A verdict and a breakdown at the end." />
          </div>

          <p className="mb-6 text-sm" style={{ color: "var(--text-muted)" }}>
            No going back once you answer — just like the real thing. Flashcards are self-graded: recall the answer, flip the card, and be honest.
          </p>

          <button
            onClick={start}
            disabled={poolSize === 0}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl bg-brand-500 px-6 py-3.5 text-base font-bold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <ClipboardCheck size={18} /> Start the interview
          </button>
          {poolSize === 0 && (
            <p className="mt-2 text-center text-xs" style={{ color: "var(--text-muted)" }}>
              No questions available for this subject yet.
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
        onDone={(res) => {
          setResults(res);
          setPhase("scorecard");
        }}
      />
    );
  }

  return <Scorecard results={results} onRetry={() => setPhase("intro")} />;
}

function Rule({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}>
      <div className="mb-1 flex items-center gap-2" style={{ color: "var(--color-quest-600)" }}>
        {icon}
        <span className="text-sm font-bold" style={{ color: "var(--text)" }}>{title}</span>
      </div>
      <p className="text-xs" style={{ color: "var(--text-muted)" }}>{body}</p>
    </div>
  );
}

function Runner({ items, onDone }: { items: FlatQuestion[]; onDone: (results: Result[]) => void }) {
  const { recordAnswer, recordFlashcard } = useProgress();
  const [index, setIndex] = useState(0);
  const [graded, setGraded] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const resultsRef = useRef<Result[]>([]);
  const startRef = useRef<number>(Date.now());

  const current = items[index];
  const isLast = index === items.length - 1;
  const limit = timeLimitFor(current.question.type);

  function handleGraded(correct: boolean, score?: number) {
    setGraded(true);
    if (correct) setCorrectCount((c) => c + 1);
    if (current.question.type === "flashcard") recordFlashcard(current.topic.meta.id, current.question.id, correct);
    else recordAnswer(current.topic.meta.id, current.question.id, correct, { score });

    const timeMs = Date.now() - startRef.current;
    resultsRef.current.push({
      correct,
      difficulty: current.difficulty,
      category: current.topic.meta.category,
      timeMs,
      timedOut: timeMs >= limit * 1000 - 500,
    });
  }

  function next() {
    if (isLast) {
      onDone(resultsRef.current);
    } else {
      setIndex((i) => i + 1);
      setGraded(false);
      startRef.current = Date.now();
    }
  }

  return (
    <div className="mx-auto max-w-[760px] px-5 py-7 sm:px-8">
      <div className="mb-5 flex items-center gap-2">
        <ClipboardCheck size={22} color="var(--color-quest-600)" />
        <h1 className="text-2xl font-extrabold">Interview</h1>
        <span className="ml-auto inline-flex items-center gap-1 text-sm font-semibold" style={{ color: "var(--ok)" }}>
          <Trophy size={15} /> {correctCount} correct
        </span>
      </div>

      <div className="mb-4 flex items-center gap-3">
        <span className="text-sm font-medium tabular-nums" style={{ color: "var(--text-muted)" }}>
          {index + 1} / {items.length}
        </span>
        <div className="h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
          <motion.div
            className="h-full rounded-full"
            style={{ background: "var(--color-quest-500)" }}
            animate={{ width: `${((index + (graded ? 1 : 0)) / items.length) * 100}%` }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </div>
      </div>

      <p className="mb-2 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
        From: {current.topic.meta.title}
      </p>

      <motion.div
        key={`${index}-${current.question.id}`}
        initial={{ opacity: 0, x: 24 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        <QuestionCard
          question={current.question}
          onGraded={handleGraded}
          timeLimitSec={graded ? undefined : limit}
        />
      </motion.div>

      {graded && (
        <div className="mt-4 flex justify-end">
          <button onClick={next} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
            {isLast ? "See scorecard" : "Next"} <ArrowRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}

function Scorecard({ results, onRetry }: { results: Result[]; onRetry: () => void }) {
  const total = results.length;
  const correct = results.filter((r) => r.correct).length;
  const accuracy = total ? correct / total : 0;
  const verdict = verdictFor(accuracy);
  const timedOut = results.filter((r) => r.timedOut).length;
  const totalSec = Math.round(results.reduce((s, r) => s + r.timeMs, 0) / 1000);

  const byDiff = ALL_DIFFS.map((d) => {
    const rows = results.filter((r) => r.difficulty === d);
    return { d, correct: rows.filter((r) => r.correct).length, total: rows.length };
  }).filter((x) => x.total > 0);

  const catMap = new Map<CategoryId, { correct: number; total: number }>();
  for (const r of results) {
    const e = catMap.get(r.category) ?? { correct: 0, total: 0 };
    e.total++;
    if (r.correct) e.correct++;
    catMap.set(r.category, e);
  }
  const byCat = [...catMap.entries()].map(([cat, v]) => ({ cat, ...v, acc: v.correct / v.total }));
  byCat.sort((a, b) => b.acc - a.acc || b.total - a.total);

  const strongest = byCat.length >= 2 ? byCat[0] : null;
  const weakest = byCat.length >= 2 ? byCat[byCat.length - 1] : null;

  const mins = Math.floor(totalSec / 60);
  const secs = totalSec % 60;

  return (
    <div className="mx-auto max-w-2xl px-5 py-10 sm:px-8">
      <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 200, damping: 18 }}>
        {/* verdict headline */}
        <div className="rounded-3xl border p-6 text-center sm:p-8" style={{ borderColor: `color-mix(in srgb, ${verdict.color} 45%, var(--border))`, background: "var(--bg-elev)" }}>
          <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: `color-mix(in srgb, ${verdict.color} 18%, transparent)` }}>
            <Trophy size={32} color={verdict.color} />
          </div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>Verdict</p>
          <h1 className="mt-1 text-3xl font-extrabold" style={{ color: verdict.color }}>{verdict.label}</h1>
          <p className="mt-2 text-sm" style={{ color: "var(--text-muted)" }}>{verdict.blurb}</p>
          <div className="mt-5 flex items-center justify-center gap-6">
            <ScoreStat value={`${correct}/${total}`} label="Correct" />
            <ScoreStat value={`${Math.round(accuracy * 100)}%`} label="Accuracy" />
            <ScoreStat value={mins > 0 ? `${mins}m ${secs}s` : `${secs}s`} label="Total time" />
          </div>
          {timedOut > 0 && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold" style={{ background: "color-mix(in srgb, var(--bad) 12%, transparent)", color: "var(--bad-strong)" }}>
              <Clock size={13} /> Ran out of time on {timedOut} question{timedOut === 1 ? "" : "s"}
            </p>
          )}
        </div>

        {/* by difficulty */}
        <motion.div {...fade(0.1)} className="mt-5 rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>By difficulty</h2>
          <div className="flex flex-col gap-3">
            {byDiff.map((x) => (
              <Bar key={x.d} label={DIFFICULTY_META[x.d].label} correct={x.correct} total={x.total} color={DIFFICULTY_META[x.d].color} />
            ))}
          </div>
        </motion.div>

        {/* by category */}
        <motion.div {...fade(0.16)} className="mt-4 rounded-2xl border p-5" style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}>
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>By category</h2>
          <div className="flex flex-col gap-3">
            {byCat.map((x) => (
              <Bar key={x.cat} label={CATEGORIES[x.cat].label} correct={x.correct} total={x.total} color={CATEGORIES[x.cat].accent} />
            ))}
          </div>
          {strongest && weakest && strongest.cat !== weakest.cat && (
            <p className="mt-4 text-sm" style={{ color: "var(--text-muted)" }}>
              Strongest: <strong style={{ color: "var(--text)" }}>{CATEGORIES[strongest.cat].label}</strong> · Weakest:{" "}
              <strong style={{ color: "var(--text)" }}>{CATEGORIES[weakest.cat].label}</strong>
            </p>
          )}
        </motion.div>

        <div className="mt-6 flex justify-center gap-3">
          <button onClick={onRetry} className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600">
            <RotateCcw size={16} /> New interview
          </button>
          <Link to="/" className="inline-flex items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition" style={{ borderColor: "var(--border)" }}>
            Dashboard
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

function fade(delay: number) {
  return {
    initial: { opacity: 0, y: 12 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay, ease: [0.2, 0.8, 0.2, 1] as const },
  };
}

function ScoreStat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-2xl font-extrabold">{value}</div>
      <div className="text-xs" style={{ color: "var(--text-muted)" }}>{label}</div>
    </div>
  );
}

function Bar({ label, correct, total, color }: { label: string; correct: number; total: number; color: string }) {
  const pct = total ? (correct / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="w-40 shrink-0 truncate text-sm font-medium">{label}</span>
      <div className="h-2.5 flex-1 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        />
      </div>
      <span className="w-10 shrink-0 text-right text-xs font-semibold tabular-nums" style={{ color: "var(--text-muted)" }}>
        {correct}/{total}
      </span>
    </div>
  );
}
