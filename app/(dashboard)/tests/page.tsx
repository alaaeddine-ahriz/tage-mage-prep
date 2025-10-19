'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { MobileFormSheet } from '@/components/ui/mobile-form-sheet'
import { AddTestForm } from '@/components/forms/AddTestForm'
import { Plus, Loader2, TrendingUp, Target } from 'lucide-react'
import { ProgressChart } from '@/components/charts/ProgressChart'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { Test } from '@/lib/types/database.types'

const SUBTESTS = [
  { value: 'all', label: 'Tous' },
  { value: 'calcul', label: 'Calcul' },
  { value: 'logique', label: 'Logique' },
  { value: 'expression', label: 'Expression' },
  { value: 'comprehension', label: 'Compréhension' },
  { value: 'conditions', label: 'Conditions' },
]

const TEST_TYPES = [
  { value: 'all', label: 'Tous' },
  { value: 'TD', label: 'TD' },
  { value: 'Blanc', label: 'Blanc' },
]

export default function TestsPage() {
  const [tests, setTests] = useState<Test[]>([])
  const [loading, setLoading] = useState(true)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [subtestFilter, setSubtestFilter] = useState('all')
  const [typeFilter, setTypeFilter] = useState('all')
  const isMobile = useIsMobile()

  useEffect(() => {
    loadTests()
  }, [])

  const loadTests = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      const { data } = await supabase
        .from('tests')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })

      setTests((data as Test[]) || [])
    } catch (error) {
      console.error('Error loading tests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFormSuccess = () => {
    loadTests()
    setIsFormOpen(false)
  }

  // Filter tests
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filteredTests = tests.filter((test: any) => {
    const matchesSubtest = subtestFilter === 'all' || test.subtest === subtestFilter
    const matchesType = typeFilter === 'all' || test.type === typeFilter
    return matchesSubtest && matchesType
  })

  // Calculate stats by subtest
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const statsBySubtest = tests?.reduce((acc, test: any) => {
    if (!acc[test.subtest]) {
      acc[test.subtest] = {
        count: 0,
        totalScore: 0,
        bestScore: 0,
        lastScore: 0,
      }
    }
    acc[test.subtest].count++
    acc[test.subtest].totalScore += test.score
    acc[test.subtest].bestScore = Math.max(acc[test.subtest].bestScore, test.score)
    if (acc[test.subtest].count === 1) {
      acc[test.subtest].lastScore = test.score
    }
    return acc
  }, {} as Record<string, { count: number; totalScore: number; bestScore: number; lastScore: number }>)

  // Calculate overall average
  const overallAverage = tests.length > 0 
    ? tests.reduce((sum: number, test: Test) => sum + test.score, 0) / tests.length
    : 0

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground">
            Tests & Scores
          </h1>

          {!isMobile && (
            <MobileFormSheet
              open={isFormOpen}
              onOpenChange={setIsFormOpen}
              title="Nouveau test"
              trigger={
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              }
            >
              <AddTestForm onSuccess={handleFormSuccess} />
            </MobileFormSheet>
          )}
        </div>

        {/* Filters - Mobile sous le titre */}
        {isMobile && tests.length > 0 && (
          <div className="flex gap-2">
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
              title="Nouveau test"
              trigger={
                <Button onClick={() => setIsFormOpen(true)} size="icon" className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              }
            >
              <AddTestForm onSuccess={handleFormSuccess} />
            </MobileFormSheet>
          </div>
        )}

        {/* Filters - Desktop */}
        {!isMobile && tests.length > 0 && (
          <div className="flex gap-2">
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
          </div>
        )}
      </div>

      {/* Stats - Carte ultra fine - Desktop only */}
      {!isMobile && tests.length > 0 && (
        <Card className="bg-muted/50">
          <CardContent className="p-0">
            <div className="flex items-center justify-around divide-x divide-border">
              <div className="flex flex-1 items-center justify-center gap-1.5 py-2">
                <span className="text-xs">📊</span>
                <span className="text-base font-bold text-foreground">{tests.length}</span>
              </div>
              <div className="flex flex-1 items-center justify-center gap-1.5 py-2">
                <TrendingUp className="h-3.5 w-3.5 text-primary" />
                <span className="text-base font-bold text-primary">{overallAverage.toFixed(1)}</span>
              </div>
              <div className="flex flex-1 items-center justify-center gap-1.5 py-2">
                <Target className="h-3.5 w-3.5 text-primary" />
                <span className="text-base font-bold text-primary">
                  {Math.max(...tests.map((t: Test) => t.score))}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Chart - Desktop only */}
      {!isMobile && tests && tests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Évolution globale</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart tests={tests} />
          </CardContent>
        </Card>
      )}

      {/* Stats by Subtest - Desktop only */}
      {!isMobile && statsBySubtest && Object.keys(statsBySubtest).length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(statsBySubtest).map(([subtest, stats]) => (
            <Card key={subtest}>
              <CardHeader>
                <CardTitle className="capitalize">{subtest}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Moyenne</span>
                  <span className="font-semibold">
                    {(stats.totalScore / stats.count).toFixed(1)}/15
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Meilleur score</span>
                  <span className="font-semibold">{stats.bestScore}/15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Dernier score</span>
                  <span className="font-semibold">{stats.lastScore}/15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Tests</span>
                  <span className="font-semibold">{stats.count}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Tests List */}
      {tests && tests.length > 0 ? (
        <div className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">
            Historique ({filteredTests.length})
          </h2>
          {filteredTests.length > 0 ? (
            <div className="divide-y divide-border">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {filteredTests.map((test: any) => (
                <div key={test.id} className="flex items-center justify-between py-3">
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium capitalize text-foreground">
                        {test.subtest}
                      </span>
                      <span className="text-xs text-muted-foreground">•</span>
                      <span className={`text-xs font-medium ${
                        test.type === 'Blanc' 
                          ? 'text-primary'
                          : 'text-muted-foreground'
                      }`}>
                        {test.type}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(test.date).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                      {test.duration_minutes && ` • ${test.duration_minutes} min`}
                    </p>
                    {test.notes && (
                      <p className="text-xs text-muted-foreground line-clamp-1">
                        {test.notes}
                      </p>
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
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Plus className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Aucun test enregistré</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Ajoutez votre premier test pour commencer à suivre votre progression
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


