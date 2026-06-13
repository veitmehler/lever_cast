# Phase 6 — File decomposition & repo hygiene

> High-churn, **judgment-heavy**, and **weakly validated by automated gates** (UI
> behavior is verified by clicking through, not by typecheck). Do it in a fresh
> session, **one screen per PR**, with manual smoke-testing after each. The plan's
> own guidance: do this last so it doesn't collide with the security/structural work.

## Status (updated 2026-06-13)

| File | Lines | Status |
|---|---|---|
| `apps/web/src/app/(protected)/settings/page.tsx` | ~~2515~~ → ~58 | ✅ **Done** — PR #23, merged to prod 2026-06-12 |
| `apps/web/src/app/(protected)/workflow/[jobId]/page.tsx` | ~~2083~~ → ~140 | ✅ **Done** — PR #27, merged to prod 2026-06-13 |
| `apps/web/src/components/IdeaCapture.tsx` | ~~1298~~ → 1 | ✅ **Done** — PR #31, merged to prod 2026-06-13 (re-export → `features/idea-capture/`) |
| `apps/web/src/app/(protected)/dashboard/page.tsx` | ~~1249~~ → 38 | 🔄 **In review** — decomposition into `features/dashboard/` (`useDashboard` hook + 4 sections), web-only |
| `apps/web/src/app/(protected)/posts/[id]/page.tsx` | 1229 | pending |
| `apps/web/src/app/api/social/[platform]/callback/route.ts` | 1059 | pending |

(Also large, secondary candidates: `apps/api/src/article-pipeline/enrichment/index.ts`
~966, `apps/api/src/routes/articles.ts` ~872.)

**Follow-on PRs that rode on the workflow decomposition (#27)** — these were
bug-fix/feature PRs the user surfaced while smoke-testing, NOT part of the
decomposition itself, but they touched the same screens and are now on prod:
- **PR #28** — `api-proxy.ts` was silently dropping ALL query strings
  (`request.nextUrl.search` now forwarded — status-tab filtering & pagination
  were broken on every proxied GET); workflow list `ProgressBar` denominator
  12 → `TOTAL_PIPELINE_STEPS` (25); list shows "Processing" badge + bar during
  Phase B (`completed` & step ≥ 13) and enrichment (`approved`).
- **PR #29** — list endpoint `status=approved` also matches Phase B; virtual
  `status=social_active` + a "Social Posts" tab (after Published) listing
  articles with an in-flight social set (pending/processing/ready/scheduling);
  3-state row chip; `updateGenerationProgress()` advances run `completedSpecs`
  after EACH spec (was only finalized at the end → counter sat at 0/12).
- **PR #30** — F6/video-post GHL dispatch fix (`buildGhlMediaArray`): a video
  post sends ONLY the video, never the carousel slides it carries for S6 reuse.

These prove the pattern: do the verbatim decomposition first, ship it, then any
behavior bugs the user notices become small separate PRs — don't fold fixes into
the "strictly behavior-preserving" decomposition PR.

**Follow-on PR that rode on the IdeaCapture decomposition (#31)** — bundle of 6
smoke-surfaced fixes, all on prod 2026-06-13:
- **PR #32** — (1) voice dictation `network` message now names the real cause
  (Chromium + Google speech backend; Brave disables it). (2) Image library
  excludes text-bearing social assets: `media` list endpoint default/`all` view
  `notIn` `carousel_slide`/`quote_card`/`pitch_story`/`social_video`/`diagram`,
  and the Image Library page's "Diagrams" tab removed. (3) Image-model dropdown
  was always empty — `/api/ai/models/[provider]` returned 404 when the user had
  no *personal* key, but image gen uses a *system* key and fal's list is static;
  image providers now skip the per-user-key requirement. (4) That route also
  eagerly decrypted ALL user keys and 500'd if any failed — now decrypts only
  the requested provider's key, in try/catch. (5) **Image prompt bug**: the
  modal required a prompt but discarded it (sent `postContent`, server re-LLM'd
  it). Now the modal sends the user's `prompt` and the server uses it VERBATIM
  (+ optional style), logging/returning `promptSource`. (6) `/api/api-keys`
  graceful-degrade (one undecryptable key no longer 500s the whole list →
  `(unable to decrypt)` marker). Plus a client-only cold-start progress UX in
  the image modal (escalating message + elapsed seconds; a Fal cold start can
  take ~3 min and looked like a hang).

**Local-dev gotcha discovered during #32 smoke:** the local `apps/web/.env`
(symlink → root `.env`) had an **empty `ENCRYPTION_KEY`**, so local Next routes
couldn't decrypt any staging-stored per-user key → 500s on `/api/api-keys`,
LLM model lists, etc. Fixed by setting the staging `ENCRYPTION_KEY` in the local
`.env` (gitignored; necessary since local dev points at the staging DB). System
keys (fal-ai etc.) were never affected — those decrypt on staging-**api**.

## The pattern that worked for settings (PR #23) — reuse it

1. **Read the whole file first**; map cohesive sections and the state-sharing
   boundaries between them before writing anything.
2. Split into `apps/web/src/features/<screen>/`:
   - **Domain hooks** owning state + handlers + effects (settings got
     `useSettingsData` + `useSocialConnections`). Keep state that is loaded by a
     single combined fetch in ONE hook so network behavior is unchanged.
     **Hook call order in the page must preserve the original effect order**
     (effects run in hook-call order, then definition order).
   - **Section components** taking the whole hook-result object as a single
     prop (`{ settings }: { settings: SettingsData }` with
     `export type SettingsData = ReturnType<typeof useSettingsData>`), then
     destructuring at the top. This avoids 40-line prop lists and keeps the
     JSX body verbatim.
   - Constants/types into `constants.ts` / `types.ts`.
3. **Move code verbatim** — same strings, same classNames, same comments. Only
   permitted change class: type-level adjustments forced by `.ts` vs `.tsx`
   (e.g. `React.ChangeEvent` → imported `ChangeEvent`).
4. **Mechanical completeness check** before committing (caught nothing missing
   in PR #23, but cheap insurance):
   ```sh
   git show HEAD:<old-file> | grep -oE '[A-Za-z_][A-Za-z0-9_]*' | sort -u > /tmp/old.txt
   cat <new files...> | grep -oE '[A-Za-z_][A-Za-z0-9_]*' | sort -u > /tmp/new.txt
   comm -23 /tmp/old.txt /tmp/new.txt   # should list only intentional removals
   ```
   Repeat with `'[^']+'` and `"[^"]+"` literals (include `.ts` files in the cat!).
5. A sibling modal/overlay can move INTO its section as a fragment — DOM output
   is identical under a `space-y-*` parent because fragments flatten.

## Validation workflow (per PR)

1. `pnpm --filter @socioply/web typecheck && lint && build` + `test`.
   **Do NOT run `next build` while the local dev server is running** — they share
   `.next` and the build wipes the dev server's chunks (breaks the user's browser
   with 404s until dev restart).
2. Push branch → PR. CI `verify` + **Vercel – socioply** check must pass; the
   `lever-cast`, `lever-cast-7rhk`, `social-calendar` Vercel checks are stale
   projects that chronically fail — ignore.
3. Staging deploy only matters if api/packages files changed (deploy-api has a
   paths filter; web-only PRs skip it — same on prod).
4. **Manual smoke is the real gate** (no component tests for these pages).
   Vercel *preview URLs* are NOT smoke-testable (prod Clerk key is domain-locked
   → blank sign-in; scoping pk_test to the Preview env in the Vercel dashboard is
   still TODO). Instead: the user smoke-tests on **localhost:3000**, which is
   permanently wired to the STAGING stack (staging DB + staging-api +
   matching test-instance Clerk). Their dev-account user is
   `cmqaxcfnq0000c921et7wjn21` (role=admin on staging).
5. Merge with `gh pr merge N --merge --delete-branch`. After merge, verify prod:
   web via Vercel (note: GH deployments record main-branch socioply deploys as
   "**Preview – socioply**" — that IS the prod deploy, not an error), api/worker
   via the droplet checks in memory.

## Environment cautions (learned the hard way on 2026-06-12)

- **Container recreates kill in-flight jobs.** The article pipeline runs
  in-process in the api container; social-generate runs on the worker. Never
  recreate staging containers while the user has a workflow running. Recovery:
  article job → reset `status='pending'` then insert pgboss `article-pipeline`
  job `{"jobId":...}`; orphaned pgboss `active` job → `set state='retry',
  start_after=now()`.
- **Connection budget is tight** (25-slot cluster, prod ~9 + staging ≤8 + local 2).
  Staging caps live in `/opt/socioply-staging/.env.staging`
  (`connection_limit=2`, `PGBOSS_MAX_CONNECTIONS=2`). Durable fix still open:
  DO PgBouncer pool for `socioply_staging` (B4) — do this FIRST in the next
  session if staging will be used.
- Keep the **staging worker stopped** when idle
  (`cd /opt/socioply-staging && docker compose stop worker`).

## Per-file notes for the remaining screens

- `workflow/[jobId]/page.tsx` (2083) — ✅ done, PR #27.
- `IdeaCapture.tsx` (1298) — ✅ done, PR #31 (+ #32 follow-ons). Pattern used:
  props-driven `useIdeaCapture` hook threading parent callbacks/seed-props,
  `types.ts` for the `SpeechRecognition*` browser globals, 4 section components,
  1-line re-export to keep the dashboard import stable.
- `dashboard/page.tsx` (1249) — **NEXT (Step 4). Surveyed 2026-06-13:**
  - `export default function DashboardPage()`, `'use client'`. It is the **parent
    that renders `IdeaCapture`** (line ~975) and `NewArticleForm` (~964),
    switched by `dashMode` (`DashboardMode` = `social_only` | `article`). So this
    is the screen that OWNS the props it passes down to the just-decomposed
    IdeaCapture (`onGenerate`, `onImageAttached`, `onMediaAssetsReady`,
    `onPostTypeChange`, `postType`, `carouselImages`, `initialIdea`/`rawIdea`).
  - **Handler-heavy, NOT effect/polling-heavy** — ~10 `useState`, **no
    `useEffect`** (closer to settings risk than workflow). The bulk is ~8 large
    async handlers driving the post lifecycle: `handleGenerate` (idea →
    `/api/posts` + `/api/drafts`), `handleSaveDraft`, `handleRegenerate`,
    `handleContentChange`, `handleSchedule`, `handlePublish`,
    `handleBulkPublishAll`, `handleBulkScheduleAll`, plus `getMediaForPlatform`.
  - State that threads widely: `generatedContent` (drives the per-platform
    previews), `actualSelectedPlatforms`, `postType` + `carouselImages` (passed
    into IdeaCapture), `rawIdea`, `dashMode`, plus modal toggles
    (`showApiKeyModal`, `showBulkScheduleModal`, `isBulkPublishing/Scheduling`).
  - Suggested split: a `useDashboard` (or `usePostGeneration`) domain hook owning
    that state + the 8 handlers (return as one `dashboard` object), and section
    components for: the mode toggle, the input switch (IdeaCapture vs
    `NewArticleForm`), the **6 `PlatformPreview` cards** (one per platform — prime
    candidate for a `.map`), the action bar (save/schedule/publish/bulk), and the
    `ScheduleModal` / `ApiKeyRequiredModal` / bulk-schedule modal. No effect-order
    concern since there are no effects.
  - Validation: web-only (drafts/posts routes already exist) → `deploy-api`
    skips. Manual smoke on localhost:3000: generate from an idea, edit a
    platform's content, regenerate one, schedule one, publish one, and bulk
    publish/schedule; also flip `dashMode` to the article form.
- `posts/[id]/page.tsx` (1229): editor-heavy (TipTap) — keep editor setup in one
  hook; editor instances must not be re-created by the split (referential
  stability of extensions/config).
- `social/[platform]/callback/route.ts` (1059): **server route** — decompose by
  extracting per-platform handlers into modules (e.g.
  `features/social-callbacks/` or `app/api/social/_handlers/<platform>.ts`).
  Pure control-flow split; no DOM concerns, so this one is the safest and can
  be validated by the existing OAuth flows on staging.

## Repo hygiene (low-risk, can be one small PR)

- Move the ~12 uppercase root `*.md` setup/fix docs into `.documentation/`
  (which already exists). Keep `README.md` at root.
- Archive or delete the completed one-off `scripts/*.js|*.ts` migration scripts
  (e.g. `add-*.js`, `fix-*.js`) — several still import the deleted
  `@/lib/prisma` path and are already broken/excluded from typecheck. Keep
  anything still referenced by a package script.
- ~~Prod `DIRECT_URL` malformed `sslmode=r>`~~ — already fixed 2026-06-12 during
  the droplet env-file cleanup.

## Risk

Low per-PR if strictly behavior-preserving, but **high churn** and **manual-only
validation** — hence one screen per PR and fresh attention.
