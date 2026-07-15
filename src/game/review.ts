import { getTopic, subjectOfTopic } from "../content/registry";
import type { SubjectId } from "../content/types";
import type { ProgressState } from "./store";

/**
 * How many wrong-logged questions belong to the given subject.
 * Keeps the Review badge consistent with the Review page, which is
 * scoped to the active subject.
 */
export function reviewCountForSubject(state: ProgressState, subject: SubjectId): number {
  let n = 0;
  for (const { topicId } of Object.values(state.wrongLog)) {
    const topic = getTopic(topicId);
    if (topic && subjectOfTopic(topic) === subject) n++;
  }
  return n;
}
