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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      ad_sets: {
        Row: {
          budget: number | null
          campaign_id: string
          created_at: string
          id: string
          meta_adset_id: string | null
          name: string
          status: string
          targeting: Json | null
        }
        Insert: {
          budget?: number | null
          campaign_id: string
          created_at?: string
          id?: string
          meta_adset_id?: string | null
          name: string
          status?: string
          targeting?: Json | null
        }
        Update: {
          budget?: number | null
          campaign_id?: string
          created_at?: string
          id?: string
          meta_adset_id?: string | null
          name?: string
          status?: string
          targeting?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_sets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ads: {
        Row: {
          ad_set_id: string
          created_at: string
          creative_url: string | null
          id: string
          meta_ad_id: string | null
          name: string
          status: string
        }
        Insert: {
          ad_set_id: string
          created_at?: string
          creative_url?: string | null
          id?: string
          meta_ad_id?: string | null
          name: string
          status?: string
        }
        Update: {
          ad_set_id?: string
          created_at?: string
          creative_url?: string | null
          id?: string
          meta_ad_id?: string | null
          name?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ads_ad_set_id_fkey"
            columns: ["ad_set_id"]
            isOneToOne: false
            referencedRelation: "ad_sets"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_executions: {
        Row: {
          agent_id: string
          created_at: string
          duration_ms: number | null
          id: string
          input: string | null
          output: string | null
          status: string
          user_id: string
        }
        Insert: {
          agent_id: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          input?: string | null
          output?: string | null
          status?: string
          user_id: string
        }
        Update: {
          agent_id?: string
          created_at?: string
          duration_ms?: number | null
          id?: string
          input?: string | null
          output?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_executions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agent_versions: {
        Row: {
          agent_id: string
          context: string | null
          created_at: string
          id: string
          system_prompt: string | null
          task: string | null
          version: number
        }
        Insert: {
          agent_id: string
          context?: string | null
          created_at?: string
          id?: string
          system_prompt?: string | null
          task?: string | null
          version: number
        }
        Update: {
          agent_id?: string
          context?: string | null
          created_at?: string
          id?: string
          system_prompt?: string | null
          task?: string | null
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "agent_versions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          },
        ]
      }
      agents: {
        Row: {
          context: string | null
          created_at: string
          description: string | null
          id: string
          model: string
          name: string
          status: string
          system_prompt: string | null
          tags: string[] | null
          task: string | null
          updated_at: string
          user_id: string
          version: number
        }
        Insert: {
          context?: string | null
          created_at?: string
          description?: string | null
          id?: string
          model?: string
          name: string
          status?: string
          system_prompt?: string | null
          tags?: string[] | null
          task?: string | null
          updated_at?: string
          user_id: string
          version?: number
        }
        Update: {
          context?: string | null
          created_at?: string
          description?: string | null
          id?: string
          model?: string
          name?: string
          status?: string
          system_prompt?: string | null
          tags?: string[] | null
          task?: string | null
          updated_at?: string
          user_id?: string
          version?: number
        }
        Relationships: []
      }
      alerts: {
        Row: {
          alert_type: string
          created_at: string
          entity_id: string
          entity_type: string
          id: string
          message: string
          resolved_at: string | null
          severity: string
        }
        Insert: {
          alert_type: string
          created_at?: string
          entity_id: string
          entity_type: string
          id?: string
          message: string
          resolved_at?: string | null
          severity?: string
        }
        Update: {
          alert_type?: string
          created_at?: string
          entity_id?: string
          entity_type?: string
          id?: string
          message?: string
          resolved_at?: string | null
          severity?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          client_id: string
          created_at: string
          id: string
          meta_campaign_id: string | null
          name: string
          objective: string | null
          status: string
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          meta_campaign_id?: string | null
          name: string
          objective?: string | null
          status?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          meta_campaign_id?: string | null
          name?: string
          objective?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          id: string
          meta_account_id: string | null
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          meta_account_id?: string | null
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          meta_account_id?: string | null
          name?: string
        }
        Relationships: []
      }
      insights: {
        Row: {
          content: string
          entity_id: string
          entity_type: string
          generated_at: string
          id: string
        }
        Insert: {
          content: string
          entity_id: string
          entity_type: string
          generated_at?: string
          id?: string
        }
        Update: {
          content?: string
          entity_id?: string
          entity_type?: string
          generated_at?: string
          id?: string
        }
        Relationships: []
      }
      metrics: {
        Row: {
          clicks: number | null
          cost_per_result: number | null
          cpc: number | null
          cpm: number | null
          created_at: string
          ctr: number | null
          date: string
          entity_id: string
          entity_type: string
          frequency: number | null
          hold_rate: number | null
          hook_rate: number | null
          id: string
          impressions: number | null
          outbound_ctr: number | null
          reach: number | null
          results: number | null
          roas: number | null
          spend: number | null
        }
        Insert: {
          clicks?: number | null
          cost_per_result?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          date: string
          entity_id: string
          entity_type: string
          frequency?: number | null
          hold_rate?: number | null
          hook_rate?: number | null
          id?: string
          impressions?: number | null
          outbound_ctr?: number | null
          reach?: number | null
          results?: number | null
          roas?: number | null
          spend?: number | null
        }
        Update: {
          clicks?: number | null
          cost_per_result?: number | null
          cpc?: number | null
          cpm?: number | null
          created_at?: string
          ctr?: number | null
          date?: string
          entity_id?: string
          entity_type?: string
          frequency?: number | null
          hold_rate?: number | null
          hook_rate?: number | null
          id?: string
          impressions?: number | null
          outbound_ctr?: number | null
          reach?: number | null
          results?: number | null
          roas?: number | null
          spend?: number | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      users_clients: {
        Row: {
          client_id: string
          user_id: string
        }
        Insert: {
          client_id: string
          user_id: string
        }
        Update: {
          client_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_clients_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      entity_client_id: {
        Args: { _entity_id: string; _entity_type: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      user_has_client_access: {
        Args: { _client_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "super_admin" | "admin" | "user" | "viewer"
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
      app_role: ["super_admin", "admin", "user", "viewer"],
    },
  },
} as const
