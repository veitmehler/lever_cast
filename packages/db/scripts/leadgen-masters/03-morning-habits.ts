/** Master 03 — 7 Morning Habits That Are Wrecking Your Spine (dash-free conversion). */
import type { MasterDocSpec } from '../../../../apps/api/src/leadgen/master-layout'
import { disclaimer } from './common'

export const spec: MasterDocSpec = {
  title: '7 Morning Habits That Are Wrecking Your Spine',
  subtitle: 'And the two-minute swaps that fix them',
  coverAsset: 'd3_cover',
  coverChecklist: [
    'Why your spine is most vulnerable in the first hour of the day',
    "The 'log roll': how to get out of bed without the twist",
    'What checking your phone in bed really does to your neck',
    "A 3-minute wake-up routine you'll actually stick to",
  ],
  introHtml:
    '<p>Overnight, the discs between your vertebrae slowly absorb fluid and plump up, which is why you\'re up to 1 to 2 cm taller in the morning. It also means those discs are under noticeably more internal pressure during the first hour of the day, and research shows the spine is measurably stiffer and more vulnerable to strain from bending and twisting right after waking.</p><p>That\'s why so many "my back just went" stories start the same way: reaching for something on the floor, twisting out of bed, bending over the sink, all before 8 AM.</p><p>The fix isn\'t bubble-wrap caution. It\'s swapping seven common morning habits for smarter versions. None of the swaps takes more than two minutes, and together they can transform how your back feels by lunchtime.</p>',
  blocks: [
    { kind: 'part', title: 'The first hour matters most' },
    {
      kind: 'section',
      heading: 'The jackknife exit: sitting straight up out of bed',
      slotName: 'jackknife',
      figure: { asset: 'd3_logroll' },
      defaultHtml:
        '<p><strong>The habit:</strong> the alarm rings, you sit bolt upright and twist your legs out, combining forward bending, twisting, and load at the exact moment your discs are most pressurized.</p><p><strong>The swap, the log roll:</strong> your whole body turns as one unit, and your legs act as a counterweight so your back barely works at all.</p>',
    },
    {
      kind: 'section',
      heading: 'The bedtime scroll: phone before feet',
      slotName: 'scroll',
      figure: { asset: 'd3_textneck' },
      defaultHtml:
        "<p><strong>The habit:</strong> ten minutes (or thirty) of scrolling with your head propped forward on a pillow, or hunched over the phone at the edge of the bed.</p><p>Your head weighs about as much as a bowling ball. Tilt it forward, and the effective load on your neck multiplies.</p><p><strong>The swap:</strong> keep the phone out of reach until you're upright, then hold it at eye level with your elbows supported. Better still: give yourself ten screen-free minutes and do the wake-up routine below instead. Your neck gets 60 fewer 'pounds' before breakfast.</p>",
    },
    {
      kind: 'section',
      heading: 'Zero movement before the commute',
      slotName: 'routine',
      defaultHtml:
        '<p><strong>The habit:</strong> bed, then car seat, then desk chair. Three sustained flexed positions in a row, with no counter-movement in between.</p><p><strong>The swap, the 3-minute wake-up routine</strong> (do it while the coffee brews):</p>',
      frozenHtml:
        '<ul><li><strong>Knee hugs, in bed (30 sec):</strong> on your back, gently pull one knee toward your chest, then the other. Slow and easy.</li><li><strong>Cat-cow on all fours (1 min):</strong> alternate slowly between arching and rounding your back, following your breath.</li><li><strong>Standing reach and side lean (30 sec):</strong> reach both arms overhead, then lean gently left and right.</li><li><strong>March on the spot (1 min):</strong> lift the knees, swing the arms. This literally pumps fluid through your joints and wakes up circulation.</li></ul>',
    },
    {
      kind: 'section',
      heading: 'The breakfast hunch',
      slotName: 'breakfast',
      defaultHtml:
        '<p><strong>The habit:</strong> eating breakfast folded over a phone or bowl, often our most slumped posture of the entire day, held for 15 minutes.</p><p><strong>The swap:</strong> sit back in the chair, bring the bowl or mug up rather than your head down, and put the phone on a stand if you must scroll. Same breakfast, roughly half the neck load.</p>',
    },
    {
      kind: 'section',
      heading: 'The sink bend: brushing teeth folded in half',
      slotName: 'sink',
      defaultHtml:
        "<p><strong>The habit:</strong> rounding your whole back over the sink for two minutes of brushing or shaving. A long, loaded forward bend at peak disc pressure.</p><p><strong>The swap, hinge, don't hunch:</strong> stand tall, soften your knees, and hinge from the hips with a long, straight back. Better yet, rest one hand on the counter and keep your spine neutral. To spit, bend your knees rather than your back. It feels oddly formal for about three days, then becomes automatic.</p>",
    },
    {
      kind: 'section',
      heading: 'The one-shoulder everything bag',
      slotName: 'bag',
      figure: { asset: 'd3_bag' },
      defaultHtml:
        "<p><strong>The habit:</strong> laptop, bottle, charger, life: all hanging off one shoulder, every day, usually the same shoulder.</p><p><strong>The swap:</strong> use a backpack with both straps snug so the load sits close to your spine. If you love your shoulder bag, lighten it and consciously alternate sides day by day. Your spine adapts to what you do repeatedly; don't let it adapt to a permanent lean.</p>",
    },
    {
      kind: 'section',
      heading: "Walking out the door with yesterday's posture",
      slotName: 'walltest',
      figure: { asset: 'd3_plumb' },
      defaultHtml:
        "<p><strong>The habit:</strong> carrying the previous day's slump straight into the new day, without ever resetting to neutral.</p><p><strong>The swap, the 20-second wall test:</strong> stand with your back to a wall: heels a few centimetres away, hips and shoulder blades touching, back of the head reaching gently toward the wall (don't force it). Feel what 'stacked' is like, then walk away keeping it.</p>",
    },
    {
      kind: 'part',
      title: 'Put it together',
      ledeHtml: '<p>Stick this on the fridge or bathroom mirror:</p>',
    },
    {
      kind: 'section',
      heading: 'Your new morning, on one page',
      slotName: 'summary',
      unnumbered: true,
      defaultHtml:
        "<p>Give it two weeks. Habit researchers find simple swaps like these stick fastest when tied to existing routines (alarm, coffee, toothbrush). Most people notice easier mornings within 7 to 14 days. If your mornings still start with pain after two weeks of honest effort, that's not a habit problem anymore, and it deserves an assessment.</p>",
      frozenHtml:
        '<ul><li>Log-roll out of bed: roll, drop, push, pause</li><li>Phone stays out of reach until you\'re upright</li><li>3-minute wake-up routine while the coffee brews</li><li>Breakfast: bring the food up, not your head down</li><li>Brush teeth with a hip hinge, not a back bend</li><li>Backpack on both shoulders, or alternate sides</li><li>20-second wall test before you leave</li></ul>',
    },
    {
      kind: 'section',
      heading: 'Morning warning signs worth a professional look',
      slotName: 'warnings',
      unnumbered: true,
      defaultHtml: '<p>If any of these describe your mornings, book an assessment rather than another habit change:</p>',
      frozenHtml:
        "<ul><li>Morning back stiffness that lasts more than 30 minutes, day after day</li><li>Pain or pins-and-needles that appear during the night or on waking</li><li>A back that 'goes' on trivial movements: sneezing, socks, the sink bend</li><li>Needing to 'walk it off' every single morning before you can stand straight</li></ul>",
    },
  ],
  disclaimerHtml: disclaimer('7 Morning Habits That Are Wrecking Your Spine'),
}
