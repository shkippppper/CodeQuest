/**
 * XP curve. Cumulative XP required to *reach* a given level.
 * Level 1 starts at 0. Each level costs a bit more than the last.
 */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0;
  // 75*(n-1) + 25*(n-1)^2  -> gentle quadratic ramp
  const n = level - 1;
  return 75 * n + 25 * n * n;
}

export interface LevelInfo {
  level: number;
  rank: string;
  /** xp into the current level */
  current: number;
  /** xp needed to span the current level */
  span: number;
  /** 0..1 progress through current level */
  progress: number;
  floor: number;
  ceil: number;
}

const RANKS: { min: number; title: string }[] = [
  { min: 1, title: "Optional Initiate" },
  { min: 3, title: "Syntax Scout" },
  { min: 5, title: "Closure Adept" },
  { min: 8, title: "Protocol Ranger" },
  { min: 11, title: "Generics Mage" },
  { min: 14, title: "Concurrency Knight" },
  { min: 18, title: "Memory Warden" },
  { min: 22, title: "Architecture Sage" },
  { min: 27, title: "Swift Grandmaster" },
];

export function rankForLevel(level: number): string {
  let title = RANKS[0].title;
  for (const r of RANKS) {
    if (level >= r.min) title = r.title;
  }
  return title;
}

export function levelInfo(xp: number): LevelInfo {
  let level = 1;
  while (xpForLevel(level + 1) <= xp) level++;
  const floor = xpForLevel(level);
  const ceil = xpForLevel(level + 1);
  const span = ceil - floor;
  const current = xp - floor;
  return {
    level,
    rank: rankForLevel(level),
    current,
    span,
    progress: span > 0 ? current / span : 1,
    floor,
    ceil,
  };
}

/** XP awards in one place so the economy stays balanced. */
export const XP = {
  correctFirstTry: 15,
  correctRetry: 6,
  flashcardSelfPass: 10,
  topicComplete: 50,
  perfectTopicBonus: 40,
  reviewRedemption: 12,
};
