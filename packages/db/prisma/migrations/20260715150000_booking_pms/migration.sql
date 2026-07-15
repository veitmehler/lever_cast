-- Onboarding additions (2026-07-15): universal booking CTA destination + PMS capture.
ALTER TABLE "brand_settings" ADD COLUMN "bookingUrl" TEXT;
ALTER TABLE "brand_settings" ADD COLUMN "pmsSystem" TEXT;
