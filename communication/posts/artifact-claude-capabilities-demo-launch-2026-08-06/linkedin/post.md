---
status: draft
channel: linkedin
createdAt: 2026-08-06
publishedAt:
url:
attachment:
---

Most people think Claude artifacts are just HTML with no backend.

They have 5 live APIs.

I spent months building on top of them before I realized there was no single place to see what was actually available. No interactive reference. No "try it now." Just docs.

So I built one.

Here is what the inject-script gives every Claude artifact iframe:

`window.storage`
Read, write, delete key-value pairs. Private namespace scoped to your artifact, or a shared namespace across the conversation. Data persists across sessions.

`window.claude.complete()`
Call Claude from inside Claude. Type a prompt in the artifact, get a response back. The artifact can reason about its own output.

`URL.createObjectURL`
Generate a Blob in JavaScript, trigger a real file download. Claude intercepts `blob-request://` URLs and routes the file to your desktop.

`window.fetch`
HTTP requests from a sandboxed iframe, via a network proxy. I ran `GET https://httpbin.org/get` this morning with zero CORS issues.

`window.open`
Link clicks and programmatic navigation both work. The inject-script intercepts and opens in the parent frame.

I packaged all 5 into an interactive demo: `@alistigo/artifact-claude-capabilities-demo`

One script tag. No build step. No account. Paste the config into any Claude conversation and every API becomes interactive immediately.

Which Claude artifact API would you actually use first?

(npm + CDN link in the first comment)

<!-- Draft notes
Formula: F9 Curiosity-Gap Teaser — hook claims hidden capability, reveals it methodically
Characters: ~1,065 | Words: ~212
Audit: no em-dashes, no "game-changing", no "leverage", no "deep dive"
Outbound links: npm + CDN link goes in first comment to avoid reach penalty
Posting window: Tue–Thu 7:30–9:00 AM CET
-->
