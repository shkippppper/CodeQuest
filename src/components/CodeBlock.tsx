import { useEffect, useState } from "react";
import { Check, Copy, Play, Terminal } from "lucide-react";
import { getHighlighter } from "../lib/highlighter";
import { useTheme } from "../theme/ThemeContext";
import { cn } from "../lib/cn";

interface CodeBlockProps {
  code: string;
  lang?: string;
  output?: string;
  filename?: string;
  /** hide the toolbar (copy / run) — used for inline-ish snippets */
  bare?: boolean;
}

export function CodeBlock({ code, lang = "swift", output, filename, bare }: CodeBlockProps) {
  const { theme } = useTheme();
  const [html, setHtml] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [showOutput, setShowOutput] = useState(false);

  useEffect(() => {
    let active = true;
    getHighlighter().then((hl) => {
      if (!active) return;
      try {
        const out = hl.codeToHtml(code, {
          lang: hl.getLoadedLanguages().includes(lang as never) ? lang : "swift",
          theme: theme === "dark" ? "github-dark" : "github-light",
        });
        setHtml(out);
      } catch {
        setHtml("");
      }
    });
    return () => {
      active = false;
    };
  }, [code, lang, theme]);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      /* ignore */
    }
  };

  const runInFiddle = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      /* ignore */
    }
    window.open("https://swiftfiddle.com/", "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="my-4 overflow-hidden rounded-xl border"
      style={{ borderColor: "var(--border)", background: theme === "dark" ? "#0d1117" : "#fff" }}
    >
      {!bare && (
        <div
          className="flex items-center justify-between gap-2 border-b px-3 py-1.5"
          style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--text) 4%, transparent)" }}
        >
          <div className="flex items-center gap-2 text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            <span className="flex gap-1.5">
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--color-brand-200)" }} />
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--color-brand-300)" }} />
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: "var(--color-brand-400)" }} />
            </span>
            <span className="ml-1 font-mono">{filename ?? `${lang}`}</span>
          </div>
          <div className="flex items-center gap-1">
            {output && (
              <button
                onClick={() => setShowOutput((v) => !v)}
                className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition hover:bg-black/5 dark:hover:bg-white/10"
                style={{ color: "var(--text-muted)" }}
              >
                <Terminal size={13} /> {showOutput ? "Hide" : "Output"}
              </button>
            )}
            <button
              onClick={runInFiddle}
              title="Copy & open SwiftFiddle"
              className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition hover:bg-black/5 dark:hover:bg-white/10"
              style={{ color: "var(--text-muted)" }}
            >
              <Play size={13} /> Run
            </button>
            <button
              onClick={copy}
              className="flex cursor-pointer items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition hover:bg-black/5 dark:hover:bg-white/10"
              style={{ color: copied ? "var(--color-brand-500)" : "var(--text-muted)" }}
            >
              {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      {html ? (
        <div className="cq-shiki overflow-x-auto text-[0.86rem] leading-relaxed" dangerouslySetInnerHTML={{ __html: html }} />
      ) : (
        <pre className="overflow-x-auto p-4 font-mono text-[0.86rem] leading-relaxed">
          <code>{code}</code>
        </pre>
      )}

      {output && showOutput && (
        <div
          className="border-t px-4 py-3 font-mono text-[0.82rem] leading-relaxed"
          style={{
            borderColor: "var(--border)",
            background: "color-mix(in srgb, var(--text) 3%, transparent)",
            color: "var(--text-muted)",
          }}
        >
          <div className="mb-1 flex items-center gap-1.5 text-[0.7rem] font-semibold uppercase tracking-wide opacity-70">
            <Terminal size={12} /> Console
          </div>
          <pre className="whitespace-pre-wrap" style={{ color: "var(--text)" }}>
            {output}
          </pre>
        </div>
      )}
    </div>
  );
}

export function OutputPanel({ children }: { children: string }) {
  return (
    <div
      className="my-4 overflow-hidden rounded-xl border"
      style={{ borderColor: "var(--border)" }}
    >
      <div
        className="flex items-center gap-1.5 border-b px-3 py-1.5 text-[0.7rem] font-semibold uppercase tracking-wide"
        style={{ borderColor: "var(--border)", background: "color-mix(in srgb, var(--text) 4%, transparent)", color: "var(--text-muted)" }}
      >
        <Terminal size={12} /> Console output
      </div>
      <pre
        className="overflow-x-auto p-4 font-mono text-[0.82rem] leading-relaxed"
        style={{ color: "var(--text)" }}
      >
        {children}
      </pre>
    </div>
  );
}
