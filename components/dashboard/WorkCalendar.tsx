'use client'

import { useMemo, useState } from 'react'
import {
  CalendarDays,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
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

const FULL_TEST_BADGE_CLASS =
  'bg-primary/15 text-primary border border-primary/40 dark:text-primary-300 dark:border-primary/30'

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
  const [view, setView] = useState<CalendarView>('month')
  const [currentDate, setCurrentDate] = useState(() => new Date())
  const [sheetOpen, setSheetOpen] = useState(false)
  const [selectedDayKey, setSelectedDayKey] = useState<string | null>(null)

  const { dayMap, maxVolume } = useMemo(
    () => buildDayMap(tests ?? [], fullTests ?? []),
    [tests, fullTests]
  )

  const weeksToRender = useMemo(() => {
    if (view === 'month') {
      return getMonthMatrix(currentDate)
    }
    return [getWeekDays(currentDate)]
  }, [view, currentDate])

  const weekdayLabels = useMemo(() => getWeekdayLabels(), [])
  const todayKey = formatDateKey(new Date())
  const selectedDay = selectedDayKey ? dayMap.get(selectedDayKey) ?? null : null
  const currentLabel =
    view === 'month'
      ? formatMonthLabel(currentDate)
      : formatWeekRange(currentDate)

  const handlePrev = () =>
    setCurrentDate((prev) =>
      view === 'month' ? addMonths(prev, -1) : addDays(prev, -7)
    )
  const handleNext = () =>
    setCurrentDate((prev) =>
      view === 'month' ? addMonths(prev, 1) : addDays(prev, 7)
    )
  const handleToday = () => setCurrentDate(new Date())

  const openDetails = (dayKey: string) => {
    if (!dayMap.has(dayKey)) return
    setSelectedDayKey(dayKey)
    setSheetOpen(true)
  }

  const handleSheetChange = (open: boolean) => {
    setSheetOpen(open)
    if (!open) {
      setSelectedDayKey(null)
    }
  }

  const hasAnyActivity = dayMap.size > 0

  return (
    <div className="space-y-4 rounded-2xl border border-border/60 bg-card/60 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-lg font-semibold text-foreground">
            Planning d'entraînement
          </h3>
          <p className="text-sm text-muted-foreground">
            Visualisez vos révisions par sous-test
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
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
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handlePrev}
              aria-label={view === 'month' ? 'Mois précédent' : 'Semaine précédente'}
            >
              <ChevronLeft className="size-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              aria-label="Revenir à aujourd'hui"
            >
              Aujourd'hui
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleNext}
              aria-label={view === 'month' ? 'Mois suivant' : 'Semaine suivante'}
            >
              <ChevronRight className="size-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-sm font-semibold text-foreground capitalize">
        <span>{currentLabel}</span>
        {selectedDay && !isMobile && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSheetOpen(true)}
            className="hidden sm:flex"
          >
            Ouvrir en détail
          </Button>
        )}
      </div>

      <div className="space-y-2">
        <div className="grid grid-cols-7 gap-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
          {weekdayLabels.map((label) => (
            <div key={label} className="text-center">
              {label}
            </div>
          ))}
        </div>
        <div
          className={cn(
            'grid grid-cols-7 gap-2',
            view === 'week'
              ? 'auto-rows-[minmax(120px,1fr)] sm:auto-rows-[minmax(140px,1fr)]'
              : 'auto-rows-[minmax(110px,1fr)] sm:auto-rows-[minmax(130px,1fr)]'
          )}
        >
          {isLoading
            ? Array.from({ length: view === 'month' ? 42 : 7 }).map((_, index) => (
                <div
                  key={`placeholder-${index}`}
                  className="h-full w-full rounded-lg border border-border/50 bg-muted/40 animate-pulse"
                />
              ))
            : weeksToRender.map((week, weekIndex) =>
                week.map((day) => {
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
                      dayKey={dayKey}
                      summary={summary}
                      isCurrentMonth={isCurrentMonth}
                      isToday={isToday}
                      intensityClass={intensityClass}
                      onOpen={openDetails}
                      isMobile={isMobile}
                    />
                  )
                })
              )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {SUBTEST_OPTIONS.map(({ value, label }) => (
          <Badge
            key={value}
            className={cn(
              'text-[11px] font-medium',
              SUBTEST_COLORS[value as SubtestKey] ?? SUBTEST_COLORS.unknown
            )}
          >
            {label}
          </Badge>
        ))}
        <Badge className={cn('text-[11px] font-medium', FULL_TEST_BADGE_CLASS)}>
          Test complet
        </Badge>
      </div>

      {!isLoading && !hasAnyActivity && (
        <p className="text-sm text-muted-foreground">
          Aucun entraînement enregistré pour le moment. Ajoutez vos tests pour alimenter ce calendrier.
        </p>
      )}

      <Sheet open={sheetOpen} onOpenChange={handleSheetChange}>
        <SheetContent
          side={isMobile ? 'bottom' : 'right'}
          className={cn(
            'flex flex-col p-0',
            isMobile ? 'h-[70vh]' : 'sm:max-w-md'
          )}
        >
          {selectedDay ? (
            <>
              <SheetHeader className="border-b border-border/60 px-5 pb-4 pt-5 text-left">
                <SheetTitle className="text-base capitalize">
                  Activités du {formatFullDate(selectedDay.date)}
                </SheetTitle>
                <SheetDescription className="text-sm">
                  {selectedDay.items.length} activité
                  {selectedDay.items.length > 1 ? 's' : ''} enregistrée
                </SheetDescription>
              </SheetHeader>
              <div className="flex-1 overflow-y-auto px-5 py-6">
                <DayDetail summary={selectedDay} />
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center p-6 text-sm text-muted-foreground">
              Aucune activité sélectionnée
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  )
}

interface DayCellProps {
  day: Date
  dayKey: string
  summary: DaySummary | undefined
  isCurrentMonth: boolean
  isToday: boolean
  intensityClass: string
  onOpen: (dayKey: string) => void
  isMobile: boolean
}

function DayCell({
  day,
  dayKey,
  summary,
  isCurrentMonth,
  isToday,
  intensityClass,
  onOpen,
  isMobile,
}: DayCellProps) {
  const hasActivity = !!summary && summary.totalWork > 0
  const subtests = summary
    ? SUBTEST_ORDER.map((key) => ({
        key,
        count: summary.subtestTotals[key] ?? 0,
      })).filter((entry) => entry.count > 0)
    : []

  const handleClick = () => {
    if (hasActivity) {
      onOpen(dayKey)
    }
  }

  return (
    <div className="group relative h-full">
      <button
        type="button"
        onClick={handleClick}
        className={cn(
          'flex h-full w-full flex-col rounded-lg border px-2 pb-2 pt-2 text-left text-sm transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
          hasActivity
            ? cn(
                'cursor-pointer text-foreground shadow-xs hover:-translate-y-[1px] hover:border-primary/50 hover:shadow-sm',
                intensityClass || 'bg-primary/10 border-primary/25 dark:border-primary/25'
              )
            : 'cursor-default border-border/60 bg-muted/40 text-muted-foreground opacity-90',
          !isCurrentMonth && 'opacity-50',
          isToday && 'ring-1 ring-primary/60'
        )}
        aria-pressed={hasActivity ? undefined : false}
        aria-label={
          hasActivity
            ? `Activités du ${formatFullDate(day)}`
            : `Aucune activité le ${formatFullDate(day)}`
        }
      >
        <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide">
          <span>{day.getDate()}</span>
          {summary?.fullTestCount ? (
            <span className="text-[10px] font-semibold text-primary">
              Complet ×{summary.fullTestCount}
            </span>
          ) : null}
        </div>
        {hasActivity ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {subtests.map(({ key, count }) => (
              <Badge
                key={key}
                className={cn(
                  'px-1.5 py-0.5 text-[10px] font-semibold leading-tight',
                  SUBTEST_COLORS[key as SubtestKey] ?? SUBTEST_COLORS.unknown
                )}
              >
                {SUBTEST_LABELS[key] ?? key}
                {count > 1 && (
                  <span className="ml-1 text-[10px] font-medium">×{count}</span>
                )}
              </Badge>
            ))}
          </div>
        ) : (
          <div className="mt-4 text-[11px] text-muted-foreground/70">—</div>
        )}
      </button>

      {!isMobile && summary && summary.items.length > 0 && (
        <div className="pointer-events-auto invisible absolute left-1/2 top-full z-30 w-64 -translate-x-1/2 translate-y-2 rounded-lg border border-border bg-background/95 p-3 text-xs shadow-xl opacity-0 transition duration-150 group-hover:visible group-hover:opacity-100">
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
  const containerClasses = isCompact ? 'space-y-2' : 'space-y-3'
  const headerClasses = isCompact
    ? 'text-xs font-semibold text-foreground capitalize'
    : 'text-sm font-semibold text-foreground capitalize'
  const wrapperClasses = isCompact
    ? 'space-y-2'
    : 'space-y-3 text-sm leading-relaxed'
  const itemTitleClasses = isCompact
    ? 'flex items-center justify-between text-xs font-semibold'
    : 'flex items-center justify-between text-sm font-semibold'
  const metaClasses = isCompact
    ? 'text-[11px] text-muted-foreground'
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
                className="rounded-lg border border-border/60 bg-background/70 p-3"
              >
                <div className={itemTitleClasses}>
                  <span>
                    {item.type ?? 'TD'} •{' '}
                    {SUBTEST_LABELS[item.subtest] ?? item.subtest}
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
                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                  <Badge className={cn('text-[10px] font-semibold', badgeClass)}>
                    {SUBTEST_LABELS[item.subtest] ?? item.subtest}
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
              className="space-y-3 rounded-lg border border-primary/30 bg-primary/10 p-3"
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
              <div className="flex flex-wrap gap-1.5">
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
                      {SUBTEST_LABELS[subtest.subtest] ?? subtest.subtest}{' '}
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
    return 'bg-primary/8 border-primary/20 dark:border-primary/25'
  }

  if (maxVolume <= 0) {
    return 'bg-primary/12 border-primary/25 dark:border-primary/25'
  }

  const ratio = totalWork / maxVolume

  if (ratio >= 0.75) {
    return 'bg-primary/25 border-primary/50 dark:border-primary/40 shadow-md'
  }
  if (ratio >= 0.5) {
    return 'bg-primary/20 border-primary/45 dark:border-primary/35 shadow-sm'
  }
  if (ratio >= 0.25) {
    return 'bg-primary/15 border-primary/35 dark:border-primary/30'
  }
  return 'bg-primary/10 border-primary/30 dark:border-primary/25'
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

function getWeekDays(date: Date) {
  const start = startOfWeek(date)
  return Array.from({ length: 7 }, (_, index) => {
    const day = new Date(start)
    day.setDate(start.getDate() + index)
    return day
  })
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

function formatWeekRange(date: Date) {
  const start = startOfWeek(date)
  const end = addDays(start, 6)
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
  const range = `${start.toLocaleDateString(
    'fr-FR',
    startOptions
  )} – ${end.toLocaleDateString('fr-FR', endOptions)}`
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

