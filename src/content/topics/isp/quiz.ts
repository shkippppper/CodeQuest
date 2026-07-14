import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "isp-definition",
    type: "mcq",
    prompt: "What does the Interface Segregation Principle say?",
    options: [
      "Clients shouldn't be forced to depend on methods they don't use",
      "Every type must conform to exactly one protocol so dependency relationships remain unambiguous",
      "Protocols should never have more than one requirement, because each requirement increases coupling",
      "Interfaces should always be implemented as classes rather than protocols to enable inheritance",
    ],
    answer: 0,
    explanation:
      "ISP targets fat protocols that bundle unrelated capabilities, forcing conformers to implement (or fake) methods they have no real use for.",
  },
  {
    id: "isp-fat-interface-mcq",
    type: "mcq",
    prompt: "Why is the `Printer` protocol below a 'fat interface'?",
    code: `protocol Printer {
    func printDocument(_ doc: Document)
    func scanDocument() -> Document
    func faxDocument(_ doc: Document, to number: String)
}`,
    options: [
      "It bundles three independent hardware capabilities into one contract, forcing every conformer to deal with all three even if it only supports one",
      "It has too few methods to cover all the print-job management and spooler-queue tasks a real production printer driver must handle",
      "It lacks generic type parameters, so it cannot safely express document transformations across different concrete document types without runtime casting",
      "Protocols in Swift can only declare one method requirement at a time, so a protocol body with three method signatures is always a compiler error",
    ],
    answer: 0,
    explanation:
      "Printing, scanning, and faxing are independent capabilities different hardware supports independently. Bundling them forces a print-only device to fake the other two.",
  },
  {
    id: "isp-basicusb-predict",
    type: "predict",
    prompt: "What happens when this code runs?",
    code: `struct BasicUSBPrinter: Printer {
    func printDocument(_ doc: Document) { /* prints fine */ }
    func scanDocument() -> Document { fatalError("this printer can't scan") }
    func faxDocument(_ doc: Document, to number: String) { fatalError("can't fax") }
}
let p: Printer = BasicUSBPrinter()
_ = p.scanDocument()`,
    options: [
      "The app crashes at runtime — scanDocument() calls fatalError()",
      "It silently returns an empty Document, because fatalError is intercepted by the runtime and replaced with a zero-value fallback",
      "Compile error — BasicUSBPrinter doesn't conform to Printer because the return type of scanDocument doesn't match",
      "It prints the document instead of scanning, because the compiler substitutes the only implemented capability",
    ],
    answer: 0,
    explanation:
      "BasicUSBPrinter is forced to implement scanDocument() to conform to the fat Printer protocol, but has no real implementation, so it crashes when called — exactly the risk of a fat interface.",
  },
  {
    id: "isp-role-interface-fill",
    type: "fill",
    prompt: "A small protocol that names exactly one capability, describing the role a type plays rather than everything it might do, is called a ___ interface.",
    answers: ["role"],
    hint: "Two words in the lesson section title: '___ interfaces'.",
    explanation:
      "Role interfaces (Printing, Scanning, Faxing) compose — a type conforms to every role it actually fills, and the type system reflects exactly what it can do.",
  },
  {
    id: "isp-split-predict",
    type: "predict",
    prompt: "After splitting Printer into Printing, Scanning, and Faxing protocols, can printReport(_:using:) below be called with an AllInOneDevice, which conforms to Printing, Scanning, and Faxing all three?",
    code: `protocol Printing { func printDocument(_ doc: Document) }
struct AllInOneDevice: Printing, Scanning, Faxing { /* ... */ }
func printReport(_ doc: Document, using printer: Printing) {
    printer.printDocument(doc)
}
printReport(someDoc, using: AllInOneDevice())`,
    options: [
      "Yes — AllInOneDevice conforms to Printing (among others), so it satisfies the narrower parameter type on its own",
      "No — AllInOneDevice must conform to exactly Printing and no other protocols; additional conformances prevent it from being passed as a narrower type",
      "Compile error — a type in Swift cannot conform to more than one protocol simultaneously in the same declaration",
      "No — printReport explicitly requires a Printing & Scanning & Faxing existential, so a type conforming to all three must be declared with that combined type",
    ],
    answer: 0,
    explanation:
      "Splitting protocols doesn't prevent a type from adopting several of them. A type conforming to more than the parameter asks for still satisfies that narrower requirement.",
  },
  {
    id: "isp-cocoa-multi",
    type: "multi",
    prompt: "Select all true statements about ISP in Cocoa/UIKit delegate protocols.",
    options: [
      "UITableViewDataSource and UITableViewDelegate are deliberately separate protocols, even though most table views need both",
      "Splitting data-source from delegate lets a headless data source avoid stubbing out selection-handling methods it never calls",
      "UIScrollViewDelegate bundling scroll/zoom/deceleration callbacks together is an all-or-nothing ISP violation with no justification",
      "ISP is a spectrum — the right granularity is splitting along genuinely independent capabilities, not one protocol per method",
    ],
    answers: [0, 1, 3],
    explanation:
      "UITableViewDataSource/Delegate is a real ISP split; UIScrollViewDelegate's larger surface is a deliberate, defensible trade-off since most scroll-caring conformers want several of its callbacks together — not a clear-cut violation (option 2 is false as stated).",
  },
  {
    id: "isp-default-impl-mcq",
    type: "mcq",
    prompt: "What is a Swift protocol extension's default implementation actually good for, per this lesson?",
    options: [
      "Reducing boilerplate for a capability every conformer legitimately has, with a sensible shared default — not a fix for a fat protocol's forced-but-unwanted methods",
      "Silently hiding methods a conformer cannot implement by returning a zero or empty value instead of crashing, which hides the missing capability entirely from downstream callers",
      "Forcing every conformer of a protocol to override every method by marking the default implementation as final, which prevents any conforming type from providing its own specialized version",
      "Replacing the need for protocol declarations entirely by providing full concrete implementations that allow types to participate in polymorphism without writing an explicit conformance",
    ],
    answer: 0,
    explanation:
      "Default implementations shine when a capability is optional and there's a genuinely reasonable shared default. Using one to silently no-op a capability a conformer lacks (like scanDocument()) hides the gap instead of fixing it — worse than an honest fatalError.",
  },
  {
    id: "isp-senior-noop-danger",
    type: "predict",
    prompt: "🧠 A developer 'fixes' BasicUSBPrinter's fatalError crash by adding a protocol extension default implementation of scanDocument() that silently returns an empty Document instead of crashing. Why does this lesson call that worse than the original crash?",
    code: `extension Printer {
    func scanDocument() -> Document {
        Document()  // silently does nothing meaningful
    }
}`,
    options: [
      "It hides the missing capability instead of removing it from the type's contract — callers now get silently wrong empty documents instead of an obvious, debuggable crash",
      "It is a correct and complete fix: the protocol extension satisfies the requirement, preserves the existing conformance, and gives callers a safe non-crashing fallback document value",
      "Protocol extensions are not permitted to provide default implementations for any method that has a return type, because the compiler cannot verify that the returned default value is semantically valid",
      "It introduces a retain cycle because the protocol extension stores a strong implicit back-reference to every conforming type that relies on the default implementation at runtime",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "The real ISP fix is splitting the protocol so BasicUSBPrinter never claims to support scanning at all. Papering over the gap with a silent no-op default trades a loud, obvious crash for silent data corruption — strictly worse, because the bug is now invisible until someone notices the empty documents downstream.",
  },
  {
    id: "isp-flashcard",
    type: "flashcard",
    prompt: "Explain the Interface Segregation Principle, the fat-interface failure mode, and how role interfaces and default implementations relate to it. Answer aloud, then reveal.",
    modelAnswer:
      "**ISP** states that clients shouldn't be forced to depend on methods they don't use. The failure mode is a **fat interface** — a protocol bundling multiple independent capabilities (e.g. printing, scanning, faxing) into one contract, forcing every conformer to implement all of them even when it only supports one, which typically means faking the rest with `fatalError` or a no-op. The fix is splitting the fat protocol along its genuinely independent capabilities into small, focused **role interfaces** (`Printing`, `Scanning`, `Faxing`), which types then conform to individually or in combination — Swift lets a type adopt as many protocols as it needs, so this costs nothing in expressiveness, and callers ask for exactly the capability they need (e.g. a function taking `Printing` rather than the old fat `Printer`). Apple's own `UITableViewDataSource`/`UITableViewDelegate` split is a real-world example; `UIScrollViewDelegate`'s larger surface shows ISP is a spectrum, not a rule to split every method into its own protocol. **Default implementations** via protocol extensions are a related but different tool: they remove boilerplate for a capability every conformer legitimately has and shares a sensible default for — they are *not* a fix for a fat protocol, since a default that silently no-ops an unsupported capability hides the gap instead of removing it from the type's contract, which is worse than an honest crash.",
    keyPoints: [
      "Fat interface: bundles independent capabilities, forces conformers to fake unsupported ones",
      "Fix: split into focused role interfaces along genuinely independent capabilities",
      "A type can conform to many role protocols at once — no loss of polymorphism",
      "UITableViewDataSource/Delegate = real split; UIScrollViewDelegate = deliberate looser trade-off",
      "Default implementations reduce boilerplate for shared capabilities — not a patch for a fat protocol's forced methods",
    ],
    explanation:
      "A senior answer distinguishes ISP's real fix (splitting protocols) from a superficially similar but wrong fix (silently defaulting an unsupported method), and cites a concrete Cocoa example.",
  },
];

export default quiz;
