/** Master 04 — Better Sleep Without Pills (dash-free conversion). */
import type { MasterDocSpec } from '../../../../apps/api/src/leadgen/master-layout'
import { disclaimer } from './common'

export const spec: MasterDocSpec = {
  title: 'Better Sleep Without Pills',
  subtitle: 'How your sleep position, pillow, and mattress affect your pain, and what to change tonight',
  coverAsset: 'd4_cover',
  coverChecklist: [
    'The three sleep positions, ranked, and how to upgrade yours',
    'The 10-second pillow test most people fail',
    'How to tell if your mattress is helping or hurting',
    'The 90-minute wind-down that quiets both mind and muscles',
  ],
  introHtml:
    "<p>If you wake up stiffer than you went to bed, you're not imagining it. Sleep is when your body does its repair work: muscles relax, tissues recover, and your spinal discs rehydrate after a day of being compressed. Get too little sleep, or spend it in a position that loads your neck and back, and you shortchange that repair.</p><p>It runs both ways: research shows poor sleep lowers your pain threshold the next day, and nighttime pain fragments your sleep. That loop (hurt, sleep badly, hurt more) is one of the most common patterns we see. The good news is that it can be interrupted from the sleep side, tonight, without medication.</p><p>Three physical factors do most of the damage: your position, your pillow, and your mattress. Let's fix them in that order, cheapest first.</p>",
  blocks: [
    { kind: 'part', title: 'Factor 1: free' },
    {
      kind: 'section',
      heading: 'Your sleep position, upgraded',
      slotName: 'positions',
      unnumbered: true,
      figure: { asset: 'd4_positions' },
      defaultHtml:
        "<p>You spend six to nine hours a night in this position. It is, by hours, the biggest posture of your life. Here's the ranking, and the one-pillow upgrade for each.</p>",
      tipHtml:
        "Stomach sleeper since childhood? Don't fight it cold turkey. Transition via the 'half-stomach' position: mostly on your side with a body pillow hugged in front and the top knee resting on it. You keep the pressure-on-the-front feeling without the 90 degree neck twist.",
    },
    { kind: 'part', title: 'Factor 2: the 10-second test' },
    {
      kind: 'section',
      heading: 'Your pillow has one job',
      slotName: 'pillow',
      unnumbered: true,
      figure: { asset: 'd4_pillow' },
      defaultHtml:
        "<p>A pillow isn't for your head. It's for your spine. Its only job is to fill the gap between your head and the mattress so your neck stays in a straight line with the rest of your back.</p>",
      frozenHtml:
        "<ul><li><strong>Side sleepers</strong> need the thickest pillow: it must fill the full width of your shoulder. Test: lie down and have someone photograph you from behind; your nose should line up with your breastbone.</li><li><strong>Back sleepers</strong> need a medium-low pillow that supports the neck curve without pushing the head forward. If your chin points at your chest, it's too high.</li><li><strong>Replace it</strong> when it folds in half and stays there, or when you find yourself sliding a hand underneath. That's your body asking for the height it isn't getting.</li></ul>",
    },
    { kind: 'part', title: 'Factor 3: the big one' },
    {
      kind: 'section',
      heading: 'The mattress check',
      slotName: 'mattress',
      unnumbered: true,
      figure: { asset: 'd4_mattress' },
      defaultHtml:
        '<p>The morning clue: pain or stiffness that is worst when you wake and eases within 30 to 60 minutes of moving around points strongly at the bed (or the position you sleep in it). Pain that stays the same all day usually has other causes.</p>',
      frozenHtml:
        "<ul><li><strong>Age check:</strong> most mattresses support poorly after 7 to 10 years, even if they still 'look fine.'</li><li><strong>The hotel test:</strong> if you consistently sleep better away from home, your bed is a suspect.</li><li><strong>Medium-firm</strong> is the best-supported starting point in research on back pain: firm enough to keep hips level, soft enough to let shoulders sink slightly.</li></ul>",
    },
    { kind: 'part', title: 'The routine', startOnNewPage: true },
    {
      kind: 'section',
      heading: 'The 90-minute wind-down',
      slotName: 'winddown',
      unnumbered: true,
      figure: { asset: 'd4_winddown' },
      defaultHtml:
        '<p>Position, pillow, and mattress fix the mechanics. This routine fixes the nervous system, because a body that goes to bed tense sleeps tense, and tense muscles amplify pain overnight.</p>',
    },
    {
      kind: 'section',
      heading: 'Ten quick wins for deeper sleep',
      slotName: 'quickwins',
      unnumbered: true,
      defaultHtml: '<p>Each of these is small on its own. Together they stack the night in your favour:</p>',
      frozenHtml:
        "<ul><li>Same wake-up time every day (yes, weekends too); it anchors your body clock</li><li>Bedroom cool (around 18&nbsp;&deg;C / 65&nbsp;&deg;F), dark, and quiet</li><li>Caffeine ends at lunchtime: its half-life is 5 to 6 hours</li><li>Alcohol may start sleep faster, but it fragments the second half of the night</li><li>Finish intense exercise 2 to 3 hours before bed; gentle stretching is fine anytime</li><li>Big meals 3 hours out; a light snack is fine</li><li>Phone charges outside the bedroom (an old-school alarm clock costs very little)</li><li>If you can't sleep after about 20 minutes, get up and read something dull in dim light</li><li>Warm shower or bath 1 to 2 hours before bed: the cool-down afterwards is a natural sleep signal</li><li>Write tomorrow's to-do list before you lie down, so your brain can put it down</li></ul>",
    },
    { kind: 'part', title: 'An honest note', startOnNewPage: true },
    {
      kind: 'section',
      heading: "When sleep isn't the whole story",
      slotName: 'honest_note',
      unnumbered: true,
      defaultHtml:
        "<p>If you've upgraded your position, passed the pillow test, ruled out the mattress, and kept the wind-down for two weeks, and your nights still involve pain, the problem usually isn't your sleep setup. It's what your spine is carrying into bed each night.</p>",
      frozenHtml:
        "<ul><li>Pain that reliably wakes you at the same depth of night</li><li>Numbness or tingling in your arms or hands while sleeping</li><li>Needing to sleep in a recliner or 'nest' of pillows to cope</li><li>Morning headaches that fade by mid-morning</li><li>Stiffness every single morning for more than 30 minutes</li></ul><p>These patterns respond poorly to sleep hygiene alone because the driver is mechanical: restricted joints, irritated nerves, muscle guarding. That's assessable and, in most cases, very treatable.</p>",
    },
  ],
  disclaimerHtml: disclaimer('Better Sleep Without Pills'),
}
