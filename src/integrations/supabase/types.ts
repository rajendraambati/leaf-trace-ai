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
          batch_id: string | null
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
          batch_id?: string | null
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
          batch_id?: string | null
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
            foreignKeyName: "fk_ai_gradings_batch"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "procurement_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_usage_analytics: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          error_message: string | null
          execution_time_ms: number | null
          feature_type: string
          id: string
          input_data: Json | null
          model_name: string | null
          output_data: Json | null
          success: boolean | null
          user_accepted: boolean | null
          user_id: string | null
          user_modified: boolean | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          feature_type: string
          id?: string
          input_data?: Json | null
          model_name?: string | null
          output_data?: Json | null
          success?: boolean | null
          user_accepted?: boolean | null
          user_id?: string | null
          user_modified?: boolean | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          error_message?: string | null
          execution_time_ms?: number | null
          feature_type?: string
          id?: string
          input_data?: Json | null
          model_name?: string | null
          output_data?: Json | null
          success?: boolean | null
          user_accepted?: boolean | null
          user_id?: string | null
          user_modified?: boolean | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          created_at: string | null
          data_snapshot: Json | null
          error_message: string | null
          id: string
          ip_address: string | null
          resource: string
          resource_id: string | null
          status: string | null
          timestamp: string
          user_agent: string | null
          user_email: string | null
          user_id: string | null
          user_role: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          data_snapshot?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          resource: string
          resource_id?: string | null
          status?: string | null
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          data_snapshot?: Json | null
          error_message?: string | null
          id?: string
          ip_address?: string | null
          resource?: string
          resource_id?: string | null
          status?: string | null
          timestamp?: string
          user_agent?: string | null
          user_email?: string | null
          user_id?: string | null
          user_role?: string | null
        }
        Relationships: []
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
          {
            foreignKeyName: "fk_batch_quality_tests_batch"
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
          {
            foreignKeyName: "fk_farmer_certifications_farmer"
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
          {
            foreignKeyName: "fk_farmer_documents_farmer"
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
      model_performance_metrics: {
        Row: {
          calculated_at: string | null
          feature_type: string
          id: string
          metric_type: string
          metric_value: number
          model_version: string
          period_end: string | null
          period_start: string | null
          sample_size: number | null
        }
        Insert: {
          calculated_at?: string | null
          feature_type: string
          id?: string
          metric_type: string
          metric_value: number
          model_version: string
          period_end?: string | null
          period_start?: string | null
          sample_size?: number | null
        }
        Update: {
          calculated_at?: string | null
          feature_type?: string
          id?: string
          metric_type?: string
          metric_value?: number
          model_version?: string
          period_end?: string | null
          period_start?: string | null
          sample_size?: number | null
        }
        Relationships: []
      }
      pending_registrations: {
        Row: {
          admin_notes: string | null
          biometric_data: Json | null
          created_at: string | null
          email: string
          email_verified: boolean | null
          full_name: string
          id: string
          password_hash: string
          phone: string
          phone_verified: boolean | null
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_notes?: string | null
          biometric_data?: Json | null
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          full_name: string
          id?: string
          password_hash: string
          phone: string
          phone_verified?: boolean | null
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_notes?: string | null
          biometric_data?: Json | null
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string
          id?: string
          password_hash?: string
          phone?: string
          phone_verified?: boolean | null
          requested_role?: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
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
            foreignKeyName: "fk_processing_batches_batch"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "procurement_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_processing_batches_unit"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "processing_units"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "fk_procurement_batches_farmer"
            columns: ["farmer_id"]
            isOneToOne: false
            referencedRelation: "farmers"
            referencedColumns: ["id"]
          },
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
      report_submissions: {
        Row: {
          error_message: string | null
          file_url: string | null
          format: string
          generated_at: string | null
          generated_by: string | null
          id: string
          period_end: string
          period_start: string
          portal_response: Json | null
          portal_submission_id: string | null
          portal_submitted: boolean | null
          report_type: string
          scheduled_report_id: string | null
          status: string | null
          submitted_at: string | null
        }
        Insert: {
          error_message?: string | null
          file_url?: string | null
          format: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          period_end: string
          period_start: string
          portal_response?: Json | null
          portal_submission_id?: string | null
          portal_submitted?: boolean | null
          report_type: string
          scheduled_report_id?: string | null
          status?: string | null
          submitted_at?: string | null
        }
        Update: {
          error_message?: string | null
          file_url?: string | null
          format?: string
          generated_at?: string | null
          generated_by?: string | null
          id?: string
          period_end?: string
          period_start?: string
          portal_response?: Json | null
          portal_submission_id?: string | null
          portal_submitted?: boolean | null
          report_type?: string
          scheduled_report_id?: string | null
          status?: string | null
          submitted_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "report_submissions_scheduled_report_id_fkey"
            columns: ["scheduled_report_id"]
            isOneToOne: false
            referencedRelation: "scheduled_reports"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          action: string
          allowed: boolean | null
          created_at: string | null
          id: string
          resource: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          action: string
          allowed?: boolean | null
          created_at?: string | null
          id?: string
          resource: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          action?: string
          allowed?: boolean | null
          created_at?: string | null
          id?: string
          resource?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      scheduled_reports: {
        Row: {
          created_at: string | null
          created_by: string | null
          enabled: boolean | null
          format: string | null
          id: string
          last_run: string | null
          next_run: string | null
          portal_credentials: Json | null
          portal_submission: boolean | null
          portal_url: string | null
          report_type: string
          schedule_cron: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          enabled?: boolean | null
          format?: string | null
          id?: string
          last_run?: string | null
          next_run?: string | null
          portal_credentials?: Json | null
          portal_submission?: boolean | null
          portal_url?: string | null
          report_type: string
          schedule_cron: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          enabled?: boolean | null
          format?: string | null
          id?: string
          last_run?: string | null
          next_run?: string | null
          portal_credentials?: Json | null
          portal_submission?: boolean | null
          portal_url?: string | null
          report_type?: string
          schedule_cron?: string
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
            foreignKeyName: "fk_shipments_batch"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "procurement_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "procurement_batches"
            referencedColumns: ["id"]
          },
        ]
      }
      user_documents: {
        Row: {
          document_name: string | null
          document_type: string
          document_url: string
          id: string
          registration_id: string | null
          uploaded_at: string | null
          user_id: string | null
        }
        Insert: {
          document_name?: string | null
          document_type: string
          document_url: string
          id?: string
          registration_id?: string | null
          uploaded_at?: string | null
          user_id?: string | null
        }
        Update: {
          document_name?: string | null
          document_type?: string
          document_url?: string
          id?: string
          registration_id?: string | null
          uploaded_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_documents_registration_id_fkey"
            columns: ["registration_id"]
            isOneToOne: false
            referencedRelation: "pending_registrations"
            referencedColumns: ["id"]
          },
        ]
      }
      user_feedback: {
        Row: {
          category: string | null
          created_at: string | null
          feature_type: string
          feedback_text: string | null
          id: string
          rating: number | null
          resource_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          feature_type: string
          feedback_text?: string | null
          id?: string
          rating?: number | null
          resource_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          feature_type?: string
          feedback_text?: string | null
          id?: string
          rating?: number | null
          resource_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: []
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
            foreignKeyName: "fk_warehouse_inventory_batch"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "procurement_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_warehouse_inventory_warehouse"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
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
      approve_registration: {
        Args: { _admin_id: string; _notes?: string; _registration_id: string }
        Returns: Json
      }
      decline_registration: {
        Args: { _admin_id: string; _notes: string; _registration_id: string }
        Returns: Json
      }
      has_permission: {
        Args: { _action: string; _resource: string; _user_id: string }
        Returns: boolean
      }
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
        | "admin"
        | "field_technician"
        | "compliance_auditor"
        | "system_admin"
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
        "admin",
        "field_technician",
        "compliance_auditor",
        "system_admin",
      ],
    },
  },
} as const
