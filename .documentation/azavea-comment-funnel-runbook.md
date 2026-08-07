# Azavea XRAY Comment Funnel — exact setup runbook

For the imported "FB Automated Comment Reply - Get Email" workflow (+ your IG
clone) in the Azavea Inc location. Work top to bottom; every node that needs
a change is listed with its exact replacement copy. House style: dash-free.

---

## Step 0 — prerequisites (once)

1. **Sending domain**: the email step needs a verified sender. Location
   Settings → Email Services: verify **azavea.ai** (or a subdomain like
   mail.azavea.ai) so you can send as `team@azavea.ai`. Until verified, the
   email node will send from a shared LC domain (works, but worse
   deliverability).
2. **Deconfliction (server side): DONE** — the Omniply DM agent now stays
   silent while a contact carries the `in comment reply workflow` tag.
3. **AI DM Responder workflow** (if/when you build it on Azavea): add BOTH
   conditions — contact does NOT have tag `ai-off` AND does NOT have tag
   `in comment reply workflow`. Note: on Azavea the agent answers with the
   default (clinic-flavored) agent prompts; fine for testing, and we can add
   azavea-vertical overrides for the agent_* prompt keys later if the tone
   needs it.

## Step 1 — create the pipeline (once)

Opportunities → Pipelines → **+ New Pipeline**: name `Social Leads`, stages
in this order:

1. New Lead
2. Sent Lead Magnet
3. Nudged
4. Clicked Lead Magnet
5. Follow-up 1
6. Follow-up 2
7. Sent Info
8. Have Questions
9. Replied

## Step 2 — create the two trigger links (once)

Marketing → Trigger Links → + Add Link:

| Name | URL |
|---|---|
| `Azavea X-Ray Quiz` | `https://omniply.io/x-ray` |
| `Azavea Sales Info` | `https://omniply.io/chiropractors` |

(If you'd rather send the softer asset mid-funnel, point Sales Info at
`https://omniply.io/walkthrough` instead — my lean is /chiropractors, since
"Send Info" fires only after they said "Yes, interested".)

## Step 3 — the trigger

Open the trigger node ("Facebook - Comment(s) on...CHANGE ME"):

- Page: **Azavea Inc** (already set).
- Comment type: first-level comments only (already set).
- Keyword filter: the import is **case-sensitive "XRAY"** — switch the match
  to case-insensitive if the builder offers it; otherwise add all variants:
  `XRAY`, `xray`, `Xray`, `X-RAY`, `x-ray`, `X-Ray`, `X RAY`, `x ray`.

## Step 4 — node-by-node edits with copy

Numbers follow the GHL AI's outline you have. Nodes not listed stay as-is
(tags, waits, tag-removal cleanups are all fine).

**3. Respond On Comment** — replace the four random public replies:
1. `Sent! Check your DMs 📩`
2. `Just DM'd it to you. Enjoy!`
3. `On its way... check your messages.`
4. `Check your DMs, it's waiting for you.`

**4. FB Interactive Messenger "Get Confirmation"** — message:
> Hey {{contact.first_name}}! Saw your XRAY comment. Your Practice X-Ray is
> ready... a 2 minute checkup that shows where your practice is quietly
> leaking patients and what that costs you every month. Quick question
> first: is it okay if I send it to you here? Just tap Yes.

Buttons: Yes → `Yes, send it!` · No → `No thanks`

**8. Messenger "[EDIT ME] MESSENGER 1 - Get Email"** — message:
> Perfect. What's your best email? I'll send your X-Ray link there too, so
> it doesn't get lost in your message requests.

**11. Create Or Update Opportunity** — re-point to pipeline `Social Leads`,
stage **New Lead**. (The imported pipeline/stage IDs are from the source
account and are broken. Same re-pointing applies to every opportunity node
below.)

**12. Email "Email Lead Magnet [EDIT ME]"**:
- From name: `Veit from Azavea` · From email: `team@azavea.ai`
- Subject: `Your Practice X-Ray link, {{contact.first_name}}`
- Body (insert the **Azavea X-Ray Quiz** trigger link on the button/link):

> Hi {{contact.first_name}},
>
> As promised, here is your Practice X-Ray:
>
> **Take the 2 Minute X-Ray** ← link this to the `Azavea X-Ray Quiz` trigger link
>
> Twelve questions, two minutes. You get four system scores and a dollar
> figure on what your practice is quietly leaking every month. No call, no
> pitch. A report and a number.
>
> Your report is yours to keep.
>
> Veit
> Azavea Inc. ... the team behind Omniply

**13. Messenger "Send Lead Magnet 1"** (insert `Azavea X-Ray Quiz` link):
> Here it is, {{contact.first_name}}: your Practice X-Ray 👇
> {{trigger_link → Azavea X-Ray Quiz}}
> 2 minutes, 12 questions. Four system scores and the dollar figure your
> practice is quietly leaking every month. I emailed you the link too, so
> it doesn't get lost.

**14. Create Opportunity "Sent Lead Magnet"** → `Social Leads` / **Sent Lead Magnet**.

**"Send Lead Magnet 2"** (the 3h no-click nudge; insert `Azavea X-Ray Quiz`):
> Hey {{contact.first_name}}, just making sure this didn't get buried. Your
> Practice X-Ray is here: {{trigger_link → Azavea X-Ray Quiz}} ... takes 2
> minutes and the report is yours to keep.

**"Go Click" opportunity node** → `Social Leads` / **Nudged**.

**17. Create Opportunity "Clicked Lead Magnet"** → `Social Leads` / **Clicked Lead Magnet**.

**19. Create Opportunity "Sent Open Ended 1"** → `Social Leads` / **Follow-up 1**.

**21. FB Interactive Messenger "Open Ended 1"** — message:
> What did your X-Ray show, {{contact.first_name}}? Most owners find one
> system quietly bleeding patients. If you want, I can show you how Omniply
> runs all four systems for you on autopilot... content in your voice,
> instant response, reviews and recall, one flat price. Want the details?

Buttons: `Yes! Show me` · `Not right now`

**22. Create Opportunity "Sent Open Ended 2"** → `Social Leads` / **Follow-up 2**.

**23. FB Interactive Messenger "Open Ended 2"** — message:
> Did you get a chance to run your X-Ray, {{contact.first_name}}? If the
> numbers made you think, I can send over exactly how Omniply fixes the
> leaks it found. No call, just a page to read. Want it?

Same buttons.

**28. Create Opportunity "Sent Info"** → `Social Leads` / **Sent Info**.

**29. Messenger "Send Info 1"** (insert `Azavea Sales Info` link):
> Here you go 👇 This page shows exactly how Omniply runs your marketing on
> autopilot, what's included, and the flat price:
> {{trigger_link → Azavea Sales Info}}
> Read it like an owner, not a marketer. The math section is the part most
> people screenshot.

**32. Messenger "Have Questions"**:
> Did anything raise a question, {{contact.first_name}}? Ask away right
> here... I read every message.

**33. Create Opportunity "Have Questions"** → `Social Leads` / **Have Questions**.

**34. Reply branch "Replied" opportunity** → `Social Leads` / **Replied**.

**35. Messenger "Send Info 2"** (the 4h no-click follow-up; insert `Azavea Sales Info`):
> In case it got buried: here's the full breakdown of how Omniply works and
> what it costs. {{trigger_link → Azavea Sales Info}}

## Step 5 — the IG clone

Same edits, same copy, same trigger links, same pipeline. Two IG-specific
notes: the keyword filter needs the same variant list, and if any
interactive-button node isn't available on the IG channel, replace it with a
plain message asking them to reply YES (the wait-for-reply branches handle
the rest).

## Step 6 — publish + test sequence (in this order)

1. Publish the FB workflow (toggle from Draft).
2. From a test profile, comment `XRAY` on any Azavea FB post → expect: like
   + public reply + permission DM.
3. Tap Yes → expect the email ask. Reply with a real email → expect email +
   DM with the X-Ray link, opportunity moving through stages.
4. Click the link → expect Clicked stage, then Open Ended 1 after 1h (or
   temporarily shorten the waits while testing, then restore).
5. Verify the Omniply DM agent stays SILENT the whole way through (the
   suppression tag is doing its job), and that after the funnel ends
   (tag removed) a fresh DM gets an agent reply.
6. Repeat 2 to 5 on IG.

---

## Chiro snapshot: one workflow per keyword?

**Yes — one per keyword per platform.** The comment trigger's keyword filter
lives on the trigger itself, and GHL cannot branch on "which keyword
matched" inside a workflow. So: 6 keywords × FB + IG = **12 clones** of the
master (SPINE, FIRST VISIT, DESKTOP, SLEEP, PAIN, MORNING — XRAY stays
Azavea-only). Each clone differs only in: trigger keyword variants, the two
trigger links (that guide's link + the clinic booking link as the "info"
target), and the guide-specific nouns in the copy. Once the Azavea master is
tuned, each clone is ~15 minutes, and the snapshot ships all of them to
every clinic for free. The chiro copy pass (compliance-clean, booking-as-
product) is a separate later step — do not reuse the Azavea sales copy
verbatim for clinics.
