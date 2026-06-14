# 🔧 Fix Your .env File

## Problem Found

Your `.env` file has **TWO DATABASE_URL entries**:

1. ❌ **First one (WRONG)** - pointing to localhost that doesn't exist:
   ```
   DATABASE_URL="prisma+postgres://localhost:51213/..."
   ```

2. ✅ **Second one (CORRECT)** - your Supabase connection:
   ```
   DATABASE_URL="postgresql://postgres.gmjzvhviihsjpzipocxe:...@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   ```

This is why Prisma commands hang - they're trying to connect to localhost first!

---

## Fix Instructions

### Option 1: Manual Edit (Recommended)

1. Open `.env` file in your editor
2. Find and **DELETE** the first DATABASE_URL line (the one with `localhost:51213`)
3. **Keep** the second one (Supabase)
4. Add DIRECT_URL for migrations (same connection but port 5432):

Your `.env` should look like this:

```bash
# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=/

# Supabase Database
DATABASE_URL="postgresql://postgres.gmjzvhviihsjpzipocxe:FijnJOnahwoXzHkV@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.gmjzvhviihsjpzipocxe:FijnJOnahwoXzHkV@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
```

**Note the differences:**
- `DATABASE_URL` uses port **6543** (connection pooler) with `?pgbouncer=true`
- `DIRECT_URL` uses port **5432** (direct connection) for migrations

5. Save the file

---

### Option 2: Command Line Fix

Run this command to see line numbers:
```bash
cat -n .env | grep DATABASE_URL
```

Then edit manually to remove the localhost line.

---

## After Fixing

### Step 1: Verify it's fixed
```bash
grep "DATABASE_URL" .env
```

Should show only ONE Supabase connection (port 6543).

### Step 2: Test connection
```bash
npx prisma db pull
```

Should complete in 5-10 seconds with:
```
✔ Introspected 5 models from the database
```

Or if database is empty:
```
✔ Introspected 0 models from the database
```

### Step 3: Run migration
```bash
npx prisma migrate dev --name init
```

Should complete in 10-20 seconds and create your 5 tables!

---

## Why This Happened

The first DATABASE_URL (localhost) looks like it came from:
- A previous Prisma Accelerate/Pulse setup
- A template file
- A different project

It needs to be removed so Prisma can connect to your actual Supabase database.

---

**Ready to fix?** Edit your `.env` file and remove the localhost DATABASE_URL line! 🚀

