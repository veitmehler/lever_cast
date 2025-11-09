# How to Find Supabase Environment Variables

## Step-by-Step Instructions

### 1. Navigate to API Settings

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (the one you're using for Levercast)
3. In the left sidebar, click **"Project Settings"** (gear icon)
4. In the submenu that appears, click **"API"**

### 2. Find Your Keys

You should now see a page with several sections:

#### **Project URL**
- Look for **"Project URL"** or **"Reference ID"**
- It looks like: `https://xxxxxxxxxxxxx.supabase.co`
- This is your `NEXT_PUBLIC_SUPABASE_URL`

#### **API Keys Section**
You'll see several keys listed:

1. **anon public** (or **anon key**)
   - This is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - It's safe to expose in client-side code
   - Click the eye icon to reveal it, or click "Reveal" button

2. **service_role** (or **service_role key**)
   - This is your `SUPABASE_SERVICE_ROLE_KEY`
   - ⚠️ **Keep this secret!** Never commit to git
   - Click "Reveal" to see it

### 3. Copy the Values

Copy each value and add them to your `.env` file:

```bash
# Supabase Storage
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Visual Guide

The page should look something like this:

```
┌─────────────────────────────────────────┐
│ Project Settings                        │
├─────────────────────────────────────────┤
│                                         │
│  Project URL                            │
│  ┌─────────────────────────────────┐   │
│  │ https://xxxxx.supabase.co      │   │
│  └─────────────────────────────────┘   │
│                                         │
│  API Keys                               │
│                                         │
│  anon public                            │
│  ┌─────────────────────────────────┐   │
│  │ eyJhbGciOiJIUzI1NiIsInR5cCI... │   │
│  │ [Reveal] [Copy]                 │   │
│  └─────────────────────────────────┘   │
│                                         │
│  service_role                           │
│  ┌─────────────────────────────────┐   │
│  │ eyJhbGciOiJIUzI1NiIsInR5cCI... │   │
│  │ [Reveal] [Copy]                 │   │
│  └─────────────────────────────────┘   │
│                                         │
└─────────────────────────────────────────┘
```

---

## Alternative: If You Don't See "API" Option

If you don't see "API" in the Project Settings submenu:

1. Make sure you're logged in to Supabase
2. Make sure you've selected the correct project
3. Try this direct URL pattern:
   ```
   https://supabase.com/dashboard/project/[your-project-ref]/settings/api
   ```
   (Replace `[your-project-ref]` with your project reference ID)

---

## Quick Check

After adding the variables, verify they're set:

```bash
# In your terminal, run:
grep SUPABASE .env
```

You should see:
- `NEXT_PUBLIC_SUPABASE_URL=...`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=...`
- `SUPABASE_SERVICE_ROLE_KEY=...` (if you added it)

---

## Still Can't Find It?

If you're still having trouble:

1. **Check you're in the right project**: Make sure you selected the Supabase project that matches your `DATABASE_URL` in `.env`

2. **Check your project reference**: Your `DATABASE_URL` contains your project reference. For example:
   ```
   postgresql://postgres.gmjzvhviihsjpzipocxe:...
   ```
   The part after `postgres.` (`gmjzvhviihsjpzipocxe`) is your project reference.

3. **Direct URL**: Try navigating directly:
   ```
   https://supabase.com/dashboard/project/gmjzvhviihsjpzipocxe/settings/api
   ```
   (Replace with your actual project reference)

---

**Need more help?** Let me know what you see in the Project Settings menu, and I can guide you further!

