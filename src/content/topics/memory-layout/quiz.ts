import type { Question } from "../../types";

const quiz: Question[] = [
  {
    id: "stack-vs-heap",
    type: "mcq",
    prompt: "What's the key difference between stack and heap allocation?",
    options: [
      "Stack is cheap and automatic (freed on scope exit); heap is more expensive and, in Swift, tied to ARC",
      "Stack is shared across threads; heap is per-thread",
      "Heap allocation is always faster",
      "They are the same region",
    ],
    answer: 0,
    explanation:
      "The stack grows/shrinks with calls — allocation is a pointer bump, freed automatically. The heap holds dynamic/long-lived objects, costs more to allocate, and in Swift is reference-counted.",
  },
  {
    id: "value-inline",
    type: "mcq",
    prompt: "Where does a local struct value live?",
    options: [
      "Inline where it's declared — on the stack for a local variable",
      "Always on the heap",
      "In a global table",
      "In the CPU registers only",
    ],
    answer: 0,
    explanation:
      "Value types are stored inline (stack for locals, or within their containing object). Class instances live on the heap; the variable holds a reference to them.",
  },
  {
    id: "class-heap",
    type: "mcq",
    prompt: "Where does a class instance live, and what does the variable hold?",
    options: [
      "The instance is on the heap; the variable holds a reference (pointer) to it",
      "The instance is on the stack; the variable holds a copy",
      "Both instance and variable are in registers",
      "Class instances aren't stored anywhere",
    ],
    answer: 0,
    explanation:
      "A class instance is always heap-allocated and reference-counted. The variable is a pointer to it (the pointer itself may sit on the stack).",
  },
  {
    id: "stride-fill",
    type: "fill",
    prompt: "Arrays advance from one element to the next by `MemoryLayout<T>.___` (which accounts for alignment padding), not size.",
    answers: ["stride"],
    hint: "size <= this, due to padding.",
    explanation:
      "`stride` is the element-to-element distance (size rounded up for alignment). Arrays use stride, so `stride >= size` because of padding.",
  },
  {
    id: "optional-int-size",
    type: "predict",
    prompt: "What is `MemoryLayout<Int?>.size` on a 64-bit platform?",
    code: `MemoryLayout<Int>.size   // 8
MemoryLayout<Int?>.size  // ?`,
    options: ["9", "8", "16", "1"],
    answer: 0,
    explanation:
      "`Int` uses all 8 bytes with no spare bit pattern for `nil`, so `Optional<Int>` adds a 1-byte discriminator → 9. (For reference types, the spare all-zero pointer encodes `.none`, so `Optional<Class>` stays pointer-sized.)",
  },
  {
    id: "layout-truths-multi",
    type: "multi",
    prompt: "Select **all** true statements about memory layout.",
    options: [
      "`MemoryLayout<T>.stride` can be larger than `.size` due to padding",
      "A reference type reports pointer size for `MemoryLayout.size`",
      "Alignment can cause padding between struct fields",
      "Value types can never involve heap storage",
    ],
    answers: [0, 1, 2],
    explanation:
      "Stride≥size, pointer-sized references, and alignment padding are correct. A value type containing a class or a stdlib collection **does** have heap-allocated storage (option 3 is false).",
  },
  {
    id: "existential-box-senior",
    type: "predict",
    prompt: "🧠 Trick question — why can `let x: any Shape = HugeStruct()` be slower than using a generic?",
    code: `struct HugeStruct: Shape { /* many stored fields */ }
let x: any Shape = HugeStruct()`,
    options: [
      "If the value is too large for the existential's inline buffer, it's heap-boxed — a hidden allocation plus indirection and dynamic dispatch",
      "any is always the same speed as generics",
      "HugeStruct can't be a Shape",
      "It won't compile",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "An `any P` stores small values inline in a fixed-size existential container, but a value larger than that buffer is **boxed on the heap** (the container holds a pointer), adding an allocation and indirection — on top of witness-table dynamic dispatch. A generic or `some P` keeps the concrete type and stores it inline, avoiding the box.",
  },
  {
    id: "field-order-senior",
    type: "predict",
    prompt: "🧠 Why can two structs with the same fields in different order have different sizes?",
    code: `struct A { var a: Bool; var b: Int64; var c: Bool }
struct B { var b: Int64; var a: Bool; var c: Bool }`,
    options: [
      "Alignment padding: poor field ordering wastes bytes; grouping same-sized fields reduces padding",
      "Field order never affects size",
      "Bool takes 8 bytes",
      "Structs are always 24 bytes",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "Each field must satisfy its alignment, so the compiler inserts padding. Interleaving small and large fields (like `Bool, Int64, Bool`) forces more padding than grouping them (`Int64, Bool, Bool`). Reordering can shrink a struct — relevant for cache efficiency and C interop.",
  },
  {
    id: "size-vs-stride-senior",
    type: "mcq",
    prompt: "Why does the standard library use `stride` (not `size`) for array element spacing?",
    options: [
      "Elements must be aligned, so each occupies `stride` (size padded up to alignment) to keep the next element correctly aligned",
      "stride is smaller and saves memory",
      "size is only valid for classes",
      "stride includes the ARC header",
    ],
    answer: 0,
    difficulty: "senior",
    explanation:
      "If elements were packed by `size`, subsequent elements could be misaligned. `stride` pads each element up to its alignment so every element starts on a valid boundary — which is why `stride >= size`.",
  },
  {
    id: "memory-layout-flashcard",
    type: "flashcard",
    prompt:
      "Explain stack vs heap, MemoryLayout size/stride/alignment, and existential boxing. Answer aloud, then reveal.",
    modelAnswer:
      "**Stack** allocation is cheap and automatic (freed on scope exit); the **heap** is for dynamic/long-lived objects — costlier to allocate and, in Swift, reference-counted (ARC). **Value types** are stored **inline** (stack for locals, or within their container), while **class instances live on the heap** and the variable holds a **reference** — so heap allocation + ARC + indirection make reference types generally costlier than small value types (caveat: a value type containing a class/collection still has heap storage). **`MemoryLayout<T>`** reports **`size`** (bytes used), **`stride`** (element-to-element distance in an array — `size` padded up for alignment, so `stride >= size`; arrays use stride), and **`alignment`** (required starting-address boundary); e.g. `MemoryLayout<Int?>.size` is 9 (Int has no spare bit). **Existential boxing**: `any P` stores the value in a fixed-size existential container — **inline** if it fits, but **heap-boxed** if too large — plus type metadata and a witness table, adding allocation, indirection, and dynamic dispatch. That's the concrete memory reason `any` can be slower than a generic or `some P`, which keep the concrete type inline. **Alignment/padding** also means struct **field order can change size** (group same-sized fields to reduce padding).",
    keyPoints: [
      "Stack = cheap/automatic; heap = costlier + ARC + indirection",
      "Value types inline (stack); class instances on heap (you hold a reference)",
      "MemoryLayout: size vs stride (arrays use stride; stride≥size) vs alignment",
      "Existential any P boxes large values on the heap (+metadata+witness table)",
      "Alignment padding → field order can affect struct size",
    ],
    explanation:
      "Senior answers cover size-vs-stride, existential boxing as the memory reason any is slower than some/generics, and alignment/field-order effects.",
  },
];

export default quiz;
