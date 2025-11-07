# Twitter/X Thread Implementation Plan

## Overview
Add option for users to choose between single Twitter/X posts or threaded posts during generation:
- **Single Post** (default): Works exactly as it does now, uses templates
- **Thread** (optional): Creates a thread with:
  - **Post 1**: Summary post (hook/intro)
  - **Post 2-N**: Key insights (randomly 1-8 insights, AI decides)
  - **Note**: Threads do NOT use templates (disregard template functionality)

## Architecture Changes

### 1. Database Schema Changes

**File: `prisma/schema.prisma`**

Change `twitterContent` field in `Draft` model to store JSON array:
```prisma
twitterContent   String?   @db.Text // JSON array: ["tweet1", "tweet2", ...] or null
```

**Migration Strategy:**
- Existing single tweets remain as strings (no migration needed)
- New threads will be stored as JSON array: `["summary", "insight1", "insight2", ...]`
- Single tweets continue to be stored as plain strings
- Backward compatibility: Parse logic detects format automatically

### 2. TypeScript Type Changes

**Files to Update:**
- `src/lib/mockAI.ts` - `GeneratedContent` interface
- `src/app/(protected)/dashboard/page.tsx` - State types
- `src/app/(protected)/posts/[id]/page.tsx` - Draft type
- `src/app/(protected)/posts/page.tsx` - Draft type
- `src/app/api/drafts/route.ts` - API response types

**Change:**
```typescript
// Before
twitter?: string

// After
twitter?: string | string[] // Support both single tweet and thread
```

### 3. UI Selection Control

**File: `src/components/IdeaCapture.tsx`**

**Changes Needed:**

1. **Add Twitter format selection** (only show when Twitter is selected):
```typescript
const [twitterFormat, setTwitterFormat] = useState<'single' | 'thread'>('single')

// In the UI, add radio buttons or toggle when platform includes 'twitter':
{(platform === 'twitter' || platform === 'both') && (
  <div className="mb-4">
    <label className="text-sm font-medium text-card-foreground mb-2 block">
      Twitter Format
    </label>
    <div className="flex gap-4">
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="twitterFormat"
          value="single"
          checked={twitterFormat === 'single'}
          onChange={(e) => setTwitterFormat(e.target.value as 'single' | 'thread')}
          className="w-4 h-4 text-primary"
        />
        <span className="text-sm text-card-foreground">Single Post</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input
          type="radio"
          name="twitterFormat"
          value="thread"
          checked={twitterFormat === 'thread'}
          onChange={(e) => setTwitterFormat(e.target.value as 'single' | 'thread')}
          className="w-4 h-4 text-primary"
        />
        <span className="text-sm text-card-foreground">Thread</span>
      </label>
    </div>
    {twitterFormat === 'thread' && (
      <p className="text-xs text-muted-foreground mt-1">
        Create a thread with summary + key insights (templates not used)
      </p>
    )}
  </div>
)}
```

2. **Update handleGenerate to pass format:**
```typescript
const handleGenerate = () => {
  if (content.trim()) {
    const templateId = selectedTemplate === 'none' ? undefined : selectedTemplate
    // Pass twitterFormat when Twitter is selected
    const twitterFormatParam = (platform === 'twitter' || platform === 'both') 
      ? twitterFormat 
      : undefined
    onGenerate(content, platform, templateId, selectedImage || undefined, twitterFormatParam)
  }
}
```

3. **Update interface:**
```typescript
interface IdeaCaptureProps {
  onGenerate: (
    content: string, 
    platform: 'linkedin' | 'twitter' | 'both', 
    templateId?: string, 
    image?: string,
    twitterFormat?: 'single' | 'thread'
  ) => void
}
```

### 4. AI Generation Changes

**File: `src/app/api/ai/generate/route.ts`**

**Changes Needed:**

1. **Accept twitterFormat parameter:**
```typescript
const body = await request.json()
const { rawIdea, platform, templateId, provider, twitterFormat } = body
```

2. **Update Twitter prompt logic** - conditionally generate thread or single post:
```typescript
if (plat === 'twitter') {
  const isThread = twitterFormat === 'thread' || (platform === 'both' && twitterFormat === 'thread')
  
  if (isThread) {
    // THREAD MODE: Skip template, generate thread
    prompt += `IMPORTANT: You must create a Twitter/X thread with multiple posts.\n\n`
    prompt += `STRUCTURE:\n`
    prompt += `1. Post 1: Create an engaging summary/hook post (under 280 characters) that introduces the topic and encourages readers to continue.\n\n`
    prompt += `2. Posts 2-N: Extract 1-8 key insights from the RAW IDEA. Each insight should be its own numbered post (under 280 characters each).\n\n`
    prompt += `3. Randomly decide how many insights (between 1-8) based on the depth and complexity of the RAW IDEA.\n\n`
    prompt += `FORMAT: Return the thread as a JSON array where each element is a tweet:\n`
    prompt += `["Summary tweet here", "1/ Key insight 1", "2/ Key insight 2", "3/ Key insight 3", ...]\n\n`
    prompt += `CRITICAL: Return ONLY a valid JSON array. Do NOT include any other text, headers, or explanations.`
    
    // Skip template application for threads
    const templateText = null
  } else {
    // SINGLE POST MODE: Use existing logic with templates
    const templateText = plat === 'linkedin' ? template?.linkedinTemplate : template?.twitterTemplate
    // ... existing single post prompt logic ...
    prompt += `IMPORTANT: Keep the post under 280 characters.\n\n`
    prompt += `CRITICAL: Return ONLY the post content. Do NOT include any analysis, headers, explanations, or metadata.`
  }
}
```

3. **Update maxTokens based on format:**
```typescript
const maxTokens = plat === 'linkedin' 
  ? 1000 
  : (twitterFormat === 'thread' ? 2000 : 200) // More tokens for threads
```

4. **Parse and validate thread response:**
```typescript
// After AI generation
if (plat === 'twitter' && twitterFormat === 'thread') {
  // THREAD MODE: Parse as JSON array
  try {
    const parsed = JSON.parse(generatedContent.trim())
    if (Array.isArray(parsed) && parsed.length > 0) {
      // Validate each tweet is under 280 chars
      const validTweets = parsed
        .map(tweet => cleanSingleTweet(tweet))
        .filter(tweet => tweet.length > 0 && tweet.length <= 280)
      
      if (validTweets.length === 0) {
        throw new Error('No valid tweets in thread')
      }
      
      // Store as JSON string
      result[plat] = JSON.stringify(validTweets)
    } else {
      throw new Error('Invalid thread format')
    }
  } catch (e) {
    // If parsing fails, try to extract tweets from text
    const lines = generatedContent.split('\n').filter(line => line.trim().length > 0)
    if (lines.length > 1) {
      const tweets = lines
        .map(line => line.replace(/^\d+[\/\.]\s*/, '').trim())
        .map(tweet => cleanSingleTweet(tweet))
        .filter(tweet => tweet.length > 0 && tweet.length <= 280)
      
      if (tweets.length > 0) {
        result[plat] = JSON.stringify(tweets)
      } else {
        throw new Error('Failed to parse thread')
      }
    } else {
      throw new Error('Failed to generate thread')
    }
  }
} else {
  // SINGLE POST MODE: Store as plain string (existing behavior)
  result[plat] = generatedContent.trim()
}
```

4. **Update cleanup function** to handle thread arrays:
```typescript
function cleanGeneratedContent(content: string, platform: 'linkedin' | 'twitter'): string {
  // ... existing cleanup ...
  
  // For Twitter, if content looks like a thread, parse it
  if (platform === 'twitter') {
    // Check if it's already a JSON array
    try {
      const parsed = JSON.parse(content.trim())
      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed.map(tweet => cleanSingleTweet(tweet)))
      }
    } catch (e) {
      // Not JSON, continue with normal cleanup
    }
  }
  
  return cleaned.trim()
}

function cleanSingleTweet(tweet: string): string {
  // Remove headers, "=>", etc. from individual tweet
  return tweet.replace(/^=>\s*/, '').replace(/^#\s*.*?:\s*/i, '').trim()
}
```

### 5. Dashboard Changes

**File: `src/app/(protected)/dashboard/page.tsx`**

**Changes Needed:**

1. **Update handleGenerate to accept twitterFormat:**
```typescript
const handleGenerate = async (
  content: string,
  platform: 'linkedin' | 'twitter' | 'both',
  templateId?: string,
  image?: string,
  twitterFormat?: 'single' | 'thread'
) => {
  // ... existing logic ...
  
  // Pass twitterFormat to generateContent
  const result = await generateContent(content, platform, templateId, twitterFormat)
  // ...
}
```

2. **Update generateContent call in mockAI.ts:**
```typescript
export async function generateContent(
  rawIdea: string,
  platform: 'linkedin' | 'twitter' | 'both',
  templateId?: string,
  twitterFormat?: 'single' | 'thread'
): Promise<GeneratedContent> {
  const response = await fetch('/api/ai/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      rawIdea,
      platform,
      templateId,
      twitterFormat, // Pass format to API
    }),
  })
  // ... rest of logic
}
```

### 6. UI Component Changes

**File: `src/components/PlatformPreview.tsx`**

**Changes Needed:**

1. **Update props interface:**
```typescript
interface PlatformPreviewProps {
  // ... existing props ...
  content: string | string[] // Support both single and thread
  isThread?: boolean // Explicit flag
}
```

2. **Parse content on mount:**
```typescript
const [tweets, setTweets] = useState<string[]>([])

useEffect(() => {
  if (Array.isArray(content)) {
    setTweets(content)
  } else if (typeof content === 'string') {
    // Try to parse as JSON array
    try {
      const parsed = JSON.parse(content)
      if (Array.isArray(parsed)) {
        setTweets(parsed)
      } else {
        setTweets([content])
      }
    } catch {
      setTweets([content])
    }
  } else {
    setTweets([])
  }
}, [content])
```

3. **Update UI to display thread:**
```typescript
// In the render section, replace single content display with:
{tweets.map((tweet, index) => (
  <div key={index} className="mb-4 pb-4 border-b border-border last:border-0">
    <div className="flex items-start gap-2 mb-2">
      <span className="text-xs font-semibold text-muted-foreground">
        {index === 0 ? 'Summary' : `${index}/${tweets.length - 1}`}
      </span>
    </div>
    {isEditing ? (
      <textarea
        value={tweet}
        onChange={(e) => {
          const updated = [...tweets]
          updated[index] = e.target.value
          setTweets(updated)
          // Update editedContent for onContentChange
        }}
        className="w-full min-h-[80px] p-3 rounded-lg border border-input bg-background text-foreground text-sm"
      />
    ) : (
      <div className="text-card-foreground text-sm whitespace-pre-wrap">
        {tweet}
      </div>
    )}
    <div className="mt-1 text-xs text-muted-foreground">
      {tweet.length}/280 characters
    </div>
  </div>
))}
```

4. **Update character count logic:**
```typescript
const totalChars = tweets.reduce((sum, tweet) => sum + tweet.length, 0)
const maxChars = tweets.length * CHAR_LIMITS.twitter
const isOverLimit = tweets.some(tweet => tweet.length > CHAR_LIMITS.twitter)
```

5. **Update onPublish callback:**
```typescript
onPublish(Array.isArray(content) ? JSON.stringify(content) : content)
```

### 7. API Route Changes

**File: `src/app/api/drafts/route.ts`**

**Changes Needed:**

1. **Handle JSON parsing in GET:**
```typescript
// When returning drafts, parse twitterContent if it's JSON
const drafts = await prisma.draft.findMany({...})
const formattedDrafts = drafts.map(draft => ({
  ...draft,
  twitterContent: draft.twitterContent 
    ? (() => {
        try {
          const parsed = JSON.parse(draft.twitterContent)
          return Array.isArray(parsed) ? parsed : draft.twitterContent
        } catch {
          return draft.twitterContent
        }
      })()
    : null
}))
```

2. **Handle JSON stringification in POST/PATCH:**
```typescript
// When saving, stringify if array
if (body.twitterContent && Array.isArray(body.twitterContent)) {
  body.twitterContent = JSON.stringify(body.twitterContent)
}
```

### 8. Dashboard Changes (Additional)

**File: `src/app/(protected)/dashboard/page.tsx`**

**Changes Needed:**

1. **Update state type:**
```typescript
type GeneratedContent = {
  linkedin?: string
  twitter?: string | string[]
}
```

2. **Update handleContentChange:**
```typescript
const handleContentChange = async (platform: 'linkedin' | 'twitter', newContent: string | string[]) => {
  setGeneratedContent((prev) => ({
    ...prev,
    [platform]: newContent,
  }))
  
  // When saving, stringify if array
  const saveContent = Array.isArray(newContent) ? JSON.stringify(newContent) : newContent
  
  if (currentDraftId) {
    const updateData: Record<string, string> = {}
    if (platform === 'linkedin') {
      updateData.linkedinContent = saveContent
    } else {
      updateData.twitterContent = saveContent
    }
    // ... rest of save logic
  }
}
```

### 9. Post Detail Page Changes

**File: `src/app/(protected)/posts/[id]/page.tsx`**

**Changes Needed:**

1. **Update Draft type:**
```typescript
type Draft = {
  // ... existing fields ...
  twitterContent: string | string[] | null
}
```

2. **Parse twitterContent on fetch:**
```typescript
useEffect(() => {
  const fetchDraft = async () => {
    const response = await fetch(`/api/drafts/${id}`)
    const data = await response.json()
    
    // Parse twitterContent if it's a JSON string
    if (data.twitterContent && typeof data.twitterContent === 'string') {
      try {
        const parsed = JSON.parse(data.twitterContent)
        if (Array.isArray(parsed)) {
          data.twitterContent = parsed
        }
      } catch {
        // Keep as string
      }
    }
    
    setPost(data)
  }
  fetchDraft()
}, [id])
```

3. **Update handleContentChange:**
```typescript
const handleContentChange = async (platform: 'linkedin' | 'twitter', newContent: string | string[]) => {
  // ... update local state ...
  
  // Stringify if array
  const saveContent = Array.isArray(newContent) ? JSON.stringify(newContent) : newContent
  
  const updateData: Record<string, string> = {}
  if (platform === 'linkedin') {
    updateData.linkedinContent = saveContent
  } else {
    updateData.twitterContent = saveContent
  }
  // ... rest of save logic
}
```

### 10. Publishing Changes

**File: `src/app/api/posts/route.ts`**

**Changes Needed:**

When publishing a Twitter thread, create multiple `Post` records:
```typescript
if (platform === 'twitter' && draft.twitterContent) {
  let tweets: string[] = []
  
  // Parse if JSON string
  if (typeof draft.twitterContent === 'string') {
    try {
      const parsed = JSON.parse(draft.twitterContent)
      tweets = Array.isArray(parsed) ? parsed : [draft.twitterContent]
    } catch {
      tweets = [draft.twitterContent]
    }
  } else if (Array.isArray(draft.twitterContent)) {
    tweets = draft.twitterContent
  } else {
    tweets = [draft.twitterContent]
  }
  
  // Create a Post record for each tweet in the thread
  const postPromises = tweets.map((tweet, index) => 
    prisma.post.create({
      data: {
        userId: user.id,
        draftId: draft.id,
        platform: 'twitter',
        content: tweet,
        status: scheduledAt ? 'scheduled' : 'published',
        scheduledAt: scheduledAt || null,
        publishedAt: scheduledAt ? null : new Date(),
        // Add thread metadata
        threadPosition: index + 1,
        threadTotal: tweets.length,
      }
    })
  )
  
  await Promise.all(postPromises)
}
```

**Note:** Need to add `threadPosition` and `threadTotal` fields to `Post` model if tracking thread order.

### 11. Regeneration Changes

**File: `src/app/(protected)/posts/[id]/page.tsx`**

**Changes Needed:**

1. **Store twitterFormat in Draft model** (optional - can infer from content format):
   - Add `twitterFormat` field to Draft model, OR
   - Infer format from content (if array = thread, if string = single)

2. **Update handleRegenerate** to preserve format:
```typescript
const handleRegenerate = async (platform: 'linkedin' | 'twitter') => {
  // ... existing logic ...
  
  // Determine if current content is a thread
  const isThread = Array.isArray(post.twitterContent) || 
    (typeof post.twitterContent === 'string' && post.twitterContent.startsWith('['))
  
  const twitterFormat = isThread ? 'thread' : 'single'
  
  const result = await generateContent(
    post.contentRaw, 
    platform, 
    isThread ? undefined : post.templateId, // Skip template for threads
    twitterFormat
  )
  
  // ... rest of logic ...
}
```

### 12. Regeneration Changes (Alternative - Infer Format)

**File: `src/app/(protected)/posts/[id]/page.tsx`**

**Changes Needed:**

Update `handleRegenerate` to handle thread format:
```typescript
const handleRegenerate = async (platform: 'linkedin' | 'twitter') => {
  // ... existing logic ...
  
  const result = await generateContent(post.contentRaw, platform, post.templateId)
  
  const newContent = platform === 'linkedin' 
    ? result.linkedin 
    : (Array.isArray(result.twitter) ? result.twitter : [result.twitter])
  
  // ... rest of logic ...
}
```

## Implementation Order

1. **Phase 1: UI Selection Control**
   - Add Twitter format selector in IdeaCapture component
   - Update onGenerate interface to accept twitterFormat
   - Update dashboard handleGenerate to pass format

2. **Phase 2: AI Generation**
   - Update API to accept twitterFormat parameter
   - Add conditional logic: thread mode vs single post mode
   - Skip templates when twitterFormat === 'thread'
   - Update Twitter prompt for thread generation
   - Add thread parsing and validation logic
   - Update cleanup function for threads

3. **Phase 3: Type System & Data Handling**
   - Update TypeScript types to support `string | string[]`
   - Update API routes to handle JSON parsing/stringification
   - Add helper functions to detect format (string vs array)

4. **Phase 4: UI Components**
   - Update PlatformPreview to display threads
   - Update editing functionality for threads
   - Update character counting for threads
   - Add visual thread indicators

5. **Phase 5: Publishing**
   - Update post creation to handle threads (multiple Post records)
   - Add thread metadata tracking (optional)

6. **Phase 6: Regeneration**
   - Update regeneration to preserve format (thread vs single)
   - Skip templates when regenerating threads

7. **Phase 7: Testing & Refinement**
   - Test single post generation (should work exactly as before)
   - Test thread generation
   - Test editing threads
   - Test publishing threads
   - Test regeneration for both formats
   - Test backward compatibility with existing single tweets

## Backward Compatibility

- **No database migration needed**: Single tweets remain as strings
- **Format detection**: Parse logic automatically detects string vs JSON array
- **Default behavior**: Single post mode is default, maintains existing functionality
- **Templates**: Continue to work for single posts, disabled for threads
- **Existing drafts**: All existing single tweets continue to work without changes

## Testing Checklist

### Single Post Mode (Existing Functionality)
- [ ] Generate single post (should work exactly as before)
- [ ] Templates work for single posts
- [ ] Edit single post
- [ ] Regenerate single post
- [ ] Publish single post
- [ ] Schedule single post
- [ ] View existing single tweets (backward compatibility)

### Thread Mode (New Functionality)
- [ ] Select "Thread" format in UI
- [ ] Generate new thread (1-8 insights)
- [ ] Verify templates are NOT used for threads
- [ ] Edit individual tweets in thread
- [ ] Add/remove tweets from thread
- [ ] Regenerate thread (preserves thread format)
- [ ] Publish thread (creates multiple Post records)
- [ ] Schedule thread
- [ ] Character limits enforced per tweet (280 chars each)
- [ ] Thread display in preview (numbered posts)
- [ ] Thread display in posts page
- [ ] Thread display in calendar

### Edge Cases
- [ ] Switching between single/thread format during generation
- [ ] Regenerating thread when original was single post
- [ ] Regenerating single post when original was thread
- [ ] Empty thread (should not happen, but handle gracefully)
- [ ] Thread with only 1 tweet (should still work)
- [ ] Thread with 8+ tweets (should cap at 8)

