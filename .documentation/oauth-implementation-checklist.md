# OAuth & Publishing Implementation Checklist

## Step 1: Set Up LinkedIn Developer App

1. **Go to LinkedIn Developers**
   - Visit: https://www.linkedin.com/developers/
   - Sign in with your LinkedIn account

2. **Create a New App**
   - Click "Create app"
   - Fill in:
     - **App name**: LeverCast (or your app name)
     - **LinkedIn Page**: Select or create a LinkedIn Page
     - **Privacy Policy URL**: `https://yourdomain.com/privacy` (or placeholder)
     - **App logo**: Upload a logo (optional)
   - Accept terms and click "Create app"

3. **Configure OAuth Settings**
   - Go to "Auth" tab
   - Under "Redirect URLs", add:
     ```
     http://localhost:3000/api/social/linkedin/callback
     https://yourdomain.com/api/social/linkedin/callback
     ```
   - Under "Products", request access to:
     - ✅ **Sign In with LinkedIn using OpenID Connect**
     - ✅ **Share on LinkedIn** (for posting)

4. **Get Your Credentials**
   - Go to "Auth" tab
   - Copy:
     - **Client ID**
     - **Client Secret** (click "Show" to reveal)

5. **Submit for Verification** (if needed)
   - Some scopes require LinkedIn approval
   - This can take a few days
   - For testing, you can use your own account without approval

---

## Step 2: Set Up Twitter/X Developer App

1. **Go to Twitter Developer Portal**
   - Visit: https://developer.twitter.com/
   - Sign in with your Twitter/X account

2. **Create a New App**
   - Go to "Developer Portal" → "Projects & Apps"
   - Click "Create Project" or "Create App"
   - Fill in:
     - **App name**: LeverCast (or your app name)
     - **App environment**: Development (or Production)
   - Accept terms

3. **Configure OAuth 2.0 Settings**
   - Go to your app → "Settings" → "User authentication settings"
   - Click "Set up"
   - Configure:
     - **App permissions**: Read and write (for posting)
     - **Type of App**: Web App
     - **Callback URI / Redirect URL**: 
       ```
       http://localhost:3000/api/social/twitter/callback
       https://yourdomain.com/api/social/twitter/callback
       ```
     - **Website URL**: `https://yourdomain.com`
   - Click "Save"

4. **Get Your Credentials**
   - Go to "Keys and tokens" tab
   - Copy:
     - **Client ID**
     - **Client Secret** (click "Regenerate" if needed)

5. **Request Elevated Access** (if needed)
   - For posting tweets, you may need Elevated access
   - Go to "Developer Portal" → "Apply" → "Elevated"
   - Fill out the application form
   - Approval can take a few days

---

## Step 3: Add Environment Variables

1. **Create/Update `.env.local` file** (in project root)
   ```env
   # LinkedIn OAuth (Application-level credentials)
   LINKEDIN_CLIENT_ID=your_linkedin_client_id_here
   LINKEDIN_CLIENT_SECRET=your_linkedin_client_secret_here
   LINKEDIN_REDIRECT_URI=http://localhost:3000/api/social/linkedin/callback

   # Twitter/X OAuth (Application-level credentials)
   TWITTER_CLIENT_ID=your_twitter_client_id_here
   TWITTER_CLIENT_SECRET=your_twitter_client_secret_here
   TWITTER_REDIRECT_URI=http://localhost:3000/api/social/twitter/callback

   # App URL
   NEXT_PUBLIC_APP_URL=http://localhost:3000

   # Other existing variables...
   DATABASE_URL=...
   CLERK_SECRET_KEY=...
   ```

2. **For Production** (when deploying to Vercel):
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all the above variables
   - Update `NEXT_PUBLIC_APP_URL` to your production domain
   - Update redirect URIs to production URLs

**Note:** Make sure `.env` is in your `.gitignore` to avoid committing secrets!

---

## Step 4: Test OAuth Connection (Local)

1. **Start Development Server**
   ```bash
   npm run dev
   ```

2. **Test LinkedIn Connection**
   - Go to: http://localhost:3000/settings
   - Scroll to "Connected Accounts"
   - Click "Connect" next to LinkedIn
   - You should be redirected to LinkedIn authorization page
   - Authorize the app
   - You should be redirected back to Settings with "LinkedIn connected" message
   - Verify connection appears in the list

3. **Test Twitter/X Connection**
   - Click "Connect" next to Twitter/X
   - You should be redirected to Twitter authorization page
   - Authorize the app
   - You should be redirected back to Settings
   - Verify connection appears in the list

4. **Verify Database**
   - Check your database `social_connections` table
   - Should see entries with:
     - `userId`: Your user ID
     - `platform`: "linkedin" or "twitter"
     - `accessToken`: Encrypted token
     - `platformUsername`: Your LinkedIn/Twitter username

---

## Step 5: Test Publishing

1. **Create a Test Post**
   - Go to: http://localhost:3000/dashboard
   - Enter a test idea
   - Select platform (LinkedIn or Twitter)
   - Click "Generate"

2. **Publish to LinkedIn**
   - Click "Publish" on the LinkedIn preview
   - Should see success message
   - Check your LinkedIn feed - post should appear
   - Verify post URL is saved in database

3. **Publish to Twitter/X**
   - Click "Publish" on the Twitter preview
   - Should see success message
   - Check your Twitter feed - tweet should appear
   - Verify post URL is saved in database

4. **Test Twitter Thread**
   - Generate a Twitter post
   - Select "Thread" format
   - Generate content
   - Click "Publish"
   - Verify summary tweet and replies appear on Twitter

---

## Step 6: Test Scheduled Publishing

1. **Schedule a Post**
   - Create a post
   - Click "Schedule" instead of "Publish"
   - Set a time 1-2 minutes in the future
   - Save

2. **Trigger Scheduled Publishing**
   - Wait for the scheduled time, OR
   - Manually call the cron endpoint:
     ```bash
     curl http://localhost:3000/api/posts/publish-scheduled
     ```

3. **Verify**
   - Post should appear on the platform at scheduled time
   - Post status should change from "scheduled" to "published" in database

---

## Step 7: Production Deployment

1. **Update Environment Variables in Vercel**
   - Add all OAuth credentials
   - Update `NEXT_PUBLIC_APP_URL` to production domain
   - Update redirect URIs in LinkedIn/Twitter apps to production URLs

2. **Update Redirect URIs in Developer Portals**
   - LinkedIn: Add `https://yourdomain.com/api/social/linkedin/callback`
   - Twitter: Add `https://yourdomain.com/api/social/twitter/callback`

3. **Deploy**
   ```bash
   git add .
   git commit -m "Add OAuth and publishing integration"
   git push
   ```

4. **Test Production**
   - Test OAuth connection on production
   - Test publishing on production
   - Verify scheduled posts work

---

## Troubleshooting

### "OAuth not configured" Error
- Check environment variables are set correctly
- Restart dev server after adding env vars
- Verify Client ID and Secret are correct

### "Redirect URI mismatch" Error
- Ensure redirect URI in `.env` matches exactly what's in developer portal
- Check for trailing slashes
- Verify protocol (http vs https)

### "Account not connected" Error
- User needs to connect account first
- Check database for connection record
- Verify tokens are stored correctly

### Publishing Fails
- Check OAuth tokens are valid
- Verify API permissions/scopes are granted
- Check platform API status
- Review error logs in console

### LinkedIn Post Fails
- Ensure "Share on LinkedIn" product is approved
- Check you have `w_member_social` scope
- Verify LinkedIn Page is linked to app

### Twitter Post Fails
- Ensure app has "Read and write" permissions
- Check Elevated access is approved (if needed)
- Verify scopes include `tweet.write`

---

## Next Steps After Testing

1. ✅ OAuth flow working
2. ✅ Publishing working
3. ⏳ Implement token refresh (when tokens expire)
4. ⏳ Add LinkedIn image upload support
5. ⏳ Add error notifications for users
6. ⏳ Add retry logic for failed posts
7. ⏳ Set up monitoring/alerts for publishing failures

---

## Quick Test Checklist

- [ ] LinkedIn app created and configured
- [ ] Twitter app created and configured
- [ ] Environment variables added to `.env.local`
- [ ] LinkedIn OAuth connection works
- [ ] Twitter OAuth connection works
- [ ] LinkedIn post publishes successfully
- [ ] Twitter post publishes successfully
- [ ] Twitter thread publishes successfully
- [ ] Scheduled posts work
- [ ] Production environment variables set
- [ ] Production redirect URIs configured

