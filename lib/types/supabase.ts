export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "monthly_user_activity"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "monthly_user_activity"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "admin_logs_target_user_id_fkey"
            columns: ["target_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      allowed_email_domains: {
        Row: {
          created_at: string | null
          description: string | null
          domain: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          domain: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          domain?: string
        }
        Relationships: []
      }
      auth_allowed_domains: {
        Row: {
          created_at: string
          domain: string
        }
        Insert: {
          created_at?: string
          domain: string
        }
        Update: {
          created_at?: string
          domain?: string
        }
        Relationships: []
      }
      auth_passcodes: {
        Row: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          rotated_at: string | null
          updated_by: string | null
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          rotated_at?: string | null
          updated_by?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          rotated_at?: string | null
          updated_by?: string | null
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          employee_no: string | null
          first_login_completed: boolean | null
          first_name: string | null
          id: string
          is_deleted: boolean
          last_login: string | null
          last_name: string | null
          manager_id: string | null
          notes: string | null
          role: string | null
          site_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          employee_no?: string | null
          first_login_completed?: boolean | null
          first_name?: string | null
          id: string
          is_deleted?: boolean
          last_login?: string | null
          last_name?: string | null
          manager_id?: string | null
          notes?: string | null
          role?: string | null
          site_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          employee_no?: string | null
          first_login_completed?: boolean | null
          first_name?: string | null
          id?: string
          is_deleted?: boolean
          last_login?: string | null
          last_name?: string | null
          manager_id?: string | null
          notes?: string | null
          role?: string | null
          site_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "monthly_user_activity"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "profiles_manager_id_fkey"
            columns: ["manager_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_site_id_fkey"
            columns: ["site_id"]
            isOneToOne: false
            referencedRelation: "sites"
            referencedColumns: ["id"]
          },
        ]
      }
      sites: {
        Row: {
          active: boolean | null
          code: string
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          active?: boolean | null
          code: string
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          active?: boolean | null
          code?: string
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      submissions: {
        Row: {
          analysis_result: string | null
          created_at: string | null
          first_impression: Json | null
          id: string
          image_path: string
          image_url: string | null
          luggage_space_comment: string | null
          luggage_space_image_url: string | null
          luggage_space_score: number | null
          month: string | null
          score: number | null
          tool_bag_comment: string | null
          tool_bag_image_url: string | null
          tool_bag_score: number | null
          user_id: string
        }
        Insert: {
          analysis_result?: string | null
          created_at?: string | null
          first_impression?: Json | null
          id?: string
          image_path: string
          image_url?: string | null
          luggage_space_comment?: string | null
          luggage_space_image_url?: string | null
          luggage_space_score?: number | null
          month?: string | null
          score?: number | null
          tool_bag_comment?: string | null
          tool_bag_image_url?: string | null
          tool_bag_score?: number | null
          user_id: string
        }
        Update: {
          analysis_result?: string | null
          created_at?: string | null
          first_impression?: Json | null
          id?: string
          image_path?: string
          image_url?: string | null
          luggage_space_comment?: string | null
          luggage_space_image_url?: string | null
          luggage_space_score?: number | null
          month?: string | null
          score?: number | null
          tool_bag_comment?: string | null
          tool_bag_image_url?: string | null
          tool_bag_score?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "monthly_user_activity"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "submissions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      monthly_stats: {
        Row: {
          average_score: number | null
          month: string | null
          submission_rate: number | null
          submitted_users: number | null
          total_users: number | null
        }
        Relationships: []
      }
      monthly_user_activity: {
        Row: {
          first_submission_at: string | null
          last_submission_at: string | null
          month: string | null
          submission_count: number | null
          user_id: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_add_allowed_domain: {
        Args: { p_domain: string }
        Returns: {
          created_at: string
          domain: string
        }
      }
      admin_get_role_diagnostics: {
        Args: { email?: string; user_id?: string }
        Returns: Json
      }
      admin_list_allowed_domains: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          domain: string
        }[]
      }
      admin_list_passcodes: {
        Args: Record<PropertyKey, never>
        Returns: {
          code: string
          description: string
          id: string
          is_active: boolean
          rotated_at: string
          updated_by: string
          valid_from: string
          valid_until: string
        }[]
      }
      admin_list_profiles: {
        Args: Record<PropertyKey, never>
        Returns: {
          created_at: string
          email: string
          employee_no: string
          first_login_completed: boolean
          first_name: string
          id: string
          is_deleted: boolean
          last_name: string
          manager_id: string
          manager_name: string
          notes: string
          site_code: string
          site_id: string
          site_name: string
          updated_at: string
        }[]
      }
      admin_monthly_activity: {
        Args: { p_month?: string }
        Returns: {
          email: string
          employee_no: string
          first_name: string
          first_submission_at: string
          last_name: string
          last_submission_at: string
          site_code: string
          site_id: string
          site_name: string
          submission_count: number
          user_id: string
        }[]
      }
      admin_remove_allowed_domain: {
        Args: { p_domain: string }
        Returns: undefined
      }
      admin_rotate_passcode: {
        Args: { p_code: string; p_description?: string; p_valid_until?: string }
        Returns: {
          code: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          rotated_at: string | null
          updated_by: string | null
          valid_from: string
          valid_until: string | null
        }
      }
      admin_set_account_role: {
        Args: { p_role: string; p_user_id: string }
        Returns: {
          created_at: string | null
          email: string | null
          employee_no: string | null
          first_login_completed: boolean | null
          first_name: string | null
          id: string
          is_deleted: boolean
          last_login: string | null
          last_name: string | null
          manager_id: string | null
          notes: string | null
          role: string | null
          site_id: string | null
          updated_at: string | null
        }
      }
      admin_soft_delete_profile: {
        Args: { p_id: string }
        Returns: undefined
      }
      admin_update_profile: {
        Args: {
          p_employee_no?: string
          p_first_login_completed?: boolean
          p_first_name?: string
          p_id: string
          p_last_name?: string
          p_manager_id?: string
          p_notes?: string
          p_site_id?: string
        }
        Returns: {
          created_at: string | null
          email: string | null
          employee_no: string | null
          first_login_completed: boolean | null
          first_name: string | null
          id: string
          is_deleted: boolean
          last_login: string | null
          last_name: string | null
          manager_id: string | null
          notes: string | null
          role: string | null
          site_id: string | null
          updated_at: string | null
        }
      }
      assert_admin: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      get_non_submitted_users: {
        Args: { target_month: string }
        Returns: {
          email: string
          id: string
          last_login: string
          name: string
        }[]
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_domain_allowed: {
        Args: { p_email: string }
        Returns: boolean
      }
      is_valid_signup_passcode: {
        Args: { p_code: string }
        Returns: boolean
      }
      mark_first_login_completed: {
        Args: {
          p_employee_no?: string
          p_first_name?: string
          p_last_name?: string
          p_notes?: string
          p_site_id?: string
        }
        Returns: {
          created_at: string | null
          email: string | null
          employee_no: string | null
          first_login_completed: boolean | null
          first_name: string | null
          id: string
          is_deleted: boolean
          last_login: string | null
          last_name: string | null
          manager_id: string | null
          notes: string | null
          role: string | null
          site_id: string | null
          updated_at: string | null
        }
      }
      register_magic_link: {
        Args: { p_email: string; p_passcode?: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
