export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tests: {
        Row: {
          id: string
          user_id: string
          date: string
          type: 'TD' | 'Blanc'
          subtest: string
          score: number
          duration_minutes: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date?: string
          type: 'TD' | 'Blanc'
          subtest: string
          score: number
          duration_minutes?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          type?: 'TD' | 'Blanc'
          subtest?: string
          score?: number
          duration_minutes?: number | null
          notes?: string | null
          created_at?: string
        }
      }
      errors: {
        Row: {
          id: string
          user_id: string
          subtest: string
          category: string | null
          image_url: string | null
          correct_answer: string | null
          explanation: string | null
          understood: boolean
          reviewed_at: string | null
          tags: string[] | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subtest: string
          category?: string | null
          image_url?: string | null
          correct_answer?: string | null
          explanation?: string | null
          understood?: boolean
          reviewed_at?: string | null
          tags?: string[] | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subtest?: string
          category?: string | null
          image_url?: string | null
          correct_answer?: string | null
          explanation?: string | null
          understood?: boolean
          reviewed_at?: string | null
          tags?: string[] | null
          created_at?: string
        }
      }
      notions: {
        Row: {
          id: string
          user_id: string
          subtest: string
          title: string
          description: string | null
          image_url: string | null
          mastery_level: number
          last_reviewed_at: string | null
          next_review_at: string | null
          review_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subtest: string
          title: string
          description?: string | null
          image_url?: string | null
          mastery_level?: number
          last_reviewed_at?: string | null
          next_review_at?: string | null
          review_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          subtest?: string
          title?: string
          description?: string | null
          image_url?: string | null
          mastery_level?: number
          last_reviewed_at?: string | null
          next_review_at?: string | null
          review_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      notion_reviews: {
        Row: {
          id: string
          notion_id: string
          user_id: string
          reviewed_at: string
          success: boolean
          new_mastery_level: number
          next_review_interval_days: number
        }
        Insert: {
          id?: string
          notion_id: string
          user_id: string
          reviewed_at?: string
          success: boolean
          new_mastery_level: number
          next_review_interval_days: number
        }
        Update: {
          id?: string
          notion_id?: string
          user_id?: string
          reviewed_at?: string
          success?: boolean
          new_mastery_level?: number
          next_review_interval_days?: number
        }
      }
    }
  }
}

// Helper types
export type Test = Database['public']['Tables']['tests']['Row']
export type Error = Database['public']['Tables']['errors']['Row']
export type Notion = Database['public']['Tables']['notions']['Row']
export type NotionReview = Database['public']['Tables']['notion_reviews']['Row']

export const SUBTESTS = [
  'calcul',
  'logique',
  'expression',
  'comprehension',
  'conditions'
] as const

export type Subtest = typeof SUBTESTS[number]


