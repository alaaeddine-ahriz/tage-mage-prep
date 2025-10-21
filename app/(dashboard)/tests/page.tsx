'use client'

import { useEffect, useMemo, useState } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { MobileFormSheet } from '@/components/ui/mobile-form-sheet'
import { AddTestForm } from '@/components/forms/AddTestForm'
import { AddFullTestForm } from '@/components/forms/AddFullTestForm'
import { TestAttemptsModal } from '@/components/dashboard/TestAttemptsModal'
import { FullTestAttemptsModal } from '@/components/dashboard/FullTestAttemptsModal'
import { Plus, Loader2, RefreshCw, Clock } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { TestWithAttempts, FullTestWithAttempts, FullTestSubtest } from '@/lib/types/database.types'
import { SUBTESTS, SUBTEST_LABELS } from '@/lib/constants/subtests'
import { useDashboardData } from '@/lib/state/dashboard-data'
import {
  isTestDueForRetake,
  isFullTestDueForRetake,
  isTestUpcomingRetake,
  isFullTestUpcomingRetake,
  getTestNextRetakeDate,
  getFullTestNextRetakeDate,
  shouldScheduleRetake,
} from '@/lib/utils/retakes'

// const TEST_TYPES = [
//   { value: 'all', label: 'Tous' },
//   { value: 'TD', label: 'TD' },
//   { value: 'Blanc', label: 'Blanc' },
// ]

const RETAKE_FILTERS = [
  { value: 'due', label: 'À refaire', icon: RefreshCw },
  { value: 'upcoming', label: 'Bientôt', icon: Clock },
]

export default function TestsPage() {
  const { tests, fullTests, refreshTests, refreshFullTests, retakeIntervalDays, retakeScoreThreshold } = useDashboardData()
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isFullTestFormOpen, setIsFullTestFormOpen] = useState(false)
  const [selectedTest, setSelectedTest] = useState<TestWithAttempts | null>(null)
  const [selectedFullTest, setSelectedFullTest] = useState<FullTestWithAttempts | null>(null)
  const [subtestFilter, setSubtestFilter] = useState('all')
  // const [typeFilter, setTypeFilter] = useState('all')
  const [retakeFilters, setRetakeFilters] = useState<string[]>([]) // Selection multiple
  const [activeTab, setActiveTab] = useState<'individual' | 'full'>('individual')
  const isMobile = useIsMobile()
  const isLoading = !tests || !fullTests
  const testsList = useMemo(() => tests ?? [], [tests])
  const fullTestsList = useMemo(() => fullTests ?? [], [fullTests])
  const filteredTests = useMemo(() => {
    return testsList.filter((test) => {
      const matchesSubtest = subtestFilter === 'all' || test.subtest === subtestFilter
      // const matchesType = typeFilter === 'all' || test.type === typeFilter
      
      // Si aucun filtre de retake n'est sélectionné, afficher tous
      if (retakeFilters.length === 0) {
        return matchesSubtest
      }
      
      // Vérifier si le test correspond à au moins un des filtres sélectionnés
      const matchesRetake = retakeFilters.some((filter) => {
        if (filter === 'due') {
          return shouldScheduleRetake(test.type, test.subtest) && isTestDueForRetake(test, retakeIntervalDays, retakeScoreThreshold)
        } else if (filter === 'upcoming') {
          return shouldScheduleRetake(test.type, test.subtest) && isTestUpcomingRetake(test, retakeIntervalDays, retakeScoreThreshold)
        }
        return false
      })
      
      return matchesSubtest && matchesRetake
    })
  }, [testsList, subtestFilter, retakeFilters, retakeIntervalDays, retakeScoreThreshold])

  const filteredFullTests = useMemo(() => {
    // Si aucun filtre de retake n'est sélectionné, afficher tous
    if (retakeFilters.length === 0) {
      return fullTestsList
    }
    
    // Vérifier si le test correspond à au moins un des filtres sélectionnés
    return fullTestsList.filter((test) => {
      return retakeFilters.some((filter) => {
        if (filter === 'due') {
          return isFullTestDueForRetake(test, retakeIntervalDays, retakeScoreThreshold)
        } else if (filter === 'upcoming') {
          return isFullTestUpcomingRetake(test, retakeIntervalDays, retakeScoreThreshold)
        }
        return false
      })
    })
  }, [fullTestsList, retakeFilters, retakeIntervalDays, retakeScoreThreshold])

  useEffect(() => {
    if (!selectedTest) return
    const updated = testsList.find((test) => test.id === selectedTest.id)
    if (updated && updated !== selectedTest) {
      setSelectedTest(updated)
    }
  }, [testsList, selectedTest])

  useEffect(() => {
    if (!selectedFullTest) return
    const updated = fullTestsList.find((test) => test.id === selectedFullTest.id)
    if (updated && updated !== selectedFullTest) {
      setSelectedFullTest(updated)
    }
  }, [fullTestsList, selectedFullTest])

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const handleFormSuccess = () => {
    void refreshTests()
    setIsFormOpen(false)
  }

  const handleFullTestFormSuccess = () => {
    void refreshFullTests()
    setIsFullTestFormOpen(false)
  }

  const handleTestClick = (test: TestWithAttempts) => {
    setSelectedTest(test)
  }

  // Fonction pour calculer les jours relatifs
  const getDaysUntilRetake = (retakeDate: string): number => {
    const now = new Date()
    const target = new Date(retakeDate)
    const diffTime = target.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays
  }

  // Fonction pour toggle un filtre de retake
  const toggleRetakeFilter = (filterValue: string) => {
    setRetakeFilters((prev) => {
      if (prev.includes(filterValue)) {
        return prev.filter((f) => f !== filterValue)
      } else {
        return [...prev, filterValue]
      }
    })
  }

  const emptyIndividualState = (
    <Card>
      <CardContent className="py-12 text-center">
        <Plus className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Aucun test individuel</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Ajoutez votre premier test individuel
        </p>
      </CardContent>
    </Card>
  )

  const emptyFullState = (
    <Card>
      <CardContent className="py-12 text-center">
        <Plus className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Aucun test complet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Ajoutez votre premier test complet (6 sous-tests)
        </p>
      </CardContent>
    </Card>
  )

  const individualListContent =
    filteredTests.length > 0 ? (
      <div className="divide-y divide-border">
        {filteredTests.map((test: TestWithAttempts) => {
          const isDue = shouldScheduleRetake(test.type, test.subtest) && isTestDueForRetake(test, retakeIntervalDays, retakeScoreThreshold)
          const isUpcoming = shouldScheduleRetake(test.type, test.subtest) && isTestUpcomingRetake(test, retakeIntervalDays, retakeScoreThreshold)
          const nextRetakeDate = (isDue || isUpcoming) ? getTestNextRetakeDate(test, retakeIntervalDays) : null

          return (
            <div
              key={test.id}
              className="flex w-full items-center justify-between py-3 cursor-pointer hover:bg-muted/50 px-0 transition-colors"
              onClick={() => handleTestClick(test)}
            >
              <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {test.name || SUBTEST_LABELS[test.subtest] || test.subtest}
                  </span>
                  {isDue && (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <RefreshCw className="h-3 w-3" />
                      À refaire
                    </Badge>
                  )}
                  {isUpcoming && !isDue && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      Bientôt
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {SUBTEST_LABELS[test.subtest] || test.subtest}
                  </span>
                  <span className="text-xs text-muted-foreground">•</span>
                  <span
                    className={`text-xs font-medium ${
                      test.type === 'Blanc' ? 'text-primary' : 'text-muted-foreground'
                    }`}
                  >
                    {test.type}
                  </span>
                  {test.attempts.length > 0 && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {test.attempts.length + 1} tentative{test.attempts.length > 0 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>
                {nextRetakeDate ? (
                  <p className="text-xs font-medium text-primary">
                    {(() => {
                      const daysUntil = getDaysUntilRetake(nextRetakeDate)
                      if (daysUntil < 0) {
                        const daysLate = Math.abs(daysUntil)
                        return `En retard de ${daysLate} jour${daysLate > 1 ? 's' : ''}`
                      } else {
                        return `À refaire dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`
                      }
                    })()}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {new Date(test.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                    {test.duration_minutes && ` • ${test.duration_minutes} min`}
                  </p>
                )}
                {test.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-1">{test.notes}</p>
                )}
              </div>
              <span className="ml-4 text-2xl font-bold text-primary">{test.score}</span>
            </div>
          )
        })}
      </div>
    ) : (
      testsList.length > 0 && (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/60 p-6 text-center text-sm text-muted-foreground">
          Aucun test ne correspond aux filtres sélectionnés.
        </div>
      )
    )

  const individualMobileContent =
    testsList.length > 0 ? (
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-foreground">
          Historique ({filteredTests.length})
        </h2>
        {individualListContent}
      </div>
    ) : (
      emptyIndividualState
    )

  const individualDesktopContent = testsList.length > 0 ? individualListContent : emptyIndividualState

  const fullListContent =
    filteredFullTests.length > 0 ? (
      <div className="divide-y divide-border">
        {filteredFullTests.map((fullTest) => {
          const isDue = isFullTestDueForRetake(fullTest, retakeIntervalDays, retakeScoreThreshold)
          const isUpcoming = isFullTestUpcomingRetake(fullTest, retakeIntervalDays, retakeScoreThreshold)
          const nextRetakeDate = (isDue || isUpcoming) ? getFullTestNextRetakeDate(fullTest, retakeIntervalDays) : null

          return (
            <div
              key={fullTest.id}
              className="flex w-full items-center justify-between py-3 cursor-pointer hover:bg-muted/50 px-0 transition-colors"
              onClick={() => setSelectedFullTest(fullTest)}
            >
              <div className="flex-1 space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium text-foreground">
                    {fullTest.name}
                  </span>
                  {isDue && (
                    <Badge variant="destructive" className="text-xs gap-1">
                      <RefreshCw className="h-3 w-3" />
                      À refaire
                    </Badge>
                  )}
                  {isUpcoming && !isDue && (
                    <Badge variant="secondary" className="text-xs gap-1">
                      <Clock className="h-3 w-3" />
                      Bientôt
                    </Badge>
                  )}
                  {fullTest.attempts && fullTest.attempts.length > 0 && (
                    <>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className="text-xs text-muted-foreground">
                        {fullTest.attempts.length + 1} tentative{fullTest.attempts.length > 0 ? 's' : ''}
                      </span>
                    </>
                  )}
                </div>
                {nextRetakeDate ? (
                  <p className="text-xs font-medium text-primary">
                    {(() => {
                      const daysUntil = getDaysUntilRetake(nextRetakeDate)
                      if (daysUntil < 0) {
                        const daysLate = Math.abs(daysUntil)
                        return `En retard de ${daysLate} jour${daysLate > 1 ? 's' : ''}`
                      } else {
                        return `À refaire dans ${daysUntil} jour${daysUntil > 1 ? 's' : ''}`
                      }
                    })()}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    {new Date(fullTest.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                    {fullTest.duration_minutes && ` • ${fullTest.duration_minutes} min`}
                  </p>
                )}
                {fullTest.subtests.length > 0 && !isMobile && (
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {fullTest.subtests.map((subtest: FullTestSubtest) => (
                      <span key={subtest.id} className="inline-flex items-center gap-1">
                        <span>{SUBTEST_LABELS[subtest.subtest] || subtest.subtest}</span>
                        <span className="font-semibold text-foreground">{subtest.score}</span>
                      </span>
                    ))}
                  </div>
                )}
                {fullTest.notes && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{fullTest.notes}</p>
                )}
              </div>
              <div className="ml-4 flex flex-shrink-0 flex-col items-end">
                <span className="text-2xl font-bold text-primary">{fullTest.total_score}</span>
                <span className="text-xs text-muted-foreground">/ 600</span>
              </div>
            </div>
          )
        })}
      </div>
    ) : (
      fullTestsList.length === 0 ? emptyFullState : (
        <div className="rounded-2xl border border-dashed border-border/60 bg-card/60 p-6 text-center text-sm text-muted-foreground">
          Aucun test ne correspond aux filtres sélectionnés.
        </div>
      )
    )

  const fullMobileContent =
    fullTestsList.length > 0 ? (
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-foreground">
          Historique ({filteredFullTests.length})
        </h2>
        {fullListContent}
      </div>
    ) : (
      emptyFullState
    )

  const fullDesktopContent = fullListContent

  return (
    <div className="space-y-6 md:space-y-10 md:pt-4">
      {/* Header */}
      <div className="space-y-4 md:space-y-6 md:mt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground">
            Tests & Scores
          </h1>

          {!isMobile && (
            <div className="flex gap-2">
              <MobileFormSheet
                open={isFormOpen}
                onOpenChange={setIsFormOpen}
                title="Nouveau test individuel"
                trigger={
                  <Button onClick={() => setIsFormOpen(true)} variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    Test individuel
                  </Button>
                }
              >
                <AddTestForm onSuccess={handleFormSuccess} />
              </MobileFormSheet>
              
              <MobileFormSheet
                open={isFullTestFormOpen}
                onOpenChange={setIsFullTestFormOpen}
                title="Nouveau test complet"
                trigger={
                  <Button onClick={() => setIsFullTestFormOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" />
                    Test complet
                  </Button>
                }
              >
                <AddFullTestForm onSuccess={handleFullTestFormSuccess} />
              </MobileFormSheet>
            </div>
          )}
        </div>

        {/* Tabs selector - Mobile uniquement, juste sous le titre */}
        {isMobile && (testsList.length > 0 || fullTestsList.length > 0) && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'individual' | 'full')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual">
                Individuels ({testsList.length})
              </TabsTrigger>
              <TabsTrigger value="full">
                Complets ({fullTestsList.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Filters - Mobile sous les tabs */}
        {isMobile && (testsList.length > 0 || fullTestsList.length > 0) && (
          <div className="flex gap-2">
            {activeTab === 'individual' ? (
              <>
                <Select value={subtestFilter} onValueChange={setSubtestFilter}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sous-test" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBTESTS.map((subtest) => (
                      <SelectItem key={subtest.value} value={subtest.value}>
                        {subtest.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {RETAKE_FILTERS.map((filter) => {
                  const Icon = filter.icon
                  const isSelected = retakeFilters.includes(filter.value)
                  return (
                    <Button
                      key={filter.value}
                      onClick={() => toggleRetakeFilter(filter.value)}
                      size="icon"
                      variant={isSelected ? 'default' : 'outline'}
                      className="shrink-0"
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  )
                })}

                <MobileFormSheet
                  open={isFormOpen}
                  onOpenChange={setIsFormOpen}
                  title="Nouveau test individuel"
                  trigger={
                    <Button onClick={() => setIsFormOpen(true)} size="icon" className="shrink-0">
                      <Plus className="h-4 w-4" />
                    </Button>
                  }
                >
                  <AddTestForm onSuccess={handleFormSuccess} />
                </MobileFormSheet>
              </>
            ) : (
              <>
                {RETAKE_FILTERS.map((filter) => {
                  const Icon = filter.icon
                  const isSelected = retakeFilters.includes(filter.value)
                  return (
                    <Button
                      key={filter.value}
                      onClick={() => toggleRetakeFilter(filter.value)}
                      size="icon"
                      variant={isSelected ? 'default' : 'outline'}
                      className="shrink-0"
                    >
                      <Icon className="h-4 w-4" />
                    </Button>
                  )
                })}

                <MobileFormSheet
                  open={isFullTestFormOpen}
                  onOpenChange={setIsFullTestFormOpen}
                  title="Nouveau test complet"
                  trigger={
                    <Button onClick={() => setIsFullTestFormOpen(true)} className="flex-1">
                      <Plus className="mr-2 h-4 w-4" />
                      Ajouter un test complet
                    </Button>
                  }
                >
                  <AddFullTestForm onSuccess={handleFullTestFormSuccess} />
                </MobileFormSheet>
              </>
            )}
          </div>
        )}

        {/* Filters - Desktop */}
        {!isMobile && testsList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <div className="flex flex-wrap gap-2">
              {SUBTESTS.map((subtest) => (
                <button
                  key={subtest.value}
                  onClick={() => setSubtestFilter(subtest.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors backdrop-blur-sm ${
                    subtestFilter === subtest.value
                      ? 'border-primary/40 bg-gradient-to-br from-primary/15 via-primary/5 to-background/60 text-primary shadow-sm'
                      : 'border-border/50 bg-background/40 text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {subtest.label}
                </button>
              ))}
            </div>
            <div className="ml-auto flex gap-2">
              {RETAKE_FILTERS.map((filter) => {
                const Icon = filter.icon
                const isSelected = retakeFilters.includes(filter.value)
                return (
                  <button
                    key={filter.value}
                    onClick={() => toggleRetakeFilter(filter.value)}
                    className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors backdrop-blur-sm ${
                      isSelected
                        ? 'border-primary/40 bg-gradient-to-br from-primary/15 via-primary/5 to-background/60 text-primary shadow-sm'
                        : 'border-border/50 bg-background/40 text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary'
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Icon className="h-3.5 w-3.5" />
                      {filter.label}
                    </div>
                  </button>
                )
              })}
            </div>
            {/* <div className="ml-auto flex gap-2">
              {TEST_TYPES.map((type) => (
                <button
                  key={type.value}
                  onClick={() => setTypeFilter(type.value)}
                  className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors backdrop-blur-sm ${
                    typeFilter === type.value
                      ? 'border-primary/40 bg-gradient-to-br from-primary/15 via-primary/5 to-background/60 text-primary shadow-sm'
                      : 'border-border/50 bg-background/40 text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div> */}
          </div>
        )}
      </div>

      {isMobile ? (
        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as 'individual' | 'full')}
          className="w-full"
        >
          <TabsContent value="individual" className="space-y-4">
            {individualMobileContent}
          </TabsContent>
          <TabsContent value="full" className="space-y-4">
            {fullMobileContent}
          </TabsContent>
        </Tabs>
      ) : (
        <div className="space-y-10">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-3xl font-semibold text-foreground">
                Tests individuels ({filteredTests.length})
              </h2>
            </div>
            {individualDesktopContent}
          </section>
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl sm:text-2xl font-semibold text-foreground">
                Tests complets ({filteredFullTests.length})
              </h2>
            </div>
            {fullDesktopContent}
          </section>
        </div>
      )}

      {/* Test Attempts Modal */}
      <TestAttemptsModal
        test={selectedTest}
        open={!!selectedTest}
        onOpenChange={(open) => {
          if (!open) setSelectedTest(null)
        }}
        onSuccess={() => void refreshTests()}
      />

      <FullTestAttemptsModal
        test={selectedFullTest}
        open={!!selectedFullTest}
        onOpenChange={(open) => {
          if (!open) setSelectedFullTest(null)
        }}
        onSuccess={() => void refreshFullTests()}
      />
    </div>
  )
}
