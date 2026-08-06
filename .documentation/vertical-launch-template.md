# Launching a New Vertical — The Template

**Written while launching vertical #2 (`azavea`, 2026-08-05) — every step
below was actually performed; friction notes are real.** The platform's
scaling law (locked decision): **pipelines are invariant — a vertical is
subdomain + data.** If a prospective vertical seems to need a pipeline or
structural change, it is either expressible as prompt copy or it is not a
vertical we launch.

Two knobs, deliberately distinct:
- **`Account.vertical`** — the platform vertical (prompt set, subdomain
  family). Set at provisioning. Default `'chiro'`.
- **`BrandSettings.industry`** — intra-vertical flavor (chiro vs osteo can
  share a vertical; their industry differs).

Near-verticals that share the health-content DNA (osteo, physio, massage)
should usually live INSIDE the chiro vertical: brand steering + at most a few
prompt overrides, same snapshot family. A new vertical is for audiences the
existing editorial layer genuinely doesn't fit.

---

## The checklist

### 1 · Subdomain (branding — infra stays singular)
- [ ] Add `<vertical>.omniply.io` as a domain on the EXISTING Vercel project
      (no new project, ever) + DNS CNAME.
- [ ] Add the host to `HOST_VERTICALS` in `apps/web/src/middleware.ts`.

### 2 · Account + brand
- [ ] Account row: `vertical: '<v>'` (+ `billingExempt` for internal/comp).
      Provisioning path for PAID verticals: the checkout/auto-provision flow
      must stamp `vertical` (TODO the day a second commercial vertical
      exists — today auto-provision implies chiro).
- [ ] Owner user + BrandSettings: `organizationName`, `businessDescription`,
      `who` (THE most load-bearing field — every audience-aware prompt reads
      it), `articleGoal`, `industry`, `specializations`,
      `schemaArticleType` (NOT a health type for non-health content),
      `organizationCountryCode`, palette/logo fields.
- [ ] WordPress connection (site URL + username + application password,
      encrypted with the platform key; `defaultStatus: 'draft'` until
      trusted). Verify FROM the API container: decrypt + authenticated
      `GET /wp-json/wp/v2/users/me` (catches key mismatches early — we hit
      exactly this class of issue with a locally-encrypted secret once).

### 3 · Prompt seed pack (the editorial core)
- [ ] `packages/db/prisma/verticals/<v>-prompts.ts` + targeted seeder
      `packages/db/scripts/seed-<v>-prompts.ts` (upsert by
      `(stepNumber, vertical)`, `update: {}`; FORCE=1 pushes copy updates).
- [ ] Override ONLY where the default's framing misfits. For `azavea` (B2B
      essays) that was SIX rows: 0 title, 5 intro, 6 FAQ-audience, 9 writer,
      15 image aesthetic, 18 disclaimer (YMYL-health → business). Everything
      else — keyword research, facts, citations, SEO metadata, enrichment,
      social captions, syndication, newsletters — is already
      brand-parameterized ({{who}}, {{business_description}}) or
      audience-neutral and inherits.
- [ ] Authoring rules: never edit a `default` row in service of a vertical;
      only use `{{variables}}` the variable-resolver supports (check
      `variable-resolver.ts`).
- [ ] Admin surface: `/admin/prompts` → vertical tab shows
      Inherited/Customized; editing an inherited row clones-on-write;
      "Revert to inherited" deletes the override.

### 4 · Content calendar
- [ ] `packages/db/scripts/seed-<v>-calendar.ts`: ArticleCalendar +
      ~26 dated topics (topic + angle + keywords), assigned to the account
      via `articleCalendarId`. Topics ARE the vertical's editorial strategy —
      write them from the vertical's sales narrative so articles feed the
      funnel.

### 5 · Pilot-article gate (MANDATORY before cadence)
- [ ] One article end-to-end: Topic + ArticleJob rows → enqueue
      `article-pipeline` → review the draft (and its LinkedIn/Medium
      syndication outputs) with the human owner.
- [ ] Quality loop goes through seed-pack copy (FORCE=1 reseed), never
      through pipeline code.
- [ ] Check the graceful degradations: plain-language enrichment no-ops
      when the vertical's industry has no PlainLanguageConfig (fine);
      hemisphere/seasonality is a no-op without geolocation signals.

### 6 · Lead-gen + funnel assets (per-vertical by nature)
- [ ] Guide masters (leadgen templates) for the vertical's audience.
- [ ] Interactive quiz instance (Spine Check pattern; for `azavea` the
      Practice X-Ray already fills this slot).
- [ ] Marketing sales page for the vertical's subdomain/site.
- [ ] Newsletter section mix review (the magazine structure is data +
      prompts; verify the sections make sense for the audience).

### 7 · Commercial layer (paid verticals only)
- [ ] GHL: agency snapshot for the vertical (workflows, tags, custom
      fields), Stripe product/checkout, trigger links.
- [ ] Drive delivery folder structure for guides.

### 8 · Chat agent (if the vertical gets the widget)
- [ ] ⚠️ **REQUIRED for any non-health vertical:** the agent guardrails
      (red-flag lexicon, emergency interception, advertising rails) are
      health-vertical config baked in code today. They must be made
      per-vertical config BEFORE a non-health vertical ships the widget.
      Health verticals inherit the current rails. Agent prompts (`agent_*`
      keys) already resolve per-vertical.

---

## What launching `azavea` actually took (calibration)

| Piece | Effort |
|---|---|
| V0 architecture (one-time, done) | 1 session — schema, resolver, 20+ call sites, seeders, regression |
| Subdomain + host map | minutes + DNS wait |
| Account + brand + WP verify | ~½ session (incl. one encryption-context lesson) |
| Seed pack (6 overrides) | ~½ session of prompt writing |
| Calendar (26 topics) | ~½ session of editorial drafting |
| Pilot article | 1 pipeline run + human review cycle |

The architecture is one-time; **a new vertical is now: subdomain + brand +
seed pack + calendar + funnel assets + pilot gate.** For a near-vertical
sharing the chiro deployment, it collapses to: brand + (maybe) 2-3 overrides
+ calendar + pilot.
