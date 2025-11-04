# Phase 2 - Idea Capture & AI Generation

## ✅ Implementation Complete

Phase 2 adds the core functionality of Levercast: capturing ideas and generating platform-optimized content.

---

## 🎯 Features Implemented

### 1. Idea Capture Component

**File**: `src/components/IdeaCapture.tsx`

**Features**:
- **Large text input area** (2000 character limit with counter)
- **Voice recording button** with animated waveform
  - Click mic to start recording
  - Shows pulsing animation during recording
  - Auto-transcribes after 2 seconds (mock implementation)
- **Image attachment** with preview
  - Click image icon to select file
  - Shows thumbnail preview
  - Remove button (X) to clear attachment
- **Platform selector** (LinkedIn, Twitter, Both)
  - Visual button group with platform colors
  - LinkedIn: `#0A66C2`
  - Twitter: `#1DA1F2`
  - Both: Levercast accent `#C3F43B`
- **Generate button** with loading states
  - Disabled when input empty or recording
  - Sparkles icon for AI generation

---

### 2. Platform Preview Cards

**File**: `src/components/PlatformPreview.tsx`

**Features**:
- **Platform-native styling**
  - LinkedIn: Blue header with "in" icon
  - Twitter: Light blue header with "𝕏" icon
- **Mock user profile** (John Doe avatar)
- **Inline editing**
  - Click content to edit
  - Save/Cancel buttons appear
  - Updates preview in real-time
- **Mock engagement stats** (likes, comments, shares)
- **Action buttons**:
  - **Copy**: Copies content to clipboard (shows checkmark)
  - **Regenerate**: Generates new version for that platform
  - **Publish**: Simulates publishing (shows alert)

---

### 3. Mock AI Generation

**File**: `src/lib/mockAI.ts`

**Features**:
- **Multiple templates** per platform
  - 3 LinkedIn templates
  - 3 Twitter templates
  - Randomly selected for variety
- **Realistic delay** (1.5 seconds) to simulate API call
- **Template system**:
  - Takes raw idea as input
  - Formats with platform-appropriate structure
  - Adds emojis, hashtags, calls-to-action
- **Publish simulation** with success messages

**Example Templates**:

**LinkedIn**:
- Thought leadership format with key takeaways
- Numbered lists with emoji bullets
- Hashtags relevant to business/entrepreneurship

**Twitter**:
- Concise thread-style format
- Quick tips with bullet points
- Questions to drive engagement

---

### 4. Dashboard Integration

**File**: `src/app/(protected)/dashboard/page.tsx`

**Flow**:
1. **Initial State**: Shows idea capture widget + feature overview cards
2. **Generating**: Shows loading spinner with message
3. **Generated**: Shows platform preview cards side-by-side
4. **Actions**: Regenerate individual platforms or publish

**States**:
- `isGenerating`: Loading state
- `generatedContent`: Stores LinkedIn/Twitter outputs
- `rawIdea`: Preserves original input for regeneration

---

## 🎨 Design Details

### Color Scheme

**Platforms**:
- LinkedIn: `#0A66C2` (official brand color)
- Twitter: `#1DA1F2` (official brand color)
- Accent: `#C3F43B` (Levercast primary)

**States**:
- Recording: Red pulse animation
- Generating: Primary color spinner
- Success: Green checkmark (copied)
- Interactive: Hover effects with border color changes

### Animations

1. **Voice Recording Waveform**:
   - 4 vertical bars
   - Staggered pulse animation (150ms delay between bars)
   - Primary color
   
2. **Loading Spinner**:
   - Lucide `Loader2` icon
   - Continuous spin animation
   - 12px diameter

3. **Button Transitions**:
   - 200ms ease for all hover states
   - Border color changes on hover
   - Background opacity changes

---

## 📋 User Flow

### Complete Workflow

```
1. User enters idea in text area
   ↓
2. Optionally: Record voice OR attach image
   ↓
3. Select target platform(s)
   ↓
4. Click "Generate Posts"
   ↓
5. Loading state (1.5s)
   ↓
6. Preview cards appear
   ↓
7. User can:
   - Click to edit content inline
   - Copy to clipboard
   - Regenerate specific platform
   - Publish (mock)
   ↓
8. Success alert
```

---

## 🧪 Testing Guide

### Test Scenarios

**1. Basic Generation**
- Type: "Building a successful startup"
- Platform: Both
- Click Generate
- ✅ Should show both LinkedIn and Twitter previews

**2. Voice Recording**
- Click microphone button
- ✅ Should show animated waveform
- Wait 2 seconds
- ✅ Should auto-stop and add text

**3. Image Attachment**
- Click image icon
- Select a file
- ✅ Should show thumbnail preview
- Click X button
- ✅ Should remove image

**4. Platform Selection**
- Click LinkedIn button
- ✅ Should turn blue
- Generate
- ✅ Should only show LinkedIn preview

**5. Inline Editing**
- Click on generated content
- ✅ Should become editable textarea
- Make changes
- Click Save
- ✅ Should update preview

**6. Copy to Clipboard**
- Click Copy button
- ✅ Should show "Copied!" with checkmark
- Paste elsewhere
- ✅ Content should match

**7. Regenerate**
- Click Regenerate on one platform
- ✅ Should show loading state
- ✅ Should update only that platform
- ✅ Other platform stays unchanged

**8. Publish**
- Click Publish
- ✅ Should show success alert

---

## 💻 Component API

### IdeaCapture Props

```typescript
interface IdeaCaptureProps {
  onGenerate: (
    content: string, 
    platform: 'linkedin' | 'twitter' | 'both'
  ) => void
}
```

### PlatformPreview Props

```typescript
interface PlatformPreviewProps {
  platform: 'linkedin' | 'twitter'
  content: string
  onRegenerate: () => void
  onPublish: () => void
}
```

### Mock AI Functions

```typescript
generateContent(
  rawIdea: string,
  platform: 'linkedin' | 'twitter' | 'both'
): Promise<GeneratedContent>

publishToPlatform(
  platform: 'linkedin' | 'twitter',
  content: string
): Promise<{ success: boolean; message: string }>
```

---

## 📦 Files Created

```
src/
├── components/
│   ├── IdeaCapture.tsx        # Main input widget
│   └── PlatformPreview.tsx    # Preview cards
├── lib/
│   └── mockAI.ts              # Mock generation logic
└── app/(protected)/
    └── dashboard/
        └── page.tsx           # Updated with full integration
```

---

## 🚀 Next Steps: Phase 3

**Potential enhancements**:
1. **Enhanced Posts Page**: Save generated drafts
2. **Settings Integration**: Choose default platform, LLM provider
3. **Real Voice Recording**: Web Audio API integration
4. **Character Limits**: Platform-specific (LinkedIn 3000, Twitter 280)
5. **Thread Support**: Multi-tweet threads for Twitter
6. **Image Upload**: Attach to generated posts
7. **Tone Selection**: Professional, Casual, Inspirational
8. **Templates Manager**: Custom user templates
9. **Analytics Preview**: Estimated engagement metrics
10. **Schedule Publishing**: Date/time picker

---

**Status**: Phase 2 Complete ✅  
**Ready For**: User Testing & Feedback  
**Last Updated**: November 4, 2024

