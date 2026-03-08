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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          action_type: string
          created_at: string
          details: Json | null
          id: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          action_type: string
          created_at?: string
          details?: Json | null
          id?: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          action_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      admin_emails: {
        Row: {
          created_at: string
          email: string
          id: string
          role: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          role: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          role?: string
        }
        Relationships: []
      }
      admin_invites: {
        Row: {
          created_at: string
          created_by: string | null
          email: string | null
          expires_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          token: string
          used_at: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          used_at?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          email?: string | null
          expires_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          token?: string
          used_at?: string | null
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      certificates: {
        Row: {
          certificate_id: string
          completed_at: string
          course_name: string
          created_at: string
          id: string
          pdf_url: string | null
          student_name: string
          user_id: string
        }
        Insert: {
          certificate_id?: string
          completed_at?: string
          course_name: string
          created_at?: string
          id?: string
          pdf_url?: string | null
          student_name: string
          user_id: string
        }
        Update: {
          certificate_id?: string
          completed_at?: string
          course_name?: string
          created_at?: string
          id?: string
          pdf_url?: string | null
          student_name?: string
          user_id?: string
        }
        Relationships: []
      }
      challenge_attempts: {
        Row: {
          challenge_id: string
          completed_at: string
          completion_time_seconds: number
          id: string
          points_earned: number
          user_id: string
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          completion_time_seconds: number
          id?: string
          points_earned?: number
          user_id: string
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          completion_time_seconds?: number
          id?: string
          points_earned?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_attempts_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          created_at: string
          description: string | null
          difficulty: string
          duration_seconds: number
          id: string
          is_active: boolean
          lesson_id: string | null
          points: number
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          difficulty: string
          duration_seconds: number
          id?: string
          is_active?: boolean
          lesson_id?: string | null
          points?: number
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          difficulty?: string
          duration_seconds?: number
          id?: string
          is_active?: boolean
          lesson_id?: string | null
          points?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      course_access: {
        Row: {
          course_section: number
          granted_at: string | null
          has_access: boolean
          id: string
          user_id: string
        }
        Insert: {
          course_section: number
          granted_at?: string | null
          has_access?: boolean
          id?: string
          user_id: string
        }
        Update: {
          course_section?: number
          granted_at?: string | null
          has_access?: boolean
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_access_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      daily_challenge_completions: {
        Row: {
          challenge_id: string
          completed_at: string
          id: string
          user_id: string
          xp_earned: number
        }
        Insert: {
          challenge_id: string
          completed_at?: string
          id?: string
          user_id: string
          xp_earned?: number
        }
        Update: {
          challenge_id?: string
          completed_at?: string
          id?: string
          user_id?: string
          xp_earned?: number
        }
        Relationships: [
          {
            foreignKeyName: "daily_challenge_completions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_challenges: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          is_active: boolean
          repeat_weekly: boolean
          scheduled_date: string | null
          title: string
          xp_reward: number
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          repeat_weekly?: boolean
          scheduled_date?: string | null
          title: string
          xp_reward?: number
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          is_active?: boolean
          repeat_weekly?: boolean
          scheduled_date?: string | null
          title?: string
          xp_reward?: number
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          details: Json | null
          email: string
          email_type: string
          id: string
          sent_at: string | null
          user_id: string | null
        }
        Insert: {
          details?: Json | null
          email: string
          email_type: string
          id?: string
          sent_at?: string | null
          user_id?: string | null
        }
        Update: {
          details?: Json | null
          email?: string
          email_type?: string
          id?: string
          sent_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      forum_posts: {
        Row: {
          content: string
          created_at: string
          id: string
          is_pinned: boolean
          parent_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          parent_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean
          parent_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_posts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "forum_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      friend_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          id: string
          invited_at: string
          invitee_email: string
          inviter_id: string
          status: string
          token: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string
          invitee_email: string
          inviter_id: string
          status?: string
          token?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          id?: string
          invited_at?: string
          invitee_email?: string
          inviter_id?: string
          status?: string
          token?: string
        }
        Relationships: []
      }
      gifts: {
        Row: {
          claim_token: string
          claimed_at: string | null
          claimed_by: string | null
          created_at: string
          id: string
          personal_message: string | null
          plan: string
          recipient_email: string
          sender_id: string
        }
        Insert: {
          claim_token?: string
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          id?: string
          personal_message?: string | null
          plan: string
          recipient_email: string
          sender_id: string
        }
        Update: {
          claim_token?: string
          claimed_at?: string | null
          claimed_by?: string | null
          created_at?: string
          id?: string
          personal_message?: string | null
          plan?: string
          recipient_email?: string
          sender_id?: string
        }
        Relationships: []
      }
      lesson_progress: {
        Row: {
          completed: boolean
          completed_at: string | null
          created_at: string
          id: string
          lesson_id: string
          updated_at: string
          user_id: string
          watched_seconds: number
        }
        Insert: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id: string
          updated_at?: string
          user_id: string
          watched_seconds?: number
        }
        Update: {
          completed?: boolean
          completed_at?: string | null
          created_at?: string
          id?: string
          lesson_id?: string
          updated_at?: string
          user_id?: string
          watched_seconds?: number
        }
        Relationships: [
          {
            foreignKeyName: "lesson_progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_question_replies: {
        Row: {
          admin_id: string
          created_at: string
          id: string
          question_id: string
          reply: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          id?: string
          question_id: string
          reply: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          id?: string
          question_id?: string
          reply?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_question_replies_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "lesson_questions"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_questions: {
        Row: {
          created_at: string
          id: string
          lesson_id: string
          question: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          lesson_id: string
          question: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          lesson_id?: string
          question?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_questions_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_subtitles: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          label: string
          language: string
          lesson_id: string
          url: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          label: string
          language: string
          lesson_id: string
          url: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          label?: string
          language?: string
          lesson_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_subtitles_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          duration: string | null
          hologram_sheet_url: string | null
          id: string
          is_free: boolean
          lesson_notes: string | null
          order_index: number
          plan_access: string
          prerequisites: string[] | null
          preview_duration: number | null
          skill_level: string
          status: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          video_quality: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: string | null
          hologram_sheet_url?: string | null
          id?: string
          is_free?: boolean
          lesson_notes?: string | null
          order_index: number
          plan_access?: string
          prerequisites?: string[] | null
          preview_duration?: number | null
          skill_level?: string
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          video_quality?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          duration?: string | null
          hologram_sheet_url?: string | null
          id?: string
          is_free?: boolean
          lesson_notes?: string | null
          order_index?: number
          plan_access?: string
          prerequisites?: string[] | null
          preview_duration?: number | null
          skill_level?: string
          status?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          video_quality?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          reference_id: string | null
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          reference_id?: string | null
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          reference_id?: string | null
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: []
      }
      otp_codes: {
        Row: {
          code: string
          created_at: string
          email: string
          expires_at: string
          id: string
          type: string
          used_at: string | null
        }
        Insert: {
          code: string
          created_at?: string
          email: string
          expires_at: string
          id?: string
          type: string
          used_at?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          type?: string
          used_at?: string | null
        }
        Relationships: []
      }
      pending_upgrades: {
        Row: {
          applied_at: string | null
          created_at: string
          email: string
          id: string
          plan: string
          whop_membership_id: string | null
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          email: string
          id?: string
          plan: string
          whop_membership_id?: string | null
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          email?: string
          id?: string
          plan?: string
          whop_membership_id?: string | null
        }
        Relationships: []
      }
      platform_settings: {
        Row: {
          id: string
          key: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      practice_attempts: {
        Row: {
          completed_at: string
          created_at: string
          duration_seconds: number
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          created_at?: string
          duration_seconds: number
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          completed_at?: string
          created_at?: string
          duration_seconds?: number
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "practice_attempts_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          is_suspended: boolean | null
          onboarding_completed: boolean | null
          referral_code: string | null
          referred_by: string | null
          subscription_status: string
          subscription_tier: string
          total_points: number | null
          updated_at: string
          user_id: string
          username: string | null
          whop_membership_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_suspended?: boolean | null
          onboarding_completed?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          subscription_status?: string
          subscription_tier?: string
          total_points?: number | null
          updated_at?: string
          user_id: string
          username?: string | null
          whop_membership_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          is_suspended?: boolean | null
          onboarding_completed?: boolean | null
          referral_code?: string | null
          referred_by?: string | null
          subscription_status?: string
          subscription_tier?: string
          total_points?: number | null
          updated_at?: string
          user_id?: string
          username?: string | null
          whop_membership_id?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string | null
          endpoint: string
          id: string
          p256dh: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auth: string
          created_at?: string | null
          endpoint: string
          id?: string
          p256dh: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auth?: string
          created_at?: string | null
          endpoint?: string
          id?: string
          p256dh?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          click_count: number
          converted_at: string | null
          created_at: string
          id: string
          paid_at: string | null
          referred_email: string | null
          referred_user_id: string | null
          referrer_id: string
          status: string
        }
        Insert: {
          click_count?: number
          converted_at?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id: string
          status?: string
        }
        Update: {
          click_count?: number
          converted_at?: string | null
          created_at?: string
          id?: string
          paid_at?: string | null
          referred_email?: string | null
          referred_user_id?: string | null
          referrer_id?: string
          status?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          category: string | null
          created_at: string
          created_by: string | null
          description: string | null
          difficulty: string | null
          download_count: number
          id: string
          lesson_id: string | null
          title: string
          type: string
          updated_at: string
          url: string
          view_count: number
        }
        Insert: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          download_count?: number
          id?: string
          lesson_id?: string | null
          title: string
          type: string
          updated_at?: string
          url: string
          view_count?: number
        }
        Update: {
          category?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          difficulty?: string | null
          download_count?: number
          id?: string
          lesson_id?: string | null
          title?: string
          type?: string
          updated_at?: string
          url?: string
          view_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_name: string
          badge_type: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          badge_name: string
          badge_type: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          badge_name?: string
          badge_type?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_devices: {
        Row: {
          created_at: string
          device_fingerprint: string
          device_name: string
          id: string
          last_used_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          device_fingerprint: string
          device_name?: string
          id?: string
          last_used_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          device_fingerprint?: string
          device_name?: string
          id?: string
          last_used_at?: string
          user_id?: string
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
      user_settings: {
        Row: {
          activity_tracking: boolean
          browser_notifications: boolean
          connected_apps: Json
          created_at: string
          data_sharing: boolean
          email_notifications: boolean
          id: string
          language: string
          marketing_emails: boolean
          profile_visibility: string
          progress_reminders: boolean
          support_access: boolean
          timezone: string
          two_step_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_tracking?: boolean
          browser_notifications?: boolean
          connected_apps?: Json
          created_at?: string
          data_sharing?: boolean
          email_notifications?: boolean
          id?: string
          language?: string
          marketing_emails?: boolean
          profile_visibility?: string
          progress_reminders?: boolean
          support_access?: boolean
          timezone?: string
          two_step_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_tracking?: boolean
          browser_notifications?: boolean
          connected_apps?: Json
          created_at?: string
          data_sharing?: boolean
          email_notifications?: boolean
          id?: string
          language?: string
          marketing_emails?: boolean
          profile_visibility?: string
          progress_reminders?: boolean
          support_access?: boolean
          timezone?: string
          two_step_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      video_metadata: {
        Row: {
          available_resolutions: string[] | null
          created_at: string
          duration_seconds: number | null
          frame_count: number | null
          id: string
          lesson_id: string
          preview_clip_path: string | null
          processed_at: string | null
          processing_status: string
          sprite_columns: number | null
          sprite_frame_height: number | null
          sprite_frame_interval: number | null
          sprite_frame_width: number | null
          thumbnail_sprite_path: string | null
          updated_at: string
        }
        Insert: {
          available_resolutions?: string[] | null
          created_at?: string
          duration_seconds?: number | null
          frame_count?: number | null
          id?: string
          lesson_id: string
          preview_clip_path?: string | null
          processed_at?: string | null
          processing_status?: string
          sprite_columns?: number | null
          sprite_frame_height?: number | null
          sprite_frame_interval?: number | null
          sprite_frame_width?: number | null
          thumbnail_sprite_path?: string | null
          updated_at?: string
        }
        Update: {
          available_resolutions?: string[] | null
          created_at?: string
          duration_seconds?: number | null
          frame_count?: number | null
          id?: string
          lesson_id?: string
          preview_clip_path?: string | null
          processed_at?: string | null
          processing_status?: string
          sprite_columns?: number | null
          sprite_frame_height?: number | null
          sprite_frame_interval?: number | null
          sprite_frame_width?: number | null
          thumbnail_sprite_path?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_metadata_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: true
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      webhook_logs: {
        Row: {
          error_message: string | null
          event_type: string
          id: string
          payload: Json
          processed_at: string | null
          status: string
        }
        Insert: {
          error_message?: string | null
          event_type: string
          id?: string
          payload: Json
          processed_at?: string | null
          status?: string
        }
        Update: {
          error_message?: string | null
          event_type?: string
          id?: string
          payload?: Json
          processed_at?: string | null
          status?: string
        }
        Relationships: []
      }
      xp_events: {
        Row: {
          action: string
          created_at: string
          id: string
          reference_id: string | null
          user_id: string
          xp_amount: number
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          reference_id?: string | null
          user_id: string
          xp_amount?: number
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          reference_id?: string | null
          user_id?: string
          xp_amount?: number
        }
        Relationships: []
      }
    }
    Views: {
      referral_leaderboard: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          successful_referrals: number | null
          total_clicks: number | null
          total_signups: number | null
          user_id: string | null
        }
        Relationships: []
      }
      weekly_leaderboard: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          total_points: number | null
          user_id: string | null
          weekly_xp: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      get_user_role: {
        Args: { _user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      get_user_role_by_email: {
        Args: { _email: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      notify_all_users: {
        Args: {
          p_message: string
          p_reference_id?: string
          p_title: string
          p_type: string
        }
        Returns: undefined
      }
      validate_invite_token: {
        Args: { invite_token: string }
        Returns: {
          created_at: string
          email: string
          expires_at: string
          id: string
          role: string
          used_at: string
        }[]
      }
    }
    Enums: {
      app_role: "super_admin" | "content_admin"
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
      app_role: ["super_admin", "content_admin"],
    },
  },
} as const
