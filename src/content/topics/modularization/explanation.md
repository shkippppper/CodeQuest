## The problem: one giant target

A single app target that holds every file has real costs at scale: **any change recompiles a lot** (slow builds), **nothing enforces boundaries** (any file can import any other, so architecture erodes), and **teams step on each other** in the same target. **Modularization** splits the app into multiple modules — usually Swift Package Manager (SPM) packages or framework targets — each with a clear responsibility and an explicit public API.

## Why modularize

- **Build times** — changing one module only recompiles that module and its dependents, not the world. Incremental builds get dramatically faster.
- **Enforced boundaries** — code in module B can only use module A's **`public`** API; `internal` stays hidden. Access control now enforces architecture at the compiler level.
- **Team scalability** — teams own modules and work in parallel with fewer conflicts.
- **Reusability & testing** — a module can be built, tested, and even run (in a sample app) in isolation.

## Feature modules

The common split is by **feature** plus shared **core** modules:

```
App                     (thin shell: wiring / composition root)
 ├─ Features
 │   ├─ Profile         (a feature module)
 │   ├─ Feed
 │   └─ Settings
 ├─ Core
 │   ├─ Networking      (shared infrastructure)
 │   ├─ DesignSystem
 │   └─ Models
```

The **App** target becomes a thin shell that just composes features together; each **feature module** is self-contained; **core modules** hold shared infrastructure that features depend on. Features generally **don't** depend on each other directly — they communicate through abstractions defined in a shared module.

## SPM packages

Swift Package Manager is the modern tool: each module is a **target** in a `Package.swift`, declaring its dependencies and products.

```swift
// Package.swift (sketch)
.target(name: "Profile", dependencies: ["Networking", "DesignSystem"])
.target(name: "Networking", dependencies: [])
.testTarget(name: "ProfileTests", dependencies: ["Profile"])
```

Local packages keep everything in the repo; you can also split into separate repos for larger orgs. SPM makes the dependency graph **explicit and compiler-checked** — a module can only use what it declares.

## Public/internal boundaries

Modularization gives **access control real teeth**. Inside one app target, `internal` (the default) spans the whole app, so nothing is truly hidden. Across modules, `internal` is confined to its module — only **`public`** (or `open`) is visible to consumers. So you deliberately design a small **public API** per module and keep implementation `internal`. This is what actually enforces "don't reach into another feature's internals."

## Build-time impact

The build wins are real but come with nuance:

- **Incremental builds** improve because edits are localized to a module and its dependents.
- **Clean builds** can get *slightly* slower (more targets, linking overhead), but incremental (the common case) wins.
- **Over-modularization** hurts: too many tiny modules add wiring, cross-module type mapping, and their own overhead. Aim for modules that are cohesive units, not one-file packages.

## Dependency graphs

The health of a modular app is its **dependency graph**. Keep it a **DAG (directed acyclic graph)** — no cycles. **Circular dependencies between modules won't link** (and signal tangled design). Two rules keep it clean:

- **Depend on abstractions across features**: if Feed needs to open a Profile, don't import the Profile module — depend on a protocol in a shared "interfaces" module that Profile implements, wired at the app level. This avoids feature↔feature coupling.
- **Point dependencies toward stable core modules**, never from core back up to features.

## The interview lens

Lead with the *why*: modularization improves **incremental build times** (recompile only what changed), **enforces boundaries** via cross-module access control (only `public` is visible, so `internal` implementation is truly hidden), and enables **parallel team work**. Describe the typical shape: a **thin App shell** composing **feature modules** on top of shared **core modules**, using **SPM** targets.

Senior depth: keep the **dependency graph acyclic** — **circular module dependencies don't link** — and avoid feature↔feature coupling by **depending on abstractions** (protocol in a shared module, implementation injected at the composition root). Give the honest caveat: **over-modularization** (too many tiny modules) adds overhead and can slow clean builds, so modularize into cohesive units, not for its own sake.
