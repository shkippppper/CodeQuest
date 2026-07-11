import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "leakdbg-tool-purpose",
    type: "mcq",
    prompt: "What does the Memory Graph Debugger show you?",
    options: [
      "A live snapshot of every object currently alive and the references pointing into each one",
      "A CPU flame graph of your app",
      "A list of compiler warnings",
      "Network request timings",
    ],
    answer: 0,
    explanation:
      "Pausing the app and clicking the branching-node icon in the debug bar draws the current object graph — every live object and every reference into it — so you can trace exactly what's keeping a suspect object alive.",
  },
  {
    id: "leakdbg-open-fill",
    type: "fill",
    prompt: "In Xcode's debug bar, you open the Memory Graph Debugger by clicking the icon that looks like a small branching ___.",
    answers: ["node", "graph"],
    hint: "Describes the shape of the icon, not its function.",
    explanation: "The icon looks like a small branching node/graph shape sitting among the other debug bar icons.",
  },
  {
    id: "leakdbg-leaks-vs-graph",
    type: "mcq",
    prompt: "How does the Leaks instrument differ from the Memory Graph Debugger?",
    options: [
      "Leaks records continuously over time and flags reference cycles automatically with a stack trace; the Memory Graph Debugger shows one frozen moment you inspect by hand",
      "They do exactly the same thing",
      "Leaks only works in the simulator",
      "The Memory Graph Debugger can only show one object at a time",
    ],
    answer: 0,
    explanation:
      "Leaks is a continuous recording that automatically detects reference cycles as they form and gives you an allocation backtrace. The Memory Graph Debugger is a single paused snapshot you explore interactively.",
  },
  {
    id: "leakdbg-predict-weakself",
    type: "predict",
    prompt: "After adding [weak self] to a leaking closure and rerunning the flow, DetailViewController's deinit still never prints. What's the most likely explanation?",
    code: `class DetailViewController: UIViewController {
    var onRefresh: (() -> Void)?
    var timer: Timer?
    func setup() {
        onRefresh = { [weak self] in self?.reloadData() }
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            self.tick()
        }
    }
}`,
    options: [
      "The Timer closure still captures self strongly and the timer is never invalidated, so it's a second, separate strong reference keeping the object alive",
      "weak self doesn't actually work in Swift",
      "deinit only runs once per app launch",
      "Timers cannot be leaked",
    ],
    answer: 0,
    explanation:
      "Fixing one strong reference doesn't help if another one still exists. The Timer's closure captures self strongly and nothing ever calls invalidate(), so the timer alone keeps the controller alive — the Memory Graph Debugger would show this second incoming arrow.",
  },
  {
    id: "leakdbg-delegate-fill",
    type: "fill",
    prompt: "A delegate property should almost always be declared ___ so the object being delegated to doesn't keep the delegating object alive.",
    answers: ["weak"],
    hint: "Same keyword used to break retain cycles in closures.",
    explanation: "A delegate relationship is meant to be a callback path, not ownership. Forgetting `weak` on a delegate property is one of the most common leak sources in UIKit code.",
  },
  {
    id: "leakdbg-cache-not-cycle",
    type: "mcq",
    prompt: "An ever-growing dictionary cache on a shared singleton keeps accumulating images and memory never drops. Will the Leaks instrument flag this?",
    options: [
      "No — Leaks only detects reference cycles; an unbounded cache is a real leak in effect but not a cycle, so it needs a different fix like NSCache or an eviction policy",
      "Yes, Leaks flags any object that stays alive a long time",
      "Yes, because singletons are always flagged",
      "No, because caches can never leak memory",
    ],
    answer: 0,
    explanation:
      "Leaks specifically watches for groups of objects unreachable except through each other. A singleton's dictionary is reachable (through the singleton), so it's not a cycle — it just never shrinks. The fix is bounding the cache, not breaking a reference.",
  },
  {
    id: "leakdbg-truths-multi",
    type: "multi",
    prompt: "Select all true statements about diagnosing leaks.",
    options: [
      "The Memory Graph Debugger's purple exclamation icon flags references suspected to be part of a cycle",
      "You should reproduce a leaking flow many times (not once) before concluding memory is fine",
      "Verifying a fix means checking the same signal (deinit, living count, or Leaks track) you used to find the leak",
      "Every rising memory number is caused by a retain cycle",
    ],
    answers: [0, 1, 2],
    explanation:
      "Purple icons on suspected cycle references, repeating the flow to surface leaks reliably, and re-checking the same diagnostic signal after a fix are all correct. Not every memory increase is a cycle — an unbounded cache rises without being a cycle at all.",
  },
  {
    id: "leakdbg-multiple-refs-senior",
    type: "mcq",
    prompt: "The Memory Graph Debugger shows three incoming arrows into a leaked DetailViewController instance. You break the closure capture that seems most obvious and rerun, but the leak persists. What went wrong?",
    options: [
      "Breaking one of several strong references isn't enough — every incoming reference must be broken (or the group made fully unreachable) for the object to deallocate",
      "The Memory Graph Debugger was showing stale data",
      "deinit can only be triggered by breaking the first arrow shown",
      "This means the object was never actually leaked",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "An object stays alive as long as any strong path reaches it. With three incoming references, fixing one still leaves two others holding it alive — you have to read and break every relevant arrow in the graph, not just the first one you notice.",
  },
  {
    id: "leakdbg-flashcard",
    type: "flashcard",
    prompt: "Explain your end-to-end workflow for finding and confirming a fix for a memory leak in an iOS app. Answer aloud, then reveal.",
    modelAnswer:
      "Start by reproducing the suspected leak repeatedly (e.g. push/pop a screen ten times) and watching whether the memory gauge or a `deinit` print confirms objects aren't being freed. Open the **Memory Graph Debugger** (the branching-node icon in the debug bar) to pause the app and see a live snapshot: the sidebar's per-type counts confirm how many instances are stuck alive, and clicking one shows every incoming reference, with purple icons flagging suspected **reference cycles**. For a fuller picture over time, run the **Leaks instrument** in Instruments alongside your normal flow — it continuously watches for cycles and gives an allocation stack trace for each one it finds. Check the usual suspects first: closures capturing `self` strongly (needs `[weak self]`), delegate properties declared strong instead of `weak`, timers or notification observers never invalidated/removed, and unbounded caches on singletons (which aren't cycles at all, just need an eviction policy). After applying a fix, verify with the same signal you used to diagnose it — rerun the reproduction and confirm `deinit` fires, the live count returns to zero, or the Leaks track shows no new spike. A fix you haven't re-verified is still a guess.",
    keyPoints: [
      "Reproduce the leak repeatedly before trusting the signal",
      "Memory Graph Debugger = live snapshot + per-type counts + incoming references",
      "Leaks instrument = continuous recording, auto-detects cycles, gives allocation trace",
      "Common sources: closures capturing self, non-weak delegates, uninvalidated timers/observers, unbounded caches",
      "Verify by re-checking the same signal used to diagnose (deinit, living count, Leaks track)",
    ],
    explanation:
      "A senior answer ties diagnosis and verification into one loop: use the graph and the instrument together, check the standard leak sources, and never call a fix done without re-measuring the same signal that first revealed the problem.",
  },
];

export default quiz;
