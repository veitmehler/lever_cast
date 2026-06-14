# 🗄️ Supabase Database Setup - Quick Start

**Status**: Ready to Connect  
**Date**: November 5, 2024

---

## 🚀 Quick Setup (5 Steps)

### Step 1: Create Supabase Project

1. Go to **https://supabase.com** and sign in
2. Click **"New Project"**
3. Fill in:
   - **Name**: `levercast`
   - **Database Password**: Generate strong password (SAVE THIS!)
   - **Region**: Choose closest region
   - **Plan**: Free tier
4. Click **"Create new project"**
5. Wait 2-3 minutes for provisioning ⏳

---

### Step 2: Get Database Connection String

1. In Supabase dashboard → **Settings** → **Database**
2. Find **"Connection string"** section
3. Select **"URI"** tab
4. Copy the connection string:
   ```
   postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
5. Replace `[YOUR-PASSWORD]` with your actual password from Step 1

---

### Step 3: Add to .env File

Open your `.env` file and add these lines at the bottom:

```bash
# Supabase Database
DATABASE_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
DIRECT_URL="postgresql://postgres.[PROJECT-REF]:[YOUR-PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

**Note the port difference:**
- `6543` = Connection pooler (for app queries)
- `5432` = Direct connection (for migrations)

---

### Step 4: Run Migration

Create database tables:

```bash
npx prisma migrate dev --name init
```

**Expected output:**
```
✔ Generated Prisma Client
The following migration(s) have been created and applied:

migrations/
  └─ 20241105000000_init/
    └─ migration.sql

Your database is now in sync with your schema.
```

This creates 5 tables:
- ✅ `users` - User accounts (linked to Clerk)
- ✅ `drafts` - User drafts
- ✅ `posts` - Published posts
- ✅ `api_keys` - Encrypted API keys
- ✅ `settings` - User preferences

---

### Step 5: Test Connection

Run the test script:

```bash
npx tsx scripts/test-db.ts
```

**Expected output:**
```
🔌 Testing database connection...

✅ Database connected successfully!

📊 Database Statistics:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
👥 Users: 0
📝 Drafts: 0
📮 Posts: 0
🔑 API Keys: 0
⚙️  Settings: 0
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ℹ️  No users in database yet

✨ Database test completed successfully!
```

---

## ✅ Verification Checklist

After setup, verify in Supabase dashboard:

1. Go to **Table Editor** in Supabase
2. Should see 5 tables:
   - [ ] users
   - [ ] drafts
   - [ ] posts
   - [ ] api_keys
   - [ ] settings
3. Click any table to view structure

---

## 🔍 Verify Your Schema

Open Prisma Studio to browse database:

```bash
npx prisma studio
```

Opens at `http://localhost:5555` with a GUI to:
- View all tables
- Browse data
- Add test records
- Run queries

---

## 🛠️ Useful Commands

```bash
# Generate Prisma Client (after schema changes)
npx prisma generate

# Create new migration
npx prisma migrate dev --name <description>

# Apply migrations (production)
npx prisma migrate deploy

# Open database GUI
npx prisma studio

# Reset database (⚠️ deletes all data)
npx prisma migrate reset

# Check migration status
npx prisma migrate status
```

---

## ❌ Troubleshooting

### Error: "Can't reach database server"
**Solution:**
1. Check DATABASE_URL is correct in `.env`
2. Verify password (no typos)
3. Ensure Supabase project is fully provisioned
4. Try direct connection (port 5432)

### Error: "Environment variable not found: DATABASE_URL"
**Solution:**
1. Restart dev server after adding DATABASE_URL
2. Check `.env` file is in project root
3. Verify variable name spelling

### Error: "SSL connection required"
**Solution:**
Add to connection string:
```
DATABASE_URL="postgresql://...?sslmode=require"
```

### Error: "Prisma Client is not generated"
**Solution:**
```bash
npx prisma generate
```

---

## 🎯 What's Next?

After database is connected:

1. **Create User Sync** - Webhook to sync Clerk users to database
2. **Build API Routes** - Create `/api/drafts`, `/api/posts`, etc.
3. **Update Components** - Replace localStorage with database calls
4. **Test User Isolation** - Ensure data is user-specific
5. **Migrate Existing Data** - Move localStorage data to database

---

## 📚 Resources

- **Full Setup Guide**: `.documentation/database-setup-guide.md`
- **Prisma Docs**: https://www.prisma.io/docs
- **Supabase Docs**: https://supabase.com/docs
- **Connection Pooling**: https://supabase.com/docs/guides/database/connecting-to-postgres

---

**Ready to connect your database?** Follow the 5 steps above! 🚀

