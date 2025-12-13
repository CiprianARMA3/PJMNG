# Local Setup Guide

Follow these steps to configure the development environment for Kapry.dev (PJMNG).

## Prerequisites
* **Node.js** (v18 or higher)
* **npm** (or yarn/pnpm)
* A **Supabase** project
* A **Google Cloud** project with Gemini API access
* A **Stripe** account

## Installation

1.  **Clone the repository:**
    ```bash
    git clone <your-repo-url>
    ```

2.  **Navigate to the frontend directory:**
    The application logic resides in the `frontend` folder.
    ```bash
    cd frontend
    ```

3.  **Install dependencies:**
    ```bash
    npm install
    ```

## Environment Configuration

1.  Create a `.env.local` file in the root of the `frontend` directory.
2.  Paste the following configuration and fill in your keys:

    ```bash
    # Supabase Configuration (Database & Auth)
    NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
    NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
    SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

    # AI Configuration (Google Gemini)
    GOOGLE_API_KEY=your_google_gemini_api_key

    # Payments (Stripe)
    STRIPE_SECRET_KEY=your_stripe_secret_key
    STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
    ```

## Database Setup

This project uses **Supabase (PostgreSQL)**. You can use the SQL schema below as a reference to create the necessary tables.

> **⚠️ Note:** The schema below is provided for context. Due to foreign key dependencies, you may need to reorder table creation or create tables without constraints first, then add constraints later.

```sql
-- WARNING: This schema is for context only and is not meant to be run directly as a single block.
-- Table order and constraints may not be valid for execution without reordering.
CREATE TABLE public.activity_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  user_id uuid,
  action text NOT NULL,
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT activity_logs_pkey PRIMARY KEY (id),
  CONSTRAINT activity_logs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT activity_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.ai_chat_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb,
  CONSTRAINT ai_chat_groups_pkey PRIMARY KEY (id),
  CONSTRAINT ai_chat_groups_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT ai_chat_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.ai_chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New Conversation'::text,
  group_context text,
  total_tokens_used integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  group_id uuid,
  CONSTRAINT ai_chats_pkey PRIMARY KEY (id),
  CONSTRAINT ai_chats_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT ai_chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT ai_chats_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.ai_chat_groups(id)
);

CREATE TABLE public.ai_code_review_chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  group_id uuid,
  title text NOT NULL DEFAULT 'New Review Session'::text,
  code_context text,
  programming_language text,
  total_tokens_used integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT ai_code_review_chats_pkey PRIMARY KEY (id),
  CONSTRAINT ai_code_review_chats_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT ai_code_review_chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT ai_code_review_chats_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.ai_code_review_groups(id)
);

CREATE TABLE public.ai_code_review_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  repository_metadata jsonb,
  metadata jsonb,
  CONSTRAINT ai_code_review_groups_pkey PRIMARY KEY (id),
  CONSTRAINT ai_code_review_groups_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT ai_code_review_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.ai_code_review_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'ai'::text])),
  content text NOT NULL,
  tokens_used integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  ai_model text,
  user_id uuid,
  CONSTRAINT ai_code_review_messages_pkey PRIMARY KEY (id),
  CONSTRAINT ai_code_review_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.ai_code_review_chats(id)
);

CREATE TABLE public.ai_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  project_id uuid,
  file_path text,
  selected_lines ARRAY DEFAULT '{}'::integer[],
  mode text NOT NULL CHECK (mode = ANY (ARRAY['chat'::text, 'contextual'::text, 'apply'::text])),
  user_prompt text NOT NULL,
  ai_response text,
  ai_diff jsonb,
  github_commit_hash text,
  modification_id uuid,
  collaborators jsonb DEFAULT '[]'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT ai_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT ai_interactions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT ai_interactions_modification_id_fkey FOREIGN KEY (modification_id) REFERENCES public.modifications(id)
);

CREATE TABLE public.ai_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'ai'::text])),
  content text NOT NULL,
  tokens_used integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  ai_model text,
  user_id uuid,
  CONSTRAINT ai_messages_pkey PRIMARY KEY (id),
  CONSTRAINT ai_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.ai_chats(id)
);

CREATE TABLE public.ai_repository_caches (
  project_id uuid NOT NULL,
  cache_key text NOT NULL,
  repository_url text NOT NULL,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ai_repository_caches_pkey PRIMARY KEY (project_id),
  CONSTRAINT ai_repository_caches_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

CREATE TABLE public.ai_roadmap_chat_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb,
  CONSTRAINT ai_roadmap_chat_groups_pkey PRIMARY KEY (id),
  CONSTRAINT ai_roadmap_chat_groups_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT ai_roadmap_chat_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.ai_roadmap_chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New Roadmap Session'::text,
  group_context text,
  total_tokens_used integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  group_id uuid,
  CONSTRAINT ai_roadmap_chats_pkey PRIMARY KEY (id),
  CONSTRAINT ai_roadmap_chats_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT ai_roadmap_chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT ai_roadmap_chats_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.ai_roadmap_chat_groups(id)
);

CREATE TABLE public.ai_roadmap_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'ai'::text])),
  content text NOT NULL,
  tokens_used integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  ai_model text,
  user_id uuid,
  CONSTRAINT ai_roadmap_messages_pkey PRIMARY KEY (id),
  CONSTRAINT ai_roadmap_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.ai_roadmap_chats(id)
);

CREATE TABLE public.ai_sql_chat_groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb,
  CONSTRAINT ai_sql_chat_groups_pkey PRIMARY KEY (id),
  CONSTRAINT ai_sql_chat_groups_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT ai_sql_chat_groups_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.ai_sql_chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL DEFAULT 'New Conversation'::text,
  group_context text,
  total_tokens_used integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  group_id uuid,
  CONSTRAINT ai_sql_chats_pkey PRIMARY KEY (id),
  CONSTRAINT ai_sql_chats_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT ai_sql_chats_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT ai_sql_chats_group_id_fkey FOREIGN KEY (group_id) REFERENCES public.ai_sql_chat_groups(id)
);

CREATE TABLE public.ai_sql_messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  role text NOT NULL CHECK (role = ANY (ARRAY['user'::text, 'ai'::text])),
  content text NOT NULL,
  tokens_used integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT timezone('utc'::text, now()),
  ai_model text,
  user_id uuid,
  CONSTRAINT ai_sql_messages_pkey PRIMARY KEY (id),
  CONSTRAINT ai_sql_messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.ai_sql_chats(id)
);

CREATE TABLE public.concepts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'Idea'::text,
  linked_task_id uuid,
  created_by uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  group_name text,
  CONSTRAINT concepts_pkey PRIMARY KEY (id),
  CONSTRAINT concepts_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT concepts_linked_task_id_fkey FOREIGN KEY (linked_task_id) REFERENCES public.tasks(id),
  CONSTRAINT concepts_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

CREATE TABLE public.groups (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  name text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb,
  CONSTRAINT groups_pkey PRIMARY KEY (id),
  CONSTRAINT groups_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

CREATE TABLE public.issue_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL,
  attachment_type text NOT NULL,
  file_url text,
  code_snippet text,
  terminal_output text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT issue_attachments_pkey PRIMARY KEY (id),
  CONSTRAINT issue_attachments_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(id)
);

CREATE TABLE public.issue_collaborators (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL,
  project_user_id uuid NOT NULL,
  role text DEFAULT 'Contributor'::text,
  added_at timestamp with time zone DEFAULT now(),
  CONSTRAINT issue_collaborators_pkey PRIMARY KEY (id),
  CONSTRAINT issue_collaborators_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(id),
  CONSTRAINT issue_collaborators_project_user_id_fkey FOREIGN KEY (project_user_id) REFERENCES public.project_users(id)
);

CREATE TABLE public.issue_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  issue_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT issue_comments_pkey PRIMARY KEY (id),
  CONSTRAINT issue_comments_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(id),
  CONSTRAINT issue_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.issues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  title text NOT NULL,
  content text,
  type text DEFAULT 'Issue'::text,
  status text DEFAULT 'Open'::text,
  priority text DEFAULT 'Normal'::text,
  github_file_path text,
  github_line_number integer,
  github_commit_hash text,
  linked_task_id uuid,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT issues_pkey PRIMARY KEY (id),
  CONSTRAINT issues_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT issues_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT issues_linked_task_id_fkey FOREIGN KEY (linked_task_id) REFERENCES public.tasks(id)
);

CREATE TABLE public.modifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  type text NOT NULL,
  description text,
  github_commit_hash text,
  linked_task_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT modifications_pkey PRIMARY KEY (id),
  CONSTRAINT modifications_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT modifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT modifications_linked_task_id_fkey FOREIGN KEY (linked_task_id) REFERENCES public.tasks(id)
);

CREATE TABLE public.plans (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  monthly_price numeric NOT NULL,
  ai_models jsonb DEFAULT '[]'::jsonb,
  features jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  yearly_price numeric NOT NULL,
  max_members bigint,
  max_projects integer,
  CONSTRAINT plans_pkey PRIMARY KEY (id)
);

CREATE TABLE public.project_caches (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid,
  cache_key text NOT NULL,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_caches_pkey PRIMARY KEY (id),
  CONSTRAINT project_caches_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

CREATE TABLE public.project_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role_info jsonb NOT NULL DEFAULT '{}'::jsonb,
  joined_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT project_users_pkey PRIMARY KEY (id),
  CONSTRAINT project_users_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT project_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  created_by uuid NOT NULL,
  github_repo_url text,
  created_at timestamp with time zone DEFAULT now(),
  settings jsonb DEFAULT '{}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  metadata jsonb DEFAULT '{"roles": {}, "github-link": null, "global_tags": [], "discord-link": null, "project-icon": null, "twitter-link": null, "website-link": null, "youtube-link": null, "facebook-link": null, "linkedin-link": null, "instagram-link": null, "project-banner": null, "global_issue_tags": []}'::jsonb,
  collaborators bigint NOT NULL,
  max_collaborators bigint NOT NULL DEFAULT '1'::bigint,
  website_url text,
  invite_code uuid DEFAULT gen_random_uuid(),
  github_personalaccesstoken text,
  CONSTRAINT projects_pkey PRIMARY KEY (id),
  CONSTRAINT projects_created_by_fkey FOREIGN KEY (created_by) REFERENCES public.users(id)
);

CREATE TABLE public.task_assignees (
  task_id uuid NOT NULL,
  user_id uuid NOT NULL,
  CONSTRAINT task_assignees_pkey PRIMARY KEY (task_id, user_id),
  CONSTRAINT task_assignees_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
  CONSTRAINT task_assignees_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.task_columns (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#E0E0E0'::text,
  position integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT task_columns_pkey PRIMARY KEY (id),
  CONSTRAINT task_columns_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

CREATE TABLE public.task_comments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL,
  user_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT task_comments_pkey PRIMARY KEY (id),
  CONSTRAINT task_comments_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
  CONSTRAINT task_comments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);

CREATE TABLE public.task_label_links (
  task_id uuid NOT NULL,
  label_id uuid NOT NULL,
  CONSTRAINT task_label_links_pkey PRIMARY KEY (task_id, label_id),
  CONSTRAINT task_label_links_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.tasks(id),
  CONSTRAINT task_label_links_label_id_fkey FOREIGN KEY (label_id) REFERENCES public.task_labels(id)
);

CREATE TABLE public.task_labels (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  name text NOT NULL,
  color text DEFAULT '#AAAAAA'::text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT task_labels_pkey PRIMARY KEY (id),
  CONSTRAINT task_labels_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

CREATE TABLE public.tasks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL,
  column_id uuid,
  title text NOT NULL,
  description text,
  assigned_to uuid,
  status text NOT NULL DEFAULT 'Todo'::text,
  start_date date,
  due_date date,
  position integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  issue_id uuid,
  start_time time without time zone DEFAULT '09:00:00'::time without time zone,
  end_time time without time zone DEFAULT '10:00:00'::time without time zone,
  task_date date DEFAULT CURRENT_DATE,
  creator_id uuid,
  CONSTRAINT tasks_pkey PRIMARY KEY (id),
  CONSTRAINT tasks_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT tasks_column_id_fkey FOREIGN KEY (column_id) REFERENCES public.task_columns(id),
  CONSTRAINT tasks_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.project_users(id),
  CONSTRAINT tasks_issue_id_fkey FOREIGN KEY (issue_id) REFERENCES public.issues(id),
  CONSTRAINT tasks_creator_id_fkey FOREIGN KEY (creator_id) REFERENCES public.users(id)
);

CREATE TABLE public.token_packs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid,
  price_paid numeric NOT NULL,
  purchased_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  metadata jsonb DEFAULT '{}'::jsonb,
  tokens_purchased jsonb NOT NULL DEFAULT '{"gemini-2.5-pro": 0, "gemini-2.5-flash": 0, "gemini-3-pro-preview": 0}'::jsonb,
  remaining_tokens jsonb NOT NULL DEFAULT '{"gemini-2.5-pro": 0, "gemini-2.5-flash": 0, "gemini-3-pro-preview": 0}'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT token_packs_pkey PRIMARY KEY (id),
  CONSTRAINT token_packs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT token_packs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

CREATE TABLE public.token_transactions (
  id bigint NOT NULL DEFAULT nextval('token_transactions_id_seq'::regclass),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  model_key text NOT NULL,
  tokens_added integer NOT NULL DEFAULT 0,
  amount_paid numeric DEFAULT 0,
  currency text DEFAULT 'EUR'::text,
  source text DEFAULT 'Stripe Payment'::text,
  stripe_session_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  CONSTRAINT token_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT token_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT token_transactions_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id)
);

CREATE TABLE public.token_usage_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  project_id uuid NOT NULL,
  token_pack_id uuid,
  model text NOT NULL,
  tokens_used bigint NOT NULL CHECK (tokens_used >= 0),
  cost_estimated numeric NOT NULL DEFAULT 0,
  action text,
  request_metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT token_usage_logs_pkey PRIMARY KEY (id),
  CONSTRAINT token_usage_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT token_usage_logs_project_id_fkey FOREIGN KEY (project_id) REFERENCES public.projects(id),
  CONSTRAINT token_usage_logs_token_pack_id_fkey FOREIGN KEY (token_pack_id) REFERENCES public.token_packs(id)
);

CREATE TABLE public.users (
  id uuid NOT NULL,
  email text NOT NULL UNIQUE,
  name text,
  surname text,
  plan_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  active boolean NOT NULL DEFAULT true,
  metadata jsonb DEFAULT '{}'::jsonb,
  phone_number text,
  stripe_customer_id text,
  subscription_status text DEFAULT 'inactive'::text,
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id),
  CONSTRAINT users_plan_id_fkey FOREIGN KEY (plan_id) REFERENCES public.plans(id)
);

