export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          nickname: string | null;
          avatar_url: string | null;
          provider: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          nickname?: string | null;
          avatar_url?: string | null;
          provider?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          nickname?: string | null;
          avatar_url?: string | null;
          provider?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      stories: {
        Row: {
          id: string;
          title_ko: string;
          title_en: string | null;
          description_ko: string | null;
          description_en: string | null;
          category: string | null;
          age_group: string | null;
          thumbnail_url: string | null;
          is_free: boolean;
          page_count: number | null;
          duration_minutes: number | null;
          bgm_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          title_ko: string;
          title_en?: string | null;
          description_ko?: string | null;
          description_en?: string | null;
          category?: string | null;
          age_group?: string | null;
          thumbnail_url?: string | null;
          is_free?: boolean;
          page_count?: number | null;
          duration_minutes?: number | null;
          bgm_url?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          title_ko?: string;
          title_en?: string | null;
          description_ko?: string | null;
          description_en?: string | null;
          category?: string | null;
          age_group?: string | null;
          thumbnail_url?: string | null;
          is_free?: boolean;
          page_count?: number | null;
          duration_minutes?: number | null;
          bgm_url?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      story_pages: {
        Row: {
          id: string;
          story_id: string;
          page_number: number;
          media_type: string;
          image_url: string | null;
          video_url: string | null;
          text_ko: string | null;
          text_en: string | null;
          audio_url_ko: string | null;
          audio_url_en: string | null;
        };
        Insert: {
          id?: string;
          story_id: string;
          page_number: number;
          media_type?: string;
          image_url?: string | null;
          video_url?: string | null;
          text_ko?: string | null;
          text_en?: string | null;
          audio_url_ko?: string | null;
          audio_url_en?: string | null;
        };
        Update: {
          id?: string;
          story_id?: string;
          page_number?: number;
          media_type?: string;
          image_url?: string | null;
          video_url?: string | null;
          text_ko?: string | null;
          text_en?: string | null;
          audio_url_ko?: string | null;
          audio_url_en?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'story_pages_story_id_fkey';
            columns: ['story_id'];
            isOneToOne: false;
            referencedRelation: 'stories';
            referencedColumns: ['id'];
          },
        ];
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_type: string;
          status: string;
          started_at: string | null;
          expires_at: string | null;
          auto_renew: boolean;
          toss_billing_key: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_type: string;
          status?: string;
          started_at?: string | null;
          expires_at?: string | null;
          auto_renew?: boolean;
          toss_billing_key?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_type?: string;
          status?: string;
          started_at?: string | null;
          expires_at?: string | null;
          auto_renew?: boolean;
          toss_billing_key?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      reading_progress: {
        Row: {
          id: string;
          user_id: string;
          story_id: string;
          current_page: number;
          is_completed: boolean;
          last_read_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          story_id: string;
          current_page?: number;
          is_completed?: boolean;
          last_read_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          story_id?: string;
          current_page?: number;
          is_completed?: boolean;
          last_read_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'reading_progress_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reading_progress_story_id_fkey';
            columns: ['story_id'];
            isOneToOne: false;
            referencedRelation: 'stories';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Views: {};
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Functions: {};
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    Enums: {};
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    CompositeTypes: {};
  };
}

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];

export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];

export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];
