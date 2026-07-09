## The problem: one class, three jobs

Look at this type:

```swift
class InvoiceManager {
    var lineItems: [LineItem] = []

    func addLineItem(_ item: LineItem) {
        lineItems.append(item)
    }

    func total() -> Decimal {
        lineItems.reduce(0) { $0 + $1.price }
    }

    func printInvoice() {
        print("Invoice total: \(total())")
    }

    func saveToDisk(at url: URL) throws {
        let data = try JSONEncoder().encode(lineItems)
        try data.write(to: url)
    }
}
```

It compiles fine and it works. But think about who asks for changes to this file. The accounting team wants the total calculated differently (tax rules changed). The design team wants the printed invoice formatted differently (a new receipt layout). The infrastructure team wants invoices saved to a database instead of disk. Three unrelated teams, three unrelated reasons, and every one of them edits the same file.

That's the smell this lesson is about. A type that four different people need to change for four different reasons is fragile — a change requested by one team can break behavior another team depends on, just because it lives in the same class.

## One reason to change

The **Single Responsibility Principle** (SRP) says: a type should have exactly one reason to change. "Reason to change" means one axis of business or technical concern — one job, owned by one actor.

`InvoiceManager` has at least three reasons to change:

```swift
func total() -> Decimal { ... }        // reason 1: pricing/tax rules
func printInvoice() { ... }            // reason 2: how invoices are displayed
func saveToDisk(at url: URL) throws { ... }  // reason 3: how invoices are persisted
```

Notice this isn't about *how many methods* a type has — a type can have ten small methods and still have a single responsibility, as long as they all serve the same job. SRP is about **cohesion**: do all the members of this type change together, for the same reason? If two methods change for unrelated reasons, they belong in different types.

## Identifying responsibilities

A fast way to find hidden responsibilities: for each method, ask "who would file a bug report or feature request against this?"

```swift
func total() -> Decimal { ... }              // "Accounting" would file this
func printInvoice() { ... }                  // "UI/Design" would file this
func saveToDisk(at url: URL) throws { ... }  // "Persistence/Infra" would file this
```

Three different answers means three different responsibilities living in one class. If every method traces back to the same answer, the type is cohesive and SRP is satisfied — even if it has many methods.

Another tell: look at the properties each method touches. `total()` only reads `lineItems`. `saveToDisk` only reads `lineItems` too, but it also needs `JSONEncoder` and file I/O — completely different dependencies than pricing math needs. Methods that don't share dependencies are a hint they don't share a responsibility either.

## Splitting a class

Once the responsibilities are named, giving each one its own type is mechanical. Start with pricing:

```swift
struct InvoiceCalculator {
    func total(of lineItems: [LineItem]) -> Decimal {
        lineItems.reduce(0) { $0 + $1.price }
    }
}
```

Now formatting:

```swift
struct InvoicePrinter {
    func format(_ lineItems: [LineItem], total: Decimal) -> String {
        "Invoice total: \(total)"
    }
}
```

Now persistence:

```swift
struct InvoiceStore {
    func save(_ lineItems: [LineItem], to url: URL) throws {
        let data = try JSONEncoder().encode(lineItems)
        try data.write(to: url)
    }
}
```

And `Invoice` itself shrinks down to just what it actually *is* — data, plus the one operation (adding a line item) that's genuinely about being an invoice:

```swift
struct Invoice {
    var lineItems: [LineItem] = []

    mutating func addLineItem(_ item: LineItem) {
        lineItems.append(item)
    }
}
```

Now trace the same question again. If tax rules change, only `InvoiceCalculator` changes. If the receipt layout changes, only `InvoicePrinter` changes. If invoices move from disk to a database, only `InvoiceStore` changes — and it changes without touching pricing math or display logic at all.

Predict: after this split, if a designer edits `InvoicePrinter.format`, does `InvoiceCalculator`'s test suite need to run again?

Answer: no. `InvoiceCalculator` doesn't depend on `InvoicePrinter` and doesn't call it, so a formatting change can't break a pricing calculation. That independence — one change, one blast radius — is the entire payoff of SRP.

## SRP in Swift types

SRP isn't just for classes. It applies to whichever kind of type is holding mixed concerns.

A `struct` that both models data and knows how to render itself as JSON *and* validate itself against business rules has the same problem as `InvoiceManager` did:

```swift
struct User: Codable {
    var name: String
    var email: String

    func isValidEmail() -> Bool {
        email.contains("@")
    }
}
```

`Codable` conformance (serialization) is a separate concern from `isValidEmail()` (business validation). It's common to leave `Codable` on the model itself since it's mechanical and low-risk, but a growing set of validation rules deserves its own type:

```swift
struct UserValidator {
    func isValid(_ user: User) -> Bool {
        user.email.contains("@") && !user.name.isEmpty
    }
}
```

Protocols can also violate SRP if they bundle unrelated capabilities — that's covered in the Interface Segregation lesson. And a **manager** or **helper** class with a grab-bag of unrelated methods is the single most common SRP violation in real iOS codebases; if you can't summarize what a `Manager` class does in one short sentence without using "and," it's probably several classes wearing a trench coat.

## Over-splitting risk

SRP has a failure mode in the opposite direction: too many tiny classes, each holding a single method, connected by so much indirection that nobody can trace a simple feature without opening six files.

```swift
struct InvoiceLineItemAdder { func add(...) { ... } }
struct InvoiceLineItemRemover { func remove(...) { ... } }
struct InvoiceLineItemCounter { func count(...) -> Int { ... } }
```

These three methods all operate on the same data for the same reason — they're all "manage the list of line items on an invoice." Splitting them into three types doesn't create three responsibilities; it just creates ceremony. A single `InvoiceLineItems` type holding `add`, `remove`, and `count` is still one responsibility, and it's easier to find and test.

The rule of thumb: split along reasons to change that come from different people or different business rules, not along every individual method. If in doubt, ask the "who files the bug report" question from earlier — if the answer is the same person for every method, keep them together.

## Common pitfalls

- Splitting by technical layer instead of by reason to change. A `Getter` class and a `Setter` class for the same data isn't SRP — it's the same responsibility, sliced pointlessly.
- Naming a type `...Manager` or `...Helper`. These names are a magnet for unrelated methods over time. If you can't name a type after what it *is* rather than what it vaguely *does*, its responsibility probably isn't well-defined yet.
- Confusing "one method" with "one responsibility." A type can have many methods and still be SRP-compliant, as long as they all serve one job with one reason to change.

## Interview lens

If asked "what is the Single Responsibility Principle," don't just recite "a class should do one thing" — that's vague and interviewers have heard it a hundred times. Say it precisely: a type should have one reason to change, meaning all of its behavior is owned by a single actor or business concern.

If asked to spot an SRP violation in code, use the "who files the bug" trick out loud — walk through each method and name who would request a change to it. If you get more than one distinct answer, say so and show how you'd split the type, keeping the split along actual reasons-to-change rather than one class per method.

If the interviewer pushes on "isn't this over-engineering for a small app," give the honest answer: SRP is a judgment call, not a mechanical rule, and over-splitting into one-method classes is a real failure mode too. The right amount of splitting is "each type changes for exactly one reason," not "each type has exactly one method."
