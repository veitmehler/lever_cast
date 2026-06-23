/**
 * AI diagram restyle ("Nano Banana") — default style guide.
 *
 * This is the single source of truth for the prefilled style guide shown on the
 * settings page and used by the article-enrichment restyle service. A business
 * may override it via BrandSettings.diagramStyleGuide; when that is empty, this
 * default is used at render time.
 *
 * Dep-free on purpose so it is safe to import from server routes (it travels to
 * the client as plain JSON via /api/brand-settings, never bundled directly).
 */
export const DEFAULT_DIAGRAM_STYLE_GUIDE = `# STYLE GUIDE

## CORE AESTHETIC
A premium, editorial "data-visualization" look — think a high-end science magazine
infographic. Two signature motifs define it:
- **Jewel-Box Data Capsules:** each node is a translucent, glass-like capsule — a
  softly-lit rounded container with subtle depth and a faint inner glow, as if the
  data is held inside a polished gem. Frames are thin and refined (brushed warm
  metal / soft gold), never heavy.
- **Plasma-Current Power Flows:** connections are smooth, luminous gradient
  currents that flow between capsules — like gentle light streams or energy, with
  soft directional glow, never flat arrows or hard lines.

Keep it sophisticated, calm, and professional. NOT cartoonish, NOT clip-art,
NOT neon/gamer, NOT childish.

## PALETTE
- **Deep Ink** background: a rich, dark, near-charcoal navy that makes the
  capsules and currents glow.
- **Glacier Glass:** cool translucent whites/light-blues for capsule fills.
- **Warm Gold / Brushed Bronze:** for thin frames, accents, and key emphasis.
- **Plasma Teal & Soft Violet:** for the flowing current gradients.
- Text is crisp and high-contrast against its capsule (light text on dark fills,
  dark text on light fills). Every label must remain perfectly legible.

## ICONOGRAPHY & ILLUSTRATION
"Line-Art Meets Anatomy": refined, thin-stroke line illustrations with a tasteful
medical/scientific sensibility appropriate to the audience (anatomical motifs,
molecular/orbital models, clean schematic icons). Minimal, elegant, consistent
stroke weight. No mascots, no emoji, no cartoon faces.

## STRUCTURAL ELEMENTS
- Nodes → translucent jewel-box capsules with thin brushed-gold frames and soft
  depth/shadow; content sits clearly inside.
- Connections → luminous gradient "plasma" currents with soft glow and clear
  direction; spacing is generous and the composition breathes.
- Layout stays faithful to the source diagram's structure: keep EVERY node, EVERY
  label, and EVERY connection exactly as in the original. Do not add, remove,
  rename, or merge anything. Reproduce all text verbatim and keep it legible.

## CRUCIAL EXCLUSIONS
- **NO GLOBAL BLACK BORDER.** The entire composition must be borderless, or
  defined only by the internal data capsules and the deep background.
  ✓ Correct: capsules + currents float on the deep background, edge-to-edge.
  ✗ Wrong: a hard black rectangle/frame around the whole image.
- No watermarks, no logos, no signatures (branding is added separately).
- No global hard outline, no harsh drop-shadow box, no flat default arrows.`
