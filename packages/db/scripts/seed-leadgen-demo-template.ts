/**
 * Seed the DEMO lead-gen master template (leadgen plan — layout validation).
 *
 * Placeholder content for testing the compile → review → live chain before
 * the real master texts arrive. Upsert by slug; safe to re-run. Deactivate or
 * delete before prod client onboarding (the starter-library hook compiles
 * every ACTIVE template).
 *
 * Run: pnpm --filter @socioply/db exec tsx scripts/seed-leadgen-demo-template.ts
 */
import { PrismaClient } from '@prisma/client'
// Layout builder lives in the API app; scripts run from the repo via tsx, so a
// relative import keeps the layout single-sourced.
import { buildMasterHtml, defaultSlotMeta, type MasterDocSpec } from '../../../apps/api/src/leadgen/master-layout'

const prisma = new PrismaClient()

const spec: MasterDocSpec = {
  title: 'The Desk Worker’s 10-Minute Back Routine',
  subtitle:
    'Five simple movements you can do beside your desk to loosen a stiff back, ease tight hips and finish the workday feeling human.',
  introHtml:
    '<p>If you spend most of your day at a desk, your back has probably learned to complain about it. The good news: it responds quickly to the right kind of movement, and none of it requires a gym. This short guide gives you a simple daily routine plus the signs that tell you when stiffness deserves a closer look.</p>',
  sections: [
    {
      heading: 'Why sitting stiffens your spine',
      slotName: 'why_sitting',
      defaultHtml:
        '<p>Your spine is built to move. After 30 to 45 minutes in one position, the discs between your vertebrae receive less fluid, the muscles along your spine reduce their activity, and your hip flexors slowly adapt to the shortened position.</p><p>None of this is damage. It is simply your body being efficient at the thing you practise most, which for many of us is sitting very still.</p>',
      tipHtml: 'Set a repeating 45-minute timer. The best posture is the next posture.',
    },
    {
      heading: 'The 10-minute routine',
      slotName: 'routine',
      defaultHtml:
        '<p>Do these five movements in order, once per workday. No equipment, office clothes are fine.</p><ol><li><strong>Standing back extensions:</strong> hands on hips, gently arch back. 10 slow reps.</li><li><strong>Hip flexor stretch:</strong> half-kneel beside your chair, tuck your tailbone, lean forward gently. 30 seconds each side.</li><li><strong>Thoracic rotations:</strong> seated, arms crossed, rotate to each side. 8 per side.</li><li><strong>Glute squeezes:</strong> standing, squeeze for 5 seconds. 10 reps.</li><li><strong>Neck resets:</strong> chin gently back (make a double chin), hold 5 seconds. 8 reps.</li></ol>',
      tipHtml: 'Movements should feel like a stretch, never a strain. Mild is effective.',
    },
    {
      heading: 'When stiffness deserves a professional look',
      slotName: 'when_to_seek',
      defaultHtml:
        '<p>Everyday stiffness eases with movement. Consider a professional assessment when stiffness comes with pain that wakes you at night, tingling or numbness into an arm or leg, or when it simply is not improving after a couple of weeks of regular movement.</p>',
    },
  ],
  disclaimerHtml:
    'This guide provides general information only and is not a substitute for professional advice. If you are experiencing pain or have a medical condition, please seek an individual assessment from a registered health practitioner.',
}

async function main() {
  const row = await prisma.leadGenTemplate.upsert({
    where: { slug: 'demo-desk-back-routine' },
    create: {
      name: 'DEMO — Desk Worker’s Back Routine',
      slug: 'demo-desk-back-routine',
      description: 'Layout-validation demo template. Deactivate before prod onboarding.',
      sourceHtml: buildMasterHtml(spec),
      slotMeta: defaultSlotMeta(spec),
      active: true,
    },
    update: {
      sourceHtml: buildMasterHtml(spec),
      slotMeta: defaultSlotMeta(spec),
    },
  })
  console.log(`Seeded lead-gen demo template: ${row.id} (${row.slug}), active=${row.active}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
