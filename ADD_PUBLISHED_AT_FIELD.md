# Add publishedAt Field to Drafts Table

## ✅ Schema Updated

I've added the `publishedAt` field to your Prisma schema:

```prisma
model Draft {
  id          String    @id @default(cuid())
  userId      String
  contentRaw  String
  contentAi   String?
  platform    String
  status      String    @default("draft")
  publishedAt DateTime? // ← NEW: When the draft was published (null if still draft)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
}
```

---

## 📅 **What This Gives You**

Now your drafts table will track:
1. ✅ **`createdAt`** - When draft was first created
2. ✅ **`updatedAt`** - Last time draft was modified
3. ✅ **`publishedAt`** - When draft was published (NEW!)
   - `null` = Still a draft
   - Has date = Published on that date

---

## 🔧 **Apply the Migration**

### Option 1: Run Migration (Recommended)

Try the migration command again:
```bash
npx prisma migrate dev --name add_published_at_to_drafts
```

If you still get SSL errors, try Option 2.

---

### Option 2: Add Column Directly in Supabase (If Migration Fails)

1. Go to https://supabase.com
2. Open your Levercast project
3. Go to **SQL Editor**
4. Run this SQL:

```sql
ALTER TABLE "drafts" 
ADD COLUMN "publishedAt" TIMESTAMP(3);
```

5. Then mark the migration as applied:
```bash
npx prisma migrate resolve --applied add_published_at_to_drafts
```

---

### Option 3: Reset and Re-migrate (Nuclear Option)

⚠️ **Warning: This deletes all data!**

```bash
# Reset database (deletes all data)
npx prisma migrate reset

# Apply all migrations from scratch
npx prisma migrate deploy
```

---

## 💡 **How to Use publishedAt**

### When Saving a Draft:
```typescript
await prisma.draft.create({
  data: {
    userId: user.id,
    contentRaw: "My idea...",
    platform: "linkedin",
    status: "draft",
    publishedAt: null, // Not published yet
  },
})
```

### When Publishing:
```typescript
await prisma.draft.update({
  where: { id: draftId },
  data: {
    status: "published",
    publishedAt: new Date(), // Set publish date
  },
})
```

### Query Published Drafts:
```typescript
// Get all published drafts
const published = await prisma.draft.findMany({
  where: {
    userId: user.id,
    publishedAt: { not: null },
  },
  orderBy: { publishedAt: 'desc' },
})

// Get drafts (not published)
const drafts = await prisma.draft.findMany({
  where: {
    userId: user.id,
    publishedAt: null,
  },
})
```

---

## 🎯 **Why This Design is Better**

### Before (No publishedAt):
```typescript
status: "draft" | "published"
// ❌ Can't tell WHEN it was published
// ❌ Can't sort by publish date
// ❌ Can't query "published this week"
```

### After (With publishedAt):
```typescript
status: "draft" | "published"
publishedAt: Date | null
// ✅ Know exactly when published
// ✅ Can sort by publish date
// ✅ Can query "published this week"
// ✅ publishedAt: null = still draft
```

---

## 📊 **Timeline Example**

```
Draft created:  createdAt: 2024-11-05 10:00
Edit draft:     updatedAt: 2024-11-05 11:30
Edit again:     updatedAt: 2024-11-05 14:00
Publish:        publishedAt: 2024-11-05 15:00
                updatedAt: 2024-11-05 15:00
Edit published: updatedAt: 2024-11-05 16:00
                publishedAt: 2024-11-05 15:00 (doesn't change)
```

---

## ✅ **After Migration**

Once the column is added:

1. **Generate Prisma Client:**
```bash
npx prisma generate
```

2. **Verify in Supabase:**
- Go to Table Editor → drafts
- Should see new `publishedAt` column (nullable timestamp)

3. **Update Your Code:**
- Set `publishedAt` when publishing
- Query by `publishedAt` to show publish history

---

**Try Option 1 first (run the migration). If it fails with SSL error, use Option 2 (SQL in Supabase)!** 🚀

