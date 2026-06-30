import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { ReactNode } from "react";
import { CodeBlock, OutputPanel } from "./CodeBlock";
import { slugify } from "../lib/cn";

function textOf(node: ReactNode): string {
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(textOf).join("");
  if (node && typeof node === "object" && "props" in node) {
    return textOf((node as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

export interface Heading {
  id: string;
  text: string;
  level: 2 | 3;
}

/** Pull h2/h3 headings out of raw markdown for the right-hand TOC. */
export function extractHeadings(md: string): Heading[] {
  const out: Heading[] = [];
  const lines = md.split("\n");
  let inFence = false;
  for (const line of lines) {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    const m = /^(#{2,3})\s+(.*)$/.exec(line);
    if (m) {
      const level = m[1].length as 2 | 3;
      const text = m[2].replace(/[#*`]/g, "").trim();
      out.push({ id: slugify(text), text, level });
    }
  }
  return out;
}

/** Renders a short markdown string inline (no block <p> wrapper). */
export function InlineMarkdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        p: ({ children }) => <>{children}</>,
        code: ({ children }) => (
          <code className="rounded bg-black/8 px-1 py-0.5 font-mono text-[0.85em] dark:bg-white/12">{children}</code>
        ),
      }}
    >
      {children}
    </ReactMarkdown>
  );
}

export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-cq">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => <h2 id={slugify(textOf(children))}>{children}</h2>,
          h3: ({ children }) => <h3 id={slugify(textOf(children))}>{children}</h3>,
          pre: ({ children }) => <>{children}</>,
          code: ({ className, children }) => {
            const match = /language-(\w+)/.exec(className || "");
            const raw = String(children).replace(/\n$/, "");
            if (!match) {
              return <code>{children}</code>;
            }
            const lang = match[1];
            if (lang === "output" || lang === "console") {
              return <OutputPanel>{raw}</OutputPanel>;
            }
            return <CodeBlock code={raw} lang={lang} />;
          },
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
