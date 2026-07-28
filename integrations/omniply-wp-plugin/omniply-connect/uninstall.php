<?php
// Clean up the single option on uninstall.
if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}
delete_option( 'omniply_head_jsonld' );
