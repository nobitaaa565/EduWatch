-- EduWatch Database Schema
-- Migration 001: Initial schema

-- 1. Core Tables

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT,
  bio TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  location TEXT DEFAULT '',
  website TEXT DEFAULT '',
  expertise TEXT[] DEFAULT '{}',
  joined_date TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_auth_id ON users(auth_id);

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

CREATE TABLE comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_comments_post ON comments(post_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);

-- 2. Relations

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

-- 3. Polls

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

-- 4. Denormalized Stats

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

-- 5. Feed Fan-Out

CREATE TABLE feed_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_feed_user ON feed_entries(user_id, created_at DESC);

-- 6. Full-Text Search

ALTER TABLE posts ADD COLUMN search_vector tsvector
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) STORED;

CREATE INDEX posts_search_idx ON posts USING GIN(search_vector);

-- 7. Row-Level Security

ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_shares ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE poll_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE feed_entries ENABLE ROW LEVEL SECURITY;

-- Users: read any profile, edit only own
CREATE POLICY "users_select" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert" ON users FOR INSERT
  WITH CHECK (auth_id = auth.uid()::text);
CREATE POLICY "users_update" ON users FOR UPDATE
  USING (auth_id = auth.uid()::text)
  WITH CHECK (auth_id = auth.uid()::text);

-- Posts: public visible to all, followers visible to followers
CREATE POLICY "posts_select" ON posts FOR SELECT
  USING (
    privacy = 'public'
    OR author_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text)
    OR (privacy = 'followers' AND EXISTS (
      SELECT 1 FROM follows
      WHERE followee_id = posts.author_id
      AND follower_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text)
    ))
  );

CREATE POLICY "posts_insert" ON posts FOR INSERT
  WITH CHECK (author_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text));

CREATE POLICY "posts_update" ON posts FOR UPDATE
  USING (author_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text))
  WITH CHECK (author_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text));

CREATE POLICY "posts_delete" ON posts FOR DELETE
  USING (author_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text));

-- Comments
CREATE POLICY "comments_select" ON comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON comments FOR INSERT
  WITH CHECK (author_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text));
CREATE POLICY "comments_update" ON comments FOR UPDATE
  USING (author_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text));
CREATE POLICY "comments_delete" ON comments FOR DELETE
  USING (author_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text));

-- Follows
CREATE POLICY "follows_select" ON follows FOR SELECT USING (true);
CREATE POLICY "follows_insert" ON follows FOR INSERT
  WITH CHECK (follower_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text));
CREATE POLICY "follows_delete" ON follows FOR DELETE
  USING (follower_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text));

-- Post votes: one per user per post
CREATE POLICY "post_votes_select" ON post_votes FOR SELECT USING (true);
CREATE POLICY "post_votes_insert" ON post_votes FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text));
CREATE POLICY "post_votes_delete" ON post_votes FOR DELETE
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text));

-- Bookmarks
CREATE POLICY "post_bookmarks_select" ON post_bookmarks FOR SELECT USING (true);
CREATE POLICY "post_bookmarks_insert" ON post_bookmarks FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text));
CREATE POLICY "post_bookmarks_delete" ON post_bookmarks FOR DELETE
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text));

-- Shares
CREATE POLICY "post_shares_select" ON post_shares FOR SELECT USING (true);
CREATE POLICY "post_shares_insert" ON post_shares FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text));

-- Views
CREATE POLICY "post_views_select" ON post_views FOR SELECT USING (true);
CREATE POLICY "post_views_insert" ON post_views FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text));

-- Polls
CREATE POLICY "polls_select" ON polls FOR SELECT USING (true);
CREATE POLICY "polls_insert" ON polls FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM posts WHERE id = polls.post_id AND author_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text)
  ));

-- Poll options
CREATE POLICY "poll_options_select" ON poll_options FOR SELECT USING (true);
CREATE POLICY "poll_options_insert" ON poll_options FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM polls JOIN posts ON posts.id = polls.post_id
    WHERE polls.id = poll_options.poll_id AND posts.author_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text)
  ));

-- Poll votes
CREATE POLICY "poll_votes_select" ON poll_votes FOR SELECT USING (true);
CREATE POLICY "poll_votes_insert" ON poll_votes FOR INSERT
  WITH CHECK (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text));
CREATE POLICY "poll_votes_delete" ON poll_votes FOR DELETE
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text));

-- User stats: read-only from client
CREATE POLICY "user_stats_select" ON user_stats FOR SELECT USING (true);

-- Feed entries: user sees own feed
CREATE POLICY "feed_entries_select" ON feed_entries FOR SELECT
  USING (user_id = (SELECT id FROM users WHERE auth_id = auth.uid()::text));

-- 8. Database Functions

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

CREATE OR REPLACE FUNCTION search_posts(
  search_query TEXT,
  result_limit INT DEFAULT 20,
  result_offset INT DEFAULT 0
)
RETURNS TABLE(
  id UUID, title TEXT, content TEXT, author_id UUID,
  author_name TEXT, author_username TEXT, author_avatar TEXT,
  format TEXT, created_at TIMESTAMPTZ, rank REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id, p.title, p.content, p.author_id,
    u.full_name, u.username, u.avatar_url,
    p.format, p.created_at,
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

CREATE OR REPLACE FUNCTION get_vote_counts(p_post_id UUID)
RETURNS TABLE(upvotes BIGINT, downvotes BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COALESCE(COUNT(*) FILTER (WHERE vote_type = 'up'), 0),
    COALESCE(COUNT(*) FILTER (WHERE vote_type = 'down'), 0)
  FROM post_votes
  WHERE post_id = p_post_id;
END;
$$ LANGUAGE plpgsql STABLE;
