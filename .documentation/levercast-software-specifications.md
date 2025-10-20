# **Levercast – Software Requirements Specification (SRS)**

## **System Design**

* **Purpose:**
  Levercast converts spontaneous ideas (text or voice) into polished, multi-platform social posts via AI processing.
* **Core Modules:**

  * Idea Capture (text + voice)
  * AI Processing (LLM integration)
  * Preview & Editing (LinkedIn/Twitter UI)
  * Publishing (OAuth integration)
  * API Key & Account Settings
  * Future: Team Collaboration
* **System Flow:**
  User inputs → AI Processing → Output Generation → Preview/Edit → Publish → Store Metadata (Supabase DB)

---

## **Architecture Pattern**

* **Pattern:** Modular **Next.js App Router** with **Client-Server Separation**
* **Frontend:** React components (app directory, server + client components)
* **Backend:** Supabase edge functions (for storage, publishing, API key management)
* **API Gateway:** Next.js API routes → Supabase RPC → external LLM APIs
* **File Storage:** Supabase storage for user-uploaded images or voice transcripts
* **Deployment:** Single unified deployment on **Vercel**

---

## **State Management**

* **Client State:**

  * Zustand or Context API for global UI state (theme, sidebar state, modals)
  * React Query (TanStack) for data fetching, caching, and mutation handling
* **Server State:**

  * Supabase real-time sync for post updates
  * Prisma ORM for relational data consistency

---

## **Data Flow**

1. **Idea Capture**

   * User types or records → temporary local state
   * Audio converted to text (browser Speech API or Whisper API via Supabase function)
2. **AI Processing**

   * Request sent to `/api/process` → routes to selected LLM provider
   * Output stored temporarily in Supabase `drafts` table
3. **Editing & Preview**

   * User edits inline → autosaves via React Query mutation
4. **Publishing**

   * Calls `/api/publish` → handles OAuth (LinkedIn/Twitter) → posts content
   * Updates `posts` table with publish metadata
5. **Settings & API Keys**

   * Stored encrypted in Supabase, Clerk manages identity linking

---

## **Technical Stack**

| Layer             | Technology                              | Purpose                             |
| ----------------- | --------------------------------------- | ----------------------------------- |
| **Frontend**      | Next.js (App Router)                    | Core framework                      |
|                   | React + TypeScript                      | UI components                       |
|                   | Tailwind CSS + Shadcn/UI + Lucide Icons | Styling & Icons                     |
| **State**         | Zustand + React Query                   | Global & server state               |
| **Backend**       | Supabase + Prisma                       | Database, auth, storage             |
| **Auth**          | Clerk                                   | OAuth, session, and user management |
| **LLM APIs**      | OpenAI, Anthropic, Vertex, OpenRouter   | AI text generation                  |
| **Payments**      | Stripe                                  | Subscription billing                |
| **Deployment**    | Vercel                                  | Hosting + serverless runtime        |
| **Notifications** | Sonner                                  | Success/error toasts                |

---

## **Authentication Process**

* **Provider:** Clerk
* **Supported Methods:** Email/password, Google, GitHub
* **Flow:**

  1. User signs up/signs in via Clerk modal.
  2. Session token passed to Next.js API routes via middleware.
  3. Clerk user ID used as foreign key in Supabase tables (`users`, `posts`, `drafts`).
  4. Access control enforced via Supabase Row Level Security (RLS).

---

## **Route Design**

**App Directory Structure:**

```
/app
 ├─ /dashboard
 │   ├─ page.tsx
 │   └─ components/IdeaInput.tsx
 ├─ /posts
 │   ├─ [id]/page.tsx
 │   └─ components/PostPreview.tsx
 ├─ /settings
 │   ├─ page.tsx
 │   └─ components/APIKeyManager.tsx
 ├─ /api
 │   ├─ process/route.ts
 │   ├─ publish/route.ts
 │   ├─ auth/callback.ts
 │   └─ voice/transcribe.ts
```

**Primary Routes:**

* `/dashboard` – Idea input + AI results
* `/posts` – Drafts and published list
* `/settings` – API keys, LLM provider, theme toggle
* `/api/*` – Serverless functions

---

## **API Design**

| Endpoint                | Method   | Description                                     |
| ----------------------- | -------- | ----------------------------------------------- |
| `/api/process`          | POST     | Sends text/audio → returns AI-generated outputs |
| `/api/publish`          | POST     | Publishes post to LinkedIn/Twitter              |
| `/api/voice/transcribe` | POST     | Converts audio to text                          |
| `/api/keys`             | GET/POST | Manage API key storage                          |
| `/api/user`             | GET      | Fetch user profile, linked accounts             |

* **LLM Request Schema (POST /api/process):**

```json
{
  "provider": "openai",
  "apiKey": "user_api_key",
  "inputText": "Raw user idea",
  "templates": ["LinkedIn", "Twitter"]
}
```

* **Response:**

```json
{
  "linkedin_post": "Formatted LinkedIn text...",
  "twitter_thread": ["Tweet 1", "Tweet 2"]
}
```

---

## **Database Design (ERD)**

**Entities:**

* **users**

  * id (Clerk user ID)
  * name
  * email
  * created_at
* **drafts**

  * id
  * user_id (FK → users.id)
  * content_raw
  * content_ai
  * platform
  * status (draft/published)
  * created_at
* **posts**

  * id
  * user_id (FK → users.id)
  * platform
  * content
  * published_at
  * post_url
* **api_keys**

  * id
  * user_id (FK → users.id)
  * provider
  * encrypted_key
* **settings**

  * id
  * user_id (FK → users.id)
  * theme
  * sidebar_state
  * last_login

**ERD Summary:**

```
users ──< drafts
users ──< posts
users ──< api_keys
users ──< settings
```

