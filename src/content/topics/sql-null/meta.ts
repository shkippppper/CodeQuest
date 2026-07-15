import type { TopicMeta } from "../../types";

const meta: TopicMeta = {
  id: "sql-null",
  title: "NULL & Three-Valued Logic",
  category: "sql-foundations",
  difficulty: "mid",
  order: 5,
  summary: "NULL means 'unknown', so comparisons yield UNKNOWN — test with IS NULL and fill gaps with COALESCE.",
  est: 11,
  tags: ["NULL", "three-valued logic", "IS NULL", "COALESCE"],
};

export default meta;
