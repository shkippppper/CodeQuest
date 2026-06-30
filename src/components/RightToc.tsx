import { useEffect, useState } from "react";
import type { Heading } from "./Markdown";
import { cn } from "../lib/cn";

export function RightToc({ headings }: { headings: Heading[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    if (headings.length === 0) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );
    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="sticky top-20 hidden max-h-[calc(100vh-6rem)] w-56 shrink-0 overflow-y-auto py-2 xl:block">
      <p className="mb-2 px-3 text-[0.7rem] font-bold uppercase tracking-wider" style={{ color: "var(--text-muted)" }}>
        On this page
      </p>
      <ul className="flex flex-col gap-0.5 text-sm">
        {headings.map((h) => (
          <li key={h.id}>
            <a
              href={`#${h.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                history.replaceState(null, "", `#${h.id}`);
              }}
              className={cn("block rounded-md py-1 transition", h.level === 3 ? "pl-6 pr-3" : "px-3")}
              style={{
                color: active === h.id ? "var(--color-brand-600)" : "var(--text-muted)",
                fontWeight: active === h.id ? 650 : 400,
                borderLeft: active === h.id ? "2px solid var(--color-brand-500)" : "2px solid transparent",
              }}
            >
              {h.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
