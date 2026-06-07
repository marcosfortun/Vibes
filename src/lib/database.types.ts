export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: {
          color: string | null
          created_at: string
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name: string
        }
        Update: {
          color?: string | null
          created_at?: string
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      friendships: {
        Row: {
          affinity: number
          friend_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          affinity?: number
          friend_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          affinity?: number
          friend_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "friendships_friend_id_fkey"
            columns: ["friend_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "friendships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      invitation_tokens: {
        Row: {
          created_at: string
          expires_at: string
          generated_by: string
          id: string
          is_used: boolean
          revoked_at: string | null
          token: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          generated_by: string
          id?: string
          is_used?: boolean
          revoked_at?: string | null
          token?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          generated_by?: string
          id?: string
          is_used?: boolean
          revoked_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "invitation_tokens_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          category_id: string
          created_at: string
          created_by: string
          description: string | null
          global_score: number
          id: string
          title: string
          url: string | null
        }
        Insert: {
          category_id: string
          created_at?: string
          created_by: string
          description?: string | null
          global_score?: number
          id?: string
          title: string
          url?: string | null
        }
        Update: {
          category_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          global_score?: number
          id?: string
          title?: string
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendations_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_interactions: {
        Row: {
          id: string
          rating: number | null
          recommendation_id: string
          saved: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          id?: string
          rating?: number | null
          recommendation_id: string
          saved?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          id?: string
          rating?: number | null
          recommendation_id?: string
          saved?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          created_at: string
          email: string
          id: string
          is_searchable: boolean
          language: Database["public"]["Enums"]["app_language"]
          role: Database["public"]["Enums"]["user_role"]
          use_affinity_scoring: boolean
          username: string
        }
        Insert: {
          created_at?: string
          email: string
          id: string
          is_searchable?: boolean
          language?: Database["public"]["Enums"]["app_language"]
          role?: Database["public"]["Enums"]["user_role"]
          use_affinity_scoring?: boolean
          username: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_searchable?: boolean
          language?: Database["public"]["Enums"]["app_language"]
          role?: Database["public"]["Enums"]["user_role"]
          use_affinity_scoring?: boolean
          username?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_invitation: {
        Args: { t: string }
        Returns: {
          created: boolean
          host_id: string
        }[]
      }
      ensure_invite: { Args: never; Returns: string }
      find_similar_recommendations: {
        Args: { q: string; threshold?: number }
        Returns: {
          category_id: string
          id: string
          similarity: number
          title: string
        }[]
      }
      invite_info: {
        Args: { t: string }
        Returns: {
          host_id: string
          host_username: string
        }[]
      }
      invite_token_valid: { Args: { t: string }; Returns: boolean }
      is_admin: { Args: { uid?: string }; Returns: boolean }
      organizar_quedada: {
        Args: { attendees: string[] }
        Returns: {
          category_id: string
          recommendation_id: string
          sg: number
          title: string
        }[]
      }
      regenerate_invite: { Args: never; Returns: string }
      remove_friend: { Args: { target_id: string }; Returns: undefined }
      revoke_invite: { Args: never; Returns: undefined }
    }
    Enums: {
      app_language: "en" | "es" | "fr" | "pt"
      user_role: "user" | "admin"
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
  public: {
    Enums: {
      app_language: ["en", "es", "fr", "pt"],
      user_role: ["user", "admin"],
    },
  },
} as const

