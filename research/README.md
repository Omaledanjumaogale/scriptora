# Research notes

## Live observation (REA 6.4)

Smithbook is behind Cloudflare and rejects ordinary HTML fetches. I used the
installed REA runtime observer:

```bash
rea capture-browser-scenario --input-json <scenario.json>
```

Playwright Chromium (`ms-playwright/chromium-1248/chrome-win64/chrome.exe`) in
launch mode, with:

- `capture.at_end`: screenshot, DOM, accessibility, URL, storage
- `capture.events`: console, page errors, network, request failures
- actions: `goto`, scroll, wait

Captured targets:

| Target | Artifact | Result |
| --- | --- | --- |
| `https://smithbook.com/` | `smithbook-*.{json,png,html,txt}` | 808 network/console events, full DOM (337 KB), accessibility tree, screenshot |
| `https://writer.smithbook.com/makemybook` | `writer-*.{json,png,html,txt}` | screenshot, DOM, accessibility, URL, console |

REA returned `cleanup_incomplete` after capture but preserved a valid
`partial_observation`; all UI evidence was retained. The marketing site showed a
guided book-production pitch, testimonial embed, pricing and a "make my book"
funnel. The writer app exposed a conversational intake assistant ("Alex") and a
manuscript workspace. Those flows informed the onboarding, brief intake,
chapter ledger and editorial pacing in Scriptora.

Files:

- `rea/smithbook.png` — above-the-fold marketing capture
- `rea/smithbook-dom.html` — rendered DOM
- `rea/smithbook-a11y.txt` — accessibility tree
- `rea/smithbook-evidence.json` — full event envelope
- `rea/writer.png`, `rea/writer-dom.html`, `rea/writer-a11y.txt`, `rea/writer-evidence.json`

## Source repositories inspected

Cloned under `repos/` (gitignored) and read for architecture, prompts and export
behavior:

1. **AI-Book-Generator / ai-book-generator** — multi-provider routing, agent
   mode, streaming, cover generation, multi-format export.
2. **awesome-ai-book-writing** — catalog of book-writing prompts, tools and
   workflows.
3. **book-generator** — KDP market/topic analysis, cover pipeline, front/back
   matter, compile script, validation.
4. **bookwriter** — outline-first generation, chapter targets, revision passes.
5. **libriscribe** — specialist agent set, narrative graph, canon invariants,
   research, editing and fact-checking.
6. **writing-template-for-ai** — `BOOK_BLUEPRINT.md`, genre routing and five
   prose protocols (AI-ism suppression, semantic gradient, Yorke architecture,
   character hierarchy, fractal scene architecture).
7. **book-generator / other export scripts** — EPUB/PDF assembly conventions.

## Synthesis decisions

- One **governed pipeline** rather than a prompt box: stage gates, run logs,
  model routing, cost caps, audit feed.
- A **story bible + canon invariants** as the spine; every chapter is audited
  against it before export.
- **Genre routing**: fiction protocols only for fiction; nonfiction gets
  practice/evidence protocols.
- **Real deliverables**: EPUB 3, print HTML/PDF, Markdown, HTML, TXT, JSON.
- **Human authority**: blueprint, high-severity continuity, cover and release
  cannot be approved by an agent.
- **Enterprise packaging**: $5,000/year plan, ten seats, unlimited books,
  provider routing and transparent spend.

## Limitations

- The demo engine is deterministic and local. It does not call an LLM.
- Convex is schema-ready but not deployed; the demo persists to localStorage.
- Smithbook screenshots are reference evidence only; no content is copied.
