import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "api-resource-naming-mcq",
    type: "mcq",
    prompt: "Which URL design follows REST-style resource modeling for deleting a comment?",
    options: [
      "DELETE /posts/{postID}/comments/{id}",
      "GET /deleteComment?id=5",
      "POST /comments/delete/{id}",
      "GET /posts/{postID}/comments/{id}/delete",
    ],
    answer: 0,
    explanation:
      "A **resource** URL names the noun (`comments/{id}`); the HTTP verb (`DELETE`) carries the action. Baking the action into the URL itself (`/deleteComment`, `/delete`) fights the protocol and breaks generic tooling like caches and proxies.",
  },
  {
    id: "api-offset-vs-cursor-predict",
    type: "predict",
    prompt: "A user is scrolling page 2 of comments using `?offset=20&limit=20`. Someone posts a new comment at the very top of the list while they scroll. What happens?",
    code: `GET /posts/{postID}/comments?offset=20&limit=20
// a new comment is inserted at position 0 between page 1 and page 2 requests`,
    options: [
      "Every comment shifts down by one, so offset 20 now points at a different comment — the user sees a duplicate or misses one",
      "Nothing — offset pagination internally stores a snapshot of positions at query time, so any inserts made after page 1 don't affect page 2 at all",
      "The request fails with a 409 Conflict error because the server detects that the item count changed between requests",
      "The new comment is automatically inserted into the already-loaded page 1 result via a server-sent push notification",
    ],
    answer: 0,
    explanation:
      "Offset pagination points at a *position*, not a specific item. An insert shifts every subsequent position, so the same offset now resolves to a different comment — the classic argument for cursor-based pagination instead.",
  },
  {
    id: "api-cursor-fill",
    type: "fill",
    prompt: "___-based pagination anchors the next page to a specific item (via an opaque token) instead of a numeric position, so inserts elsewhere in the list don't shift it.",
    answers: ["cursor"],
    hint: "The opaque token the server hands back and the client echoes to get the next page.",
    explanation:
      "A **cursor** points at a specific item ('everything after comment c20') rather than a numeric offset, so it stays correct even as items are inserted or removed elsewhere in the list.",
  },
  {
    id: "api-error-contract-mcq",
    type: "mcq",
    prompt: "Why should client code branch on an error response's `code` field instead of its `message` field?",
    options: [
      "`message` is meant for humans and can be reworded by the backend without notice; `code` is a stable, documented value safe to switch on",
      "`message` is always fully localized into the user's own language while `code` stays English-only, which makes the message field useless for any display logic",
      "HTTP strictly forbids a `message` field in JSON error response bodies, so any code reading it violates the spec",
      "`code` is several times faster to parse at runtime than a string `message`, which matters under high response volume",
    ],
    answer: 0,
    explanation:
      "The **error contract** should give clients a stable `code` to branch on. `message` strings are for display and change wording freely — code that pattern-matches on them breaks silently the next time someone edits copy.",
  },
  {
    id: "api-backward-compat-multi",
    type: "multi",
    prompt: "Select **all** changes to a JSON response shape that are backward compatible for existing clients (no version bump needed).",
    options: [
      "Adding a new optional field like `likeCount`",
      "Renaming `authorID` to `author`",
      "Changing a field's type from a String to an Int",
      "Making a previously optional field required",
    ],
    answers: [0],
    explanation:
      "Only adding an optional field is safely backward compatible — old clients ignore fields they don't know about. Renames, type changes, and newly-required fields all break clients still decoding the old shape, and warrant a version bump.",
  },
  {
    id: "api-versioning-mechanism-mcq",
    type: "mcq",
    prompt: "What's the most common way an API serves two incompatible response shapes to old and new clients at the same time?",
    options: [
      "A version segment in the URL (or a version header), with the server running both versions simultaneously",
      "Randomly picking a response shape per request so that clients are forced to handle both formats defensively",
      "Requiring every client to upgrade to the new version before the new response shape is allowed to ship at all",
      "Sending both the old and new response shapes merged inside a single response body so any client version can extract what it needs",
    ],
    answer: 0,
    explanation:
      "**Versioning** via a URL segment (`/v1/`, `/v2/`) or an `Accept` header lets the server run both contracts side by side — old clients keep hitting the version they were built for, new clients get the new shape.",
  },
  {
    id: "api-additive-first-flashcard",
    type: "flashcard",
    prompt: "Explain the 'only add, never remove or repurpose' rule and why it matters more than knowing how to version. Answer aloud, then reveal.",
    modelAnswer:
      "**Backward compatibility** means changing an API's contract without breaking clients still built against the old one. The practical rule is: only *add* optional fields; never remove a field, rename one, change its type, or make an optional field required — those all break clients decoding the old shape. Following this rule means most backend changes never need a version bump at all, because old clients simply ignore fields they don't recognize. Versioning (a `/v1/` vs `/v2/` URL or header) is the expensive fallback reserved for genuine breaking changes — running two contracts side by side is ongoing maintenance cost, not a one-time fix, so the first question for any change should be 'can this be additive?' before reaching for a new version.",
    keyPoints: [
      "Additive optional fields are free — old clients ignore unknown keys",
      "Renames, removals, type changes, newly-required fields all break old clients",
      "Version bumps mean running two contracts in parallel indefinitely — real cost",
      "Ask 'can this be additive?' before reaching for a version bump",
    ],
    explanation:
      "A senior answer leads with additive changes as the default and frames a version bump as the costly exception, not the first tool reached for.",
  },
  {
    id: "api-status-class-mcq",
    type: "mcq",
    prompt: "A client automatically retries a failed request. Which HTTP status class is generally safe to retry, and which almost never is?",
    options: [
      "5xx (server's fault) is usually safe to retry; 4xx (client's fault) almost never is, since retrying resends the same bad request",
      "4xx is always the safest class to retry because the client controls its own request format and can correct it instantly",
      "Both 4xx and 5xx are equally safe to retry automatically because the server will simply reject bad requests without side effects",
      "Status codes alone carry no information about retry safety — only the error body's structured fields can indicate whether a retry makes sense",
    ],
    answer: 0,
    explanation:
      "A `5xx` often reflects a transient server problem, so a retry might succeed. A `4xx` means the request itself was wrong — retrying it unchanged just reproduces the same failure.",
  },
  {
    id: "api-versioning-cost-senior",
    type: "predict",
    prompt: "Trick question: once you ship `/v2/comments`, is `/v1/comments` free to delete as soon as the new app version is in the App Store?",
    code: `// v2 shipped, backend team wants to clean up v1 immediately`,
    options: [
      "No — some installed apps won't have upgraded yet and still call v1; it must stay live until adoption of the old version drops to an acceptable level",
      "Yes — App Store releases push to every device instantly, so the entire installed base is on the new version within minutes",
      "Yes — v1 and v2 route to the same underlying data store, so removing the v1 route is a no-op with no effect on any client",
      "No — v1 must be maintained forever alongside every future version, because regulatory, legal, and contractual obligations strictly prohibit ever removing a shipped API route",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Users upgrade on their own schedule, sometimes never. `v1` has to stay live as long as any meaningful population of installed apps still calls it — this ongoing dual-maintenance cost is exactly why version bumps are the expensive fallback, not the default move.",
  },
];

export default quiz;
