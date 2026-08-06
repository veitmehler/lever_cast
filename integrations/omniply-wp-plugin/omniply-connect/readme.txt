=== Omniply Connect ===
Contributors: veitmehler
Tags: schema, structured data, json-ld, seo
Requires at least: 5.5
Tested up to: 7.0
Requires PHP: 7.4
Stable tag: 1.0.0
License: GPLv2 or later
License URI: https://www.gnu.org/licenses/gpl-2.0.html

Prints the structured-data (JSON-LD) block managed by your Omniply marketing platform in the site head.

== Description ==

Omniply Connect is a deliberately minimal companion plugin for clinics using the
Omniply marketing platform. It does exactly one thing: it prints a validated
JSON-LD structured-data block (your clinic's name, address, opening hours,
booking link and FAQ) in your site's head, where search engines and AI answer
surfaces read it.

* Print-only: the plugin never executes remote code, loads no external scripts,
  and phones home to nothing.
* One option: the entire plugin state is a single validated JSON string.
* Updated by your platform: the block is written through the WordPress REST API
  using the same Application Password connection you created for publishing —
  administrator capability (`manage_options`) is required.
* No settings screen, no dashboard widgets, no notices. Deactivate or uninstall
  at any time; uninstalling removes the stored option.

This plugin is intended for Omniply customers, but the stored block is plain
schema.org JSON-LD — you can inspect it at any time under the
`omniply_head_jsonld` option or via `GET /wp-json/omniply/v1/head` (as an
administrator).

== Installation ==

1. Install the plugin through Plugins → Add New (or upload the ZIP via
   Plugins → Add New → Upload Plugin) and activate it.
2. No further setup is needed on the site itself: the plugin has no settings
   screen and stores no data on activation.
3. IMPORTANT — the plugin prints nothing until a structured-data block has
   been written to it. On a fresh activation the stored option is empty, and
   an empty option produces NO output in the page source. This is by design
   (print-only, empty state = silent).

The block is written in one of two ways:

* Automatically, by the Omniply platform: when you connect your site in
  Omniply using a WordPress Application Password for an administrator
  account, the platform posts your clinic's JSON-LD to
  `POST /wp-json/omniply/v1/head`. From then on the block appears in your
  site head and is kept up to date whenever your details change.
* Manually, by any administrator — useful for testing that the plugin works
  without an Omniply account. For example, with WP-CLI:

  `wp option update omniply_head_jsonld '[{"@context":"https://schema.org","@type":"MedicalClinic","name":"Test Clinic"}]'`

  or over REST with an Application Password:

  `curl -X POST 'https://YOURSITE/?rest_route=/omniply/v1/head' -u 'admin:APP_PASSWORD' -H 'Content-Type: application/json' -d '{"jsonld":[{"@context":"https://schema.org","@type":"MedicalClinic","name":"Test Clinic"}]}'`

After either of these, reload any front-end page and view the source: the
block appears in the head between `<!-- Omniply Connect -->` markers. Sending
an empty `jsonld` value (or deleting the option) removes the output again.

== Frequently Asked Questions ==

= I activated the plugin but there is no JSON-LD in my page source =

That is the expected state of a fresh install. The plugin only prints the
block after one has been written to it — either by the connected Omniply
platform or manually by an administrator (see Installation). While the
stored option is empty, the plugin outputs nothing at all.

= Does this plugin collect any data? =

No. It stores one JSON option locally and prints it. Nothing is transmitted
anywhere by this plugin.

= Can it run arbitrary code? =

No. Input is parsed as JSON and re-encoded on output; anything that is not
valid JSON is rejected and never printed.

== Changelog ==

= 1.0.0 =
* Initial release: head JSON-LD printing + authenticated REST write route.
