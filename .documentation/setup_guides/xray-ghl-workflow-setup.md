# Practice X-Ray → GHL Workflow Setup (exact steps)

One-time setup on the **Omniply marketing location** (your own sub-account used
for omniply.io lead gen — NOT a client location). ~30 minutes.

The quiz at omniply.io/x-ray POSTs one JSON payload per completed capture to an
inbound webhook. This guide wires: contact creation, tagging, custom fields
(including the personalized PDF link), and the nurture entry point.

## Payload the app sends (field names you'll map)

```json
{
  "name": "Dr. Jane Doe",
  "email": "jane@example.com",
  "phone": "+1 555 0100",            // may be null
  "practiceName": "Coast Chiropractic", // may be null
  "currency": "USD",
  "reportUrl": "https://svc.omniply.io/api/xray/report?d=…",  // personalized PDF
  "axisScores": { "content": 20, "speed": 30, "reviews": 50, "retention": 34 },
  "totalScore": 34,
  "weakestAxis": "content",           // content | speed | reviews | retention
  "driftLeak": 5600,
  "responseLeak": 3950,
  "totalLeak": 9550,
  "answers": { "a1": 3, "...": 0 },
  "utm": { "utm_source": "..." },
  "referrer": "https://…",
  "ts": "2026-08-04T12:00:00.000Z",
  "source": "practice-xray"
}
```

## Step 1 — Custom fields (Settings → Custom Fields → + Add Field, object: Contact)

Create these 7 (group them in a folder "X-Ray" if you like):

| Field name (label)   | Type            | Unique key it gets (check after save) |
| -------------------- | --------------- | ------------------------------------- |
| XRay Report URL      | Single Line     | `xray_report_url`                     |
| XRay Total Score     | Number          | `xray_total_score`                    |
| XRay Weakest Axis    | Single Line     | `xray_weakest_axis`                   |
| XRay Total Leak      | Number          | `xray_total_leak`                     |
| XRay Drift Leak      | Number          | `xray_drift_leak`                     |
| XRay Response Leak   | Number          | `xray_response_leak`                  |
| XRay Currency        | Single Line     | `xray_currency`                       |

## Step 2 — Workflow "X-Ray Lead Capture"

1. Automation → Workflows → **+ Create Workflow** → Start from Scratch. Name:
   `X-Ray Lead Capture`.
2. **Trigger: Inbound Webhook.** Save the trigger → GHL shows a unique
   **webhook URL**. Copy it — **send it to me**; I paste it into the app's
   `WEBHOOK_URL` config and deploy (captures are disabled until then).
3. To let GHL learn the payload shape: after I set the URL, run one test quiz
   (or use the trigger's "sample request" with the JSON above) so the mapping
   picker can see the fields.
4. **Action 1 — Create/Update Contact:**
   - Full Name ← `name` · Email ← `email` · Phone ← `phone`
   - Business/Company name ← `practiceName` (optional)
5. **Action 2 — Add Tag:** `xray-lead`
6. **Action 3 — Update Contact Field(s):** map
   - XRay Report URL ← `reportUrl`
   - XRay Total Score ← `totalScore`
   - XRay Weakest Axis ← `weakestAxis`
   - XRay Total Leak ← `totalLeak`
   - XRay Drift Leak ← `driftLeak`
   - XRay Response Leak ← `responseLeak`
   - XRay Currency ← `currency`
7. **Action 4 (for now, placeholder) — Internal Notification** to yourself, so
   every capture pings you during the pre-launch phase. (The 5-email nurture
   sequence replaces/extends this later — copy is a separate task; the emails
   will use `{{contact.xray_report_url}}` as the report button and the custom
   fields for personalization.)
8. Set the workflow to **Publish** (toggle top right), Save.

## Step 3 — Hand me the webhook URL

I update `WEBHOOK_URL` in `apps/web/public/x-ray/index.html` and deploy. From
then on every completed quiz creates/updates a contact with everything mapped.

## Step 4 — End-to-end test (after the deploy)

1. Open omniply.io/x-ray (or staging), complete the quiz with YOUR email and a
   practice name like `Test Practice`.
2. Check in GHL: contact exists, tag `xray-lead`, all 7 fields populated.
3. Click the XRay Report URL field value → the personalized PDF must open,
   cover reading "Prepared for Test Practice", page 2 showing the exact scores
   and leak you saw on screen.
4. Delete the test contact (or tag it `internal-test`).

## Notes

- **Email button for the report** (when we write the nurture emails): link the
  button to `{{contact.xray_report_url}}`. Don't use a trigger link for this —
  trigger links are one fixed URL per link, they can't carry per-contact URLs.
  GHL's standard email link tracking still records the click.
- The report endpoint is stateless: the URL itself contains the answers. It
  works forever, needs no login, and re-renders on demand (cached).
- If `practiceName` was left empty, the PDF automatically says "Prepared for
  {their name}" instead.
