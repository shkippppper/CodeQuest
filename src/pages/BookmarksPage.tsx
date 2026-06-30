import { Link } from "react-router-dom";
import { Bookmark, ArrowRight } from "lucide-react";
import { getTopic } from "../content/registry";
import { CATEGORIES, DIFFICULTY_META } from "../content/types";
import { useProgress } from "../game/store";

export function BookmarksPage() {
  const { state } = useProgress();
  const topics = state.bookmarks.map(getTopic).filter(Boolean);

  return (
    <div className="mx-auto max-w-3xl px-5 py-7 sm:px-8">
      <div className="mb-5 flex items-center gap-2">
        <Bookmark size={22} color="var(--color-brand-500)" />
        <h1 className="text-2xl font-extrabold">Bookmarks</h1>
      </div>

      {topics.length === 0 ? (
        <div className="rounded-2xl border p-10 text-center" style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}>
          <p style={{ color: "var(--text-muted)" }}>
            No bookmarks yet. Tap the <Bookmark size={14} className="inline" /> icon on any topic to save it here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {topics.map((t) => {
            const topic = t!;
            const cat = CATEGORIES[topic.meta.category];
            const diff = DIFFICULTY_META[topic.meta.difficulty];
            return (
              <Link
                key={topic.meta.id}
                to={`/learn/${topic.meta.id}`}
                className="group flex items-center justify-between gap-4 rounded-2xl border p-5 transition hover:border-brand-400"
                style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}
              >
                <div className="min-w-0">
                  <div className="mb-1 flex items-center gap-2 text-xs font-semibold">
                    <span style={{ color: cat.accent }}>{cat.label}</span>
                    <span style={{ color: diff.color }}>· {diff.label}</span>
                  </div>
                  <p className="font-bold">{topic.meta.title}</p>
                  <p className="truncate text-sm" style={{ color: "var(--text-muted)" }}>{topic.meta.summary}</p>
                </div>
                <ArrowRight size={18} className="shrink-0" style={{ color: "var(--text-muted)" }} />
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
