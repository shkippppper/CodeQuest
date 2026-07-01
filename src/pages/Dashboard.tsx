import { useMemo } from "react";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import * as Icons from "lucide-react";
import { ArrowRight, Star, Target, CheckCircle2, Zap, RotateCcw, Trophy, Lock, Layers } from "lucide-react";
import { TOPICS, TOTAL_TOPICS, TOTAL_QUESTIONS, groupedByCategory } from "../content/registry";
import { CATEGORIES } from "../content/types";
import { useProgress } from "../game/store";
import { BADGES } from "../game/badges";
import { topicMastery, masteryColor, masteryLabel, MASTERY_TIERS, type MasteryTier } from "../lib/mastery";

const TIER_COLOR: Record<string, string> = { bronze: "#98abce", silver: "#6d85b4", gold: "#3c527d" };

const fadeUp = (delay: number) => ({
  initial: { opacity: 0, y: 16 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.45, delay, ease: [0.2, 0.8, 0.2, 1] as const },
});

function Lucide({ name, size, color }: { name: string; size: number; color?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[name] ?? Icons.Circle;
  return <Cmp size={size} color={color} />;
}

export function Dashboard() {
  const { state, level, reviewCount } = useProgress();

  const completedCount = Object.keys(state.completedTopics).length;
  const accuracy = state.totalAnswered > 0 ? Math.round((state.totalCorrect / state.totalAnswered) * 100) : 0;
  const earned = new Set(state.badges);
  const nextTopic = TOPICS.find((t) => !state.completedTopics[t.meta.id]) ?? TOPICS[0];
  const groups = groupedByCategory();

  const masteryCounts = useMemo(() => {
    const counts: Record<MasteryTier, number> = { "not-started": 0, learning: 0, proficient: 0, mastered: 0 };
    for (const t of TOPICS) counts[topicMastery(state, t.meta.id).tier]++;
    return counts;
  }, [state]);

  return (
    <div className="mx-auto max-w-5xl px-5 py-7 sm:px-8">
      {/* hero */}
      <motion.section
        {...fadeUp(0)}
        className="relative overflow-hidden rounded-3xl border p-6 sm:p-8"
        style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}
      >
        <div
          className="absolute -right-16 -top-16 h-56 w-56 rounded-full opacity-20 blur-2xl"
          style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-quest-600))" }}
        />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold" style={{ color: "var(--color-brand-500)" }}>
              {level.rank}
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Master Swift, level by level.
            </h1>
            <p className="mt-2 max-w-md" style={{ color: "var(--text-muted)" }}>
              Bite-sized lessons, code-driven quizzes, and XP for everything you learn. Your interview-prep adventure starts here.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                to={`/learn/${nextTopic.meta.id}`}
                className="inline-flex items-center gap-2 rounded-xl bg-brand-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-600"
              >
                {completedCount > 0 ? "Continue learning" : "Start your quest"} <ArrowRight size={16} />
              </Link>
              {reviewCount > 0 && (
                <Link
                  to="/review"
                  className="inline-flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition hover:border-brand-400"
                  style={{ borderColor: "var(--border)" }}
                >
                  <RotateCcw size={16} /> Review {reviewCount}
                </Link>
              )}
            </div>
          </div>

          {/* level ring */}
          <div className="flex shrink-0 items-center gap-4 sm:flex-col sm:items-end">
            <LevelRing level={level.level} progress={level.progress} />
            <div className="text-right">
              <div className="flex items-center gap-1.5 text-2xl font-extrabold">
                <Star size={20} fill="var(--color-brand-500)" color="var(--color-brand-500)" /> {state.xp}
              </div>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                {level.current}/{level.span} to level {level.level + 1}
              </p>
            </div>
          </div>
        </div>
      </motion.section>

      {/* stats */}
      <motion.section {...fadeUp(0.08)} className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat icon={<CheckCircle2 size={18} color="var(--ok)" />} label="Topics done" value={`${completedCount}/${TOTAL_TOPICS}`} />
        <Stat icon={<Zap size={18} color="var(--color-brand-500)" />} label="Questions" value={`${state.totalAnswered}/${TOTAL_QUESTIONS}`} />
        <Stat icon={<Target size={18} color="var(--color-brand-500)" />} label="Accuracy" value={`${accuracy}%`} />
        <Stat icon={<Trophy size={18} color="var(--color-brand-500)" />} label="Badges" value={`${earned.size}/${BADGES.length}`} />
      </motion.section>

      {/* mastery breakdown */}
      <motion.section
        {...fadeUp(0.12)}
        className="mt-5 rounded-2xl border p-5"
        style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}
      >
        <div className="mb-3 flex items-center gap-2">
          <Layers size={18} color="var(--color-brand-500)" />
          <h2 className="text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
            Mastery
          </h2>
        </div>
        <div className="flex h-3 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
          {MASTERY_TIERS.map((tier) => {
            const n = masteryCounts[tier];
            if (n === 0 || TOTAL_TOPICS === 0) return null;
            return (
              <div
                key={tier}
                style={{ width: `${(n / TOTAL_TOPICS) * 100}%`, background: masteryColor(tier) }}
                title={`${masteryLabel(tier)}: ${n}`}
              />
            );
          })}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {MASTERY_TIERS.map((tier) => (
            <div key={tier} className="flex items-center gap-2 text-sm">
              <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: masteryColor(tier), border: "1px solid var(--border)" }} />
              <span style={{ color: "var(--text-muted)" }}>{masteryLabel(tier)}</span>
              <span className="ml-auto font-bold">{masteryCounts[tier]}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* category progress */}
      <motion.section {...fadeUp(0.16)} className="mt-8">
        <h2 className="mb-3 text-lg font-extrabold">Learning paths</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {groups.map((g) => {
            const cat = CATEGORIES[g.id];
            const done = g.topics.filter((t) => state.completedTopics[t.meta.id]).length;
            const pct = g.topics.length ? Math.round((done / g.topics.length) * 100) : 0;
            const firstUndone = g.topics.find((t) => !state.completedTopics[t.meta.id]) ?? g.topics[0];
            return (
              <Link
                key={g.id}
                to={`/learn/${firstUndone.meta.id}`}
                className="group rounded-2xl border p-5 transition duration-200 hover:-translate-y-0.5 hover:border-brand-400 hover:shadow-lg"
                style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl" style={{ background: `color-mix(in srgb, ${cat.accent} 16%, transparent)` }}>
                    <Lucide name={cat.icon} size={20} color={cat.accent} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold">{cat.label}</p>
                    <p className="truncate text-xs" style={{ color: "var(--text-muted)" }}>{cat.blurb}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <div className="h-2 flex-1 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
                    <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: cat.accent }} />
                  </div>
                  <span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
                    {done}/{g.topics.length}
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </motion.section>

      {/* badges */}
      <motion.section {...fadeUp(0.24)} className="mt-8">
        <h2 className="mb-3 text-lg font-extrabold">Achievements</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {BADGES.map((b) => {
            const has = earned.has(b.id);
            const color = TIER_COLOR[b.tier];
            return (
              <div
                key={b.id}
                className="rounded-2xl border p-4 transition duration-200 hover:-translate-y-0.5"
                style={{
                  borderColor: has ? `color-mix(in srgb, ${color} 50%, var(--border))` : "var(--border)",
                  background: "var(--bg-elev)",
                  opacity: has ? 1 : 0.55,
                }}
              >
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl"
                  style={{ background: has ? `color-mix(in srgb, ${color} 20%, transparent)` : "color-mix(in srgb, var(--text) 6%, transparent)" }}
                >
                  {has ? <Lucide name={b.icon} size={22} color={color} /> : <Lock size={18} style={{ color: "var(--text-muted)" }} />}
                </div>
                <p className="mt-2 text-sm font-bold">{b.name}</p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>{b.description}</p>
              </div>
            );
          })}
        </div>
      </motion.section>
    </div>
  );
}

function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}>
      <div className="flex items-center gap-2">{icon}<span className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{label}</span></div>
      <p className="mt-1 text-2xl font-extrabold">{value}</p>
    </div>
  );
}

function LevelRing({ level, progress }: { level: number; progress: number }) {
  const r = 34;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-24 w-24">
      <svg viewBox="0 0 80 80" className="h-full w-full -rotate-90">
        <circle cx="40" cy="40" r={r} fill="none" stroke="var(--border)" strokeWidth="7" />
        <circle
          cx="40"
          cy="40"
          r={r}
          fill="none"
          stroke="url(#ring)"
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - progress)}
          style={{ transition: "stroke-dashoffset 0.6s ease" }}
        />
        <defs>
          <linearGradient id="ring" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="var(--color-brand-500)" />
            <stop offset="1" stopColor="var(--color-quest-600)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-extrabold leading-none">{level}</span>
        <span className="text-[0.6rem] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>Level</span>
      </div>
    </div>
  );
}
