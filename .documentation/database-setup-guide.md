# Prisma + Supabase Setup Guide

**Date**: November 5, 2024  
**Status**: Setting up Database Integration

---

## 🎯 Overview

This guide walks through connecting Prisma to a Supabase PostgreSQL database for Levercast.

---

## 📋 Prerequisites

- ✅ Prisma installed (already done)
- ✅ Prisma schema defined (already done)
- ✅ Prisma client setup (already done)
- 🔲 Supabase account and project

---

## Step 1: Create Supabase Project

### 1.1 Sign Up / Log In to Supabase
1. Go to https://supabase.com
2. Sign in or create account (GitHub OAuth recommended)

### 1.2 Create New Project
1. Click "New Project"
2. Fill in details:
   - **Name**: `levercast` (or your preferred name)
   - **Database Password**: Generate a strong password (SAVE THIS!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for development

3. Click "Create new project"
4. Wait 2-3 minutes for provisioning

### 1.3 Get Database Connection String
1. In Supabase dashboard, go to **Settings** → **Database**
2. Scroll to **Connection string**
3. Select **URI** tab
4. Copy the connection string - it looks like:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
5. **IMPORTANT**: Replace `[YOUR-PASSWORD]` with the password you set earlier

---

## Step 2: Configure Environment Variables

### 2.1 Add DATABASE_URL to .env

Open your `.env` file and add the database URL:

```bash
# .env

# Existing Clerk variables
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=/

# Add Supabase Database URL
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"

# Optional: Direct connection (for migrations)
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

### 2.2 Understanding Connection Strings

**Connection Pooler (Port 6543)** - For application queries:
- Use for Prisma Client queries in production
- Transaction mode
- Better for serverless/edge functions
- Use as `DATABASE_URL`

**Direct Connection (Port 5432)** - For migrations:
- Use for running migrations
- Session mode
- Required for schema changes
- Use as `DIRECT_URL` (optional but recommended)

---

## Step 3: Update Prisma Schema (Optional)

Your schema is already good, but if you want to use direct connection for migrations:

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL") // Optional: for migrations
}
```

---

## Step 4: Review Your Prisma Schema

Your current schema looks great! It includes:

### Models:
- ✅ **User** - Links to Clerk via `clerkId`
- ✅ **Draft** - User-specific drafts with content
- ✅ **Post** - Published posts
- ✅ **ApiKey** - Encrypted API keys per user
- ✅ **Settings** - User preferences

### Key Features:
- ✅ Proper relations with cascade deletes
- ✅ Timestamps (createdAt, updatedAt)
- ✅ Unique constraints (clerkId, email)
- ✅ Table naming (`@@map("users")`)

**No changes needed!** ✅

---

## Step 5: Create Initial Migration

Run this command to create your first migration:

```bash
npx prisma migrate dev --name init
```

This will:
1. Create a `prisma/migrations` folder
2. Generate SQL migration files
3. Apply the migration to your database
4. Generate Prisma Client

**Expected output:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "postgres"

Applying migration `20241105000000_init`

The following migration(s) have been created and applied from new schema changes:

migrations/
  └─ 20241105000000_init/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client (v6.17.1) to ./node_modules/@prisma/client
```

### If Migration Fails:

**Error: Can't reach database server**
- Check DATABASE_URL is correct
- Verify password has special characters escaped
- Ensure project is fully provisioned in Supabase

**Error: Connection pool timeout**
- Use DIRECT_URL for migrations (port 5432, not 6543)
- Check firewall/network settings

---

## Step 6: Generate Prisma Client

If you didn't run the migration yet, generate the client manually:

```bash
npx prisma generate
```

This creates TypeScript types for your database models.

---

## Step 7: Verify Database Tables in Supabase

1. Go to Supabase dashboard
2. Click **Table Editor** in sidebar
3. You should see 5 tables:
   - `users`
   - `drafts`
   - `posts`
   - `api_keys`
   - `settings`

4. Click any table to see schema and data

---

## Step 8: Test Database Connection

Create a test script to verify connection:

```typescript
// scripts/test-db.ts
import { prisma } from '@/lib/prisma'

async function main() {
  console.log('Testing database connection...')
  
  // Test connection
  await prisma.$connect()
  console.log('✅ Database connected successfully!')
  
  // Count users
  const userCount = await prisma.user.count()
  console.log(`📊 Users in database: ${userCount}`)
  
  await prisma.$disconnect()
}

main()
  .catch((e) => {
    console.error('❌ Database connection failed:', e)
    process.exit(1)
  })
```

Run it:
```bash
npx tsx scripts/test-db.ts
```

Or test directly in Prisma Studio:
```bash
npx prisma studio
```

This opens a GUI at `http://localhost:5555` to browse your database.

---

## Step 9: Add to .gitignore

Make sure your `.env` file is ignored:

```bash
# .gitignore (should already have this)
.env
.env.local
.env*.local
```

---

## Step 10: Create .env.example

Create a template for other developers:

```bash
# .env.example

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key_here
CLERK_SECRET_KEY=sk_test_your_key_here
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_CLERK_AFTER_SIGN_OUT_URL=/

# Supabase Database
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:6543/postgres"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[PASSWORD]@[HOST]:5432/postgres"
```

---

## Common Issues & Solutions

### Issue 1: "Environment variable not found: DATABASE_URL"
**Solution**: 
- Restart dev server after adding DATABASE_URL to .env
- Make sure .env is in project root
- Check for typos in variable name

### Issue 2: "Can't reach database server"
**Solution**:
- Verify Supabase project is fully provisioned
- Check connection string is correct
- Ensure password doesn't have special characters (or escape them)
- Try using direct connection (port 5432)

### Issue 3: "SSL connection required"
**Solution**:
Add `?sslmode=require` to connection string:
```
DATABASE_URL="postgresql://...?sslmode=require"
```

### Issue 4: "Prisma Client is not generated"
**Solution**:
```bash
npx prisma generate
```

### Issue 5: "Schema is out of sync"
**Solution**:
```bash
npx prisma migrate dev
```

---

## Useful Prisma Commands

```bash
# Generate Prisma Client
npx prisma generate

# Create and apply migration
npx prisma migrate dev --name <migration-name>

# Apply migrations in production
npx prisma migrate deploy

# Open Prisma Studio (database GUI)
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# View migration status
npx prisma migrate status

# Format schema file
npx prisma format

# Validate schema
npx prisma validate
```

---

## Next Steps After Database Setup

1. **Create User Sync Service** - Sync Clerk users to database
2. **Build API Routes** - Create endpoints for drafts, posts, templates
3. **Migrate localStorage Data** - Move existing data to database
4. **Update Components** - Use Prisma instead of localStorage
5. **Test User Isolation** - Ensure users only see their own data

---

## Security Checklist

- [ ] DATABASE_URL in .env (not committed to git)
- [ ] Strong database password used
- [ ] Connection uses SSL
- [ ] Row Level Security considered (Supabase feature)
- [ ] API routes validate user authentication
- [ ] Prisma Client never exposed to client-side

---

## Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Prisma with Next.js](https://www.prisma.io/nextjs)
- [Supabase Connection Pooling](https://supabase.com/docs/guides/database/connecting-to-postgres#connection-pooler)

---

**Last Updated**: November 5, 2024  
**Status**: Ready for Database Setup  
**Next**: Create migration and test connection

