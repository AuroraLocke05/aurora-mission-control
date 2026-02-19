export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE'
export type TaskAssignee = 'joey' | 'aurora'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  assignee: TaskAssignee
  priority: TaskPriority
  created_at: string
  updated_at: string
}

export type ContentStage = 'idea' | 'script' | 'thumbnail' | 'filming' | 'published'
export type ContentPlatform = 'twitter' | 'youtube' | 'tiktok' | 'instagram' | 'blog'

export interface ContentItem {
  id: string
  title: string
  description?: string
  stage: ContentStage
  script?: string
  thumbnail_url?: string
  platform?: ContentPlatform
  notes?: string
  created_at: string
  updated_at: string
}

export type EventType = 'cron' | 'task' | 'meeting' | 'reminder'

export interface CalendarEvent {
  id: string
  title: string
  description?: string
  start_time: string
  end_time?: string
  type: EventType
  recurring?: string
  color: string
  created_at: string
}

export interface Memory {
  id: string
  title: string
  content: string
  tags: string[]
  source: string
  memory_date?: string
  updated_at: string
}

export type MemberType = 'human' | 'agent'
export type MemberStatus = 'active' | 'idle' | 'offline'

export interface TeamMember {
  id: string
  name: string
  role: string
  type: MemberType
  description?: string
  responsibilities: string[]
  status: MemberStatus
  current_task?: string
  avatar: string
  sort_order: number
  created_at: string
  updated_at: string
}
