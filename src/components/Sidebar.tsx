import { useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import * as Icons from "lucide-react";
import { Search, Bookmark, LayoutGrid, RotateCcw, Swords, X, Circle, CircleDashed, CircleDot, CheckCircle2, ChevronDown } from "lucide-react";
import { groupedBySubject } from "../content/registry";
import { CATEGORIES, DIFFICULTY_META, SUBJECTS, type Difficulty } from "../content/types";
import { useProgress } from "../game/store";
import { useSubject } from "../game/subject";
import { cn } from "../lib/cn";
import { topicMastery, type MasteryTier } from "../lib/mastery";

const SUBJECT_LIST = Object.values(SUBJECTS).sort((a, b) => a.order - b.order);

function Lucide({ name, size, color }: { name: string; size: number; color?: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[name] ?? Icons.Circle;
  return <Cmp size={size} color={color} />;
}

const ALL_DIFF: Difficulty[] = ["junior", "mid", "senior"];

const TIER_ICON: Record<MasteryTier, typeof Circle> = {
  "not-started": Circle,
  learning: CircleDashed,
  proficient: CircleDot,
  mastered: CheckCircle2,
};

export function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const { state, reviewCount } = useProgress();
  const { subject, setSubject } = useSubject();
  const [query, setQuery] = useState("");
  const [diffs, setDiffs] = useState<Set<Difficulty>>(new Set());
  const [collapsed, setCollapsed] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem("cq_sidebar_collapsed");
      return new Set<string>(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set<string>();
    }
  });

  // While searching or filtering, force every group open so matches are visible.
  const filtering = query.trim() !== "" || diffs.size > 0;

  const groups = useMemo(() => {
    const q = query.trim().toLowerCase();
    const forSubject = groupedBySubject().find((s) => s.id === subject)?.groups ?? [];
    return forSubject
      .map((g) => ({
        ...g,
        topics: g.topics.filter((t) => {
          const matchesQ = !q || t.meta.title.toLowerCase().includes(q) || t.meta.summary.toLowerCase().includes(q);
          const matchesDiff = diffs.size === 0 || diffs.has(t.meta.difficulty);
          return matchesQ && matchesDiff;
        }),
      }))
      .filter((g) => g.topics.length > 0);
  }, [query, diffs, subject]);

  function toggleDiff(d: Difficulty) {
    setDiffs((prev) => {
      const next = new Set(prev);
      if (next.has(d)) next.delete(d);
      else next.add(d);
      return next;
    });
  }

  function toggleCategory(id: string) {
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      try {
        localStorage.setItem("cq_sidebar_collapsed", JSON.stringify([...next]));
      } catch {
        /* ignore quota / private mode */
      }
      return next;
    });
  }

  return (
    <div className="flex h-full flex-col">
      {/* subject switcher */}
      <div className="px-3 pt-3">
        <div className="flex gap-1.5 rounded-xl border p-1" style={{ borderColor: "var(--border)", background: "var(--bg)" }}>
          {SUBJECT_LIST.map((s) => {
            const active = s.id === subject;
            return (
              <button
                key={s.id}
                onClick={() => setSubject(s.id)}
                title={s.blurb}
                className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition"
                style={{
                  background: active ? `color-mix(in srgb, ${s.accent} 18%, transparent)` : "transparent",
                  color: active ? s.accent : "var(--text-muted)",
                }}
              >
                <Lucide name={s.icon} size={14} color={active ? s.accent : "var(--text-muted)"} />
                <span className="truncate">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* search */}
      <div className="px-3 pt-3">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-muted)" }} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search topics…"
            className="w-full rounded-lg border py-2 pl-9 pr-8 text-sm outline-none transition focus:border-brand-500"
            style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer opacity-60 hover:opacity-100">
              <X size={14} />
            </button>
          )}
        </div>
        <div className="mt-2 flex gap-1.5">
          {ALL_DIFF.map((d) => {
            const active = diffs.has(d);
            return (
              <button
                key={d}
                onClick={() => toggleDiff(d)}
                className={cn("flex-1 cursor-pointer rounded-md border px-1 py-1 text-[0.7rem] font-semibold uppercase tracking-wide transition")}
                style={{
                  borderColor: active ? DIFFICULTY_META[d].color : "var(--border)",
                  background: active ? `color-mix(in srgb, ${DIFFICULTY_META[d].color} 16%, transparent)` : "transparent",
                  color: active ? DIFFICULTY_META[d].color : "var(--text-muted)",
                }}
              >
                {DIFFICULTY_META[d].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* primary nav */}
      <nav className="mt-3 flex flex-col gap-0.5 px-3">
        <SideLink to="/" icon={<LayoutGrid size={16} />} label="Dashboard" onNavigate={onNavigate} end />
        <SideLink to="/challenge" icon={<Swords size={16} />} label="Challenge" onNavigate={onNavigate} />
        <SideLink
          to="/review"
          icon={<RotateCcw size={16} />}
          label="Review"
          onNavigate={onNavigate}
          badge={reviewCount > 0 ? reviewCount : undefined}
        />
        <SideLink
          to="/bookmarks"
          icon={<Bookmark size={16} />}
          label="Bookmarks"
          onNavigate={onNavigate}
          badge={state.bookmarks.length > 0 ? state.bookmarks.length : undefined}
        />
      </nav>

      {/* topic tree */}
      <div className="mt-3 flex-1 overflow-y-auto px-3 pb-6">
        {groups.length === 0 && (
          <p className="px-2 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
            No topics match.
          </p>
        )}
        {groups.map((g) => {
          const cat = CATEGORIES[g.id];
          const isCollapsed = !filtering && collapsed.has(g.id);
          return (
            <div key={g.id} className="mb-4">
              <button
                onClick={() => toggleCategory(g.id)}
                className="mb-1.5 flex w-full cursor-pointer items-center gap-2 px-2 py-0.5 hover:opacity-80"
              >
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: cat.accent }} />
                <span className="text-[0.7rem] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                  {cat.label}
                </span>
                <span className="text-[0.65rem] font-semibold" style={{ color: "var(--text-muted)", opacity: 0.65 }}>
                  {g.topics.length}
                </span>
                <ChevronDown
                  size={14}
                  className="ml-auto transition-transform"
                  style={{ color: "var(--text-muted)", transform: isCollapsed ? "rotate(-90deg)" : "none" }}
                />
              </button>
              {!isCollapsed && (
              <div className="flex flex-col gap-0.5">
                {g.topics.map((t) => {
                  const mastery = topicMastery(state, t.meta.id);
                  const TierIcon = TIER_ICON[mastery.tier];
                  return (
                    <NavLink
                      key={t.meta.id}
                      to={`/learn/${t.meta.id}`}
                      onClick={onNavigate}
                      className={({ isActive }) =>
                        cn(
                          "group flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition",
                          isActive ? "font-semibold" : "hover:bg-black/4 dark:hover:bg-white/5",
                        )
                      }
                      style={({ isActive }) =>
                        isActive
                          ? { background: "color-mix(in srgb, var(--color-brand-500) 12%, transparent)", color: "var(--color-brand-600)" }
                          : { color: "var(--text)" }
                      }
                    >
                      <span className="flex shrink-0" title={`${mastery.label}${mastery.answered > 0 ? ` · ${Math.round(mastery.accuracy * 100)}%` : ""}`}>
                        <TierIcon size={15} color={mastery.color} />
                      </span>
                      <span className="flex-1 truncate">{t.meta.title}</span>
                      <span
                        className="h-1.5 w-1.5 shrink-0 rounded-full"
                        style={{ background: DIFFICULTY_META[t.meta.difficulty].color }}
                        title={DIFFICULTY_META[t.meta.difficulty].label}
                      />
                    </NavLink>
                  );
                })}
              </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SideLink({
  to,
  icon,
  label,
  badge,
  end,
  onNavigate,
}: {
  to: string;
  icon: React.ReactNode;
  label: string;
  badge?: number;
  end?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn("flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium transition", isActive ? "font-semibold" : "hover:bg-black/4 dark:hover:bg-white/5")
      }
      style={({ isActive }) =>
        isActive
          ? { background: "color-mix(in srgb, var(--color-brand-500) 12%, transparent)", color: "var(--color-brand-600)" }
          : { color: "var(--text)" }
      }
    >
      {icon}
      <span className="flex-1">{label}</span>
      {badge !== undefined && (
        <span
          className="rounded-full px-1.5 py-0.5 text-[0.65rem] font-bold"
          style={{ background: "var(--color-brand-500)", color: "#fff" }}
        >
          {badge}
        </span>
      )}
    </NavLink>
  );
}
