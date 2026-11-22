# Scriptora backend (Convex)

The studio runs in **demo mode** by default: state lives in the browser
(`localStorage`, key `scriptora.workspace.v1`) so every screen works with no
account, network or deployment.

The same domain model is expressed here for production. Once a Convex
deployment exists, set `PUBLIC_CONVEX_URL` and wire the store to these
functions.

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

## Functions

- `workspace.bootstrap` — idempotent workspace + owner creation
- `workspace.listActivities`, `workspace.logActivity`, `workspace.invite`
- `books.list`, `books.get`, `books.create`, `books.updateMeta`
- `books.createChapter`, `books.saveChapter`, `books.approveChapter`
- `runs.listByBook`, `runs.listByWorkspace`, `runs.create`, `runs.update`, `runs.appendLog`

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
npx convex deploy --cmd "npm run build"
```
