/**
 * Calculate next review date based on mastery level
 * Algorithm from PRD:
 * Level 0: 1 day
 * Level 1: 3 days
 * Level 2: 7 days
 * Level 3: 14 days
 * Level 4: 30 days
 * Level 5: 90 days
 */

export function getNextReviewInterval(masteryLevel: number): number {
  const intervals = [1, 3, 7, 14, 30, 90]
  return intervals[Math.min(masteryLevel, 5)]
}

export function calculateNextReviewDate(
  masteryLevel: number,
  baseDate: Date = new Date()
): Date {
  const interval = getNextReviewInterval(masteryLevel)
  const nextDate = new Date(baseDate)
  nextDate.setDate(nextDate.getDate() + interval)
  return nextDate
}

export function updateMasteryLevel(
  currentLevel: number,
  success: boolean
): number {
  if (success) {
    return Math.min(currentLevel + 1, 5)
  } else {
    return Math.max(currentLevel - 1, 0)
  }
}

export function isDueForReview(nextReviewDate: string | null): boolean {
  if (!nextReviewDate) return true
  
  const reviewDate = new Date(nextReviewDate)
  const today = new Date()
  
  // Reset time to compare only dates
  const reviewDateOnly = new Date(reviewDate.getFullYear(), reviewDate.getMonth(), reviewDate.getDate())
  const todayOnly = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  
  // Return true if review date is today or in the past
  return reviewDateOnly <= todayOnly
}


