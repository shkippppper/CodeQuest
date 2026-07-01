import { Link } from "react-router-dom";
import { Moon, Sun, Settings, Menu, Star, Search } from "lucide-react";
import { useProgress } from "../game/store";
import { useTheme } from "../theme/ThemeContext";

export function TopBar({ onMenu }: { onMenu?: () => void }) {
  const { state, level } = useProgress();
  const { theme, toggle } = useTheme();

  return (
    <header
      className="sticky top-0 z-40 flex h-14 items-center gap-3 border-b px-4 backdrop-blur"
      style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--bg-elev) 82%, transparent)" }}
    >
      <button onClick={onMenu} className="cursor-pointer rounded-lg p-1.5 hover:bg-black/5 dark:hover:bg-white/10 lg:hidden">
        <Menu size={20} />
      </button>

      <Link to="/" className="flex items-center gap-2">
        <span
          className="flex h-8 w-8 items-center justify-center rounded-lg font-mono text-sm font-black text-white"
          style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-quest-600))" }}
        >
          {"</>"}
        </span>
        <span className="text-[1.05rem] font-extrabold tracking-tight">
          Code<span style={{ color: "var(--color-brand-500)" }}>Quest</span>
        </span>
      </Link>

      <div className="flex-1" />

      <button
        onClick={() => window.dispatchEvent(new Event("cq:open-palette"))}
        className="hidden cursor-pointer items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-medium transition hover:border-brand-400 sm:flex"
        style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}
        title="Search (Cmd/Ctrl + K)"
      >
        <Search size={14} />
        <span className="hidden md:inline">Search</span>
        <kbd className="rounded px-1 text-[0.65rem]" style={{ background: "color-mix(in srgb, var(--text) 8%, transparent)" }}>⌘K</kbd>
      </button>

      {/* level + xp meter */}
      <Link to="/" className="flex items-center gap-2.5" title={`${level.rank} · ${state.xp} XP`}>
        <div
          className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-extrabold text-white"
          style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-quest-600))" }}
        >
          {level.level}
        </div>
        <div className="hidden w-32 sm:block">
          <div className="flex items-center justify-between text-[0.7rem] font-semibold" style={{ color: "var(--text-muted)" }}>
            <span className="flex items-center gap-1">
              <Star size={11} fill="var(--color-brand-500)" color="var(--color-brand-500)" />
              {state.xp} XP
            </span>
            <span>{level.current}/{level.span}</span>
          </div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full" style={{ background: "var(--border)" }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.round(level.progress * 100)}%`, background: "linear-gradient(90deg, var(--color-brand-500), var(--color-quest-500))" }}
            />
          </div>
        </div>
      </Link>

      <button onClick={toggle} className="cursor-pointer rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/10" title="Toggle theme">
        {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
      </button>
      <Link to="/settings" className="cursor-pointer rounded-lg p-2 hover:bg-black/5 dark:hover:bg-white/10" title="Settings">
        <Settings size={18} />
      </Link>
    </header>
  );
}
