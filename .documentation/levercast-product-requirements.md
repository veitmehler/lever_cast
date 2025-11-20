# **Product Requirements Document: Levercast**

## **1. Elevator Pitch**

Levercast is an AI-powered content ideation and publishing tool for entrepreneurs. It captures spontaneous thoughts via text or voice, formats them into polished posts using customizable AI templates and writing style preferences, and instantly generates optimized versions for multiple platforms—including LinkedIn, Twitter/X, Facebook, Instagram, Threads, and Telegram. By turning scattered inspiration into ready-to-publish content, Levercast helps busy founders save time and amplify their personal brand effortlessly.

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

  * Integration with multiple LLM APIs (OpenAI, Anthropic, Google Gemini, OpenRouter).
  * Customizable templates that users can create, edit, and manage.
  * Writing style analysis feature that learns from user-provided text samples.
  * Automatically generates platform-optimized outputs for LinkedIn, Twitter/X, Facebook, Instagram, Threads, and Telegram.
  * AI image generation support (Fal.ai, OpenAI DALL-E, Replicate) with style customization.
* **Preview & Editing**

  * Display outputs styled to mimic native platform UIs (LinkedIn post view, tweet thread view).
  * Allow inline editing of generated content.
  * Enable attachment previews and platform-specific image formatting.
* **Publishing**

  * OAuth integration for LinkedIn, Twitter/X, Facebook, Instagram, and Threads authentication.
  * Telegram Bot API integration for channel posting.
  * Direct publish or schedule posts to connected accounts.
  * Bulk publishing and scheduling for multiple platforms simultaneously.
  * Twitter thread support with sequential reply publishing.
  * Image publishing support for LinkedIn and Twitter/X.
  * Automated scheduled post publishing via cron jobs.
* **Onboarding & Configuration**

  * API key management for connecting chosen LLM providers (OpenAI, Anthropic, Gemini, OpenRouter).
  * AI image generation provider and model selection (Fal.ai, OpenAI DALL-E, Replicate).
  * Writing style configuration (manual description or AI-powered analysis from text samples).
  * Guided setup for OAuth and account linking for all supported platforms.
  * Social connection status display with reconnection options.
  * Default platform selection and post target preferences (Personal Profile vs Business Page for LinkedIn/Facebook).
  * Telegram channel ID configuration.
  * Theme customization (light/dark mode).
* **Team Collaboration (Post-MVP)**

  * Shared workspaces for content teams.
  * Role-based permissions (creator, editor, publisher).

---

## **4. User Stories**

* **As an entrepreneur**, I want to record my idea by voice while walking, so I never lose spontaneous inspiration.
* **As a user**, I want my rough notes turned into professional post drafts automatically.
* **As a creator**, I want to see exactly how my post will appear on LinkedIn, Twitter/X, Facebook, Instagram, Threads, and Telegram before publishing.
* **As a busy founder**, I want to publish my AI-polished post directly without switching tabs or tools.
* **As a user**, I want to connect my preferred AI API key, so I can use my own LLM provider.
* **As a future team member**, I want to collaborate on post drafts inside shared workspaces.

---

## **5. User Interface**

* **Main Dashboard**

  * Central input area with "Type" and "Record" options (Web Speech API for voice input).
  * Upload button for attaching images or generate images with AI.
  * Template selector dropdown for choosing post structure.
  * Multi-platform selection (select one or all platforms).
  * Recent posts feed showing draft, scheduled, and published content.
  * Bulk actions (publish all, schedule all) for generated content.
* **AI Output View**

  * Platform-specific previews styled to mimic native platform UIs (LinkedIn, Twitter/X, Facebook, Instagram, Threads, Telegram).
  * Editable text boxes styled like native platform posts.
  * Character limit indicators with color-coded warnings (80%, 95%, over limit).
  * "Regenerate," "Edit," "Publish," and "Schedule" buttons.
  * Thread visualization for Twitter/X multi-tweet threads.
  * Image preview and attachment support.
* **Settings Panel**

  * API key management for LLM providers (OpenAI, Anthropic, Gemini, OpenRouter) and image generation providers (Fal.ai, OpenAI DALL-E, Replicate).
  * Default model selection per provider.
  * Writing style configuration with AI-powered analysis from text samples.
  * Connected accounts management (OAuth) for LinkedIn, Twitter/X, Facebook, Instagram, Threads.
  * Telegram Bot API key and channel ID configuration.
  * Social connection status display with reconnection options.
  * Post target preferences (Personal Profile vs Business Page for LinkedIn/Facebook).
  * Theme customization (light/dark mode).
* **Mobile Responsive Layout**

  * Simplified capture interface for fast idea entry.
  * Optimized for on-the-go voice recording and review.


