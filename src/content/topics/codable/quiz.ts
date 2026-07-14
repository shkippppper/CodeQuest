import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "codable-typealias",
    type: "mcq",
    prompt: "What is `Codable`?",
    options: [
      "A typealias for `Encodable & Decodable`",
      "A class you subclass to inherit default encode and decode implementations for your model types",
      "A property wrapper that automatically serializes the annotated property to and from JSON",
      "A JSON parser that converts raw Data into a dictionary you then map to your model manually",
    ],
    answer: 0,
    explanation:
      "`Codable = Encodable & Decodable`. `Encodable` turns a value into external data (`encode(to:)`); `Decodable` builds a value from data (`init(from:)`). A `JSONEncoder`/`JSONDecoder` does the actual conversion.",
  },
  {
    id: "codable-synthesis",
    type: "mcq",
    prompt: "When does the compiler synthesize Codable conformance for you?",
    options: [
      "When every stored property is itself Codable",
      "Only for classes, because struct synthesis requires a superclass to supply the container logic",
      "Only when you write CodingKeys by hand, because the compiler needs an explicit key list to generate conformance",
      "Never — you must always implement encode(to:) and init(from:) yourself for each type",
    ],
    answer: 0,
    explanation:
      "If all stored properties are `Codable`, the compiler synthesizes `CodingKeys`, `encode(to:)`, and `init(from:)` — zero boilerplate. A non-Codable stored property breaks synthesis until you handle it.",
  },
  {
    id: "codingkeys-mapping",
    type: "predict",
    prompt: "What JSON key does `firstName` map to here?",
    code: `struct User: Codable {
    let firstName: String
    enum CodingKeys: String, CodingKey {
        case firstName = "first_name"
    }
}`,
    options: ["first_name", "firstName", "FirstName", "first-name"],
    answer: 0,
    explanation:
      "The `CodingKeys` raw value overrides the JSON key, so `firstName` encodes/decodes as `first_name`. Alternatively, `decoder.keyDecodingStrategy = .convertFromSnakeCase` maps it automatically without a CodingKeys enum.",
  },
  {
    id: "codingkeys-omit",
    type: "mcq",
    prompt: "How do you exclude a property from encoding/decoding?",
    options: [
      "Omit its case from the `CodingKeys` enum",
      "Mark it `private`",
      "Make it a computed property only (also works) or leave it out of CodingKeys",
      "Both omitting from CodingKeys and using a computed property work",
    ],
    answer: 3,
    explanation:
      "Leaving a stored property out of `CodingKeys` excludes it from coding (it needs a default value for decoding to succeed). Computed properties aren't coded at all. Both approaches keep a field out of the JSON.",
  },
  {
    id: "decodeifpresent-fill",
    type: "fill",
    prompt: "Use `container.decode___(String.self, forKey: .name)` to return nil (instead of throwing) when a key is missing or null.",
    answers: ["IfPresent", "decodeIfPresent"],
    hint: "decode___ — 'if present'.",
    explanation:
      "`decodeIfPresent` yields nil for a missing/null key rather than throwing, so you can tolerate optional fields (often paired with `?? default`).",
  },
  {
    id: "codable-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about Codable.",
    options: [
      "Date/key/data strategies are set on the JSONDecoder/JSONEncoder, not the model",
      "`decode(_:from:)` is throwing and type-directed",
      "Nested Codable types decode automatically",
      "Automatic synthesis works even if a stored property isn't Codable",
    ],
    answers: [0, 1, 2],
    explanation:
      "Coder-level strategies, throwing type-directed decode, and automatic nested decoding are correct. Synthesis **fails** if any stored property isn't Codable (option 3 is false).",
  },
  {
    id: "date-strategy-senior",
    type: "predict",
    prompt: "🧠 Trick question — your API sends dates as ISO-8601 strings but decoding fails. What's the fix?",
    code: `// JSON: { "createdAt": "2024-01-15T10:30:00Z" }
let decoder = JSONDecoder()
let model = try decoder.decode(Model.self, from: data)  // fails on the date`,
    options: [
      "Set `decoder.dateDecodingStrategy = .iso8601` — the default expects a numeric format, not an ISO string",
      "Change the property type to String and parse the date manually after decoding the full model",
      "Dates can't be Codable; use a custom init(from:) that reads the raw JSON string via a single-key container",
      "Add a CodingKeys enum mapping createdAt to a different key the decoder can interpret as a date directly",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "By default `JSONDecoder` decodes `Date` as a number (seconds since a reference date), so an ISO-8601 *string* mismatches. Set `dateDecodingStrategy = .iso8601` (or `.formatted(df)` / `.custom`). This is the single most common Codable date bug.",
  },
  {
    id: "decoding-error-senior",
    type: "mcq",
    prompt: "A decode fails. How do you find exactly what and where?",
    options: [
      "Catch the `DecodingError` and inspect its case (typeMismatch/keyNotFound/…) and `context.codingPath`",
      "There's no way to know — the decode call collapses all failures into a single opaque error, so just retry",
      "Read the raw bytes manually to find the malformed field before attempting a second decode pass",
      "Use `try?` to swallow the error and substitute a default value, then log the nil result for monitoring",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "`decode` throws a `DecodingError` with a specific case and a `context` whose `codingPath` points to the exact key/index that failed. Catching it (instead of swallowing with `try?`) is how you debug malformed responses.",
  },
  {
    id: "heterogeneous-senior",
    type: "mcq",
    prompt: "How do you decode a JSON array where each object has a different shape discriminated by a `type` field?",
    options: [
      "Decode the discriminator first, then decode the matching concrete type — often via an enum with associated values whose init(from:) switches on the tag",
      "Decode everything as [Any] and then individually cast each element to the expected concrete type at the call site using as?",
      "It is completely impossible with Codable — all heterogeneous JSON arrays require a dedicated third-party library such as AnyCodable or Runtime",
      "Use decodeIfPresent for every single possible field across all known shapes and then reconstruct the intended concrete type from whichever complete set of fields happens to be non-nil",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Heterogeneous JSON needs a manual step: read the `type` discriminator, then decode the correct concrete type. A common pattern is an enum with associated values whose custom `init(from:)` switches on the tag and decodes the right payload.",
  },
  {
    id: "codable-flashcard",
    type: "flashcard",
    prompt:
      "Explain Codable: synthesis, CodingKeys, custom coding, strategies, and errors. Answer aloud, then reveal.",
    modelAnswer:
      "**`Codable = Encodable & Decodable`** — a type-safe archiving system. If **every stored property is Codable**, the compiler **synthesizes** `CodingKeys`, `encode(to:)`, and `init(from:)`; a `JSONEncoder`/`JSONDecoder` does the conversion (`decode(_:from:)` is throwing and type-directed). Map differing JSON keys with a **`CodingKeys`** `String` enum (or the decoder's `keyDecodingStrategy = .convertFromSnakeCase`), and **omit** a case to exclude a property. For non-1:1 JSON, write a **custom `init(from:)`/`encode(to:)`** using keyed containers — use **`decodeIfPresent`** to tolerate missing/null fields, nested containers to flatten, and for **heterogeneous** arrays decode a discriminator then the matching concrete type (often an enum with associated values). **Strategies live on the coder**, not the model: `dateDecodingStrategy` (the classic fix — `.iso8601` — for 'dates won't decode', since the default expects a number), `keyDecodingStrategy`, `dataDecodingStrategy`. On failure, `decode` throws a **`DecodingError`** whose case (`typeMismatch`/`keyNotFound`/`valueNotFound`/`dataCorrupted`) and `context.codingPath` pinpoint the problem — catch and inspect it rather than swallowing with `try?`.",
    keyPoints: [
      "Codable = Encodable & Decodable; synthesized when all stored props are Codable",
      "CodingKeys map/rename/exclude keys; or .convertFromSnakeCase on the decoder",
      "Custom init(from:)/encode(to:) + decodeIfPresent for non-1:1 / optional JSON",
      "Strategies on the coder: dateDecodingStrategy .iso8601 fixes date bugs",
      "DecodingError case + context.codingPath pinpoint failures (don't use try?)",
    ],
    explanation:
      "Senior answers cover the date-strategy gotcha, DecodingError inspection, decodeIfPresent for optionals, and heterogeneous decoding via a discriminator.",
  },
];

export default quiz;
