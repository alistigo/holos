import "@alistigo/claude-artifact-api";
import type { AnnotatedSnapshot } from "../domain/snapshot.js";

export class ClaudeUnavailableError extends Error {
  constructor() {
    super("window.claude is not available — this widget must run inside a Claude artifact iframe");
    this.name = "ClaudeUnavailableError";
  }
}

export async function sendAnnotation(snapshot: AnnotatedSnapshot): Promise<string> {
  if (typeof window.claude === "undefined") {
    throw new ClaudeUnavailableError();
  }

  return window.claude.complete([
    {
      type: "image",
      source: {
        type: "base64",
        media_type: "image/png",
        data: snapshot.pngBase64,
      },
    },
    {
      type: "text",
      text: snapshot.comment || "(no comment)",
    },
  ]);
}
