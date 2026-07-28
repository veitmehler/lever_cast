=== Omniply Connect ===
Contributors: omniply
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

== Frequently Asked Questions ==

= Does this plugin collect any data? =

No. It stores one JSON option locally and prints it. Nothing is transmitted
anywhere by this plugin.

= Can it run arbitrary code? =

No. Input is parsed as JSON and re-encoded on output; anything that is not
valid JSON is rejected and never printed.

== Changelog ==

= 1.0.0 =
* Initial release: head JSON-LD printing + authenticated REST write route.
