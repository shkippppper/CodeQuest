import { useEffect, useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Bookmark, Clock, GraduationCap, BookOpen, ListChecks } from "lucide-react";
import { adjacentTopics, getTopic } from "../content/registry";
import { CATEGORIES, DIFFICULTY_META } from "../content/types";
import { Markdown, extractHeadings } from "../components/Markdown";
import { RightToc } from "../components/RightToc";
import { Quiz } from "../components/quiz/Quiz";
import { useProgress } from "../game/store";
import { NotFoundInline } from "./NotFoundPage";
import { cn } from "../lib/cn";

export function TopicPage() {
  const { topicId = "" } = useParams();
  const topic = getTopic(topicId);
  const { isBookmarked, toggleBookmark, topicProgress } = useProgress();

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [topicId]);

  const headings = useMemo(() => (topic ? extractHeadings(topic.markdown) : []), [topic]);

  if (!topic) return <NotFoundInline message={`No topic called “${topicId}”.`} />;

  const { meta } = topic;
  const cat = CATEGORIES[meta.category];
  const diff = DIFFICULTY_META[meta.difficulty];
  const { prev, next } = adjacentTopics(topicId);
  const bookmarked = isBookmarked(topicId);
  const prog = topicProgress(topicId, topic.quiz.length);

  return (
    <div className="flex gap-8 px-5 py-7 sm:px-8 lg:px-10">
      <article className="mx-auto w-full min-w-0 max-w-[760px]">
        {/* breadcrumb / meta */}
        <div className="mb-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold" style={{ background: `color-mix(in srgb, ${cat.accent} 14%, transparent)`, color: cat.accent }}>
            {cat.label}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-semibold" style={{ background: `color-mix(in srgb, ${diff.color} 14%, transparent)`, color: diff.color }}>
            <GraduationCap size={13} /> {diff.label}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 font-medium" style={{ borderColor: "var(--border)", color: "var(--text-muted)" }}>
            <Clock size={13} /> {meta.est} min
          </span>
        </div>

        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{meta.title}</h1>
          <button
            onClick={() => toggleBookmark(topicId)}
            className="mt-1 shrink-0 cursor-pointer rounded-lg border p-2 transition hover:border-brand-400"
            style={{ borderColor: "var(--border)", color: bookmarked ? "var(--color-brand-500)" : "var(--text-muted)" }}
            title={bookmarked ? "Remove bookmark" : "Bookmark"}
          >
            <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} />
          </button>
        </div>
        <p className="mt-2 text-lg" style={{ color: "var(--text-muted)" }}>
          {meta.summary}
        </p>

        <div className="mt-6 flex items-center gap-2 text-sm font-semibold" style={{ color: "var(--text-muted)" }}>
          <BookOpen size={16} /> Lesson
        </div>
        <hr className="mb-4 mt-2" style={{ borderColor: "var(--border)" }} />

        <Markdown>{topic.markdown}</Markdown>

        {/* quiz */}
        <div id="quiz" className="mt-12 scroll-mt-20">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-2xl font-extrabold">
              <ListChecks size={24} color="var(--color-quest-600)" /> Test yourself
            </h2>
            {prog.answered > 0 && (
              <span className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>
                {prog.correct}/{topic.quiz.length} correct
              </span>
            )}
          </div>
          <Quiz topicId={topicId} questions={topic.quiz} />
        </div>

        {/* prev / next */}
        <div className="mt-12 grid grid-cols-1 gap-3 sm:grid-cols-2">
          {prev ? (
            <Link
              to={`/learn/${prev.meta.id}`}
              className="group flex items-center gap-3 rounded-xl border p-4 transition hover:border-brand-400"
              style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}
            >
              <ArrowLeft size={18} style={{ color: "var(--text-muted)" }} />
              <span className="min-w-0">
                <span className="block text-xs" style={{ color: "var(--text-muted)" }}>Previous</span>
                <span className="block truncate font-semibold">{prev.meta.title}</span>
              </span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              to={`/learn/${next.meta.id}`}
              className="group flex items-center justify-end gap-3 rounded-xl border p-4 text-right transition hover:border-brand-400 sm:col-start-2"
              style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}
            >
              <span className="min-w-0">
                <span className="block text-xs" style={{ color: "var(--text-muted)" }}>Next</span>
                <span className="block truncate font-semibold">{next.meta.title}</span>
              </span>
              <ArrowRight size={18} style={{ color: "var(--text-muted)" }} />
            </Link>
          )}
        </div>
      </article>

      <RightToc headings={headings} />
    </div>
  );
}
