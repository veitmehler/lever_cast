/** Master 05 — What to Expect at Your First Chiropractic Visit (dash-free conversion). */
import type { MasterDocSpec } from '../../../../apps/api/src/leadgen/master-layout'
import { disclaimer } from './common'

const mythsTable = `<table>
<tr><th>Myth</th><th>Fact</th></tr>
<tr><td>"Once you go, you have to keep going forever."</td><td>Your care plan is your choice. Many patients come for a specific problem, resolve it, and stop. Others choose periodic care because they feel it helps, the same way people choose ongoing massage or gym memberships. A good chiropractor sets clear goals and re-evaluates against them.</td></tr>
<tr><td>"Adjustments hurt."</td><td>Most adjustments are painless, and many people feel immediate relief or looseness. You may have mild, workout-like soreness for a day or so afterwards, especially after the first visit. That's a normal tissue response.</td></tr>
<tr><td>"Chiropractors aren't real doctors."</td><td>Chiropractors complete extensive accredited university-level training, typically 4+ years of chiropractic education covering anatomy, physiology, neurology, radiology, and diagnosis, plus licensing board exams, and they're regulated health professionals in most countries.</td></tr>
<tr><td>"It's not evidence-based."</td><td>Spinal manipulation is included in major international clinical guidelines (for example, for low-back pain) as a recommended, non-drug treatment option. Like any intervention, it works better for some conditions than others. A trustworthy provider will tell you which is which.</td></tr>
<tr><td>"A chiropractor will X-ray everyone to sell a plan."</td><td>Modern, guideline-led practice images only when history or examination indicates it (trauma, red flags, unexplained progression). If routine X-rays for everyone are the policy, that's worth questioning. See the checklist below.</td></tr>
<tr><td>"If nothing hurts, there's nothing to check."</td><td>Pain is a late messenger: joints can move poorly and tissues can compensate long before hurting. That said, beware anyone who finds something 'urgent' in every symptom-free spine. An honest assessment can also conclude: you're fine.</td></tr>
</table>`

export const spec: MasterDocSpec = {
  title: 'What to Expect at Your First Chiropractic Visit',
  subtitle: 'Myths, facts, and the questions worth asking, so you can walk in relaxed',
  coverAsset: 'd5_cover',
  coverChecklist: [
    'The full first visit, step by step (with typical timings)',
    "That 'popping' sound, actually explained",
    'Six common myths, held up against the facts',
    'The exact questions to ask any chiropractor before treatment',
  ],
  introHtml:
    "<p>Most people wait far longer than they need to before seeing a chiropractor. Not because the pain isn't real, but because of uncertainty. Will it hurt? What actually happens? Will I be pressured into endless appointments? Is it even safe?</p><p>Those are fair questions, and they deserve straight answers, not sales pitches. This guide walks you through exactly what happens at a first visit, explains the famous 'crack,' clears up the most common myths, and arms you with the questions that help you judge any provider for yourself.</p><p><strong>The one-sentence version:</strong> a first chiropractic visit is mostly listening, examining, and explaining, and nothing happens to your body without your understanding and consent.</p>",
  blocks: [
    { kind: 'part', title: 'The walkthrough', startOnNewPage: true },
    {
      kind: 'section',
      heading: 'Your first visit, step by step',
      slotName: 'walkthrough',
      unnumbered: true,
      figure: { asset: 'd5_timeline' },
      defaultHtml:
        '<p>Total time: plan for roughly 45 to 60 minutes. Follow-up visits are much shorter, typically 10 to 20 minutes.</p>',
    },
    {
      kind: 'section',
      heading: 'What to wear and bring',
      slotName: 'bring',
      unnumbered: true,
      defaultHtml: '<p>No special preparation needed. These four things make the visit smoother:</p>',
      frozenHtml:
        '<ul><li>Comfortable clothes you can move in (you typically stay dressed)</li><li>Any recent imaging reports (X-ray, MRI) or a list of medications, if you have them</li><li>Your symptom notes: when it started, what makes it better or worse</li><li>Your insurance details, if applicable</li></ul>',
    },
    { kind: 'part', title: 'The famous sound', startOnNewPage: true },
    {
      kind: 'section',
      heading: 'That popping sound, explained',
      slotName: 'popping',
      unnumbered: true,
      figure: { asset: 'd5_pop' },
      defaultHtml:
        "<p>The sound that makes people nervous is called a cavitation, and it's far less dramatic than it feels. Joints are lubricated by fluid that contains dissolved gases. When a joint is stretched quickly through a small, controlled range, the pressure inside drops, and a small gas bubble forms. That's the audible 'pop.'</p>",
      frozenHtml:
        "<ul><li>It is <strong>not</strong> bones cracking or 'going back into place.' It's a pressure change in fluid, the same phenomenon as knuckle cracking.</li><li>The sound is not the treatment. A perfectly effective adjustment can be silent; a loud one isn't 'working better.'</li><li>Prefer no popping at all? Say so. Low-force techniques (instrument-assisted, mobilization, drop-table) exist precisely for this, and any good chiropractor offers them.</li></ul>",
    },
    { kind: 'part', title: 'Sorting fact from fiction', startOnNewPage: true },
    {
      kind: 'section',
      heading: 'Six myths, six facts',
      slotName: 'myths',
      unnumbered: true,
      figure: { asset: 'd5_mythfact_header' },
      defaultHtml:
        "<p>These six beliefs stop more people from getting help than pain ever does. Here's how they hold up:</p>",
      frozenHtml: mythsTable,
    },
    { kind: 'part', title: 'A 60-second anatomy lesson', startOnNewPage: true },
    {
      kind: 'section',
      heading: 'Your spine at a glance',
      slotName: 'anatomy',
      unnumbered: true,
      figure: { asset: 'd5_spine' },
      defaultHtml:
        '<p>It helps to know the map when your chiropractor explains what they found.</p>',
    },
    { kind: 'part', title: 'Be an empowered patient', startOnNewPage: true },
    {
      kind: 'section',
      heading: 'Questions worth asking, and answers worth hearing',
      slotName: 'questions',
      unnumbered: true,
      defaultHtml:
        '<p>Any good chiropractor will welcome these. Treat hesitation, vagueness, or pressure as information:</p>',
      frozenHtml:
        `<ul><li><strong>"What exactly did you find, and can you show me?"</strong> You should get a plain-language explanation, not just jargon.</li><li><strong>"What's your plan, and how will we know it's working?"</strong> Expect a defined number of visits with a re-assessment point, not an open-ended commitment.</li><li><strong>"What can I do myself between visits?"</strong> Good care almost always includes exercises or habit changes, not just the table.</li><li><strong>"Are there other options besides adjustment?"</strong> Mobilization, soft-tissue work, low-force techniques, exercise plans, or referral elsewhere if you're not the right fit.</li><li><strong>"What happens if I'm not improving?"</strong> The right answer mentions re-evaluating, changing approach, or referring you on, not simply 'more visits.'</li></ul>`,
    },
    {
      kind: 'section',
      heading: 'Is it safe?',
      slotName: 'safety',
      unnumbered: true,
      defaultHtml:
        '<p>Bottom line: you now know more about a first chiropractic visit than most patients ever do walking in. The exam table is not a commitment. It is a conversation.</p>',
      frozenHtml:
        '<p>For most people, chiropractic care is considered a low-risk, non-invasive option, and the most common side effect is short-lived soreness, similar to starting a new exercise. Serious complications are rare. Your chiropractor screens for risk factors during the history and examination, which is exactly why that thorough first visit matters, and why you should always mention medical conditions, medications (like blood thinners), and previous injuries.</p>',
    },
  ],
  disclaimerHtml: disclaimer('What to Expect at Your First Chiropractic Visit'),
}
