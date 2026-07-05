## The problem: turning models into JSON and back, safely

Nearly every app talks to an API: models in, JSON out, JSON in, models out. Hand-writing that serialization is tedious and fragile. **`Codable`** is Swift's built-in, **type-safe** archiving system: conform your type and the compiler **synthesizes** the encode/decode code, and a `JSONEncoder`/`JSONDecoder` (or `PropertyListEncoder`) does the conversion — with compile-time checking and clear runtime errors.

## `Encodable` / `Decodable`

`Codable` is a typealias for **`Encodable & Decodable`**:

- **`Encodable`** — can turn itself into external data (`encode(to:)`).
- **`Decodable`** — can create itself from external data (`init(from:)`).

Conform to `Codable` and use the coders:

```swift
struct User: Codable { let id: Int; let name: String }

let data = try JSONEncoder().encode(user)                 // model → Data (JSON)
let user = try JSONDecoder().decode(User.self, from: data) // Data → model
```

`decode` is a **throwing**, type-directed call: you tell it the type, it validates and builds it (or throws).

## Automatic synthesis

The magic: if **every stored property** of a type is itself `Codable`, the compiler **synthesizes** `CodingKeys`, `encode(to:)`, and `init(from:)` for you — no boilerplate. This works for structs, enums (with some rules), and classes. Add a non-`Codable` stored property and synthesis fails until you handle it (exclude it or make it codable).

## `CodingKeys`

To map between Swift property names and different JSON keys, define a **`CodingKeys`** enum (a `String`-raw-valued enum the synthesis uses):

```swift
struct User: Codable {
    let id: Int
    let firstName: String
    enum CodingKeys: String, CodingKey {
        case id
        case firstName = "first_name"   // JSON uses snake_case
    }
}
```

Every case listed is encoded/decoded; **omitting** a property from `CodingKeys` excludes it (useful for computed/local-only fields). Alternatively, set the decoder's **`keyDecodingStrategy = .convertFromSnakeCase`** to auto-map `first_name` → `firstName` without a `CodingKeys` enum.

## Custom encoding/decoding

When the JSON doesn't map 1:1 (flattening nesting, computing a value, tolerating missing fields), implement the methods yourself using **keyed containers**:

```swift
init(from decoder: Decoder) throws {
    let c = try decoder.container(keyedBy: CodingKeys.self)
    id = try c.decode(Int.self, forKey: .id)
    name = try c.decodeIfPresent(String.self, forKey: .name) ?? "Anonymous"  // tolerate missing
}
```

`decodeIfPresent` returns nil (rather than throwing) for a missing/null key. You can mix synthesized and custom — but writing one of `init(from:)`/`encode(to:)` means you own that direction.

## Nested & heterogeneous JSON

- **Nested** objects decode naturally if the nested type is also `Codable` (`struct User { let address: Address }`). For flattening, use **nested containers** (`nestedContainer(keyedBy:forKey:)`).
- **Heterogeneous** arrays (objects of different shapes discriminated by a `type` field) need a manual step: decode the discriminator, then decode the right concrete type — often via an enum with associated values whose `init(from:)` switches on the tag.

## Dates & strategies

`JSONDecoder`/`JSONEncoder` expose **strategies** for common formats, set on the coder (not the model):

```swift
let decoder = JSONDecoder()
decoder.dateDecodingStrategy = .iso8601             // or .secondsSince1970, .formatted(df), .custom
decoder.keyDecodingStrategy = .convertFromSnakeCase
decoder.dataDecodingStrategy = .base64
```

Choosing the right `dateDecodingStrategy` is the fix for the extremely common "my dates won't decode" problem — the default expects a specific numeric format, not ISO-8601 strings.

## Error handling

`decode` throws a **`DecodingError`** with a precise case — `.keyNotFound`, `.typeMismatch`, `.valueNotFound`, `.dataCorrupted` — each carrying a **`context`** with a **coding path** pointing to exactly where it failed. Catch and inspect it (rather than ignoring with `try?`) to debug malformed responses:

```swift
catch let DecodingError.typeMismatch(type, context) {
    print("type mismatch for \(type) at \(context.codingPath)")
}
```

## The interview lens

Explain `Codable = Encodable & Decodable`, with **automatic synthesis** when all stored properties are `Codable` — the compiler generates `CodingKeys`/`encode(to:)`/`init(from:)`. Map differing JSON names via a **`CodingKeys`** enum (or the decoder's `.convertFromSnakeCase` strategy), and **omit** a property from `CodingKeys` to exclude it.

Senior signals: **custom `init(from:)`/`encode(to:)`** with keyed containers for non-1:1 JSON, **`decodeIfPresent`** to tolerate missing fields, handling **heterogeneous** JSON via a discriminator + enum, that **date/key/data strategies live on the coder** (the classic "dates won't decode" fix is `dateDecodingStrategy = .iso8601`), and that decode throws a **`DecodingError`** whose `context.codingPath` pinpoints the failure — so don't swallow it with `try?`.
