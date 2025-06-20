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
      admin_config: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
      }
      api_keys: {
        Row: {
          created_at: string | null
          domains: string[] | null
          id: string
          is_active: boolean | null
          key: string
          key_hash: string | null
          last_used_at: string | null
          name: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          domains?: string[] | null
          id?: string
          is_active?: boolean | null
          key: string
          key_hash?: string | null
          last_used_at?: string | null
          name: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          domains?: string[] | null
          id?: string
          is_active?: boolean | null
          key?: string
          key_hash?: string | null
          last_used_at?: string | null
          name?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      audit_run_pages: {
        Row: {
          audit_run_id: string | null
          discovered_at: string | null
          id: string
          page_id: string | null
        }
        Insert: {
          audit_run_id?: string | null
          discovered_at?: string | null
          id?: string
          page_id?: string | null
        }
        Update: {
          audit_run_id?: string | null
          discovered_at?: string | null
          id?: string
          page_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "audit_run_pages_audit_run_id_fkey"
            columns: ["audit_run_id"]
            isOneToOne: false
            referencedRelation: "audit_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "audit_run_pages_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_runs: {
        Row: {
          average_aeo_score: number | null
          completed_at: string | null
          crawl_depth: number | null
          created_at: string | null
          critical_issues: number | null
          description: string | null
          id: string
          info_issues: number | null
          max_pages: number | null
          name: string
          pages_analyzed: number | null
          started_at: string | null
          status: string | null
          target_urls: string[]
          total_issues: number | null
          total_recommendations: number | null
          updated_at: string | null
          user_id: string | null
          warning_issues: number | null
        }
        Insert: {
          average_aeo_score?: number | null
          completed_at?: string | null
          crawl_depth?: number | null
          created_at?: string | null
          critical_issues?: number | null
          description?: string | null
          id?: string
          info_issues?: number | null
          max_pages?: number | null
          name: string
          pages_analyzed?: number | null
          started_at?: string | null
          status?: string | null
          target_urls: string[]
          total_issues?: number | null
          total_recommendations?: number | null
          updated_at?: string | null
          user_id?: string | null
          warning_issues?: number | null
        }
        Update: {
          average_aeo_score?: number | null
          completed_at?: string | null
          crawl_depth?: number | null
          created_at?: string | null
          critical_issues?: number | null
          description?: string | null
          id?: string
          info_issues?: number | null
          max_pages?: number | null
          name?: string
          pages_analyzed?: number | null
          started_at?: string | null
          status?: string | null
          target_urls?: string[]
          total_issues?: number | null
          total_recommendations?: number | null
          updated_at?: string | null
          user_id?: string | null
          warning_issues?: number | null
        }
        Relationships: []
      }
      companies: {
        Row: {
          company_name: string
          id: string
          inserted_at: string
          root_url: string
          submitted_by: string
          updated_at: string
        }
        Insert: {
          company_name: string
          id?: string
          inserted_at?: string
          root_url: string
          submitted_by: string
          updated_at?: string
        }
        Update: {
          company_name?: string
          id?: string
          inserted_at?: string
          root_url?: string
          submitted_by?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "companies_submitted_by_fkey"
            columns: ["submitted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      crawler_stats_daily: {
        Row: {
          avg_response_time_ms: number | null
          countries: Json | null
          crawler_company: string
          crawler_name: string
          date: string
          domain: string
          id: string
          paths: Json | null
          unique_paths: number | null
          user_id: string | null
          visit_count: number | null
        }
        Insert: {
          avg_response_time_ms?: number | null
          countries?: Json | null
          crawler_company: string
          crawler_name: string
          date: string
          domain: string
          id?: string
          paths?: Json | null
          unique_paths?: number | null
          user_id?: string | null
          visit_count?: number | null
        }
        Update: {
          avg_response_time_ms?: number | null
          countries?: Json | null
          crawler_company?: string
          crawler_name?: string
          date?: string
          domain?: string
          id?: string
          paths?: Json | null
          unique_paths?: number | null
          user_id?: string | null
          visit_count?: number | null
        }
        Relationships: []
      }
      crawler_visits: {
        Row: {
          country: string | null
          crawler_category: string
          crawler_company: string
          crawler_name: string
          created_at: string | null
          domain: string
          id: string
          metadata: Json | null
          path: string
          response_time_ms: number | null
          status_code: number | null
          timestamp: string
          user_agent: string
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          country?: string | null
          crawler_category: string
          crawler_company: string
          crawler_name: string
          created_at?: string | null
          domain: string
          id?: string
          metadata?: Json | null
          path: string
          response_time_ms?: number | null
          status_code?: number | null
          timestamp: string
          user_agent: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          country?: string | null
          crawler_category?: string
          crawler_company?: string
          crawler_name?: string
          created_at?: string | null
          domain?: string
          id?: string
          metadata?: Json | null
          path?: string
          response_time_ms?: number | null
          status_code?: number | null
          timestamp?: string
          user_agent?: string
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "crawler_visits_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      deleted_record: {
        Row: {
          data: Json
          deleted_at: string
          id: string
          record_id: string
          table_name: string
          updated_at: string
        }
        Insert: {
          data: Json
          deleted_at?: string
          id?: string
          record_id: string
          table_name: string
          updated_at?: string
        }
        Update: {
          data?: Json
          deleted_at?: string
          id?: string
          record_id?: string
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      dismissed_notifications: {
        Row: {
          created_at: string | null
          dismissed_at: string | null
          id: string
          notification_key: string
          notification_type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          notification_key: string
          notification_type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          dismissed_at?: string | null
          id?: string
          notification_key?: string
          notification_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dismissed_notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      edge_alerts: {
        Row: {
          alert_type: string | null
          conditions: Json | null
          created_at: string | null
          id: string
          is_active: boolean | null
          updated_at: string | null
          user_id: string | null
          webhook_url: string
          workspace_id: string | null
        }
        Insert: {
          alert_type?: string | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          webhook_url: string
          workspace_id?: string | null
        }
        Update: {
          alert_type?: string | null
          conditions?: Json | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          webhook_url?: string
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "edge_alerts_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_content: {
        Row: {
          content: string
          content_type: string | null
          created_at: string | null
          id: string
          metadata: Json | null
          published: boolean | null
          quality_tier: string | null
          slug: string
          title: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          content_type?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          published?: boolean | null
          quality_tier?: string | null
          slug: string
          title: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          content_type?: string | null
          created_at?: string | null
          id?: string
          metadata?: Json | null
          published?: boolean | null
          quality_tier?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_content_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      grandfathered_pricing: {
        Row: {
          created_at: string | null
          grandfathered_until: string | null
          id: string
          new_plan: string
          notes: string | null
          old_plan: string
          special_pricing: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          grandfathered_until?: string | null
          id?: string
          new_plan: string
          notes?: string | null
          old_plan: string
          special_pricing?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          grandfathered_until?: string | null
          id?: string
          new_plan?: string
          notes?: string | null
          old_plan?: string
          special_pricing?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      knowledge_base_items: {
        Row: {
          company_id: string | null
          confidence_score: number | null
          content: string
          created_at: string | null
          created_by: string | null
          extraction_batch_id: string | null
          id: string
          source_context: string | null
          tag: string
          updated_at: string | null
          word_count: number | null
          workspace_id: string | null
        }
        Insert: {
          company_id?: string | null
          confidence_score?: number | null
          content: string
          created_at?: string | null
          created_by?: string | null
          extraction_batch_id?: string | null
          id?: string
          source_context?: string | null
          tag: string
          updated_at?: string | null
          word_count?: number | null
          workspace_id?: string | null
        }
        Update: {
          company_id?: string | null
          confidence_score?: number | null
          content?: string
          created_at?: string | null
          created_by?: string | null
          extraction_batch_id?: string | null
          id?: string
          source_context?: string | null
          tag?: string
          updated_at?: string | null
          word_count?: number | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "knowledge_base_items_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "knowledge_base_items_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      page_audit_overview: {
        Row: {
          aeo_score: number | null
          analysis_metadata: Json | null
          analyzed_at: string | null
          category_scores: Json | null
          checklist_items_evaluated: number | null
          checklist_items_passed: number | null
          created_at: string | null
          critical_issues: number | null
          earned_points: number | null
          id: string
          page_id: string | null
          rendering_mode: string | null
          ssr_score_penalty: number | null
          total_issues: number | null
          total_possible_points: number | null
          total_recommendations: number | null
          warning_issues: number | null
          weighted_aeo_score: number | null
        }
        Insert: {
          aeo_score?: number | null
          analysis_metadata?: Json | null
          analyzed_at?: string | null
          category_scores?: Json | null
          checklist_items_evaluated?: number | null
          checklist_items_passed?: number | null
          created_at?: string | null
          critical_issues?: number | null
          earned_points?: number | null
          id?: string
          page_id?: string | null
          rendering_mode?: string | null
          ssr_score_penalty?: number | null
          total_issues?: number | null
          total_possible_points?: number | null
          total_recommendations?: number | null
          warning_issues?: number | null
          weighted_aeo_score?: number | null
        }
        Update: {
          aeo_score?: number | null
          analysis_metadata?: Json | null
          analyzed_at?: string | null
          category_scores?: Json | null
          checklist_items_evaluated?: number | null
          checklist_items_passed?: number | null
          created_at?: string | null
          critical_issues?: number | null
          earned_points?: number | null
          id?: string
          page_id?: string | null
          rendering_mode?: string | null
          ssr_score_penalty?: number | null
          total_issues?: number | null
          total_possible_points?: number | null
          total_recommendations?: number | null
          warning_issues?: number | null
          weighted_aeo_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "page_audit_overview_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: true
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_checklist_results: {
        Row: {
          category: string
          check_id: string
          check_name: string
          created_at: string | null
          details: string | null
          id: string
          page_id: string | null
          passed: boolean
          rule_parameters: Json | null
          weight: number
        }
        Insert: {
          category: string
          check_id: string
          check_name: string
          created_at?: string | null
          details?: string | null
          id?: string
          page_id?: string | null
          passed: boolean
          rule_parameters?: Json | null
          weight: number
        }
        Update: {
          category?: string
          check_id?: string
          check_name?: string
          created_at?: string | null
          details?: string | null
          id?: string
          page_id?: string | null
          passed?: boolean
          rule_parameters?: Json | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "page_checklist_results_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_content: {
        Row: {
          domain: string
          firecrawl_metadata: Json | null
          id: string
          meta_description: string | null
          raw_content: string | null
          raw_html: string | null
          raw_markdown: string | null
          request_id: string | null
          scrape_duration_ms: number | null
          scrape_error: string | null
          scrape_success: boolean | null
          scraped_at: string | null
          title: string | null
          url: string
          word_count: number | null
        }
        Insert: {
          domain: string
          firecrawl_metadata?: Json | null
          id?: string
          meta_description?: string | null
          raw_content?: string | null
          raw_html?: string | null
          raw_markdown?: string | null
          request_id?: string | null
          scrape_duration_ms?: number | null
          scrape_error?: string | null
          scrape_success?: boolean | null
          scraped_at?: string | null
          title?: string | null
          url: string
          word_count?: number | null
        }
        Update: {
          domain?: string
          firecrawl_metadata?: Json | null
          id?: string
          meta_description?: string | null
          raw_content?: string | null
          raw_html?: string | null
          raw_markdown?: string | null
          request_id?: string | null
          scrape_duration_ms?: number | null
          scrape_error?: string | null
          scrape_success?: boolean | null
          scraped_at?: string | null
          title?: string | null
          url?: string
          word_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "page_content_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "snapshot_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      page_issues: {
        Row: {
          category: string
          created_at: string | null
          description: string
          diagnostic: string | null
          fix_priority: number | null
          html_snippet: string | null
          id: string
          impact: string
          page_id: string | null
          rule_parameters: Json | null
          severity: string
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          diagnostic?: string | null
          fix_priority?: number | null
          html_snippet?: string | null
          id?: string
          impact: string
          page_id?: string | null
          rule_parameters?: Json | null
          severity: string
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          diagnostic?: string | null
          fix_priority?: number | null
          html_snippet?: string | null
          id?: string
          impact?: string
          page_id?: string | null
          rule_parameters?: Json | null
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_issues_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      page_recommendations: {
        Row: {
          category: string
          created_at: string | null
          description: string
          effort_level: string
          expected_impact: string
          id: string
          implementation: string
          page_id: string | null
          priority_score: number | null
          title: string
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          effort_level: string
          expected_impact: string
          id?: string
          implementation: string
          page_id?: string | null
          priority_score?: number | null
          title: string
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          effort_level?: string
          expected_impact?: string
          id?: string
          implementation?: string
          page_id?: string | null
          priority_score?: number | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "page_recommendations_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "pages"
            referencedColumns: ["id"]
          },
        ]
      }
      pages: {
        Row: {
          aeo_score: number | null
          ai_optimization_score: number | null
          analysis_metadata: Json | null
          analyzed_at: string | null
          content: string | null
          content_quality_score: number | null
          created_at: string | null
          domain: string
          id: string
          markdown: string | null
          media_accessibility_score: number | null
          meta_description: string | null
          rendering_mode: string | null
          schema_markup_score: number | null
          scraped_at: string | null
          ssr_score_penalty: number | null
          technical_health_score: number | null
          title: string | null
          updated_at: string | null
          url: string
          weighted_aeo_score: number | null
          word_count: number | null
        }
        Insert: {
          aeo_score?: number | null
          ai_optimization_score?: number | null
          analysis_metadata?: Json | null
          analyzed_at?: string | null
          content?: string | null
          content_quality_score?: number | null
          created_at?: string | null
          domain: string
          id?: string
          markdown?: string | null
          media_accessibility_score?: number | null
          meta_description?: string | null
          rendering_mode?: string | null
          schema_markup_score?: number | null
          scraped_at?: string | null
          ssr_score_penalty?: number | null
          technical_health_score?: number | null
          title?: string | null
          updated_at?: string | null
          url: string
          weighted_aeo_score?: number | null
          word_count?: number | null
        }
        Update: {
          aeo_score?: number | null
          ai_optimization_score?: number | null
          analysis_metadata?: Json | null
          analyzed_at?: string | null
          content?: string | null
          content_quality_score?: number | null
          created_at?: string | null
          domain?: string
          id?: string
          markdown?: string | null
          media_accessibility_score?: number | null
          meta_description?: string | null
          rendering_mode?: string | null
          schema_markup_score?: number | null
          scraped_at?: string | null
          ssr_score_penalty?: number | null
          technical_health_score?: number | null
          title?: string | null
          updated_at?: string | null
          url?: string
          weighted_aeo_score?: number | null
          word_count?: number | null
        }
        Relationships: []
      }
      plan_change_notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          message: string | null
          new_plan: string | null
          notification_type: string | null
          old_plan: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          new_plan?: string | null
          notification_type?: string | null
          old_plan?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          message?: string | null
          new_plan?: string | null
          notification_type?: string | null
          old_plan?: string | null
          user_id?: string | null
        }
        Relationships: []
      }

      pricing_migration_backup: {
        Row: {
          id: string | null
          stripe_customer_id: string | null
          subscription_id: string | null
          subscription_plan: string | null
          subscription_status: string | null
        }
        Insert: {
          id?: string | null
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
        }
        Update: {
          id?: string | null
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          billing_preferences: Json | null
          created_at: string | null
          created_by: string
          domain: string | null
          email: string | null
          first_name: string | null
          id: string
          is_admin: boolean | null
          last_articles_reset_at: string | null
          last_name: string | null
          last_scan_reset_at: string | null
          last_snapshot_reset_at: string | null
          max_team_members: number | null
          monthly_articles_used: number | null
          monthly_scans_used: number | null
          monthly_snapshots_used: number | null
          onboarding_completed: boolean | null
          onboarding_completed_at: string | null
          phone_number: string | null
          profile_picture_url: string | null
          stripe_customer_id: string | null
          subscription_id: string | null
          subscription_period_end: string | null
          subscription_plan: string | null
          subscription_status: string | null
          team_size: number | null
          updated_at: string | null
          updated_by: string
          workspace_name: string | null
        }
        Insert: {
          billing_preferences?: Json | null
          created_at?: string | null
          created_by?: string
          domain?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          is_admin?: boolean | null
          last_articles_reset_at?: string | null
          last_name?: string | null
          last_scan_reset_at?: string | null
          last_snapshot_reset_at?: string | null
          max_team_members?: number | null
          monthly_articles_used?: number | null
          monthly_scans_used?: number | null
          monthly_snapshots_used?: number | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone_number?: string | null
          profile_picture_url?: string | null
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_period_end?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          team_size?: number | null
          updated_at?: string | null
          updated_by?: string
          workspace_name?: string | null
        }
        Update: {
          billing_preferences?: Json | null
          created_at?: string | null
          created_by?: string
          domain?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          is_admin?: boolean | null
          last_articles_reset_at?: string | null
          last_name?: string | null
          last_scan_reset_at?: string | null
          last_snapshot_reset_at?: string | null
          max_team_members?: number | null
          monthly_articles_used?: number | null
          monthly_scans_used?: number | null
          monthly_snapshots_used?: number | null
          onboarding_completed?: boolean | null
          onboarding_completed_at?: string | null
          phone_number?: string | null
          profile_picture_url?: string | null
          stripe_customer_id?: string | null
          subscription_id?: string | null
          subscription_period_end?: string | null
          subscription_plan?: string | null
          subscription_status?: string | null
          team_size?: number | null
          updated_at?: string | null
          updated_by?: string
          workspace_name?: string | null
        }
        Relationships: []
      }
      snapshot_questions: {
        Row: {
          id: string
          question: string
          question_number: number
          question_type: string | null
          request_id: string | null
          weight: number | null
        }
        Insert: {
          id?: string
          question: string
          question_number: number
          question_type?: string | null
          request_id?: string | null
          weight?: number | null
        }
        Update: {
          id?: string
          question?: string
          question_number?: number
          question_type?: string | null
          request_id?: string | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "snapshot_questions_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "snapshot_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      snapshot_requests: {
        Row: {
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          last_retry_at: string | null
          locked_at: string | null
          locked_by: string | null
          retry_count: number | null
          status: string | null
          topic: string
          urls: string[]
          user_id: string | null
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          retry_count?: number | null
          status?: string | null
          topic: string
          urls: string[]
          user_id?: string | null
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_retry_at?: string | null
          locked_at?: string | null
          locked_by?: string | null
          retry_count?: number | null
          status?: string | null
          topic?: string
          urls?: string[]
          user_id?: string | null
        }
        Relationships: []
      }
      snapshot_summaries: {
        Row: {
          created_at: string | null
          id: string
          insights: string[] | null
          insights_summary: string | null
          mentions_count: number
          request_id: string | null
          top_competitors: string[] | null
          total_questions: number
          url: string
          visibility_score: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          insights?: string[] | null
          insights_summary?: string | null
          mentions_count: number
          request_id?: string | null
          top_competitors?: string[] | null
          total_questions: number
          url: string
          visibility_score: number
        }
        Update: {
          created_at?: string | null
          id?: string
          insights?: string[] | null
          insights_summary?: string | null
          mentions_count?: number
          request_id?: string | null
          top_competitors?: string[] | null
          total_questions?: number
          url?: string
          visibility_score?: number
        }
        Relationships: [
          {
            foreignKeyName: "snapshot_summaries_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "snapshot_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_add_ons: {
        Row: {
          add_on_type: string
          billing_period_end: string
          billing_period_start: string
          created_at: string | null
          id: string
          quantity: number
          status: string
          stripe_subscription_item_id: string | null
          subscription_usage_id: string | null
          total_price_cents: number
          unit_price_cents: number
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          add_on_type: string
          billing_period_end: string
          billing_period_start: string
          created_at?: string | null
          id?: string
          quantity?: number
          status?: string
          stripe_subscription_item_id?: string | null
          subscription_usage_id?: string | null
          total_price_cents: number
          unit_price_cents: number
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          add_on_type?: string
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string | null
          id?: string
          quantity?: number
          status?: string
          stripe_subscription_item_id?: string | null
          subscription_usage_id?: string | null
          total_price_cents?: number
          unit_price_cents?: number
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_add_ons_subscription_usage_id_fkey"
            columns: ["subscription_usage_id"]
            isOneToOne: false
            referencedRelation: "subscription_usage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_add_ons_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_info: {
        Row: {
          ai_logs_included: number
          ai_logs_used: number | null
          billing_preferences: Json | null
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string
          current_period_start: string
          domains_included: number
          domains_used: number | null
          edge_alerts_enabled: boolean | null
          extra_domains: number | null
          id: string
          plan_status: string
          plan_type: string
          stripe_customer_id: string | null
          stripe_price_id: string | null
          stripe_subscription_id: string | null
          team_members_included: number
          team_members_used: number | null
          trial_end: string | null
          updated_at: string | null
          user_id: string
          workspaces_included: number
          workspaces_used: number | null
        }
        Insert: {
          ai_logs_included?: number
          ai_logs_used?: number | null
          billing_preferences?: Json | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          domains_included?: number
          domains_used?: number | null
          edge_alerts_enabled?: boolean | null
          extra_domains?: number | null
          id?: string
          plan_status?: string
          plan_type?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          team_members_included?: number
          team_members_used?: number | null
          trial_end?: string | null
          updated_at?: string | null
          user_id: string
          workspaces_included?: number
          workspaces_used?: number | null
        }
        Update: {
          ai_logs_included?: number
          ai_logs_used?: number | null
          billing_preferences?: Json | null
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string
          current_period_start?: string
          domains_included?: number
          domains_used?: number | null
          edge_alerts_enabled?: boolean | null
          extra_domains?: number | null
          id?: string
          plan_status?: string
          plan_type?: string
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          stripe_subscription_id?: string | null
          team_members_included?: number
          team_members_used?: number | null
          trial_end?: string | null
          updated_at?: string | null
          user_id?: string
          workspaces_included?: number
          workspaces_used?: number | null
        }
        Relationships: []
      }
      subscription_usage: {
        Row: {
          ai_logs_included: number
          ai_logs_used: number
          article_credits_included: number
          article_credits_purchased: number
          article_credits_used: number
          billing_period_end: string
          billing_period_start: string
          created_at: string | null
          daily_scans_used: number
          domains_included: number
          domains_purchased: number
          domains_used: number
          id: string
          last_overage_warning_sent: string | null
          max_scans_used: number
          next_billing_date: string | null
          overage_amount_cents: number | null
          overage_blocked: boolean | null
          plan_status: string
          plan_type: string
          snapshots_included: number
          snapshots_used: number
          stripe_subscription_id: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          ai_logs_included?: number
          ai_logs_used?: number
          article_credits_included?: number
          article_credits_purchased?: number
          article_credits_used?: number
          billing_period_end: string
          billing_period_start: string
          created_at?: string | null
          daily_scans_used?: number
          domains_included?: number
          domains_purchased?: number
          domains_used?: number
          id?: string
          last_overage_warning_sent?: string | null
          max_scans_used?: number
          next_billing_date?: string | null
          overage_amount_cents?: number | null
          overage_blocked?: boolean | null
          plan_status?: string
          plan_type: string
          snapshots_included?: number
          snapshots_used?: number
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          ai_logs_included?: number
          ai_logs_used?: number
          article_credits_included?: number
          article_credits_purchased?: number
          article_credits_used?: number
          billing_period_end?: string
          billing_period_start?: string
          created_at?: string | null
          daily_scans_used?: number
          domains_included?: number
          domains_purchased?: number
          domains_used?: number
          id?: string
          last_overage_warning_sent?: string | null
          max_scans_used?: number
          next_billing_date?: string | null
          overage_amount_cents?: number | null
          overage_blocked?: boolean | null
          plan_status?: string
          plan_type?: string
          snapshots_included?: number
          snapshots_used?: number
          stripe_subscription_id?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscription_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          accepted_at: string | null
          created_at: string | null
          id: string
          invited_at: string | null
          invited_by: string | null
          role: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string | null
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          role?: string | null
          user_id?: string | null
          workspace_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      usage_events: {
        Row: {
          amount: number | null
          billable: boolean | null
          cost_cents: number | null
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          subscription_usage_id: string | null
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          billable?: boolean | null
          cost_cents?: number | null
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          subscription_usage_id?: string | null
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          billable?: boolean | null
          cost_cents?: number | null
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          subscription_usage_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usage_events_subscription_usage_id_fkey"
            columns: ["subscription_usage_id"]
            isOneToOne: false
            referencedRelation: "subscription_usage"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "usage_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_rate_limits: {
        Row: {
          api_calls_count: number | null
          day: string
          requests_count: number | null
          user_id: string
        }
        Insert: {
          api_calls_count?: number | null
          day?: string
          requests_count?: number | null
          user_id: string
        }
        Update: {
          api_calls_count?: number | null
          day?: string
          requests_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      visibility_results: {
        Row: {
          api_call_duration_ms: number | null
          citation_snippet: string | null
          cited_domains: string[] | null
          competitor_domains: string[] | null
          competitor_names: string[] | null
          id: string
          position: number | null
          question_id: string | null
          question_number: number | null
          question_text: string | null
          question_type: string | null
          question_weight: number | null
          reasoning_summary: string | null
          request_id: string | null
          retry_count: number | null
          search_results_metadata: Json | null
          target_found: boolean
          tested_at: string | null
          top_citations: Json | null
          url: string
        }
        Insert: {
          api_call_duration_ms?: number | null
          citation_snippet?: string | null
          cited_domains?: string[] | null
          competitor_domains?: string[] | null
          competitor_names?: string[] | null
          id?: string
          position?: number | null
          question_id?: string | null
          question_number?: number | null
          question_text?: string | null
          question_type?: string | null
          question_weight?: number | null
          reasoning_summary?: string | null
          request_id?: string | null
          retry_count?: number | null
          search_results_metadata?: Json | null
          target_found: boolean
          tested_at?: string | null
          top_citations?: Json | null
          url: string
        }
        Update: {
          api_call_duration_ms?: number | null
          citation_snippet?: string | null
          cited_domains?: string[] | null
          competitor_domains?: string[] | null
          competitor_names?: string[] | null
          id?: string
          position?: number | null
          question_id?: string | null
          question_number?: number | null
          question_text?: string | null
          question_type?: string | null
          question_weight?: number | null
          reasoning_summary?: string | null
          request_id?: string | null
          retry_count?: number | null
          search_results_metadata?: Json | null
          target_found?: boolean
          tested_at?: string | null
          top_citations?: Json | null
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "visibility_results_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "snapshot_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "visibility_results_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "snapshot_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      waitlist: {
        Row: {
          created_at: string | null
          email: string
          first_name: string
          hosting_platform: string
          id: string
          interests: string[] | null
          last_name: string
          loops_submitted: boolean | null
          loops_submitted_at: string | null
          updated_at: string | null
          website_url: string
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name: string
          hosting_platform: string
          id?: string
          interests?: string[] | null
          last_name: string
          loops_submitted?: boolean | null
          loops_submitted_at?: string | null
          updated_at?: string | null
          website_url: string
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string
          hosting_platform?: string
          id?: string
          interests?: string[] | null
          last_name?: string
          loops_submitted?: boolean | null
          loops_submitted_at?: string | null
          updated_at?: string | null
          website_url?: string
        }
        Relationships: []
      }
      workspace_api_keys: {
        Row: {
          api_key: string
          created_at: string | null
          id: string
          is_active: boolean | null
          key_hash: string
          last_used_at: string | null
          metadata: Json | null
          name: string
          permissions: Json | null
          updated_at: string | null
          workspace_id: string
        }
        Insert: {
          api_key: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash: string
          last_used_at?: string | null
          metadata?: Json | null
          name: string
          permissions?: Json | null
          updated_at?: string | null
          workspace_id: string
        }
        Update: {
          api_key?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          key_hash?: string
          last_used_at?: string | null
          metadata?: Json | null
          name?: string
          permissions?: Json | null
          updated_at?: string | null
          workspace_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workspace_api_keys_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
      workspace_deletion_log: {
        Row: {
          created_at: string | null
          deleted_at: string | null
          domain: string
          id: string
          reason: string | null
          user_id: string
          workspace_id: string
          workspace_name: string
        }
        Insert: {
          created_at?: string | null
          deleted_at?: string | null
          domain: string
          id?: string
          reason?: string | null
          user_id: string
          workspace_id: string
          workspace_name: string
        }
        Update: {
          created_at?: string | null
          deleted_at?: string | null
          domain?: string
          id?: string
          reason?: string | null
          user_id?: string
          workspace_id?: string
          workspace_name?: string
        }
        Relationships: []
      }
      workspaces: {
        Row: {
          created_at: string | null
          domain: string
          favicon_url: string | null
          id: string
          is_primary: boolean | null
          updated_at: string | null
          user_id: string
          workspace_name: string
          workspace_settings: Json | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          favicon_url?: string | null
          id?: string
          is_primary?: boolean | null
          updated_at?: string | null
          user_id: string
          workspace_name: string
          workspace_settings?: Json | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          favicon_url?: string | null
          id?: string
          is_primary?: boolean | null
          updated_at?: string | null
          user_id?: string
          workspace_name?: string
          workspace_settings?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      crawler_analytics: {
        Row: {
          avg_response_time: number | null
          crawler_breakdown: Json | null
          crawler_company: string | null
          date: string | null
          domain: string | null
          total_visits: number | null
          unique_crawlers: number | null
          user_id: string | null
        }
        Relationships: []
      }
      platform_vote_counts: {
        Row: {
          platform_id: string | null
          vote_count: number | null
        }
        Relationships: []
      }
      team_members_with_profiles: {
        Row: {
          accepted_at: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string | null
          invited_at: string | null
          invited_by: string | null
          role: string | null
          user_id: string | null
          workspace_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "team_members_workspace_id_fkey"
            columns: ["workspace_id"]
            isOneToOne: false
            referencedRelation: "workspaces"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      binary_quantize: {
        Args: { "": string } | { "": unknown }
        Returns: unknown
      }
      can_bill_overage: {
        Args: {
          p_user_id: string
          p_overage_cents: number
          p_usage_type?: string
        }
        Returns: boolean
      }
      check_feature_access: {
        Args: { p_user_id: string; p_feature: string }
        Returns: boolean
      }
      check_snapshot_limit: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      claim_next_snapshot: {
        Args: { worker_id: string; lock_timeout_minutes?: number }
        Returns: {
          id: string
          urls: string[]
          topic: string
        }[]
      }
      cleanup_old_snapshots: {
        Args: { retention_days?: number }
        Returns: number
      }
      complete_snapshot: {
        Args: { request_id: string; success: boolean; error_msg?: string }
        Returns: boolean
      }
      create_audit_trigger: {
        Args: { target_table_name: string }
        Returns: undefined
      }
      create_delete_trigger: {
        Args: { target_table_name: string }
        Returns: undefined
      }
      get_current_billing_period: {
        Args: { p_user_id: string }
        Returns: {
          usage_id: string
          period_start: string
          period_end: string
          article_credits_included: number
          article_credits_used: number
          article_credits_purchased: number
          article_credits_remaining: number
          domains_included: number
          domains_used: number
          domains_purchased: number
          domains_remaining: number
          ai_logs_included: number
          ai_logs_used: number
          ai_logs_remaining: number
          snapshots_included: number
          snapshots_used: number
          snapshots_remaining: number
          max_scans_used: number
          daily_scans_used: number
          plan_type: string
          plan_status: string
          stripe_subscription_id: string
          next_billing_date: string
        }[]
      }
      get_effective_pricing: {
        Args: { p_user_id: string }
        Returns: {
          plan_name: string
          is_grandfathered: boolean
          grandfathered_until: string
          special_terms: Json
        }[]
      }
      get_page_audit_summary: {
        Args: { page_url: string }
        Returns: {
          url: string
          title: string
          aeo_score: number
          total_issues: number
          critical_issues: number
          warning_issues: number
          total_recommendations: number
          last_analyzed: string
        }[]
      }
      get_plan_limits: {
        Args: { p_plan_type: string }
        Returns: {
          domains_included: number
          workspaces_included: number
          team_members_included: number
          ai_logs_included: number
        }[]
      }
      get_plan_spending_limit: {
        Args: { plan_type: string }
        Returns: number
      }
      get_usage_warning_level: {
        Args: { p_user_id: string; p_usage_type?: string }
        Returns: string
      }
      get_user_primary_workspace: {
        Args: { user_uuid: string }
        Returns: string
      }
      get_user_subscription: {
        Args: { p_user_id: string }
        Returns: {
          user_id: string
          plan_type: string
          plan_status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          current_period_start: string
          current_period_end: string
          trial_end: string
          cancel_at_period_end: boolean
          domains_included: number
          domains_used: number
          domains_remaining: number
          workspaces_included: number
          workspaces_used: number
          workspaces_remaining: number
          team_members_included: number
          team_members_used: number
          team_members_remaining: number
          ai_logs_included: number
          ai_logs_used: number
          ai_logs_remaining: number
          extra_domains: number
          edge_alerts_enabled: boolean
          billing_preferences: Json
          is_admin: boolean
        }[]
      }
      get_workspace_allocation: {
        Args: { p_user_id: string }
        Returns: {
          plan: string
          included_workspaces: number
          extra_domain_addons: number
          total_allowed_workspaces: number
          current_workspaces: number
          available_slots: number
          requires_deletion: number
        }[]
      }
      halfvec_avg: {
        Args: { "": number[] }
        Returns: unknown
      }
      halfvec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      halfvec_send: {
        Args: { "": unknown }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      has_grandfathered_pricing: {
        Args: { p_user_id: string }
        Returns: boolean
      }
      hnsw_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      hnswhandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      increment_snapshot_usage: {
        Args: { p_user_id: string; p_count?: number }
        Returns: undefined
      }
      increment_user_rate_limit: {
        Args: { p_user_id: string; p_target_day: string }
        Returns: number
      }
      initialize_subscription: {
        Args: {
          p_user_id: string
          p_plan_type?: string
          p_stripe_subscription_id?: string
        }
        Returns: string
      }
      is_admin: {
        Args: { user_email?: string }
        Returns: boolean
      }
      ivfflat_bit_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: { "": unknown }
        Returns: unknown
      }
      ivfflathandler: {
        Args: { "": unknown }
        Returns: unknown
      }
      l2_norm: {
        Args: { "": unknown } | { "": unknown }
        Returns: number
      }
      l2_normalize: {
        Args: { "": string } | { "": unknown } | { "": unknown }
        Returns: string
      }
      migrate_subscription_data: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      reset_monthly_snapshot_usage: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      sparsevec_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      sparsevec_send: {
        Args: { "": unknown }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      track_usage_event: {
        Args: {
          p_user_id: string
          p_event_type: string
          p_amount?: number
          p_metadata?: Json
        }
        Returns: string
      }
      update_audit_run_stats: {
        Args: { run_id: string }
        Returns: undefined
      }
      update_subscription_plan: {
        Args: {
          p_user_id: string
          p_plan_type: string
          p_stripe_subscription_id?: string
          p_stripe_price_id?: string
        }
        Returns: string
      }
      validate_any_api_key: {
        Args: { p_key_hash: string }
        Returns: {
          user_id: string
          workspace_id: string
          is_valid: boolean
          key_type: string
          permissions: Json
        }[]
      }
      validate_api_key: {
        Args: { key_hash: string }
        Returns: {
          user_id: string
          domains: string[]
          is_valid: boolean
        }[]
      }
      validate_plan_change: {
        Args: { p_user_id: string; p_new_plan: string }
        Returns: {
          can_change: boolean
          workspaces_to_delete: number
          warning_message: string
        }[]
      }
      validate_workspace_api_key: {
        Args: { p_key_hash: string }
        Returns: {
          workspace_id: string
          user_id: string
          is_valid: boolean
          permissions: Json
        }[]
      }
      vector_avg: {
        Args: { "": number[] }
        Returns: string
      }
      vector_dims: {
        Args: { "": string } | { "": unknown }
        Returns: number
      }
      vector_norm: {
        Args: { "": string }
        Returns: number
      }
      vector_out: {
        Args: { "": string }
        Returns: unknown
      }
      vector_send: {
        Args: { "": string }
        Returns: string
      }
      vector_typmod_in: {
        Args: { "": unknown[] }
        Returns: number
      }
      verify_admin_password: {
        Args: { submitted_password: string }
        Returns: boolean
      }
    }
    Enums: {
      aeo_bucket: "owned" | "operated" | "earned"
      citation_bucket_enum: "owned" | "operated" | "earned" | "competitor"
      max_question_type:
        | "direct_conversational"
        | "indirect_conversational"
        | "comparison_query"
        | "recommendation_request"
        | "explanatory_query"
      mention_position_enum: "primary" | "secondary" | "passing" | "none"
      sentiment_enum:
        | "very_positive"
        | "positive"
        | "neutral"
        | "negative"
        | "very_negative"
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
      aeo_bucket: ["owned", "operated", "earned"],
      citation_bucket_enum: ["owned", "operated", "earned", "competitor"],
      max_question_type: [
        "direct_conversational",
        "indirect_conversational",
        "comparison_query",
        "recommendation_request",
        "explanatory_query",
      ],
      mention_position_enum: ["primary", "secondary", "passing", "none"],
      sentiment_enum: [
        "very_positive",
        "positive",
        "neutral",
        "negative",
        "very_negative",
      ],
    },
  },
} as const
