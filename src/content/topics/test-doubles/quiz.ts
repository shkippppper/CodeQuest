import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "td-what-is",
    type: "mcq",
    prompt: "What is a test double, in general terms?",
    options: [
      "Any object that stands in for a real dependency during a test",
      "A type that duplicates production code for redundancy",
      "A second copy of the app used only in CI",
      "A protocol with two conforming types",
    ],
    answer: 0,
    explanation:
      "A **test double** is a general term (borrowed from 'stunt double') for any object that plays the role of a real collaborator in a test, so the test doesn't depend on the real thing.",
  },
  {
    id: "td-stub-vs-spy",
    type: "mcq",
    prompt: "What is the key difference between a stub and a spy?",
    options: [
      "A stub only returns canned data; a spy also records how it was called so the test can verify interactions",
      "A stub records calls; a spy returns canned data",
      "There is no difference — they're two names for the same thing",
      "A spy can only be used with classes, a stub only with structs",
    ],
    answer: 0,
    explanation:
      "A stub answers questions with hardcoded data. A spy does that too, but also tracks call counts and arguments, so a test can assert on how the code under test used its dependency.",
  },
  {
    id: "td-dummy-predict",
    type: "predict",
    prompt: "This test passes a DummyLogger. What happens when the test runs?",
    code: `struct DummyLogger: Logger {
    func log(_ message: String) {
        fatalError("should never be called")
    }
}

func test_loadName_doesNotLog() async throws {
    let sut = ProfileViewModel(
        repository: StubUserRepository(),
        logger: DummyLogger()
    )
    let name = try await sut.loadName(id: "42")
    XCTAssertEqual(name, "Ada Lovelace")
}`,
    options: [
      "The test passes normally — loadName never calls logger.log, so the dummy's body never runs",
      "The test crashes with fatalError as soon as it runs",
      "It fails to compile because DummyLogger has no real implementation",
      "XCTest automatically skips tests that use dummies",
    ],
    answer: 0,
    explanation:
      "A **dummy** exists only to satisfy a parameter list. Since `loadName` never calls `logger.log` in this scenario, `fatalError` never executes, and the test passes normally.",
  },
  {
    id: "td-mocking-fill",
    type: "fill",
    prompt:
      "Swift lacks the runtime ___ that frameworks like Mockito (Java) or Moq (C#) rely on to auto-generate mocks, which is why Swift developers hand-write doubles that conform to a protocol.",
    answers: ["reflection"],
    hint: "Inspecting/generating code about a type at runtime.",
    explanation:
      "**Reflection** lets other languages generate mock classes automatically at runtime. Swift doesn't expose that kind of reflection over arbitrary types, so the idiomatic approach is a protocol plus a hand-written conforming type.",
  },
  {
    id: "td-di-requirement",
    type: "mcq",
    prompt:
      "ProfileViewModel takes a `let repository: NetworkUserRepository` (a concrete struct), not a protocol. What's the consequence for testing?",
    options: [
      "No test double can be substituted — there's no protocol to conform to and swap in",
      "Nothing changes — Swift lets you subclass any struct for testing",
      "XCTest will auto-generate a mock at compile time",
      "The code becomes slower but is still fully testable",
    ],
    answer: 0,
    explanation:
      "Substituting a double requires the dependency to be expressed as a protocol (or otherwise injected as an abstraction). A concrete, non-protocol type gives you nowhere to plug a stub, spy, mock, or fake in.",
  },
  {
    id: "td-five-kinds-multi",
    type: "multi",
    prompt: "Select all statements that correctly describe a kind of test double.",
    options: [
      "A fake is a simplified but genuinely working implementation, like an in-memory dictionary standing in for a database",
      "A mock pre-programs expected calls ahead of time and can flag a mismatch on the spot",
      "A dummy is expected to be called and asserted on like a spy",
      "A stub returns hardcoded data but doesn't track how it was called",
    ],
    answers: [0, 1, 3],
    explanation:
      "Fake, mock, and stub are described correctly. A **dummy** is the opposite of option 3 — it exists only to satisfy a parameter list and is never expected to be called or asserted on.",
  },
  {
    id: "td-spy-count-predict-senior",
    type: "predict",
    prompt:
      "loadName is refactored to check a cache before calling the repository, but by mistake it now calls fetchUser twice (once for the cache check, once for real). What does this spy-based test report?",
    code: `let spy = SpyUserRepository()
let sut = ProfileViewModel(repository: spy)

_ = try await sut.loadName(id: "42")

XCTAssertEqual(spy.fetchUserCallCount, 1)`,
    options: [
      "The assertion fails: fetchUserCallCount is 2, catching the accidental duplicate call",
      "The assertion passes; call counts aren't tracked across async calls",
      "The test crashes because spies can't be called twice",
      "The assertion is skipped since a stub-only test would already catch this",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "This is exactly why spies exist separately from stubs: a stub only tells you what came back, but a spy's recorded `fetchUserCallCount` catches an extra, unintended call that a return-value-only assertion would miss entirely.",
  },
  {
    id: "td-over-mocking-senior",
    type: "mcq",
    prompt:
      "A test mocks five collaborators and asserts the exact order they were called in. A refactor reorders two internal calls without changing any user-visible behavior, and the test breaks. What does this demonstrate?",
    options: [
      "Over-mocking — the test is asserting on implementation details (call order) instead of observable behavior, making it brittle against safe refactors",
      "The test is correct and the refactor introduced a real bug",
      "Mocks should never be paired with order assertions in any test",
      "XCTest doesn't support asserting call order, so the failure is a framework bug",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Locking in incidental call order across five mocked collaborators tests **implementation details** rather than the behavior the user actually experiences. A good test suite should tolerate refactors that don't change observable outcomes; this one punishes them.",
  },
  {
    id: "td-flashcard-recall",
    type: "flashcard",
    prompt:
      "Explain the five kinds of test doubles, why Swift hand-writes them via protocols, and how to avoid over-mocking. Answer aloud, then reveal.",
    modelAnswer:
      "A **test double** is any stand-in for a real dependency in a test. There are five kinds, in increasing order of what they do: a **dummy** is passed only to satisfy a parameter and is never actually called; a **stub** returns hardcoded, canned data when called; a **spy** does what a stub does but also records call counts and arguments so the test can verify interactions afterward; a **mock** is a spy with expectations set up ahead of time, and it can flag a mismatch on the spot; a **fake** is a simplified but genuinely working implementation, like an in-memory store instead of a real database. Swift developers hand-write doubles as ordinary structs or classes conforming to a protocol rather than relying on an auto-mocking framework, because Swift lacks the runtime **reflection** those frameworks (Mockito, Moq) depend on — this only works at all if production code depends on a protocol (**dependency injection**) rather than a concrete type. The pitfall to avoid is **over-mocking**: mocking every collaborator and asserting on call order or internal sequencing tests implementation details, not behavior, so refactors that don't change what the user sees still break the suite. The fix is to reserve mocks and spies for interactions that are genuinely part of the contract, and use stubs or fakes for everything else.",
    keyPoints: [
      "Dummy (never called) -> stub (returns data) -> spy (records calls) -> mock (pre-set expectations, flags mismatch) -> fake (simplified real implementation)",
      "Swift lacks reflection, so doubles are hand-written protocol conformers, not framework-generated",
      "Requires the dependency to be a protocol injected in, not a concrete type constructed internally",
      "Spies/mocks verify interactions; stubs/fakes just supply data or behavior",
      "Over-mocking = asserting on implementation details (call order, internal sequencing) instead of observable behavior",
    ],
    explanation:
      "A senior answer orders the five doubles by what they add, ties the hand-rolled approach to Swift's lack of reflection, and proactively raises over-mocking as the main risk rather than waiting to be asked.",
  },
];

export default quiz;
