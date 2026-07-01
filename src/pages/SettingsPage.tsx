import { useRef, useState } from "react";
import { Moon, Sun, Trash2, AlertTriangle, Database, Star, Trophy, Target, Download, Upload } from "lucide-react";
import { useTheme } from "../theme/ThemeContext";
import { useProgress } from "../game/store";

export function SettingsPage() {
  const { theme, toggle } = useTheme();
  const { state, level, resetAll, exportState, importState } = useProgress();
  const [confirming, setConfirming] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [importMsg, setImportMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function handleExport() {
    const data = JSON.stringify(exportState(), null, 2);
    const blob = new Blob([data], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `codequest-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      let parsed: unknown;
      try {
        parsed = JSON.parse(String(reader.result));
      } catch {
        setImportMsg({ ok: false, text: "That file isn’t valid JSON." });
        return;
      }
      if (!window.confirm("Import will replace ALL current progress in this browser. Continue?")) return;
      const ok = importState(parsed);
      setImportMsg(
        ok
          ? { ok: true, text: "Progress imported successfully." }
          : { ok: false, text: "That file isn’t a valid CodeQuest backup." },
      );
    };
    reader.onerror = () => setImportMsg({ ok: false, text: "Could not read that file." });
    reader.readAsText(file);
  }

  const accuracy = state.totalAnswered > 0 ? Math.round((state.totalCorrect / state.totalAnswered) * 100) : 0;

  return (
    <div className="mx-auto max-w-2xl px-5 py-7 sm:px-8">
      <h1 className="mb-6 text-2xl font-extrabold">Settings</h1>

      {/* appearance */}
      <Section title="Appearance">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Theme</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>Switch between light and dark mode.</p>
          </div>
          <button
            onClick={toggle}
            className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:border-brand-400"
            style={{ borderColor: "var(--border)" }}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
            {theme === "dark" ? "Light" : "Dark"}
          </button>
        </div>
      </Section>

      {/* progress snapshot */}
      <Section title="Your progress">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Mini icon={<Star size={16} color="var(--color-brand-500)" />} label="XP" value={String(state.xp)} />
          <Mini icon={<Target size={16} color="var(--color-brand-500)" />} label="Level" value={`${level.level}`} />
          <Mini icon={<Trophy size={16} color="var(--color-brand-500)" />} label="Badges" value={`${state.badges.length}`} />
          <Mini icon={<Target size={16} color="var(--ok)" />} label="Accuracy" value={`${accuracy}%`} />
        </div>
        <p className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: "var(--text-muted)" }}>
          <Database size={13} /> All progress is stored only in this browser. Nothing is uploaded.
        </p>
      </Section>

      {/* backup */}
      <Section title="Backup">
        <div className="flex flex-col gap-3">
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Progress lives only in this browser. Export a backup to move it to another device, then import it there.
          </p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:border-brand-400"
              style={{ borderColor: "var(--border)" }}
            >
              <Download size={16} /> Export progress
            </button>
            <button
              onClick={() => fileRef.current?.click()}
              className="flex cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition hover:border-brand-400"
              style={{ borderColor: "var(--border)" }}
            >
              <Upload size={16} /> Import progress
            </button>
            <input ref={fileRef} type="file" accept="application/json" className="hidden" onChange={handleImportFile} />
          </div>
          {importMsg && (
            <p className="text-sm font-medium" style={{ color: importMsg.ok ? "var(--ok-strong)" : "var(--bad-strong)" }}>
              {importMsg.text}
            </p>
          )}
        </div>
      </Section>

      {/* danger zone */}
      <Section title="Data" danger>
        <div className="flex flex-col gap-3">
          <div>
            <p className="font-medium">Clear all history</p>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              Erase your XP, levels, badges, bookmarks and the saved record of every question you’ve answered. This cannot be undone.
            </p>
          </div>
          {!confirming ? (
            <button
              onClick={() => setConfirming(true)}
              className="flex w-fit cursor-pointer items-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold transition"
              style={{ borderColor: "var(--bad)", color: "var(--bad)" }}
            >
              <Trash2 size={16} /> Clear all history
            </button>
          ) : (
            <div className="flex flex-col gap-3 rounded-xl border p-4" style={{ borderColor: "var(--bad)", background: "color-mix(in srgb, var(--bad) 8%, transparent)" }}>
              <p className="flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--bad-strong)" }}>
                <AlertTriangle size={16} /> Are you absolutely sure?
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    resetAll();
                    setConfirming(false);
                  }}
                  className="cursor-pointer rounded-lg px-4 py-2 text-sm font-semibold text-white transition"
                  style={{ background: "var(--bad)" }}
                >
                  Yes, erase everything
                </button>
                <button
                  onClick={() => setConfirming(false)}
                  className="cursor-pointer rounded-lg border px-4 py-2 text-sm font-semibold transition hover:border-brand-400"
                  style={{ borderColor: "var(--border)" }}
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      </Section>
    </div>
  );
}

function Section({ title, children, danger }: { title: string; children: React.ReactNode; danger?: boolean }) {
  return (
    <section className="mb-5 rounded-2xl border p-5" style={{ borderColor: danger ? "color-mix(in srgb, var(--bad) 35%, var(--border))" : "var(--border)", background: "var(--bg-elev)" }}>
      <h2 className="mb-4 text-sm font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>{title}</h2>
      {children}
    </section>
  );
}

function Mini({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: "var(--text-muted)" }}>{icon}{label}</div>
      <p className="mt-0.5 text-xl font-extrabold">{value}</p>
    </div>
  );
}
