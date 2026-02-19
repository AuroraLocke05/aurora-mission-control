# Aurora Mission Control — Full Build Spec

## What We're Building
A full-stack, iOS PWA mission control dashboard for Aurora (OpenClaw AI agent). Inspired by Alex Finn's article: 6 fully functional sections. Deployed to Vercel. Accessible anywhere. Installable on iOS as a PWA.

## Tech Stack
- **Next.js 15** (App Router, TypeScript)
- **Supabase** (existing account, credentials in .env.local)
- **Tailwind CSS** + **shadcn/ui** components
- **next-pwa** (service worker, iOS PWA support)
- **Framer Motion** (animations in office view)
- **@hello-pangea/dnd** (drag-and-drop for kanban boards)

## Environment Variables (put in .env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://iggoalvumonlzewyasmv.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[REDACTED]
SUPABASE_SERVICE_ROLE_KEY=[REDACTED]
NEXT_PUBLIC_APP_NAME=Aurora Mission Control
NEXT_PUBLIC_APP_URL=https://aurora-mission-control.vercel.app
```

## Database Schema

Create a file `supabase/migrations/001_init.sql` with ALL of this:

```sql
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

-- Enable realtime on all tables
ALTER PUBLICATION supabase_realtime ADD TABLE tasks;
ALTER PUBLICATION supabase_realtime ADD TABLE content_items;
ALTER PUBLICATION supabase_realtime ADD TABLE calendar_events;
ALTER PUBLICATION supabase_realtime ADD TABLE team_members;

-- Seed: Team members
INSERT INTO team_members (name, role, type, description, responsibilities, status, avatar, sort_order) VALUES
  ('Joey', 'CEO & Founder', 'human', 'Runs D2D roofing sales, builds AI tools, crypto investor. The human running this whole operation.', ARRAY['Strategy & Vision', 'Business Development', 'D2D Sales', 'Final Decisions'], 'active', '👨‍💼', 0),
  ('Aurora', 'Chief of Staff', 'agent', 'Main AI agent. 24/7 dispatcher and coordinator. Manages all sub-agents and stays available for Joey.', ARRAY['Task Dispatch', 'Morning Briefings', 'Sub-agent Orchestration', 'Memory Management', 'Proactive Research'], 'active', '🌅', 1),
  ('Research Agent', 'Lead Researcher', 'agent', 'Spawned for deep research tasks. Perplexity-powered analysis and reporting.', ARRAY['Market Research', 'Competitor Analysis', 'Technical Documentation', 'Report Writing'], 'idle', '🔬', 2),
  ('Code Agent', 'Software Engineer', 'agent', 'Claude Code / Codex agent for building and shipping features.', ARRAY['Feature Development', 'Bug Fixes', 'Code Review', 'Testing', 'Deployment'], 'idle', '💻', 3),
  ('Content Agent', 'Content Creator', 'agent', 'Creates X/Twitter posts, scripts, and content strategies for @sleptonbtc.', ARRAY['X/Twitter Content', 'Script Writing', 'Content Strategy', 'Engagement Optimization'], 'idle', '✍️', 4),
  ('QA Agent', 'Quality Assurance', 'agent', 'Reviews built features, runs test suites, screenshots UIs, ensures everything ships correctly.', ARRAY['Visual QA', 'Test Execution', 'Flow Verification', 'Console Error Checks', 'Cold Reviews'], 'idle', '🧪', 5);

-- Seed: Sample tasks
INSERT INTO tasks (title, description, status, assignee, priority) VALUES
  ('Deploy Aurora Mission Control', 'Get this dashboard live on Vercel with full PWA support', 'IN_PROGRESS', 'aurora', 'high'),
  ('Set up morning briefing cron', 'Ensure 6:30 AM daily brief is firing correctly', 'TODO', 'aurora', 'medium'),
  ('Review ClaimPilot CSV parser', 'Check if CSV uploads are working correctly end-to-end', 'DONE', 'aurora', 'high'),
  ('X/Twitter content batch', 'Write 10 posts for @sleptonbtc queue', 'TODO', 'aurora', 'medium'),
  ('RoofCRM lead import feature', 'Build CSV import for bulk lead upload', 'TODO', 'aurora', 'low');

-- Seed: Sample calendar events
INSERT INTO calendar_events (title, description, start_time, type, color, recurring) VALUES
  ('Morning Brief', 'Aurora daily briefing for Joey', NOW()::date + '06:30:00'::time, 'cron', '#10b981', 'daily'),
  ('Proactive Checks', 'System health + alert monitoring', NOW()::date + '00:00:00'::time, 'cron', '#6366f1', 'every 15 min'),
  ('Weekly Self-Review', 'Aurora self-evaluation and AGENTS.md update', NOW()::date + '21:00:00'::time, 'cron', '#f59e0b', 'weekly sunday');

-- Seed: Sample memories
INSERT INTO memories (title, content, tags, source, memory_date) VALUES
  ('SimpleFIN Bank Access Setup', 'SimpleFIN Bridge connected to Navy Federal. Read-only API. Accounts: Visa 6569, Savings 5867, Checking 2000. Token at ~/.openclaw/workspace/.simplefin-access', ARRAY['finance', 'banking', 'setup'], 'MEMORY.md', '2026-02-16'),
  ('Multi-Agent Orchestration System', 'Full pipeline orchestration implemented. Pipelines: research, content, coding, analysis, debug. State tracked in JSON files. Outputs in output/{run-id}/. Run with manager.sh', ARRAY['orchestration', 'agents', 'system'], 'MEMORY.md', '2026-02-16'),
  ('ClaimPilot CSV Support Shipped', 'Built CSV parser for roof measurements. 5 tests pass. 3D viewer crash fixed. Commit 079cd5a. Joey can upload CSV files alongside XML now.', ARRAY['claimpilot', 'feature', 'shipped'], 'memory/2026-02-17.md', '2026-02-17');
```

## App Structure

```
/app
  layout.tsx          - ConvexProvider, PWA meta, global nav
  page.tsx            - Dashboard (overview stats + activity feed)
  tasks/page.tsx      - Tasks Board (Kanban)
  content/page.tsx    - Content Pipeline (Kanban)
  calendar/page.tsx   - Calendar (month view)
  memory/page.tsx     - Memory Viewer (search + cards)
  team/page.tsx       - Team structure cards
  office/page.tsx     - Animated office view

/components
  layout/
    nav.tsx           - Bottom nav (mobile) + sidebar (desktop)
    header.tsx        - Page header with title
  tasks/
    task-board.tsx    - Main kanban board
    task-card.tsx     - Draggable task card
    add-task-modal.tsx
  content/
    content-board.tsx
    content-card.tsx
    content-modal.tsx  - Full editor with script textarea + image
  calendar/
    calendar-view.tsx  - Month grid
    event-card.tsx
    add-event-modal.tsx
  memory/
    memory-list.tsx
    memory-card.tsx
    memory-search.tsx
  team/
    team-grid.tsx
    agent-card.tsx
  office/
    office-view.tsx    - Animated grid of workstations
    workstation.tsx    - Individual agent desk with CSS animation

/lib
  supabase.ts         - Supabase client (browser)
  supabase-server.ts  - Supabase client (server)
  types.ts            - TypeScript types for all tables

/public
  manifest.json       - PWA manifest
  icons/              - All app icons (192x192, 512x512, apple-touch)
```

## Detailed Feature Specs

### 1. Tasks Board (`/tasks`)
- **Kanban columns**: TODO | IN PROGRESS | DONE
- **Card shows**: title, description (truncated), assignee avatar (👨‍💼 Joey / 🌅 Aurora), priority badge (red/yellow/green)
- **Drag and drop**: @hello-pangea/dnd — drop on column to change status
- **Add Task**: floating `+` button → modal with title, description, assignee, priority dropdowns
- **Edit**: tap card to edit inline
- **Delete**: swipe or long press for delete option
- **Real-time**: Supabase realtime subscription — changes appear instantly

### 2. Content Pipeline (`/content`)  
- **Stages**: Idea → Script → Thumbnail → Filming → Published
- **Card shows**: title, platform badge, stage indicator
- **Expand card**: shows full script (textarea for editing), notes, image upload for thumbnail
- **Script field**: large textarea, auto-save on blur
- **Platform options**: X/Twitter, YouTube, TikTok, Instagram, Blog
- **Add content**: modal with title, platform, initial description
- **Move stage**: tap card header to select new stage, or drag between columns

### 3. Calendar (`/calendar`)
- **Month view**: full month grid, today highlighted in indigo
- **Event dots**: colored dots on days that have events
- **Click day**: see list of events for that day in a panel below
- **Event types**: 
  - 🟢 cron (green) — recurring automated tasks
  - 🟣 task (indigo) — one-time tasks  
  - 🟡 reminder (yellow) — reminders
  - 🔵 meeting (blue) — meetings
- **Add event**: FAB button → modal with title, date/time, type, color, recurring dropdown
- **Week view toggle**: button to switch between month/week views
- **Recurring badge**: events marked as recurring show 🔄 icon

### 4. Memory Viewer (`/memory`)
- **Search bar**: searches title AND content in real-time (debounced 300ms)
- **Tag filters**: horizontal scrollable tag chips — click to filter
- **Memory cards**: title, date, source file, content preview (first 200 chars), tag pills
- **Expand**: click card to see full content in a slide-up sheet
- **Markdown rendering**: render content as markdown in expanded view
- **Sort**: newest first by default, toggle for alphabetical
- **Empty state**: friendly message if no memories found

### 5. Team (`/team`)
- **Grid of cards** (2-col mobile, 3-col desktop)
- **Agent card shows**: 
  - Large avatar emoji
  - Name + role
  - Status badge (🟢 Active / 🟡 Idle / 🔴 Offline)
  - Current task (if active)
  - Responsibilities list (bullet points)
  - Type badge (Human / AI Agent)
- **Edit status**: tap status badge → dropdown to change
- **Edit current task**: tap current task text to edit inline
- **Add agent**: FAB → modal to add new team member

### 6. Office View (`/office`)
- **3x2 grid** of workstations (desk + computer + agent)
- **Each workstation shows**:
  - Desk (styled div)
  - Monitor (styled div with screen glow)
  - Agent emoji + name label below
  - Status indicator dot (green pulse / yellow / gray)
- **Animations** (Framer Motion):
  - Active agent: subtle "typing" animation (slight wobble/bounce on agent emoji, screen flickers)
  - Idle agent: agent emoji slightly to the side of desk, screen dark
  - Offline: emoji grayed out, no screen
- **Click workstation**: shows panel with agent name, current task, last activity
- **Status updates** in real-time from team_members table

## Navigation
- **Mobile (< 768px)**: Fixed bottom tab bar with 7 tabs (icons + labels)
  - 🏠 Home | ✅ Tasks | 🎬 Content | 📅 Calendar | 🧠 Memory | 👥 Team | 🏢 Office
- **Desktop (≥ 768px)**: Left sidebar (64px icons, expands to 200px on hover)
- Active tab: indigo highlight

## Design System
```
Background: #0a0a0a
Card: #111111  
Card border: #1a1a1a
Surface elevated: #161616
Accent: #6366f1 (indigo-500)
Accent hover: #4f46e5 (indigo-600)
Text primary: #f8fafc
Text secondary: #94a3b8
Text muted: #475569
Success: #10b981
Warning: #f59e0b
Danger: #ef4444
```

## PWA Configuration

`public/manifest.json`:
```json
{
  "name": "Aurora Mission Control",
  "short_name": "Mission Control",
  "description": "Aurora AI Dashboard",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0a0a0a",
  "theme_color": "#0a0a0a",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png", "purpose": "any maskable" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```

`app/layout.tsx` must include:
```html
<meta name="apple-mobile-web-app-capable" content="yes" />
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
<meta name="apple-mobile-web-app-title" content="Mission Control" />
<link rel="apple-touch-icon" href="/icons/icon-192.png" />
<link rel="manifest" href="/manifest.json" />
```

Generate icons programmatically (use sharp or canvas to create 192x192 and 512x512 PNG icons with a simple 🌅 emoji on dark background, OR just create colored square PNGs).

## next.config.js
Use `next-pwa` package:
```js
const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
})
module.exports = withPWA({ /* next config */ })
```

## What "Fully Functional" Means
Every feature must:
- Connect to real Supabase data (not mock/hardcoded beyond initial seeds)
- Have working CRUD (create, read, update, delete or move)
- Show loading states
- Show empty states
- Handle errors gracefully
- Work on mobile viewport (375px width minimum)
- Smooth without janky layouts

## Final Steps After Building

1. Create GitHub repo: `gh repo create AuroraLocke05/aurora-mission-control --public --push --source=.`
2. Run the SQL migration in Supabase (print instructions for the user)
3. Deploy to Vercel: `vercel --prod`
4. Tell the user the live URL

## Important Notes
- Use `@supabase/supabase-js` v2 for client
- For realtime, use `supabase.channel().on('postgres_changes', ...)` 
- All pages should be client components (`'use client'`) since they need realtime
- The `supabase/migrations/` folder is just for reference — user will manually run SQL in Supabase dashboard
- Don't use `next/font/google` (can cause issues) — use system font stack instead
- Use `cn()` from `clsx` + `tailwind-merge` for class merging
- shadcn/ui components: install them with `npx shadcn@latest add <component>`
