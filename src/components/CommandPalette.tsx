import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "motion/react";
import { Search, LayoutGrid, Swords, RotateCcw, Bookmark, Settings, SunMoon, FileText, CornerDownLeft } from "lucide-react";
import { TOPICS } from "../content/registry";
import { useTheme } from "../theme/ThemeContext";

interface Item {
  id: string;
  label: string;
  sub?: string;
  group: "Actions" | "Topics";
  icon: typeof Search;
  keywords: string;
  run: () => void;
}

export function CommandPalette() {
  const navigate = useNavigate();
  const { toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // ⌘K / Ctrl+K toggles; a custom event lets other components open it.
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    function onOpenEvent() {
      setOpen(true);
    }
    window.addEventListener("keydown", onKey);
    window.addEventListener("cq:open-palette", onOpenEvent);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("cq:open-palette", onOpenEvent);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open]);

  const items = useMemo<Item[]>(() => {
    const close = () => setOpen(false);
    const actions: Item[] = [
      { id: "go-dashboard", label: "Dashboard", group: "Actions", icon: LayoutGrid, keywords: "dashboard home", run: () => { navigate("/"); close(); } },
      { id: "go-challenge", label: "Challenge", group: "Actions", icon: Swords, keywords: "challenge quiz random", run: () => { navigate("/challenge"); close(); } },
      { id: "go-review", label: "Review", group: "Actions", icon: RotateCcw, keywords: "review missed drill", run: () => { navigate("/review"); close(); } },
      { id: "go-bookmarks", label: "Bookmarks", group: "Actions", icon: Bookmark, keywords: "bookmarks saved", run: () => { navigate("/bookmarks"); close(); } },
      { id: "go-settings", label: "Settings", group: "Actions", icon: Settings, keywords: "settings preferences backup", run: () => { navigate("/settings"); close(); } },
      { id: "toggle-theme", label: "Toggle theme", group: "Actions", icon: SunMoon, keywords: "theme dark light mode", run: () => { toggle(); close(); } },
    ];
    const topics: Item[] = TOPICS.map((t) => ({
      id: `topic-${t.meta.id}`,
      label: t.meta.title,
      sub: t.meta.summary,
      group: "Topics",
      icon: FileText,
      keywords: `${t.meta.title} ${t.meta.summary} ${(t.meta.tags ?? []).join(" ")}`.toLowerCase(),
      run: () => { navigate(`/learn/${t.meta.id}`); close(); },
    }));
    return [...actions, ...topics];
  }, [navigate, toggle]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter((it) => it.label.toLowerCase().includes(q) || it.keywords.includes(q));
  }, [items, query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  function onInputKey(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, filtered.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      filtered[active]?.run();
    } else if (e.key === "Escape") {
      e.preventDefault();
      setOpen(false);
    }
  }

  let lastGroup = "";

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[60] flex items-start justify-center p-4 pt-[12vh]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onMouseDown={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
          <motion.div
            className="relative w-full max-w-lg overflow-hidden rounded-2xl border shadow-2xl"
            style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}
            initial={{ scale: 0.96, y: -8 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: -8 }}
            transition={{ duration: 0.15 }}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 border-b px-4" style={{ borderColor: "var(--border)" }}>
              <Search size={16} style={{ color: "var(--text-muted)" }} />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Search topics and actions…"
                className="w-full bg-transparent py-3.5 text-sm outline-none"
                style={{ color: "var(--text)" }}
              />
            </div>
            <div className="max-h-[52vh] overflow-y-auto py-2">
              {filtered.length === 0 && (
                <p className="px-4 py-6 text-center text-sm" style={{ color: "var(--text-muted)" }}>
                  No matches.
                </p>
              )}
              {filtered.map((it, i) => {
                const header = it.group !== lastGroup ? it.group : null;
                lastGroup = it.group;
                const Icon = it.icon;
                const isActive = i === active;
                return (
                  <div key={it.id}>
                    {header && (
                      <p className="px-4 pb-1 pt-2 text-[0.65rem] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
                        {header}
                      </p>
                    )}
                    <button
                      onMouseEnter={() => setActive(i)}
                      onClick={it.run}
                      className="flex w-full cursor-pointer items-center gap-3 px-4 py-2 text-left text-sm"
                      style={isActive ? { background: "color-mix(in srgb, var(--color-brand-500) 12%, transparent)" } : undefined}
                    >
                      <Icon size={16} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-medium" style={{ color: "var(--text)" }}>
                          {it.label}
                        </span>
                        {it.sub && (
                          <span className="block truncate text-xs" style={{ color: "var(--text-muted)" }}>
                            {it.sub}
                          </span>
                        )}
                      </span>
                      {isActive && <CornerDownLeft size={14} style={{ color: "var(--text-muted)" }} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
