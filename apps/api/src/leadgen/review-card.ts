/**
 * QR review counter card (leadgen master-library plan Phase F, option C).
 *
 * A6 print card (105×148mm) for the front desk: brand colors, logo, fixed
 * copy (NO voice-rewrite pass — nothing here is prose), and a vector QR
 * generated at COMPILE time encoding the clinic's `socioply-review` trigger
 * link (GHL scan stats) with the direct Google review deep link as fallback.
 * Skipped (status 'disabled') for clinics without a resolved Place ID.
 */
import QRCode from 'qrcode'

/** Compile-time QR: crisp vector SVG, quiet zone kept for reliable scans. */
export async function qrSvg(url: string): Promise<string> {
  const svg = await QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', margin: 2 })
  return svg.replace(/<\?xml[^>]*\?>/, '').trim()
}

/** The card's HTML: {{brand.*}} tokens + a {{brand.reviewQrSvg}} slot the compiler fills. */
export function buildReviewCardHtml(): string {
  return `<!doctype html>
<html>
<head>
<meta charset="utf-8"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; }
  .card { width: 105mm; height: 148mm; background: {{brand.headerColor}}; color: #fff; display: flex; flex-direction: column; align-items: center; text-align: center; padding: 10mm 9mm 8mm; }
  .logo img { max-height: 12mm; max-width: 50mm; }
  .logo-fallback { font-size: 13px; font-weight: 700; letter-spacing: .5px; }
  h1 { font-size: 21px; line-height: 1.2; margin-top: 7mm; }
  .sub { font-size: 11.5px; line-height: 1.5; opacity: .9; margin-top: 3mm; max-width: 80mm; }
  .qr-wrap { background: #fff; border-radius: 3mm; padding: 4mm; margin-top: 7mm; width: 56mm; height: 56mm; }
  .qr-wrap svg { width: 100%; height: 100%; display: block; }
  .scan { margin-top: 4mm; font-size: 12px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; color: {{brand.accentColor}}; filter: brightness(1.6); }
  .foot { margin-top: auto; font-size: 9.5px; opacity: .85; line-height: 1.5; }
</style>
</head>
<body>
<div class="card">
  <div class="logo">
    <img src="{{brand.logoUrl}}" onerror="this.outerHTML='<div class=&quot;logo-fallback&quot;>{{brand.organizationName}}</div>'"/>
  </div>
  <h1>Enjoyed your visit?</h1>
  <p class="sub">A quick Google review takes 30 seconds and helps other people in our community find the care they need.</p>
  <div class="qr-wrap">{{brand.reviewQrSvg}}</div>
  <div class="scan">Scan to leave a review</div>
  <div class="foot">{{brand.organizationName}}<br/>{{brand.phone}} · {{brand.website}}</div>
</div>
</body>
</html>`
}
