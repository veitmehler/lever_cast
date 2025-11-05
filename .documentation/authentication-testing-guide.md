# Authentication Testing Guide

**Date**: November 5, 2024  
**Status**: Production Mode Active with Clerk Authentication

---

## 🎯 Overview

This guide walks through testing the complete authentication flow in Levercast now that route protection is enabled.

---

## ✅ Pre-Testing Checklist

Before testing, ensure:
- [ ] Dev server is running (`npm run dev`)
- [ ] Clerk environment variables are configured in `.env`
- [ ] Google OAuth is set up in Clerk dashboard
- [ ] Browser has no cached auth state (use incognito for clean test)

---

## 🧪 Test Scenarios

### **Test 1: Public Routes Access (No Auth Required)**

#### Landing Page (`/`)
1. Open `http://localhost:3000`
2. **Expected**: Page loads without redirect
3. **Verify**: 
   - "Sign In" button visible in header
   - "Get Started" button visible in header
   - All CTAs point to `/sign-up`
   - Footer says "All rights reserved" (not "Design Mode")

#### Sign-In Page (`/sign-in`)
1. Navigate to `http://localhost:3000/sign-in`
2. **Expected**: Clerk SignIn component loads
3. **Verify**: Google OAuth button present

#### Sign-Up Page (`/sign-up`)
1. Navigate to `http://localhost:3000/sign-up`
2. **Expected**: Clerk SignUp component loads
3. **Verify**: Google OAuth button present

---

### **Test 2: Protected Routes (Auth Required)**

#### Accessing Dashboard Without Auth
1. Clear all auth cookies (use incognito window)
2. Navigate directly to `http://localhost:3000/dashboard`
3. **Expected**: Automatically redirected to `/sign-in`
4. **Verify**: URL changes to `/sign-in?redirect_url=...`

#### Accessing Other Protected Routes
Test each route:
- `/posts` → Should redirect to sign-in
- `/posts/[id]` → Should redirect to sign-in
- `/templates` → Should redirect to sign-in
- `/settings` → Should redirect to sign-in
- `/account` → Should redirect to sign-in

**Expected**: All redirect to `/sign-in` with appropriate redirect URL

---

### **Test 3: Sign-Up Flow**

#### New User Registration
1. Click "Get Started" on landing page
2. Click "Continue with Google"
3. Complete Google OAuth flow
4. **Expected After Sign-Up**:
   - User is redirected to `/dashboard`
   - ProtectedHeader shows user name/email
   - UserButton displays profile picture
   - User can access all protected routes

#### Verify User Data
1. Navigate to `/account`
2. **Expected**:
   - User profile picture displays
   - User name displays
   - User email displays
   - Join date displays
   - Stats load from localStorage (0 posts initially)

---

### **Test 4: Sign-In Flow**

#### Existing User Login
1. Sign out if currently signed in
2. Navigate to landing page
3. Click "Sign In" button
4. Click "Continue with Google"
5. Complete Google OAuth flow
6. **Expected After Sign-In**:
   - User is redirected to `/dashboard` (or previous attempted route)
   - All user data persists from localStorage
   - Drafts and templates are accessible

#### Redirect After Sign-In
1. Sign out
2. Try to access `/templates` directly (while logged out)
3. Get redirected to `/sign-in?redirect_url=/templates`
4. Sign in with Google
5. **Expected**: After sign-in, redirected back to `/templates`

---

### **Test 5: Sign-Out Flow**

#### User Sign-Out
1. While signed in, click UserButton (top-right)
2. Click "Sign Out" in dropdown
3. **Expected**:
   - User is signed out
   - Redirected to landing page (`/`)
   - Cannot access protected routes without signing in again

---

### **Test 6: Session Persistence**

#### Browser Refresh
1. Sign in successfully
2. Navigate to `/dashboard`
3. Refresh the page (F5 or Cmd+R)
4. **Expected**: User remains signed in, no redirect

#### New Tab
1. Sign in successfully
2. Open new tab
3. Navigate to `http://localhost:3000/dashboard`
4. **Expected**: User is already signed in (session shared across tabs)

#### Browser Close & Reopen
1. Sign in successfully
2. Close browser completely
3. Reopen browser
4. Navigate to `http://localhost:3000/dashboard`
5. **Expected**: User is still signed in (persistent session)

---

### **Test 7: Multi-Device Testing (Optional)**

#### Mobile Device
1. Connect mobile device to same network
2. Access `http://[your-local-ip]:3000`
3. Test sign-up/sign-in flow
4. **Verify**:
   - Mobile navigation (hamburger menu, bottom nav) works
   - OAuth flow works on mobile
   - Protected routes are secured

---

## 🐛 Common Issues & Solutions

### Issue 1: Middleware Not Protecting Routes
**Symptom**: Can access `/dashboard` without signing in  
**Solution**: 
- Check `src/middleware.ts` is using `clerkMiddleware`
- Verify environment variables are loaded
- Restart dev server

### Issue 2: Infinite Redirect Loop
**Symptom**: Keeps redirecting between `/sign-in` and `/dashboard`  
**Solution**:
- Check `NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in` in `.env`
- Verify `isPublicRoute` includes `/sign-in(.*)`
- Clear browser cookies and cache

### Issue 3: "Clerk: auth() was called but Clerk cannot be reached"
**Symptom**: Error in console  
**Solution**:
- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` in `.env`
- Check Clerk API keys are valid
- Ensure dev server restarted after adding env vars

### Issue 4: OAuth Callback Fails
**Symptom**: After Google OAuth, returns to sign-in page  
**Solution**:
- Check Clerk dashboard has correct redirect URLs
- Verify `http://localhost:3000` is whitelisted in Clerk
- Check catch-all routes exist: `/sign-in/[[...rest]]/page.tsx`

### Issue 5: UserButton Not Showing
**Symptom**: No user button in ProtectedHeader  
**Solution**:
- Check `ClerkProvider` wraps app in `Providers.tsx`
- Verify `useUser()` hook has access to Clerk context
- Ensure component is client-side (`'use client'`)

---

## 📝 Testing Checklist

### Public Routes
- [ ] Landing page loads without auth
- [ ] Sign-in page accessible
- [ ] Sign-up page accessible
- [ ] CTAs point to correct routes

### Route Protection
- [ ] Dashboard requires auth
- [ ] Posts page requires auth
- [ ] Templates page requires auth
- [ ] Settings page requires auth
- [ ] Account page requires auth

### Authentication Flow
- [ ] Sign-up with Google works
- [ ] Sign-in with Google works
- [ ] Redirects to correct page after sign-in
- [ ] Sign-out redirects to landing page

### User Experience
- [ ] ProtectedHeader shows user info
- [ ] UserButton displays profile picture
- [ ] Account page shows correct user data
- [ ] Session persists across page refreshes
- [ ] Session persists across browser tabs

### Error Handling
- [ ] No console errors after sign-in
- [ ] No infinite redirect loops
- [ ] OAuth callbacks work correctly
- [ ] Graceful handling of auth errors

---

## 🎯 Success Criteria

✅ **Authentication is fully functional when**:
1. Public routes (landing, sign-in, sign-up) are accessible without auth
2. Protected routes redirect unauthenticated users to sign-in
3. Sign-up with Google OAuth creates new user account
4. Sign-in with Google OAuth logs in existing user
5. After sign-in, user is redirected to intended destination
6. ProtectedHeader shows user name and profile picture
7. UserButton dropdown works (sign out functionality)
8. Sign-out redirects to landing page
9. Session persists across page refreshes and tabs
10. No console errors related to Clerk or authentication

---

## 🚀 Next Steps After Auth Testing

Once all tests pass:
1. ✅ **Authentication Complete** - Ready for database integration
2. 📊 **Database Migration** - Move localStorage data to PostgreSQL with Prisma
3. 🤖 **Real AI Integration** - Replace mock templates with actual LLM APIs
4. 📱 **Social Media OAuth** - Add LinkedIn and Twitter publishing
5. 🌐 **Production Deployment** - Deploy to Vercel

---

**Last Updated**: November 5, 2024  
**Status**: Ready for Testing  
**Next Milestone**: Database Integration

