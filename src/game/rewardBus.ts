export type RewardEvent =
  | { kind: "xp"; amount: number; reason?: string }
  | { kind: "levelup"; level: number; rank: string }
  | { kind: "badge"; badgeId: string };

type Listener = (e: RewardEvent) => void;

const listeners = new Set<Listener>();

export function onReward(fn: Listener): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function emitReward(e: RewardEvent): void {
  for (const fn of listeners) fn(e);
}
