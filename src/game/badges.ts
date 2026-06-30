import type { ProgressState } from "./store";
import { TOPICS } from "../content/registry";
import type { CategoryId } from "../content/types";

export interface BadgeDef {
  id: string;
  name: string;
  description: string;
  /** lucide icon name */
  icon: string;
  tier: "bronze" | "silver" | "gold";
  earned: (s: ProgressState) => boolean;
}

function completedCount(s: ProgressState): number {
  return Object.keys(s.completedTopics).length;
}

function perfectCount(s: ProgressState): number {
  return Object.values(s.completedTopics).filter((c) => c.bestScore >= 1).length;
}

function categoryComplete(s: ProgressState, cat: CategoryId): boolean {
  const ids = TOPICS.filter((t) => t.meta.category === cat).map((t) => t.meta.id);
  if (ids.length === 0) return false;
  return ids.every((id) => s.completedTopics[id]);
}

export const BADGES: BadgeDef[] = [
  {
    id: "first_blood",
    name: "First Steps",
    description: "Answer your very first question.",
    icon: "Footprints",
    tier: "bronze",
    earned: (s) => s.totalAnswered >= 1,
  },
  {
    id: "topic_done",
    name: "Quest Complete",
    description: "Finish your first topic.",
    icon: "Flag",
    tier: "bronze",
    earned: (s) => completedCount(s) >= 1,
  },
  {
    id: "perfectionist",
    name: "Flawless Victory",
    description: "Score 100% on a topic quiz.",
    icon: "Target",
    tier: "silver",
    earned: (s) => perfectCount(s) >= 1,
  },
  {
    id: "perfect_five",
    name: "Pentakill",
    description: "Ace five topics with a perfect score.",
    icon: "Crown",
    tier: "gold",
    earned: (s) => perfectCount(s) >= 5,
  },
  {
    id: "curious_mind",
    name: "Curious Mind",
    description: "Answer 10 questions.",
    icon: "BookOpenCheck",
    tier: "bronze",
    earned: (s) => s.totalAnswered >= 10,
  },
  {
    id: "completionist",
    name: "Completionist",
    description: "Finish every topic.",
    icon: "CheckCheck",
    tier: "gold",
    earned: (s) => completedCount(s) >= TOPICS.length,
  },
  {
    id: "sharp_shooter",
    name: "Sharp Shooter",
    description: "Answer 25 questions correctly.",
    icon: "Crosshair",
    tier: "silver",
    earned: (s) => s.totalCorrect >= 25,
  },
  {
    id: "comeback",
    name: "Redemption Arc",
    description: "Get a previously-missed question right in Review.",
    icon: "RotateCcw",
    tier: "silver",
    earned: (s) => s.redemptions >= 1,
  },
  {
    id: "lang_master",
    name: "Language Lord",
    description: "Complete every Swift Language topic.",
    icon: "Braces",
    tier: "gold",
    earned: (s) => categoryComplete(s, "language"),
  },
  {
    id: "async_master",
    name: "Async Ascendant",
    description: "Complete every Concurrency topic.",
    icon: "Workflow",
    tier: "gold",
    earned: (s) => categoryComplete(s, "concurrency"),
  },
  {
    id: "xp_500",
    name: "Seasoned",
    description: "Earn 500 total XP.",
    icon: "Gem",
    tier: "silver",
    earned: (s) => s.xp >= 500,
  },
  {
    id: "xp_1500",
    name: "Veteran",
    description: "Earn 1,500 total XP.",
    icon: "Trophy",
    tier: "gold",
    earned: (s) => s.xp >= 1500,
  },
];

export const BADGE_BY_ID: Record<string, BadgeDef> = Object.fromEntries(
  BADGES.map((b) => [b.id, b]),
);

/** Returns badge ids that are newly earned given the latest state. */
export function newlyEarned(prevEarned: string[], s: ProgressState): string[] {
  const owned = new Set(prevEarned);
  return BADGES.filter((b) => !owned.has(b.id) && b.earned(s)).map((b) => b.id);
}
