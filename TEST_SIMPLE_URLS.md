# Quick Fix: Try Simpler URLs

## Remove SSL Parameters

Supabase enforces SSL by default, so we might not need explicit `sslmode=require`.

---

## Try This in Your .env

```bash
DATABASE_URL="postgresql://postgres.gmjzvhviihsjpzipocxe:FijnJOnahwoXzHkV@aws-1-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"

DIRECT_URL="postgresql://postgres.gmjzvhviihsjpzipocxe:FijnJOnahwoXzHkV@aws-1-us-east-1.pooler.supabase.com:5432/postgres"
```

**Changes:**
- Removed `&sslmode=require` from DATABASE_URL
- Removed `?sslmode=require` from DIRECT_URL

---

## Then Test

```bash
npx prisma migrate dev --name init
```

If it still fails with SSL error, the issue might be with the password or connection format.

---

## Alternative: URL Encode the Password

If your password has special characters, they need to be URL-encoded:

**Special characters that need encoding:**
- `@` → `%40`
- `#` → `%23`
- `$` → `%24`
- `%` → `%25`
- `&` → `%26`
- `+` → `%2B`
- `/` → `%2F`
- `?` → `%3F`

Your password is: `FijnJOnahwoXzHkV`

This looks clean (no special characters), so encoding shouldn't be needed.

---

**Try removing the SSL mode parameters first!** 🔧

