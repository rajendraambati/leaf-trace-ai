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
  public: {
    Tables: {
      ai_gradings: {
        Row: {
          ai_grade: string | null
          analyzed_at: string | null
          batch_id: string
          confidence: number | null
          crop_health_score: number | null
          defects_detected: string[] | null
          esg_score: number | null
          id: string
          image_url: string | null
          quality_score: number | null
          recommendations: string[] | null
        }
        Insert: {
          ai_grade?: string | null
          analyzed_at?: string | null
          batch_id: string
          confidence?: number | null
          crop_health_score?: number | null
          defects_detected?: string[] | null
          esg_score?: number | null
          id?: string
          image_url?: string | null
          quality_score?: number | null
          recommendations?: string[] | null
        }
        Update: {
          ai_grade?: string | null
          analyzed_at?: string | null
          batch_id?: string
          confidence?: number | null
          crop_health_score?: number | null
          defects_detected?: string[] | null
          esg_score?: number | null
          id?: string
          image_url?: string | null
          quality_score?: number | null
          recommendations?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_gradings_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "procurement_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      batch_quality_tests: {
        Row: {
          ai_confidence: number | null
          ai_grade: string | null
          batch_id: string
          id: string
          moisture_content: number | null
          nicotine_level: number | null
          notes: string | null
          sugar_content: number | null
          test_date: string | null
          tested_by: string | null
        }
        Insert: {
          ai_confidence?: number | null
          ai_grade?: string | null
          batch_id: string
          id?: string
          moisture_content?: number | null
          nicotine_level?: number | null
          notes?: string | null
          sugar_content?: number | null
          test_date?: string | null
          tested_by?: string | null
        }
        Update: {
          ai_confidence?: number | null
          ai_grade?: string | null
          batch_id?: string
          id?: string
          moisture_content?: number | null
          nicotine_level?: number | null
          notes?: string | null
          sugar_content?: number | null
          test_date?: string | null
          tested_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "batch_quality_tests_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "procurement_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_audits: {
        Row: {
          audit_date: string
          audit_type: string
          auditor_name: string | null
          created_at: string | null
          created_by: string | null
          findings: string | null
          id: string
          score: number | null
          status: string | null
        }
        Insert: {
          audit_date: string
          audit_type: string
          auditor_name?: string | null
          created_at?: string | null
          created_by?: string | null
          findings?: string | null
          id?: string
          score?: number | null
          status?: string | null
        }
        Update: {
          audit_date?: string
          audit_type?: string
          auditor_name?: string | null
          created_at?: string | null
          created_by?: string | null
          findings?: string | null
          id?: string
          score?: number | null
          status?: string | null
        }
        Relationships: []
      }
      compliance_certifications: {
        Row: {
          certificate_number: string | null
          created_at: string | null
          document_url: string | null
          expiry_date: string | null
          id: string
          issue_date: string | null
          issuer: string
          name: string
          status: string | null
        }
        Insert: {
          certificate_number?: string | null
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer: string
          name: string
          status?: string | null
        }
        Update: {
          certificate_number?: string | null
          created_at?: string | null
          document_url?: string | null
          expiry_date?: string | null
          id?: string
          issue_date?: string | null
          issuer?: string
          name?: string
          status?: string | null
        }
        Relationships: []
      }
      esg_scores: {
        Row: {
          assessed_by: string | null
          assessment_date: string | null
          entity_id: string
          entity_type: string
          environmental_score: number | null
          governance_score: number | null
          id: string
          notes: string | null
          overall_score: number | null
          social_score: number | null
        }
        Insert: {
          assessed_by?: string | null
          assessment_date?: string | null
          entity_id: string
          entity_type: string
          environmental_score?: number | null
          governance_score?: number | null
          id?: string
          notes?: string | null
          overall_score?: number | null
          social_score?: number | null
        }
        Update: {
          assessed_by?: string | null
          assessment_date?: string | null
          entity_id?: string
          entity_type?: string
          environmental_score?: number | null
          governance_score?: number | null
          id?: string
          notes?: string | null
          overall_score?: number | null
          social_score?: number | null
        }
        Relationships: []
      }
      farmer_certifications: {
        Row: {
          certification_name: string
          created_at: string | null
          expiry_date: string | null
          farmer_id: string
          id: string
          issue_date: string | null
          issuer: string | null
          status: string | null
        }
        Insert: {
          certification_name: string
          created_at?: string | null
          expiry_date?: string | null
          farmer_id: string
          id?: string
          issue_date?: string | null
          issuer?: string | null
          status?: string | null
        }
        Update: {
          certification_name?: string
          created_at?: string | null
          expiry_date?: string | null
          farmer_id?: string
          id?: string
          issue_date?: string | null
          issuer?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farmer_certifications_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
        ]
      }
      farmer_documents: {
        Row: {
          document_type: string
          document_url: string
          farmer_id: string
          id: string
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          document_type: string
          document_url: string
          farmer_id: string
          id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          document_type?: string
          document_url?: string
          farmer_id?: string
          id?: string
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "farmer_documents_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
        ]
      }
      farmers: {
        Row: {
          created_at: string | null
          email: string | null
          farm_size_acres: number | null
          geo_latitude: number | null
          geo_longitude: number | null
          id: string
          location: string
          name: string
          phone: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          farm_size_acres?: number | null
          geo_latitude?: number | null
          geo_longitude?: number | null
          id?: string
          location: string
          name: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          farm_size_acres?: number | null
          geo_latitude?: number | null
          geo_longitude?: number | null
          id?: string
          location?: string
          name?: string
          phone?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      processing_batches: {
        Row: {
          batch_id: string
          created_at: string | null
          end_time: string | null
          id: string
          input_quantity_kg: number
          output_quantity_kg: number | null
          progress: number | null
          quality_score: number | null
          start_time: string | null
          unit_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          input_quantity_kg: number
          output_quantity_kg?: number | null
          progress?: number | null
          quality_score?: number | null
          start_time?: string | null
          unit_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string | null
          end_time?: string | null
          id?: string
          input_quantity_kg?: number
          output_quantity_kg?: number | null
          progress?: number | null
          quality_score?: number | null
          start_time?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "processing_batches_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "procurement_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "processing_batches_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "processing_units"
            referencedColumns: ["id"]
          },
        ]
      }
      processing_units: {
        Row: {
          capacity_kg_per_day: number | null
          created_at: string | null
          id: string
          name: string
          status: string | null
        }
        Insert: {
          capacity_kg_per_day?: number | null
          created_at?: string | null
          id: string
          name: string
          status?: string | null
        }
        Update: {
          capacity_kg_per_day?: number | null
          created_at?: string | null
          id?: string
          name?: string
          status?: string | null
        }
        Relationships: []
      }
      procurement_batches: {
        Row: {
          created_at: string | null
          created_by: string | null
          farmer_id: string
          grade: string
          id: string
          price_per_kg: number
          procurement_date: string | null
          qr_code: string | null
          quantity_kg: number
          status: string | null
          total_price: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          farmer_id: string
          grade: string
          id: string
          price_per_kg: number
          procurement_date?: string | null
          qr_code?: string | null
          quantity_kg: number
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          farmer_id?: string
          grade?: string
          id?: string
          price_per_kg?: number
          procurement_date?: string | null
          qr_code?: string | null
          quantity_kg?: number
          status?: string | null
          total_price?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "procurement_batches_farmer_id_fkey"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      shipments: {
        Row: {
          actual_arrival: string | null
          batch_id: string
          created_at: string | null
          departure_time: string | null
          driver_name: string | null
          eta: string | null
          from_location: string
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          status: string | null
          temperature_max: number | null
          temperature_min: number | null
          to_location: string
          updated_at: string | null
          vehicle_id: string | null
        }
        Insert: {
          actual_arrival?: string | null
          batch_id: string
          created_at?: string | null
          departure_time?: string | null
          driver_name?: string | null
          eta?: string | null
          from_location: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id: string
          status?: string | null
          temperature_max?: number | null
          temperature_min?: number | null
          to_location: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Update: {
          actual_arrival?: string | null
          batch_id?: string
          created_at?: string | null
          departure_time?: string | null
          driver_name?: string | null
          eta?: string | null
          from_location?: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          status?: string | null
          temperature_max?: number | null
          temperature_min?: number | null
          to_location?: string
          updated_at?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "procurement_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      warehouse_inventory: {
        Row: {
          batch_id: string
          created_at: string | null
          entry_date: string | null
          exit_date: string | null
          id: string
          quantity_kg: number
          warehouse_id: string
        }
        Insert: {
          batch_id: string
          created_at?: string | null
          entry_date?: string | null
          exit_date?: string | null
          id?: string
          quantity_kg: number
          warehouse_id: string
        }
        Update: {
          batch_id?: string
          created_at?: string | null
          entry_date?: string | null
          exit_date?: string | null
          id?: string
          quantity_kg?: number
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_inventory_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "procurement_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_inventory_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          created_at: string | null
          current_stock_kg: number | null
          humidity: number | null
          id: string
          location: string
          max_capacity_kg: number
          name: string
          status: string | null
          temperature: number | null
        }
        Insert: {
          created_at?: string | null
          current_stock_kg?: number | null
          humidity?: number | null
          id: string
          location: string
          max_capacity_kg: number
          name: string
          status?: string | null
          temperature?: number | null
        }
        Update: {
          created_at?: string | null
          current_stock_kg?: number | null
          humidity?: number | null
          id?: string
          location?: string
          max_capacity_kg?: number
          name?: string
          status?: string | null
          temperature?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role:
        | "farmer"
        | "technician"
        | "procurement_agent"
        | "logistics_manager"
        | "factory_manager"
        | "auditor"
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
      app_role: [
        "farmer",
        "technician",
        "procurement_agent",
        "logistics_manager",
        "factory_manager",
        "auditor",
      ],
    },
  },
} as const
