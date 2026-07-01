import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { levelInfo, XP, type LevelInfo } from "./levels";
import { newlyEarned } from "./badges";
import { emitReward } from "./rewardBus";

export interface AnswerRecord {
  correct: boolean;
  attempts: number;
  timesWrong: number;
  lastAt: number;
}

export interface ProgressState {
  version: number;
  xp: number;
  completedTopics: Record<string, { completedAt: number; bestScore: number }>;
  answered: Record<string, AnswerRecord>;
  /** keyed by qKey — presence means "needs review" */
  wrongLog: Record<string, { topicId: string; qId: string; at: number }>;
  bookmarks: string[];
  badges: string[];
  totalCorrect: number;
  totalAnswered: number;
  redemptions: number;
}

const STORAGE_KEY = "cq_progress_v1";
const VERSION = 1;

function emptyState(): ProgressState {
  return {
    version: VERSION,
    xp: 0,
    completedTopics: {},
    answered: {},
    wrongLog: {},
    bookmarks: [],
    badges: [],
    totalCorrect: 0,
    totalAnswered: 0,
    redemptions: 0,
  };
}

function load(): ProgressState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return emptyState();
    const parsed = JSON.parse(raw);
    return { ...emptyState(), ...parsed, version: VERSION };
  } catch {
    return emptyState();
  }
}

function persist(s: ProgressState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
  } catch {
    /* ignore quota / private mode */
  }
}

export function qKey(topicId: string, qId: string): string {
  return `${topicId}::${qId}`;
}

interface RecordOpts {
  isReview?: boolean;
  /** 0..1 correctness fraction for partial-credit (multi-select) questions. Defaults to correct?1:0. Transient — never persisted. */
  score?: number;
}

export interface ProgressApi {
  state: ProgressState;
  level: LevelInfo;
  recordAnswer: (topicId: string, qId: string, correct: boolean, opts?: RecordOpts) => void;
  recordFlashcard: (topicId: string, qId: string, knewIt: boolean, opts?: RecordOpts) => void;
  completeTopic: (topicId: string, score: number) => void;
  toggleBookmark: (topicId: string) => void;
  isBookmarked: (topicId: string) => boolean;
  resetAll: () => void;
  exportState: () => ProgressState;
  importState: (parsed: unknown) => boolean;
  topicProgress: (topicId: string, totalQuestions: number) => { answered: number; correct: number };
  reviewCount: number;
}

const Ctx = createContext<ProgressApi | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const ref = useRef<ProgressState>(load());
  const [, force] = useState(0);

  const commit = useCallback((next: ProgressState) => {
    ref.current = next;
    persist(next);
    force((n) => n + 1);
  }, []);

  /** Apply XP and emit xp + levelup events. Mutates a copy. */
  const applyXp = useCallback((s: ProgressState, amount: number, reason?: string): ProgressState => {
    if (amount <= 0) return s;
    const before = levelInfo(s.xp);
    const next = { ...s, xp: s.xp + amount };
    const after = levelInfo(next.xp);
    emitReward({ kind: "xp", amount, reason });
    if (after.level > before.level) {
      emitReward({ kind: "levelup", level: after.level, rank: after.rank });
    }
    return next;
  }, []);

  const checkBadges = useCallback((s: ProgressState): ProgressState => {
    const fresh = newlyEarned(s.badges, s);
    if (fresh.length === 0) return s;
    for (const id of fresh) emitReward({ kind: "badge", badgeId: id });
    return { ...s, badges: [...s.badges, ...fresh] };
  }, []);

  const recordAnswer = useCallback(
    (topicId: string, qId: string, correct: boolean, opts?: RecordOpts) => {
      let s = { ...ref.current };

      const key = qKey(topicId, qId);
      const prev = s.answered[key];
      const wasWronglyLogged = !!s.wrongLog[key];
      const firstAttempt = !prev;

      const rec: AnswerRecord = {
        correct,
        attempts: (prev?.attempts ?? 0) + 1,
        timesWrong: (prev?.timesWrong ?? 0) + (correct ? 0 : 1),
        lastAt: Date.now(),
      };

      const answered = { ...s.answered, [key]: rec };
      const wrongLog = { ...s.wrongLog };
      if (correct) {
        delete wrongLog[key];
      } else {
        wrongLog[key] = { topicId, qId, at: Date.now() };
      }

      s = {
        ...s,
        answered,
        wrongLog,
        totalAnswered: s.totalAnswered + (firstAttempt ? 1 : 0),
        totalCorrect: s.totalCorrect + (correct && (firstAttempt || prev?.correct === false) ? 1 : 0),
      };

      const score = opts?.score ?? (correct ? 1 : 0);
      if (score > 0) {
        if (correct && opts?.isReview && wasWronglyLogged) {
          s = { ...s, redemptions: s.redemptions + 1 };
          s = applyXp(s, XP.reviewRedemption, "Redemption");
        } else {
          const base = firstAttempt ? XP.correctFirstTry : XP.correctRetry;
          s = applyXp(s, Math.round(base * score), "Correct");
        }
      }

      s = checkBadges(s);
      commit(s);
    },
    [applyXp, checkBadges, commit],
  );

  const recordFlashcard = useCallback(
    (topicId: string, qId: string, knewIt: boolean, opts?: RecordOpts) => {
      let s = { ...ref.current };
      const key = qKey(topicId, qId);
      const prev = s.answered[key];
      const firstAttempt = !prev;
      const wasWronglyLogged = !!s.wrongLog[key];

      const rec: AnswerRecord = {
        correct: knewIt,
        attempts: (prev?.attempts ?? 0) + 1,
        timesWrong: (prev?.timesWrong ?? 0) + (knewIt ? 0 : 1),
        lastAt: Date.now(),
      };
      const answered = { ...s.answered, [key]: rec };
      const wrongLog = { ...s.wrongLog };
      if (knewIt) delete wrongLog[key];
      else wrongLog[key] = { topicId, qId, at: Date.now() };

      s = {
        ...s,
        answered,
        wrongLog,
        totalAnswered: s.totalAnswered + (firstAttempt ? 1 : 0),
        totalCorrect: s.totalCorrect + (knewIt && firstAttempt ? 1 : 0),
      };
      if (knewIt) {
        if (opts?.isReview && wasWronglyLogged) {
          s = { ...s, redemptions: s.redemptions + 1 };
          s = applyXp(s, XP.reviewRedemption, "Redemption");
        } else {
          s = applyXp(s, XP.flashcardSelfPass, "Self-pass");
        }
      }
      s = checkBadges(s);
      commit(s);
    },
    [applyXp, checkBadges, commit],
  );

  const completeTopic = useCallback(
    (topicId: string, score: number) => {
      let s = { ...ref.current };
      const prev = s.completedTopics[topicId];
      const bestScore = Math.max(prev?.bestScore ?? 0, score);
      const firstTime = !prev;
      s = {
        ...s,
        completedTopics: {
          ...s.completedTopics,
          [topicId]: { completedAt: Date.now(), bestScore },
        },
      };
      if (firstTime) {
        s = applyXp(s, XP.topicComplete, "Topic complete");
        if (score >= 1) s = applyXp(s, XP.perfectTopicBonus, "Perfect score");
      } else if (score >= 1 && (prev?.bestScore ?? 0) < 1) {
        s = applyXp(s, XP.perfectTopicBonus, "Perfect score");
      }
      s = checkBadges(s);
      commit(s);
    },
    [applyXp, checkBadges, commit],
  );

  const toggleBookmark = useCallback(
    (topicId: string) => {
      const s = ref.current;
      const exists = s.bookmarks.includes(topicId);
      const bookmarks = exists ? s.bookmarks.filter((b) => b !== topicId) : [...s.bookmarks, topicId];
      commit({ ...s, bookmarks });
    },
    [commit],
  );

  const resetAll = useCallback(() => {
    commit(emptyState());
  }, [commit]);

  const exportState = useCallback(() => ref.current, []);

  const importState = useCallback(
    (parsed: unknown): boolean => {
      if (!parsed || typeof parsed !== "object") return false;
      const p = parsed as Record<string, unknown>;
      if (typeof p.version !== "number") return false;
      const required = [
        "xp",
        "completedTopics",
        "answered",
        "wrongLog",
        "bookmarks",
        "badges",
        "totalCorrect",
        "totalAnswered",
        "redemptions",
      ];
      for (const k of required) {
        if (!(k in p)) return false;
      }
      const next = { ...emptyState(), ...(parsed as Partial<ProgressState>), version: VERSION };
      commit(next);
      return true;
    },
    [commit],
  );

  const api = useMemo<ProgressApi>(() => {
    const state = ref.current;
    return {
      state,
      level: levelInfo(state.xp),
      recordAnswer,
      recordFlashcard,
      completeTopic,
      toggleBookmark,
      isBookmarked: (id: string) => state.bookmarks.includes(id),
      resetAll,
      exportState,
      importState,
      topicProgress: (topicId: string, totalQuestions: number) => {
        let answered = 0;
        let correct = 0;
        for (const [key, rec] of Object.entries(state.answered)) {
          if (key.startsWith(`${topicId}::`)) {
            answered++;
            if (rec.correct) correct++;
          }
        }
        return { answered: Math.min(answered, totalQuestions), correct: Math.min(correct, totalQuestions) };
      },
      reviewCount: Object.keys(state.wrongLog).length,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordAnswer, recordFlashcard, completeTopic, toggleBookmark, resetAll, exportState, importState, ref.current]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProgress must be used within ProgressProvider");
  return ctx;
}
