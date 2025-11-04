# Troubleshooting Guide - Levercast

## Common Issues & Solutions

### Hydration Mismatch Warnings

**Symptom**: Console warnings about server/client HTML mismatch with references to browser extension attributes (e.g., `data-gr-ext-installed`).

**Cause**: Browser extensions (Grammarly, password managers, etc.) inject attributes into the HTML before React hydrates.

**Solution**: Added `suppressHydrationWarning` to `<html>` and `<body>` tags in root layout.

**Status**: ✅ Fixed in `src/app/layout.tsx`

---

### 500 Internal Server Error on Protected Routes

**Symptom**: Routes like `/dashboard` return 500 errors.

**Cause**: Server/client component mismatch with Clerk hooks or localStorage usage during SSR.

**Solutions Applied**:
1. Added `dynamic` prop to ClerkProvider
2. Added `mounted` state check in Sidebar component to prevent SSR issues with localStorage
3. Simplified protected layout to avoid Clerk hooks during SSR

**Status**: ✅ Fixed

---

### Sentry ERR_BLOCKED_BY_CLIENT Errors

**Symptom**: Console errors about blocked requests to Sentry.

**Cause**: Browser ad blockers or privacy extensions blocking analytics requests.

**Solution**: These are harmless and can be ignored in development. Remove Sentry or configure it properly in production.

**Status**: ⚠️ Informational (not blocking)

---

### Font Preload Warnings

**Symptom**: Console warnings about `.woff2` font files being preloaded but not used within a few seconds.

**Example**:
```
The resource http://localhost:3000/_next/static/media/93f479601ee12b01-s.p.woff2 
was preloaded using link preload but not used within a few seconds...
```

**Cause**: Next.js automatically preloads fonts for better performance. The warning appears because the fonts load slightly after the page renders, which is normal behavior.

**Why This Happens**:
- Next.js optimizes font loading with `next/font`
- Geist Sans and Geist Mono fonts are preloaded
- The browser reports timing between preload and actual font usage
- This is a performance optimization, not an error

**Impact**: None - fonts load correctly, pages render properly.

**Solution**: 
- **Recommended**: Ignore these warnings - they're informational only
- **Alternative**: You could remove font preloading, but this would hurt performance
- These warnings don't appear in production builds

**Status**: ⚠️ Informational (not blocking, expected behavior)

---

## Design Mode Notes

### Authentication Disabled
For prototyping, all routes are currently public. No sign-in required.

**To re-enable authentication**:
1. Edit `src/middleware.ts`
2. Remove extra routes from `isPublicRoute` array
3. Keep only: `'/'`, `'/sign-in(.*)'`, `'/sign-up(.*)'`

### Browser Extension Recommendations

For best development experience, consider:
- Disabling Grammarly on localhost
- Disabling auto-fill extensions on localhost
- Using an incognito window without extensions

---

## Key Files Modified for SSR/Hydration

1. **src/app/layout.tsx**
   - Added `suppressHydrationWarning`
   - Added `dynamic` prop to ClerkProvider

2. **src/components/Sidebar.tsx**
   - Added `mounted` state check
   - Prevents localStorage access during SSR

3. **src/middleware.ts**
   - Updated to Clerk v6 API (`clerkMiddleware`)
   - Made all routes public for design mode

4. **src/app/(protected)/layout.tsx**
   - Removed `useUser()` hook
   - Simplified for design mode

---

## Next.js Version Notes

**Current Version**: 15.5.6

**Known Quirks**:
- Strict hydration checking in development
- Browser extensions cause false-positive warnings
- SSR/CSR boundary requires careful component marking

---

**Last Updated**: November 4, 2024

