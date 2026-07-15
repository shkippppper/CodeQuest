import { CATEGORIES, SUBJECTS, type CategoryId, type Difficulty, type Question, type SubjectId, type Topic, type TopicMeta } from "./types";

const metaModules = import.meta.glob<{ default: TopicMeta }>("./topics/*/meta.ts", { eager: true });
const mdModules = import.meta.glob<string>("./topics/*/explanation.md", {
  eager: true,
  query: "?raw",
  import: "default",
});
const quizModules = import.meta.glob<{ default: Question[] }>("./topics/*/quiz.ts", { eager: true });

function folderOf(path: string): string {
  // "./topics/optionals/meta.ts" -> "optionals"
  const m = path.match(/\.\/topics\/([^/]+)\//);
  return m ? m[1] : path;
}

function buildTopics(): Topic[] {
  const byFolder = new Map<string, Partial<Topic>>();

  for (const [path, mod] of Object.entries(metaModules)) {
    const f = folderOf(path);
    const entry = byFolder.get(f) ?? {};
    entry.meta = mod.default;
    byFolder.set(f, entry);
  }
  for (const [path, raw] of Object.entries(mdModules)) {
    const f = folderOf(path);
    const entry = byFolder.get(f) ?? {};
    entry.markdown = raw as unknown as string;
    byFolder.set(f, entry);
  }
  for (const [path, mod] of Object.entries(quizModules)) {
    const f = folderOf(path);
    const entry = byFolder.get(f) ?? {};
    entry.quiz = mod.default;
    byFolder.set(f, entry);
  }

  const topics: Topic[] = [];
  for (const [folder, entry] of byFolder.entries()) {
    if (!entry.meta) {
      console.warn(`[content] topic folder "${folder}" is missing meta.ts`);
      continue;
    }
    topics.push({
      meta: entry.meta,
      markdown: entry.markdown ?? "",
      quiz: entry.quiz ?? [],
    });
  }

  topics.sort((a, b) => {
    const ca = CATEGORIES[a.meta.category].order;
    const cb = CATEGORIES[b.meta.category].order;
    if (ca !== cb) return ca - cb;
    return a.meta.order - b.meta.order;
  });

  return topics;
}

export const TOPICS: Topic[] = buildTopics();

export const TOPIC_BY_ID: Record<string, Topic> = Object.fromEntries(
  TOPICS.map((t) => [t.meta.id, t]),
);

export function getTopic(id: string): Topic | undefined {
  return TOPIC_BY_ID[id];
}

export interface CategoryGroup {
  id: CategoryId;
  topics: Topic[];
}

export function groupedByCategory(): CategoryGroup[] {
  const order = Object.values(CATEGORIES).sort((a, b) => a.order - b.order);
  return order
    .map((c) => ({ id: c.id, topics: TOPICS.filter((t) => t.meta.category === c.id) }))
    .filter((g) => g.topics.length > 0);
}

/** The subject a topic belongs to, derived from its category. */
export function subjectOfTopic(t: Topic): SubjectId {
  return CATEGORIES[t.meta.category].subject;
}

/** Categories with topics, grouped under their subject (subjects in `order`). */
export function groupedBySubject(): { id: SubjectId; groups: CategoryGroup[] }[] {
  const subjects = Object.values(SUBJECTS).sort((a, b) => a.order - b.order);
  return subjects
    .map((s) => ({
      id: s.id,
      groups: groupedByCategory().filter((g) => CATEGORIES[g.id].subject === s.id),
    }))
    .filter((s) => s.groups.length > 0);
}

/** All topics for a subject, in the same category/topic order as `TOPICS`. */
export function topicsForSubject(s: SubjectId): Topic[] {
  return TOPICS.filter((t) => subjectOfTopic(t) === s);
}

/** Flat ordered list of topic ids — used for prev/next navigation. */
export const TOPIC_ORDER: string[] = TOPICS.map((t) => t.meta.id);

export function adjacentTopics(id: string): { prev?: Topic; next?: Topic } {
  const i = TOPIC_ORDER.indexOf(id);
  if (i === -1) return {};
  return {
    prev: i > 0 ? TOPIC_BY_ID[TOPIC_ORDER[i - 1]] : undefined,
    next: i < TOPIC_ORDER.length - 1 ? TOPIC_BY_ID[TOPIC_ORDER[i + 1]] : undefined,
  };
}

export const TOTAL_TOPICS = TOPICS.length;
export const TOTAL_QUESTIONS = TOPICS.reduce((sum, t) => sum + t.quiz.length, 0);

/** Every question across all topics, paired with the topic it belongs to. */
export interface FlatQuestion {
  topic: Topic;
  question: Question;
  /** effective difficulty — the question's own, falling back to its topic's */
  difficulty: Difficulty;
}

export const ALL_QUESTIONS: FlatQuestion[] = TOPICS.flatMap((topic) =>
  topic.quiz.map((question) => ({
    topic,
    question,
    difficulty: question.difficulty ?? topic.meta.difficulty,
  })),
);

export function countByDifficulty(difficulty: Difficulty | "mixed"): number {
  if (difficulty === "mixed") return ALL_QUESTIONS.length;
  return ALL_QUESTIONS.filter((q) => q.difficulty === difficulty).length;
}

/** Every question belonging to topics in the given subject. */
export function questionsForSubject(s: SubjectId): FlatQuestion[] {
  return ALL_QUESTIONS.filter((q) => subjectOfTopic(q.topic) === s);
}

/** Fisher–Yates shuffle, then take `count`, optionally filtered by difficulty and subject. */
export function sampleQuestions(
  count: number,
  difficulty: Difficulty | "mixed",
  subject?: SubjectId,
): FlatQuestion[] {
  let pool = difficulty === "mixed" ? ALL_QUESTIONS : ALL_QUESTIONS.filter((q) => q.difficulty === difficulty);
  if (subject) pool = pool.filter((q) => subjectOfTopic(q.topic) === subject);
  const arr = [...pool];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr.slice(0, Math.min(count, arr.length));
}
