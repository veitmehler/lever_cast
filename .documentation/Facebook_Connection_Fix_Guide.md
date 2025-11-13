# Facebook Connection Fix Guide

## Current Issues

### Issue 1: Invalid Scopes Error
**Error**: `Invalid Scopes: pages_show_list, pages_manage_posts, pages_read_engagement`

**Root Cause**: The "Manage everything on your Page" use case is not added to your Facebook app, OR the required `business_management` permission is missing.

**Solution**: 
1. Add the "Manage everything on your Page" use case to your app
2. The code has been updated to include `business_management` permission

### Issue 2: App Domain Error
**Error**: `Can't Load URL - The domain of this URL isn't included in the app's domains`

**Root Cause**: Your redirect URL domain is not configured in Facebook App Settings.

**Solution**: Add your domain and redirect URI to Facebook App Settings (see steps below).

## Step-by-Step Fix Instructions

### Step 1: Add "Manage everything on your Page" Use Case

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Select your Facebook app
3. Look for **Use Cases** in the left sidebar (or go to **Products** → **Add Product**)
4. Find **"Manage everything on your Page"** (or **"Administrar todos los aspectos de tu página"**)
5. Click **Add** or **Set Up**
6. This will automatically add the required permissions:
   - `business_management` (required)
   - `pages_show_list` (required)
   - `public_profile` (required)
   - `pages_manage_engagement` (optional, added by default)

**If you don't see this use case:**
- Your app might have been created without a use case
- Go to **Products** → **Add Product**
- Look for **"Manage everything on your Page"**
- Add it to your app

### Step 2: Configure App Domain

1. Go to **Settings** → **Basic** (in the left sidebar)
2. Scroll down to **App Domains**
3. Add your domain(s):
   - For local development: `localhost`
   - For production: Your production domain (e.g., `yourdomain.com`)
   - **Important**: Add both if you're testing locally and deploying

### Step 3: Configure OAuth Redirect URI

1. Go to **Products** → **Facebook Login** → **Settings** (in the left sidebar)
2. Under **Valid OAuth Redirect URIs**, add:
   - For local development: `http://localhost:3000/api/social/facebook/callback`
   - For production: `https://yourdomain.com/api/social/facebook/callback`
   - **Important**: Add both if you're testing locally and deploying
3. Click **Save Changes**

### Step 4: Verify Environment Variables

Make sure your `.env.local` file has:

```env
FACEBOOK_CLIENT_ID=your_app_id
FACEBOOK_CLIENT_SECRET=your_app_secret
FACEBOOK_REDIRECT_URI=http://localhost:3000/api/social/facebook/callback
```

**For production**, update `FACEBOOK_REDIRECT_URI` to your production URL.

### Step 5: Restart Your Dev Server

After making changes to Facebook App Settings:

1. Restart your Next.js dev server
2. Clear your browser cache/cookies (optional but recommended)
3. Try connecting Facebook again

## Updated Scopes

The code has been updated to include `business_management`:

```
public_profile,business_management,pages_show_list,pages_manage_posts,pages_read_engagement
```

## Verification Checklist

After completing the steps above, verify:

- [ ] "Manage everything on your Page" use case is added to your app
- [ ] App Domain is configured (`localhost` for dev, your domain for production)
- [ ] OAuth Redirect URI is configured (exact URL matching your callback)
- [ ] Environment variables are set correctly
- [ ] Dev server has been restarted

## Troubleshooting

### Still Getting "Invalid Scopes" Error?

1. **Check Use Case**: Make sure "Manage everything on your Page" is added
   - Go to **Use Cases** → Verify it's listed
   - If not, add it via **Products** → **Add Product**

2. **Check App Mode**: Make sure your app is in **Development Mode**
   - Look for the mode indicator at the top of your app dashboard
   - Should say "Development Mode" or "Modo de desarrollo"

3. **Check Permissions**: In **App Review** → **Permissions and Features**
   - Verify `business_management`, `pages_show_list`, `pages_manage_posts`, `pages_read_engagement` are listed
   - They should be available even without App Review (for users with app roles)

### Still Getting "App Domain" Error?

1. **Check Redirect URI**: Make sure the exact URL matches:
   - Protocol: `http://` for localhost, `https://` for production
   - Port: `:3000` for Next.js dev server
   - Path: `/api/social/facebook/callback` (exact match required)

2. **Check App Domain**: 
   - For localhost: Just `localhost` (no `http://` or port)
   - For production: Just the domain (e.g., `yourdomain.com`, no `https://`)

3. **Save Changes**: Make sure you clicked **Save Changes** after adding the redirect URI

### Permissions Not Available?

1. **Add Use Case First**: The use case must be added before permissions become available
2. **Check App Type**: Some permissions are only available for certain app types
3. **Development Mode**: Permissions work for users with app roles in Development Mode

## Important Notes

- **Development Mode**: Your app must be in Development Mode for testing
- **App Roles**: Only users with roles (developers, testers, administrators) can use the app in Development Mode
- **App Review**: These permissions require App Review for production users, but work for users with app roles without review

## References

- [Facebook Use Cases Documentation](https://developers.facebook.com/docs/development/create-an-app/app-dashboard/use-cases)
- [Pages API Permissions](https://developers.facebook.com/docs/pages/overview#permissions)
- [Facebook Login Settings](https://developers.facebook.com/docs/facebook-login/web)

