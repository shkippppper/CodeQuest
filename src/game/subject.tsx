import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { SUBJECTS, type SubjectId } from "../content/types";

const STORAGE_KEY = "cq_subject";
const DEFAULT: SubjectId = "swift";

function isSubjectId(v: unknown): v is SubjectId {
  return typeof v === "string" && v in SUBJECTS;
}

function load(): SubjectId {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (isSubjectId(raw)) return raw;
  } catch {
    /* ignore private mode */
  }
  return DEFAULT;
}

interface SubjectApi {
  subject: SubjectId;
  setSubject: (s: SubjectId) => void;
}

const Ctx = createContext<SubjectApi | null>(null);

export function SubjectProvider({ children }: { children: ReactNode }) {
  const [subject, setSubjectState] = useState<SubjectId>(load);

  const setSubject = useCallback((s: SubjectId) => {
    setSubjectState(s);
    try {
      localStorage.setItem(STORAGE_KEY, s);
    } catch {
      /* ignore quota / private mode */
    }
  }, []);

  const api = useMemo<SubjectApi>(() => ({ subject, setSubject }), [subject, setSubject]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useSubject(): SubjectApi {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSubject must be used within SubjectProvider");
  return ctx;
}
