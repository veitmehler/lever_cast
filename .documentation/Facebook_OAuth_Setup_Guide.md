# Facebook OAuth Setup Guide

## Issues Found

### Issue 1: Invalid Scopes Error
**Error**: `Invalid Scopes: pages_manage_posts, pages_read_engagement, pages_show_list`

**Solution**: Added `public_profile` scope (required for Facebook Login). The scopes have been updated in the code.

### Issue 2: App Domain Configuration
**Error**: `Can't Load URL - The domain of this URL isn't included in the app's domains`

**Solution**: Add your domain to Facebook App Settings.

## Step-by-Step Fix Instructions

### Step 1: Update Facebook App Settings

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Select your Facebook app
3. Navigate to **Settings** → **Basic** (in the left sidebar)

#### Add App Domain

1. Scroll down to **App Domains**
2. Add your domain (without `http://` or `https://`):
   - For local development: `localhost`
   - For production: Your production domain (e.g., `yourdomain.com`)
   - **Important**: Add both if you're testing locally and deploying

#### Add OAuth Redirect URI

1. Scroll down to **Facebook Login** → **Settings** (or go to **Products** → **Facebook Login** → **Settings**)
2. Under **Valid OAuth Redirect URIs**, add:
   - For local development: `http://localhost:3000/api/social/facebook/callback`
   - For production: `https://yourdomain.com/api/social/facebook/callback`
   - **Important**: Add both if you're testing locally and deploying

#### Configure Use Case (Important!)

1. Go to **Use Cases** in the left sidebar
2. Find **"Manage everything on your Page"** or **"Administrar todos los aspectos de tu página"**
3. Click **Customize** or **Set Up**
4. This will enable the Page permissions (`pages_manage_posts`, `pages_read_engagement`, `pages_show_list`)

**Alternative**: If you don't see the use case option:
1. Go to **Products** → **Add Product**
2. Look for **"Manage everything on your Page"** or similar
3. Add it to your app

### Step 2: Verify Environment Variables

Make sure your `.env.local` file has:

```env
FACEBOOK_CLIENT_ID=your_app_id
FACEBOOK_CLIENT_SECRET=your_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/social/facebook/callback
```

**For production**, update `FACEBOOK_REDIRECT_URI` to your production URL.

### Step 3: App Review (For Production)

**Note**: These permissions (`pages_manage_posts`, `pages_read_engagement`, `pages_show_list`) require **App Review** before they work for users who don't have a role in your app.

**For Development/Testing**:
- You can test with users who have a role in your app (developers, testers)
- Add test users in **Roles** → **Test Users** or **Roles** → **Roles**

**For Production**:
- You'll need to submit your app for review
- Go to **App Review** → **Permissions and Features**
- Request review for:
  - `pages_manage_posts`
  - `pages_read_engagement`
  - `pages_show_list`

## Updated Scopes

The code has been updated to include `public_profile` as the first scope:

```
public_profile,pages_show_list,pages_manage_posts,pages_read_engagement
```

## Testing

After making these changes:

1. **Restart your dev server** (if running)
2. Try connecting Facebook again
3. You should see the Facebook login dialog
4. After authorizing, you should be redirected back to your app

## Troubleshooting

### Still Getting "Invalid Scopes" Error?

1. **Check Use Case**: Make sure "Manage everything on your Page" use case is added to your app
2. **Check App Mode**: Make sure your app is in **Development Mode** (for testing) or **Live Mode** (for production)
3. **Check Permissions**: In **App Review** → **Permissions and Features**, verify the permissions are listed

### Still Getting "App Domain" Error?

1. **Check Redirect URI**: Make sure the exact URL matches what's in your Facebook app settings
2. **Check Protocol**: Make sure you're using `http://` for localhost and `https://` for production
3. **Check Port**: Make sure the port number matches (e.g., `:3000` for Next.js dev server)

### Permissions Not Showing Up?

1. **Add Use Case**: Make sure you've added the "Manage everything on your Page" use case
2. **Check App Type**: Some permissions are only available for certain app types
3. **Check App Review Status**: Some permissions require App Review even for testing

## References

- [Facebook Login Documentation](https://developers.facebook.com/docs/facebook-login/)
- [Pages API Permissions](https://developers.facebook.com/docs/pages/overview#permissions)
- [App Review Guide](https://developers.facebook.com/docs/app-review)

