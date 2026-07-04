# EduWatch — Complete Architecture & Migration Plan

*Compiled from analysis of the EduWatch codebase — an educational social media platform for educators, researchers, and EdTech professionals.*

---

## 1. Current State Analysis

### Tech Stack (Current)

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript 5.8, Vite 6, Tailwind CSS v4 |
| Styling/UI | `motion` (animation), `lucide-react` (icons), `recharts` (analytics) |
| Rich Text | TipTap v3 (articles) |
| Backend/BaaS | Firebase Auth + Firestore + Cloud Functions |
| Media | Cloudinary (client-side upload) |
| Offline | Service Worker (basic caching) |
| Planned | Django + Celery + PostgreSQL (not implemented) |

### Key Features

- Dual content: articles (long-form) and micro-posts (short-form with polls, images)
- Personalized feed ranked by Hacker News gravity-decay algorithm
- Social graph (follow/unfollow, follow requests)
- User scoring: Knowledge Score, Educational Impact, Priority Score (leaderboard)
- Engagement: upvote/downvote, comments, shares, bookmarks
- Full-text search (client-side emulated)
- Multi-language UI (7 languages), dark/light theme, 5 accent colors
- Analytics dashboard on user profiles

---

## 2. Diagnosis of Problems

### 2.1 All Business Logic Runs Client-Side

Feed ranking, user scoring, leaderboard generation, search filtering, and interest profiling all execute in the browser. Users can trivially manipulate scores via DevTools or localStorage. The `syncAllUserRanksAndLeaderboard` function fetches ALL users + ALL posts, computes in the browser, and writes back to Firestore — completely insecure and unscalable.

### 2.2 localStorage as a Semi-Persistent Database

Comments, likes, downvotes, bookmarks, reposts, follow data, interaction caches, interest profiles, and even base64-encoded media are stored in localStorage. This data is lost on cache clear, unsynced across devices, blocking on reads/writes, and limited to ~5-10MB.

### 2.3 No Real Feed Fan-Out

The followers feed is built client-side by fetching all users, resolving usernames to UIDs, chunking into groups of 30 (Firestore `in` limit), querying posts per chunk, then sorting — O(n) reads per feed load.

### 2.4 Firestore Used as a Relational Database (Anti-Pattern)

N+1 queries everywhere, no JOINs, client-side privacy filtering, manual denormalization. The 1MB document size limit, 30-item `in` limit, and no native full-text search make this unsuitable for the app's data model.

### 2.5 Mock/Seed Data Entangled with Real Data

`getAllPosts` merges Firestore documents with static `feedData` imports. Hardcoded `SEED_CREATORS` get lazily written to Firestore. Unpredictable data layer.

### 2.6 Security Rules Not Properly Enforced

The "Dirty Dozen" deny cases from `security_spec.md` are a spec, not deployed rules. Nothing prevents rank spoofing, shadow fields, or vote manipulation via direct SDK calls from the browser console.

### 2.7 Django Plan + Render Free Tier = Unusable

The planned Django + PostgreSQL + Celery stack would suffer 30-60s cold starts on Render's free tier (spins down after 15 min idle). Python boot times make this unacceptable for a consumer-facing app.

### 2.8 Vercel Loading Delays

The delays you see aren't from Vercel — they're from client-side processing (fetching all posts, filtering, sorting, computing scores in the browser). Adding pagination and moving computation server-side would fix this.

---

## 3. Recommended Solution: Supabase-Only (Phase A), Custom Backend Later (Phase B)

### Why Supabase Replaces Everything

| Need | Supabase Free Tier Limit | Handles |
|---|---|---|
| Database | 500MB PostgreSQL | Users, posts, comments, votes, follows, bookmarks — all relational |
| Auth | 50,000 MAU | Google, Facebook, Email + built-in 2FA |
| Storage | 1GB + 5GB bandwidth | Images (or keep Cloudinary) |
| Edge Functions | 500K invocations/mo | Scoring, feed computation, leaderboard, rate limiting |
| Realtime | 2 million messages/mo | Live feed updates, activity notifications |
| Search | PostgreSQL `tsvector` | Full-text search with ranking and highlights |
| Backups | Daily | Point-in-time recovery |

**Key advantage**: No cold starts. Supabase databases and auth are always-on. Edge Functions (Deno) boot in <50ms — unlike Python on Render.

### Architecture (Phase A)

```
Vercel (React SPA)  ←→  Supabase
  - Auth UI              - PostgreSQL (RLS security)
  - React Query hooks    - Edge Functions (scoring, feed, search)
  - Optimistic UI        - Realtime (live feed)
                         - Storage (images)
```

**No Firebase. No Render. No Django. No Go.** Everything runs on Supabase free tier.

### Architecture (Phase B — When You Outgrow Free Tier)

```
Vercel (React)  →  Supabase (simple queries via PostgREST)
                →  Custom Backend (complex logic, moderation, admin)
                →  Supabase Auth (JWT verified by both)
```

The backend (Node.js/Go/Python) runs on a $5-7/mo always-on VPS (Hetzner, DigitalOcean). Your data model in Supabase PostgreSQL doesn't change — the backend just reads from the same database. Zero data migration.

---

## 4. Phase A: Migration to Supabase-Only ($0/mo)

### 4.1 Auth Migration (Firebase → Supabase Auth)

| File | Action |
|---|---|
| `src/lib/supabase.ts` | **NEW** — `createClient(supabaseUrl, supabaseAnonKey)` |
| `src/lib/AuthContext.tsx` | **REWRITE** — Swap Firebase `onAuthStateChanged` for Supabase `onAuthStateChange`. Keep `User` interface unchanged |
| `src/lib/firebase.ts` | **DELETE** |
| `firebase-applet-config.json` | **DELETE** |
| `.env.example` | **UPDATE** — Remove `VITE_FIREBASE_*`, add `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` |

**How it works**:
```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)
```

AuthContext swaps Firebase Auth calls for Supabase Auth calls. The rest of the app is unaffected — same `User` type, same `login()`, `logout()`, `user` state.

### 4.2 Database Schema (Supabase PostgreSQL)

**Replace Firebase collections (Users, Posts) with relational PostgreSQL tables:**

```sql
-- Users (replaces /users/{userId} in Firestore)
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id TEXT UNIQUE NOT NULL,  -- Supabase Auth UID
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  location TEXT DEFAULT '',
  website TEXT DEFAULT '',
  expertise TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_auth_id ON users(auth_id);

-- Posts (replaces /posts/{postId} in Firestore)
CREATE TABLE posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT '',
  subtitle TEXT DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  format TEXT NOT NULL CHECK (format IN ('article', 'micropost')),
  privacy TEXT NOT NULL DEFAULT 'public' CHECK (privacy IN ('public', 'followers', 'communities')),
  media_urls TEXT[] DEFAULT '{}',
  communities TEXT[] DEFAULT '{}',
  categories TEXT[] DEFAULT '{}',
  tagged_users UUID[] DEFAULT '{}',
  location TEXT DEFAULT '',
  comments_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_posts_author ON posts(author_id);
CREATE INDEX idx_posts_created ON posts(created_at DESC);
CREATE INDEX idx_posts_privacy ON posts(privacy);

-- Comments (replaces /posts/{postId}/comments subcollection)
CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,  -- nested replies
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- Relations (no more localStorage)
CREATE TABLE follows (
  follower_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  followee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (follower_id, followee_id)
);

CREATE TABLE post_votes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  vote_type TEXT NOT NULL CHECK (vote_type IN ('up', 'down')),
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE post_bookmarks (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE post_shares (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

CREATE TABLE post_views (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);

-- Polls
CREATE TABLE polls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID UNIQUE NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  expires_at TIMESTAMPTZ
);

CREATE TABLE poll_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  poll_id UUID NOT NULL REFERENCES polls(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  votes_count INT DEFAULT 0
);

CREATE TABLE poll_votes (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES poll_options(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, option_id)
);

-- Denormalized stats for fast reads
CREATE TABLE user_stats (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  knowledge_score INT DEFAULT 0,
  edu_impact INT DEFAULT 0,
  priority_score INT DEFAULT 0,
  contributor_rank TEXT DEFAULT 'Rising Learner',
  global_rank INT,
  follower_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  post_count INT DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Feed fan-out table (pre-computed per-user feed)
CREATE TABLE feed_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_feed_user ON feed_entries(user_id, created_at DESC);

-- Full-text search
ALTER TABLE posts ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) STORED;

CREATE INDEX posts_search_idx ON posts USING GIN(search_vector);
```

### 4.3 Row-Level Security (Replaces Firestore Rules)

```sql
-- Users can read any profile, edit only their own
CREATE POLICY users_select ON users FOR SELECT USING (true);
CREATE POLICY users_update ON users FOR UPDATE
  USING (auth_id = auth.uid())
  WITH CHECK (auth_id = auth.uid());

-- Posts: public posts visible to all, followers posts visible to followers
CREATE POLICY posts_select ON posts FOR SELECT
  USING (
    privacy = 'public'
    OR author_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    OR (privacy = 'followers' AND EXISTS (
      SELECT 1 FROM follows
      WHERE followee_id = posts.author_id
      AND follower_id = (SELECT id FROM users WHERE auth_id = auth.uid())
    ))
  );

CREATE POLICY posts_insert ON posts FOR INSERT
  WITH CHECK (author_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY posts_update ON posts FOR UPDATE
  USING (author_id = (SELECT id FROM users WHERE auth_id = auth.uid()))
  WITH CHECK (author_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

CREATE POLICY posts_delete ON posts FOR DELETE
  USING (author_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Comments
CREATE POLICY comments_select ON comments FOR SELECT USING (true);
CREATE POLICY comments_insert ON comments FOR INSERT
  WITH CHECK (author_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Follows
CREATE POLICY follows_select ON follows FOR SELECT USING (true);
CREATE POLICY follows_insert ON follows FOR INSERT
  WITH CHECK (follower_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY follows_delete ON follows FOR DELETE
  USING (follower_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Votes: one per user per post, authenticated only
CREATE POLICY post_votes_select ON post_votes FOR SELECT USING (true);
CREATE POLICY post_votes_insert ON post_votes FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY post_votes_delete ON post_votes FOR DELETE
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- Bookmarks
CREATE POLICY post_bookmarks_select ON post_bookmarks FOR SELECT USING (true);
CREATE POLICY post_bookmarks_insert ON post_bookmarks FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
CREATE POLICY post_bookmarks_delete ON post_bookmarks FOR DELETE
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));

-- User stats: read-only from client; only Edge Functions can write
CREATE POLICY user_stats_select ON user_stats FOR SELECT USING (true);
-- No INSERT/UPDATE/DELETE policy for client — server-side only

-- Feed entries: user sees their own feed
CREATE POLICY feed_entries_select ON feed_entries FOR SELECT
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()));
-- No INSERT/UPDATE/DELETE — written by Edge Functions only
```

### 4.4 Service Layer Rewrite (Firestore → Supabase Client)

**Remove all Firestore calls and localStorage caching. Replace with Supabase queries + React Query.**

| File | Action |
|---|---|
| `src/services/postService.ts` | **REWRITE** — Firestore `collection()`/`addDoc()`/`updateDoc()` → `supabase.from('posts').select()`, `supabase.from('post_votes').upsert()` |
| `src/services/userService.ts` | **REWRITE** — Firestore user reads → `supabase.from('users').select()`. Remove `SEED_CREATORS` (use DB seed instead) |
| `src/lib/queryClient.ts` | **NEW** — `@tanstack/react-query` QueryClient setup |
| `src/hooks/usePosts.ts` | **NEW** — `useQuery` for posts, `useMutation` for create/update/delete |
| `src/hooks/useComments.ts` | **NEW** — `useQuery` for comments (recursive CTE on parent_id), `useMutation` for add |
| `src/hooks/useFeed.ts` | **NEW** — `useInfiniteQuery` for cursor-based feed pagination |
| `src/hooks/useFollows.ts` | **NEW** — `useMutation` for follow/unfollow |
| `src/hooks/useUser.ts` | **NEW** — `useQuery` for user profiles |
| `src/hooks/useSearch.ts` | **NEW** — `useQuery` for full-text search via `supabase.rpc('search_posts')` |

**Key patterns:**
- Optimistic updates via `onMutate` (like/vote/bookmark instantly reflect in UI)
- Cache invalidation via `onSettled` (refetch affected queries after mutation)
- Remove all `localStorage.getItem()`/`setItem()` patterns

### 4.5 New Files: Edge Functions

```
supabase/functions/
  feed-fanout/index.ts    — On post create, fan-out feed_entries to followers
  scoring/index.ts        — Cron job: recalculate all user scores + ranks
  leaderboard/index.ts    — GET /leaderboard?limit=100
  search/index.ts         — GET /search?q=term&limit=20&offset=0
```

**feed-fanout/index.ts** — called via Supabase webhook on `posts` INSERT:

```typescript
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { record } = await req.json()
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Get followers of the author
  const { data: followers } = await supabase
    .from('follows')
    .select('follower_id')
    .eq('followee_id', record.author_id)

  // Batch insert feed_entries (batches of 500)
  const entries = (followers || []).map(f => ({
    user_id: f.follower_id,
    post_id: record.id,
    author_id: record.author_id
  }))

  // Also add to author's own feed
  entries.push({
    user_id: record.author_id,
    post_id: record.id,
    author_id: record.author_id
  })

  for (let i = 0; i < entries.length; i += 500) {
    await supabase.from('feed_entries').insert(entries.slice(i, i + 500))
  }

  return new Response('ok')
})
```

**scoring/index.ts** — scheduled via `pg_cron`:

```typescript
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

export async function recalculateScores() {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // Update all user_stats via a single SQL call
  await supabase.rpc('recalculate_all_scores')

  // Re-rank and assign global positions
  await supabase.rpc('recalculate_leaderboard')
}
```

Cron schedule (in `supabase/config.toml`):

```toml
[functions.scoring]
schedule = "*/5 * * * *"  # every 5 minutes
```

### 4.6 Database Functions (Scoring Logic Server-Side)

```sql
-- Recalculate scores for all users (called by Edge Function cron)
CREATE OR REPLACE FUNCTION recalculate_all_scores()
RETURNS void AS $$
BEGIN
  INSERT INTO user_stats (user_id, knowledge_score, edu_impact, post_count)
  SELECT
    u.id,
    COALESCE((
      SELECT SUM(
        CASE WHEN p.format = 'article' THEN 10 ELSE 5 END +
        COALESCE(pv.upvote_count, 0) * 2 +
        COALESCE(pc.comment_count, 0) * 3
      ) FROM posts p
      LEFT JOIN (SELECT post_id, COUNT(*) as upvote_count FROM post_votes WHERE vote_type = 'up' GROUP BY post_id) pv ON pv.post_id = p.id
      LEFT JOIN (SELECT post_id, COUNT(*) as comment_count FROM comments GROUP BY post_id) pc ON pc.post_id = p.id
      WHERE p.author_id = u.id
    ), 0) as knowledge_score,
    COALESCE((
      SELECT SUM(
        COALESCE(pv.view_count, 0) * 0.1 +
        COALESCE(ps.share_count, 0) * 5 +
        COALESCE(pb.bookmark_count, 0) * 10
      ) FROM (
        SELECT
          p.id,
          (SELECT COUNT(*) FROM post_views WHERE post_id = p.id) as view_count,
          (SELECT COUNT(*) FROM post_shares WHERE post_id = p.id) as share_count,
          (SELECT COUNT(*) FROM post_bookmarks WHERE post_id = p.id) as bookmark_count
        FROM posts p WHERE p.author_id = u.id
      ) pv
    ), 0) as edu_impact,
    (SELECT COUNT(*) FROM posts WHERE author_id = u.id) as post_count
  FROM users u
  ON CONFLICT (user_id) DO UPDATE SET
    knowledge_score = EXCLUDED.knowledge_score,
    edu_impact = EXCLUDED.edu_impact,
    post_count = EXCLUDED.post_count,
    updated_at = now();
END;
$$ LANGUAGE plpgsql;

-- Recalculate leaderboard ranks
CREATE OR REPLACE FUNCTION recalculate_leaderboard()
RETURNS void AS $$
BEGIN
  UPDATE user_stats SET
    priority_score = ROUND(knowledge_score * 0.6 + edu_impact * 0.4),
    contributor_rank = CASE
      WHEN knowledge_score >= 5000 THEN 'Elite Contributor'
      WHEN knowledge_score >= 1500 THEN 'Top 1% Curator'
      WHEN knowledge_score >= 500 THEN 'Active Mentor'
      WHEN knowledge_score >= 100 THEN 'Active Contributor'
      ELSE 'Rising Learner'
    END,
    global_rank = subquery.rank
  FROM (
    SELECT user_id,
      ROW_NUMBER() OVER (ORDER BY (knowledge_score * 0.6 + edu_impact * 0.4) DESC) as rank
    FROM user_stats
  ) subquery
  WHERE user_stats.user_id = subquery.user_id;
END;
$$ LANGUAGE plpgsql;
```

### 4.7 Full-Text Search

Search function callable from Edge Function:

```sql
CREATE OR REPLACE FUNCTION search_posts(
  search_query TEXT,
  result_limit INT DEFAULT 20,
  result_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID, title TEXT, content TEXT, author_id UUID,
  author_name TEXT, author_username TEXT, format TEXT,
  created_at TIMESTAMPTZ, rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.title, p.content, p.author_id,
    u.full_name, u.username, p.format, p.created_at,
    ts_rank(p.search_vector, plainto_tsquery('english', search_query)) as rank
  FROM posts p
  JOIN users u ON u.id = p.author_id
  WHERE p.search_vector @@ plainto_tsquery('english', search_query)
    AND p.privacy = 'public'
  ORDER BY rank DESC
  LIMIT result_limit
  OFFSET result_offset;
END;
$$ LANGUAGE plpgsql STABLE;
```

### 4.8 Get Feed (Cursor Pagination)

```sql
CREATE OR REPLACE FUNCTION get_feed(
  p_user_id UUID,
  p_cursor TIMESTAMPTZ DEFAULT now(),
  p_limit INT DEFAULT 20
)
RETURNS TABLE(
  post_id UUID, title TEXT, content TEXT, format TEXT,
  author_id UUID, author_name TEXT, author_username TEXT, author_avatar TEXT,
  created_at TIMESTAMPTZ,
  upvotes BIGINT, downvotes BIGINT, comment_count BIGINT,
  has_upvoted BOOLEAN, has_downvoted BOOLEAN, is_bookmarked BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.title, p.content, p.format,
    u.id, u.full_name, u.username, u.avatar_url,
    fe.created_at,
    COALESCE(uv.upvotes, 0),
    COALESCE(dv.downvotes, 0),
    COALESCE(pc.comment_count, 0),
    EXISTS(SELECT 1 FROM post_votes pv2 WHERE pv2.post_id = p.id AND pv2.user_id = p_user_id AND pv2.vote_type = 'up'),
    EXISTS(SELECT 1 FROM post_votes pv2 WHERE pv2.post_id = p.id AND pv2.user_id = p_user_id AND pv2.vote_type = 'down'),
    EXISTS(SELECT 1 FROM post_bookmarks pb2 WHERE pb2.post_id = p.id AND pb2.user_id = p_user_id)
  FROM feed_entries fe
  JOIN posts p ON p.id = fe.post_id
  JOIN users u ON u.id = p.author_id
  LEFT JOIN (SELECT post_id, COUNT(*) as upvotes FROM post_votes WHERE vote_type = 'up' GROUP BY post_id) uv ON uv.post_id = p.id
  LEFT JOIN (SELECT post_id, COUNT(*) as downvotes FROM post_votes WHERE vote_type = 'down' GROUP BY post_id) dv ON dv.post_id = p.id
  LEFT JOIN (SELECT post_id, COUNT(*) as comment_count FROM comments GROUP BY post_id) pc ON pc.post_id = p.id
  WHERE fe.user_id = p_user_id
    AND fe.created_at < p_cursor
  ORDER BY fe.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;
```

### 4.9 Feed Pagination Hook (Frontend)

```typescript
// src/hooks/useFeed.ts
import { useInfiniteQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export function useFeed() {
  return useInfiniteQuery({
    queryKey: ['feed'],
    queryFn: async ({ pageParam = new Date().toISOString() }) => {
      const user = (await supabase.auth.getUser()).data.user
      if (!user) throw new Error('Not authenticated')

      // Get the internal user UUID from auth_id
      const { data: profile } = await supabase
        .from('users')
        .select('id')
        .eq('auth_id', user.id)
        .single()

      const { data, error } = await supabase
        .rpc('get_feed', {
          p_user_id: profile!.id,
          p_cursor: pageParam,
          p_limit: 20
        })

      if (error) throw error
      return {
        posts: data,
        nextCursor: data.length === 20 ? data[data.length - 1].created_at : null
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    initialPageParam: new Date().toISOString()
  })
}
```

### 4.10 Files to Delete

| File | Reason |
|---|---|
| `src/lib/firebase.ts` | Replaced by `src/lib/supabase.ts` |
| `firebase-applet-config.json` | No longer needed |
| `firestore.rules` | Replaced by PostgreSQL RLS |
| `firebase-blueprint.json` | Schema is now in SQL migrations |
| `security_spec.md` | Replaced by RLS policies |
| `src/lib/feedData.ts` | Static data → DB seed |
| `src/lib/useInterests.ts` | Interest profiling → Edge Functions |
| `src/data/mockData.ts` | Mock data → real data |
| `src/algorithms/content.ts` | Logic → DB functions |
| `src/algorithms/interests.ts` | Logic → DB functions |
| `src/algorithms/recommendations.ts` | Logic → DB functions |
| `src/algorithms/search.ts` | Replaced by PostgreSQL full-text search |
| `src/utils/scoringEngine.ts` | Replaced by DB triggers + cron |
| `functions/` (directory) | Cloud Functions → Supabase Edge Functions |
| `DOCS_FIREBASE_DJANGO.md` | Obsolete — we're not using Django |

### 4.11 Files to Keep (Unchanged)

| Category | Files |
|---|---|
| All Components | `src/components/FeedItem.tsx`, `FeedComposer.tsx`, `Sidebar.tsx`, `TopBar.tsx`, `PostModal.tsx`, etc. (17 components) |
| Most Pages | `src/pages/` — only data-fetching logic changes, rendering stays |
| Styles | `src/index.css`, `DESIGN_SYSTEM.md` |
| Build | `vite.config.ts`, `tsconfig.json`, `package.json` (remove Firebase dep only) |
| Media | Cloudinary `src/services/storageService.ts` (or replace with Supabase Storage) |

### 4.12 package.json Changes

```diff
- "firebase": "^12.13.0",
+ "@supabase/supabase-js": "^2.45.0",
+ "@tanstack/react-query": "^5.60.0",
```

### 4.13 DB Seed Script

Save as `supabase/seed.sql`:

```sql
-- Seed users
INSERT INTO users (id, auth_id, username, full_name, email, bio, avatar_url, location, website, expertise)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'seed_a1', 'dr_sarah_chen', 'Dr. Sarah Chen', 'sarah.chen@eduwatch.org', 'Associate Professor of Computer Science at Stamford Academic Hub. Specializes in distributed compilers.', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200', 'Stamford Academic Hub', 'stamford.edu/sarah_chen', ARRAY['LMS Modularity', 'Distributed Engineering', 'System Concurrency', 'Concurrency Testing']),
  ('00000000-0000-0000-0000-000000000002', 'seed_a2', 'prof_liam_whitby', 'Prof. Liam Whitby', 'liam.whitby@eduwatch.org', 'Distinguished Professor of Cognitive Philosophy. Reconstructing human interface paradigms.', 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=facearea&facepad=2&w=256&h=256&q=80', 'Oxford Science Park', 'oxford.edu/liam_whitby', ARRAY['UX Scaffolding', 'Cognitive Load Theory', 'User Centered Design', 'Pedagogy Interface']),
  ('00000000-0000-0000-0000-000000000003', 'seed_a3', 'alex_rivera', 'Alex Rivera', 'alex_rivera@eduwatch.org', 'Recognized industry expert and top curator in academic and technical journals.', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200', 'Global', 'eduwatch.journal/alex_rivera', ARRAY['Rust Compile Layer', 'Memory Footprint', 'Broker Ingestion', 'Backend Dev']);

-- Seed user_stats
INSERT INTO user_stats (user_id, knowledge_score, edu_impact, priority_score, contributor_rank, global_rank, follower_count, post_count)
VALUES
  ('00000000-0000-0000-0000-000000000001', 14200, 9800, ROUND(14200 * 0.6 + 9800 * 0.4), 'Elite Contributor', 1, 18900, 12),
  ('00000000-0000-0000-0000-000000000002', 9200, 6400, ROUND(9200 * 0.6 + 6400 * 0.4), 'Elite Contributor', 2, 12400, 8),
  ('00000000-0000-0000-0000-000000000003', 11200, 7100, ROUND(11200 * 0.6 + 7100 * 0.4), 'Elite Contributor', 3, 15600, 10);

-- Seed posts
INSERT INTO posts (id, author_id, title, content, format, privacy, categories, created_at)
VALUES
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000001', 'The Future of Distributed Compilers', 'An in-depth analysis of how distributed computing is reshaping compiler design for modern hardware architectures.', 'article', 'public', ARRAY['Compilers', 'Distributed Systems'], now() - interval '2 hours'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000002', 'Cognitive Load in Modern UI Design', 'Exploring how cognitive load theory applies to contemporary user interface design patterns.', 'article', 'public', ARRAY['UI/UX', 'Cognitive Science'], now() - interval '5 hours'),
  (gen_random_uuid(), '00000000-0000-0000-0000-000000000003', 'Rust Memory Management Patterns', 'A practical guide to Rust''s ownership model and memory safety patterns for systems programming.', 'micropost', 'public', ARRAY['Rust', 'Systems Programming'], now() - interval '1 hour');
```

---

## 5. Phase B: Adding a Custom Backend (When You Outgrow Free Tier)

### 5.1 Migration Triggers

- Free tier limits exceeded (500MB DB, 50K MAU, 500K Edge Function calls)
- Need admin dashboard with complex reporting queries
- Need WebSocket-based realtime chat (beyond Supabase Realtime limits)
- Need custom content moderation/review workflows
- Need webhook integrations with external services

### 5.2 Backend Architecture (Phase B)

```
Vercel (React)  →  Supabase (simple queries via PostgREST)
                →  Custom Backend (complex logic, moderation, admin)
                →  Supabase Auth (JWT verified by both)
```

### 5.3 Backend Options

| Option | Startup Time | Memory | Deploy |
|---|---|---|---|
| Go (Chi/Fiber) | <5ms | ~10MB | Single binary, scp |
| Node.js (Express/Fastify) | ~200ms | ~30MB | `npm run` |
| Python (FastAPI) | ~3-8s | ~50MB | `uvicorn` |

**Recommendation**: Go or Node.js (not Python) — both have sub-second startup on a $5 VPS.

### 5.4 What Changes

- Frontend adds a new API base URL for the custom backend
- Backend reads from the same Supabase PostgreSQL database
- Supabase Auth JWT tokens are verified by the backend
- No data migration — the schema stays the same

---

## 6. Implementation Sequence (Recommended Order)

### Phase A: Supabase Migration (~2-3 weeks)

| Step | What | Time |
|---|---|---|
| 1 | Provision Supabase project, enable Auth + DB | 1 day |
| 2 | Write database migrations (all tables, RLS, indexes, search) | 2 days |
| 3 | Replace `firebase.ts` with `supabase.ts`, rewrite `AuthContext.tsx` | 2 days |
| 4 | Rewrite `postService.ts` — posts, comments, votes via Supabase client | 3 days |
| 5 | Rewrite `userService.ts` — profiles, stats via Supabase client | 2 days |
| 6 | Set up React Query hooks (`src/hooks/*`) | 2 days |
| 7 | Write Edge Functions (feed-fanout, scoring, leaderboard, search) | 3 days |
| 8 | Delete Firebase-dependant files, update package.json | 1 day |
| 9 | Deploy to Vercel, test end-to-end | 2 days |

### Phase B: Custom Backend (When Needed, ~1 week)

| Step | What | Time |
|---|---|---|
| 1 | Provision $5 VPS (Hetzner/DigitalOcean) | 1 day |
| 2 | Write backend service (Go or Node.js) | 3 days |
| 3 | Point frontend to backend for selected routes | 1 day |
| 4 | Deploy, monitor, iterate | 2 days |

---

## 7. Cost Breakdown

### Phase A (Supabase-Only)

| Service | Tier | Monthly Cost |
|---|---|---|
| Vercel | Hobby | $0 |
| Supabase | Free | $0 |
| Domain | Namecheap/Cloudflare | ~$10/year |
| **Total** | | **$0/mo (+ $10/yr domain)** |

### Phase B (After Upgrade)

| Service | Tier | Monthly Cost |
|---|---|---|
| Vercel | Pro (if needed) | $20 |
| Supabase | Pro ($25/mo, 8GB DB, 100K MAU, 50GB bandwidth) | $25 |
| VPS (Hetzner) | CX22 (2 vCPU, 4GB RAM) | ~$5 |
| Domain | Renewal | ~$1/mo |
| **Total** | | **~$31/mo** |

---

## 8. Key Principles

1. **No Firebase.** Supabase PostgreSQL replaces Firestore entirely.
2. **No localStorage as database.** Everything in PostgreSQL via Supabase client.
3. **No client-side scoring.** All business logic in PostgreSQL functions + Edge Functions.
4. **No Render.** Cold starts make Python backends unusable on free tiers.
5. **No Django.** The planned Django/Celery/PostgreSQL stack is replaced by Supabase's built-in Postgres + Edge Functions.
6. **Data model stays the same across Phase A → Phase B.** Adding a custom backend later requires zero data migration.

---

## 9. Environment Variables

```env
# In Vercel project settings:
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# In Supabase Edge Functions (set via supabase secrets):
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key  # admin access for edge functions only
```

---

## 10. Quickstart Commands

```bash
# Install Supabase CLI
brew install supabase/tap/supabase

# Initialize Supabase project
supabase init

# Link to your hosted Supabase project
supabase link --project-ref your-project-ref

# Apply migrations
supabase db push

# Deploy Edge Functions
supabase functions deploy feed-fanout
supabase functions deploy scoring
supabase functions deploy leaderboard
supabase functions deploy search

# Set secrets for Edge Functions
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-key

# Seed the database
supabase db execute --file supabase/seed.sql

# Start local dev
supabase start
```
