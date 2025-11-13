# Facebook Test User Workaround

## Why Test Users Are Disabled

Facebook has **temporarily disabled** the ability to create test users. This has been an ongoing issue for an extended period, and there's no official timeline for when this feature will be restored.

## Workaround: Add Real Users as Testers

Instead of creating test users, you can add **real Facebook accounts** as testers or developers to your app. These users will be able to test your app without requiring App Review.

### Method 1: Add Users as App Roles (Recommended)

1. Go to [Facebook Developers](https://developers.facebook.com/apps)
2. Select your app
3. Navigate to **Roles** → **Roles** (in the left sidebar)
4. Click **Add People**
5. Enter the Facebook email address or name of the person you want to add
6. Select their role:
   - **Administrator**: Full access to app settings
   - **Developer**: Can edit app settings and view insights
   - **Tester**: Can test the app (recommended for testing)
   - **Analyst**: Can view insights only
7. Click **Add**
8. The person will receive an invitation email and must accept it

### Method 2: Add Users via Business Manager (For Business Apps)

If your app is associated with a Business Manager:

1. Go to [Business Manager](https://business.facebook.com/)
2. Navigate to **Business Settings** → **Users** → **People**
3. Add the person to your business
4. Assign them a role on your app

## Testing with Real Accounts

Once you've added users as testers:

1. **They can log in** to your app using their real Facebook account
2. **They can grant permissions** without App Review (because they have a role on the app)
3. **They can test all features** that would normally require App Review

### Important Notes

- **Development Mode**: Your app must be in **Development Mode** for testers to use it
- **Permissions**: Testers can grant permissions without App Review
- **Real Accounts**: These are real Facebook accounts, not test accounts
- **Limitation**: You can't create fake/test data with these accounts

## Alternative: Use Your Own Account

The simplest option for initial testing:

1. **Use your own Facebook account** (the one you used to create the app)
2. You automatically have **Administrator** role
3. You can test all features immediately
4. No need to add anyone else

## For Production Testing

If you need to test with users who don't have app roles:

1. **Submit for App Review**: Go through the App Review process
2. **Request Permissions**: Request the permissions you need (`pages_manage_posts`, etc.)
3. **Once Approved**: Any Facebook user can use your app

## Current Status

- **Test User Creation**: ❌ Disabled (temporarily)
- **Add Real Users as Testers**: ✅ Available
- **Use Your Own Account**: ✅ Available
- **App Review**: ✅ Available (for production)

## References

- [Facebook App Roles Documentation](https://developers.facebook.com/docs/development/build-and-test/app-roles)
- [Facebook App Modes](https://developers.facebook.com/docs/development/build-and-test/app-modes)

