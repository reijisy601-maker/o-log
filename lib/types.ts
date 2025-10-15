export interface User {
  id: string
  email: string
  name?: string
  role: "user" | "admin"
  created_at: string
  last_login?: string
  location_note?: string
}

export interface Submission {
  id: string
  user_id: string
  image_url: string | null
  luggage_space_image_url?: string | null
  tool_bag_image_url?: string | null
  score: number
  luggage_space_score?: number | null
  tool_bag_score?: number | null
  luggage_space_comment?: string | null
  tool_bag_comment?: string | null
  month: string
  created_at: string
  analysis_result?: string | null
}

export interface MonthlyStats {
  month: string
  total_users: number
  submitted_users: number
  submission_rate: number
  average_score: number | null
}

export interface AdminLog {
  id: string
  admin_id: string
  action: string
  target_user_id?: string
  details?: Record<string, unknown> | null
  created_at: string
}

export interface SecuritySettings {
  allowed_domains: string[]
}
