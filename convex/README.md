# Scriptora backend (Convex)

The studio has two modes:

- **Demo** — deterministic catalogue in `localStorage` (`scriptora.workspace.v1`).
- **Live** — Convex `studioStates` is authoritative once a Google/GitHub session
  exists. The browser keeps the demo catalogue visible while the live document
  is fetched; if none exists, the current catalogue is uploaded as the seed.

Deployment: `https://disciplined-cuttlefish-2.eu-west-1.convex.cloud`
HTTP actions: `https://disciplined-cuttlefish-2.eu-west-1.convex.site`

## Tables

| Table | Purpose |
| --- | --- |
| `workspaces` | Enterprise workspace, plan, seats, AI credits, renewal |
| `users` | Workspace members and roles |
| `books` | Concept, blueprint, story bible, research, craft, cover, config |
| `chapters` | Chapter ledger, scene circuits, manuscript prose |
| `agentRuns` | Pipeline steps, logs, cost, tokens, status |
| `activities` | Human-readable audit feed |
| `invites` | Seat invitations |
| `studioStates` | Full serialized `AppState` per workspace key (live studio sync) |

## Functions

- `workspace.bootstrap` — idempotent workspace + owner creation
- `workspace.listActivities`, `workspace.logActivity`, `workspace.invite`
- `books.list`, `books.get`, `books.create`, `books.updateMeta`
- `books.createChapter`, `books.saveChapter`, `books.approveChapter`
- `runs.listByBook`, `runs.listByWorkspace`, `runs.create`, `runs.update`, `runs.appendLog`
- `state.get`, `state.upsert`, `state.remove`, `state.list`, `state.overview`
- `ai.generateChapter` — AGNES `agnes-3.0-flash` internal action

## HTTP actions

All routes except `/health` require `Authorization: Bearer $ADMIN_SESSION_SECRET`.

| Route | Method | Purpose |
| --- | --- | --- |
| `/health` | GET | Capability probe |
| `/state?key=...` | GET | Read a workspace state |
| `/state` | POST | Upsert `{ workspaceKey, userEmail, state, source }` |
| `/state/delete` | POST | Remove `{ workspaceKey }` |
| `/admin/overview` | GET | Workspaces, books, words, runs, revenue, members |
| `/ai/chapter` | POST | AGNES chapter generation |
| `/email` | POST | Resend transactional email |

## Environment

```bash
npx convex env set ADMIN_SESSION_SECRET '…'
npx convex env set AGNES_AI_KEY '…'
npx convex env set AGNES_API_BASE_URL 'https://apihub.agnes-ai.com/v1'
npx convex env set AGNES_MODEL 'agnes-3.0-flash'
npx convex env set RESEND_API_KEY '…'
npx convex env set RESEND_FROM_EMAIL 'Scriptora <no-reply@ewinproject.org>'
npx convex env set SUPER_ADMIN_EMAIL '…'
npx convex env set SUPER_ADMIN_PASSWORD '…'
npx convex env set EWIN_HUB_URL 'https://ewinproject.org'
npx convex env set EWIN_PLATFORM_SLUG 'scriptora'
```

`CONVEX_DEPLOY_KEY` belongs in CI/local `.env.local` only, never in the browser.

## Local development

```bash
npx convex dev          # generates convex/_generated and pushes schema
npx convex dashboard    # inspect data
```

Call `workspace.bootstrap` once:

```json
{ "name": "Venn & Co. Publishing", "initials": "VC", "ownerName": "Amara Venn", "ownerEmail": "amara@venn.co" }
```

## Deploy

```bash
npx convex deploy
```
