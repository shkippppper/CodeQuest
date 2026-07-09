## The problem: JSON in, models out

Your app asks a server for a user and gets back text like this:

```json
{ "id": 7, "name": "Ada" }
```

Your code doesn't want text. It wants this:

```swift
struct User {
    let id: Int
    let name: String
}
```

Somebody has to bridge the gap — read the text, find `"id"`, check it's a number, put it in `id`, and do it all again in reverse when sending data back. Written by hand, that bridging code is tedious, repetitive, and fragile: one renamed field and things break at runtime.

Swift builds the bridge for you. The system is called **Codable**, and it's type-safe end to end: the compiler generates the conversion code from your type's definition, and failures come back as clear, catchable errors instead of silent corruption.

## Two halves: Encodable and Decodable

Conformance is one word:

```swift
struct User: Codable {
    let id: Int
    let name: String
}
```

`Codable` is actually a typealias for `Encodable & Decodable` — a composition of two protocols, one per direction:

- **Encodable** — the type can turn itself into external data. Its requirement is `encode(to:)`.
- **Decodable** — the type can build itself from external data. Its requirement is `init(from:)`.

Now do the actual conversion. Going out:

```swift
let user = User(id: 7, name: "Ada")
let data = try JSONEncoder().encode(user)
// data now holds: {"id":7,"name":"Ada"}
```

And coming in:

```swift
let incoming = #"{"id": 7, "name": "Ada"}"#.data(using: .utf8)!
let decoded = try JSONDecoder().decode(User.self, from: incoming)
print(decoded.name)   // Ada
```

Two details in that `decode` line deserve a pause. First, you pass the type itself — `User.self` — telling the decoder what shape to validate against and build. Second, the `try`: decoding *throws*, because incoming data is the outside world and might not match. There's no silent half-built object; you get a valid `User` or an error.

JSON is the common case, but not the only coder — `PropertyListEncoder` and `PropertyListDecoder` do the same job for plist data, against the same `Codable` conformance.

## Where did the code come from?

Look back at `User`. It declared `Codable` but implemented nothing — no `encode(to:)`, no `init(from:)`. Yet both worked.

The compiler wrote them. When every stored property of a type is itself Codable, the compiler **synthesizes** the whole conformance: the encode method, the decoding initializer, and a hidden key list you'll meet next. `Int` and `String` are Codable, so `User` qualified automatically.

Synthesis composes. Nest a Codable type inside another and everything still comes free:

```swift
struct Address: Codable {
    let city: String
}

struct User: Codable {
    let id: Int
    let name: String
    let address: Address    // Codable, so synthesis still works
}
```

That decodes JSON with a nested object, no extra code:

```json
{ "id": 7, "name": "Ada", "address": { "city": "London" } }
```

Synthesis works for structs, classes, and enums — enums with associated values encode those payloads too, under some rules about their shape. The one thing that stops it is a stored property that isn't Codable:

```swift
struct Session: Codable {          // ❌ won't compile
    let user: User
    let onExpire: () -> Void       // closures aren't Codable
}
```

One non-Codable property and synthesis fails for the whole type. Your options: make that property's type Codable, exclude it from coding (next section), or write the conformance by hand.

## CodingKeys: when JSON names don't match

Real APIs rarely match Swift naming. The server sends snake_case:

```json
{ "id": 7, "first_name": "Ada" }
```

but Swift style wants `firstName`. The mapping lives in an enum called **CodingKeys** — a `String`-raw-valued enum, nested in your type, that synthesis consults for names:

```swift
struct User: Codable {
    let id: Int
    let firstName: String

    enum CodingKeys: String, CodingKey {
        case id
        case firstName = "first_name"   // property name = JSON name
    }
}
```

Each case names a property; its raw value is the key used in the data. `id` needs no raw value because the names already match.

`CodingKeys` has a second power. Predict: what happens to `signedInAt` here?

```swift
struct User: Codable {
    let id: Int
    let firstName: String
    var signedInAt: Date? = nil

    enum CodingKeys: String, CodingKey {
        case id
        case firstName = "first_name"
        // signedInAt not listed
    }
}
```

Answer: it's excluded entirely. A property omitted from `CodingKeys` is neither encoded nor decoded — which is exactly what you want for local-only state. The catch: the property needs a default value, since `init(from:)` won't fill it.

If *every* key is just a snake_case rename, skip the enum and tell the decoder once:

```swift
let decoder = JSONDecoder()
decoder.keyDecodingStrategy = .convertFromSnakeCase   // first_name → firstName, everywhere
```

## Taking over: custom decoding

Synthesis assumes JSON that mirrors your type one-to-one. When it doesn't — a value to compute, a missing field to tolerate, nesting to flatten — you write `init(from:)` yourself.

The tool is a *container*: a keyed view into the data that you pull values out of, field by field.

```swift
struct User: Codable {
    let id: Int
    let name: String

    enum CodingKeys: String, CodingKey { case id, name }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id   = try c.decode(Int.self, forKey: .id)
        name = try c.decode(String.self, forKey: .name)
    }
}
```

This is exactly what synthesis was writing for you — open a container keyed by `CodingKeys`, decode each field by type and key. Now that it's yours, you can bend it. Tolerate a missing name:

```swift
name = try c.decodeIfPresent(String.self, forKey: .name) ?? "Anonymous"
```

`decodeIfPresent` returns `nil` instead of throwing when the key is absent or the value is `null` — pair it with `??` for a default. That one line turns "the API sometimes omits name" from a crash-report into a non-event.

The symmetric customization exists for output: implement `encode(to:)`, opening a container and encoding field by field. You can customize one direction and keep synthesis for the other — but whichever method you write, you own that direction completely, including every field.

Flattening is the classic custom-decode use case. Say the server wraps the city in a nested object but your model wants it flat:

```swift
// JSON: { "id": 7, "address": { "city": "London" } }
struct User: Decodable {
    let id: Int
    let city: String

    enum CodingKeys: String, CodingKey { case id, address }
    enum AddressKeys: String, CodingKey { case city }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        id = try c.decode(Int.self, forKey: .id)

        let addr = try c.nestedContainer(keyedBy: AddressKeys.self, forKey: .address)
        city = try addr.decode(String.self, forKey: .city)
    }
}
```

`nestedContainer(keyedBy:forKey:)` opens a container *inside* a key — you step into `address`, pull out `city`, and your Swift model never has to mirror the server's nesting.

## Heterogeneous JSON: mixed shapes in one array

The hardest common case: an array whose elements have different shapes, distinguished by a tag field:

```json
[
  { "type": "text",  "body": "hello" },
  { "type": "image", "url": "https://..." }
]
```

No single struct fits both. The Swift shape for "one of several forms" is an enum with associated values — and you write its `init(from:)` to read the tag first, then decode the matching form:

```swift
enum Message: Decodable {
    case text(String)
    case image(URL)

    enum CodingKeys: String, CodingKey { case type, body, url }

    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        let tag = try c.decode(String.self, forKey: .type)

        switch tag {
        case "text":  self = .text(try c.decode(String.self, forKey: .body))
        case "image": self = .image(try c.decode(URL.self, forKey: .url))
        default:
            throw DecodingError.dataCorruptedError(
                forKey: .type, in: c,
                debugDescription: "Unknown message type: \(tag)")
        }
    }
}

let messages = try JSONDecoder().decode([Message].self, from: data)
```

The tag field is called a *discriminator* — the one field whose value tells you which shape the rest of the object has. Decode the discriminator, switch on it, decode the right payload. The `default` case matters: servers add new types, and throwing a descriptive error beats crashing.

## Dates: the classic decoding failure

Predict: does this decode succeed?

```swift
struct Event: Decodable {
    let start: Date
}

let json = #"{"start": "2026-09-18T09:00:00Z"}"#.data(using: .utf8)!
let event = try JSONDecoder().decode(Event.self, from: json)
```

Answer: it throws. By default, `JSONDecoder` expects a `Date` to be a *number* — seconds since a reference date — not an ISO-8601 string, which is what almost every real API sends. This is the single most common Codable failure in practice.

The fix lives on the *decoder*, not the model. Coders expose **strategies** — configuration for how whole categories of values convert:

```swift
let decoder = JSONDecoder()
decoder.dateDecodingStrategy = .iso8601               // "2026-09-18T09:00:00Z" now works
decoder.keyDecodingStrategy  = .convertFromSnakeCase  // first_name → firstName
decoder.dataDecodingStrategy = .base64                // Data fields from base64 strings
```

For dates specifically the menu is: `.iso8601` for standard strings, `.secondsSince1970` or `.millisecondsSince1970` for numeric timestamps, `.formatted(someDateFormatter)` for odd fixed formats, and `.custom { ... }` when the API is truly creative. Encoders have mirror-image strategies for output. Note the design: your model stays clean — `let start: Date` — and format knowledge lives in one place, on the coder.

## When decoding fails: read the error

Decoding throws `DecodingError`, and it's unusually helpful — if you look at it. It's an enum with four cases:

- `.keyNotFound` — an expected key is missing
- `.typeMismatch` — key exists, wrong type (string where a number should be)
- `.valueNotFound` — key exists but holds `null` for a non-optional
- `.dataCorrupted` — not valid JSON at all, or a custom validation failed

Every case carries a `context` whose `codingPath` pinpoints *where* in the structure it failed:

```swift
do {
    let user = try JSONDecoder().decode(User.self, from: data)
} catch let DecodingError.typeMismatch(type, context) {
    print("expected \(type) at \(context.codingPath)")
    // e.g. expected Int at [CodingKeys(stringValue: "address"),
    //                       AddressKeys(stringValue: "zip")]
} catch let DecodingError.keyNotFound(key, context) {
    print("missing key '\(key.stringValue)' at \(context.codingPath)")
}
```

That path — "inside `address`, at `zip`" — is the difference between a five-second fix and an afternoon of println-ing raw JSON. Which is why the lazy pattern is a trap:

```swift
let user = try? JSONDecoder().decode(User.self, from: data)   // ❌ error discarded
```

`try?` converts the failure to `nil` and throws away the diagnosis. You're left knowing only "it didn't work." At minimum, log the caught error; in a real networking layer, surface it.

## Common pitfalls

- **Dates won't decode.** The default strategy expects numbers, not ISO-8601 strings. Fix: `decoder.dateDecodingStrategy = .iso8601` (or the strategy matching your API).
- **Swallowing errors with `try?`.** You lose the `codingPath` that names the exact failing field. Fix: `do`/`catch` and inspect the `DecodingError`.
- **One non-Codable stored property breaking synthesis.** The whole type stops compiling. Fix: exclude it via `CodingKeys` with a default value, or write the conformance by hand.
- **Crashing on a missing optional field.** `decode` throws on absent keys. Fix: `decodeIfPresent` with `??` for a default, or make the property optional.
- **Mirroring server nesting in your models.** Your Swift types shouldn't have to look like the API's JSON. Fix: flatten with `nestedContainer(keyedBy:forKey:)` in a custom `init(from:)`.

## Interview lens

If asked "how does Codable work?", start with the split: `Codable` is `Encodable & Decodable`, and when every stored property is itself Codable, the compiler synthesizes `CodingKeys`, `encode(to:)`, and `init(from:)` — you write nothing. Then name the two everyday tools: a `CodingKeys` enum to map mismatched JSON names (and to exclude local-only properties), or `.convertFromSnakeCase` on the decoder when it's a uniform rename.

The senior follow-ups are about the escape hatches. Be ready to sketch a custom `init(from:)` with a keyed container, mention `decodeIfPresent` plus `??` for APIs that omit fields, and `nestedContainer` for flattening. For heterogeneous arrays, describe the pattern in one sentence: decode the discriminator field first, then switch on it to decode the right associated-value case of an enum.

Two answers reliably mark experience. First: strategies live on the coder, not the model — and the fix for the ubiquitous "my dates won't decode" bug is setting `dateDecodingStrategy`, because the default expects numeric timestamps. Second: never `try?` away a decode failure — `DecodingError`'s `context.codingPath` names the exact field that failed, and saying so shows you've actually debugged a malformed response.
