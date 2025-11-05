# 🔒 Fix SSL Certificate Error

## The Error
```
Error: P1011
Error opening a TLS connection: bad certificate format
```

This happens because Supabase requires specific SSL settings.

---

## ✅ The Fix

Update your `.env` file to add SSL parameters to both connection strings:

### Current (causing error):
```bash
DATABASE_URL="postgresql://postgres.gmjzvhviihsjpzipocxe:FijnJOnahwoXzHkV@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.gmjzvhviihsjpzipocxe:FijnJOnahwoXzHkV@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
```

### Fixed (add sslmode):
```bash
DATABASE_URL="postgresql://postgres.gmjzvhviihsjpzipocxe:FijnJOnahwoXzHkV@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true&sslmode=require"
DIRECT_URL="postgresql://postgres.gmjzvhviihsjpzipocxe:FijnJOnahwoXzHkV@aws-1-us-east-1.pooler.supabase.com:5432/postgres?sslmode=require"
```

**What changed:**
- Added `&sslmode=require` to DATABASE_URL (after pgbouncer)
- Added `?sslmode=require` to DIRECT_URL (first parameter)

---

## Alternative: Use Connection Pooling URL from Supabase

Supabase provides pre-configured URLs with correct SSL settings.

In your Supabase dashboard:
1. Go to **Settings** → **Database**
2. Under **Connection string**, select **URI**
3. You'll see TWO options:
   - **Connection pooling** (port 6543)
   - **Direct connection** (port 5432)
4. Copy both and replace in your `.env`

---

## Test After Fixing

```bash
npx prisma db pull
```

Should complete quickly with:
```
✔ Introspected 0 models and wrote them into prisma/schema.prisma
```

(0 models is normal since database is empty - we haven't run migrations yet)

---

## Then Run Migration

```bash
npx prisma migrate dev --name init
```

This will create your 5 tables!

---

**Fix your .env file with the sslmode parameter and try again!** 🔐

