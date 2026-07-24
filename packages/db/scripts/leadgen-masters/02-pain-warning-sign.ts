/** Master 02 — Is Your Pain Normal, or a Warning Sign? (dash-free conversion). */
import type { MasterDocSpec } from '../../../../apps/api/src/leadgen/master-layout'
import { disclaimer } from './common'

const bodyMapTable = `<table>
<tr><th>If you feel it here&hellip;</th><th>It commonly relates to&hellip;</th><th>Often made worse by&hellip;</th></tr>
<tr><td>Neck and base of skull</td><td>Joint restriction, forward-head posture, tension in the suboccipital muscles: a frequent source of headaches</td><td>Screens, stress, poor pillow</td></tr>
<tr><td>Between the shoulder blades</td><td>Stiff mid-back (thoracic) joints and postural fatigue</td><td>Desk work, driving, nursing or feeding posture</td></tr>
<tr><td>Low back</td><td>Joint irritation, disc load, deconditioned core: the #1 reason people see a chiropractor</td><td>Prolonged sitting, bending and lifting</td></tr>
<tr><td>Buttock, radiating down the leg</td><td>Nerve irritation (e.g., sciatica) or referred pain from the low back or hip</td><td>Sitting, coughing, car journeys</td></tr>
<tr><td>Jaw, temples and forehead</td><td>Jaw joint (TMJ) tension and neck-driven (cervicogenic) headaches</td><td>Clenching, chewing, stress</td></tr>
<tr><td>Shoulder or knee</td><td>Often compensation: the joint above or below isn't doing its share</td><td>Repetitive activity, old injuries</td></tr>
</table>`

const diaryTable = `<table>
<tr><th>Day</th><th>Score (0 to 10)</th><th>Where exactly?</th><th>Worst moment of the day</th><th>What helped or made it worse?</th></tr>
<tr><td>Mon</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Tue</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Wed</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Thu</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Fri</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Sat</td><td></td><td></td><td></td><td></td></tr>
<tr><td>Sun</td><td></td><td></td><td></td><td></td></tr>
</table>`

export const spec: MasterDocSpec = {
  title: 'Is Your Pain Normal, or a Warning Sign?',
  subtitle: 'A simple self-check guide for back, neck and joint pain',
  coverAsset: 'd2_cover',
  coverChecklist: [
    'The traffic-light system: know when to wait, book, or act now',
    'The red flags that should never be ignored',
    'A body map of what pain in each area usually means',
    'A 7-day pain diary that makes any appointment twice as useful',
  ],
  introHtml:
    '<p>Everyone hurts sometimes. A stiff neck after a bad night, an achy back after moving furniture: most of it fades on its own, and most of it is nothing to worry about. But some pain is your body\'s early-warning system, and telling the two apart is not always obvious.</p><p>The most common mistakes go in both directions. Some people rush to worry about every twinge. Far more people do the opposite: they normalize pain for months or years ("it\'s just my back," "I slept funny again") while a small, fixable problem quietly becomes a stubborn one.</p><p>This guide gives you a simple framework, the same kind of triage thinking healthcare providers use, so you can answer one question with confidence: can this wait, should I get it checked, or does this need attention now?</p><p><strong>Important:</strong> this guide helps you make a more informed decision, but it can\'t examine you. When in doubt, get checked. A short assessment that finds nothing wrong is never wasted.</p>',
  blocks: [
    { kind: 'part', title: 'The framework' },
    {
      kind: 'section',
      heading: 'The traffic-light pain check',
      slotName: 'trafficlight',
      unnumbered: true,
      figure: { asset: 'd2_trafficlight' },
      defaultHtml:
        "<p>Run your pain through these three panels. Be honest, and read all three before deciding where you fit.</p><p>A useful rule of thumb: it's not the intensity of pain that matters most, it's the pattern. Pain that is improving week over week is usually healing. Pain that plateaus, keeps returning, or slowly spreads is compensation, and compensation doesn't fix itself.</p>",
    },
    {
      kind: 'section',
      heading: 'The red-flag list',
      slotName: 'redflags',
      unnumbered: true,
      figure: { asset: 'd2_redflag' },
      defaultHtml:
        "<p>These signs don't automatically mean something serious, but they are the symptoms that deserve a professional's eyes promptly, because they can indicate nerve involvement or conditions that need medical care:</p>",
      frozenHtml:
        "<ul><li>Numbness, tingling, or weakness in an arm, hand, leg, or foot, especially if it's getting worse</li><li>Pain following an accident, fall, or sports impact, even if it appeared a day or two later</li><li>Night pain that wakes you and doesn't ease when you change position</li><li>Pain with fever, chills, or unexplained weight loss</li><li>Loss of bladder or bowel control, or numbness in the groin or saddle area: <strong>this is an emergency; go to urgent care or the ER</strong></li><li>A severe headache unlike any you've had before</li></ul>",
    },
    { kind: 'part', title: 'Know your map' },
    {
      kind: 'section',
      heading: 'Where it hurts, and what that usually means',
      slotName: 'bodymap',
      unnumbered: true,
      figure: { asset: 'd2_bodymap' },
      defaultHtml:
        '<p>One note before the table, and the last row matters most: pain is not always where the problem is. A knee that aches without injury often traces back to the hip or foot; a shoulder that won\'t settle often involves the neck. Untangling that is exactly what a whole-body movement assessment is for.</p>',
      frozenHtml: bodyMapTable,
    },
    { kind: 'part', title: 'Make it measurable' },
    {
      kind: 'section',
      heading: 'Track it for 7 days',
      slotName: 'diary',
      unnumbered: true,
      figure: { asset: 'd2_scale' },
      defaultHtml:
        '<p>Memory is a terrible pain historian: we remember the worst moment and forget the pattern. One week of simple notes tells you (and any provider you see) more than a month of guesswork.</p><p>Your 7-day pain diary. Fill in one row per day:</p>',
      frozenHtml:
        diaryTable +
        '<p>After 7 days, ask: Is the trend improving, flat, or worsening? Does it follow a schedule (worse mornings? after sitting?)? Is it moving or spreading? A flat or worsening trend after a week of sensible self-care is your cue to book an assessment. Bring this diary with you.</p>',
    },
    {
      kind: 'part',
      title: 'The self-check',
      ledeHtml: '<p>Grab a pen and answer honestly:</p>',
    },
    {
      kind: 'section',
      heading: 'Has it lasted longer than two weeks?',
      slotName: 'q_duration',
      defaultHtml: '<p>Most simple strains settle in 3 to 14 days. Beyond that, something is maintaining it.</p>',
    },
    {
      kind: 'section',
      heading: 'Is this a repeat visitor?',
      slotName: 'q_repeat',
      defaultHtml:
        "<p>Pain that keeps returning to the same spot 'randomly' usually isn't random. It's a pattern with a cause that was never addressed.</p>",
    },
    {
      kind: 'section',
      heading: 'Are you changing how you move?',
      slotName: 'q_movement',
      defaultHtml:
        '<p>Guarding, limping, avoiding stairs, dreading socks-and-shoes: compensations spread problems to new areas.</p>',
    },
    {
      kind: 'section',
      heading: 'Is it affecting sleep, mood, or focus?',
      slotName: 'q_sleep',
      defaultHtml:
        '<p>Pain that follows you into bed or your workday is already costing more than an assessment would.</p>',
    },
    {
      kind: 'section',
      heading: 'Are you taking pain relievers more than twice a week for it?',
      slotName: 'q_medication',
      defaultHtml:
        '<p>Medication that masks a recurring pain lets the underlying cause continue undisturbed.</p>',
      tipHtml:
        "Scoring: even one 'yes' is worth a conversation. Two or more? Your body has been asking for help for a while. Book the assessment.",
    },
    {
      kind: 'section',
      heading: "What a chiropractor checks that you can't",
      slotName: 'what_we_check',
      unnumbered: true,
      defaultHtml:
        '<p>A good assessment goes beyond "where does it hurt?" It examines how each spinal segment and joint actually moves, which muscles are overworking to protect it, how your posture and gait distribute load, and whether nerves are irritated along their path. That\'s why the fix is often somewhere different from the pain, and why self-diagnosis by internet search so often disappoints.</p>',
    },
  ],
  disclaimerHtml: disclaimer('Is Your Pain Normal, or a Warning Sign?'),
}
