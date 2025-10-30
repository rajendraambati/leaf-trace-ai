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
      aggregation_relationships: {
        Row: {
          aggregated_by: string | null
          aggregation_date: string | null
          child_serial: string
          created_at: string | null
          disaggregated_by: string | null
          disaggregation_date: string | null
          id: string
          notes: string | null
          parent_serial: string
          status: string | null
        }
        Insert: {
          aggregated_by?: string | null
          aggregation_date?: string | null
          child_serial: string
          created_at?: string | null
          disaggregated_by?: string | null
          disaggregation_date?: string | null
          id?: string
          notes?: string | null
          parent_serial: string
          status?: string | null
        }
        Update: {
          aggregated_by?: string | null
          aggregation_date?: string | null
          child_serial?: string
          created_at?: string | null
          disaggregated_by?: string | null
          disaggregation_date?: string | null
          id?: string
          notes?: string | null
          parent_serial?: string
          status?: string | null
        }
        Relationships: []
      }
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
      ai_vehicle_insights: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          insight_type: string
          is_read: boolean | null
          is_resolved: boolean | null
          message: string
          metadata: Json | null
          recommendations: string[] | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string | null
          shipment_id: string | null
          title: string
          vehicle_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          insight_type: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message: string
          metadata?: Json | null
          recommendations?: string[] | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          shipment_id?: string | null
          title: string
          vehicle_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          insight_type?: string
          is_read?: boolean | null
          is_resolved?: boolean | null
          message?: string
          metadata?: Json | null
          recommendations?: string[] | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string | null
          shipment_id?: string | null
          title?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_vehicle_insights_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_vehicle_insights_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_trip_statistics"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "ai_vehicle_insights_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      anomaly_auto_resolutions: {
        Row: {
          anomaly_id: string
          attempted_at: string | null
          error_message: string | null
          id: string
          metadata: Json | null
          resolution_action: string
          resolution_type: string
          success: boolean | null
        }
        Insert: {
          anomaly_id: string
          attempted_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          resolution_action: string
          resolution_type: string
          success?: boolean | null
        }
        Update: {
          anomaly_id?: string
          attempted_at?: string | null
          error_message?: string | null
          id?: string
          metadata?: Json | null
          resolution_action?: string
          resolution_type?: string
          success?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "anomaly_auto_resolutions_anomaly_id_fkey"
            columns: ["anomaly_id"]
            isOneToOne: false
            referencedRelation: "anomaly_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      anomaly_logs: {
        Row: {
          anomaly_type: string
          created_at: string | null
          description: string
          detected_at: string
          detected_by: string | null
          entity_id: string
          entity_type: string
          escalated: boolean | null
          escalated_at: string | null
          escalated_to: string | null
          id: string
          impact_assessment: string | null
          metadata: Json | null
          resolution_applied: string | null
          resolution_suggested: string | null
          resolved_at: string | null
          resolved_by: string | null
          root_cause: string | null
          severity: string
          status: string
          title: string
          updated_at: string | null
        }
        Insert: {
          anomaly_type: string
          created_at?: string | null
          description: string
          detected_at?: string
          detected_by?: string | null
          entity_id: string
          entity_type: string
          escalated?: boolean | null
          escalated_at?: string | null
          escalated_to?: string | null
          id?: string
          impact_assessment?: string | null
          metadata?: Json | null
          resolution_applied?: string | null
          resolution_suggested?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          title: string
          updated_at?: string | null
        }
        Update: {
          anomaly_type?: string
          created_at?: string | null
          description?: string
          detected_at?: string
          detected_by?: string | null
          entity_id?: string
          entity_type?: string
          escalated?: boolean | null
          escalated_at?: string | null
          escalated_to?: string | null
          id?: string
          impact_assessment?: string | null
          metadata?: Json | null
          resolution_applied?: string | null
          resolution_suggested?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          root_cause?: string | null
          severity?: string
          status?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      anomaly_resolution_history: {
        Row: {
          action: string
          anomaly_id: string
          id: string
          metadata: Json | null
          notes: string | null
          performed_at: string | null
          performed_by: string | null
        }
        Insert: {
          action: string
          anomaly_id: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          performed_at?: string | null
          performed_by?: string | null
        }
        Update: {
          action?: string
          anomaly_id?: string
          id?: string
          metadata?: Json | null
          notes?: string | null
          performed_at?: string | null
          performed_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "anomaly_resolution_history_anomaly_id_fkey"
            columns: ["anomaly_id"]
            isOneToOne: false
            referencedRelation: "anomaly_logs"
            referencedColumns: ["id"]
          },
        ]
      }
      assistant_conversations: {
        Row: {
          created_at: string
          id: string
          message_count: number
          messages: Json
          page_context: string
          updated_at: string
          user_id: string
          user_role: string
        }
        Insert: {
          created_at?: string
          id?: string
          message_count?: number
          messages?: Json
          page_context: string
          updated_at?: string
          user_id: string
          user_role: string
        }
        Update: {
          created_at?: string
          id?: string
          message_count?: number
          messages?: Json
          page_context?: string
          updated_at?: string
          user_id?: string
          user_role?: string
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
      campaign_participants: {
        Row: {
          campaign_id: string
          created_at: string | null
          enrollment_date: string | null
          id: string
          orders_count: number | null
          retailer_id: string
          status: string | null
          total_discount_applied: number | null
          total_purchases: number | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          enrollment_date?: string | null
          id?: string
          orders_count?: number | null
          retailer_id: string
          status?: string | null
          total_discount_applied?: number | null
          total_purchases?: number | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          enrollment_date?: string | null
          id?: string
          orders_count?: number | null
          retailer_id?: string
          status?: string | null
          total_discount_applied?: number | null
          total_purchases?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_participants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "promotional_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "campaign_participants_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
        ]
      }
      client_notifications: {
        Row: {
          client_id: string
          client_type: string
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          metadata: Json | null
          notification_type: string
          priority: string | null
          related_entity_id: string | null
          related_entity_type: string | null
          title: string
          user_id: string
        }
        Insert: {
          client_id: string
          client_type: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          metadata?: Json | null
          notification_type: string
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title: string
          user_id: string
        }
        Update: {
          client_id?: string
          client_type?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          metadata?: Json | null
          notification_type?: string
          priority?: string | null
          related_entity_id?: string | null
          related_entity_type?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      client_portal_access: {
        Row: {
          access_level: string
          allowed_modules: string[]
          client_id: string
          client_type: string
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_level?: string
          allowed_modules?: string[]
          client_id: string
          client_type: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_level?: string
          allowed_modules?: string[]
          client_id?: string
          client_type?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
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
      compliance_documents: {
        Row: {
          created_at: string | null
          document_number: string
          document_type: string
          document_url: string | null
          entity_id: string
          entity_type: string
          expiry_date: string | null
          id: string
          issue_date: string
          metadata: Json | null
          region: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_number: string
          document_type: string
          document_url?: string | null
          entity_id: string
          entity_type: string
          expiry_date?: string | null
          id?: string
          issue_date: string
          metadata?: Json | null
          region: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_number?: string
          document_type?: string
          document_url?: string | null
          entity_id?: string
          entity_type?: string
          expiry_date?: string | null
          id?: string
          issue_date?: string
          metadata?: Json | null
          region?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      compliance_reports: {
        Row: {
          acknowledgment_number: string | null
          authority_id: string | null
          country_id: string | null
          created_at: string | null
          id: string
          report_data: Json
          report_number: string
          report_period_end: string
          report_period_start: string
          report_type: string
          response_data: Json | null
          submission_status: string | null
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string | null
        }
        Insert: {
          acknowledgment_number?: string | null
          authority_id?: string | null
          country_id?: string | null
          created_at?: string | null
          id?: string
          report_data?: Json
          report_number: string
          report_period_end: string
          report_period_start: string
          report_type: string
          response_data?: Json | null
          submission_status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Update: {
          acknowledgment_number?: string | null
          authority_id?: string | null
          country_id?: string | null
          created_at?: string | null
          id?: string
          report_data?: Json
          report_number?: string
          report_period_end?: string
          report_period_start?: string
          report_type?: string
          response_data?: Json | null
          submission_status?: string | null
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_reports_authority_id_fkey"
            columns: ["authority_id"]
            isOneToOne: false
            referencedRelation: "reporting_authorities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compliance_reports_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_rules: {
        Row: {
          country_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          is_mandatory: boolean | null
          rule_config: Json
          rule_description: string | null
          rule_name: string
          rule_type: string
          severity: string | null
          updated_at: string | null
        }
        Insert: {
          country_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          rule_config?: Json
          rule_description?: string | null
          rule_name: string
          rule_type: string
          severity?: string | null
          updated_at?: string | null
        }
        Update: {
          country_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          is_mandatory?: boolean | null
          rule_config?: Json
          rule_description?: string | null
          rule_name?: string
          rule_type?: string
          severity?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "compliance_rules_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      compliance_sync_logs: {
        Row: {
          created_at: string | null
          error_message: string | null
          id: string
          initiated_by: string | null
          request_payload: Json | null
          response_payload: Json | null
          serial_numbers: string[]
          status: string | null
          sync_completed_at: string | null
          sync_direction: string
          sync_started_at: string | null
          sync_type: string
        }
        Insert: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          initiated_by?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          serial_numbers: string[]
          status?: string | null
          sync_completed_at?: string | null
          sync_direction: string
          sync_started_at?: string | null
          sync_type: string
        }
        Update: {
          created_at?: string | null
          error_message?: string | null
          id?: string
          initiated_by?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          serial_numbers?: string[]
          status?: string | null
          sync_completed_at?: string | null
          sync_direction?: string
          sync_started_at?: string | null
          sync_type?: string
        }
        Relationships: []
      }
      compliance_validations: {
        Row: {
          created_at: string | null
          entity_id: string
          entity_type: string
          expired_documents: string[] | null
          id: string
          missing_documents: string[] | null
          required_documents: string[]
          validated_at: string | null
          validated_by: string | null
          validation_details: Json | null
          validation_status: string | null
          validation_type: string
        }
        Insert: {
          created_at?: string | null
          entity_id: string
          entity_type: string
          expired_documents?: string[] | null
          id?: string
          missing_documents?: string[] | null
          required_documents: string[]
          validated_at?: string | null
          validated_by?: string | null
          validation_details?: Json | null
          validation_status?: string | null
          validation_type: string
        }
        Update: {
          created_at?: string | null
          entity_id?: string
          entity_type?: string
          expired_documents?: string[] | null
          id?: string
          missing_documents?: string[] | null
          required_documents?: string[]
          validated_at?: string | null
          validated_by?: string | null
          validation_details?: Json | null
          validation_status?: string | null
          validation_type?: string
        }
        Relationships: []
      }
      countries: {
        Row: {
          code: string
          compliance_framework: string | null
          created_at: string | null
          currency: string | null
          hs_code_prefix: string | null
          id: string
          is_active: boolean | null
          name: string
          region: string | null
          regulatory_authority: string | null
          reporting_endpoint: string | null
          tax_rate: number | null
          updated_at: string | null
        }
        Insert: {
          code: string
          compliance_framework?: string | null
          created_at?: string | null
          currency?: string | null
          hs_code_prefix?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          region?: string | null
          regulatory_authority?: string | null
          reporting_endpoint?: string | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Update: {
          code?: string
          compliance_framework?: string | null
          created_at?: string | null
          currency?: string | null
          hs_code_prefix?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          region?: string | null
          regulatory_authority?: string | null
          reporting_endpoint?: string | null
          tax_rate?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      country_document_templates: {
        Row: {
          compliance_fields: Json | null
          country_id: string | null
          created_at: string | null
          document_type: string
          id: string
          is_active: boolean | null
          is_default: boolean | null
          template_config: Json
          template_name: string
          updated_at: string | null
        }
        Insert: {
          compliance_fields?: Json | null
          country_id?: string | null
          created_at?: string | null
          document_type: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          template_config?: Json
          template_name: string
          updated_at?: string | null
        }
        Update: {
          compliance_fields?: Json | null
          country_id?: string | null
          created_at?: string | null
          document_type?: string
          id?: string
          is_active?: boolean | null
          is_default?: boolean | null
          template_config?: Json
          template_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "country_document_templates_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_orders: {
        Row: {
          created_at: string | null
          currency: string | null
          customer_id: string | null
          delivery_date: string | null
          id: string
          order_date: string
          order_items: Json | null
          order_number: string
          order_status: string | null
          payment_status: string | null
          shipping_address: string | null
          special_instructions: string | null
          target_market_id: string | null
          total_amount: number
          total_quantity_kg: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          delivery_date?: string | null
          id?: string
          order_date: string
          order_items?: Json | null
          order_number: string
          order_status?: string | null
          payment_status?: string | null
          shipping_address?: string | null
          special_instructions?: string | null
          target_market_id?: string | null
          total_amount: number
          total_quantity_kg: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          customer_id?: string | null
          delivery_date?: string | null
          id?: string
          order_date?: string
          order_items?: Json | null
          order_number?: string
          order_status?: string | null
          payment_status?: string | null
          shipping_address?: string | null
          special_instructions?: string | null
          target_market_id?: string | null
          total_amount?: number
          total_quantity_kg?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customer_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_orders_target_market_id_fkey"
            columns: ["target_market_id"]
            isOneToOne: false
            referencedRelation: "target_markets"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          company_name: string
          contact_person: string | null
          country_id: string | null
          created_at: string | null
          credit_limit: number | null
          customer_code: string
          customer_type: string | null
          email: string | null
          id: string
          is_active: boolean | null
          metadata: Json | null
          payment_terms: string | null
          phone: string | null
          postal_code: string | null
          state: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          company_name: string
          contact_person?: string | null
          country_id?: string | null
          created_at?: string | null
          credit_limit?: number | null
          customer_code: string
          customer_type?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          company_name?: string
          contact_person?: string | null
          country_id?: string | null
          created_at?: string | null
          credit_limit?: number | null
          customer_code?: string
          customer_type?: string | null
          email?: string | null
          id?: string
          is_active?: boolean | null
          metadata?: Json | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "customers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_confirmations: {
        Row: {
          confirmed_at: string | null
          created_at: string | null
          driver_id: string
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          notes: string | null
          photo_url: string | null
          recipient_name: string | null
          recipient_phone: string | null
          shipment_id: string
          signature_url: string | null
        }
        Insert: {
          confirmed_at?: string | null
          created_at?: string | null
          driver_id: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          shipment_id: string
          signature_url?: string | null
        }
        Update: {
          confirmed_at?: string | null
          created_at?: string | null
          driver_id?: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          notes?: string | null
          photo_url?: string | null
          recipient_name?: string | null
          recipient_phone?: string | null
          shipment_id?: string
          signature_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_confirmations_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_forecasts: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          forecast_date: string
          historical_avg: number | null
          id: string
          metadata: Json | null
          model_version: string | null
          predicted_quantity_kg: number
          product_type: string
          region: string
          seasonal_factor: number | null
          trend_factor: number | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          forecast_date: string
          historical_avg?: number | null
          id?: string
          metadata?: Json | null
          model_version?: string | null
          predicted_quantity_kg: number
          product_type: string
          region: string
          seasonal_factor?: number | null
          trend_factor?: number | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          forecast_date?: string
          historical_avg?: number | null
          id?: string
          metadata?: Json | null
          model_version?: string | null
          predicted_quantity_kg?: number
          product_type?: string
          region?: string
          seasonal_factor?: number | null
          trend_factor?: number | null
        }
        Relationships: []
      }
      dispatch_compliance_checks: {
        Row: {
          batch_id: string | null
          blocking_issues: string[] | null
          checked_at: string | null
          cleared_at: string | null
          cleared_by: string | null
          compliance_status: string | null
          created_at: string | null
          dispatch_id: string | null
          id: string
          metadata: Json | null
          shipment_id: string | null
          warnings: string[] | null
        }
        Insert: {
          batch_id?: string | null
          blocking_issues?: string[] | null
          checked_at?: string | null
          cleared_at?: string | null
          cleared_by?: string | null
          compliance_status?: string | null
          created_at?: string | null
          dispatch_id?: string | null
          id?: string
          metadata?: Json | null
          shipment_id?: string | null
          warnings?: string[] | null
        }
        Update: {
          batch_id?: string | null
          blocking_issues?: string[] | null
          checked_at?: string | null
          cleared_at?: string | null
          cleared_by?: string | null
          compliance_status?: string | null
          created_at?: string | null
          dispatch_id?: string | null
          id?: string
          metadata?: Json | null
          shipment_id?: string | null
          warnings?: string[] | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_compliance_checks_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "procurement_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dispatch_compliance_checks_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      dispatch_predictions: {
        Row: {
          applied: boolean | null
          applied_at: string | null
          confidence_level: string | null
          created_at: string | null
          id: string
          optimization_score: number | null
          predicted_cost: number | null
          predicted_dispatch_time: string | null
          predicted_duration_minutes: number | null
          recommended_driver_id: string | null
          recommended_vehicle_id: string | null
          route_recommendation: Json | null
          shipment_id: string | null
          traffic_predictions: Json | null
          weather_considerations: Json | null
        }
        Insert: {
          applied?: boolean | null
          applied_at?: string | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string
          optimization_score?: number | null
          predicted_cost?: number | null
          predicted_dispatch_time?: string | null
          predicted_duration_minutes?: number | null
          recommended_driver_id?: string | null
          recommended_vehicle_id?: string | null
          route_recommendation?: Json | null
          shipment_id?: string | null
          traffic_predictions?: Json | null
          weather_considerations?: Json | null
        }
        Update: {
          applied?: boolean | null
          applied_at?: string | null
          confidence_level?: string | null
          created_at?: string | null
          id?: string
          optimization_score?: number | null
          predicted_cost?: number | null
          predicted_dispatch_time?: string | null
          predicted_duration_minutes?: number | null
          recommended_driver_id?: string | null
          recommended_vehicle_id?: string | null
          route_recommendation?: Json | null
          shipment_id?: string | null
          traffic_predictions?: Json | null
          weather_considerations?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "dispatch_predictions_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      document_templates: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          template_config: Json
          template_type: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          template_config?: Json
          template_type: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          template_config?: Json
          template_type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      document_tracking: {
        Row: {
          created_at: string | null
          document_id: string
          id: string
          qr_code: string
          scan_data: Json | null
          scan_latitude: number | null
          scan_location: string | null
          scan_longitude: number | null
          scan_timestamp: string | null
          scanned_by: string | null
        }
        Insert: {
          created_at?: string | null
          document_id: string
          id?: string
          qr_code: string
          scan_data?: Json | null
          scan_latitude?: number | null
          scan_location?: string | null
          scan_longitude?: number | null
          scan_timestamp?: string | null
          scanned_by?: string | null
        }
        Update: {
          created_at?: string | null
          document_id?: string
          id?: string
          qr_code?: string
          scan_data?: Json | null
          scan_latitude?: number | null
          scan_location?: string | null
          scan_longitude?: number | null
          scan_timestamp?: string | null
          scanned_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "document_tracking_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "generated_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_chat_messages: {
        Row: {
          content: string
          created_at: string | null
          driver_id: string
          id: string
          metadata: Json | null
          role: string
          shipment_id: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          driver_id: string
          id?: string
          metadata?: Json | null
          role: string
          shipment_id?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          driver_id?: string
          id?: string
          metadata?: Json | null
          role?: string
          shipment_id?: string | null
        }
        Relationships: []
      }
      driver_performance_scores: {
        Row: {
          areas_for_improvement: string[] | null
          avg_speed_kmh: number | null
          created_at: string | null
          customer_feedback_score: number | null
          driver_id: string
          efficiency_score: number | null
          evaluation_period_end: string
          evaluation_period_start: string
          fuel_efficiency_score: number | null
          harsh_acceleration_events: number | null
          harsh_braking_events: number | null
          id: string
          idle_time_hours: number | null
          incidents_count: number | null
          on_time_deliveries: number | null
          overall_score: number
          punctuality_score: number | null
          recommendations: string[] | null
          safety_score: number | null
          strengths: string[] | null
          total_distance_km: number | null
          total_fuel_liters: number | null
          total_trips: number | null
        }
        Insert: {
          areas_for_improvement?: string[] | null
          avg_speed_kmh?: number | null
          created_at?: string | null
          customer_feedback_score?: number | null
          driver_id: string
          efficiency_score?: number | null
          evaluation_period_end: string
          evaluation_period_start: string
          fuel_efficiency_score?: number | null
          harsh_acceleration_events?: number | null
          harsh_braking_events?: number | null
          id?: string
          idle_time_hours?: number | null
          incidents_count?: number | null
          on_time_deliveries?: number | null
          overall_score: number
          punctuality_score?: number | null
          recommendations?: string[] | null
          safety_score?: number | null
          strengths?: string[] | null
          total_distance_km?: number | null
          total_fuel_liters?: number | null
          total_trips?: number | null
        }
        Update: {
          areas_for_improvement?: string[] | null
          avg_speed_kmh?: number | null
          created_at?: string | null
          customer_feedback_score?: number | null
          driver_id?: string
          efficiency_score?: number | null
          evaluation_period_end?: string
          evaluation_period_start?: string
          fuel_efficiency_score?: number | null
          harsh_acceleration_events?: number | null
          harsh_braking_events?: number | null
          id?: string
          idle_time_hours?: number | null
          incidents_count?: number | null
          on_time_deliveries?: number | null
          overall_score?: number
          punctuality_score?: number | null
          recommendations?: string[] | null
          safety_score?: number | null
          strengths?: string[] | null
          total_distance_km?: number | null
          total_fuel_liters?: number | null
          total_trips?: number | null
        }
        Relationships: []
      }
      driver_sessions: {
        Row: {
          created_at: string | null
          current_latitude: number | null
          current_longitude: number | null
          driver_id: string
          ended_at: string | null
          id: string
          started_at: string | null
          status: string | null
          vehicle_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          driver_id: string
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          vehicle_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_latitude?: number | null
          current_longitude?: number | null
          driver_id?: string
          ended_at?: string | null
          id?: string
          started_at?: string | null
          status?: string | null
          vehicle_id?: string | null
        }
        Relationships: []
      }
      driver_wellbeing_logs: {
        Row: {
          ai_recommendations: string[] | null
          break_duration_minutes: number | null
          concerns: string | null
          created_at: string | null
          driver_id: string | null
          driving_hours: number | null
          fatigue_level: number | null
          id: string
          mood_rating: number | null
          shipment_id: string | null
          stress_level: number | null
          vehicle_id: string | null
        }
        Insert: {
          ai_recommendations?: string[] | null
          break_duration_minutes?: number | null
          concerns?: string | null
          created_at?: string | null
          driver_id?: string | null
          driving_hours?: number | null
          fatigue_level?: number | null
          id?: string
          mood_rating?: number | null
          shipment_id?: string | null
          stress_level?: number | null
          vehicle_id?: string | null
        }
        Update: {
          ai_recommendations?: string[] | null
          break_duration_minutes?: number | null
          concerns?: string | null
          created_at?: string | null
          driver_id?: string | null
          driving_hours?: number | null
          fatigue_level?: number | null
          id?: string
          mood_rating?: number | null
          shipment_id?: string | null
          stress_level?: number | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "driver_wellbeing_logs_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "driver_wellbeing_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_trip_statistics"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "driver_wellbeing_logs_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      driver_wellness_analytics: {
        Row: {
          alerts: Json | null
          analysis_period_end: string
          analysis_period_start: string
          average_daily_hours: number | null
          compliance_score: number | null
          created_at: string | null
          driver_id: string
          fatigue_score: number | null
          id: string
          incidents_count: number | null
          mood_score: number | null
          recommendations: Json | null
          stress_score: number | null
          total_break_time_minutes: number | null
          total_driving_hours: number | null
          wellness_score: number
          wellness_trends: Json | null
        }
        Insert: {
          alerts?: Json | null
          analysis_period_end: string
          analysis_period_start: string
          average_daily_hours?: number | null
          compliance_score?: number | null
          created_at?: string | null
          driver_id: string
          fatigue_score?: number | null
          id?: string
          incidents_count?: number | null
          mood_score?: number | null
          recommendations?: Json | null
          stress_score?: number | null
          total_break_time_minutes?: number | null
          total_driving_hours?: number | null
          wellness_score: number
          wellness_trends?: Json | null
        }
        Update: {
          alerts?: Json | null
          analysis_period_end?: string
          analysis_period_start?: string
          average_daily_hours?: number | null
          compliance_score?: number | null
          created_at?: string | null
          driver_id?: string
          fatigue_score?: number | null
          id?: string
          incidents_count?: number | null
          mood_score?: number | null
          recommendations?: Json | null
          stress_score?: number | null
          total_break_time_minutes?: number | null
          total_driving_hours?: number | null
          wellness_score?: number
          wellness_trends?: Json | null
        }
        Relationships: []
      }
      erp_procurement_orders: {
        Row: {
          confirmed_quantity_kg: number | null
          created_at: string | null
          delivery_date: string
          dispatch_scheduled_date: string | null
          id: string
          inventory_check_notes: string | null
          inventory_verified: boolean | null
          po_number: string
          processing_unit_id: string | null
          product_type: string
          quantity_confirmed: boolean | null
          quantity_kg: number
          rejection_reason: string | null
          source_system: string
          status: string | null
          updated_at: string | null
          validated_at: string | null
          validated_by: string | null
          validation_errors: Json | null
          validation_sla_hours: number | null
          validation_status: string | null
          warehouse_id: string | null
        }
        Insert: {
          confirmed_quantity_kg?: number | null
          created_at?: string | null
          delivery_date: string
          dispatch_scheduled_date?: string | null
          id?: string
          inventory_check_notes?: string | null
          inventory_verified?: boolean | null
          po_number: string
          processing_unit_id?: string | null
          product_type: string
          quantity_confirmed?: boolean | null
          quantity_kg: number
          rejection_reason?: string | null
          source_system: string
          status?: string | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_errors?: Json | null
          validation_sla_hours?: number | null
          validation_status?: string | null
          warehouse_id?: string | null
        }
        Update: {
          confirmed_quantity_kg?: number | null
          created_at?: string | null
          delivery_date?: string
          dispatch_scheduled_date?: string | null
          id?: string
          inventory_check_notes?: string | null
          inventory_verified?: boolean | null
          po_number?: string
          processing_unit_id?: string | null
          product_type?: string
          quantity_confirmed?: boolean | null
          quantity_kg?: number
          rejection_reason?: string | null
          source_system?: string
          status?: string | null
          updated_at?: string | null
          validated_at?: string | null
          validated_by?: string | null
          validation_errors?: Json | null
          validation_sla_hours?: number | null
          validation_status?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "erp_procurement_orders_processing_unit_id_fkey"
            columns: ["processing_unit_id"]
            isOneToOne: false
            referencedRelation: "processing_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "erp_procurement_orders_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
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
          id: string
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
      fleet_efficiency_scores: {
        Row: {
          avg_load_factor: number | null
          cost_per_km: number | null
          created_at: string | null
          downtime_hours: number | null
          evaluation_period_end: string
          evaluation_period_start: string
          fuel_efficiency: number | null
          id: string
          idle_percentage: number | null
          maintenance_alerts: string[] | null
          maintenance_score: number | null
          optimization_suggestions: string[] | null
          overall_efficiency_score: number
          performance_trend: string | null
          revenue_per_km: number | null
          total_distance_km: number | null
          total_trips: number | null
          utilization_rate: number | null
          vehicle_id: string
        }
        Insert: {
          avg_load_factor?: number | null
          cost_per_km?: number | null
          created_at?: string | null
          downtime_hours?: number | null
          evaluation_period_end: string
          evaluation_period_start: string
          fuel_efficiency?: number | null
          id?: string
          idle_percentage?: number | null
          maintenance_alerts?: string[] | null
          maintenance_score?: number | null
          optimization_suggestions?: string[] | null
          overall_efficiency_score: number
          performance_trend?: string | null
          revenue_per_km?: number | null
          total_distance_km?: number | null
          total_trips?: number | null
          utilization_rate?: number | null
          vehicle_id: string
        }
        Update: {
          avg_load_factor?: number | null
          cost_per_km?: number | null
          created_at?: string | null
          downtime_hours?: number | null
          evaluation_period_end?: string
          evaluation_period_start?: string
          fuel_efficiency?: number | null
          id?: string
          idle_percentage?: number | null
          maintenance_alerts?: string[] | null
          maintenance_score?: number | null
          optimization_suggestions?: string[] | null
          overall_efficiency_score?: number
          performance_trend?: string | null
          revenue_per_km?: number | null
          total_distance_km?: number | null
          total_trips?: number | null
          utilization_rate?: number | null
          vehicle_id?: string
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          created_at: string | null
          document_data: Json
          document_number: string
          document_type: string
          entity_id: string
          entity_type: string
          generated_by: string | null
          id: string
          metadata: Json | null
          pdf_url: string | null
          qr_code_data: string | null
          status: string | null
          template_id: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          document_data?: Json
          document_number: string
          document_type: string
          entity_id: string
          entity_type: string
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          pdf_url?: string | null
          qr_code_data?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          document_data?: Json
          document_number?: string
          document_type?: string
          entity_id?: string
          entity_type?: string
          generated_by?: string | null
          id?: string
          metadata?: Json | null
          pdf_url?: string | null
          qr_code_data?: string | null
          status?: string | null
          template_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "generated_documents_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "document_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      gps_tracking_logs: {
        Row: {
          accuracy: number | null
          altitude: number | null
          battery_level: number | null
          created_at: string | null
          driver_id: string
          heading: number | null
          id: string
          is_moving: boolean | null
          latitude: number
          longitude: number
          shipment_id: string | null
          speed: number | null
          timestamp: string | null
          vehicle_id: string | null
        }
        Insert: {
          accuracy?: number | null
          altitude?: number | null
          battery_level?: number | null
          created_at?: string | null
          driver_id: string
          heading?: number | null
          id?: string
          is_moving?: boolean | null
          latitude: number
          longitude: number
          shipment_id?: string | null
          speed?: number | null
          timestamp?: string | null
          vehicle_id?: string | null
        }
        Update: {
          accuracy?: number | null
          altitude?: number | null
          battery_level?: number | null
          created_at?: string | null
          driver_id?: string
          heading?: number | null
          id?: string
          is_moving?: boolean | null
          latitude?: number
          longitude?: number
          shipment_id?: string | null
          speed?: number | null
          timestamp?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "gps_tracking_logs_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_line_items: {
        Row: {
          batch_id: string | null
          created_at: string | null
          id: string
          invoice_id: string
          item_description: string
          line_total: number
          quantity: number
          tax_amount: number | null
          tax_rate: number | null
          unit_price: number
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          id?: string
          invoice_id: string
          item_description: string
          line_total: number
          quantity: number
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price: number
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          id?: string
          invoice_id?: string
          item_description?: string
          line_total?: number
          quantity?: number
          tax_amount?: number | null
          tax_rate?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_line_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "generated_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          batch_id: string | null
          client_id: string
          client_type: string
          created_at: string | null
          created_by: string | null
          currency: string | null
          discount_amount: number | null
          due_date: string
          id: string
          invoice_date: string
          invoice_number: string
          line_items: Json
          notes: string | null
          order_id: string | null
          payment_date: string | null
          payment_method: string | null
          payment_status: string | null
          pdf_url: string | null
          shipment_id: string | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          updated_at: string | null
        }
        Insert: {
          batch_id?: string | null
          client_id: string
          client_type: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          discount_amount?: number | null
          due_date: string
          id?: string
          invoice_date: string
          invoice_number: string
          line_items?: Json
          notes?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pdf_url?: string | null
          shipment_id?: string | null
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          updated_at?: string | null
        }
        Update: {
          batch_id?: string | null
          client_id?: string
          client_type?: string
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          discount_amount?: number | null
          due_date?: string
          id?: string
          invoice_date?: string
          invoice_number?: string
          line_items?: Json
          notes?: string | null
          order_id?: string | null
          payment_date?: string | null
          payment_method?: string | null
          payment_status?: string | null
          pdf_url?: string | null
          shipment_id?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      iot_devices: {
        Row: {
          battery_level: number | null
          created_at: string | null
          device_type: string
          firmware_version: string | null
          id: string
          last_ping: string | null
          location: string | null
          metadata: Json | null
          shipment_id: string | null
          signal_strength: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          battery_level?: number | null
          created_at?: string | null
          device_type: string
          firmware_version?: string | null
          id: string
          last_ping?: string | null
          location?: string | null
          metadata?: Json | null
          shipment_id?: string | null
          signal_strength?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          battery_level?: number | null
          created_at?: string | null
          device_type?: string
          firmware_version?: string | null
          id?: string
          last_ping?: string | null
          location?: string | null
          metadata?: Json | null
          shipment_id?: string | null
          signal_strength?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iot_devices_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      iot_events: {
        Row: {
          created_at: string | null
          device_id: string
          event_data: Json
          event_type: string
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          processed: boolean | null
          shipment_id: string | null
          temperature: number | null
          timestamp: string | null
        }
        Insert: {
          created_at?: string | null
          device_id: string
          event_data: Json
          event_type: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          processed?: boolean | null
          shipment_id?: string | null
          temperature?: number | null
          timestamp?: string | null
        }
        Update: {
          created_at?: string | null
          device_id?: string
          event_data?: Json
          event_type?: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          processed?: boolean | null
          shipment_id?: string | null
          temperature?: number | null
          timestamp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "iot_events_device_id_fkey"
            columns: ["device_id"]
            isOneToOne: false
            referencedRelation: "iot_devices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "iot_events_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_checkpoints: {
        Row: {
          actual_time: string | null
          checkpoint_name: string
          checkpoint_type: string
          created_at: string | null
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          notes: string | null
          scheduled_time: string | null
          shipment_id: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          actual_time?: string | null
          checkpoint_name: string
          checkpoint_type: string
          created_at?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          notes?: string | null
          scheduled_time?: string | null
          shipment_id: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          actual_time?: string | null
          checkpoint_name?: string
          checkpoint_type?: string
          created_at?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          notes?: string | null
          scheduled_time?: string | null
          shipment_id?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logistics_checkpoints_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_checklist_responses: {
        Row: {
          checklist_type: string
          completed_at: string | null
          compliance_status: string | null
          created_at: string | null
          driver_id: string
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          notes: string | null
          photos: Json | null
          responses: Json
          shipment_id: string | null
          signature_data: string | null
          template_id: string | null
          vehicle_id: string | null
        }
        Insert: {
          checklist_type: string
          completed_at?: string | null
          compliance_status?: string | null
          created_at?: string | null
          driver_id: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          notes?: string | null
          photos?: Json | null
          responses?: Json
          shipment_id?: string | null
          signature_data?: string | null
          template_id?: string | null
          vehicle_id?: string | null
        }
        Update: {
          checklist_type?: string
          completed_at?: string | null
          compliance_status?: string | null
          created_at?: string | null
          driver_id?: string
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          notes?: string | null
          photos?: Json | null
          responses?: Json
          shipment_id?: string | null
          signature_data?: string | null
          template_id?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mobile_checklist_responses_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mobile_checklist_responses_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "mobile_checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      mobile_checklist_templates: {
        Row: {
          checklist_type: string
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          items: Json
          name: string
          required_for_roles: string[] | null
          updated_at: string | null
        }
        Insert: {
          checklist_type: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          items?: Json
          name: string
          required_for_roles?: string[] | null
          updated_at?: string | null
        }
        Update: {
          checklist_type?: string
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          items?: Json
          name?: string
          required_for_roles?: string[] | null
          updated_at?: string | null
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
      offline_sync_queue: {
        Row: {
          created_at: string | null
          data: Json
          id: string
          operation: string
          synced: boolean | null
          synced_at: string | null
          table_name: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data: Json
          id?: string
          operation: string
          synced?: boolean | null
          synced_at?: string | null
          table_name: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json
          id?: string
          operation?: string
          synced?: boolean | null
          synced_at?: string | null
          table_name?: string
          user_id?: string
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
          phone: string
          phone_verified: boolean | null
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          biometric_data?: Json | null
          created_at?: string | null
          email: string
          email_verified?: boolean | null
          full_name: string
          id?: string
          phone: string
          phone_verified?: boolean | null
          requested_role: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          biometric_data?: Json | null
          created_at?: string | null
          email?: string
          email_verified?: boolean | null
          full_name?: string
          id?: string
          phone?: string
          phone_verified?: boolean | null
          requested_role?: Database["public"]["Enums"]["app_role"]
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      predictive_alerts: {
        Row: {
          acknowledged_at: string | null
          acknowledged_by: string | null
          alert_type: string
          confidence_score: number | null
          created_at: string | null
          data_points: Json | null
          description: string
          entity_id: string
          entity_type: string
          id: string
          predicted_impact: string | null
          recommended_actions: string[] | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          severity: string
          status: string | null
          title: string
        }
        Insert: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type: string
          confidence_score?: number | null
          created_at?: string | null
          data_points?: Json | null
          description: string
          entity_id: string
          entity_type: string
          id?: string
          predicted_impact?: string | null
          recommended_actions?: string[] | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity: string
          status?: string | null
          title: string
        }
        Update: {
          acknowledged_at?: string | null
          acknowledged_by?: string | null
          alert_type?: string
          confidence_score?: number | null
          created_at?: string | null
          data_points?: Json | null
          description?: string
          entity_id?: string
          entity_type?: string
          id?: string
          predicted_impact?: string | null
          recommended_actions?: string[] | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          severity?: string
          status?: string | null
          title?: string
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
          address: string | null
          capacity_kg_per_day: number | null
          city: string | null
          country: string | null
          created_at: string | null
          district: string | null
          id: string
          location: string | null
          name: string
          state: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          capacity_kg_per_day?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          district?: string | null
          id: string
          location?: string | null
          name: string
          state?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          capacity_kg_per_day?: number | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          district?: string | null
          id?: string
          location?: string | null
          name?: string
          state?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      procurement_batches: {
        Row: {
          created_at: string | null
          created_by: string | null
          farmer_id: string
          farmer_name: string | null
          gps_latitude: number | null
          gps_longitude: number | null
          grade: string
          id: string
          moisture_percentage: number | null
          price_per_kg: number
          procurement_date: string | null
          qr_code: string | null
          quantity_kg: number
          serialization_completed_at: string | null
          serialization_enabled: boolean | null
          serialization_started_at: string | null
          status: string | null
          total_price: number | null
          total_units_serialized: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          created_by?: string | null
          farmer_id: string
          farmer_name?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          grade: string
          id: string
          moisture_percentage?: number | null
          price_per_kg: number
          procurement_date?: string | null
          qr_code?: string | null
          quantity_kg: number
          serialization_completed_at?: string | null
          serialization_enabled?: boolean | null
          serialization_started_at?: string | null
          status?: string | null
          total_price?: number | null
          total_units_serialized?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          created_by?: string | null
          farmer_id?: string
          farmer_name?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          grade?: string
          id?: string
          moisture_percentage?: number | null
          price_per_kg?: number
          procurement_date?: string | null
          qr_code?: string | null
          quantity_kg?: number
          serialization_completed_at?: string | null
          serialization_enabled?: boolean | null
          serialization_started_at?: string | null
          status?: string | null
          total_price?: number | null
          total_units_serialized?: number | null
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
      promotional_campaigns: {
        Row: {
          budget: number | null
          campaign_code: string
          campaign_name: string
          campaign_type: string
          created_at: string | null
          created_by: string | null
          description: string | null
          discount_amount: number | null
          discount_percentage: number | null
          end_date: string
          id: string
          performance_data: Json | null
          spent_amount: number | null
          start_date: string
          status: string | null
          target_audience: string | null
          terms_conditions: string | null
          updated_at: string | null
        }
        Insert: {
          budget?: number | null
          campaign_code: string
          campaign_name: string
          campaign_type: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          end_date: string
          id?: string
          performance_data?: Json | null
          spent_amount?: number | null
          start_date: string
          status?: string | null
          target_audience?: string | null
          terms_conditions?: string | null
          updated_at?: string | null
        }
        Update: {
          budget?: number | null
          campaign_code?: string
          campaign_name?: string
          campaign_type?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          end_date?: string
          id?: string
          performance_data?: Json | null
          spent_amount?: number | null
          start_date?: string
          status?: string | null
          target_audience?: string | null
          terms_conditions?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      regulatory_reports: {
        Row: {
          created_at: string | null
          generated_by: string | null
          id: string
          region: string
          report_data: Json
          report_period_end: string
          report_period_start: string
          report_type: string
          report_url: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          generated_by?: string | null
          id?: string
          region: string
          report_data: Json
          report_period_end: string
          report_period_start: string
          report_type: string
          report_url?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          generated_by?: string | null
          id?: string
          region?: string
          report_data?: Json
          report_period_end?: string
          report_period_start?: string
          report_type?: string
          report_url?: string | null
          status?: string | null
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
      reporting_authorities: {
        Row: {
          api_key_name: string | null
          authentication_method: string | null
          authority_code: string
          authority_name: string
          authority_type: string
          country_id: string | null
          created_at: string | null
          endpoint_url: string | null
          id: string
          is_active: boolean | null
          last_report_date: string | null
          next_report_date: string | null
          report_format: string | null
          reporting_frequency: string | null
          required_fields: Json | null
          updated_at: string | null
        }
        Insert: {
          api_key_name?: string | null
          authentication_method?: string | null
          authority_code: string
          authority_name: string
          authority_type: string
          country_id?: string | null
          created_at?: string | null
          endpoint_url?: string | null
          id?: string
          is_active?: boolean | null
          last_report_date?: string | null
          next_report_date?: string | null
          report_format?: string | null
          reporting_frequency?: string | null
          required_fields?: Json | null
          updated_at?: string | null
        }
        Update: {
          api_key_name?: string | null
          authentication_method?: string | null
          authority_code?: string
          authority_name?: string
          authority_type?: string
          country_id?: string | null
          created_at?: string | null
          endpoint_url?: string | null
          id?: string
          is_active?: boolean | null
          last_report_date?: string | null
          next_report_date?: string | null
          report_format?: string | null
          reporting_frequency?: string | null
          required_fields?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reporting_authorities_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      retailer_orders: {
        Row: {
          created_at: string | null
          currency: string | null
          delivery_date: string | null
          erp_order_id: string | null
          erp_synced_at: string | null
          id: string
          order_date: string
          order_items: Json
          order_number: string
          order_status: string | null
          payment_status: string | null
          retailer_id: string
          sales_rep_id: string | null
          shipping_address: string | null
          special_instructions: string | null
          total_amount: number
          total_quantity_kg: number
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          currency?: string | null
          delivery_date?: string | null
          erp_order_id?: string | null
          erp_synced_at?: string | null
          id?: string
          order_date?: string
          order_items?: Json
          order_number: string
          order_status?: string | null
          payment_status?: string | null
          retailer_id: string
          sales_rep_id?: string | null
          shipping_address?: string | null
          special_instructions?: string | null
          total_amount: number
          total_quantity_kg: number
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          currency?: string | null
          delivery_date?: string | null
          erp_order_id?: string | null
          erp_synced_at?: string | null
          id?: string
          order_date?: string
          order_items?: Json
          order_number?: string
          order_status?: string | null
          payment_status?: string | null
          retailer_id?: string
          sales_rep_id?: string | null
          shipping_address?: string | null
          special_instructions?: string | null
          total_amount?: number
          total_quantity_kg?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retailer_orders_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retailer_orders_sales_rep_id_fkey"
            columns: ["sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_representatives"
            referencedColumns: ["id"]
          },
        ]
      }
      retailers: {
        Row: {
          address: string | null
          approved_at: string | null
          approved_by: string | null
          assigned_sales_rep_id: string | null
          business_name: string
          business_type: string | null
          city: string | null
          contact_person: string
          country_id: string | null
          created_at: string | null
          credit_limit: number | null
          email: string
          id: string
          is_active: boolean | null
          license_number: string | null
          metadata: Json | null
          onboarding_date: string | null
          onboarding_status: string | null
          payment_terms: string | null
          phone: string | null
          postal_code: string | null
          retailer_code: string
          state: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_sales_rep_id?: string | null
          business_name: string
          business_type?: string | null
          city?: string | null
          contact_person: string
          country_id?: string | null
          created_at?: string | null
          credit_limit?: number | null
          email: string
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          metadata?: Json | null
          onboarding_date?: string | null
          onboarding_status?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          retailer_code: string
          state?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          approved_at?: string | null
          approved_by?: string | null
          assigned_sales_rep_id?: string | null
          business_name?: string
          business_type?: string | null
          city?: string | null
          contact_person?: string
          country_id?: string | null
          created_at?: string | null
          credit_limit?: number | null
          email?: string
          id?: string
          is_active?: boolean | null
          license_number?: string | null
          metadata?: Json | null
          onboarding_date?: string | null
          onboarding_status?: string | null
          payment_terms?: string | null
          phone?: string | null
          postal_code?: string | null
          retailer_code?: string
          state?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retailers_assigned_sales_rep_id_fkey"
            columns: ["assigned_sales_rep_id"]
            isOneToOne: false
            referencedRelation: "sales_representatives"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retailers_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      rework_actions: {
        Row: {
          after_metadata: Json | null
          approved_by: string | null
          before_metadata: Json | null
          created_at: string | null
          id: string
          new_parent_serial: string | null
          new_status: string | null
          notes: string | null
          original_parent_serial: string | null
          original_status: string | null
          performed_by: string | null
          reason: string
          rework_date: string | null
          rework_type: string
          serial_number: string
        }
        Insert: {
          after_metadata?: Json | null
          approved_by?: string | null
          before_metadata?: Json | null
          created_at?: string | null
          id?: string
          new_parent_serial?: string | null
          new_status?: string | null
          notes?: string | null
          original_parent_serial?: string | null
          original_status?: string | null
          performed_by?: string | null
          reason: string
          rework_date?: string | null
          rework_type: string
          serial_number: string
        }
        Update: {
          after_metadata?: Json | null
          approved_by?: string | null
          before_metadata?: Json | null
          created_at?: string | null
          id?: string
          new_parent_serial?: string | null
          new_status?: string | null
          notes?: string | null
          original_parent_serial?: string | null
          original_status?: string | null
          performed_by?: string | null
          reason?: string
          rework_date?: string | null
          rework_type?: string
          serial_number?: string
        }
        Relationships: []
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
      route_performance_analytics: {
        Row: {
          analysis_period_end: string
          analysis_period_start: string
          avg_cost: number | null
          avg_delay_minutes: number | null
          avg_duration_minutes: number | null
          avg_fuel_consumption: number | null
          created_at: string | null
          from_location: string
          id: string
          is_underperforming: boolean | null
          on_time_percentage: number | null
          optimization_opportunities: string[] | null
          performance_score: number | null
          route_id: string
          to_location: string
          total_trips: number | null
          traffic_pattern: Json | null
          weather_impact: Json | null
        }
        Insert: {
          analysis_period_end: string
          analysis_period_start: string
          avg_cost?: number | null
          avg_delay_minutes?: number | null
          avg_duration_minutes?: number | null
          avg_fuel_consumption?: number | null
          created_at?: string | null
          from_location: string
          id?: string
          is_underperforming?: boolean | null
          on_time_percentage?: number | null
          optimization_opportunities?: string[] | null
          performance_score?: number | null
          route_id: string
          to_location: string
          total_trips?: number | null
          traffic_pattern?: Json | null
          weather_impact?: Json | null
        }
        Update: {
          analysis_period_end?: string
          analysis_period_start?: string
          avg_cost?: number | null
          avg_delay_minutes?: number | null
          avg_duration_minutes?: number | null
          avg_fuel_consumption?: number | null
          created_at?: string | null
          from_location?: string
          id?: string
          is_underperforming?: boolean | null
          on_time_percentage?: number | null
          optimization_opportunities?: string[] | null
          performance_score?: number | null
          route_id?: string
          to_location?: string
          total_trips?: number | null
          traffic_pattern?: Json | null
          weather_impact?: Json | null
        }
        Relationships: []
      }
      sales_representatives: {
        Row: {
          created_at: string | null
          email: string
          employee_id: string
          full_name: string
          hired_date: string
          id: string
          is_active: boolean | null
          performance_metrics: Json | null
          phone: string | null
          region: string | null
          territory: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          employee_id: string
          full_name: string
          hired_date?: string
          id?: string
          is_active?: boolean | null
          performance_metrics?: Json | null
          phone?: string | null
          region?: string | null
          territory?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          employee_id?: string
          full_name?: string
          hired_date?: string
          id?: string
          is_active?: boolean | null
          performance_metrics?: Json | null
          phone?: string | null
          region?: string | null
          territory?: string | null
          updated_at?: string | null
          user_id?: string
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
      serial_movements: {
        Row: {
          created_at: string | null
          from_location: string | null
          from_location_type: string | null
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          metadata: Json | null
          movement_type: string
          notes: string | null
          serial_number: string
          shipment_id: string | null
          timestamp: string | null
          to_location: string | null
          to_location_type: string | null
          user_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string | null
          from_location?: string | null
          from_location_type?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          metadata?: Json | null
          movement_type: string
          notes?: string | null
          serial_number: string
          shipment_id?: string | null
          timestamp?: string | null
          to_location?: string | null
          to_location_type?: string | null
          user_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string | null
          from_location?: string | null
          from_location_type?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          metadata?: Json | null
          movement_type?: string
          notes?: string | null
          serial_number?: string
          shipment_id?: string | null
          timestamp?: string | null
          to_location?: string | null
          to_location_type?: string | null
          user_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "serial_movements_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serial_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      serialized_units: {
        Row: {
          batch_id: string | null
          created_at: string | null
          current_location: string | null
          current_location_type: string | null
          current_shipment_id: string | null
          current_warehouse_id: string | null
          eu_tpd_id: string | null
          expiry_date: string | null
          gcc_traceability_id: string | null
          id: string
          manufacturing_date: string | null
          metadata: Json | null
          parent_serial: string | null
          product_code: string
          serial_number: string
          status: string | null
          unit_type: string
          updated_at: string | null
        }
        Insert: {
          batch_id?: string | null
          created_at?: string | null
          current_location?: string | null
          current_location_type?: string | null
          current_shipment_id?: string | null
          current_warehouse_id?: string | null
          eu_tpd_id?: string | null
          expiry_date?: string | null
          gcc_traceability_id?: string | null
          id?: string
          manufacturing_date?: string | null
          metadata?: Json | null
          parent_serial?: string | null
          product_code: string
          serial_number: string
          status?: string | null
          unit_type: string
          updated_at?: string | null
        }
        Update: {
          batch_id?: string | null
          created_at?: string | null
          current_location?: string | null
          current_location_type?: string | null
          current_shipment_id?: string | null
          current_warehouse_id?: string | null
          eu_tpd_id?: string | null
          expiry_date?: string | null
          gcc_traceability_id?: string | null
          id?: string
          manufacturing_date?: string | null
          metadata?: Json | null
          parent_serial?: string | null
          product_code?: string
          serial_number?: string
          status?: string | null
          unit_type?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "serialized_units_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "procurement_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_units_current_shipment_id_fkey"
            columns: ["current_shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "serialized_units_current_warehouse_id_fkey"
            columns: ["current_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          actual_arrival: string | null
          actual_route: Json | null
          ai_anomaly_details: Json | null
          ai_anomaly_detected: boolean | null
          ai_anomaly_severity: string | null
          ai_eta_confidence: number | null
          ai_predicted_eta: string | null
          batch_id: string
          checkpoint_status: Json | null
          created_at: string | null
          delivery_confirmation: Json | null
          departure_time: string | null
          driver_name: string | null
          estimated_delay_minutes: number | null
          eta: string | null
          from_location: string
          from_warehouse_id: string | null
          gps_latitude: number | null
          gps_longitude: number | null
          id: string
          planned_route: Json | null
          predictive_maintenance_alert: Json | null
          route: Json | null
          route_optimization_data: Json | null
          serialization_verified: boolean | null
          serialization_verified_at: string | null
          serialization_verified_by: string | null
          serialized_units: string[] | null
          status: string | null
          temperature_max: number | null
          temperature_min: number | null
          to_location: string
          to_processing_unit_id: string | null
          to_warehouse_id: string | null
          traffic_conditions: string | null
          updated_at: string | null
          vehicle_id: string | null
          weather_conditions: string | null
        }
        Insert: {
          actual_arrival?: string | null
          actual_route?: Json | null
          ai_anomaly_details?: Json | null
          ai_anomaly_detected?: boolean | null
          ai_anomaly_severity?: string | null
          ai_eta_confidence?: number | null
          ai_predicted_eta?: string | null
          batch_id: string
          checkpoint_status?: Json | null
          created_at?: string | null
          delivery_confirmation?: Json | null
          departure_time?: string | null
          driver_name?: string | null
          estimated_delay_minutes?: number | null
          eta?: string | null
          from_location: string
          from_warehouse_id?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id: string
          planned_route?: Json | null
          predictive_maintenance_alert?: Json | null
          route?: Json | null
          route_optimization_data?: Json | null
          serialization_verified?: boolean | null
          serialization_verified_at?: string | null
          serialization_verified_by?: string | null
          serialized_units?: string[] | null
          status?: string | null
          temperature_max?: number | null
          temperature_min?: number | null
          to_location: string
          to_processing_unit_id?: string | null
          to_warehouse_id?: string | null
          traffic_conditions?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          weather_conditions?: string | null
        }
        Update: {
          actual_arrival?: string | null
          actual_route?: Json | null
          ai_anomaly_details?: Json | null
          ai_anomaly_detected?: boolean | null
          ai_anomaly_severity?: string | null
          ai_eta_confidence?: number | null
          ai_predicted_eta?: string | null
          batch_id?: string
          checkpoint_status?: Json | null
          created_at?: string | null
          delivery_confirmation?: Json | null
          departure_time?: string | null
          driver_name?: string | null
          estimated_delay_minutes?: number | null
          eta?: string | null
          from_location?: string
          from_warehouse_id?: string | null
          gps_latitude?: number | null
          gps_longitude?: number | null
          id?: string
          planned_route?: Json | null
          predictive_maintenance_alert?: Json | null
          route?: Json | null
          route_optimization_data?: Json | null
          serialization_verified?: boolean | null
          serialization_verified_at?: string | null
          serialization_verified_by?: string | null
          serialized_units?: string[] | null
          status?: string | null
          temperature_max?: number | null
          temperature_min?: number | null
          to_location?: string
          to_processing_unit_id?: string | null
          to_warehouse_id?: string | null
          traffic_conditions?: string | null
          updated_at?: string | null
          vehicle_id?: string | null
          weather_conditions?: string | null
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
          {
            foreignKeyName: "shipments_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_to_processing_unit_id_fkey"
            columns: ["to_processing_unit_id"]
            isOneToOne: false
            referencedRelation: "processing_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      target_markets: {
        Row: {
          compliance_requirements: Json | null
          country_id: string | null
          created_at: string | null
          current_volume_kg: number | null
          distribution_channels: Json | null
          id: string
          is_active: boolean | null
          market_name: string
          market_segment: string | null
          market_share_percentage: number | null
          pricing_strategy: string | null
          primary_products: Json | null
          target_volume_kg: number | null
          updated_at: string | null
        }
        Insert: {
          compliance_requirements?: Json | null
          country_id?: string | null
          created_at?: string | null
          current_volume_kg?: number | null
          distribution_channels?: Json | null
          id?: string
          is_active?: boolean | null
          market_name: string
          market_segment?: string | null
          market_share_percentage?: number | null
          pricing_strategy?: string | null
          primary_products?: Json | null
          target_volume_kg?: number | null
          updated_at?: string | null
        }
        Update: {
          compliance_requirements?: Json | null
          country_id?: string | null
          created_at?: string | null
          current_volume_kg?: number | null
          distribution_channels?: Json | null
          id?: string
          is_active?: boolean | null
          market_name?: string
          market_segment?: string | null
          market_share_percentage?: number | null
          pricing_strategy?: string | null
          primary_products?: Json | null
          target_volume_kg?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "target_markets_country_id_fkey"
            columns: ["country_id"]
            isOneToOne: false
            referencedRelation: "countries"
            referencedColumns: ["id"]
          },
        ]
      }
      translation_keys: {
        Row: {
          category: string | null
          created_at: string | null
          en: string
          hi: string | null
          id: string
          key_name: string
          kn: string | null
          ta: string | null
          te: string | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          en: string
          hi?: string | null
          id?: string
          key_name: string
          kn?: string | null
          ta?: string | null
          te?: string | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          created_at?: string | null
          en?: string
          hi?: string | null
          id?: string
          key_name?: string
          kn?: string | null
          ta?: string | null
          te?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      translations: {
        Row: {
          created_at: string | null
          id: string
          key: string
          language: string
          module: string
          updated_at: string | null
          value: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          key: string
          language: string
          module: string
          updated_at?: string | null
          value: string
        }
        Update: {
          created_at?: string | null
          id?: string
          key?: string
          language?: string
          module?: string
          updated_at?: string | null
          value?: string
        }
        Relationships: []
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
      vehicle_maintenance: {
        Row: {
          actual_date: string | null
          ai_confidence: number | null
          created_at: string | null
          description: string | null
          id: string
          maintenance_type: string
          predicted_date: string | null
          severity: string | null
          status: string | null
          updated_at: string | null
          vehicle_id: string
        }
        Insert: {
          actual_date?: string | null
          ai_confidence?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          maintenance_type: string
          predicted_date?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id: string
        }
        Update: {
          actual_date?: string | null
          ai_confidence?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          maintenance_type?: string
          predicted_date?: string | null
          severity?: string | null
          status?: string | null
          updated_at?: string | null
          vehicle_id?: string
        }
        Relationships: []
      }
      vehicle_tracking_history: {
        Row: {
          acceleration: number | null
          ai_insights: Json | null
          braking_force: number | null
          driver_status: string | null
          engine_rpm: number | null
          fuel_level: number | null
          heading: number | null
          id: string
          is_idle: boolean | null
          latitude: number
          location_name: string | null
          longitude: number
          recorded_at: string | null
          shipment_id: string | null
          speed_kmh: number | null
          temperature: number | null
          vehicle_id: string | null
        }
        Insert: {
          acceleration?: number | null
          ai_insights?: Json | null
          braking_force?: number | null
          driver_status?: string | null
          engine_rpm?: number | null
          fuel_level?: number | null
          heading?: number | null
          id?: string
          is_idle?: boolean | null
          latitude: number
          location_name?: string | null
          longitude: number
          recorded_at?: string | null
          shipment_id?: string | null
          speed_kmh?: number | null
          temperature?: number | null
          vehicle_id?: string | null
        }
        Update: {
          acceleration?: number | null
          ai_insights?: Json | null
          braking_force?: number | null
          driver_status?: string | null
          engine_rpm?: number | null
          fuel_level?: number | null
          heading?: number | null
          id?: string
          is_idle?: boolean | null
          latitude?: number
          location_name?: string | null
          longitude?: number
          recorded_at?: string | null
          shipment_id?: string | null
          speed_kmh?: number | null
          temperature?: number | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_tracking_history_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_tracking_history_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicle_trip_statistics"
            referencedColumns: ["vehicle_id"]
          },
          {
            foreignKeyName: "vehicle_tracking_history_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          average_speed_kmh: number | null
          battery_level: number | null
          capacity_kg: number | null
          created_at: string | null
          current_latitude: number | null
          current_location: string | null
          current_longitude: number | null
          driver_id: string | null
          driver_name: string | null
          driver_performance_score: number | null
          driver_phone: string | null
          fuel_level: number | null
          harsh_acceleration_incidents: number | null
          harsh_braking_incidents: number | null
          health_score: number | null
          id: string
          idle_time_minutes: number | null
          last_service_date: string | null
          make: string | null
          model: string | null
          next_service_due: string | null
          notes: string | null
          on_time_deliveries: number | null
          registration_number: string
          status: string | null
          total_distance_km: number | null
          total_trips: number | null
          updated_at: string | null
          vehicle_type: string
          year: number | null
        }
        Insert: {
          average_speed_kmh?: number | null
          battery_level?: number | null
          capacity_kg?: number | null
          created_at?: string | null
          current_latitude?: number | null
          current_location?: string | null
          current_longitude?: number | null
          driver_id?: string | null
          driver_name?: string | null
          driver_performance_score?: number | null
          driver_phone?: string | null
          fuel_level?: number | null
          harsh_acceleration_incidents?: number | null
          harsh_braking_incidents?: number | null
          health_score?: number | null
          id: string
          idle_time_minutes?: number | null
          last_service_date?: string | null
          make?: string | null
          model?: string | null
          next_service_due?: string | null
          notes?: string | null
          on_time_deliveries?: number | null
          registration_number: string
          status?: string | null
          total_distance_km?: number | null
          total_trips?: number | null
          updated_at?: string | null
          vehicle_type: string
          year?: number | null
        }
        Update: {
          average_speed_kmh?: number | null
          battery_level?: number | null
          capacity_kg?: number | null
          created_at?: string | null
          current_latitude?: number | null
          current_location?: string | null
          current_longitude?: number | null
          driver_id?: string | null
          driver_name?: string | null
          driver_performance_score?: number | null
          driver_phone?: string | null
          fuel_level?: number | null
          harsh_acceleration_incidents?: number | null
          harsh_braking_incidents?: number | null
          health_score?: number | null
          id?: string
          idle_time_minutes?: number | null
          last_service_date?: string | null
          make?: string | null
          model?: string | null
          next_service_due?: string | null
          notes?: string | null
          on_time_deliveries?: number | null
          registration_number?: string
          status?: string | null
          total_distance_km?: number | null
          total_trips?: number | null
          updated_at?: string | null
          vehicle_type?: string
          year?: number | null
        }
        Relationships: []
      }
      warehouse_dispatch_schedule: {
        Row: {
          actual_dispatch_date: string | null
          batch_id: string | null
          created_at: string | null
          created_by: string | null
          dispatch_notes: string | null
          dispatch_status: string | null
          driver_name: string | null
          erp_order_id: string
          id: string
          scheduled_dispatch_date: string
          updated_at: string | null
          vehicle_id: string | null
          warehouse_id: string
        }
        Insert: {
          actual_dispatch_date?: string | null
          batch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          dispatch_notes?: string | null
          dispatch_status?: string | null
          driver_name?: string | null
          erp_order_id: string
          id?: string
          scheduled_dispatch_date: string
          updated_at?: string | null
          vehicle_id?: string | null
          warehouse_id: string
        }
        Update: {
          actual_dispatch_date?: string | null
          batch_id?: string | null
          created_at?: string | null
          created_by?: string | null
          dispatch_notes?: string | null
          dispatch_status?: string | null
          driver_name?: string | null
          erp_order_id?: string
          id?: string
          scheduled_dispatch_date?: string
          updated_at?: string | null
          vehicle_id?: string | null
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_dispatch_schedule_batch_id_fkey"
            columns: ["batch_id"]
            isOneToOne: false
            referencedRelation: "procurement_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_dispatch_schedule_erp_order_id_fkey"
            columns: ["erp_order_id"]
            isOneToOne: false
            referencedRelation: "erp_procurement_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_dispatch_schedule_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
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
      warehouse_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string
          notification_type: string
          order_id: string | null
          warehouse_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message: string
          notification_type: string
          order_id?: string | null
          warehouse_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string
          notification_type?: string
          order_id?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_notifications_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "erp_procurement_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_notifications_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string | null
          current_stock_kg: number | null
          district: string | null
          humidity: number | null
          id: string
          location: string
          max_capacity_kg: number
          name: string
          state: string | null
          status: string | null
          temperature: number | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          current_stock_kg?: number | null
          district?: string | null
          humidity?: number | null
          id: string
          location: string
          max_capacity_kg: number
          name: string
          state?: string | null
          status?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          current_stock_kg?: number | null
          district?: string | null
          humidity?: number | null
          id?: string
          location?: string
          max_capacity_kg?: number
          name?: string
          state?: string | null
          status?: string | null
          temperature?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      wholesaler_erp_sync_logs: {
        Row: {
          created_at: string | null
          direction: string
          entity_ids: string[]
          entity_type: string
          error_message: string | null
          id: string
          initiated_by: string | null
          records_failed: number | null
          records_processed: number | null
          request_payload: Json | null
          response_payload: Json | null
          status: string | null
          sync_completed_at: string | null
          sync_started_at: string | null
          sync_type: string
        }
        Insert: {
          created_at?: string | null
          direction: string
          entity_ids: string[]
          entity_type: string
          error_message?: string | null
          id?: string
          initiated_by?: string | null
          records_failed?: number | null
          records_processed?: number | null
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string | null
          sync_completed_at?: string | null
          sync_started_at?: string | null
          sync_type: string
        }
        Update: {
          created_at?: string | null
          direction?: string
          entity_ids?: string[]
          entity_type?: string
          error_message?: string | null
          id?: string
          initiated_by?: string | null
          records_failed?: number | null
          records_processed?: number | null
          request_payload?: Json | null
          response_payload?: Json | null
          status?: string | null
          sync_completed_at?: string | null
          sync_started_at?: string | null
          sync_type?: string
        }
        Relationships: []
      }
    }
    Views: {
      vehicle_trip_statistics: {
        Row: {
          avg_speed: number | null
          avg_trip_duration_hours: number | null
          idle_count: number | null
          max_speed: number | null
          on_time_trips: number | null
          registration_number: string | null
          total_trips: number | null
          vehicle_id: string | null
        }
        Relationships: []
      }
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
      refresh_vehicle_statistics: { Args: never; Returns: undefined }
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
