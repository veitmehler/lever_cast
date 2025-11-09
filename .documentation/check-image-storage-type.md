# How to Check if Image is Base64 or Supabase Storage URL

## Method 1: Browser Inspection (Easiest)

1. **Go to the `/posts` page** in your browser
2. **Right-click on the image** → **"Inspect"** (or **"Inspect Element"**)
3. **Look at the `src` attribute** in the HTML:

### ✅ Supabase Storage URL (What you want):
```
https://gmjzvhviihsjpzipocxe.supabase.co/storage/v1/object/public/post-images/[userId]/[timestamp]-[random].jpg
```

### ❌ Base64 (Old format):
```
data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...
```
(Base64 URLs are very long and start with `data:image/`)

---

## Method 2: Browser Console

1. **Open browser console** (F12 or Cmd+Option+I)
2. **Go to `/posts` page**
3. **Run this in the console**:
```javascript
// Get the first draft with an image
fetch('/api/drafts')
  .then(r => r.json())
  .then(drafts => {
    const draftWithImage = drafts.find(d => d.attachedImage)
    if (draftWithImage) {
      console.log('Image URL:', draftWithImage.attachedImage)
      console.log('Is Supabase URL:', draftWithImage.attachedImage?.includes('supabase.co'))
      console.log('Is Base64:', draftWithImage.attachedImage?.startsWith('data:'))
    }
  })
```

---

## Method 3: Check Database Directly

### Using Prisma Studio:
```bash
npx prisma studio
```

1. Open `http://localhost:5555`
2. Click on **"drafts"** table
3. Find your draft
4. Look at the `attachedImage` column

### Using SQL Query:
```bash
# Connect to your database and run:
SELECT id, title, 
  CASE 
    WHEN attachedImage LIKE 'data:%' THEN 'Base64'
    WHEN attachedImage LIKE '%supabase.co%' THEN 'Supabase Storage'
    ELSE 'Other'
  END as image_type,
  LEFT(attachedImage, 100) as image_preview
FROM drafts
WHERE attachedImage IS NOT NULL
LIMIT 5;
```

---

## Method 4: Quick Visual Check

**Supabase Storage URL**:
- ✅ Starts with `https://`
- ✅ Contains `supabase.co`
- ✅ Contains `/storage/v1/object/public/post-images/`
- ✅ Relatively short URL (~100-150 characters)

**Base64 Data URL**:
- ❌ Starts with `data:image/`
- ❌ Very long string (thousands of characters)
- ❌ Contains encoded image data

---

## Method 5: Network Tab

1. **Open browser DevTools** → **Network tab**
2. **Reload the `/posts` page**
3. **Look for image requests**:
   - **Supabase Storage**: Request to `supabase.co/storage/...`
   - **Base64**: No network request (image embedded in HTML)

---

## Quick Test Script

Create a test file to check:

```bash
# Create a quick test script
cat > check-image-type.js << 'EOF'
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function checkImageTypes() {
  const drafts = await prisma.draft.findMany({
    where: {
      attachedImage: {
        not: null
      }
    },
    select: {
      id: true,
      title: true,
      attachedImage: true
    },
    take: 5
  })

  console.log('\n📸 Image Storage Analysis:\n')
  
  drafts.forEach(draft => {
    const isBase64 = draft.attachedImage?.startsWith('data:')
    const isSupabase = draft.attachedImage?.includes('supabase.co')
    
    console.log(`Draft: ${draft.title}`)
    console.log(`  Type: ${isBase64 ? '❌ Base64' : isSupabase ? '✅ Supabase Storage' : '❓ Unknown'}`)
    console.log(`  Preview: ${draft.attachedImage?.substring(0, 80)}...`)
    console.log('')
  })

  await prisma.$disconnect()
}

checkImageTypes()
EOF

# Run it
node check-image-type.js
```

---

## Expected Result

After implementing Supabase Storage, **new images** should show:
- ✅ URL format: `https://gmjzvhviihsjpzipocxe.supabase.co/storage/v1/object/public/post-images/[userId]/[timestamp]-[random].jpg`

**Old images** (if any) will still show:
- ❌ Base64 format: `data:image/jpeg;base64,/9j/4AAQSkZJRg...`

---

## If You See Base64

If you still see base64 URLs, it means:
1. The image was uploaded before Supabase Storage was set up, OR
2. The upload didn't go through the new API route

**Solution**: Upload a new image - it should use Supabase Storage automatically.

