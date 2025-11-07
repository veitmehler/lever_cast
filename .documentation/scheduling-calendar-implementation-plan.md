# Scheduling & Content Calendar Implementation Plan

## Overview
Add post scheduling functionality and a content calendar to allow users to schedule posts for future publication and visualize their content timeline.

## Database Schema Changes

### 1. Update Post Model (`prisma/schema.prisma`)
- **Add `scheduledAt` field**: `DateTime?` - When the post is scheduled to be published
- **Update `status` field**: Add `'scheduled'` as a valid status value
- **Update `publishedAt` field**: Make it nullable (`DateTime?`) since scheduled posts won't have a publishedAt until they're actually published
- **Add index**: `@@index([userId, scheduledAt, status])` for efficient calendar queries

**Changes:**
```prisma
model Post {
  id          String    @id @default(cuid())
  userId      String
  draftId     String?
  platform    String
  content     String    @db.Text
  publishedAt DateTime? // Changed from DateTime to DateTime?
  scheduledAt DateTime? // NEW: When post is scheduled to publish
  postUrl     String?
  status      String    @default("published") // published, scheduled, failed, deleted
  errorMsg    String?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  
  // Relations
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  draft       Draft?    @relation(fields: [draftId], references: [id], onDelete: SetNull)
  
  @@index([userId, platform, publishedAt])
  @@index([draftId])
  @@index([userId, scheduledAt, status]) // NEW: For calendar queries
  @@map("posts")
}
```

### 2. Migration
- Create migration: `npx prisma migrate dev --name add_scheduling_to_posts`
- Update Prisma Client: `npx prisma generate`

## API Changes

### 1. Update `/api/posts` Route (`src/app/api/posts/route.ts`)

#### POST Handler Updates:
- Accept `scheduledAt` parameter (ISO date string or null)
- If `scheduledAt` is provided:
  - Set `status` to `'scheduled'`
  - Set `scheduledAt` field
  - Set `publishedAt` to `null`
- If `scheduledAt` is null:
  - Set `status` to `'published'`
  - Set `publishedAt` to current time
  - Set `scheduledAt` to `null`

#### GET Handler Updates:
- Add query parameter support: `?status=scheduled` or `?status=published`
- Add date range filtering: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`
- Return scheduled posts with their `scheduledAt` dates
- Return published posts with their `publishedAt` dates

### 2. New API Route: `/api/posts/scheduled` (`src/app/api/posts/scheduled/route.ts`)
- **GET**: Fetch all scheduled posts for the user
  - Filter by `status='scheduled'`
  - Order by `scheduledAt` ASC
  - Include draft information

### 3. Update `/api/posts/[id]` Route (`src/app/api/posts/[id]/route.ts`)

#### PATCH Handler Updates:
- Allow updating `scheduledAt` for scheduled posts
- Allow updating `content` for scheduled posts (before they're published)
- Allow canceling scheduled posts (change status to 'deleted' or remove)

#### DELETE Handler Updates:
- Handle deletion of scheduled posts
- If scheduled post is deleted, don't publish it

### 4. New API Route: `/api/posts/calendar` (`src/app/api/posts/calendar/route.ts`)
- **GET**: Fetch posts for calendar view
  - Query parameters: `startDate`, `endDate` (ISO date strings)
  - Returns all posts (published and scheduled) within date range
  - Groups by date
  - Returns format:
    ```json
    {
      "2024-01-15": [
        { id: "...", platform: "linkedin", status: "published", publishedAt: "...", draftId: "..." },
        { id: "...", platform: "twitter", status: "scheduled", scheduledAt: "...", draftId: "..." }
      ]
    }
    ```

## Frontend Components

### 1. Scheduling Modal Component (`src/components/ScheduleModal.tsx`)
**Purpose**: Modal dialog for scheduling a post

**Props:**
- `isOpen: boolean`
- `onClose: () => void`
- `onSchedule: (scheduledAt: Date) => Promise<void>`
- `platform: 'linkedin' | 'twitter'`
- `content: string`

**Features:**
- Date picker (date + time)
- Timezone selection (default to user's timezone)
- "Schedule" button
- "Cancel" button
- Validation: scheduledAt must be in the future
- Show preview of scheduled date/time

**UI Library**: Use `react-datepicker` or similar for date/time picker

### 2. Update PlatformPreview Component (`src/components/PlatformPreview.tsx`)
**Changes:**
- Replace single "Publish" button with dropdown or toggle:
  - "Publish Now" - immediate publication
  - "Schedule" - opens ScheduleModal
- Show scheduled status if post is scheduled:
  - Badge: "Scheduled for [date/time]"
  - Disable publish button if already scheduled
- Add `isScheduled?: boolean` and `scheduledDate?: Date` props

### 3. Content Calendar Component (`src/components/ContentCalendar.tsx`)
**Purpose**: Main calendar view showing posts

**Features:**
- Month view calendar grid
- Click on date to see posts for that day
- Color coding:
  - **Published posts**: Green/blue (past dates)
  - **Scheduled posts**: Orange/yellow (future dates)
- Click on post to navigate to post editor
- Navigation: Previous/Next month
- Today indicator
- Post count badges on dates with posts

**UI Library Options:**
- `react-calendar` (simple, lightweight)
- `react-big-calendar` (more features, but heavier)
- Custom implementation using date-fns

**State:**
- `selectedDate: Date | null`
- `currentMonth: Date`
- `postsByDate: Record<string, Post[]>`

**Props:**
- `posts: Post[]` - Array of posts (published + scheduled)
- `onPostClick: (post: Post) => void` - Navigate to post editor

### 4. Calendar Day View Component (`src/components/CalendarDayView.tsx`)
**Purpose**: Shows posts for a selected day

**Features:**
- List of posts for selected date
- Group by platform
- Show post preview (title/content snippet)
- Click to edit/view post
- Show status badges (Published/Scheduled)

## Page Updates

### 1. New Content Calendar Page (`src/app/(protected)/calendar/page.tsx`)
**Route**: `/calendar`

**Features:**
- Full-page calendar view
- Fetch posts from `/api/posts/calendar`
- Handle date range (current month ± 1 month)
- Click on post → navigate to `/posts/[draftId]`
- Responsive design (mobile-friendly)

**Layout:**
```
┌─────────────────────────────────────┐
│  Content Calendar                   │
│  [← Prev] [Month Year] [Next →]     │
├─────────────────────────────────────┤
│  [Calendar Grid]                    │
│  [Day View Panel]                   │
└─────────────────────────────────────┘
```

### 2. Update Sidebar (`src/components/Sidebar.tsx`)
**Changes:**
- Add new nav item:
  ```typescript
  { label: 'Calendar', href: '/calendar', icon: <Calendar className="w-5 h-5" /> }
  ```
- Import Calendar icon from lucide-react
- Position: After "Posts", before "Templates"

### 3. Update Dashboard (`src/app/(protected)/dashboard/page.tsx`)
**Changes:**
- Update `handlePublish` function:
  - Add parameter: `scheduledAt?: Date`
  - If `scheduledAt` provided, create scheduled post
  - If not, publish immediately
- Update PlatformPreview usage:
  - Add `onSchedule` callback
  - Pass `isScheduled` and `scheduledDate` props if applicable

### 4. Update Posts Page (`src/app/(protected)/posts/page.tsx`)
**Changes:**
- Show scheduled posts in the list
- Add badge/filter for "Scheduled" status
- Show scheduled date/time for scheduled posts
- Allow editing scheduled posts

### 5. Update Post Detail Page (`src/app/(protected)/posts/[id]/page.tsx`)
**Changes:**
- Show scheduled status if post is scheduled
- Allow rescheduling scheduled posts
- Allow canceling scheduled posts
- Show "Publish Now" button for scheduled posts (to publish immediately)
- Update PlatformPreview to show scheduling options

## UI/UX Flow

### Scheduling Flow:
1. User generates/edits post on Dashboard or Posts page
2. Clicks "Schedule" button (instead of "Publish Now")
3. ScheduleModal opens with date/time picker
4. User selects date/time
5. Clicks "Schedule" in modal
6. Post is created with `status='scheduled'` and `scheduledAt` set
7. Post appears in calendar view
8. Post can be edited before scheduled time
9. (Future: Background job publishes at scheduled time)

### Calendar Flow:
1. User navigates to `/calendar`
2. Calendar loads with current month
3. Dates with posts show colored indicators
4. User clicks on a date
5. Day view shows all posts for that date
6. User clicks on a post
7. Navigates to `/posts/[draftId]` to edit/view

## Styling & Design

### Color Scheme:
- **Published Posts (Past)**: 
  - Primary: `bg-green-500` or `bg-blue-500`
  - Text: `text-white`
- **Scheduled Posts (Future)**:
  - Primary: `bg-orange-500` or `bg-yellow-500`
  - Text: `text-white`
- **Today**: Border highlight `border-2 border-primary`

### Calendar Design:
- Clean, minimal calendar grid
- Hover effects on dates with posts
- Tooltip showing post count on hover
- Responsive: Stack on mobile, grid on desktop

## Dependencies to Add

```json
{
  "dependencies": {
    "react-datepicker": "^4.25.0", // For date/time picker
    "@types/react-datepicker": "^4.19.0", // TypeScript types
    "date-fns": "^2.30.0" // For date manipulation
  }
}
```

## Implementation Order

### Phase 1: Database & API (Foundation)
1. ✅ Update Prisma schema
2. ✅ Create migration
3. ✅ Update Prisma Client
4. ✅ Update `/api/posts` POST handler
5. ✅ Update `/api/posts` GET handler
6. ✅ Create `/api/posts/calendar` route
7. ✅ Update `/api/posts/[id]` PATCH handler

### Phase 2: Scheduling UI (Core Feature)
1. ✅ Install date picker library
2. ✅ Create ScheduleModal component
3. ✅ Update PlatformPreview component
4. ✅ Update Dashboard page
5. ✅ Update Posts page
6. ✅ Update Post detail page

### Phase 3: Content Calendar (Visualization)
1. ✅ Install calendar library
2. ✅ Create ContentCalendar component
3. ✅ Create CalendarDayView component
4. ✅ Create `/calendar` page
5. ✅ Update Sidebar navigation
6. ✅ Add styling and polish

### Phase 4: Testing & Refinement
1. ✅ Test scheduling flow end-to-end
2. ✅ Test calendar navigation
3. ✅ Test editing scheduled posts
4. ✅ Test canceling scheduled posts
5. ✅ Mobile responsiveness
6. ✅ Error handling

## Future Enhancements (Out of Scope for MVP)

1. **Background Job for Publishing**:
   - Set up cron job or queue system (e.g., Bull, Agenda.js)
   - Automatically publish scheduled posts at their scheduled time
   - Update post status from 'scheduled' to 'published'

2. **Bulk Scheduling**:
   - Schedule multiple posts at once
   - Recurring posts (daily, weekly, etc.)

3. **Timezone Management**:
   - User timezone settings
   - Convert scheduled times to user's timezone

4. **Calendar Views**:
   - Week view
   - Day view
   - List view

5. **Notifications**:
   - Email/notification when scheduled post is published
   - Reminder before scheduled post goes live

6. **Analytics**:
   - Best times to post (based on engagement)
   - Schedule optimization suggestions

## Technical Considerations

1. **Date Handling**:
   - Store dates in UTC in database
   - Convert to user's timezone in UI
   - Use ISO 8601 format for API communication

2. **Validation**:
   - Ensure scheduledAt is in the future
   - Prevent scheduling posts in the past
   - Validate date/time format

3. **Performance**:
   - Paginate calendar API responses
   - Cache calendar data
   - Lazy load posts for dates

4. **Error Handling**:
   - Handle timezone conversion errors
   - Handle invalid date formats
   - Handle API failures gracefully

5. **Accessibility**:
   - Keyboard navigation for calendar
   - Screen reader support
   - ARIA labels for date picker

## Testing Checklist

- [ ] Can schedule a post for future date
- [ ] Scheduled post appears in calendar
- [ ] Can edit scheduled post before it's published
- [ ] Can cancel scheduled post
- [ ] Can reschedule a scheduled post
- [ ] Calendar shows published posts (past)
- [ ] Calendar shows scheduled posts (future)
- [ ] Different colors for published vs scheduled
- [ ] Clicking post in calendar navigates to editor
- [ ] Mobile responsive calendar
- [ ] Date picker works correctly
- [ ] Timezone handling works
- [ ] API endpoints return correct data
- [ ] Database queries are efficient

