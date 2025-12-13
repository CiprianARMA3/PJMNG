# Kapry.dev - AI-Powered Developer Platform

Kapry.dev is a comprehensive, AI-enhanced project management solution designed specifically for software teams. It bridges the gap between traditional project management (Kanban, Roadmaps) and active development assistance (Code Review, SQL Generation) by leveraging Google's Gemini models.

## 🌟 Core Features

### 🤖 AI Development Suite
The platform integrates Google's **Gemini 2.5 Pro** and **Gemini 3.0 Pro** models to provide context-aware assistance:
* **AI Code Review:** Connects directly to GitHub repositories via Octokit. It fetches the full file tree, caches the context using Google's Generative AI caching API, and performs deep security and architecture reviews on pull requests or specific files.
* **SQL Architect:** Converts natural language into optimized SQL queries. It can generate schema tables and data preview "wizards" to visualize `INSERT` or `UPDATE` operations before execution.
* **Roadmap Visualizer:** Generates technical product roadmaps in structured Markdown tables, identifying critical paths, dependencies, and architectural risks automatically.
* **Context-Aware Chat:** A general-purpose coding assistant that maintains conversation history and context per project.

### 📊 Project Management
* **Kanban Boards:** Interactive drag-and-drop task management.
* **Activity Logs:** Real-time tracking of team velocity, repository commits, and token usage.
* **Team Collaboration:** Role-based access control for managing team members and permissions.

### 💳 Usage & Billing
* **Token-Based System:** AI usage is tracked via a custom token system stored in Supabase (`token_packs`, `token_usage_logs`).
* **Stripe Integration:** Seamless subscription management for purchasing token packs and upgrading workspace tiers.

## 🏗 Technical Architecture

### Frontend
* **Framework:** Next.js 16 (App Router)
* **Styling:** TailwindCSS with a custom "Aurora" glassmorphism design system.
* **Icons & UI:** Lucide React.
* **State Management:** React Server Components & Server Actions.

### Backend & Infrastructure
* **Database:** Supabase (PostgreSQL) for relational data (projects, chats, users).
* **Authentication:** Supabase Auth (SSR flow).
* **AI Engine:** Google Generative AI SDK (`@google/genai`).
* **External Integrations:** * **GitHub API (Octokit):** For fetching repository trees and file content.
    * **Stripe API:** For handling webhooks and checkout sessions.

## 🎨 Design Philosophy
The UI features a modern "dark mode" aesthetic with dynamic "Aurora" backgrounds, grain filters, and dynamic island navigation, optimized for a premium developer experience.