import type { SupabaseClient } from '@supabase/supabase-js'
import type {
  FullTestWithAttempts,
  TestWithAttempts,
} from '@/lib/types/database.types'

export const RETAKE_SUBTESTS = new Set(['logique', 'conditions', 'calcul'])

export const DEFAULT_RETAKE_INTERVAL_DAYS = 15
export const DEFAULT_RETAKE_SCORE_THRESHOLD = 90 // Pourcentage

export function shouldScheduleRetake(type: 'TD' | 'Blanc', subtest: string): boolean {
  return type === 'TD' && RETAKE_SUBTESTS.has(subtest)
}

export function computeNextRetakeISO(
  baseDate: string | null | undefined,
  intervalDays: number
): string | null {
  if (!intervalDays || intervalDays <= 0 || !baseDate) return null
  const date = new Date(baseDate)
  if (Number.isNaN(date.getTime())) return null
  const next = new Date(date)
  next.setUTCDate(next.getUTCDate() + intervalDays)
  return next.toISOString()
}

export function isRetakeDue(
  baseDate: string | null | undefined,
  intervalDays: number,
  reference: Date = new Date()
): boolean {
  const nextRetakeAt = computeNextRetakeISO(baseDate, intervalDays)
  if (!nextRetakeAt) return false
  const next = new Date(nextRetakeAt)
  if (Number.isNaN(next.getTime())) return false
  return next <= reference
}

export function isRetakeUpcoming(
  baseDate: string | null | undefined,
  intervalDays: number,
  reference: Date = new Date()
): boolean {
  const nextRetakeAt = computeNextRetakeISO(baseDate, intervalDays)
  if (!nextRetakeAt) return false
  const next = new Date(nextRetakeAt)
  if (Number.isNaN(next.getTime())) return false
  return next > reference
}

export async function getUserRetakeIntervalDays(
  supabase: SupabaseClient,
  userId: string,
  fallback: number = DEFAULT_RETAKE_INTERVAL_DAYS
): Promise<number> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('default_retake_delay_days')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching user preferences:', error)
    return fallback
  }

  const value = data?.default_retake_delay_days
  if (typeof value === 'number' && value > 0) {
    return value
  }

  return fallback
}

export async function getUserRetakeScoreThreshold(
  supabase: SupabaseClient,
  userId: string,
  fallback: number = DEFAULT_RETAKE_SCORE_THRESHOLD
): Promise<number> {
  const { data, error } = await supabase
    .from('user_preferences')
    .select('retake_score_threshold')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching user preferences:', error)
    return fallback
  }

  const value = data?.retake_score_threshold
  if (typeof value === 'number' && value > 0 && value <= 100) {
    return value
  }

  return fallback
}

export function getLatestTestCompletionDate(test: TestWithAttempts): string | null {
  const dates = [
    test.date,
    ...(test.attempts?.map((attempt) => attempt.date) ?? []),
  ]

  const validTimestamps = dates
    .map((date) => {
      const parsed = new Date(date)
      return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
    })
    .filter((timestamp): timestamp is number => timestamp !== null)

  if (validTimestamps.length === 0) {
    return null
  }

  const latest = new Date(Math.max(...validTimestamps))
  return latest.toISOString()
}

export function getLatestFullTestCompletionDate(
  test: FullTestWithAttempts
): string | null {
  const dates = [
    test.date,
    ...(test.attempts?.map((attempt) => attempt.date) ?? []),
  ]

  const validTimestamps = dates
    .map((date) => {
      const parsed = new Date(date)
      return Number.isNaN(parsed.getTime()) ? null : parsed.getTime()
    })
    .filter((timestamp): timestamp is number => timestamp !== null)

  if (validTimestamps.length === 0) {
    return null
  }

  const latest = new Date(Math.max(...validTimestamps))
  return latest.toISOString()
}

export function getTestNextRetakeDate(
  test: TestWithAttempts,
  intervalDays: number
): string | null {
  if (!shouldScheduleRetake(test.type, test.subtest)) {
    return null
  }
  const latest = getLatestTestCompletionDate(test)
  return computeNextRetakeISO(latest, intervalDays)
}

export function getFullTestNextRetakeDate(
  test: FullTestWithAttempts,
  intervalDays: number
): string | null {
  const latest = getLatestFullTestCompletionDate(test)
  return computeNextRetakeISO(latest, intervalDays)
}

export function isTestDueForRetake(
  test: TestWithAttempts,
  intervalDays: number,
  scoreThreshold: number = DEFAULT_RETAKE_SCORE_THRESHOLD,
  reference: Date = new Date()
): boolean {
  if (!shouldScheduleRetake(test.type, test.subtest)) {
    return false
  }

  // Si le test a été refait au moins une fois (attempts.length > 0)
  if (test.attempts && test.attempts.length > 0) {
    // Vérifier si le dernier score est sous le seuil
    const lastAttempt = test.attempts[0] // Premier élément car trié par date desc
    const scorePercentage = (lastAttempt.score / 60) * 100
    return scorePercentage < scoreThreshold
  }

  // Sinon, vérifier si le délai est écoulé depuis la première tentative
  const latest = getLatestTestCompletionDate(test)
  return isRetakeDue(latest, intervalDays, reference)
}

export function isFullTestDueForRetake(
  test: FullTestWithAttempts,
  intervalDays: number,
  scoreThreshold: number = DEFAULT_RETAKE_SCORE_THRESHOLD,
  reference: Date = new Date()
): boolean {
  // Si le test a été refait au moins une fois (attempts.length > 0)
  if (test.attempts && test.attempts.length > 0) {
    // Vérifier si le dernier score est sous le seuil
    const lastAttempt = test.attempts[0] // Premier élément car trié par date desc
    const scorePercentage = (lastAttempt.total_score / 600) * 100
    return scorePercentage < scoreThreshold
  }

  // Sinon, vérifier si le délai est écoulé depuis la première tentative
  const latest = getLatestFullTestCompletionDate(test)
  return isRetakeDue(latest, intervalDays, reference)
}

export function isTestUpcomingRetake(
  test: TestWithAttempts,
  intervalDays: number,
  scoreThreshold: number = DEFAULT_RETAKE_SCORE_THRESHOLD,
  reference: Date = new Date()
): boolean {
  if (!shouldScheduleRetake(test.type, test.subtest)) {
    return false
  }

  // Si déjà refait et score sous le seuil, pas "à venir" mais "à refaire maintenant"
  if (test.attempts && test.attempts.length > 0) {
    const lastAttempt = test.attempts[0]
    const scorePercentage = (lastAttempt.score / 60) * 100
    if (scorePercentage < scoreThreshold) {
      return false // Déjà à refaire, pas "à venir"
    }
  }

  const latest = getLatestTestCompletionDate(test)
  return isRetakeUpcoming(latest, intervalDays, reference)
}

export function isFullTestUpcomingRetake(
  test: FullTestWithAttempts,
  intervalDays: number,
  scoreThreshold: number = DEFAULT_RETAKE_SCORE_THRESHOLD,
  reference: Date = new Date()
): boolean {
  // Si déjà refait et score sous le seuil, pas "à venir" mais "à refaire maintenant"
  if (test.attempts && test.attempts.length > 0) {
    const lastAttempt = test.attempts[0]
    const scorePercentage = (lastAttempt.total_score / 600) * 100
    if (scorePercentage < scoreThreshold) {
      return false // Déjà à refaire, pas "à venir"
    }
  }

  const latest = getLatestFullTestCompletionDate(test)
  return isRetakeUpcoming(latest, intervalDays, reference)
}
