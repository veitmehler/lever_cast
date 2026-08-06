# Patient Win-Back Sequence — Snapshot Workflow Copy

**Purpose:** the Recall mechanism's active arm (walkthrough video Scene 9 /
honest-Recall framing): a snapshot workflow that reaches out to patients who
have quietly drifted out of care. Passive arm = the ongoing newsletter;
active arm = this sequence.

**Trigger (GHL workflow):** contact tagged `winback-eligible` — applied
manually by the front desk from the PMS drift report (active care plan, no
visit in 45+ days, no future appointment), or by a saved-search automation
where the PMS integration allows. Exit on: appointment booked, reply
received, or tag `winback-stop`.

**Compliance rails (baked into the copy):** no health claims, no fear
appeals, no "your condition will worsen", no discounts/inducements, no
guilt. The voice is a practice checking in on a person, not chasing revenue.
Merge fields are GHL-standard; `{{location.name}}` = practice,
`{{contact.first_name}}` = patient.

**Cadence:** Day 0, Day 5, Day 12, Day 21 — then stop. Four touches
maximum; a person who ignores four warm messages has answered.

---

## Email 1 — Day 0 · "Checking in"

**Subject:** Checking in, {{contact.first_name}}

Hi {{contact.first_name}},

It's the team at {{location.name}}. We noticed it's been a while since your
last visit, and we wanted to check in — no agenda, just making sure you're
doing okay.

Life gets busy. Appointments slip. It happens to everyone, and picking
things back up is easier than most people expect.

If you'd like to get back on track, you can grab a time that suits you here:

**[Book a visit →]** ({{custom_values.booking_url}})

And if now isn't the right time, that's completely fine. We're here when
you're ready.

Warmly,
The team at {{location.name}}

---

## Email 2 — Day 5 · "The door is open"

**Subject:** No need to explain anything

Hi {{contact.first_name}},

One thing patients tell us when they've been away for a while: they feel
like they need to explain the gap. You don't. Nobody here keeps score.

Coming back is a five-minute booking, not a conversation about where you've
been. We'll simply pick up from wherever you are now.

**[Choose a time that works →]** ({{custom_values.booking_url}})

If mornings are the problem, or parking, or scheduling around work — reply
to this email and tell us. We're good at finding workarounds.

The team at {{location.name}}

---

## Email 3 — Day 12 · "A quick question"

**Subject:** Would a different time of day help?

Hi {{contact.first_name}},

Quick question, honestly asked: was there something about visiting us that
didn't work for you?

Timing, cost, the front desk experience, something we said or didn't say —
whatever it is, we'd genuinely like to know. Just hit reply; a real person
reads these.

And if it was nothing in particular and life simply moved on, the booking
page is always here:

**[Book a visit →]** ({{custom_values.booking_url}})

Thank you either way,
The team at {{location.name}}

---

## Email 4 — Day 21 · "We'll leave you be"

**Subject:** Last note from us, {{contact.first_name}}

Hi {{contact.first_name}},

This is our last check-in — we don't believe in filling anyone's inbox.

You'll stay on our newsletter (it's genuinely useful, and you can leave it
anytime), and your file stays right where it is. Whenever you want to come
back — next month or next year — one click brings you back in:

**[Book a visit →]** ({{custom_values.booking_url}})

Or call us on {{location.phone}}. Take care of yourself.

The team at {{location.name}}

---

## SMS (optional, Day 8 — only where A2P is provisioned)

> Hi {{contact.first_name}}, it's {{location.name}}. Been a while — if
> you'd like to pick things back up, book here: {{custom_values.booking_url}}
> No pressure at all. Reply STOP to opt out.

---

## Snapshot build notes

- Workflow name: **"Patient Win-Back (45-day drift)"**.
- Trigger: tag `winback-eligible` added. Exit conditions: appointment
  booked (any calendar), inbound reply, tag `winback-stop`, tag removed.
- Sender: the location's default sending address (practice identity, NOT
  Omniply); replies route to the front-desk inbox.
- The four emails go in as workflow emails (not campaign), so exits stop
  the sequence instantly.
- Add an internal notification on inbound reply: "Win-back reply from
  {{contact.first_name}} — read + respond today."
- Front-desk runbook (one line in the guide): pull the PMS drift report
  weekly, tag matches `winback-eligible`. Never tag anyone who asked not to
  be contacted.
