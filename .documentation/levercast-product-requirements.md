# **Product Requirements Document: Levercast**

## **1. Elevator Pitch**

Levercast is an AI-powered content ideation and publishing tool for entrepreneurs. It captures spontaneous thoughts via text or voice, formats them into polished posts using predefined AI templates, and instantly generates optimized versions for multiple platforms—starting with LinkedIn and Twitter. By turning scattered inspiration into ready-to-publish content, Levercast helps busy founders save time and amplify their personal brand effortlessly.

---

## **2. Who is this app for**

* **Primary Users:** Entrepreneurs, solopreneurs, and founders who post regularly on social media.
* **Secondary Users:** Content creators, coaches, and consultants seeking efficient multi-platform posting.
* **Key Pain Points Solved:**

  * Losing ideas due to friction in capturing them quickly.
  * Spending too much time rewriting content for each platform.
  * Inconsistent posting habits due to workflow complexity.

---

## **3. Functional Requirements**

* **Idea Capture**

  * Text input field for typing raw ideas.
  * Voice input with real-time speech-to-text transcription.
  * Optional image attachment support for visual inspiration.
* **AI Processing**

  * Integration with multiple LLM APIs (OpenAI, Anthropic, Google Vertex Gemini, OpenRouter).
  * Uses predefined templates (non-editable) to structure ideas.
  * Automatically generates platform-optimized outputs (LinkedIn & Twitter for MVP).
  * Future capability to train “RackStyle” — the user’s personalized writing voice model.
* **Preview & Editing**

  * Display outputs styled to mimic native platform UIs (LinkedIn post view, tweet thread view).
  * Allow inline editing of generated content.
  * Enable attachment previews and platform-specific image formatting.
* **Publishing**

  * OAuth integration for LinkedIn and Twitter authentication.
  * Direct publish or schedule posts to connected accounts.
* **Onboarding & Configuration**

  * API key management for connecting chosen LLM providers.
  * Guided setup for OAuth and account linking.
* **Team Collaboration (Post-MVP)**

  * Shared workspaces for content teams.
  * Role-based permissions (creator, editor, publisher).

---

## **4. User Stories**

* **As an entrepreneur**, I want to record my idea by voice while walking, so I never lose spontaneous inspiration.
* **As a user**, I want my rough notes turned into professional post drafts automatically.
* **As a creator**, I want to see exactly how my post will appear on LinkedIn and Twitter before publishing.
* **As a busy founder**, I want to publish my AI-polished post directly without switching tabs or tools.
* **As a user**, I want to connect my preferred AI API key, so I can use my own LLM provider.
* **As a future team member**, I want to collaborate on post drafts inside shared workspaces.

---

## **5. User Interface**

* **Main Dashboard**

  * Central input area with “Type” and “Record” options.
  * Upload button for attaching images.
  * Recent posts feed showing draft and published content.
* **AI Output View**

  * Side-by-side LinkedIn and Twitter previews.
  * Editable text boxes styled like native platform posts.
  * “Regenerate,” “Edit,” and “Publish” buttons.
* **Settings Panel**

  * API key management and LLM provider selection.
  * Connected accounts management (OAuth).
* **Mobile Responsive Layout**

  * Simplified capture interface for fast idea entry.
  * Optimized for on-the-go voice recording and review.


