# Omniply Connect — wordpress.org submission runbook

Why: the .org directory listing is what makes WP core's plugins REST endpoint
able to INSTALL + ACTIVATE the plugin on every connected clinic site with the
admin app password we already hold (zero-touch head-schema for all clinics,
page-builder-proof). Agent plan Phase 3.1b.

Steps (user):
1. Create/log into a wordpress.org account (suggest: the omniply brand account).
2. Zip the plugin folder: `cd integrations/omniply-wp-plugin && zip -r omniply-connect.zip omniply-connect`
3. Submit at https://wordpress.org/plugins/developers/add/ (upload the zip).
4. Review queue: typically days to a few weeks. Reviewers may email requesting
   changes — forward them; the plugin is deliberately minimal (print-only, one
   option, no external calls) precisely to sail through.
5. On approval you get SVN access — commit the same files to `trunk/` + tag
   `1.0.0` (I can prepare the SVN commands when the approval email arrives).

After it's live in the directory, platform-side adoption (separate build item):
- Provisioning calls `POST /wp-json/wp/v2/plugins {slug:"omniply-connect", status:"active"}`
- Then writes the entity block: `POST /wp-json/omniply/v1/head {jsonld:[...]}`
- Clinics with the plugin get head-level schema on EVERY page (ladder collapses);
  the body-fenced blocks remain as the no-plugin fallback.
