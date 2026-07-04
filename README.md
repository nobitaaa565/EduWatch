# EduWatch

Education-focused social platform built with React, TypeScript, and Supabase.

## Prerequisites

- Node.js 18+
- A Supabase project

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in your Supabase credentials:
   ```bash
   cp .env.example .env
   ```

3. Run the app:
   ```bash
   npm run dev
   ```

## Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS, Vite
- **Backend:** Supabase (Auth, PostgreSQL, Edge Functions)
- **Data Fetching:** TanStack React Query
- **State:** React Context

## Deployment

Deploy to Vercel with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` as environment variables.
