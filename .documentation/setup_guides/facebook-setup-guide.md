# Meta (Facebook & Instagram) Connection Guide

This walkthrough covers connecting Facebook Pages (and Instagram Business accounts via Meta) to Levercast.

## Prerequisites
- You must be an admin of the Facebook Page (and linked Instagram Business account, if applicable).
- Our Meta app must be in **Live** mode with the “Manage everything on your Page” use case approved (handled centrally by Levercast).
- Pop-ups enabled in your browser.

## Step-by-Step
1. **Open Settings in Levercast**
   - Visit `/settings`.

2. **Connect Facebook**
   - In “Connected Accounts,” find Facebook and click `Connect`.
   - A Meta popup opens; log in if needed.
   - Grant the requested permissions: `public_profile`, `business_management`, `pages_show_list`, `pages_manage_posts`, `pages_read_engagement`.

3. **Select Pages**
   - After granting permissions, Meta returns the list of pages you manage.
   - In Levercast, choose which page to use for publishing.

4. **Instagram (optional)**
   - If your Instagram Business account is linked to that Facebook Page, the same connection works for Instagram publishing.
   - Set the post target accordingly in Levercast settings.

## Troubleshooting
- **Popup blocked:** allow pop-ups for Levercast and retry.
- **No pages shown:** ensure you’re a Page admin and granted all permissions when Meta prompted “What this app can do.”
- **Permissions missing:** if Meta revoked permissions, disconnect in Levercast and reconnect to refresh scopes.
- **Publishing failures:** verify the page remains connected in Facebook Business settings and regenerate the token by reconnecting.

## Next Steps
- Drafts or scheduled posts that include Facebook/Instagram will now publish to the selected page.
- You can change the target page anytime in Settings without redoing OAuth, as long as the authorization is still valid.

