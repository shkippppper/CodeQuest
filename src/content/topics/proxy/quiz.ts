import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "proxy-what",
    type: "mcq",
    prompt: "What is the defining intent of the proxy pattern?",
    options: [
      "A stand-in that implements the real object's interface and controls access to it — deferring, guarding, or relocating that access",
      "Adding new behavior around every call to an existing object",
      "Combining a leaf and container under one interface",
      "Guaranteeing only one instance of a type exists",
    ],
    answer: 0,
    explanation:
      "A proxy conforms to the same interface as a real object but controls access to it, rather than simply adding behavior around every call (that's decorator) or ensuring uniqueness (that's singleton).",
  },
  {
    id: "proxy-virtual-predict",
    type: "predict",
    prompt: "What does this print, in order?",
    code: `let proxy = AvatarProxy(url: someURL)
print("proxy created")
_ = proxy.render()
print("first render done")
_ = proxy.render()
print("second render done")`,
    options: [
      "\"proxy created\" immediately, a delay before \"first render done\", then \"second render done\" right after with no delay",
      "All three print instantly with no delay anywhere",
      "\"proxy created\" only prints after the download finishes",
      "Nothing prints because render() throws",
    ],
    answer: 0,
    explanation:
      "AvatarProxy defers downloading until the first render() call. Creation is instant, the first render() triggers the real download, and the second reuses the cached `real`, returning immediately.",
  },
  {
    id: "proxy-fill",
    type: "fill",
    prompt: "A proxy that defers creating an expensive real object until its first real use is called a ___ proxy.",
    answers: ["virtual"],
    hint: "Starts with 'v'.",
    explanation:
      "A virtual proxy stands in for something expensive to create and only creates the real object on first real use.",
  },
  {
    id: "proxy-protection-mcq",
    type: "mcq",
    prompt: "What does a protection proxy add compared to calling the real object directly?",
    options: [
      "A permission check before forwarding the call to the real object",
      "A network round trip",
      "A cache of previous results",
      "A completely different method signature",
    ],
    answer: 0,
    explanation:
      "A protection proxy gates the call behind a permission check (e.g. `currentUser.role == .admin`) and only forwards to the real object if that check passes.",
  },
  {
    id: "proxy-vs-decorator-mcq",
    type: "mcq",
    prompt: "How does a proxy differ from a decorator, even though both wrap an object behind the same interface?",
    options: [
      "A proxy controls whether/when/how the real object is involved at all; a decorator adds behavior around a call that always happens",
      "A proxy is always faster than a decorator",
      "A decorator can only wrap structs, a proxy can only wrap classes",
      "There is no real difference between them",
    ],
    answer: 0,
    explanation:
      "Decorator's job is to add behavior around every call to something that already exists and is cheap. Proxy's job is to control access — deferring creation, gating on permission, or hiding a location — and the real call might not even happen.",
  },
  {
    id: "proxy-flavors-multi",
    type: "multi",
    prompt: "Select all true statements about the three proxy flavors covered.",
    options: [
      "A remote proxy hides a network or process boundary behind a local-looking interface",
      "A virtual proxy always fires the real work on init",
      "A protection proxy checks a condition (like a permission) before forwarding",
      "All three flavors share the same skeleton: same interface, hold or create the real object, decide when/how to forward",
    ],
    answers: [0, 2, 3],
    explanation:
      "Remote proxies hide network/process boundaries (option 0), protection proxies gate on a condition (option 2), and all three share one skeleton (option 3). A virtual proxy specifically defers the real work rather than firing it on init (option 1 is false).",
  },
  {
    id: "proxy-remote-senior",
    type: "mcq",
    prompt: "What does a remote proxy let calling code avoid knowing about?",
    options: [
      "Whether the method call is a local computation or a network round trip to another process/machine",
      "Whether Swift is compiled or interpreted",
      "The return type of the method",
      "Whether ARC is enabled",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "A remote proxy exposes the same interface a local implementation would have, hiding the fact that the call actually serializes a request, sends it elsewhere, and deserializes a response.",
  },
  {
    id: "proxy-pitfall-senior",
    type: "predict",
    prompt: "🧠 A virtual proxy's render() re-downloads the image on every call instead of caching the real object. What's the practical consequence?",
    code: `final class BrokenAvatarProxy: Avatar {
    private let url: URL
    init(url: URL) { self.url = url }
    func render() -> UIImage {
        RemoteAvatar(url: url).render()   // creates a new RemoteAvatar every call
    }
}`,
    options: [
      "Every call re-triggers the expensive download — the proxy is now slower than just holding the real object directly",
      "It compiles but never downloads at all",
      "This is functionally identical to a correct virtual proxy",
      "Swift automatically caches the result for you",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Forgetting to store the created `real` object defeats the purpose of a virtual proxy: instead of paying the download cost once, every call pays it again — worse than not proxying at all.",
  },
  {
    id: "proxy-flashcard",
    type: "flashcard",
    prompt: "Explain the proxy pattern, its three common flavors, and how it differs from decorator. Answer aloud, then reveal.",
    modelAnswer:
      "A **proxy** is a stand-in object that implements the same interface as a 'real' object but controls access to it rather than doing the real work directly. Three common flavors: a **virtual proxy** defers creating something expensive until first real use (e.g. lazily downloading an avatar only when `render()` is first called, then caching it); a **protection proxy** gates a call behind a permission check before forwarding to the real object; a **remote proxy** hides a network or process boundary, making a call that's really a network round trip look like an ordinary local method call. All three share one skeleton: conform to the real interface, hold or create the real object, and decide when/whether/how to forward. Proxy differs from **decorator** in intent — decorator adds behavior around a call that always happens to something already cheap to hold; proxy controls whether the real, often expensive-or-guarded object gets involved at all, and the real call might never happen.",
    keyPoints: [
      "Stand-in implementing the real interface, controls access rather than adding behavior",
      "Virtual (defer expensive creation), protection (permission gate), remote (hide network boundary)",
      "All three: same interface, hold/create real object, decide when to forward",
      "Proxy vs decorator: controls access to real object vs adds behavior around an always-happening call",
    ],
    explanation:
      "A senior answer names all three flavors precisely and states the proxy-vs-decorator distinction by intent, not just by structural similarity.",
  },
];

export default quiz;
