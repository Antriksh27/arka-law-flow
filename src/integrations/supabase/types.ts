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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      appointment_rate_limits: {
        Row: {
          created_at: string | null
          id: string
          ip_address: unknown
          request_count: number | null
          user_id: string | null
          window_start: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          request_count?: number | null
          user_id?: string | null
          window_start?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          ip_address?: unknown
          request_count?: number | null
          user_id?: string | null
          window_start?: string | null
        }
        Relationships: []
      }
      appointments: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          case_id: string | null
          client_id: string | null
          created_at: string | null
          created_by: string | null
          created_by_user_id: string | null
          document_url: string | null
          duration_minutes: number
          end_time: string | null
          firm_id: string | null
          id: string
          is_visible_to_team: boolean | null
          lawyer_id: string | null
          location: string | null
          notes: string | null
          reminder_minutes: number | null
          start_time: string | null
          status: string | null
          title: string | null
          type: Database["public"]["Enums"]["appointment_type"]
          updated_at: string | null
        }
        Insert: {
          appointment_date?: string | null
          appointment_time?: string | null
          case_id?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_user_id?: string | null
          document_url?: string | null
          duration_minutes?: number
          end_time?: string | null
          firm_id?: string | null
          id?: string
          is_visible_to_team?: boolean | null
          lawyer_id?: string | null
          location?: string | null
          notes?: string | null
          reminder_minutes?: number | null
          start_time?: string | null
          status?: string | null
          title?: string | null
          type: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string | null
        }
        Update: {
          appointment_date?: string | null
          appointment_time?: string | null
          case_id?: string | null
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          created_by_user_id?: string | null
          document_url?: string | null
          duration_minutes?: number
          end_time?: string | null
          firm_id?: string | null
          id?: string
          is_visible_to_team?: boolean | null
          lawyer_id?: string | null
          location?: string | null
          notes?: string | null
          reminder_minutes?: number | null
          start_time?: string | null
          status?: string | null
          title?: string | null
          type?: Database["public"]["Enums"]["appointment_type"]
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["firm_id"]
          },
          {
            foreignKeyName: "appointments_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_logs: {
        Row: {
          action: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          timestamp: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          timestamp?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "audit_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_refresh_logs: {
        Row: {
          cases_failed: number
          cases_processed: number
          cases_skipped: number
          cases_succeeded: number
          created_at: string
          error_details: Json | null
          execution_date: string
          execution_duration_ms: number | null
          execution_time: string
          id: string
          success_details: Json | null
          total_hearings: number
        }
        Insert: {
          cases_failed?: number
          cases_processed?: number
          cases_skipped?: number
          cases_succeeded?: number
          created_at?: string
          error_details?: Json | null
          execution_date: string
          execution_duration_ms?: number | null
          execution_time?: string
          id?: string
          success_details?: Json | null
          total_hearings?: number
        }
        Update: {
          cases_failed?: number
          cases_processed?: number
          cases_skipped?: number
          cases_succeeded?: number
          created_at?: string
          error_details?: Json | null
          execution_date?: string
          execution_duration_ms?: number | null
          execution_time?: string
          id?: string
          success_details?: Json | null
          total_hearings?: number
        }
        Relationships: []
      }
      availability_exceptions: {
        Row: {
          created_at: string
          date: string
          id: string
          is_blocked: boolean
          reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          id?: string
          is_blocked?: boolean
          reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date?: string
          id?: string
          is_blocked?: boolean
          reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      availability_rules: {
        Row: {
          appointment_duration: number
          buffer_time: number
          created_at: string
          day_of_week: number
          end_time: string
          id: string
          is_active: boolean
          max_appointments_per_day: number | null
          start_time: string
          updated_at: string
          user_id: string
        }
        Insert: {
          appointment_duration?: number
          buffer_time?: number
          created_at?: string
          day_of_week: number
          end_time: string
          id?: string
          is_active?: boolean
          max_appointments_per_day?: number | null
          start_time: string
          updated_at?: string
          user_id: string
        }
        Update: {
          appointment_duration?: number
          buffer_time?: number
          created_at?: string
          day_of_week?: number
          end_time?: string
          id?: string
          is_active?: boolean
          max_appointments_per_day?: number | null
          start_time?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      calendar_events: {
        Row: {
          created_at: string | null
          end_time: string | null
          event_type: string | null
          id: string
          ref_id: string | null
          start_time: string
          title: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          ref_id?: string | null
          start_time: string
          title: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          end_time?: string | null
          event_type?: string | null
          id?: string
          ref_id?: string | null
          start_time?: string
          title?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "calendar_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_activities: {
        Row: {
          activity_type: string
          case_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          activity_type: string
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          activity_type?: string
          case_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "case_activities_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "case_activities_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_assignments: {
        Row: {
          assigned_at: string
          assigned_by: string | null
          case_id: string
          id: string
          team_member_id: string
        }
        Insert: {
          assigned_at?: string
          assigned_by?: string | null
          case_id: string
          id?: string
          team_member_id: string
        }
        Update: {
          assigned_at?: string
          assigned_by?: string | null
          case_id?: string
          id?: string
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_assignments_assigned_by_fkey"
            columns: ["assigned_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_assignments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_assignments_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      case_contacts: {
        Row: {
          case_id: string
          created_at: string
          created_by: string | null
          email: string | null
          id: string
          is_main: boolean | null
          name: string
          notes: string | null
          phone: string | null
          role: string | null
        }
        Insert: {
          case_id: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_main?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          role?: string | null
        }
        Update: {
          case_id?: string
          created_at?: string
          created_by?: string | null
          email?: string | null
          id?: string
          is_main?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          role?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_contacts_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_documents: {
        Row: {
          advocate: string | null
          case_id: string
          created_at: string | null
          date_of_receiving: string | null
          document_filed: string | null
          document_no: string | null
          document_type: string | null
          document_url: string | null
          filed_by: string | null
          id: string
          pdf_base64: string | null
          sr_no: string | null
          updated_at: string | null
        }
        Insert: {
          advocate?: string | null
          case_id: string
          created_at?: string | null
          date_of_receiving?: string | null
          document_filed?: string | null
          document_no?: string | null
          document_type?: string | null
          document_url?: string | null
          filed_by?: string | null
          id?: string
          pdf_base64?: string | null
          sr_no?: string | null
          updated_at?: string | null
        }
        Update: {
          advocate?: string | null
          case_id?: string
          created_at?: string | null
          date_of_receiving?: string | null
          document_filed?: string | null
          document_no?: string | null
          document_type?: string | null
          document_url?: string | null
          filed_by?: string | null
          id?: string
          pdf_base64?: string | null
          sr_no?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_emails: {
        Row: {
          attachments: Json | null
          case_id: string | null
          content: string | null
          created_by: string | null
          id: string
          recipients: string[] | null
          sender: string
          sent_at: string
          subject: string
        }
        Insert: {
          attachments?: Json | null
          case_id?: string | null
          content?: string | null
          created_by?: string | null
          id?: string
          recipients?: string[] | null
          sender: string
          sent_at?: string
          subject: string
        }
        Update: {
          attachments?: Json | null
          case_id?: string | null
          content?: string | null
          created_by?: string | null
          id?: string
          recipients?: string[] | null
          sender?: string
          sent_at?: string
          subject?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_emails_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_emails_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "case_emails_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_fetch_queue: {
        Row: {
          batch_id: string | null
          case_id: string
          cnr_number: string
          completed_at: string | null
          court_type: string
          created_at: string
          created_by: string
          firm_id: string
          id: string
          last_error: string | null
          last_error_at: string | null
          max_retries: number
          metadata: Json | null
          next_retry_at: string | null
          priority: number
          queued_at: string
          retry_count: number
          started_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          batch_id?: string | null
          case_id: string
          cnr_number: string
          completed_at?: string | null
          court_type: string
          created_at?: string
          created_by: string
          firm_id: string
          id?: string
          last_error?: string | null
          last_error_at?: string | null
          max_retries?: number
          metadata?: Json | null
          next_retry_at?: string | null
          priority?: number
          queued_at?: string
          retry_count?: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          batch_id?: string | null
          case_id?: string
          cnr_number?: string
          completed_at?: string | null
          court_type?: string
          created_at?: string
          created_by?: string
          firm_id?: string
          id?: string
          last_error?: string | null
          last_error_at?: string | null
          max_retries?: number
          metadata?: Json | null
          next_retry_at?: string | null
          priority?: number
          queued_at?: string
          retry_count?: number
          started_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_fetch_queue_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_files: {
        Row: {
          case_id: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          id: string
          uploaded_at: string
          uploaded_by: string | null
        }
        Insert: {
          case_id?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Update: {
          case_id?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          uploaded_at?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_files_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "case_files_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_hearings: {
        Row: {
          business_on_date: string | null
          case_id: string
          cause_list_type: string | null
          created_at: string | null
          hearing_date: string | null
          hearing_time: string | null
          id: string
          judge: string | null
          purpose_of_hearing: string | null
          updated_at: string | null
        }
        Insert: {
          business_on_date?: string | null
          case_id: string
          cause_list_type?: string | null
          created_at?: string | null
          hearing_date?: string | null
          hearing_time?: string | null
          id?: string
          judge?: string | null
          purpose_of_hearing?: string | null
          updated_at?: string | null
        }
        Update: {
          business_on_date?: string | null
          case_id?: string
          cause_list_type?: string | null
          created_at?: string | null
          hearing_date?: string | null
          hearing_time?: string | null
          id?: string
          judge?: string | null
          purpose_of_hearing?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_hearings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_internal_notes: {
        Row: {
          case_id: string
          created_at: string
          created_by: string
          id: string
          note: string
          shared_with_staff: boolean | null
          updated_at: string
        }
        Insert: {
          case_id: string
          created_at?: string
          created_by: string
          id?: string
          note: string
          shared_with_staff?: boolean | null
          updated_at?: string
        }
        Update: {
          case_id?: string
          created_at?: string
          created_by?: string
          id?: string
          note?: string
          shared_with_staff?: boolean | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_internal_notes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_notes: {
        Row: {
          case_id: string | null
          content: string
          created_at: string
          created_by: string | null
          id: string
        }
        Insert: {
          case_id?: string | null
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Update: {
          case_id?: string | null
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_notes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "case_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      case_objections: {
        Row: {
          case_id: string
          compliance_date: string | null
          created_at: string | null
          id: string
          objection: string | null
          objection_compliance_date: string | null
          receipt_date: string | null
          scrutiny_date: string | null
          sr_no: string | null
          updated_at: string | null
        }
        Insert: {
          case_id: string
          compliance_date?: string | null
          created_at?: string | null
          id?: string
          objection?: string | null
          objection_compliance_date?: string | null
          receipt_date?: string | null
          scrutiny_date?: string | null
          sr_no?: string | null
          updated_at?: string | null
        }
        Update: {
          case_id?: string
          compliance_date?: string | null
          created_at?: string | null
          id?: string
          objection?: string | null
          objection_compliance_date?: string | null
          receipt_date?: string | null
          scrutiny_date?: string | null
          sr_no?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_objections_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_orders: {
        Row: {
          bench: string | null
          case_id: string
          created_at: string | null
          hearing_date: string | null
          id: string
          judge: string | null
          order_date: string | null
          order_details: string | null
          order_link: string | null
          order_number: string | null
          pdf_base64: string | null
          summary: string | null
          updated_at: string | null
        }
        Insert: {
          bench?: string | null
          case_id: string
          created_at?: string | null
          hearing_date?: string | null
          id?: string
          judge?: string | null
          order_date?: string | null
          order_details?: string | null
          order_link?: string | null
          order_number?: string | null
          pdf_base64?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Update: {
          bench?: string | null
          case_id?: string
          created_at?: string | null
          hearing_date?: string | null
          id?: string
          judge?: string | null
          order_date?: string | null
          order_details?: string | null
          order_link?: string | null
          order_number?: string | null
          pdf_base64?: string | null
          summary?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "case_orders_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      case_relations: {
        Row: {
          case_id: string
          created_at: string
          created_by: string | null
          id: string
          related_case_id: string
        }
        Insert: {
          case_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          related_case_id: string
        }
        Update: {
          case_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          related_case_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "case_relations_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "case_relations_related_case_id_fkey"
            columns: ["related_case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          acts: string[] | null
          advocate_name: string | null
          assigned_to: string | null
          assigned_users: string[] | null
          bench_type: string | null
          business_type: string | null
          by_against: Database["public"]["Enums"]["case_by_against_enum"] | null
          case_classification: string | null
          case_number: string | null
          case_sub_type: string | null
          case_summary: string | null
          case_title: string
          case_type: Database["public"]["Enums"]["case_type_enum"] | null
          category: string | null
          cause_list_type: string | null
          client_id: string | null
          closing_date: string | null
          cnr_auto_fetch_enabled: boolean | null
          cnr_number: string | null
          complaint_date: string | null
          connected_cases: string[] | null
          coram: string | null
          court: string | null
          court_complex: string | null
          court_name: string | null
          court_type: string | null
          created_at: string
          created_by: string | null
          decision_date: string | null
          description: string | null
          disposal_date: string | null
          district: string | null
          district_1: string | null
          docket_number: string | null
          document_history: Json | null
          document_links: string[] | null
          fetch_message: string | null
          fetch_status: string | null
          fetched_data: Json | null
          filing_date: string | null
          filing_number: string | null
          filing_party: string | null
          final_orders: string[] | null
          fir_number: string | null
          firm_id: string | null
          first_hearing_date: string | null
          hearing_history: Json | null
          hearing_notes: string | null
          ia_numbers: string[] | null
          id: string
          interim_orders: string[] | null
          is_auto_fetched: boolean | null
          judicial_branch: string | null
          last_fetched_at: string | null
          listed_date: string | null
          listing_reason: string | null
          matter_type: string | null
          next_hearing_date: string | null
          objection: string | null
          objection_status: string | null
          order_link: string | null
          orders: string[] | null
          party_details: Json | null
          petitioner: string | null
          petitioner_advocate: string | null
          police_district: string | null
          police_station: string | null
          priority: Database["public"]["Enums"]["case_priority_enum"] | null
          purpose_of_hearing: string | null
          reference_number: string | null
          registration_date: string | null
          registration_number: string | null
          respondent: string | null
          respondent_advocate: string | null
          scrutiny_date: string | null
          sections: string[] | null
          stage: string | null
          state: string | null
          state_1: string | null
          status: Database["public"]["Enums"]["case_status_enum"] | null
          sub_category: string | null
          tags: string[] | null
          team_name: string | null
          under_act: string | null
          under_section: string | null
          updated_at: string
          urgent_listing: boolean | null
          vs: string | null
        }
        Insert: {
          acts?: string[] | null
          advocate_name?: string | null
          assigned_to?: string | null
          assigned_users?: string[] | null
          bench_type?: string | null
          business_type?: string | null
          by_against?:
            | Database["public"]["Enums"]["case_by_against_enum"]
            | null
          case_classification?: string | null
          case_number?: string | null
          case_sub_type?: string | null
          case_summary?: string | null
          case_title: string
          case_type?: Database["public"]["Enums"]["case_type_enum"] | null
          category?: string | null
          cause_list_type?: string | null
          client_id?: string | null
          closing_date?: string | null
          cnr_auto_fetch_enabled?: boolean | null
          cnr_number?: string | null
          complaint_date?: string | null
          connected_cases?: string[] | null
          coram?: string | null
          court?: string | null
          court_complex?: string | null
          court_name?: string | null
          court_type?: string | null
          created_at?: string
          created_by?: string | null
          decision_date?: string | null
          description?: string | null
          disposal_date?: string | null
          district?: string | null
          district_1?: string | null
          docket_number?: string | null
          document_history?: Json | null
          document_links?: string[] | null
          fetch_message?: string | null
          fetch_status?: string | null
          fetched_data?: Json | null
          filing_date?: string | null
          filing_number?: string | null
          filing_party?: string | null
          final_orders?: string[] | null
          fir_number?: string | null
          firm_id?: string | null
          first_hearing_date?: string | null
          hearing_history?: Json | null
          hearing_notes?: string | null
          ia_numbers?: string[] | null
          id?: string
          interim_orders?: string[] | null
          is_auto_fetched?: boolean | null
          judicial_branch?: string | null
          last_fetched_at?: string | null
          listed_date?: string | null
          listing_reason?: string | null
          matter_type?: string | null
          next_hearing_date?: string | null
          objection?: string | null
          objection_status?: string | null
          order_link?: string | null
          orders?: string[] | null
          party_details?: Json | null
          petitioner?: string | null
          petitioner_advocate?: string | null
          police_district?: string | null
          police_station?: string | null
          priority?: Database["public"]["Enums"]["case_priority_enum"] | null
          purpose_of_hearing?: string | null
          reference_number?: string | null
          registration_date?: string | null
          registration_number?: string | null
          respondent?: string | null
          respondent_advocate?: string | null
          scrutiny_date?: string | null
          sections?: string[] | null
          stage?: string | null
          state?: string | null
          state_1?: string | null
          status?: Database["public"]["Enums"]["case_status_enum"] | null
          sub_category?: string | null
          tags?: string[] | null
          team_name?: string | null
          under_act?: string | null
          under_section?: string | null
          updated_at?: string
          urgent_listing?: boolean | null
          vs?: string | null
        }
        Update: {
          acts?: string[] | null
          advocate_name?: string | null
          assigned_to?: string | null
          assigned_users?: string[] | null
          bench_type?: string | null
          business_type?: string | null
          by_against?:
            | Database["public"]["Enums"]["case_by_against_enum"]
            | null
          case_classification?: string | null
          case_number?: string | null
          case_sub_type?: string | null
          case_summary?: string | null
          case_title?: string
          case_type?: Database["public"]["Enums"]["case_type_enum"] | null
          category?: string | null
          cause_list_type?: string | null
          client_id?: string | null
          closing_date?: string | null
          cnr_auto_fetch_enabled?: boolean | null
          cnr_number?: string | null
          complaint_date?: string | null
          connected_cases?: string[] | null
          coram?: string | null
          court?: string | null
          court_complex?: string | null
          court_name?: string | null
          court_type?: string | null
          created_at?: string
          created_by?: string | null
          decision_date?: string | null
          description?: string | null
          disposal_date?: string | null
          district?: string | null
          district_1?: string | null
          docket_number?: string | null
          document_history?: Json | null
          document_links?: string[] | null
          fetch_message?: string | null
          fetch_status?: string | null
          fetched_data?: Json | null
          filing_date?: string | null
          filing_number?: string | null
          filing_party?: string | null
          final_orders?: string[] | null
          fir_number?: string | null
          firm_id?: string | null
          first_hearing_date?: string | null
          hearing_history?: Json | null
          hearing_notes?: string | null
          ia_numbers?: string[] | null
          id?: string
          interim_orders?: string[] | null
          is_auto_fetched?: boolean | null
          judicial_branch?: string | null
          last_fetched_at?: string | null
          listed_date?: string | null
          listing_reason?: string | null
          matter_type?: string | null
          next_hearing_date?: string | null
          objection?: string | null
          objection_status?: string | null
          order_link?: string | null
          orders?: string[] | null
          party_details?: Json | null
          petitioner?: string | null
          petitioner_advocate?: string | null
          police_district?: string | null
          police_station?: string | null
          priority?: Database["public"]["Enums"]["case_priority_enum"] | null
          purpose_of_hearing?: string | null
          reference_number?: string | null
          registration_date?: string | null
          registration_number?: string | null
          respondent?: string | null
          respondent_advocate?: string | null
          scrutiny_date?: string | null
          sections?: string[] | null
          stage?: string | null
          state?: string | null
          state_1?: string | null
          status?: Database["public"]["Enums"]["case_status_enum"] | null
          sub_category?: string | null
          tags?: string[] | null
          team_name?: string | null
          under_act?: string | null
          under_section?: string | null
          updated_at?: string
          urgent_listing?: boolean | null
          vs?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cases_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "cases_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "cases_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cases_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["firm_id"]
          },
          {
            foreignKeyName: "cases_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      client_internal_notes: {
        Row: {
          client_id: string
          created_at: string
          created_by: string
          id: string
          note: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by: string
          id?: string
          note: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string
          id?: string
          note?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_internal_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "client_internal_notes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          aadhaar_no: string | null
          address: string | null
          appointment_date: string | null
          case_ref: string | null
          city: string | null
          client_portal_enabled: boolean | null
          company_address: string | null
          company_email: string | null
          company_phone: string | null
          created_at: string | null
          created_by: string | null
          designation: string | null
          district: string | null
          email: string | null
          firm_id: string | null
          full_name: string
          id: string
          is_vip: boolean | null
          notes: string | null
          organization: string | null
          phone: string | null
          pin_code: string | null
          referred_by_name: string | null
          referred_by_phone: string | null
          services: string[] | null
          source: string | null
          state: string | null
          status: Database["public"]["Enums"]["client_status_enum"] | null
          total_billed_amount: number | null
          type: string | null
          updated_at: string | null
        }
        Insert: {
          aadhaar_no?: string | null
          address?: string | null
          appointment_date?: string | null
          case_ref?: string | null
          city?: string | null
          client_portal_enabled?: boolean | null
          company_address?: string | null
          company_email?: string | null
          company_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          designation?: string | null
          district?: string | null
          email?: string | null
          firm_id?: string | null
          full_name: string
          id?: string
          is_vip?: boolean | null
          notes?: string | null
          organization?: string | null
          phone?: string | null
          pin_code?: string | null
          referred_by_name?: string | null
          referred_by_phone?: string | null
          services?: string[] | null
          source?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["client_status_enum"] | null
          total_billed_amount?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Update: {
          aadhaar_no?: string | null
          address?: string | null
          appointment_date?: string | null
          case_ref?: string | null
          city?: string | null
          client_portal_enabled?: boolean | null
          company_address?: string | null
          company_email?: string | null
          company_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          designation?: string | null
          district?: string | null
          email?: string | null
          firm_id?: string | null
          full_name?: string
          id?: string
          is_vip?: boolean | null
          notes?: string | null
          organization?: string | null
          phone?: string | null
          pin_code?: string | null
          referred_by_name?: string | null
          referred_by_phone?: string | null
          services?: string[] | null
          source?: string | null
          state?: string | null
          status?: Database["public"]["Enums"]["client_status_enum"] | null
          total_billed_amount?: number | null
          type?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["firm_id"]
          },
          {
            foreignKeyName: "clients_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      contacts: {
        Row: {
          address_line_1: string | null
          address_line_2: string | null
          company_address: string | null
          company_email: string | null
          company_phone: string | null
          created_at: string | null
          created_by: string | null
          designation: string | null
          district_id: string | null
          email: string | null
          firm_id: string | null
          id: string
          is_vip: boolean | null
          last_visited_at: string | null
          name: string
          notes: string | null
          organization: string | null
          phone: string | null
          pin_code: string | null
          referred_by_name: string | null
          referred_by_phone: string | null
          state_id: string | null
          type: string | null
          updated_at: string | null
          visit_purpose: string | null
        }
        Insert: {
          address_line_1?: string | null
          address_line_2?: string | null
          company_address?: string | null
          company_email?: string | null
          company_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          designation?: string | null
          district_id?: string | null
          email?: string | null
          firm_id?: string | null
          id?: string
          is_vip?: boolean | null
          last_visited_at?: string | null
          name: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          pin_code?: string | null
          referred_by_name?: string | null
          referred_by_phone?: string | null
          state_id?: string | null
          type?: string | null
          updated_at?: string | null
          visit_purpose?: string | null
        }
        Update: {
          address_line_1?: string | null
          address_line_2?: string | null
          company_address?: string | null
          company_email?: string | null
          company_phone?: string | null
          created_at?: string | null
          created_by?: string | null
          designation?: string | null
          district_id?: string | null
          email?: string | null
          firm_id?: string | null
          id?: string
          is_vip?: boolean | null
          last_visited_at?: string | null
          name?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          pin_code?: string | null
          referred_by_name?: string | null
          referred_by_phone?: string | null
          state_id?: string | null
          type?: string | null
          updated_at?: string | null
          visit_purpose?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_district_id_fkey"
            columns: ["district_id"]
            isOneToOne: false
            referencedRelation: "districts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      court_hearings: {
        Row: {
          case_id: string | null
          courtroom: string | null
          created_at: string | null
          end_time: string | null
          hearing_date: string
          id: string
          judge_name: string | null
          lawyer_id: string | null
          notes: string | null
          start_time: string
          status: string | null
        }
        Insert: {
          case_id?: string | null
          courtroom?: string | null
          created_at?: string | null
          end_time?: string | null
          hearing_date: string
          id?: string
          judge_name?: string | null
          lawyer_id?: string | null
          notes?: string | null
          start_time: string
          status?: string | null
        }
        Update: {
          case_id?: string | null
          courtroom?: string | null
          created_at?: string | null
          end_time?: string | null
          hearing_date?: string
          id?: string
          judge_name?: string | null
          lawyer_id?: string | null
          notes?: string | null
          start_time?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "court_hearings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "court_hearings_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "court_hearings_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      districts: {
        Row: {
          id: string
          name: string
          state_id: string
        }
        Insert: {
          id?: string
          name: string
          state_id: string
        }
        Update: {
          id?: string
          name?: string
          state_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "districts_state_id_fkey"
            columns: ["state_id"]
            isOneToOne: false
            referencedRelation: "states"
            referencedColumns: ["id"]
          },
        ]
      }
      document_types: {
        Row: {
          category_code: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          category_code: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          category_code?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          case_id: string | null
          certified_copy: boolean | null
          client_id: string | null
          confidential: boolean | null
          description: string | null
          document_type_id: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          firm_id: string | null
          folder_name: string | null
          id: string
          is_evidence: boolean | null
          is_shared_with_client: boolean | null
          notes: string | null
          original_copy_retained: boolean | null
          sync_attempted_at: string | null
          synced_at: string | null
          task_id: string | null
          title: string | null
          uploaded_at: string | null
          uploaded_by: string | null
          uploaded_by_user_id: string | null
          webdav_error: string | null
          webdav_path: string | null
          webdav_synced: boolean | null
        }
        Insert: {
          case_id?: string | null
          certified_copy?: boolean | null
          client_id?: string | null
          confidential?: boolean | null
          description?: string | null
          document_type_id?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          firm_id?: string | null
          folder_name?: string | null
          id?: string
          is_evidence?: boolean | null
          is_shared_with_client?: boolean | null
          notes?: string | null
          original_copy_retained?: boolean | null
          sync_attempted_at?: string | null
          synced_at?: string | null
          task_id?: string | null
          title?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          uploaded_by_user_id?: string | null
          webdav_error?: string | null
          webdav_path?: string | null
          webdav_synced?: boolean | null
        }
        Update: {
          case_id?: string | null
          certified_copy?: boolean | null
          client_id?: string | null
          confidential?: boolean | null
          description?: string | null
          document_type_id?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          firm_id?: string | null
          folder_name?: string | null
          id?: string
          is_evidence?: boolean | null
          is_shared_with_client?: boolean | null
          notes?: string | null
          original_copy_retained?: boolean | null
          sync_attempted_at?: string | null
          synced_at?: string | null
          task_id?: string | null
          title?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
          uploaded_by_user_id?: string | null
          webdav_error?: string | null
          webdav_path?: string | null
          webdav_synced?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_document_type_id_fkey"
            columns: ["document_type_id"]
            isOneToOne: false
            referencedRelation: "document_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      engagement_letters: {
        Row: {
          case_id: string | null
          case_number: string | null
          client_id: string
          court_name: string | null
          created_at: string
          created_by: string
          expenses: number | null
          firm_id: string
          generated_at: string | null
          id: string
          issue_date: string
          matter_title: string
          payment_method: string
          payment_schedule: string
          primary_lawyer_name: string
          professional_fee: number | null
          retainer_amount: number | null
          scope_description: string
          signed_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          case_number?: string | null
          client_id: string
          court_name?: string | null
          created_at?: string
          created_by: string
          expenses?: number | null
          firm_id: string
          generated_at?: string | null
          id?: string
          issue_date: string
          matter_title: string
          payment_method: string
          payment_schedule: string
          primary_lawyer_name: string
          professional_fee?: number | null
          retainer_amount?: number | null
          scope_description: string
          signed_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          case_number?: string | null
          client_id?: string
          court_name?: string | null
          created_at?: string
          created_by?: string
          expenses?: number | null
          firm_id?: string
          generated_at?: string | null
          id?: string
          issue_date?: string
          matter_title?: string
          payment_method?: string
          payment_schedule?: string
          primary_lawyer_name?: string
          professional_fee?: number | null
          retainer_amount?: number | null
          scope_description?: string
          signed_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      firm_holidays: {
        Row: {
          created_at: string
          created_by: string | null
          date: string
          description: string | null
          firm_id: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          date: string
          description?: string | null
          firm_id: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          date?: string
          description?: string | null
          firm_id?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      google_calendar_settings: {
        Row: {
          access_token: string | null
          auto_sync: boolean
          calendar_id: string | null
          created_at: string
          id: string
          last_error: string | null
          last_error_at: string | null
          last_sync_at: string | null
          refresh_token: string | null
          sync_direction: string
          sync_enabled: boolean
          sync_interval_minutes: number
          token_expires_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_token?: string | null
          auto_sync?: boolean
          calendar_id?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          last_error_at?: string | null
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_direction?: string
          sync_enabled?: boolean
          sync_interval_minutes?: number
          token_expires_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_token?: string | null
          auto_sync?: boolean
          calendar_id?: string | null
          created_at?: string
          id?: string
          last_error?: string | null
          last_error_at?: string | null
          last_sync_at?: string | null
          refresh_token?: string | null
          sync_direction?: string
          sync_enabled?: boolean
          sync_interval_minutes?: number
          token_expires_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      google_calendar_sync_queue: {
        Row: {
          appointment_data: Json
          appointment_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          last_retry_at: string | null
          operation: string
          processed: boolean | null
          processed_at: string | null
          retry_count: number | null
          user_id: string
        }
        Insert: {
          appointment_data: Json
          appointment_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          operation: string
          processed?: boolean | null
          processed_at?: string | null
          retry_count?: number | null
          user_id: string
        }
        Update: {
          appointment_data?: Json
          appointment_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          operation?: string
          processed?: boolean | null
          processed_at?: string | null
          retry_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      hearings: {
        Row: {
          assigned_to: string | null
          bench: string | null
          case_id: string | null
          coram: string | null
          court_name: string
          created_at: string
          created_by: string | null
          firm_id: string | null
          hearing_date: string
          hearing_time: string | null
          hearing_type: Database["public"]["Enums"]["hearing_type"]
          id: string
          next_hearing_date: string | null
          notes: string | null
          outcome: string | null
          status: Database["public"]["Enums"]["hearing_status"]
        }
        Insert: {
          assigned_to?: string | null
          bench?: string | null
          case_id?: string | null
          coram?: string | null
          court_name: string
          created_at?: string
          created_by?: string | null
          firm_id?: string | null
          hearing_date: string
          hearing_time?: string | null
          hearing_type: Database["public"]["Enums"]["hearing_type"]
          id?: string
          next_hearing_date?: string | null
          notes?: string | null
          outcome?: string | null
          status?: Database["public"]["Enums"]["hearing_status"]
        }
        Update: {
          assigned_to?: string | null
          bench?: string | null
          case_id?: string | null
          coram?: string | null
          court_name?: string
          created_at?: string
          created_by?: string | null
          firm_id?: string | null
          hearing_date?: string
          hearing_time?: string | null
          hearing_type?: Database["public"]["Enums"]["hearing_type"]
          id?: string
          next_hearing_date?: string | null
          notes?: string | null
          outcome?: string | null
          status?: Database["public"]["Enums"]["hearing_status"]
        }
        Relationships: [
          {
            foreignKeyName: "hearings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      ia_details: {
        Row: {
          case_id: string | null
          created_at: string | null
          date_of_filing: string | null
          ia_number: string | null
          ia_status: string | null
          id: string
          legalkart_case_id: string | null
          next_date: string | null
          party: string | null
        }
        Insert: {
          case_id?: string | null
          created_at?: string | null
          date_of_filing?: string | null
          ia_number?: string | null
          ia_status?: string | null
          id?: string
          legalkart_case_id?: string | null
          next_date?: string | null
          party?: string | null
        }
        Update: {
          case_id?: string | null
          created_at?: string | null
          date_of_filing?: string | null
          ia_number?: string | null
          ia_status?: string | null
          id?: string
          legalkart_case_id?: string | null
          next_date?: string | null
          party?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ia_details_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ia_details_legalkart_case_id_fkey"
            columns: ["legalkart_case_id"]
            isOneToOne: false
            referencedRelation: "legalkart_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      instruction_replies: {
        Row: {
          created_at: string
          created_by: string
          id: string
          instruction_id: string
          is_from_lawyer: boolean
          is_status_update: boolean
          new_status: string | null
          old_status: string | null
          reply_message: string
          tagged_user_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          instruction_id: string
          is_from_lawyer?: boolean
          is_status_update?: boolean
          new_status?: string | null
          old_status?: string | null
          reply_message: string
          tagged_user_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          instruction_id?: string
          is_from_lawyer?: boolean
          is_status_update?: boolean
          new_status?: string | null
          old_status?: string | null
          reply_message?: string
          tagged_user_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "instruction_replies_instruction_id_fkey"
            columns: ["instruction_id"]
            isOneToOne: false
            referencedRelation: "instructions"
            referencedColumns: ["id"]
          },
        ]
      }
      instructions: {
        Row: {
          case_id: string | null
          created_at: string
          deadline: string | null
          id: string
          lawyer_id: string
          message: string
          priority: string
          staff_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          lawyer_id: string
          message: string
          priority?: string
          staff_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          created_at?: string
          deadline?: string | null
          id?: string
          lawyer_id?: string
          message?: string
          priority?: string
          staff_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      invoice_adjustments: {
        Row: {
          adjustment_type: string | null
          adjustment_value: number | null
          created_at: string | null
          description: string | null
          id: string
          invoice_id: string
          updated_at: string | null
        }
        Insert: {
          adjustment_type?: string | null
          adjustment_value?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id: string
          updated_at?: string | null
        }
        Update: {
          adjustment_type?: string | null
          adjustment_value?: number | null
          created_at?: string | null
          description?: string | null
          id?: string
          invoice_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_adjustments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_expenses: {
        Row: {
          amount: number | null
          created_at: string | null
          date: string | null
          expense_type: string | null
          id: string
          invoice_id: string
          owner_id: string | null
          updated_at: string | null
        }
        Insert: {
          amount?: number | null
          created_at?: string | null
          date?: string | null
          expense_type?: string | null
          id?: string
          invoice_id: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Update: {
          amount?: number | null
          created_at?: string | null
          date?: string | null
          expense_type?: string | null
          id?: string
          invoice_id?: string
          owner_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_expenses_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_flat_fees: {
        Row: {
          city: string | null
          created_at: string | null
          date: string | null
          discount_amount: number | null
          discount_percentage: number | null
          fixed_fee_type: string | null
          id: string
          invoice_id: string
          total: number | null
          unit_rate: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          date?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          fixed_fee_type?: string | null
          id?: string
          invoice_id: string
          total?: number | null
          unit_rate?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          date?: string | null
          discount_amount?: number | null
          discount_percentage?: number | null
          fixed_fee_type?: string | null
          id?: string
          invoice_id?: string
          total?: number | null
          unit_rate?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoice_flat_fees_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoice_items: {
        Row: {
          amount: number | null
          created_at: string
          description: string
          id: string
          invoice_id: string
          quantity: number
          rate: number
          updated_at: string
        }
        Insert: {
          amount?: number | null
          created_at?: string
          description: string
          id?: string
          invoice_id: string
          quantity: number
          rate: number
          updated_at?: string
        }
        Update: {
          amount?: number | null
          created_at?: string
          description?: string
          id?: string
          invoice_id?: string
          quantity?: number
          rate?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          case_id: string | null
          client_address: string | null
          client_id: string
          created_at: string
          created_by: string
          description: string | null
          due_date: string
          firm_id: string
          gstin: string | null
          id: string
          invoice_number: string
          invoice_subject: string | null
          issue_date: string
          kind_attention: string | null
          notes: string | null
          secondary_client_address: string | null
          secondary_client_name: string | null
          signature_name: string | null
          state_code: string | null
          status: Database["public"]["Enums"]["invoice_status_enum"]
          title: string | null
          total_amount: number | null
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          client_address?: string | null
          client_id: string
          created_at?: string
          created_by: string
          description?: string | null
          due_date: string
          firm_id: string
          gstin?: string | null
          id?: string
          invoice_number: string
          invoice_subject?: string | null
          issue_date: string
          kind_attention?: string | null
          notes?: string | null
          secondary_client_address?: string | null
          secondary_client_name?: string | null
          signature_name?: string | null
          state_code?: string | null
          status?: Database["public"]["Enums"]["invoice_status_enum"]
          title?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          client_address?: string | null
          client_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          due_date?: string
          firm_id?: string
          gstin?: string | null
          id?: string
          invoice_number?: string
          invoice_subject?: string | null
          issue_date?: string
          kind_attention?: string | null
          notes?: string | null
          secondary_client_address?: string | null
          secondary_client_name?: string | null
          signature_name?: string | null
          state_code?: string | null
          status?: Database["public"]["Enums"]["invoice_status_enum"]
          title?: string | null
          total_amount?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["firm_id"]
          },
          {
            foreignKeyName: "invoices_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      law_firm_members: {
        Row: {
          id: string
          joined_at: string | null
          law_firm_id: string
          role: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string | null
          law_firm_id: string
          role?: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string | null
          law_firm_id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "law_firm_members_law_firm_id_fkey"
            columns: ["law_firm_id"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["firm_id"]
          },
          {
            foreignKeyName: "law_firm_members_law_firm_id_fkey"
            columns: ["law_firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "law_firm_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "law_firm_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      law_firms: {
        Row: {
          address: string | null
          admin_email: string | null
          admin_id: string | null
          created_at: string | null
          created_by: string
          id: string
          license_count: number
          name: string
          status: Database["public"]["Enums"]["firm_status"] | null
        }
        Insert: {
          address?: string | null
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string | null
          created_by: string
          id?: string
          license_count?: number
          name: string
          status?: Database["public"]["Enums"]["firm_status"] | null
        }
        Update: {
          address?: string | null
          admin_email?: string | null
          admin_id?: string | null
          created_at?: string | null
          created_by?: string
          id?: string
          license_count?: number
          name?: string
          status?: Database["public"]["Enums"]["firm_status"] | null
        }
        Relationships: [
          {
            foreignKeyName: "law_firms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "law_firms_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_news: {
        Row: {
          created_at: string
          id: string
          published_at: string
          source: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          published_at: string
          source: string
          title: string
          updated_at?: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          published_at?: string
          source?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      legalkart_case_searches: {
        Row: {
          case_id: string | null
          cnr_number: string
          created_at: string
          created_by: string
          error_message: string | null
          firm_id: string
          id: string
          processing_duration_ms: number | null
          queue_item_id: string | null
          request_data: Json | null
          response_data: Json | null
          retry_attempt: number | null
          search_type: string
          status: string
          updated_at: string
        }
        Insert: {
          case_id?: string | null
          cnr_number: string
          created_at?: string
          created_by: string
          error_message?: string | null
          firm_id: string
          id?: string
          processing_duration_ms?: number | null
          queue_item_id?: string | null
          request_data?: Json | null
          response_data?: Json | null
          retry_attempt?: number | null
          search_type: string
          status?: string
          updated_at?: string
        }
        Update: {
          case_id?: string | null
          cnr_number?: string
          created_at?: string
          created_by?: string
          error_message?: string | null
          firm_id?: string
          id?: string
          processing_duration_ms?: number | null
          queue_item_id?: string | null
          request_data?: Json | null
          response_data?: Json | null
          retry_attempt?: number | null
          search_type?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legalkart_case_searches_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legalkart_case_searches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "legalkart_case_searches_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legalkart_case_searches_queue_item_id_fkey"
            columns: ["queue_item_id"]
            isOneToOne: false
            referencedRelation: "case_fetch_queue"
            referencedColumns: ["id"]
          },
        ]
      }
      legalkart_cases: {
        Row: {
          before_me_part_heard: string | null
          bench_type: string | null
          case_id: string | null
          category: string | null
          cnr_number: string
          coram: string | null
          created_at: string
          district: string | null
          filing_date: string | null
          filing_number: string | null
          firm_id: string | null
          id: string
          judicial_branch: string | null
          next_hearing_date: string | null
          petitioner_and_advocate: string | null
          raw_api_response: Json | null
          registration_date: string | null
          registration_number: string | null
          respondent_and_advocate: string | null
          stage_of_case: string | null
          state: string | null
          sub_category: string | null
          updated_at: string
        }
        Insert: {
          before_me_part_heard?: string | null
          bench_type?: string | null
          case_id?: string | null
          category?: string | null
          cnr_number: string
          coram?: string | null
          created_at?: string
          district?: string | null
          filing_date?: string | null
          filing_number?: string | null
          firm_id?: string | null
          id?: string
          judicial_branch?: string | null
          next_hearing_date?: string | null
          petitioner_and_advocate?: string | null
          raw_api_response?: Json | null
          registration_date?: string | null
          registration_number?: string | null
          respondent_and_advocate?: string | null
          stage_of_case?: string | null
          state?: string | null
          sub_category?: string | null
          updated_at?: string
        }
        Update: {
          before_me_part_heard?: string | null
          bench_type?: string | null
          case_id?: string | null
          category?: string | null
          cnr_number?: string
          coram?: string | null
          created_at?: string
          district?: string | null
          filing_date?: string | null
          filing_number?: string | null
          firm_id?: string | null
          id?: string
          judicial_branch?: string | null
          next_hearing_date?: string | null
          petitioner_and_advocate?: string | null
          raw_api_response?: Json | null
          registration_date?: string | null
          registration_number?: string | null
          respondent_and_advocate?: string | null
          stage_of_case?: string | null
          state?: string | null
          sub_category?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      message_threads: {
        Row: {
          created_at: string
          created_by: string
          firm_id: string
          id: string
          is_private: boolean
          related_case_id: string | null
          related_hearing_id: string | null
          related_task_id: string | null
          title: string | null
        }
        Insert: {
          created_at?: string
          created_by: string
          firm_id: string
          id?: string
          is_private?: boolean
          related_case_id?: string | null
          related_hearing_id?: string | null
          related_task_id?: string | null
          title?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string
          firm_id?: string
          id?: string
          is_private?: boolean
          related_case_id?: string | null
          related_hearing_id?: string | null
          related_task_id?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "message_threads_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["firm_id"]
          },
          {
            foreignKeyName: "message_threads_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_related_case_id_fkey"
            columns: ["related_case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_related_hearing_id_fkey"
            columns: ["related_hearing_id"]
            isOneToOne: false
            referencedRelation: "hearings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "message_threads_related_task_id_fkey"
            columns: ["related_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          created_at: string
          id: string
          message_text: string
          sender_id: string
          thread_id: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string
          id?: string
          message_text: string
          sender_id: string
          thread_id: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string
          id?: string
          message_text?: string
          sender_id?: string
          thread_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          author_id: string | null
          case_id: string | null
          created_at: string | null
          id: string
          note: string
        }
        Insert: {
          author_id?: string | null
          case_id?: string | null
          created_at?: string | null
          id?: string
          note: string
        }
        Update: {
          author_id?: string | null
          case_id?: string | null
          created_at?: string | null
          id?: string
          note?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "notes_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_v2: {
        Row: {
          appointment_id: string | null
          audio_data: string | null
          case_id: string | null
          client_id: string | null
          color: string | null
          content: string | null
          created_at: string
          created_by: string
          drawing_data: string | null
          id: string
          is_archived: boolean | null
          is_pinned: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          appointment_id?: string | null
          audio_data?: string | null
          case_id?: string | null
          client_id?: string | null
          color?: string | null
          content?: string | null
          created_at?: string
          created_by?: string
          drawing_data?: string | null
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          appointment_id?: string | null
          audio_data?: string | null
          case_id?: string | null
          client_id?: string | null
          color?: string | null
          content?: string | null
          created_at?: string
          created_by?: string
          drawing_data?: string | null
          id?: string
          is_archived?: boolean | null
          is_pinned?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_v2_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointment_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_v2_appointment_id_fkey"
            columns: ["appointment_id"]
            isOneToOne: false
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_v2_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_v2_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_v2_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_v2_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "notes_v2_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_dedup: {
        Row: {
          created_at: string
          event_key: string
          id: string
        }
        Insert: {
          created_at?: string
          event_key: string
          id?: string
        }
        Update: {
          created_at?: string
          event_key?: string
          id?: string
        }
        Relationships: []
      }
      notification_reminders: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          firm_id: string | null
          id: string
          reminder_type: string
          sent_at: string
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          firm_id?: string | null
          id?: string
          reminder_type: string
          sent_at?: string
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          firm_id?: string | null
          id?: string
          reminder_type?: string
          sent_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          category: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          message: string
          metadata: Json | null
          notification_type:
            | Database["public"]["Enums"]["notification_event_type"]
            | null
          priority: string | null
          read: boolean | null
          recipient_id: string | null
          reference_id: string | null
          title: string
        }
        Insert: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          notification_type?:
            | Database["public"]["Enums"]["notification_event_type"]
            | null
          priority?: string | null
          read?: boolean | null
          recipient_id?: string | null
          reference_id?: string | null
          title: string
        }
        Update: {
          action_url?: string | null
          category?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          notification_type?:
            | Database["public"]["Enums"]["notification_event_type"]
            | null
          priority?: string | null
          read?: boolean | null
          recipient_id?: string | null
          reference_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "notifications_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          case_id: string | null
          client_id: string | null
          created_by: string | null
          id: string
          mode: string | null
          notes: string | null
          status: string
          timestamp: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          case_id?: string | null
          client_id?: string | null
          created_by?: string | null
          id?: string
          mode?: string | null
          notes?: string | null
          status?: string
          timestamp?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          case_id?: string | null
          client_id?: string | null
          created_by?: string | null
          id?: string
          mode?: string | null
          notes?: string | null
          status?: string
          timestamp?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "payments_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      petitioners: {
        Row: {
          advocate_enrollment_no: string | null
          advocate_name: string | null
          case_id: string | null
          created_at: string | null
          id: string
          legalkart_case_id: string | null
          party_type: string | null
          petitioner_name: string
        }
        Insert: {
          advocate_enrollment_no?: string | null
          advocate_name?: string | null
          case_id?: string | null
          created_at?: string | null
          id?: string
          legalkart_case_id?: string | null
          party_type?: string | null
          petitioner_name: string
        }
        Update: {
          advocate_enrollment_no?: string | null
          advocate_name?: string | null
          case_id?: string | null
          created_at?: string | null
          id?: string
          legalkart_case_id?: string | null
          party_type?: string | null
          petitioner_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "petitioners_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "petitioners_legalkart_case_id_fkey"
            columns: ["legalkart_case_id"]
            isOneToOne: false
            referencedRelation: "legalkart_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aadhaar_no: string | null
          accepting_clients: boolean | null
          address: string | null
          availability: Json | null
          bar_registration: string | null
          bio: string | null
          court_affiliations: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string | null
          experience_years: number | null
          full_name: string
          gender: string | null
          id: string
          jurisdiction: string | null
          languages: string | null
          linkedin: string | null
          location: string | null
          notes: string | null
          notification_email: boolean | null
          notification_sms: boolean | null
          other_links: string | null
          phone: string | null
          pin_code: string | null
          profile_pic: string | null
          role: string
          specializations: string | null
          updated_at: string | null
          username: string | null
          website: string | null
        }
        Insert: {
          aadhaar_no?: string | null
          accepting_clients?: boolean | null
          address?: string | null
          availability?: Json | null
          bar_registration?: string | null
          bio?: string | null
          court_affiliations?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          experience_years?: number | null
          full_name: string
          gender?: string | null
          id: string
          jurisdiction?: string | null
          languages?: string | null
          linkedin?: string | null
          location?: string | null
          notes?: string | null
          notification_email?: boolean | null
          notification_sms?: boolean | null
          other_links?: string | null
          phone?: string | null
          pin_code?: string | null
          profile_pic?: string | null
          role: string
          specializations?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Update: {
          aadhaar_no?: string | null
          accepting_clients?: boolean | null
          address?: string | null
          availability?: Json | null
          bar_registration?: string | null
          bio?: string | null
          court_affiliations?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string | null
          experience_years?: number | null
          full_name?: string
          gender?: string | null
          id?: string
          jurisdiction?: string | null
          languages?: string | null
          linkedin?: string | null
          location?: string | null
          notes?: string | null
          notification_email?: boolean | null
          notification_sms?: boolean | null
          other_links?: string | null
          phone?: string | null
          pin_code?: string | null
          profile_pic?: string | null
          role?: string
          specializations?: string | null
          updated_at?: string | null
          username?: string | null
          website?: string | null
        }
        Relationships: []
      }
      public_appointments: {
        Row: {
          appointment_date: string
          appointment_time: string
          case_title: string | null
          client_email: string
          client_name: string
          client_phone: string | null
          created_at: string
          duration_minutes: number
          firm_id: string | null
          id: string
          lawyer_id: string
          reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          appointment_date: string
          appointment_time: string
          case_title?: string | null
          client_email: string
          client_name: string
          client_phone?: string | null
          created_at?: string
          duration_minutes?: number
          firm_id?: string | null
          id?: string
          lawyer_id: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          appointment_date?: string
          appointment_time?: string
          case_title?: string | null
          client_email?: string
          client_name?: string
          client_phone?: string | null
          created_at?: string
          duration_minutes?: number
          firm_id?: string | null
          id?: string
          lawyer_id?: string
          reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      respondents: {
        Row: {
          advocate_enrollment_no: string | null
          advocate_name: string | null
          case_id: string | null
          created_at: string | null
          id: string
          legalkart_case_id: string | null
          party_type: string | null
          respondent_name: string
        }
        Insert: {
          advocate_enrollment_no?: string | null
          advocate_name?: string | null
          case_id?: string | null
          created_at?: string | null
          id?: string
          legalkart_case_id?: string | null
          party_type?: string | null
          respondent_name: string
        }
        Update: {
          advocate_enrollment_no?: string | null
          advocate_name?: string | null
          case_id?: string | null
          created_at?: string | null
          id?: string
          legalkart_case_id?: string | null
          party_type?: string | null
          respondent_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "respondents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "respondents_legalkart_case_id_fkey"
            columns: ["legalkart_case_id"]
            isOneToOne: false
            referencedRelation: "legalkart_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      states: {
        Row: {
          id: string
          name: string
        }
        Insert: {
          id?: string
          name: string
        }
        Update: {
          id?: string
          name?: string
        }
        Relationships: []
      }
      task_history: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          id: string
          task_id: string
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          changes?: Json | null
          created_at?: string | null
          id?: string
          task_id: string
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          changes?: Json | null
          created_at?: string | null
          id?: string
          task_id?: string
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_history_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_by: string | null
          assigned_to: string | null
          attachments: string[] | null
          case_id: string | null
          client_id: string | null
          comments: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          end_time: string | null
          firm_id: string | null
          id: string
          last_notified_at: string | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          progress: number | null
          reminder_time: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_by?: string | null
          assigned_to?: string | null
          attachments?: string[] | null
          case_id?: string | null
          client_id?: string | null
          comments?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          end_time?: string | null
          firm_id?: string | null
          id?: string
          last_notified_at?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          progress?: number | null
          reminder_time?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_by?: string | null
          assigned_to?: string | null
          attachments?: string[] | null
          case_id?: string | null
          client_id?: string | null
          comments?: Json | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          end_time?: string | null
          firm_id?: string | null
          id?: string
          last_notified_at?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          progress?: number | null
          reminder_time?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "tasks_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_member_notes: {
        Row: {
          created_at: string
          created_by: string
          id: string
          note: string | null
          team_member_id: string
        }
        Insert: {
          created_at?: string
          created_by: string
          id?: string
          note?: string | null
          team_member_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          id?: string
          note?: string | null
          team_member_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_member_notes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_member_notes_team_member_id_fkey"
            columns: ["team_member_id"]
            isOneToOne: false
            referencedRelation: "team_members"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          added_by: string | null
          avatar_url: string | null
          created_at: string | null
          email: string
          firm_id: string
          full_name: string
          id: string
          join_date: string | null
          joined_at: string | null
          phone_number: string | null
          role: Database["public"]["Enums"]["team_role_enum"]
          status: Database["public"]["Enums"]["team_member_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          added_by?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email: string
          firm_id: string
          full_name: string
          id?: string
          join_date?: string | null
          joined_at?: string | null
          phone_number?: string | null
          role: Database["public"]["Enums"]["team_role_enum"]
          status?: Database["public"]["Enums"]["team_member_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          added_by?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string
          firm_id?: string
          full_name?: string
          id?: string
          join_date?: string | null
          joined_at?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["team_role_enum"]
          status?: Database["public"]["Enums"]["team_member_status"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "team_members_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["firm_id"]
          },
          {
            foreignKeyName: "team_members_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      thread_participants: {
        Row: {
          created_at: string
          id: string
          thread_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          thread_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          thread_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "thread_participants_thread_id_fkey"
            columns: ["thread_id"]
            isOneToOne: false
            referencedRelation: "message_threads"
            referencedColumns: ["id"]
          },
        ]
      }
      zoho_tokens: {
        Row: {
          access_token: string
          created_at: string | null
          expires_at: string
          firm_id: string
          id: string
          organization_id: string | null
          refresh_token: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          access_token: string
          created_at?: string | null
          expires_at: string
          firm_id: string
          id?: string
          organization_id?: string | null
          refresh_token: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          access_token?: string
          created_at?: string | null
          expires_at?: string
          firm_id?: string
          id?: string
          organization_id?: string | null
          refresh_token?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      appointment_details: {
        Row: {
          appointment_date: string | null
          appointment_time: string | null
          assigned_user_name: string | null
          case_id: string | null
          case_number: string | null
          case_title: string | null
          client_id: string | null
          client_name: string | null
          created_at: string | null
          created_by: string | null
          document_url: string | null
          duration_minutes: number | null
          end_time: string | null
          firm_id: string | null
          id: string | null
          is_visible_to_team: boolean | null
          lawyer_id: string | null
          location: string | null
          notes: string | null
          reminder_minutes: number | null
          start_time: string | null
          status: string | null
          title: string | null
          type: Database["public"]["Enums"]["appointment_type"] | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["firm_id"]
          },
          {
            foreignKeyName: "appointments_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      client_stats: {
        Row: {
          active_case_count: number | null
          client_portal_enabled: boolean | null
          created_at: string | null
          email: string | null
          firm_id: string | null
          full_name: string | null
          id: string | null
          phone: string | null
          status: Database["public"]["Enums"]["client_status_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["firm_id"]
          },
          {
            foreignKeyName: "clients_firm_id_fkey"
            columns: ["firm_id"]
            isOneToOne: false
            referencedRelation: "law_firms"
            referencedColumns: ["id"]
          },
        ]
      }
      firm_statistics: {
        Row: {
          admin_email: string | null
          admin_id: string | null
          admin_name: string | null
          admin_phone: string | null
          firm_id: string | null
          firm_name: string | null
          license_count: number | null
          status: Database["public"]["Enums"]["firm_status"] | null
          total_users: number | null
        }
        Relationships: []
      }
      security_dashboard_secure: {
        Row: {
          action: string | null
          critical_events: number | null
          entity_type: string | null
          event_count: number | null
          high_risk_events: number | null
          log_date: string | null
          unique_users: number | null
        }
        Relationships: []
      }
      security_monitoring_secure: {
        Row: {
          action: string | null
          details: Json | null
          entity_type: string | null
          event_category: string | null
          risk_level: string | null
          timestamp: string | null
          user_name: string | null
          user_role: Database["public"]["Enums"]["team_role_enum"] | null
        }
        Relationships: []
      }
    }
    Functions: {
      batch_update_case_priority: {
        Args: { batch_size?: number; target_priority: string }
        Returns: {
          updated_count: number
        }[]
      }
      batch_update_case_priority_once: {
        Args: { batch_size?: number }
        Returns: number
      }
      can_assign_to_role: {
        Args: { assignee_id: string; assigner_id: string }
        Returns: boolean
      }
      can_cancel_invoice: { Args: { user_id: string }; Returns: boolean }
      can_edit_task: {
        Args: { task_id: string; user_id: string }
        Returns: boolean
      }
      can_view_task: {
        Args: { task_id: string; user_id: string }
        Returns: boolean
      }
      check_appointment_rate_limit: {
        Args: { p_user_id?: string }
        Returns: boolean
      }
      check_appointment_rate_limit_enhanced: {
        Args: { p_user_id?: string }
        Returns: boolean
      }
      check_if_super_admin: { Args: { user_id: string }; Returns: boolean }
      check_user_in_firm: {
        Args: { firm_id: string; user_id: string }
        Returns: boolean
      }
      check_username_availability: {
        Args: { current_user_id: string; input_username: string }
        Returns: {
          available: boolean
        }[]
      }
      cleanup_old_sync_queue_items: { Args: never; Returns: undefined }
      client_has_case_access: { Args: { case_id: string }; Returns: boolean }
      create_law_firm_with_admin:
        | {
            Args: {
              admin_email: string
              admin_full_name: string
              firm_address: string
              firm_name: string
            }
            Returns: string
          }
        | {
            Args: {
              admin_email: string
              admin_full_name: string
              admin_password: string
              firm_address: string
              firm_name: string
            }
            Returns: string
          }
        | {
            Args: {
              admin_email: string
              admin_full_name: string
              created_by?: string
              firm_address: string
              firm_name: string
            }
            Returns: string
          }
      create_private_thread: {
        Args: { p_other_user_id: string }
        Returns: string
      }
      delete_cases_and_dependencies: {
        Args: { p_case_ids: string[] }
        Returns: Json
      }
      delete_document_secure: {
        Args: { p_document_id: string }
        Returns: undefined
      }
      get_all_lawyers_and_admin: {
        Args: never
        Returns: {
          full_name: string
          id: string
          role: string
        }[]
      }
      get_current_user_firm_id: { Args: never; Returns: string }
      get_current_user_firm_id_secure: { Args: never; Returns: string }
      get_current_user_profile: {
        Args: never
        Returns: {
          email: string
          full_name: string
          id: string
          role: string
        }[]
      }
      get_current_user_role_for_firm: {
        Args: { p_firm_id: string }
        Returns: string
      }
      get_current_user_role_secure: { Args: never; Returns: string }
      get_firm_members_for_chat: {
        Args: never
        Returns: {
          email: string
          full_name: string
          role: string
          user_id: string
        }[]
      }
      get_lawyers_and_juniors: {
        Args: never
        Returns: {
          email: string
          full_name: string
          role: string
          user_id: string
        }[]
      }
      get_notification_statistics: {
        Args: { p_days?: number; p_firm_id: string }
        Returns: Json
      }
      get_profile_by_id: {
        Args: { user_id: string }
        Returns: {
          full_name: string
          id: string
          role: string
        }[]
      }
      get_recent_notification_activity: {
        Args: { p_firm_id: string; p_limit?: number }
        Returns: {
          category: string
          created_at: string
          id: string
          message: string
          priority: string
          read: boolean
          recipient_name: string
          title: string
        }[]
      }
      get_security_metrics: {
        Args: never
        Returns: {
          metric: string
          timeframe: string
          value: number
        }[]
      }
      get_security_summary: {
        Args: never
        Returns: {
          last_updated: string
          metric_name: string
          metric_value: number
          risk_level: string
        }[]
      }
      get_system_timestamp: { Args: never; Returns: string }
      get_top_notification_recipients: {
        Args: { p_firm_id: string; p_limit?: number }
        Returns: {
          full_name: string
          read_rate: number
          total_received: number
          unread_count: number
          user_id: string
        }[]
      }
      get_user_firm_id_from_team: { Args: never; Returns: string }
      get_user_firms: { Args: { user_id: string }; Returns: string[] }
      get_user_id_by_email: { Args: { user_email: string }; Returns: string }
      get_user_profile: {
        Args: { user_id: string }
        Returns: {
          accepting_clients: boolean
          address: string
          availability: Json
          bar_registration: string
          bio: string
          court_affiliations: string
          date_of_birth: string
          email: string
          experience_years: number
          full_name: string
          gender: string
          id: string
          jurisdiction: string
          languages: string
          linkedin: string
          location: string
          notification_email: boolean
          notification_sms: boolean
          other_links: string
          phone: string
          pin_code: string
          profile_pic: string
          role: string
          specializations: string
          website: string
        }[]
      }
      get_user_role: { Args: { user_id: string }; Returns: string }
      get_user_team_role_secure: { Args: never; Returns: string }
      has_admin_access: { Args: never; Returns: boolean }
      has_case_access: { Args: { case_id: string }; Returns: boolean }
      http_post:
        | {
            Args: { content_type: string; payload: Json; url: string }
            Returns: undefined
          }
        | { Args: { payload: Json; url: string }; Returns: undefined }
      is_admin: { Args: { user_id: string }; Returns: boolean }
      is_admin_or_lawyer: { Args: never; Returns: boolean }
      is_assigned_to_hearing: { Args: { hearing_id: string }; Returns: boolean }
      is_current_user_active_member: { Args: never; Returns: boolean }
      is_current_user_admin_in_firm: { Args: never; Returns: boolean }
      is_current_user_admin_safe: { Args: never; Returns: boolean }
      is_lawyer: { Args: { user_id: string }; Returns: boolean }
      is_office_staff: { Args: { user_id: string }; Returns: boolean }
      is_participant: {
        Args: { p_thread_id: string; p_user_id: string }
        Returns: boolean
      }
      is_super_admin: { Args: { user_id: string }; Returns: boolean }
      is_task_creator: {
        Args: { task_id: string; user_id: string }
        Returns: boolean
      }
      normalize_timestamp: {
        Args: { input_timestamp: string }
        Returns: string
      }
      process_google_calendar_sync_queue: { Args: never; Returns: undefined }
      process_sync_queue_manually: {
        Args: { user_id_param?: string }
        Returns: Json
      }
      security_health_check: {
        Args: never
        Returns: {
          check_name: string
          details: string
          status: string
        }[]
      }
      send_appointment_reminders: { Args: never; Returns: undefined }
      send_hearing_reminders: { Args: never; Returns: undefined }
      send_task_reminders: { Args: never; Returns: undefined }
      set_super_admin_role: { Args: { user_id: string }; Returns: undefined }
      trigger_legal_news_fetch: { Args: never; Returns: undefined }
      trigger_sync_queue_processing: { Args: never; Returns: Json }
      update_law_firm_license_count: {
        Args: { firm_id: string; new_license_count: number }
        Returns: undefined
      }
      update_law_firm_status: {
        Args: { firm_id: string; new_status: string }
        Returns: undefined
      }
      update_profile_picture: {
        Args: { profile_pic_url: string; user_id: string }
        Returns: undefined
      }
      update_user_profile: {
        Args: {
          accepting_clients?: boolean
          address?: string
          availability?: Json
          bar_registration?: string
          bio?: string
          court_affiliations?: string
          date_of_birth?: string
          experience_years?: number
          full_name?: string
          gender?: string
          jurisdiction?: string
          languages?: string
          linkedin?: string
          location?: string
          notification_email?: boolean
          notification_sms?: boolean
          other_links?: string
          phone?: string
          pin_code?: string
          profile_pic?: string
          role?: string
          specializations?: string
          user_id: string
          username?: string
          website?: string
        }
        Returns: undefined
      }
      upsert_legalkart_case_data:
        | {
            Args: {
              p_case_data?: Json
              p_case_id?: string
              p_cnr_number: string
              p_documents?: Json
              p_firm_id: string
              p_history?: Json
              p_objections?: Json
              p_orders?: Json
            }
            Returns: string
          }
        | {
            Args: {
              p_case_data?: Json
              p_case_id?: string
              p_cnr_number: string
              p_documents?: Json
              p_firm_id: string
              p_history?: Json
              p_ia_details?: Json
              p_objections?: Json
              p_orders?: Json
              p_petitioners?: Json
              p_respondents?: Json
            }
            Returns: string
          }
      user_has_case_access: {
        Args: { case_id: string; user_id: string }
        Returns: boolean
      }
      users_in_same_firm: {
        Args: { user_id_1: string; user_id_2: string }
        Returns: boolean
      }
      validate_security_setup: {
        Args: never
        Returns: {
          check_name: string
          details: string
          status: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "super_admin"
      appointment_status: "pending" | "confirmed" | "cancelled" | "completed"
      appointment_type: "in-person" | "call" | "video-call" | "other"
      case_by_against_enum: "by" | "against"
      case_priority_enum: "low" | "medium" | "high"
      case_stage: "new" | "hearing" | "judgment" | "closed"
      case_status_enum:
        | "open"
        | "in_court"
        | "on_hold"
        | "closed"
        | "pending"
        | "disposed"
      case_type_enum:
        | "civil"
        | "criminal"
        | "corporate"
        | "family"
        | "tax"
        | "labor"
        | "intellectual_property"
        | "real_estate"
        | "immigration"
        | "constitutional"
        | "other"
      client_category: "vip" | "regular" | "new"
      client_source: "referral" | "website" | "advertisement" | "walk_in"
      client_status: "lead" | "ongoing" | "payment_pending" | "closed"
      client_status_enum: "active" | "inactive" | "lead" | "prospect" | "new"
      client_type: "individual" | "company" | "organization"
      firm_status: "active" | "suspended" | "pending"
      hearing_status: "scheduled" | "adjourned" | "completed" | "cancelled"
      hearing_type:
        | "preliminary"
        | "bail"
        | "arguments"
        | "order"
        | "judgment"
        | "evidence"
        | "cross_examination"
        | "other"
      identification_type: "aadhaar" | "pan" | "passport" | "gst" | "other"
      industry_type:
        | "manufacturing"
        | "services"
        | "real_estate"
        | "technology"
        | "healthcare"
        | "retail"
        | "other"
      invoice_status_enum: "draft" | "sent" | "paid" | "overdue" | "cancelled"
      notification_event_type:
        | "case_created"
        | "case_updated"
        | "case_status_changed"
        | "case_closed"
        | "case_assigned"
        | "hearing_scheduled"
        | "hearing_updated"
        | "hearing_reminder"
        | "hearing_cancelled"
        | "document_uploaded"
        | "document_deleted"
        | "document_shared"
        | "invoice_created"
        | "invoice_paid"
        | "invoice_overdue"
        | "invoice_reminder"
        | "message_received"
        | "message_mention"
        | "user_added"
        | "role_changed"
        | "security_alert"
        | "client"
        | "appointment"
      pipeline_type: "litigation" | "advisory" | "corporate" | "regulatory"
      task_priority: "low" | "medium" | "high" | "critical"
      task_status: "todo" | "in_progress" | "completed"
      team_member_status: "active" | "invited" | "suspended" | "pending"
      team_role_enum:
        | "lawyer"
        | "junior"
        | "paralegal"
        | "admin"
        | "office_staff"
        | "receptionist"
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
      app_role: ["admin", "moderator", "user", "super_admin"],
      appointment_status: ["pending", "confirmed", "cancelled", "completed"],
      appointment_type: ["in-person", "call", "video-call", "other"],
      case_by_against_enum: ["by", "against"],
      case_priority_enum: ["low", "medium", "high"],
      case_stage: ["new", "hearing", "judgment", "closed"],
      case_status_enum: [
        "open",
        "in_court",
        "on_hold",
        "closed",
        "pending",
        "disposed",
      ],
      case_type_enum: [
        "civil",
        "criminal",
        "corporate",
        "family",
        "tax",
        "labor",
        "intellectual_property",
        "real_estate",
        "immigration",
        "constitutional",
        "other",
      ],
      client_category: ["vip", "regular", "new"],
      client_source: ["referral", "website", "advertisement", "walk_in"],
      client_status: ["lead", "ongoing", "payment_pending", "closed"],
      client_status_enum: ["active", "inactive", "lead", "prospect", "new"],
      client_type: ["individual", "company", "organization"],
      firm_status: ["active", "suspended", "pending"],
      hearing_status: ["scheduled", "adjourned", "completed", "cancelled"],
      hearing_type: [
        "preliminary",
        "bail",
        "arguments",
        "order",
        "judgment",
        "evidence",
        "cross_examination",
        "other",
      ],
      identification_type: ["aadhaar", "pan", "passport", "gst", "other"],
      industry_type: [
        "manufacturing",
        "services",
        "real_estate",
        "technology",
        "healthcare",
        "retail",
        "other",
      ],
      invoice_status_enum: ["draft", "sent", "paid", "overdue", "cancelled"],
      notification_event_type: [
        "case_created",
        "case_updated",
        "case_status_changed",
        "case_closed",
        "case_assigned",
        "hearing_scheduled",
        "hearing_updated",
        "hearing_reminder",
        "hearing_cancelled",
        "document_uploaded",
        "document_deleted",
        "document_shared",
        "invoice_created",
        "invoice_paid",
        "invoice_overdue",
        "invoice_reminder",
        "message_received",
        "message_mention",
        "user_added",
        "role_changed",
        "security_alert",
        "client",
        "appointment",
      ],
      pipeline_type: ["litigation", "advisory", "corporate", "regulatory"],
      task_priority: ["low", "medium", "high", "critical"],
      task_status: ["todo", "in_progress", "completed"],
      team_member_status: ["active", "invited", "suspended", "pending"],
      team_role_enum: [
        "lawyer",
        "junior",
        "paralegal",
        "admin",
        "office_staff",
        "receptionist",
      ],
    },
  },
} as const
