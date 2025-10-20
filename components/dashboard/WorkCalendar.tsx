'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { SUBTEST_LABELS, SUBTEST_OPTIONS } from '@/lib/constants/subtests'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import type {
  FullTestSubtest,
  FullTestWithAttempts,
  TestWithAttempts,
} from '@/lib/types/database.types'
import { cn } from '@/lib/utils'

type CalendarView = 'month' | 'week'

type SubtestKey = (typeof SUBTEST_OPTIONS)[number]['value']

const SUBTEST_ORDER = SUBTEST_OPTIONS.map((option) => option.value)

const SUBTEST_COLORS: Record<SubtestKey | 'unknown', string> = {
  comprehension:
    'bg-sky-500/15 text-sky-700 dark:text-sky-200 border border-sky-500/30 dark:border-sky-500/40',
  calcul:
    'bg-amber-500/15 text-amber-700 dark:text-amber-200 border border-amber-500/30 dark:border-amber-500/40',
  argumentation:
    'bg-emerald-500/15 text-emerald-700 dark:text-emerald-200 border border-emerald-500/30 dark:border-emerald-500/40',
  conditions:
    'bg-purple-500/15 text-purple-700 dark:text-purple-200 border border-purple-500/35 dark:border-purple-500/45',
  expression:
    'bg-rose-500/15 text-rose-700 dark:text-rose-200 border border-rose-500/30 dark:border-rose-500/40',
  logique:
    'bg-blue-500/15 text-blue-700 dark:text-blue-200 border border-blue-500/30 dark:border-blue-500/40',
  unknown:
    'bg-muted text-muted-foreground border border-border/60 dark:border-border/40',
}

function formatSubtestLabel(subtest: string) {
  if (subtest === 'conditions') {
    return 'CM'
  }
  return SUBTEST_LABELS[subtest] ?? subtest
}

interface CalendarTestItem {
  kind: 'test'
  id: string
  subtest: SubtestKey | 'unknown'
  name: string | null
  type: string | null
  score: number | null
  durationMinutes: number | null
}

interface CalendarFullTestItem {
  kind: 'full-test'
  id: string
  name: string | null
  type: string | null
  totalScore: number | null
  durationMinutes: number | null
  subtests: Array<Pick<FullTestSubtest, 'subtest' | 'score' | 'correct_answers'>>
}

type CalendarItem = CalendarTestItem | CalendarFullTestItem

interface DaySummary {
  key: string
  date: Date
  items: CalendarItem[]
  subtestTotals: Record<string, number>
  totalWork: number
  fullTestCount: number
}

interface WorkCalendarProps {
  tests: TestWithAttempts[] | null
  fullTests: FullTestWithAttempts[] | null
  isLoading?: boolean
}

export function WorkCalendar({
  tests,
  fullTests,
  isLoading = false,
}: WorkCalendarProps) {
  const isMobile = useIsMobile()
  const [view, setView] = useState<CalendarView>('week')
  const [currentDate, setCurrentDate] = useState(() => new Date())

  const { dayMap, maxVolume } = useMemo(
    () => buildDayMap(tests ?? [], fullTests ?? []),
    [tests, fullTests]
  )

  const swipeContainerRef = useRef<HTMLDivElement | null>(null)
  const touchStartX = useRef<number | null>(null)

  const [daysInView, setDaysInView] = useState(() =>
    computeDaysInView('week', typeof window !== 'undefined' ? window.innerWidth : undefined)
  )

  useEffect(() => {
    const updateDays = () => {
      const width = typeof window !== 'undefined' ? window.innerWidth : undefined
      setDaysInView(computeDaysInView(view, width))
    }

    updateDays()

    if (view !== 'week') {
      return
    }

    window.addEventListener('resize', updateDays)
    return () => window.removeEventListener('resize', updateDays)
  }, [view])

  const handlePrev = useCallback(() => {
    setCurrentDate((prev) =>
      view === 'month' ? addMonths(prev, -1) : addDays(prev, -daysInView)
    )
  }, [view, daysInView])

  const handleNext = useCallback(() => {
    setCurrentDate((prev) =>
      view === 'month' ? addMonths(prev, 1) : addDays(prev, daysInView)
    )
  }, [view, daysInView])

  const weeksToRender = useMemo(() => {
    if (view === 'month') {
      return getMonthMatrix(currentDate)
    }
    const start = addDays(currentDate, -(daysInView - 1))
    const days = Array.from({ length: daysInView }, (_, index) =>
      addDays(start, index)
    )
    return [days]
  }, [view, currentDate, daysInView])

  const weekdayLabels = useMemo(() => getWeekdayLabels(), [])
  const headerLabels = useMemo(() => {
    if (view === 'month') {
      return weekdayLabels
    }
    const rollingDays = weeksToRender[0] ?? []
    return rollingDays.map((day) =>
      capitalize(
        day
          .toLocaleDateString('fr-FR', { weekday: 'short' })
          .replace(/\.$/, '')
      )
    )
  }, [view, weekdayLabels, weeksToRender])

  const rangeLabel = useMemo(() => {
    if (view === 'week') {
      const days = weeksToRender[0] ?? []
      if (days.length === 0) {
        return ''
      }
      return formatDateRange(days[0], days[days.length - 1])
    }
    return formatMonthLabel(currentDate)
  }, [view, weeksToRender, currentDate])

  const weekGridStyle = view === 'week'
    ? { gridTemplateColumns: `repeat(${daysInView}, minmax(0, 1fr))` }
    : undefined

  const todayKey = formatDateKey(new Date())

  useEffect(() => {
    if (isMobile && view !== 'week') {
      setView('week')
    }
  }, [isMobile, view])

  useEffect(() => {
    if (!isMobile) return
    const container = swipeContainerRef.current
    if (!container) return

    const handleTouchStart = (event: TouchEvent) => {
      touchStartX.current = event.touches[0]?.clientX ?? null
    }

    const handleTouchEnd = (event: TouchEvent) => {
      if (touchStartX.current === null) return
      const endX = event.changedTouches[0]?.clientX ?? touchStartX.current
      const deltaX = endX - touchStartX.current
      touchStartX.current = null
      if (Math.abs(deltaX) < 40) return
      if (deltaX > 0) {
        handlePrev()
      } else {
        handleNext()
      }
    }

    const handleTouchCancel = () => {
      touchStartX.current = null
    }

    container.addEventListener('touchstart', handleTouchStart, { passive: true })
    container.addEventListener('touchend', handleTouchEnd)
    container.addEventListener('touchcancel', handleTouchCancel)

    return () => {
      container.removeEventListener('touchstart', handleTouchStart)
      container.removeEventListener('touchend', handleTouchEnd)
      container.removeEventListener('touchcancel', handleTouchCancel)
    }
  }, [isMobile, handlePrev, handleNext])

  const handleToday = () => setCurrentDate(new Date())

  const hasAnyActivity = dayMap.size > 0

  return (
    // <div className="space-y-3 rounded-2xl border border-border/60 bg-card/60 p-3 sm:p-4">
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground sm:text-sm">
          {rangeLabel}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          {!isMobile && (
            <Tabs
              value={view}
              onValueChange={(value) => setView(value as CalendarView)}
            >
              <TabsList>
                <TabsTrigger value="month">
                  <CalendarDays className="size-4" />
                  Mois
                </TabsTrigger>
                <TabsTrigger value="week">
                  <CalendarRange className="size-4" />
                  Semaine
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleToday}
            aria-label="Revenir à aujourd&apos;hui"
          >
            Aujourd&apos;hui
          </Button>
        </div>
      </div>
      <div className="space-y-1.5">
        <div
          className={cn(
            'grid w-full gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground sm:text-[11px]',
            view === 'week' ? '' : 'grid-cols-7'
          )}
          style={weekGridStyle}
        >
          {headerLabels.map((label) => (
            <div key={label} className="text-center">
              {label}
            </div>
          ))}
        </div>
        <div className="group/week relative" ref={swipeContainerRef}>
          {!isMobile && (
            <>
              <div className="pointer-events-none absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-1/2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handlePrev}
                  aria-label={view === 'month' ? 'Mois précédent' : 'Semaine précédente'}
                  className="pointer-events-auto hidden sm:flex opacity-0 transition-opacity group-hover/week:opacity-100 focus-visible:opacity-100"
                >
                  <ChevronLeft className="size-4" />
                </Button>
              </div>
              <div className="pointer-events-none absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1/2">
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleNext}
                  aria-label={view === 'month' ? 'Mois suivant' : 'Semaine suivante'}
                  className="pointer-events-auto hidden sm:flex opacity-0 transition-opacity group-hover/week:opacity-100 focus-visible:opacity-100"
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </>
          )}
          <div className="space-y-1.5">
            {isLoading ? (
              <div
                className={cn(
                  'grid gap-1.5',
                  view === 'week'
                    ? 'auto-rows-[minmax(100px,1fr)] sm:auto-rows-[minmax(120px,1fr)]'
                    : 'grid-cols-7 auto-rows-[minmax(90px,1fr)] sm:auto-rows-[minmax(110px,1fr)]'
                )}
                style={weekGridStyle}
              >
                {Array.from({
                  length: view === 'month' ? 42 : daysInView,
                }).map((_, index) => (
                  <div
                    key={`placeholder-${index}`}
                    className="h-full w-full rounded-lg border border-border/50 bg-muted/40 animate-pulse"
                  />
                ))}
              </div>
            ) : (
              weeksToRender.map((week, weekIndex) => {
                const weekHasActivity = week.some((day) => {
                  const summary = dayMap.get(formatDateKey(day))
                  return summary && summary.totalWork > 0
                })
                const isCompactWeek = view === 'month' && !weekHasActivity

                return (
                  <div
                    key={`week-${weekIndex}`}
                    className={cn(
                      'grid gap-1.5',
                      view === 'week' ? '' : 'grid-cols-7',
                      isCompactWeek
                        ? 'auto-rows-[minmax(28px,auto)] sm:auto-rows-[minmax(36px,auto)]'
                        : 'auto-rows-[minmax(90px,1fr)] sm:auto-rows-[minmax(110px,1fr)]'
                    )}
                    style={view === 'week' ? weekGridStyle : undefined}
                  >
                    {(view === 'week' ? week.slice(-daysInView) : week).map((day) => {
                      const dayKey = formatDateKey(day)
                      const summary = dayMap.get(dayKey)
                      const isCurrentMonth =
                        view === 'week' ||
                        day.getMonth() === currentDate.getMonth()
                      const isToday = dayKey === todayKey
                      const intensityClass = summary
                        ? getIntensityClass(summary.totalWork, maxVolume)
                        : ''

                      return (
                        <DayCell
                          key={`${weekIndex}-${dayKey}`}
                          day={day}
                          summary={summary}
                          isCurrentMonth={isCurrentMonth}
                          isToday={isToday}
                          intensityClass={intensityClass}
                          showTooltip={!isMobile}
                          compact={isCompactWeek}
                        />
                      )
                    })}
                  </div>
                )
              })
            )}
          </div>
        </div>
      </div>

      {!isLoading && !hasAnyActivity && (
        <p className="text-xs text-muted-foreground sm:text-sm">
          Aucun entraînement enregistré pour le moment. Ajoutez vos tests pour alimenter ce calendrier.
        </p>
      )}
    </div>
  )
}

interface DayCellProps {
  day: Date
  summary: DaySummary | undefined
  isCurrentMonth: boolean
  isToday: boolean
  intensityClass: string
  showTooltip: boolean
  compact: boolean
}

function DayCell({
  day,
  summary,
  isCurrentMonth,
  isToday,
  intensityClass,
  showTooltip,
  compact,
}: DayCellProps) {
  const hasActivity = !!summary && summary.totalWork > 0
  const subtests = summary
    ? SUBTEST_ORDER.map((key) => ({
        key,
        count: summary.subtestTotals[key] ?? 0,
      })).filter((entry) => entry.count > 0)
    : []

  return (
    <div className="group/day relative h-full">
      <div
        className={cn(
          'relative flex h-full w-full flex-col overflow-hidden rounded-xl border border-border/60 bg-gradient-to-br from-background to-muted/30 text-left text-sm transition-all backdrop-blur-sm',
          compact
            ? 'min-h-[28px] px-1.5 py-1.5 sm:min-h-[36px]'
            : 'min-h-[90px] px-2 py-2 sm:min-h-[110px]',
          hasActivity
            ? cn(
                'text-foreground shadow-sm hover:-translate-y-[1px]',
                intensityClass || 'border-primary/30 from-primary/10 to-background'
              )
            : compact
              ? 'border-border/50 bg-muted/30 text-muted-foreground'
              : 'border-border/60 bg-muted/40 text-muted-foreground opacity-90',
          !isCurrentMonth && 'opacity-50',
          isToday && 'ring-1 ring-primary/60'
        )}
        aria-label={
          hasActivity
            ? `Activités du ${formatFullDate(day)}`
            : `Aucune activité le ${formatFullDate(day)}`
        }
      >
        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          <span>{day.getDate()}</span>
          {summary?.fullTestCount ? (
            <span className="text-[10px] font-semibold text-primary">
              Complet ×{summary.fullTestCount}
            </span>
          ) : null}
        </div>
        {hasActivity ? (
          <div className="mt-1.5 flex flex-wrap gap-1">
            {subtests.map(({ key, count }) => (
              <Badge
                key={key}
                className={cn(
                  'px-1.5 py-0.5 text-[10px] font-semibold leading-tight',
                  SUBTEST_COLORS[key as SubtestKey] ?? SUBTEST_COLORS.unknown
                )}
              >
                {formatSubtestLabel(key)}
                {count > 1 && (
                  <span className="ml-1 text-[10px] font-medium">×{count}</span>
                )}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="mt-3 text-[11px] text-muted-foreground/70">—</div>
        )}
      </div>

      {showTooltip && summary && summary.items.length > 0 && (
        <div className="pointer-events-auto invisible absolute left-1/2 top-full z-30 w-60 -translate-x-1/2 translate-y-2 rounded-lg border border-border bg-background/95 p-2.5 text-xs shadow-xl opacity-0 transition duration-150 group-hover/day:visible group-hover/day:opacity-100">
          <DayDetail summary={summary} variant="compact" />
        </div>
      )}
    </div>
  )
}

interface DayDetailProps {
  summary: DaySummary
  variant?: 'default' | 'compact'
}

function DayDetail({ summary, variant = 'default' }: DayDetailProps) {
  const isCompact = variant === 'compact'
  const containerClasses = isCompact ? 'space-y-1.5' : 'space-y-2.5'
  const headerClasses = isCompact
    ? 'text-xs font-semibold text-foreground capitalize'
    : 'text-sm font-semibold text-foreground capitalize'
  const wrapperClasses = isCompact
    ? 'space-y-1.5'
    : 'space-y-2.5 text-sm leading-relaxed'
  const itemTitleClasses = isCompact
    ? 'flex items-center justify-between text-xs font-semibold'
    : 'flex items-center justify-between text-sm font-semibold'
  const metaClasses = isCompact
    ? 'text-[10px] text-muted-foreground'
    : 'text-xs text-muted-foreground'

  return (
    <div className={containerClasses}>
      <div>
        <p className={headerClasses}>{formatFullDate(summary.date)}</p>
        <p className={cn(metaClasses, 'mt-1')}>
          {summary.totalWork} sous-test
          {summary.totalWork > 1 ? 's' : ''} travaillés
        </p>
      </div>
      <div className={wrapperClasses}>
        {summary.items.map((item) => {
          if (item.kind === 'test') {
            const badgeClass =
              SUBTEST_COLORS[item.subtest as SubtestKey] ?? SUBTEST_COLORS.unknown

            return (
              <div
                key={item.id}
                className="rounded-lg border border-border/60 bg-background/70 p-2.5"
              >
                <div className={itemTitleClasses}>
                  <span>
                    {item.type ?? 'TD'} • {formatSubtestLabel(item.subtest)}
                  </span>
                  {typeof item.score === 'number' && (
                    <span className="text-xs font-semibold text-primary">
                      {item.score}/60
                    </span>
                  )}
                </div>
                {item.name && (
                  <p className={cn(metaClasses, 'mt-1 line-clamp-2')}>
                    {item.name}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-1">
                  <Badge className={cn('text-[10px] font-semibold', badgeClass)}>
                    {formatSubtestLabel(item.subtest)}
                  </Badge>
                  {item.durationMinutes ? (
                    <span className={metaClasses}>
                      Durée : {item.durationMinutes} min
                    </span>
                  ) : null}
                </div>
              </div>
            )
          }

          return (
            <div
              key={item.id}
              className="space-y-2.5 rounded-lg border border-primary/30 bg-primary/10 p-2.5"
            >
              <div className={itemTitleClasses}>
                <span>
                  Test complet{item.type ? ` • ${item.type}` : ''}{' '}
                  {item.name ? `• ${item.name}` : ''}
                </span>
                {typeof item.totalScore === 'number' && (
                  <span className="text-xs font-semibold text-primary">
                    {item.totalScore}/600
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1">
                {item.subtests.map((subtest) => {
                  const key = subtest.subtest as SubtestKey
                  const badgeClass =
                    SUBTEST_COLORS[key] ?? SUBTEST_COLORS.unknown
                  return (
                    <Badge
                      key={`${item.id}-${subtest.subtest}`}
                      className={cn(
                        'text-[10px] font-semibold',
                        badgeClass
                      )}
                    >
                      {formatSubtestLabel(subtest.subtest)}{' '}
                      {typeof subtest.score === 'number'
                        ? `${subtest.score}/60`
                        : ''}
                    </Badge>
                  )
                })}
              </div>
              {item.durationMinutes ? (
                <p className={metaClasses}>
                  Durée : {item.durationMinutes} min
                </p>
              ) : null}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function buildDayMap(
  tests: TestWithAttempts[],
  fullTests: FullTestWithAttempts[]
) {
  const map = new Map<string, DaySummary>()

  const ensureDay = (date: Date) => {
    const key = formatDateKey(date)
    const existing = map.get(key)
    if (existing) {
      return existing
    }
    const summary: DaySummary = {
      key,
      date: normalizeDate(date),
      items: [],
      subtestTotals: {},
      totalWork: 0,
      fullTestCount: 0,
    }
    map.set(key, summary)
    return summary
  }

  tests.forEach((test) => {
    const date = normalizeDate(test.date)
    const summary = ensureDay(date)
    const subtest = (test.subtest as SubtestKey) || 'unknown'
    const item: CalendarTestItem = {
      kind: 'test',
      id: test.id,
      subtest,
      name: test.name,
      type: test.type,
      score: typeof test.score === 'number' ? test.score : null,
      durationMinutes:
        typeof test.duration_minutes === 'number'
          ? test.duration_minutes
          : null,
    }
    summary.items.push(item)
    summary.subtestTotals[subtest] = (summary.subtestTotals[subtest] ?? 0) + 1
  })

  fullTests.forEach((fullTest) => {
    const date = normalizeDate(fullTest.date)
    const summary = ensureDay(date)
    const subtests = (fullTest.subtests ?? []).map((subtest) => ({
      subtest: subtest.subtest,
      score: typeof subtest.score === 'number' ? subtest.score : null,
      correct_answers:
        typeof subtest.correct_answers === 'number'
          ? subtest.correct_answers
          : null,
    }))

    const item: CalendarFullTestItem = {
      kind: 'full-test',
      id: fullTest.id,
      name: fullTest.name,
      type: fullTest.type,
      totalScore:
        typeof fullTest.total_score === 'number' ? fullTest.total_score : null,
      durationMinutes:
        typeof fullTest.duration_minutes === 'number'
          ? fullTest.duration_minutes
          : null,
      subtests,
    }

    summary.items.push(item)
    summary.fullTestCount += 1

    const subtestKeys =
      subtests.length > 0
        ? subtests.map((entry) => entry.subtest)
        : SUBTEST_ORDER

    subtestKeys.forEach((subtest) => {
      const key = (subtest as SubtestKey) || 'unknown'
      summary.subtestTotals[key] = (summary.subtestTotals[key] ?? 0) + 1
    })
  })

  let maxVolume = 0
  map.forEach((summary) => {
    summary.items.sort((a, b) => {
      const order = { 'full-test': 0, test: 1 }
      return order[a.kind] - order[b.kind]
    })
    summary.totalWork = Object.values(summary.subtestTotals).reduce(
      (acc, count) => acc + count,
      0
    )
    if (summary.totalWork > maxVolume) {
      maxVolume = summary.totalWork
    }
  })

  return { dayMap: map, maxVolume }
}

function getIntensityClass(totalWork: number, maxVolume: number) {
  if (totalWork <= 0) {
    return 'border-border/60 from-background to-muted/30'
  }

  if (maxVolume <= 0) {
    return 'border-primary/20 from-primary/10 to-background'
  }

  const ratio = totalWork / maxVolume

  if (ratio >= 0.75) {
    return 'border-primary/45 from-primary/30 to-background shadow-md'
  }
  if (ratio >= 0.5) {
    return 'border-primary/35 from-primary/22 to-background shadow-sm'
  }
  if (ratio >= 0.25) {
    return 'border-primary/28 from-primary/18 to-background'
  }
  return 'border-primary/22 from-primary/12 to-background'
}

function normalizeDate(value: string | Date): Date {
  const date = typeof value === 'string' ? new Date(value) : new Date(value)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 12)
}

function formatDateKey(value: string | Date) {
  const date = normalizeDate(value)
  const year = date.getFullYear()
  const month = `${date.getMonth() + 1}`.padStart(2, '0')
  const day = `${date.getDate()}`.padStart(2, '0')
  return `${year}-${month}-${day}`
}

function startOfWeek(date: Date) {
  const result = new Date(date)
  const day = result.getDay()
  const diff = day === 0 ? -6 : 1 - day
  result.setDate(result.getDate() + diff)
  result.setHours(12, 0, 0, 0)
  return result
}

function addDays(date: Date, amount: number) {
  const result = new Date(date)
  result.setDate(result.getDate() + amount)
  return result
}

function addMonths(date: Date, amount: number) {
  const result = new Date(date)
  result.setMonth(result.getMonth() + amount)
  return result
}

function getMonthMatrix(date: Date) {
  const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1, 12)
  const firstDayInGrid = startOfWeek(firstOfMonth)
  const weeks: Date[][] = []
  const cursor = new Date(firstDayInGrid)

  for (let week = 0; week < 6; week++) {
    const days: Date[] = []
    for (let day = 0; day < 7; day++) {
      days.push(new Date(cursor))
      cursor.setDate(cursor.getDate() + 1)
    }
    weeks.push(days)
  }

  return weeks
}

function getWeekdayLabels() {
  const start = startOfWeek(new Date())
  return Array.from({ length: 7 }, (_, index) => {
    const date = addDays(start, index)
    const label = date
      .toLocaleDateString('fr-FR', { weekday: 'short' })
      .replace(/\.$/, '')
    return capitalize(label)
  })
}

function formatMonthLabel(date: Date) {
  const label = date.toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  })
  return capitalize(label)
}

function formatDateRange(start: Date, end: Date) {
  const startOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
  }
  if (start.getFullYear() !== end.getFullYear()) {
    startOptions.year = 'numeric'
  }

  const endOptions: Intl.DateTimeFormatOptions = {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }

  const range = `${start.toLocaleDateString('fr-FR', startOptions)} – ${end.toLocaleDateString('fr-FR', endOptions)}`
  return capitalize(range)
}

function formatFullDate(date: Date) {
  const label = date.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  return capitalize(label)
}

function capitalize(value: string) {
  if (!value) return ''
  const firstChar = value.slice(0, 1).toLocaleUpperCase('fr-FR')
  return `${firstChar}${value.slice(1)}`
}

function computeDaysInView(mode: CalendarView, width?: number) {
  if (mode !== 'week') {
    return 7
  }

  if (!width) {
    return 7
  }

  if (width < 640) {
    return 3
  }

  if (width <= 1024) {
    return 5
  }

  return 7
}
