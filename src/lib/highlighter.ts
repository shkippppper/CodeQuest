import { createHighlighterCore, type HighlighterCore } from "shiki/core";
import { createOnigurumaEngine } from "shiki/engine/oniguruma";
import githubLight from "shiki/themes/github-light.mjs";
import githubDark from "shiki/themes/github-dark.mjs";
import swift from "shiki/langs/swift.mjs";

let promise: Promise<HighlighterCore> | null = null;

export function getHighlighter(): Promise<HighlighterCore> {
  if (!promise) {
    promise = createHighlighterCore({
      themes: [githubLight, githubDark],
      langs: [swift],
      engine: createOnigurumaEngine(import("shiki/wasm")),
    });
  }
  return promise;
}
