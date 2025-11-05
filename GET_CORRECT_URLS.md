# 🔗 Get Correct Supabase Connection URLs

## The SSL Issue

The SSL certificate error happens because we need the exact connection strings from Supabase with the correct format.

---

## ✅ Get URLs from Supabase Dashboard

### Step 1: Go to Database Settings

1. Open your Supabase project
2. Go to **Settings** (gear icon) → **Database**
3. Scroll to **Connection string** section

### Step 2: Get Both Connection Types

You'll see different modes. We need TWO specific ones:

#### For DATABASE_URL (Port 6543):
1. Click **Connection pooling**
2. Mode: **Transaction**
3. Copy the URI that looks like:
   ```
   postgresql://postgres.gmjzvhviihsjpzipocxe:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

#### For DIRECT_URL (Port 5432):
1. Click **Session pooling** or **Direct connection**
2. Copy the URI that looks like:
   ```
   postgresql://postgres.gmjzvhviihsjpzipocxe:[YOUR-PASSWORD]@db.gmjzvhviihsjpzipocxe.supabase.co:5432/postgres
   ```

**Important Notes:**
- Replace `[YOUR-PASSWORD]` with your actual database password
- Don't manually add `?sslmode=require` - Supabase URLs should work as-is
- The direct connection URL might use a different hostname (db.XXX.supabase.co instead of pooler.supabase.com)

---

## Alternative: Try Without SSL Mode

If the above doesn't work, remove the SSL parameters entirely:

```bash
DATABASE_URL="postgresql://postgres.gmjzvhviihsjpzipocxe:FijnJOnahwoXzHkV@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

DIRECT_URL="postgresql://postgres.gmjzvhviihsjpzipocxe:FijnJOnahwoXzHkV@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
```

Supabase enforces SSL by default, so explicit `sslmode` might not be needed.

---

## Test After Updating

```bash
npx prisma migrate dev --name init
```

Should complete in 10-20 seconds and create 5 tables!

---

**Try getting fresh URLs from Supabase dashboard first!** 🎯

