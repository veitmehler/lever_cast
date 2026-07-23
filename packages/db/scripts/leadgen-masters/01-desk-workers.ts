/** Master 01 — The Desk Worker's Survival Guide (dash-free conversion of the draft). */
import type { MasterDocSpec } from '../../../../apps/api/src/leadgen/master-layout'
import { disclaimer } from './common'

export const spec: MasterDocSpec = {
  title: "The Desk Worker's Survival Guide",
  subtitle: '9 ways to undo the damage of sitting all day',
  coverAsset: 'd1_cover',
  coverChecklist: [
    'A 60-second workstation check you can do right now',
    'The 30-minute rhythm that protects your spine',
    '6 desk-friendly stretches with step-by-step pictures',
    "The warning signs that mean it's time to get checked",
  ],
  introHtml:
    "<p>If you work at a desk, you probably spend more time sitting than sleeping. Research consistently links prolonged sitting with neck pain, low-back pain, tension headaches, and tight hips. Most of us feel it long before we do anything about it: the stiff neck at 3 PM, the ache when you finally stand up, the shoulders that creep toward your ears during a deadline.</p><p>Here's the good news: the damage is not inevitable. Small, consistent changes to how you sit, how often you move, and how you reset your body make a measurable difference, usually within a couple of weeks.</p><p>This guide gives you 9 practical ways to fight back, in three groups: set up your space (ways 1 and 2), change your rhythm (way 3), and reset your body with the 6-stretch desk reset. None of them require equipment, and every stretch fits into a two-minute break.</p>",
  blocks: [
    { kind: 'part', title: 'Why this matters' },
    {
      kind: 'section',
      heading: 'Run the 60-second workstation check',
      slotName: 'workstation',
      figure: { asset: 'd1_workstation' },
      defaultHtml:
        '<p>Most desk pain starts with a setup that forces your body into awkward positions for hours. Compare your desk to this picture right now. Each label is one fix:</p>',
      frozenHtml:
        '<ul><li><strong>Top of screen at eye level.</strong> If you look down at a laptop all day, your neck carries your head like a bowling ball held away from your body. Raise the screen on books or a stand, and add an external keyboard.</li><li><strong>Elbows at roughly 90&deg;, shoulders relaxed.</strong> Raise or lower your chair until your forearms rest level with the desk.</li><li><strong>Back supported.</strong> Sit back into the chair so the backrest does its job; a small cushion in the low-back curve helps.</li><li><strong>Feet flat on the floor, knees at about 90&deg;.</strong> If your feet dangle, use a footrest or a sturdy box.</li></ul>',
    },
    {
      kind: 'section',
      heading: "Sit supported, not 'perfectly straight'",
      slotName: 'posture',
      figure: { asset: 'd1_posture' },
      defaultHtml:
        "<p>Forget rigid 'sit up straight' posture. Your best sitting position is a supported, stacked one, and your second-best posture is simply your next one. The real enemy is the slow slump that creeps in after 20 minutes.</p>",
      tipHtml:
        'The 3 PM trick: set a recurring afternoon reminder that just says "ears over shoulders." That single cue undoes the forward-head drift that causes most desk-related neck tension and headaches.',
    },
    {
      kind: 'section',
      heading: 'Adopt the 30-minute rhythm',
      slotName: 'rhythm',
      figure: { asset: 'd1_rhythm' },
      defaultHtml:
        "<p>Even a perfect setup can't fix sitting still for too long. Your spinal discs have no direct blood supply; they rely on movement to stay nourished. Ergonomics researchers suggest a simple cycle.</p><p>It sounds like a lot of interruption, but it isn't: stand while you take a call, walk to refill your water, stretch while a file loads. The movement minutes add up without costing you focus. Most people find they concentrate better.</p>",
    },
    {
      kind: 'part',
      title: 'The 6-stretch desk reset',
      num: 4,
      startOnNewPage: true,
      ledeHtml:
        '<p>Do these in order and the full circuit takes under five minutes. Move gently into each position. You should feel a comfortable stretch, never pain. Breathe slowly throughout, and never bounce or force anything.</p>',
    },
    {
      kind: 'stretchGrid',
      cards: [
        {
          heading: "Chin tucks: undo 'tech neck'",
          slotName: 'chintuck',
          figure: { asset: 'd1_s_chintuck' },
          howHtml:
            '<p>Sit or stand tall. Without tilting your head, glide it straight back, as if making a gentle double chin. Hold 3 seconds, relax, and repeat 10 times.</p>',
          whyHtml:
            '<p>Counteracts the forward-head position and reactivates the deep neck muscles that keep your head balanced over your spine.</p>',
        },
        {
          heading: 'Upper trap stretch: melt tight shoulders',
          slotName: 'trap',
          figure: { asset: 'd1_s_trap' },
          howHtml:
            '<p>Sitting tall, let one ear drift toward the same-side shoulder. Rest the opposite hand behind your back or reach it gently toward the floor. Hold 20 to 30 seconds per side.</p>',
          whyHtml:
            "<p>Targets the muscles between your neck and shoulders, the ones that turn into 'stress rocks' during a deadline.</p>",
        },
        {
          heading: 'Doorway chest stretch: open up',
          slotName: 'doorway',
          figure: { asset: 'd1_s_doorway' },
          howHtml:
            '<p>Stand in a doorway, forearms on the frame, elbows just below shoulder height. Step one foot forward until you feel a stretch across the chest. Hold 20 to 30 seconds.</p>',
          whyHtml:
            '<p>Hours of reaching forward to a keyboard shortens the chest muscles and rounds the shoulders. This reverses it.</p>',
        },
        {
          heading: 'Seated spinal twist: restore rotation',
          slotName: 'twist',
          figure: { asset: 'd1_s_twist' },
          howHtml:
            '<p>Sit sideways-on or tall in your chair, feet planted. Place one hand on the opposite knee or the chair back and rotate your upper body slowly, looking over the shoulder. Hold 15 to 20 seconds per side.</p>',
          whyHtml:
            '<p>Your mid-back is built to rotate. Sitting takes that motion away, and neighbouring joints pay the price.</p>',
        },
        {
          heading: 'Hip flexor lunge: release the sitting muscles',
          slotName: 'hipflexor',
          figure: { asset: 'd1_s_hipflexor' },
          howHtml:
            '<p>Take a half-kneeling position (back knee on a cushion). Tuck your tailbone slightly and shift your weight forward until you feel a stretch across the front of the back hip. Hold 20 to 30 seconds per side.</p>',
          whyHtml:
            '<p>The hip flexors adapt to a shortened position when you sit, then tug your pelvis forward when you stand: a common hidden driver of low-back ache.</p>',
        },
        {
          heading: 'Stand and reach reset: your hourly full stop',
          slotName: 'reach',
          figure: { asset: 'd1_s_reach' },
          howHtml:
            '<p>Stand up, interlace your fingers, and reach both palms toward the ceiling. Look slightly up, breathe in deeply, lean a touch back, and exhale slowly. Repeat 3 times.</p>',
          whyHtml:
            '<p>A 20-second full-body reset that re-extends everything sitting flexes. Do it every time you stand up and it becomes automatic.</p>',
        },
      ],
    },
    { kind: 'part', title: 'An honest note', startOnNewPage: true },
    {
      kind: 'section',
      heading: "When stretching isn't enough",
      slotName: 'when_to_seek',
      unnumbered: true,
      defaultHtml:
        '<p>These nine strategies genuinely help most desk workers, but they work on the muscles and habits, not on underlying joint problems. If you notice any of the following, self-care alone is probably not the answer:</p>',
      frozenHtml:
        "<ul><li>Pain that has lasted more than two weeks despite better habits</li><li>Neck or back pain that keeps returning in the same spot</li><li>Headaches that start at the base of the skull and creep forward</li><li>Numbness, tingling, or weakness in your arms or hands</li><li>Pain that wakes you at night or is worse first thing in the morning</li></ul><p>None of these mean something serious is wrong, but they do mean your body is compensating for something a stretch can't reach. A chiropractic assessment can identify which joints aren't moving well and build a plan that fixes causes instead of chasing symptoms.</p>",
    },
  ],
  disclaimerHtml: disclaimer("The Desk Worker's Survival Guide"),
}
