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
          name: string
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
          name: string
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
          name?: string
          date?: string
          type?: 'TD' | 'Blanc'
          subtest?: string
          score?: number
          duration_minutes?: number | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      test_attempts: {
        Row: {
          id: string
          test_id: string
          date: string
          score: number
          duration_minutes: number | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          test_id: string
          date?: string
          score: number
          duration_minutes?: number | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          test_id?: string
          date?: string
          score?: number
          duration_minutes?: number | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      full_tests: {
        Row: {
          id: string
          user_id: string
          name: string
          date: string
          type: 'TD' | 'Blanc'
          total_score: number
          duration_minutes: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          date?: string
          type: 'TD' | 'Blanc'
          total_score: number
          duration_minutes?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          date?: string
          type?: 'TD' | 'Blanc'
          total_score?: number
          duration_minutes?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      full_test_subtests: {
        Row: {
          id: string
          full_test_id: string
          subtest: string
          correct_answers: number
          score: number
          created_at: string
        }
        Insert: {
          id?: string
          full_test_id: string
          subtest: string
          correct_answers: number
          score: number
          created_at?: string
        }
        Update: {
          id?: string
          full_test_id?: string
          subtest?: string
          correct_answers?: number
          score?: number
          created_at?: string
        }
        Relationships: []
      }
      full_test_attempts: {
        Row: {
          id: string
          full_test_id: string
          date: string
          total_score: number
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          full_test_id: string
          date?: string
          total_score: number
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          full_test_id?: string
          date?: string
          total_score?: number
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      full_test_attempt_subtests: {
        Row: {
          id: string
          attempt_id: string
          subtest: string
          correct_answers: number
          score: number
          created_at: string
        }
        Insert: {
          id?: string
          attempt_id: string
          subtest: string
          correct_answers: number
          score: number
          created_at?: string
        }
        Update: {
          id?: string
          attempt_id?: string
          subtest?: string
          correct_answers?: number
          score?: number
          created_at?: string
        }
        Relationships: []
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
          title: string | null
          mastery_level: number
          last_reviewed_at: string | null
          next_review_at: string | null
          review_count: number
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
          title?: string | null
          mastery_level?: number
          last_reviewed_at?: string | null
          next_review_at?: string | null
          review_count?: number
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
          title?: string | null
          mastery_level?: number
          last_reviewed_at?: string | null
          next_review_at?: string | null
          review_count?: number
          understood?: boolean
          reviewed_at?: string | null
          tags?: string[] | null
          created_at?: string
        }
        Relationships: []
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
        Relationships: []
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
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types
export type Test = Database['public']['Tables']['tests']['Row']
export type TestAttempt = Database['public']['Tables']['test_attempts']['Row']
export type FullTest = Database['public']['Tables']['full_tests']['Row']
export type FullTestSubtest = Database['public']['Tables']['full_test_subtests']['Row']
export type FullTestAttemptRow = Database['public']['Tables']['full_test_attempts']['Row']
export type FullTestAttemptSubtestRow = Database['public']['Tables']['full_test_attempt_subtests']['Row']

// Full test attempt with subtests
export interface FullTestAttempt extends FullTestAttemptRow {
  subtests: FullTestAttemptSubtest[]
}

// Alias for subtest
export type FullTestAttemptSubtest = FullTestAttemptSubtestRow
export type Error = Database['public']['Tables']['errors']['Row']
export type Notion = Database['public']['Tables']['notions']['Row']
export type NotionReview = Database['public']['Tables']['notion_reviews']['Row']

// Test with attempts
export interface TestWithAttempts extends Test {
  attempts: TestAttempt[]
}

export const SUBTESTS = [
  'calcul',
  'logique',
  'expression',
  'comprehension',
  'conditions',
  'argumentation'
] as const

export type Subtest = typeof SUBTESTS[number]

// Full test with all subtests
export interface FullTestWithSubtests extends FullTest {
  subtests: FullTestSubtest[]
}

// Full test with attempts
export interface FullTestWithAttempts extends FullTest {
  subtests: FullTestSubtest[]
  attempts: FullTestAttempt[]
}
