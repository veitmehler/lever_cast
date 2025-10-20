# **User Interface Design Document (UIDD) – Levercast**

## **Layout Structure**

* **Primary Layout:**
  Clean, single-column workspace optimized for focus and writing flow.
  The interface centers around one main content area, a collapsible left sidebar, and a minimal top navigation bar.

* **Sections:**

  1. **Sidebar (Left, Collapsible):**

     * **Expanded State:**
       Displays both **icons** and **labels** for each section — *Dashboard*, *Posts*, *Settings*, *Account*.
       Ideal for onboarding and casual users who benefit from clear navigation cues.
     * **Collapsed State:**
       Displays **icons only**, aligned vertically in a narrow strip.
       Expands on hover or when toggled manually.
       Designed for experienced users who prefer maximum workspace.
     * **Behavior:**
       Transition between states uses a smooth width animation (200–250 ms).
       The collapse toggle is a chevron icon located at the bottom of the sidebar.
     * **Persistence:**
       User preference (collapsed or expanded) is remembered between sessions.

  2. **Main Workspace (Center):**

     * **Idea Capture Area:**
       Prominent text input box with placeholder “Type your idea…”
       Below it, a circular record button for voice capture with live waveform animation.
       Optional image attachment icon on the right edge.
     * **AI Output Area:**
       Appears dynamically below the input after submission.
       Displays generated previews (LinkedIn and Twitter) as stacked cards, styled to mimic platform appearance.

  3. **Footer (Minimal):**
     Small strip showing system status (API connection, publish status) and last autosave time.

---

## **Core Components**

* **Idea Capture Widget:**
  Dual-mode input — text typing and voice recording with real-time transcription.
  Attachment support for reference images.

* **AI Output Cards:**
  Contain generated post drafts, styled as native platform previews.
  Each includes:

  * Inline editable text area
  * “Regenerate,” “Edit,” and “Publish” buttons
  * Platform logo watermark (LinkedIn, Twitter)
  * Hover effects for quick actions

* **Sidebar Navigation:**

  * Vertical navigation bar, collapsible as detailed above.
  * Hover tooltips appear in collapsed mode.
  * Icons use the accent color when active or hovered.

* **Settings Panel:**
  Accessed via sidebar or top-right user avatar.
  Contains:

  * API key management and LLM provider selection
  * OAuth connections for LinkedIn and Twitter
  * Dark/Light theme toggle

---

## **Interaction Patterns**

* **Primary Flow:**
  User types or records → AI processes → previews appear → user edits inline → publishes.

* **Input Feedback:**

  * Voice recording shows animated waveform and progress ring.
  * Submission triggers a brief loading shimmer before results appear.

* **Editing:**
  Inline editing with autosave every 5 seconds.
  “Undo” and “Redo” keyboard shortcuts supported.

* **Publishing:**
  Confirm dialog before posting.
  Success notification (“✅ Post published successfully”) fades in top-right.

* **Sidebar Interaction:**

  * Hover over collapsed sidebar expands temporarily.
  * Clicking the chevron toggles full collapse/expand state.
  * Smooth transition preserves layout stability.

* **Theme Toggle:**
  Located in settings; instantly switches between dark and light modes with soft fade animation.

---

## **Visual Design Elements & Color Scheme**

* **Default Theme:** Dark Mode

  * Background: `#0E0E0F`
  * Secondary surfaces: `#18181A`
  * Primary text: `#FFFFFF`
  * Secondary text: `#A0A0A5`
  * Accent (buttons, highlights): Bright yellow-green `#C3F43B`
  * Borders/dividers: `#2A2A2D`

* **Light Mode (Optional):**

  * Background: `#FFFFFF`
  * Primary text: `#101010`
  * Accent: `#C3F43B` (same for brand consistency)

* **Icons:**
  Line icons, single-weight strokes. Accent glow on hover.

* **Micro-Animations:**
  Opacity fade (150–200 ms) for transitions; hover lift effect on interactive cards.

---

## **Mobile, Web App, Desktop Considerations**

* **Web App (Primary):**
  Fully responsive layout.
  Sidebar collapses automatically under 1024 px width.
  Keyboard shortcuts:

  * `⌘ + N` → New Idea
  * `⌘ + Enter` → Publish
  * `⌘ + K` → Toggle Theme

* **Mobile (Responsive MVP):**

  * Bottom navigation replaces sidebar (Home, Create, Posts, Settings).
  * Voice capture prioritized with large central button.
  * AI output cards stacked vertically; swipe to edit.

* **Desktop (Future App):**
  Native wrapper with system-level theme sync and offline draft support.

---

## **Typography**

* **Primary Font:** Inter (fallbacks: Satoshi, IBM Plex Sans)
* **Weights:**

  * Regular 400 – body text
  * Medium 500 – labels and placeholders
  * Semibold 600 – headings and buttons
* **Line Spacing:** 1.5 × font size for clarity.
* **Letter Spacing:** Slightly expanded (+2%) for readability in dark mode.

---

## **Accessibility**

* **Color Contrast:** All text/background ratios ≥ 4.5:1.
* **Keyboard Navigation:** Full Tab and Enter key coverage, including sidebar toggle and publish action.
* **ARIA Labels:**

  * Voice record button: “Record idea”
  * Theme toggle: “Switch theme”
  * Publish button: “Publish post”
* **Autosave Announcements:** Screen reader notifies “Draft saved.”
* **Motion Preferences:** Respects OS settings for reduced motion, disabling non-essential animations.

