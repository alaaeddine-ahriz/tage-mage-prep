'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
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
import { Plus, Loader2 } from 'lucide-react'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { Test, TestWithAttempts, FullTestWithAttempts, FullTestSubtest } from '@/lib/types/database.types'
import { SUBTESTS, SUBTEST_LABELS } from '@/lib/constants/subtests'

const TEST_TYPES = [
  { value: 'all', label: 'Tous' },
  { value: 'TD', label: 'TD' },
  { value: 'Blanc', label: 'Blanc' },
]

export default function TestsPage() {
  const [tests, setTests] = useState<TestWithAttempts[]>([])
  const [fullTests, setFullTests] = useState<FullTestWithAttempts[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isFullTestFormOpen, setIsFullTestFormOpen] = useState(false)
  const [selectedTest, setSelectedTest] = useState<TestWithAttempts | null>(null)
  const [selectedFullTest, setSelectedFullTest] = useState<FullTestWithAttempts | null>(null)
  const [subtestFilter, setSubtestFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const [activeTab, setActiveTab] = useState<'individual' | 'full'>('individual')
  const isMobile = useIsMobile()

  useEffect(() => {
    loadTests()
    loadFullTests()
  }, [])

  const loadTests = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { data: testsData } = await supabase
        .from('tests')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })

      if (testsData) {
        // Load attempts for each test
        const testsWithAttempts = await Promise.all(
          testsData.map(async (test: Test) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: attempts } = await (supabase as any)
              .from('test_attempts')
              .select('*')
              .eq('test_id', test.id)
              .order('date', { ascending: false })

            return {
              ...test,
              attempts: attempts || [],
            }
          })
        )
        setTests(testsWithAttempts as TestWithAttempts[])
      }
    } catch (error) {
      console.error('Error loading tests:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadFullTests = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: fullTestsData } = await (supabase as any)
        .from('full_tests')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })

      if (fullTestsData) {
        // Load subtests and attempts for each full test
        const fullTestsWithData = await Promise.all(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          fullTestsData.map(async (fullTest: any) => {
            // Load subtests
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: subtests } = await (supabase as any)
              .from('full_test_subtests')
              .select('*')
              .eq('full_test_id', fullTest.id)
              .order('created_at', { ascending: true })

            // Load attempts
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: attemptsData } = await (supabase as any)
              .from('full_test_attempts')
              .select('*')
              .eq('full_test_id', fullTest.id)
              .order('date', { ascending: false })

            // Load subtests for each attempt
            const attempts = attemptsData ? await Promise.all(
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              attemptsData.map(async (attempt: any) => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const { data: attemptSubtests } = await (supabase as any)
                  .from('full_test_attempt_subtests')
                  .select('*')
                  .eq('attempt_id', attempt.id)

                return {
                  ...attempt,
                  subtests: attemptSubtests || [],
                }
              })
            ) : []

            return {
              ...fullTest,
              subtests: subtests || [],
              attempts,
            }
          })
        )
        setFullTests(fullTestsWithData as FullTestWithAttempts[])
      }
    } catch (error) {
      console.error('Error loading full tests:', error)
    }
  }

  const handleFormSuccess = () => {
    loadTests()
    setIsFormOpen(false)
  }

  const handleFullTestFormSuccess = () => {
    loadFullTests()
    setIsFullTestFormOpen(false)
  }

  const handleTestClick = (test: TestWithAttempts) => {
    setSelectedTest(test)
  }

  // Filter tests
  const filteredTests = tests.filter((test) => {
    const matchesSubtest = subtestFilter === 'all' || test.subtest === subtestFilter
    const matchesType = typeFilter === 'all' || test.type === typeFilter
    return matchesSubtest && matchesType
  })

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
        {filteredTests.map((test: TestWithAttempts) => (
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
              <p className="text-xs text-muted-foreground">
                {new Date(test.date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
                {test.duration_minutes && ` • ${test.duration_minutes} min`}
              </p>
              {test.notes && (
                <p className="text-xs text-muted-foreground line-clamp-1">{test.notes}</p>
              )}
            </div>
            <span className="ml-4 text-2xl font-bold text-primary">{test.score}</span>
          </div>
        ))}
      </div>
    ) : (
      <div className="py-8 text-center">
        <p className="text-sm text-muted-foreground">
          Aucun test ne correspond aux filtres sélectionnés
        </p>
      </div>
    )

  const individualMobileContent =
    tests.length > 0 ? (
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-foreground">
          Historique ({filteredTests.length})
        </h2>
        {individualListContent}
      </div>
    ) : (
      emptyIndividualState
    )

  const individualDesktopContent = tests.length > 0 ? individualListContent : emptyIndividualState

  const fullListContent =
    fullTests.length > 0 ? (
      <div className="divide-y divide-border">
        {fullTests.map((fullTest) => (
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
                <span className="text-xs text-muted-foreground">•</span>
                <span
                  className={`text-xs font-medium ${
                    fullTest.type === 'Blanc' ? 'text-primary' : 'text-muted-foreground'
                  }`}
                >
                  {fullTest.type}
                </span>
                {fullTest.attempts && fullTest.attempts.length > 0 && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <span className="text-xs text-muted-foreground">
                      {fullTest.attempts.length + 1} tentative{fullTest.attempts.length > 0 ? 's' : ''}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(fullTest.date).toLocaleDateString('fr-FR', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
                {fullTest.duration_minutes && ` • ${fullTest.duration_minutes} min`}
              </p>
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
        ))}
      </div>
    ) : emptyFullState

  const fullMobileContent =
    fullTests.length > 0 ? (
      <div className="space-y-2">
        <h2 className="text-base font-semibold text-foreground">
          Historique ({fullTests.length})
        </h2>
        {fullListContent}
      </div>
    ) : (
      emptyFullState
    )

  const fullDesktopContent = fullListContent

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

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
        {isMobile && (tests.length > 0 || fullTests.length > 0) && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'individual' | 'full')} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="individual">
                Individuels ({tests.length})
              </TabsTrigger>
              <TabsTrigger value="full">
                Complets ({fullTests.length})
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}

        {/* Filters - Mobile sous les tabs */}
        {isMobile && (tests.length > 0 || fullTests.length > 0) && (
          <div className="flex gap-2">
            {activeTab === 'individual' && (
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

                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="w-32">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TEST_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

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
            )}
            
            {activeTab === 'full' && (
              <MobileFormSheet
                open={isFullTestFormOpen}
                onOpenChange={setIsFullTestFormOpen}
                title="Nouveau test complet"
                trigger={
                  <Button onClick={() => setIsFullTestFormOpen(true)} className="w-full">
                    <Plus className="mr-2 h-4 w-4" />
                    Ajouter un test complet
                  </Button>
                }
              >
                <AddFullTestForm onSuccess={handleFullTestFormSuccess} />
              </MobileFormSheet>
            )}
          </div>
        )}

        {/* Filters - Desktop */}
        {!isMobile && tests.length > 0 && (
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
            </div>
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
              <h2 className="text-xl font-semibold text-foreground">
                Tests individuels ({filteredTests.length})
              </h2>
            </div>
            {individualDesktopContent}
          </section>
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-foreground">
                Tests complets ({fullTests.length})
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
        onSuccess={loadTests}
      />

      <FullTestAttemptsModal
        test={selectedFullTest}
        open={!!selectedFullTest}
        onOpenChange={(open) => {
          if (!open) setSelectedFullTest(null)
        }}
        onSuccess={loadFullTests}
      />
    </div>
  )
}
