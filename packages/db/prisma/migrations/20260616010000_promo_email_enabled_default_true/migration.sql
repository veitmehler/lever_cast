-- Promotional email is now opt-out: new ghl_settings default to enabled.
-- (Existing rows are intentionally left as-is; only the column default changes.)
ALTER TABLE "ghl_settings" ALTER COLUMN "promoEmailEnabled" SET DEFAULT true;
