import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import * as Icons from "lucide-react";
import { Sparkles, Star, X } from "lucide-react";
import { onReward, type RewardEvent } from "../game/rewardBus";
import { BADGE_BY_ID } from "../game/badges";

interface FloatXp {
  id: number;
  amount: number;
  reason?: string;
}
interface ToastItem {
  id: number;
  event: Extract<RewardEvent, { kind: "levelup" | "badge" }>;
}

let counter = 0;

const TIER_COLOR: Record<string, string> = {
  bronze: "#98abce",
  silver: "#6d85b4",
  gold: "#3c527d",
};

function LucideIcon({ name, size, color }: { name: string; size: number; color: string }) {
  const Cmp = (Icons as unknown as Record<string, React.ComponentType<{ size?: number; color?: string }>>)[name] ?? Icons.Award;
  return <Cmp size={size} color={color} />;
}

export function RewardLayer() {
  const [floats, setFloats] = useState<FloatXp[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  useEffect(() => {
    return onReward((e) => {
      if (e.kind === "xp") {
        const id = ++counter;
        setFloats((f) => [...f, { id, amount: e.amount, reason: e.reason }]);
        setTimeout(() => setFloats((f) => f.filter((x) => x.id !== id)), 1100);
      } else {
        const id = ++counter;
        setToasts((t) => [...t, { id, event: e }]);
        const ttl = e.kind === "levelup" ? 5200 : 4200;
        setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), ttl);
      }
    });
  }, []);

  return (
    <>
      {/* floating XP near the top-right XP meter */}
      <div className="pointer-events-none fixed right-6 top-16 z-[60] flex flex-col items-end gap-1">
        {floats.map((f) => (
          <div
            key={f.id}
            className="cq-float-up flex items-center gap-1 rounded-full px-2.5 py-1 text-sm font-bold shadow-lg"
            style={{ background: "var(--color-brand-500)", color: "#fff" }}
          >
            <Star size={13} fill="#fff" /> +{f.amount} XP
          </div>
        ))}
      </div>

      {/* level-up & badge toasts */}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[60] flex flex-col items-end gap-3">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 24, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 320, damping: 24 }}
              className="pointer-events-auto w-72 overflow-hidden rounded-2xl border shadow-2xl"
              style={{ borderColor: "var(--border)", background: "var(--bg-elev)" }}
            >
              {t.event.kind === "levelup" ? (
                <div className="relative p-4">
                  <div
                    className="absolute inset-0 opacity-90"
                    style={{ background: "linear-gradient(135deg, var(--color-brand-500), var(--color-quest-600))" }}
                  />
                  <div className="relative flex items-center gap-3 text-white">
                    <Sparkles size={28} />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider opacity-90">Level up!</p>
                      <p className="text-lg font-extrabold leading-tight">Level {t.event.level}</p>
                      <p className="text-sm opacity-95">{t.event.rank}</p>
                    </div>
                  </div>
                </div>
              ) : (
                <BadgeToast badgeId={t.event.badgeId} onClose={() => setToasts((x) => x.filter((i) => i.id !== t.id))} />
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </>
  );
}

function BadgeToast({ badgeId, onClose }: { badgeId: string; onClose: () => void }) {
  const badge = BADGE_BY_ID[badgeId];
  if (!badge) return null;
  const color = TIER_COLOR[badge.tier];
  return (
    <div className="flex items-start gap-3 p-4">
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
        style={{ background: `color-mix(in srgb, ${color} 20%, transparent)` }}
      >
        <LucideIcon name={badge.icon} size={22} color={color} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold uppercase tracking-wider" style={{ color }}>
          {badge.tier} badge unlocked
        </p>
        <p className="font-bold leading-tight">{badge.name}</p>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {badge.description}
        </p>
      </div>
      <button onClick={onClose} className="cursor-pointer rounded p-0.5 opacity-50 hover:opacity-100">
        <X size={15} />
      </button>
    </div>
  );
}
