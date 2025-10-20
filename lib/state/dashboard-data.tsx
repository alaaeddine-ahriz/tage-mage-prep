'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type {
  Error as SupabaseError,
  Notion,
  TestWithAttempts,
  FullTestWithAttempts,
  Test,
  TestAttempt,
  FullTest,
  FullTestSubtest,
  FullTestAttempt,
  FullTestAttemptSubtest,
} from '@/lib/types/database.types'

interface DashboardDataContextValue {
  errors: SupabaseError[] | null
  notions: Notion[] | null
  tests: TestWithAttempts[] | null
  fullTests: FullTestWithAttempts[] | null
  refreshErrors: () => Promise<void>
  refreshNotions: () => Promise<void>
  refreshTests: () => Promise<void>
  refreshFullTests: () => Promise<void>
  isInitializing: boolean
}

const DashboardDataContext = createContext<DashboardDataContextValue | undefined>(undefined)

async function fetchErrors(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<SupabaseError[]> {
  const { data, error } = await supabase
    .from('errors')
    .select('*')
    .eq('user_id', userId)
    .order('next_review_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as SupabaseError[]
}

async function fetchNotions(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<Notion[]> {
  const { data, error } = await supabase
    .from('notions')
    .select('*')
    .eq('user_id', userId)
    .order('next_review_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as Notion[]
}

async function fetchTests(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<TestWithAttempts[]> {
  const { data: testsData, error: testsError } = await supabase
    .from('tests')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (testsError) throw testsError
  if (!testsData || testsData.length === 0) {
    return []
  }

  const testsWithAttempts = await Promise.all(
    testsData.map(async (test: Test) => {
      const { data: attemptsData, error: attemptsError } = await supabase
        .from('test_attempts')
        .select('*')
        .eq('test_id', test.id)
        .order('date', { ascending: false })

      if (attemptsError) throw attemptsError

      return {
        ...test,
        attempts: (attemptsData ?? []) as TestAttempt[],
      }
    })
  )

  return testsWithAttempts as TestWithAttempts[]
}

async function fetchFullTests(
  supabase: ReturnType<typeof createClient>,
  userId: string
): Promise<FullTestWithAttempts[]> {
  const { data: fullTestsData, error: fullTestsError } = await supabase
    .from('full_tests')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false })

  if (fullTestsError) throw fullTestsError
  if (!fullTestsData || fullTestsData.length === 0) {
    return []
  }

  const fullTestsWithData = await Promise.all(
    (fullTestsData as FullTest[]).map(async (fullTest) => {
      const { data: subtestsData, error: subtestsError } = await supabase
        .from('full_test_subtests')
        .select('*')
        .eq('full_test_id', fullTest.id)
        .order('created_at', { ascending: true })

      if (subtestsError) throw subtestsError

      const { data: attemptsData, error: attemptsError } = await supabase
        .from('full_test_attempts')
        .select('*')
        .eq('full_test_id', fullTest.id)
        .order('date', { ascending: false })

      if (attemptsError) throw attemptsError

      const attempts = attemptsData
        ? await Promise.all(
            (attemptsData as FullTestAttempt[]).map(async (attempt) => {
              const { data: attemptSubtestsData, error: attemptSubtestsError } = await supabase
                .from('full_test_attempt_subtests')
                .select('*')
                .eq('attempt_id', attempt.id)

              if (attemptSubtestsError) throw attemptSubtestsError

              return {
                ...attempt,
                subtests: (attemptSubtestsData ?? []) as FullTestAttemptSubtest[],
              }
            })
          )
        : []

      return {
        ...fullTest,
        subtests: (subtestsData ?? []) as FullTestSubtest[],
        attempts,
      }
    })
  )

  return fullTestsWithData as FullTestWithAttempts[]
}

export function DashboardDataProvider({ children }: { children: React.ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [errors, setErrors] = useState<SupabaseError[] | null>(null)
  const [notions, setNotions] = useState<Notion[] | null>(null)
  const [tests, setTests] = useState<TestWithAttempts[] | null>(null)
  const [fullTests, setFullTests] = useState<FullTestWithAttempts[] | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)
  const userIdRef = useRef<string | null>(null)
  const isFetchingRef = useRef(false)

  const ensureUser = useCallback(async () => {
    if (userIdRef.current) {
      return userIdRef.current
    }
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    if (error) throw error
    if (!user) throw new Error('User not authenticated')
    userIdRef.current = user.id
    return user.id
  }, [supabase])

  const loadAll = useCallback(async () => {
    if (isFetchingRef.current) return
    isFetchingRef.current = true
    try {
      setIsInitializing(true)
      const userId = await ensureUser()

      const [errorsData, notionsData, testsData, fullTestsData] = await Promise.all([
        fetchErrors(supabase, userId),
        fetchNotions(supabase, userId),
        fetchTests(supabase, userId),
        fetchFullTests(supabase, userId),
      ])

      setErrors(errorsData)
      setNotions(notionsData)
      setTests(testsData)
      setFullTests(fullTestsData)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setErrors([])
      setNotions([])
      setTests([])
      setFullTests([])
    } finally {
      setIsInitializing(false)
      isFetchingRef.current = false
    }
  }, [ensureUser, supabase])

  useEffect(() => {
    void loadAll()
  }, [loadAll])

  const refreshErrors = useCallback(async () => {
    try {
      const userId = await ensureUser()
      const fresh = await fetchErrors(supabase, userId)
      setErrors(fresh)
    } catch (error) {
      console.error('Error refreshing errors:', error)
    }
  }, [ensureUser, supabase])

  const refreshNotions = useCallback(async () => {
    try {
      const userId = await ensureUser()
      const fresh = await fetchNotions(supabase, userId)
      setNotions(fresh)
    } catch (error) {
      console.error('Error refreshing notions:', error)
    }
  }, [ensureUser, supabase])

  const refreshTests = useCallback(async () => {
    try {
      const userId = await ensureUser()
      const fresh = await fetchTests(supabase, userId)
      setTests(fresh)
    } catch (error) {
      console.error('Error refreshing tests:', error)
    }
  }, [ensureUser, supabase])

  const refreshFullTests = useCallback(async () => {
    try {
      const userId = await ensureUser()
      const fresh = await fetchFullTests(supabase, userId)
      setFullTests(fresh)
    } catch (error) {
      console.error('Error refreshing full tests:', error)
    }
  }, [ensureUser, supabase])

  const value: DashboardDataContextValue = {
    errors,
    notions,
    tests,
    fullTests,
    refreshErrors,
    refreshNotions,
    refreshTests,
    refreshFullTests,
    isInitializing,
  }

  return <DashboardDataContext.Provider value={value}>{children}</DashboardDataContext.Provider>
}

export function useDashboardData(): DashboardDataContextValue {
  const context = useContext(DashboardDataContext)
  if (!context) {
    throw new Error('useDashboardData must be used within a DashboardDataProvider')
  }
  return context
}
