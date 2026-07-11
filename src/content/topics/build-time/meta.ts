import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "build-time",
  title: "Build Time Optimization",
  category: "performance",
  difficulty: "senior",
  order: 7,
  summary: "Diagnosing why Swift builds slow down, and the concrete levers — type inference, module boundaries, incremental builds, WMO — that speed them back up.",
  est: 12,
  tags: ["build time", "type inference", "modules", "incremental builds", "whole-module optimization"],
};

export default meta;
