-- Tasks board
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'DONE')),
  assignee text NOT NULL DEFAULT 'aurora' CHECK (assignee IN ('joey', 'aurora')),
  priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Content pipeline
CREATE TABLE IF NOT EXISTS content_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  stage text NOT NULL DEFAULT 'idea' CHECK (stage IN ('idea', 'script', 'thumbnail', 'filming', 'published')),
  script text,
  thumbnail_url text,
  platform text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Calendar events
CREATE TABLE IF NOT EXISTS calendar_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  start_time timestamptz NOT NULL,
  end_time timestamptz,
  type text NOT NULL DEFAULT 'task' CHECK (type IN ('cron', 'task', 'meeting', 'reminder')),
  recurring text,
  color text DEFAULT '#6366f1',
  created_at timestamptz DEFAULT now()
);

-- Memory viewer
CREATE TABLE IF NOT EXISTS memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  tags text[] DEFAULT '{}',
  source text NOT NULL,
  memory_date text,
  updated_at timestamptz DEFAULT now()
);

-- Team members
CREATE TABLE IF NOT EXISTS team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL,
  type text NOT NULL DEFAULT 'agent' CHECK (type IN ('human', 'agent')),
  description text,
  responsibilities text[] DEFAULT '{}',
  status text NOT NULL DEFAULT 'idle' CHECK (status IN ('active', 'idle', 'offline')),
  current_task text,
  avatar text DEFAULT '🤖',
  sort_order int DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE content_items;
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;

-- Seed: Team members
INSERT INTO team_members (name, role, type, description, responsibilities, status, avatar, sort_order) VALUES
  ('Joey', 'CEO & Founder', 'human', 'Runs D2D roofing sales, builds AI tools, crypto investor.', ARRAY['Strategy & Vision', 'Business Development', 'D2D Sales', 'Final Decisions'], 'active', '👨‍💼', 0),
  ('Aurora', 'Chief of Staff', 'agent', 'Main AI agent. 24/7 dispatcher and coordinator.', ARRAY['Task Dispatch', 'Morning Briefings', 'Sub-agent Orchestration', 'Memory Management', 'Proactive Research'], 'active', '🌅', 1),
  ('Research Agent', 'Lead Researcher', 'agent', 'Spawned for deep research tasks.', ARRAY['Market Research', 'Competitor Analysis', 'Technical Documentation'], 'idle', '🔬', 2),
  ('Code Agent', 'Software Engineer', 'agent', 'Claude Code / Codex agent for building features.', ARRAY['Feature Development', 'Bug Fixes', 'Code Review', 'Deployment'], 'idle', '💻', 3),
  ('Content Agent', 'Content Creator', 'agent', 'Creates X/Twitter posts and content for @sleptonbtc.', ARRAY['X/Twitter Content', 'Script Writing', 'Content Strategy'], 'idle', '✍️', 4),
  ('QA Agent', 'Quality Assurance', 'agent', 'Reviews built features and runs test suites.', ARRAY['Visual QA', 'Test Execution', 'Flow Verification', 'Cold Reviews'], 'idle', '🧪', 5);

-- Seed: Sample tasks
INSERT INTO tasks (title, description, status, assignee, priority) VALUES
  ('Deploy Aurora Mission Control', 'Get this dashboard live on Vercel with full PWA support', 'IN_PROGRESS', 'aurora', 'high'),
  ('Set up morning briefing cron', 'Ensure 6:30 AM daily brief is firing correctly', 'TODO', 'aurora', 'medium'),
  ('Review ClaimPilot CSV parser', 'Check CSV uploads working end-to-end', 'DONE', 'aurora', 'high'),
  ('X/Twitter content batch', 'Write 10 posts for @sleptonbtc queue', 'TODO', 'aurora', 'medium'),
  ('RoofCRM lead import feature', 'Build CSV import for bulk lead upload', 'TODO', 'aurora', 'low');

-- Seed: Sample calendar events
INSERT INTO calendar_events (title, description, start_time, type, color, recurring) VALUES
  ('Morning Brief', 'Aurora daily briefing for Joey', NOW()::date + '06:30:00'::time, 'cron', '#10b981', 'daily'),
  ('Proactive Checks', 'System health + alert monitoring', NOW()::date + '00:00:00'::time, 'cron', '#6366f1', 'every 15 min'),
  ('Weekly Self-Review', 'Aurora self-evaluation and AGENTS.md update', NOW()::date + '21:00:00'::time, 'cron', '#f59e0b', 'weekly sunday');

-- Seed: Sample memories
INSERT INTO memories (title, content, tags, source, memory_date) VALUES
  ('SimpleFIN Bank Access Setup', 'SimpleFIN Bridge connected to Navy Federal. Read-only API. Accounts: Visa 6569, Savings 5867, Checking 2000.', ARRAY['finance', 'banking', 'setup'], 'MEMORY.md', '2026-02-16'),
  ('Multi-Agent Orchestration System', 'Full pipeline orchestration implemented. Pipelines: research, content, coding, analysis, debug. Run with manager.sh', ARRAY['orchestration', 'agents', 'system'], 'MEMORY.md', '2026-02-16'),
  ('ClaimPilot CSV Support Shipped', 'Built CSV parser for roof measurements. 5 tests pass. 3D viewer crash fixed. Commit 079cd5a.', ARRAY['claimpilot', 'feature', 'shipped'], 'memory/2026-02-17.md', '2026-02-17');
