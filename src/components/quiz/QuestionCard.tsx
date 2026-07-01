import { useState } from "react";
import { Check, X, Eye, Lightbulb, HelpCircle, Brain, Terminal, ListChecks } from "lucide-react";
import type { Question } from "../../content/types";
import { CodeBlock } from "../CodeBlock";
import { InlineMarkdown, Markdown } from "../Markdown";
import { cn } from "../../lib/cn";

interface Props {
  question: Question;
  /** called exactly once, when the user grades/answers the question. `score` is the 0..1 fraction for partial-credit types; omit for pass/fail. */
  onGraded: (correct: boolean, score?: number) => void;
}

const TYPE_LABEL: Record<Question["type"], { label: string; icon: typeof HelpCircle }> = {
  mcq: { label: "Multiple choice", icon: HelpCircle },
  predict: { label: "Predict the output", icon: Terminal },
  fill: { label: "Fill in the blank", icon: Lightbulb },
  flashcard: { label: "Flashcard", icon: Brain },
  multi: { label: "Select all that apply", icon: ListChecks },
};

function normalize(s: string): string {
  return s.trim().toLowerCase().replace(/\s+/g, " ").replace(/;$/, "");
}

export function QuestionCard({ question, onGraded }: Props) {
  const [graded, setGraded] = useState(false);
  const [correct, setCorrect] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const [fillValue, setFillValue] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [multiSel, setMultiSel] = useState<Set<number>>(new Set());
  const [multiResult, setMultiResult] = useState<{ correctPicked: number; total: number } | null>(null);

  const meta = TYPE_LABEL[question.type];
  const TypeIcon = meta.icon;

  function grade(isCorrect: boolean, score?: number) {
    setCorrect(isCorrect);
    setGraded(true);
    onGraded(isCorrect, score);
  }

  function gradeMulti() {
    if (question.type !== "multi") return;
    const answerSet = new Set(question.answers);
    let correctPicked = 0;
    let wrongPicked = 0;
    multiSel.forEach((i) => {
      if (answerSet.has(i)) correctPicked++;
      else wrongPicked++;
    });
    const raw = Math.max(0, correctPicked - wrongPicked);
    const total = answerSet.size;
    const score = total ? Math.min(raw, total) / total : 0;
    setMultiResult({ correctPicked, total });
    grade(score === 1, score);
  }

  return (
    <div
      className="rounded-2xl border p-5 sm:p-6"
      style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}
    >
      <div className="mb-3 flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[0.7rem] font-semibold uppercase tracking-wide"
          style={{ background: "color-mix(in srgb, var(--color-quest-500) 14%, transparent)", color: "var(--color-quest-600)" }}
        >
          <TypeIcon size={13} /> {meta.label}
        </span>
      </div>

      <div className="text-[1.02rem] font-medium leading-relaxed">
        <InlineMarkdown>{question.prompt}</InlineMarkdown>
      </div>

      {question.code && <CodeBlock code={question.code} />}

      {/* ---- MCQ / PREDICT ---- */}
      {(question.type === "mcq" || question.type === "predict") && (
        <div className="mt-4 flex flex-col gap-2">
          {question.options.map((opt, i) => {
            const isAnswer = i === question.answer;
            const isPicked = i === selected;
            let stateCls = "";
            let style: React.CSSProperties = { borderColor: "var(--border)", background: "var(--bg)" };
            if (graded) {
              if (isAnswer) style = { borderColor: "var(--ok)", background: "color-mix(in srgb, var(--ok) 12%, transparent)" };
              else if (isPicked) style = { borderColor: "var(--bad)", background: "color-mix(in srgb, var(--bad) 12%, transparent)" };
            } else if (isPicked) {
              style = { borderColor: "var(--color-brand-500)", background: "color-mix(in srgb, var(--color-brand-500) 10%, transparent)" };
            }
            return (
              <button
                key={i}
                disabled={graded}
                onClick={() => setSelected(i)}
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                  !graded && "cursor-pointer hover:border-brand-400",
                  stateCls,
                )}
                style={style}
              >
                <span
                  className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-semibold"
                  style={{ borderColor: "var(--border)" }}
                >
                  {graded && isAnswer ? <Check size={14} color="var(--ok)" /> : graded && isPicked ? <X size={14} color="var(--bad)" /> : String.fromCharCode(65 + i)}
                </span>
                <span className={question.type === "predict" ? "font-mono text-[0.85rem]" : ""}>
                  <InlineMarkdown>{opt}</InlineMarkdown>
                </span>
              </button>
            );
          })}
          {!graded && (
            <button
              disabled={selected === null}
              onClick={() => grade(selected === question.answer)}
              className="mt-2 w-fit cursor-pointer rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Submit answer
            </button>
          )}
        </div>
      )}

      {/* ---- MULTI (select all that apply) ---- */}
      {question.type === "multi" && (
        <div className="mt-4 flex flex-col gap-2">
          {question.options.map((opt, i) => {
            const isAnswer = question.answers.includes(i);
            const isPicked = multiSel.has(i);
            let style: React.CSSProperties = { borderColor: "var(--border)", background: "var(--bg)" };
            if (graded) {
              if (isAnswer && isPicked) style = { borderColor: "var(--ok)", background: "color-mix(in srgb, var(--ok) 12%, transparent)" };
              else if (isAnswer && !isPicked) style = { borderColor: "var(--color-brand-500)", background: "color-mix(in srgb, var(--color-brand-500) 10%, transparent)" };
              else if (!isAnswer && isPicked) style = { borderColor: "var(--bad)", background: "color-mix(in srgb, var(--bad) 12%, transparent)" };
            } else if (isPicked) {
              style = { borderColor: "var(--color-brand-500)", background: "color-mix(in srgb, var(--color-brand-500) 10%, transparent)" };
            }
            return (
              <button
                key={i}
                disabled={graded}
                onClick={() =>
                  setMultiSel((prev) => {
                    const next = new Set(prev);
                    if (next.has(i)) next.delete(i);
                    else next.add(i);
                    return next;
                  })
                }
                className={cn(
                  "flex items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition",
                  !graded && "cursor-pointer hover:border-brand-400",
                )}
                style={style}
              >
                <span
                  className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md border"
                  style={{ borderColor: isPicked ? "var(--color-brand-500)" : "var(--border)", background: isPicked ? "var(--color-brand-500)" : "transparent" }}
                >
                  {isPicked && <Check size={13} color="#fff" />}
                </span>
                <span className="flex-1">
                  <InlineMarkdown>{opt}</InlineMarkdown>
                </span>
                {graded && isAnswer && !isPicked && (
                  <span className="text-xs font-semibold" style={{ color: "var(--color-brand-600)" }}>
                    missed
                  </span>
                )}
              </button>
            );
          })}
          {!graded && (
            <button
              disabled={multiSel.size === 0}
              onClick={gradeMulti}
              className="mt-2 w-fit cursor-pointer rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Submit answer
            </button>
          )}
          {graded && multiResult && (
            <p className="mt-1 text-sm" style={{ color: "var(--text-muted)" }}>
              You selected {multiResult.correctPicked} of {multiResult.total} correct option{multiResult.total === 1 ? "" : "s"}.
            </p>
          )}
        </div>
      )}

      {/* ---- FILL ---- */}
      {question.type === "fill" && (
        <div className="mt-4">
          <input
            value={fillValue}
            disabled={graded}
            onChange={(e) => setFillValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && fillValue.trim() && !graded) {
                grade(question.answers.some((a) => normalize(a) === normalize(fillValue)));
              }
            }}
            placeholder="Type your answer…"
            spellCheck={false}
            className="w-full rounded-xl border px-4 py-3 font-mono text-sm outline-none transition focus:border-brand-500"
            style={{ borderColor: "var(--border)", background: "var(--bg)", color: "var(--text)" }}
          />
          {question.hint && !graded && (
            <button
              onClick={() => setShowHint((v) => !v)}
              className="mt-2 flex cursor-pointer items-center gap-1.5 text-xs font-medium"
              style={{ color: "var(--text-muted)" }}
            >
              <Lightbulb size={13} /> {showHint ? "Hide hint" : "Show hint"}
            </button>
          )}
          {question.hint && showHint && !graded && (
            <p className="mt-1 text-xs italic" style={{ color: "var(--text-muted)" }}>
              {question.hint}
            </p>
          )}
          {!graded && (
            <button
              disabled={!fillValue.trim()}
              onClick={() => grade(question.answers.some((a) => normalize(a) === normalize(fillValue)))}
              className="mt-3 w-fit cursor-pointer rounded-lg bg-brand-500 px-5 py-2 text-sm font-semibold text-white transition hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-40"
            >
              Check answer
            </button>
          )}
          {graded && !correct && (
            <p className="mt-3 text-sm">
              <span style={{ color: "var(--text-muted)" }}>Accepted answer: </span>
              <code className="rounded bg-black/8 px-1.5 py-0.5 font-mono dark:bg-white/12">{question.answers[0]}</code>
            </p>
          )}
        </div>
      )}

      {/* ---- FLASHCARD ---- */}
      {question.type === "flashcard" && (
        <div className="mt-4">
          {!revealed ? (
            <button
              onClick={() => setRevealed(true)}
              className="flex cursor-pointer items-center gap-2 rounded-lg border px-5 py-2.5 text-sm font-semibold transition hover:border-brand-400"
              style={{ borderColor: "var(--border)", background: "var(--bg)" }}
            >
              <Eye size={16} /> Reveal answer
            </button>
          ) : (
            <div>
              <div
                className="rounded-xl border p-4"
                style={{ borderColor: "var(--border)", background: "var(--bg)" }}
              >
                <Markdown>{question.modelAnswer}</Markdown>
                {question.keyPoints && question.keyPoints.length > 0 && (
                  <div className="mt-3 border-t pt-3" style={{ borderColor: "var(--border)" }}>
                    <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>
                      Did you mention…
                    </p>
                    <ul className="flex flex-col gap-1">
                      {question.keyPoints.map((p, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm">
                          <Check size={15} className="mt-0.5 shrink-0" color="var(--ok)" />
                          <span>
                            <InlineMarkdown>{p}</InlineMarkdown>
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              {!graded && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => grade(false)}
                    className="flex-1 cursor-pointer rounded-lg border px-4 py-2.5 text-sm font-semibold transition"
                    style={{ borderColor: "var(--border)" }}
                  >
                    Need more review
                  </button>
                  <button
                    onClick={() => grade(true)}
                    className="flex-1 cursor-pointer rounded-lg px-4 py-2.5 text-sm font-semibold text-white transition"
                    style={{ background: "var(--ok)" }}
                  >
                    I knew it
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ---- RESULT + EXPLANATION ---- */}
      {graded && (
        <div className="mt-4">
          {question.type !== "flashcard" && (
            <div
              className="mb-3 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold"
              style={{
                background: correct ? "color-mix(in srgb, var(--ok) 14%, transparent)" : "color-mix(in srgb, var(--bad) 14%, transparent)",
                color: correct ? "var(--ok-strong)" : "var(--bad-strong)",
              }}
            >
              {correct ? <Check size={16} /> : <X size={16} />}
              {correct ? "Correct!" : "Not quite."}
            </div>
          )}
          <div
            className="rounded-xl border-l-4 py-1 pl-4 text-sm"
            style={{ borderColor: "var(--color-quest-400)" }}
          >
            <Markdown>{question.explanation}</Markdown>
          </div>
        </div>
      )}
    </div>
  );
}
