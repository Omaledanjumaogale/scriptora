# Scriptora

**The enterprise AI publishing studio.** Concept → blueprint → outline → draft →
editorial → cover → EPUB/print. One governed pipeline, with a human at every gate.

Scriptora harmonizes the strongest ideas from Smithbook and seven open-source
book-production systems into a single studio: a locked story bible, twelve
specialist agents, scene-level craft protocols, market intelligence, a real
cover-design system and production-grade export.

![Scriptora landing page](docs/scriptora-landing.png)

**Live:** [scriptora.ewinproject.org](https://scriptora.ewinproject.org) ·
**Admin:** [scriptora.ewinproject.org/admin](https://scriptora.ewinproject.org/admin) ·
**Ecosystem:** [ewinproject.org/ecosystem](https://ewinproject.org/ecosystem)

> **Plan:** Enterprise, **$5,000 / year**. Unlimited books, ten seats, every
> specialist, every protocol, every export format.

---

## Run it

```bash
npm install
cp .env.example .env.local   # fill server-side keys
npm run dev
```

Open the printed URL. For a local production check:

```bash
npm run check     # svelte-check + TypeScript
npm run build     # Cloudflare Pages build
npm run preview
```

The Vite dev server emulates the Cloudflare platform in memory (`platformProxy:
{ persist: false }`), so a stale `.wrangler` SQLite lock cannot block startup.

### Demo entry

- Landing page → **Open the live demo**
- Or go directly to `/login?demo=1`

The demo signs in as **Amara Venn** at **Venn & Co. Publishing** and loads five
books, an editorial queue, agent runs, a full manuscript, a story bible, market
research, cover directions and a billed enterprise workspace.

No account, network, API key or payment is required. Demo state persists in
`localStorage` (`scriptora.workspace.v1`). Production keeps the same deterministic
fallback but treats Convex as authoritative as soon as a live session exists:

1. `StudioStore` loads local state immediately (no blank screen).
2. `/api/auth/session` resolves Google/GitHub sign-in server-side.
3. `/api/state` pulls the user's Convex `studioStates` document by workspace key.
4. If the document exists it replaces the local demo catalogue; if not, the
   current catalogue is uploaded as the new workspace seed.
5. Every edit is debounced to Convex and reflected in the admin console.

### Live sign-in

`/login` offers **Continue with Google** and **Continue with GitHub**. OAuth
codes are exchanged on the server; the browser receives only an HMAC-signed,
HttpOnly session cookie. The email form remains a local demo shortcut.

---

## What is inside

### Studio

| Area | Capability |
| --- | --- |
| Overview | Production queue, word count, quality, activity, next best action |
| Library | Search, filter, sort, create, archive |
| Book workspace | Overview, blueprint, outline, chapters, story bible, craft, market, cover, exports, runs |
| Chapter editor | Markdown manuscript, split/read view, scene plan, health, approve, scan, AI draft |
| Agent Studio | Pipeline launcher, live steps and logs, cost/token accounting, routing, human gates |
| Specialists | Twelve agents with mandates, models, protocols and guardrails |
| Analytics | Throughput, spend, quality, genre mix, protocol coverage |
| Plan & billing | $5,000 annual enterprise plan, usage, invoices, seats |
| Settings | Workspace, members, provider routing, protocol defaults, exports |

![Scriptora chapter editor](docs/scriptora-chapter.png)

### Production pipeline

`full-book`, `blueprint`, `draft`, `chapters`, `editorial`, `research`, `design`, `export`

Every run records:

- named steps with status and detail
- streaming-style log entries (`info`, `ok`, `warn`, `error`)
- model, token count, cost, progress
- human review gates that an agent cannot bypass

### Harmonized feature map

| Source | Adopted |
| --- | --- |
| **Smithbook** (observed live via REA) | Guided manuscript studio, conversational brief intake, chapter ledger, premium editorial feel, billing/onboarding flow |
| **AI-Book-Generator** | Multi-provider routing, agent mode, streaming progress, cover generation, multi-format export |
| **LibriScribe** | Specialist agents (`concept`, `outliner`, `chapter_writer`, `character`, `worldbuilding`, `editor`, `fact_checker`, `plagiarism`, `style`), narrative graph and canon invariants |
| **book-generator** | KDP market analysis, topic/comp scoring, cover pipeline, front/back matter, compile-and-validate export |
| **writing-template-for-ai** | `BOOK_BLUEPRINT.md`, genre routing, five prose protocols: AI-ism suppression, semantic gradient, Yorke dramatic architecture, character hierarchy, fractal scene architecture |
| **bookwriter** | Outline-first workflow, chapter targets, revision passes |
| **awesome-ai-book-writing** | Prompt and tooling catalog used to choose the specialist behaviors |
| **ai-book-generator** | Lightweight genre-aware generation and export patterns |

### Design system

- Dark archival canvas `#080a0e`, gold `#e0b872`, teal `#7dd3c0`
- Fraunces for display, Inter for UI, JetBrains Mono for data
- Custom cover renderer: six palettes, six motif systems, four type directions,
  front/back/spine, print-safe colors
- Responsive app shell, command palette (`⌘K`), toasts, modals, progress,
  sparklines, donuts and manuscript typography
- All UI is hand-built; no component kit or template theme

### Craft protocols

The genre router applies fiction protocols only to fiction, and swaps in
nonfiction protocols for business, self-help, essay and how-to books:

1. **AI-ism suppression** — remove stock phrasing, hedges and symmetrical
   paragraph rhythms
2. **Semantic gradient** — every scene must change the reader's understanding
3. **Yorke dramatic architecture** — desire, opposition, cost, resolution
4. **Character hierarchy** — tiered cast with want/need/wound and screen time
5. **Fractal scene architecture** — the eight-step circuit at scene and chapter
   scale
6. **Continuity invariants** — canon locks checked before export
7. **Voice anchor** — sampled style contract reapplied per chapter
8. **Human approval gates** — blueprint, continuity, cover and release

---

## Stack

| Layer | Choice |
| --- | --- |
| UI | Svelte 5 (runes), SvelteKit 2 |
| Styling | Tailwind CSS 4 via `@tailwindcss/vite` |
| State | `StudioStore` class with `$state`, `$derived`, `$effect` + localStorage |
| Backend | Convex production deployment + HTTP actions (`convex/`) |
| AI | AGNES AI `agnes-3.0-flash` via a Convex internal action |
| Email | Resend from `no-reply@ewinproject.org` |
| Auth | Google + GitHub OAuth, HMAC-signed HttpOnly sessions |
| Deploy | `@sveltejs/adapter-cloudflare` → Cloudflare Pages |
| Export | JSZip EPUB 3, print-ready HTML/PDF, Markdown, HTML, TXT, JSON, DOCX-compatible |
| Research | REA 6.4 runtime observation of smithbook.com + source inspection of seven repos |

### Live stack

| Integration | Production value |
| --- | --- |
| Studio | `https://scriptora.ewinproject.org` |
| Cloudflare Pages | project `scriptora`, branch `main` |
| Convex cloud | `https://disciplined-cuttlefish-2.eu-west-1.convex.cloud` |
| Convex HTTP actions | `https://disciplined-cuttlefish-2.eu-west-1.convex.site` |
| Google callback | `https://scriptora.ewinproject.org/api/auth/google/callback` |
| GitHub callback | `https://scriptora.ewinproject.org/api/auth/github/callback` |
| Admin console | `https://scriptora.ewinproject.org/admin` |
| Health probe | `https://scriptora.ewinproject.org/api/health` |

Server routes:

| Route | Purpose |
| --- | --- |
| `GET /api/auth/google` · `/github` | Start OAuth with signed state cookie |
| `GET /api/auth/*/callback` | Exchange code, issue session, send welcome email |
| `GET /api/auth/session` | Current live user + integration presence |
| `GET/POST /api/state` | Pull/push Convex workspace state |
| `POST /api/ai/chapter` | Authenticated AGNES generation with deterministic fallback |
| `POST /api/admin/login` | Super-admin session (`ADMIN_SESSION_SECRET`) |
| `GET /api/admin/data` | Live Convex overview + integration matrix |
| `POST /api/admin/email-test` | Resend deliverability check |
| `GET /api/health` | Pages + Convex + E-WIN hub health |

### Convex

`convex/` contains the live schema and functions for workspaces, users, books,
chapters, agent runs, activities, invites and `studioStates`. HTTP actions are
gated by `ADMIN_SESSION_SECRET` and never expose provider keys.

```bash
npx convex deploy
npx convex env set ADMIN_SESSION_SECRET '…'
npx convex env set AGNES_AI_KEY '…'
npx convex env set RESEND_API_KEY '…'
```

See [`convex/README.md`](convex/README.md) for the full list.

### Cloudflare Pages

```bash
npm run build
npx wrangler pages deploy .svelte-kit/cloudflare --project-name scriptora --branch main
```

Production environment variables live in the Pages project (production and
preview), not in the repository. `scriptora.ewinproject.org` is a proxied CNAME
to `scriptora.pages.dev`.

### E-WIN ecosystem

Scriptora is registered in the hub's application directory
(`src/lib/shared/ecosystemApplications.ts`), discovery topics, application
visuals and external platform registry. The hub links to the live studio and
the studio links back to `ewinproject.org`. Both sides intentionally keep
independent identity and billing while sharing discovery and design language.

### Security

- All provider keys stay in Convex env or Cloudflare Pages env; `.env.local` is ignored.
- Sessions are HMAC-SHA256 signed, HttpOnly, SameSite=Lax, 7 days, with a 12-hour admin session.
- OAuth uses a single-use state cookie and server-side token exchange.
- Convex HTTP actions compare bearer tokens in constant time.
- `/admin` is `noindex, nofollow`; `/api/*` and `/admin` are disallowed in `robots.txt`.
- Workspace state is capped at 8 MB per document.

---

## Project layout

```
src/
  app.css                    design tokens, components, manuscript styles
  lib/
    types.ts                 domain model
    engine.ts                deterministic concept/outline/prose/research/craft/cover
    pipeline.ts              auditable agent pipelines
    seed.ts                  demo workspace + five books
    store.svelte.ts          reactive store + local/live Convex sync
    export.ts                EPUB 3, print, Markdown, HTML
    components/              shell, covers, icons, charts, runs, modals
  server/                    env, sessions, OAuth, Convex client
  routes/
    +page.svelte             marketing site
    login/ onboarding/ admin/
    api/                     auth, state, AI, admin, health
    app/                     studio shell
      books/[id]/            book workspace
convex/                      schema, state, AI, email, HTTP actions
research/
  README.md                  evidence and source notes
  rea/                       REA observation artifacts
```

---

## Evidence and method

Smithbook is Cloudflare-protected and blocks ordinary fetches. The live product
was observed with **REA 6.4** (`rea capture-browser-scenario`) using Playwright
Chromium, capturing DOM, accessibility tree, screenshots and network/console
events for:

- `https://smithbook.com/`
- `https://writer.smithbook.com/makemybook`

Artifacts live in [`research/rea/`](research/rea). The seven repository sources
were cloned and inspected for agent architecture, prompts, protocols, export
formats and market analysis. See [`research/README.md`](research/README.md).

The app keeps a deterministic local engine so every flow remains reproducible
offline and in review. When a live session is present, Convex becomes
authoritative and chapter generation can call AGNES; if the provider fails, the
UI falls back to the deterministic engine rather than blocking the manuscript.

---

## Rights

All demo titles, characters, prose and covers are original synthetic content
created for this project. No Smithbook or repository content is reproduced.

**Scriptora** — built 2026.
