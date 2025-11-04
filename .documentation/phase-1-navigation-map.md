# Phase 1 - Navigation & Route Map

## 🗺️ Application Structure

```
Levercast Application
│
├─ Public Routes (Unauthenticated)
│  ├─ / (Landing page)
│  ├─ /sign-in (Clerk authentication)
│  └─ /sign-up (Clerk registration)
│
└─ Protected Routes (Authenticated)
   ├─ Sidebar Navigation (Always visible)
   │  ├─ Logo/Brand (top)
   │  ├─ Navigation Items
   │  └─ Collapse Toggle (bottom)
   │
   ├─ 📊 /dashboard
   │  ├─ Welcome header
   │  ├─ 4 feature overview cards
   │  └─ Phase 2 preview section
   │
   ├─ 📝 /posts
   │  ├─ Header with "New Post" button
   │  ├─ Filter tabs (All | Drafts | Published)
   │  ├─ Post grid (2 columns on desktop)
   │  └─ Click → /posts/[id]
   │
   ├─ 📄 /posts/[id]
   │  ├─ Back to Posts link
   │  ├─ Post header (title, platform, status)
   │  ├─ Action buttons (Edit, Share, Delete)
   │  ├─ Post content (formatted)
   │  └─ Published info (if published)
   │
   ├─ ⚙️ /settings
   │  ├─ Appearance section
   │  │  └─ Theme selector (Dark/Light)
   │  ├─ AI Provider Settings
   │  │  ├─ Default provider dropdown
   │  │  └─ API keys for 4 providers
   │  └─ Connected Accounts
   │     ├─ LinkedIn (connected)
   │     └─ Twitter (not connected)
   │
   └─ 👤 /account
      ├─ Profile section (with Clerk UserButton)
      ├─ Account details (email, join date, security)
      ├─ Usage statistics (posts created/published)
      └─ Subscription info (Free plan)
```

---

## 🎨 Sidebar States

### Expanded State (w-64 / 256px)
```
┌─────────────────────┐
│   Levercast         │
├─────────────────────┤
│                     │
│ 📊  Dashboard       │ ← Active: accent bg
│ 📝  Posts           │
│ ⚙️  Settings        │
│ 👤  Account         │
│                     │
│                     │
│                     │
│        ◀            │ ← Collapse button
└─────────────────────┘
```

### Collapsed State (w-16 / 64px)
```
┌────┐
│ L  │ ← Logo icon
├────┤
│    │
│ 📊 │ + Tooltip: "Dashboard"
│ 📝 │ + Tooltip: "Posts"
│ ⚙️ │ + Tooltip: "Settings"
│ 👤 │ + Tooltip: "Account"
│    │
│    │
│ ▶  │ ← Expand button
└────┘
```

---

## 🎯 Key Interactions

### Sidebar
- **Click** navigation item → Navigate to route
- **Click** collapse/expand → Toggle sidebar state
- **Hover** (collapsed) → Show tooltip
- **Active** route → Highlight with accent color

### Posts Page
- **Click** tab → Filter posts by status
- **Click** post card → Navigate to detail
- **Click** "New Post" → Create new post (Phase 2)
- **Hover** post card → Border changes to accent

### Post Detail
- **Click** "Back to Posts" → Return to list
- **Click** "Edit" → Edit mode (Phase 2)
- **Click** "Share" → Share modal (Phase 2)
- **Click** "Delete" → Confirmation modal (Phase 2)

### Settings
- **Click** theme option → Change theme (Phase 2)
- **Select** LLM provider → Update default
- **Type** API key → Show/hide toggle
- **Click** "Save" → Save settings (Phase 2)
- **Click** "Connect" → OAuth flow (Phase 2)

### Account
- **Click** UserButton → Clerk menu
- **Click** "Upgrade" → Pricing page (Phase 2)

---

## 📱 Responsive Behavior

| Screen Size | Sidebar Behavior | Layout |
|------------|------------------|---------|
| < 1024px   | Auto-collapsed   | Single column |
| ≥ 1024px   | User preference  | Multi-column |

Content area dynamically adjusts based on sidebar state:
- Collapsed: `ml-16` (64px margin)
- Expanded: `ml-64` (256px margin)

---

## 🎨 Color Usage

### Navigation
- **Background**: `#0E0E0F` (sidebar)
- **Text**: `#A0A0A5` (inactive)
- **Active**: `#C3F43B` (accent icon)
- **Active BG**: `#18181A` (secondary)
- **Border**: `#2A2A2D`

### Content Cards
- **Background**: `#18181A` (card)
- **Text**: `#FFFFFF` (primary)
- **Border**: `#2A2A2D`
- **Hover Border**: `#C3F43B50` (accent 50%)

### Buttons
- **Primary BG**: `#C3F43B`
- **Primary Text**: `#0E0E0F`
- **Hover**: `#C3F43B` @ 90% opacity

---

## ✨ Animation Timings

| Element | Duration | Easing |
|---------|----------|--------|
| Sidebar toggle | 200ms | ease-in-out |
| Hover effects | 150ms | ease |
| Page transitions | N/A | Instant |
| Border color | 200ms | ease |
| Tooltip appear | instant | - |

---

## 📊 Mock Data Summary

### Posts (4 total)
- **Published**: 2 (LinkedIn posts)
- **Drafts**: 2 (Twitter posts)

### User Stats
- **Posts Created**: 12
- **Posts Published**: 8
- **Member Since**: Oct 15, 2024

### API Keys
- **Configured**: 1 (OpenAI)
- **Available**: 4 (OpenAI, Anthropic, Gemini, OpenRouter)

### Connected Accounts
- **LinkedIn**: ✅ Connected
- **Twitter**: ❌ Not connected

---

**Last Updated**: November 4, 2024
**Phase**: 1 Complete
**Next**: Phase 2 - Idea Capture Widget

