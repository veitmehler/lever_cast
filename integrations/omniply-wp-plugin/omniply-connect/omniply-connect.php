<?php
/**
 * Plugin Name: Omniply Connect
 * Plugin URI:  https://omniply.io
 * Description: Prints the structured-data (JSON-LD) block managed by your Omniply marketing platform in the site head. Print-only: this plugin executes no remote code and stores a single validated JSON option.
 * Version:     1.0.0
 * Requires at least: 5.5
 * Requires PHP: 7.4
 * Author:      Omniply
 * Author URI:  https://omniply.io
 * License:     GPLv2 or later
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: omniply-connect
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

define( 'OMNIPLY_CONNECT_OPTION', 'omniply_head_jsonld' );

/**
 * Echo the stored JSON-LD in wp_head. The option is stored as a JSON string of
 * an ARRAY of schema objects; it is re-validated on output so nothing that is
 * not valid JSON can ever reach the page.
 */
function omniply_connect_print_head() {
	$raw = get_option( OMNIPLY_CONNECT_OPTION, '' );
	if ( ! is_string( $raw ) || '' === trim( $raw ) ) {
		return;
	}
	$decoded = json_decode( $raw, true );
	if ( null === $decoded || ! is_array( $decoded ) ) {
		return;
	}
	// Re-encode from the decoded structure: output is guaranteed pure JSON.
	// (PHP 7.4-safe list check — array_is_list() is 8.1+.)
	$is_list = array_keys( $decoded ) === range( 0, count( $decoded ) - 1 );
	echo "\n<!-- Omniply Connect -->\n";
	foreach ( ( $is_list ? $decoded : array( $decoded ) ) as $schema ) {
		if ( ! is_array( $schema ) ) {
			continue;
		}
		echo '<script type="application/ld+json">' . wp_json_encode( $schema ) . "</script>\n";
	}
	echo "<!-- /Omniply Connect -->\n";
}
add_action( 'wp_head', 'omniply_connect_print_head', 20 );

/**
 * REST route so the connected platform can update the block with the site's
 * existing Application Password credentials. Requires manage_options.
 */
function omniply_connect_register_routes() {
	register_rest_route(
		'omniply/v1',
		'/head',
		array(
			array(
				'methods'             => 'POST',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
				'callback'            => function ( WP_REST_Request $request ) {
					$jsonld = $request->get_param( 'jsonld' );
					if ( null === $jsonld || '' === $jsonld ) {
						delete_option( OMNIPLY_CONNECT_OPTION );
						return rest_ensure_response( array( 'cleared' => true ) );
					}
					if ( ! is_string( $jsonld ) ) {
						$jsonld = wp_json_encode( $jsonld );
					}
					$decoded = json_decode( $jsonld, true );
					if ( null === $decoded || ! is_array( $decoded ) ) {
						return new WP_Error( 'omniply_invalid_json', 'jsonld must be valid JSON (object or array of objects).', array( 'status' => 400 ) );
					}
					if ( strlen( $jsonld ) > 65535 ) {
						return new WP_Error( 'omniply_too_large', 'jsonld exceeds 64KB.', array( 'status' => 400 ) );
					}
					update_option( OMNIPLY_CONNECT_OPTION, wp_json_encode( $decoded ), false );
					return rest_ensure_response( array( 'saved' => true ) );
				},
			),
			array(
				'methods'             => 'GET',
				'permission_callback' => function () {
					return current_user_can( 'manage_options' );
				},
				'callback'            => function () {
					return rest_ensure_response( array( 'jsonld' => get_option( OMNIPLY_CONNECT_OPTION, '' ) ) );
				},
			),
		)
	);
}
add_action( 'rest_api_init', 'omniply_connect_register_routes' );
