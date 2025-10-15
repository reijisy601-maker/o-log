export interface User {
  id: string
  email: string
  name?: string
  role: "user" | "admin"
  created_at: string
  last_login?: string
}

export interface Submission {
  id: string
  user_id: string
  image_url: string
  luggage_space_image_url?: string
  tool_bag_image_url?: string
  score: number
  luggage_space_score?: number
  tool_bag_score?: number
  luggage_space_comment?: string
  tool_bag_comment?: string
  month: string
  created_at: string
  analysis_result?: string
}

export interface MonthlyStats {
  month: string
  total_users: number
  submitted_users: number
  submission_rate: number
  average_score: number
}

export interface AdminLog {
  id: string
  admin_id: string
  action: string
  target_user_id?: string
  details?: string
  created_at: string
}

export interface SecuritySettings {
  allowed_domains: string[]
  max_file_size: number
  allowed_file_types: string[]
}
