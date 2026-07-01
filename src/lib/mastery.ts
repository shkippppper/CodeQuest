import type { ProgressState } from "../game/store";

export type MasteryTier = "not-started" | "learning" | "proficient" | "mastered";

export const MASTERY_TIERS: MasteryTier[] = ["not-started", "learning", "proficient", "mastered"];

const TIER_LABEL: Record<MasteryTier, string> = {
  "not-started": "Not started",
  learning: "Learning",
  proficient: "Proficient",
  mastered: "Mastered",
};

// Sequential slate-indigo shades; mastered uses the positive "ok" token.
const TIER_COLOR: Record<MasteryTier, string> = {
  "not-started": "var(--border)",
  learning: "var(--color-brand-300)",
  proficient: "var(--color-brand-500)",
  mastered: "var(--ok)",
};

export interface MasteryInfo {
  tier: MasteryTier;
  label: string;
  color: string;
  /** 0..1 over answered questions in the topic; 0 when none answered */
  accuracy: number;
  answered: number;
}

export function masteryLabel(tier: MasteryTier): string {
  return TIER_LABEL[tier];
}

export function masteryColor(tier: MasteryTier): string {
  return TIER_COLOR[tier];
}

export function topicMastery(state: ProgressState, topicId: string): MasteryInfo {
  const prefix = `${topicId}::`;
  let answered = 0;
  let correct = 0;
  for (const [key, rec] of Object.entries(state.answered)) {
    if (key.startsWith(prefix)) {
      answered++;
      if (rec.correct) correct++;
    }
  }
  const hasWrong = Object.values(state.wrongLog).some((w) => w.topicId === topicId);
  const accuracy = answered > 0 ? correct / answered : 0;

  let tier: MasteryTier;
  if (answered === 0) tier = "not-started";
  else if (accuracy >= 1 && !hasWrong) tier = "mastered";
  else if (accuracy >= 0.8) tier = "proficient";
  else tier = "learning";

  return { tier, label: TIER_LABEL[tier], color: TIER_COLOR[tier], accuracy, answered };
}
