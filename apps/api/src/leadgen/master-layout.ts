/**
 * Master lead-magnet layout (leadgen plan Phase 4 — the designed skeleton).
 *
 * One professionally-styled A4 print layout shared by every master document.
 * Content pours into <slot> elements; branding pours into {{brand.*}} tokens
 * at compile time. Building a new master from source text is mechanical:
 * `buildMasterHtml({ title, subtitle, sections, disclaimer })`.
 *
 * Design rules the compiler relies on:
 *  - fixed typography/spacing — the LLM never touches layout, only slot text;
 *  - every page carries the footer contact strip (position: fixed in print);
 *  - the cover uses the brand header color; accents use the accent color;
 *  - print CSS with explicit page breaks between cover / content / back page.
 */

export interface MasterSection {
  heading: string
  slotName: string
  defaultHtml: string // paragraphs/lists; becomes the slot's neutral text
  /** Optional highlighted tip box below the section body. */
  tipHtml?: string
}

export interface MasterDocSpec {
  title: string
  subtitle: string
  /** Opening paragraph(s); every real master should provide this. */
  introHtml?: string
  sections: MasterSection[]
  /** Compliance/disclaimer text — ALWAYS rewriteEligible: false. */
  disclaimerHtml: string
}

export function buildMasterHtml(spec: MasterDocSpec): string {
  const esc = (s: string) => s.replace(/</g, '&lt;')
  const sections = spec.sections
    .map(
      (s, i) => `
    <section class="content-section">
      <h2><span class="section-num">${i + 1}</span>${esc(s.heading)}</h2>
      <div class="section-body"><slot name="${s.slotName}">${s.defaultHtml}</slot></div>
      ${s.tipHtml ? `<aside class="tip-box"><span class="tip-label">Quick tip</span><slot name="${s.slotName}_tip">${s.tipHtml}</slot></aside>` : ''}
    </section>`,
    )
    .join('\n')

  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: {{brand.fontColor}}; }

  /* ── Cover ── */
  .cover { height: 297mm; background: {{brand.headerColor}}; color: #fff; display: flex; flex-direction: column; justify-content: space-between; padding: 28mm 22mm; page-break-after: always; }
  .cover .logo img { max-height: 22mm; max-width: 60mm; }
  .cover .logo-fallback { font-size: 20px; font-weight: 700; letter-spacing: .5px; }
  .cover h1 { font-size: 42px; line-height: 1.15; font-weight: 700; max-width: 150mm; }
  .cover .subtitle { margin-top: 8mm; font-size: 17px; line-height: 1.5; opacity: .92; max-width: 140mm; }
  .cover .cover-footer { font-size: 13px; opacity: .85; }
  .cover .accent-bar { width: 42mm; height: 2.5mm; background: {{brand.accentColor}}; margin: 10mm 0 0; border-radius: 2px; }

  /* ── Content pages ── */
  .content { padding: 20mm 22mm 34mm; }
  .content-section { margin-bottom: 11mm; page-break-inside: avoid; }
  h2 { color: {{brand.headerColor}}; font-size: 19px; margin-bottom: 4.5mm; display: flex; align-items: center; gap: 4mm; }
  .section-num { display: inline-flex; align-items: center; justify-content: center; width: 8.5mm; height: 8.5mm; border-radius: 50%; background: {{brand.accentColor}}; color: #fff; font-size: 13px; flex-shrink: 0; }
  .section-body { font-size: 13.5px; line-height: 1.65; }
  .section-body p { margin-bottom: 3.5mm; }
  .section-body ul, .section-body ol { margin: 2mm 0 3.5mm 6mm; }
  .section-body li { margin-bottom: 1.8mm; }
  .tip-box { background: color-mix(in srgb, {{brand.accentColor}} 9%, #ffffff); border-left: 1.2mm solid {{brand.accentColor}}; padding: 4mm 5mm; margin-top: 4mm; font-size: 12.5px; line-height: 1.55; border-radius: 0 2mm 2mm 0; }
  .tip-label { display: block; font-weight: 700; color: {{brand.accentColor}}; font-size: 11px; text-transform: uppercase; letter-spacing: .8px; margin-bottom: 1.5mm; }

  /* ── Per-page footer strip ── */
  .page-footer { position: fixed; bottom: 0; left: 0; right: 0; background: {{brand.headerColor}}; color: #fff; font-size: 10.5px; padding: 4mm 22mm; display: flex; justify-content: space-between; }

  /* ── Back page CTA ── */
  .back-page { page-break-before: always; min-height: 240mm; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 30mm 25mm; }
  .back-page h2 { justify-content: center; font-size: 24px; }
  .back-page .cta-btn { display: inline-block; margin-top: 8mm; background: {{brand.accentColor}}; color: #fff; padding: 5mm 12mm; border-radius: 3mm; font-size: 16px; font-weight: 600; }
  .back-page .contact { margin-top: 10mm; font-size: 13px; line-height: 1.9; color: {{brand.fontColor}}; }
  .disclaimer { margin-top: 14mm; font-size: 9.5px; line-height: 1.5; color: #777; max-width: 150mm; }
</style>
</head>
<body>

<div class="cover">
  <div class="logo">
    <img src="{{brand.logoUrl}}" onerror="this.outerHTML='<div class=&quot;logo-fallback&quot;>{{brand.organizationName}}</div>'"/>
  </div>
  <div>
    <h1>${esc(spec.title)}</h1>
    <div class="accent-bar"></div>
    <p class="subtitle"><slot name="cover_subtitle">${spec.subtitle}</slot></p>
  </div>
  <div class="cover-footer">Prepared for you by {{brand.organizationName}} · {{brand.website}}</div>
</div>

<div class="page-footer">
  <span>{{brand.organizationName}}</span>
  <span>{{brand.phone}} · {{brand.website}}</span>
</div>

<div class="content">
  <section class="content-section">
    <div class="section-body"><slot name="intro">${spec.introHtml ?? 'A short, warm introduction to this guide and who it helps.'}</slot></div>
  </section>
${sections}
</div>

<div class="back-page">
  <h2>Ready for the next step?</h2>
  <p class="section-body" style="max-width:130mm"><slot name="cta_paragraph">If anything in this guide sounds like you, we'd love to help you get moving comfortably again.</slot></p>
  <div class="cta-btn">{{brand.bookingCta}}</div>
  <div class="contact">
    <strong>{{brand.organizationName}}</strong><br/>
    {{brand.address}}<br/>
    {{brand.phone}} · {{brand.email}}<br/>
    {{brand.website}}
  </div>
  <p class="disclaimer">${spec.disclaimerHtml}</p>
</div>

</body>
</html>`
}

/** Default slot metadata for a master built with this layout. */
export function defaultSlotMeta(spec: MasterDocSpec): Record<string, { maxChars?: number; rewriteEligible: boolean }> {
  const meta: Record<string, { maxChars?: number; rewriteEligible: boolean }> = {
    cover_subtitle: { maxChars: 260, rewriteEligible: true },
    intro: { maxChars: 900, rewriteEligible: true },
    cta_paragraph: { maxChars: 420, rewriteEligible: true },
  }
  for (const s of spec.sections) {
    meta[s.slotName] = { maxChars: 2200, rewriteEligible: true }
    if (s.tipHtml) meta[`${s.slotName}_tip`] = { maxChars: 420, rewriteEligible: true }
  }
  return meta
}
