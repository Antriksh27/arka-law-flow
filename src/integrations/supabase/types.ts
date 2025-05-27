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
      appointments: {
        Row: {
          client_id: string | null
          created_at: string | null
          created_by: string | null
          document_url: string | null
          duration_minutes: number
          end_time: string | null
          id: string
          is_visible_to_team: boolean | null
          lawyer_id: string | null
          location: string | null
          matter_id: string | null
          notes: string | null
          reminder_minutes: number | null
          start_time: string
          status: string | null
          type: Database["public"]["Enums"]["appointment_type"]
        }
        Insert: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          document_url?: string | null
          duration_minutes: number
          end_time?: string | null
          id?: string
          is_visible_to_team?: boolean | null
          lawyer_id?: string | null
          location?: string | null
          matter_id?: string | null
          notes?: string | null
          reminder_minutes?: number | null
          start_time: string
          status?: string | null
          type: Database["public"]["Enums"]["appointment_type"]
        }
        Update: {
          client_id?: string | null
          created_at?: string | null
          created_by?: string | null
          document_url?: string | null
          duration_minutes?: number
          end_time?: string | null
          id?: string
          is_visible_to_team?: boolean | null
          lawyer_id?: string | null
          location?: string | null
          matter_id?: string | null
          notes?: string | null
          reminder_minutes?: number | null
          start_time?: string
          status?: string | null
          type?: Database["public"]["Enums"]["appointment_type"]
        }
        Relationships: [
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
            foreignKeyName: "appointments_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
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
            referencedRelation: "case_details"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "case_details"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "case_details"
            referencedColumns: ["id"]
          },
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
            referencedRelation: "case_details"
            referencedColumns: ["id"]
          },
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
      cases: {
        Row: {
          acts: string[] | null
          advocate_name: string | null
          assigned_to: string | null
          assigned_users: string[] | null
          case_number: string | null
          case_type: Database["public"]["Enums"]["case_type_enum"] | null
          category: string | null
          client_id: string | null
          closing_date: string | null
          cnr_number: string | null
          coram: string | null
          court: string | null
          created_at: string
          created_by: string | null
          description: string | null
          district: string | null
          docket_number: string | null
          fetch_message: string | null
          fetch_status: string | null
          fetched_data: Json | null
          filing_date: string | null
          filing_number: string | null
          firm_id: string | null
          id: string
          is_auto_fetched: boolean | null
          next_hearing_date: string | null
          objection: string | null
          order_link: string | null
          orders: string[] | null
          petitioner: string | null
          petitioner_advocate: string | null
          priority: Database["public"]["Enums"]["case_priority_enum"] | null
          registration_date: string | null
          registration_number: string | null
          respondent: string | null
          respondent_advocate: string | null
          status: Database["public"]["Enums"]["case_status_enum"] | null
          tags: string[] | null
          team_name: string | null
          title: string
          updated_at: string
        }
        Insert: {
          acts?: string[] | null
          advocate_name?: string | null
          assigned_to?: string | null
          assigned_users?: string[] | null
          case_number?: string | null
          case_type?: Database["public"]["Enums"]["case_type_enum"] | null
          category?: string | null
          client_id?: string | null
          closing_date?: string | null
          cnr_number?: string | null
          coram?: string | null
          court?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          district?: string | null
          docket_number?: string | null
          fetch_message?: string | null
          fetch_status?: string | null
          fetched_data?: Json | null
          filing_date?: string | null
          filing_number?: string | null
          firm_id?: string | null
          id?: string
          is_auto_fetched?: boolean | null
          next_hearing_date?: string | null
          objection?: string | null
          order_link?: string | null
          orders?: string[] | null
          petitioner?: string | null
          petitioner_advocate?: string | null
          priority?: Database["public"]["Enums"]["case_priority_enum"] | null
          registration_date?: string | null
          registration_number?: string | null
          respondent?: string | null
          respondent_advocate?: string | null
          status?: Database["public"]["Enums"]["case_status_enum"] | null
          tags?: string[] | null
          team_name?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          acts?: string[] | null
          advocate_name?: string | null
          assigned_to?: string | null
          assigned_users?: string[] | null
          case_number?: string | null
          case_type?: Database["public"]["Enums"]["case_type_enum"] | null
          category?: string | null
          client_id?: string | null
          closing_date?: string | null
          cnr_number?: string | null
          coram?: string | null
          court?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          district?: string | null
          docket_number?: string | null
          fetch_message?: string | null
          fetch_status?: string | null
          fetched_data?: Json | null
          filing_date?: string | null
          filing_number?: string | null
          firm_id?: string | null
          id?: string
          is_auto_fetched?: boolean | null
          next_hearing_date?: string | null
          objection?: string | null
          order_link?: string | null
          orders?: string[] | null
          petitioner?: string | null
          petitioner_advocate?: string | null
          priority?: Database["public"]["Enums"]["case_priority_enum"] | null
          registration_date?: string | null
          registration_number?: string | null
          respondent?: string | null
          respondent_advocate?: string | null
          status?: Database["public"]["Enums"]["case_status_enum"] | null
          tags?: string[] | null
          team_name?: string | null
          title?: string
          updated_at?: string
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
      clients: {
        Row: {
          aadhaar_no: string | null
          address: string | null
          appointment_date: string | null
          assigned_lawyer_id: string | null
          case_ref: string | null
          city: string | null
          client_portal_enabled: boolean | null
          created_at: string | null
          created_by: string | null
          email: string | null
          firm_id: string | null
          full_name: string
          id: string
          notes: string | null
          organization: string | null
          phone: string | null
          services: string[] | null
          source: string | null
          status: Database["public"]["Enums"]["client_status_enum"] | null
          total_billed_amount: number | null
          type: string | null
        }
        Insert: {
          aadhaar_no?: string | null
          address?: string | null
          appointment_date?: string | null
          assigned_lawyer_id?: string | null
          case_ref?: string | null
          city?: string | null
          client_portal_enabled?: boolean | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          firm_id?: string | null
          full_name: string
          id?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          services?: string[] | null
          source?: string | null
          status?: Database["public"]["Enums"]["client_status_enum"] | null
          total_billed_amount?: number | null
          type?: string | null
        }
        Update: {
          aadhaar_no?: string | null
          address?: string | null
          appointment_date?: string | null
          assigned_lawyer_id?: string | null
          case_ref?: string | null
          city?: string | null
          client_portal_enabled?: boolean | null
          created_at?: string | null
          created_by?: string | null
          email?: string | null
          firm_id?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          organization?: string | null
          phone?: string | null
          services?: string[] | null
          source?: string | null
          status?: Database["public"]["Enums"]["client_status_enum"] | null
          total_billed_amount?: number | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_assigned_lawyer_id_fkey"
            columns: ["assigned_lawyer_id"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "clients_assigned_lawyer_id_fkey"
            columns: ["assigned_lawyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
      court_hearings: {
        Row: {
          courtroom: string | null
          created_at: string | null
          end_time: string | null
          hearing_date: string
          id: string
          judge_name: string | null
          lawyer_id: string | null
          matter_id: string | null
          notes: string | null
          start_time: string
          status: string | null
        }
        Insert: {
          courtroom?: string | null
          created_at?: string | null
          end_time?: string | null
          hearing_date: string
          id?: string
          judge_name?: string | null
          lawyer_id?: string | null
          matter_id?: string | null
          notes?: string | null
          start_time: string
          status?: string | null
        }
        Update: {
          courtroom?: string | null
          created_at?: string | null
          end_time?: string | null
          hearing_date?: string
          id?: string
          judge_name?: string | null
          lawyer_id?: string | null
          matter_id?: string | null
          notes?: string | null
          start_time?: string
          status?: string | null
        }
        Relationships: [
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
          {
            foreignKeyName: "court_hearings_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          case_id: string | null
          client_id: string | null
          description: string | null
          file_name: string
          file_size: number | null
          file_type: string | null
          file_url: string
          firm_id: string | null
          folder_name: string | null
          id: string
          is_evidence: boolean | null
          is_shared_with_client: boolean | null
          matter_id: string | null
          title: string | null
          uploaded_at: string | null
          uploaded_by: string | null
        }
        Insert: {
          case_id?: string | null
          client_id?: string | null
          description?: string | null
          file_name: string
          file_size?: number | null
          file_type?: string | null
          file_url: string
          firm_id?: string | null
          folder_name?: string | null
          id?: string
          is_evidence?: boolean | null
          is_shared_with_client?: boolean | null
          matter_id?: string | null
          title?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Update: {
          case_id?: string | null
          client_id?: string | null
          description?: string | null
          file_name?: string
          file_size?: number | null
          file_type?: string | null
          file_url?: string
          firm_id?: string | null
          folder_name?: string | null
          id?: string
          is_evidence?: boolean | null
          is_shared_with_client?: boolean | null
          matter_id?: string | null
          title?: string | null
          uploaded_at?: string | null
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "case_details"
            referencedColumns: ["id"]
          },
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
            foreignKeyName: "documents_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
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
      hearings: {
        Row: {
          assigned_to: string | null
          case_id: string | null
          court_name: string
          created_at: string
          created_by: string | null
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
          case_id?: string | null
          court_name: string
          created_at?: string
          created_by?: string | null
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
          case_id?: string | null
          court_name?: string
          created_at?: string
          created_by?: string | null
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
            referencedRelation: "case_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hearings_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "cases"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          case_id: string | null
          client_id: string
          created_at: string
          created_by: string | null
          due_date: string
          id: string
          invoice_number: string
          issue_date: string
          payment_url: string | null
          status: Database["public"]["Enums"]["invoice_status"]
        }
        Insert: {
          amount: number
          case_id?: string | null
          client_id: string
          created_at?: string
          created_by?: string | null
          due_date: string
          id?: string
          invoice_number: string
          issue_date: string
          payment_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
        }
        Update: {
          amount?: number
          case_id?: string | null
          client_id?: string
          created_at?: string
          created_by?: string | null
          due_date?: string
          id?: string
          invoice_number?: string
          issue_date?: string
          payment_url?: string | null
          status?: Database["public"]["Enums"]["invoice_status"]
        }
        Relationships: [
          {
            foreignKeyName: "invoices_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "case_details"
            referencedColumns: ["id"]
          },
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
      matters: {
        Row: {
          case_number: string | null
          client_id: string | null
          court_name: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          id: string
          lawyer_id: string | null
          status: string
          title: string
          type: string | null
        }
        Insert: {
          case_number?: string | null
          client_id?: string | null
          court_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          lawyer_id?: string | null
          status?: string
          title: string
          type?: string | null
        }
        Update: {
          case_number?: string | null
          client_id?: string | null
          court_name?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          id?: string
          lawyer_id?: string | null
          status?: string
          title?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matters_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "client_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matters_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "matters_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "matters_lawyer_id_fkey"
            columns: ["lawyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
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
            referencedRelation: "case_details"
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
          created_at: string | null
          id: string
          matter_id: string | null
          note: string
        }
        Insert: {
          author_id?: string | null
          created_at?: string | null
          id?: string
          matter_id?: string | null
          note: string
        }
        Update: {
          author_id?: string | null
          created_at?: string | null
          id?: string
          matter_id?: string | null
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
            foreignKeyName: "notes_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      notes_v2: {
        Row: {
          appointment_id: string | null
          case_id: string | null
          client_id: string | null
          color: string | null
          content: string | null
          created_at: string
          created_by: string
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
          case_id?: string | null
          client_id?: string | null
          color?: string | null
          content?: string | null
          created_at?: string
          created_by?: string
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
          case_id?: string | null
          client_id?: string | null
          color?: string | null
          content?: string | null
          created_at?: string
          created_by?: string
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
            referencedRelation: "appointments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notes_v2_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "case_details"
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
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          notification_type: string | null
          read: boolean | null
          recipient_id: string | null
          reference_id: string | null
          title: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          notification_type?: string | null
          read?: boolean | null
          recipient_id?: string | null
          reference_id?: string | null
          title: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          notification_type?: string | null
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
          client_id: string | null
          created_by: string | null
          id: string
          matter_id: string | null
          mode: string | null
          notes: string | null
          status: string
          timestamp: string | null
          transaction_id: string | null
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_by?: string | null
          id?: string
          matter_id?: string | null
          mode?: string | null
          notes?: string | null
          status?: string
          timestamp?: string | null
          transaction_id?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_by?: string | null
          id?: string
          matter_id?: string | null
          mode?: string | null
          notes?: string | null
          status?: string
          timestamp?: string | null
          transaction_id?: string | null
        }
        Relationships: [
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
          {
            foreignKeyName: "payments_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
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
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          end_time: string | null
          firm_id: string | null
          id: string
          matter_id: string | null
          priority: Database["public"]["Enums"]["task_priority"] | null
          start_time: string | null
          status: Database["public"]["Enums"]["task_status"] | null
          tags: string[] | null
          title: string
          updated_at: string | null
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          end_time?: string | null
          firm_id?: string | null
          id?: string
          matter_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["task_status"] | null
          tags?: string[] | null
          title: string
          updated_at?: string | null
        }
        Update: {
          assigned_to?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          end_time?: string | null
          firm_id?: string | null
          id?: string
          matter_id?: string | null
          priority?: Database["public"]["Enums"]["task_priority"] | null
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
          {
            foreignKeyName: "tasks_matter_id_fkey"
            columns: ["matter_id"]
            isOneToOne: false
            referencedRelation: "matters"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          added_by: string | null
          created_at: string | null
          email: string
          firm_id: string
          full_name: string
          id: string
          joined_at: string | null
          phone_number: string | null
          role: Database["public"]["Enums"]["team_member_role"]
          status: Database["public"]["Enums"]["team_member_status"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          added_by?: string | null
          created_at?: string | null
          email: string
          firm_id: string
          full_name: string
          id?: string
          joined_at?: string | null
          phone_number?: string | null
          role: Database["public"]["Enums"]["team_member_role"]
          status?: Database["public"]["Enums"]["team_member_status"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          added_by?: string | null
          created_at?: string | null
          email?: string
          firm_id?: string
          full_name?: string
          id?: string
          joined_at?: string | null
          phone_number?: string | null
          role?: Database["public"]["Enums"]["team_member_role"]
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
    }
    Views: {
      _update_license_count: {
        Row: {
          firm_id: string | null
          id: string | null
          new_license_count: number | null
        }
        Relationships: []
      }
      case_details: {
        Row: {
          acts: string[] | null
          advocate_name: string | null
          assigned_to: string | null
          assigned_users: string[] | null
          case_number: string | null
          case_type: Database["public"]["Enums"]["case_type_enum"] | null
          category: string | null
          client_id: string | null
          client_name: string | null
          closing_date: string | null
          cnr_number: string | null
          coram: string | null
          court: string | null
          created_at: string | null
          created_by: string | null
          created_by_name: string | null
          description: string | null
          district: string | null
          docket_number: string | null
          document_count: number | null
          fetch_message: string | null
          fetch_status: string | null
          fetched_data: Json | null
          filing_date: string | null
          filing_number: string | null
          firm_id: string | null
          hearing_count: number | null
          id: string | null
          is_auto_fetched: boolean | null
          next_hearing_date: string | null
          objection: string | null
          order_link: string | null
          orders: string[] | null
          petitioner: string | null
          petitioner_advocate: string | null
          priority: Database["public"]["Enums"]["case_priority_enum"] | null
          registration_date: string | null
          registration_number: string | null
          respondent: string | null
          respondent_advocate: string | null
          status: Database["public"]["Enums"]["case_status_enum"] | null
          tags: string[] | null
          task_count: number | null
          team_name: string | null
          title: string | null
          updated_at: string | null
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
      client_stats: {
        Row: {
          active_case_count: number | null
          assigned_lawyer_id: string | null
          assigned_lawyer_name: string | null
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
            foreignKeyName: "clients_assigned_lawyer_id_fkey"
            columns: ["assigned_lawyer_id"]
            isOneToOne: false
            referencedRelation: "firm_statistics"
            referencedColumns: ["admin_id"]
          },
          {
            foreignKeyName: "clients_assigned_lawyer_id_fkey"
            columns: ["assigned_lawyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
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
    }
    Functions: {
      can_assign_to_role: {
        Args: { assigner_id: string; assignee_id: string }
        Returns: boolean
      }
      can_cancel_invoice: {
        Args: { user_id: string }
        Returns: boolean
      }
      can_edit_task: {
        Args: { user_id: string; task_id: string }
        Returns: boolean
      }
      can_view_task: {
        Args: { user_id: string; task_id: string }
        Returns: boolean
      }
      check_if_super_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      check_user_in_firm: {
        Args: { user_id: string; firm_id: string }
        Returns: boolean
      }
      check_username_availability: {
        Args: { input_username: string; current_user_id: string }
        Returns: {
          available: boolean
        }[]
      }
      client_has_case_access: {
        Args: { case_id: string }
        Returns: boolean
      }
      create_law_firm_with_admin: {
        Args:
          | {
              firm_name: string
              firm_address: string
              admin_email: string
              admin_full_name: string
            }
          | {
              firm_name: string
              firm_address: string
              admin_email: string
              admin_full_name: string
              admin_password: string
            }
          | {
              firm_name: string
              firm_address: string
              admin_email: string
              admin_full_name: string
              created_by?: string
            }
        Returns: string
      }
      get_all_lawyers_and_admin: {
        Args: Record<PropertyKey, never>
        Returns: {
          id: string
          full_name: string
          role: string
        }[]
      }
      get_profile_by_id: {
        Args: { user_id: string }
        Returns: {
          id: string
          full_name: string
          role: string
        }[]
      }
      get_user_firms: {
        Args: { user_id: string }
        Returns: string[]
      }
      get_user_id_by_email: {
        Args: { user_email: string }
        Returns: string
      }
      get_user_profile: {
        Args: { user_id: string }
        Returns: {
          id: string
          full_name: string
          email: string
          phone: string
          role: string
          profile_pic: string
          date_of_birth: string
          gender: string
          bar_registration: string
          experience_years: number
          specializations: string
          bio: string
          languages: string
          availability: Json
          address: string
          location: string
          website: string
          linkedin: string
          other_links: string
          notification_email: boolean
          notification_sms: boolean
          accepting_clients: boolean
          jurisdiction: string
          court_affiliations: string
          pin_code: string
        }[]
      }
      get_user_role: {
        Args: { user_id: string }
        Returns: string
      }
      has_case_access: {
        Args: { case_id: string }
        Returns: boolean
      }
      is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_admin_or_lawyer: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      is_assigned_to_hearing: {
        Args: { hearing_id: string }
        Returns: boolean
      }
      is_lawyer: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_super_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      is_task_creator: {
        Args: { user_id: string; task_id: string }
        Returns: boolean
      }
      set_super_admin_role: {
        Args: { user_id: string }
        Returns: undefined
      }
      update_law_firm_license_count: {
        Args: { firm_id: string; new_license_count: number }
        Returns: undefined
      }
      update_law_firm_status: {
        Args: { firm_id: string; new_status: string }
        Returns: undefined
      }
      update_profile_picture: {
        Args: { user_id: string; profile_pic_url: string }
        Returns: undefined
      }
      update_user_profile: {
        Args: {
          user_id: string
          full_name?: string
          phone?: string
          date_of_birth?: string
          gender?: string
          role?: string
          bar_registration?: string
          experience_years?: number
          specializations?: string
          bio?: string
          address?: string
          location?: string
          pin_code?: string
          jurisdiction?: string
          court_affiliations?: string
          availability?: Json
          notification_email?: boolean
          notification_sms?: boolean
          accepting_clients?: boolean
          website?: string
          linkedin?: string
          other_links?: string
          languages?: string
          profile_pic?: string
          username?: string
        }
        Returns: undefined
      }
      user_has_case_access: {
        Args: { user_id: string; case_id: string }
        Returns: boolean
      }
      users_in_same_firm: {
        Args: { user_id_1: string; user_id_2: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "super_admin"
      appointment_status: "pending" | "confirmed" | "cancelled" | "completed"
      appointment_type: "in-person" | "call" | "video-call" | "other"
      case_priority_enum: "low" | "medium" | "high"
      case_stage: "new" | "hearing" | "judgment" | "closed"
      case_status_enum: "open" | "in_court" | "on_hold" | "closed"
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
      client_status_enum: "active" | "inactive" | "lead" | "prospect"
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
      invoice_status: "unpaid" | "paid" | "overdue" | "cancelled"
      pipeline_type: "litigation" | "advisory" | "corporate" | "regulatory"
      task_priority: "low" | "medium" | "high"
      task_status: "todo" | "in_progress" | "completed"
      team_member_role:
        | "lawyer"
        | "junior"
        | "paralegal"
        | "admin"
        | "office_staff"
      team_member_status: "active" | "invited" | "suspended"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user", "super_admin"],
      appointment_status: ["pending", "confirmed", "cancelled", "completed"],
      appointment_type: ["in-person", "call", "video-call", "other"],
      case_priority_enum: ["low", "medium", "high"],
      case_stage: ["new", "hearing", "judgment", "closed"],
      case_status_enum: ["open", "in_court", "on_hold", "closed"],
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
      client_status_enum: ["active", "inactive", "lead", "prospect"],
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
      invoice_status: ["unpaid", "paid", "overdue", "cancelled"],
      pipeline_type: ["litigation", "advisory", "corporate", "regulatory"],
      task_priority: ["low", "medium", "high"],
      task_status: ["todo", "in_progress", "completed"],
      team_member_role: [
        "lawyer",
        "junior",
        "paralegal",
        "admin",
        "office_staff",
      ],
      team_member_status: ["active", "invited", "suspended"],
    },
  },
} as const
