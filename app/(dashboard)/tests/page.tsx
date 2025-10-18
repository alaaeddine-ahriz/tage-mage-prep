import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AddTestForm } from '@/components/forms/AddTestForm'
import { Plus } from 'lucide-react'
import { ProgressChart } from '@/components/charts/ProgressChart'

export default async function TestsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: tests } = await supabase
    .from('tests')
    .select('*')
    .eq('user_id', user!.id)
    .order('date', { ascending: false })

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

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Tests & Scores
          </h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            Suivez vos performances aux TD et tests blancs
          </p>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un test
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nouveau test</DialogTitle>
            </DialogHeader>
            <AddTestForm />
          </DialogContent>
        </Dialog>
      </div>

      {/* Progress Chart */}
      {tests && tests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Évolution globale</CardTitle>
          </CardHeader>
          <CardContent>
            <ProgressChart tests={tests} />
          </CardContent>
        </Card>
      )}

      {/* Stats by Subtest */}
      {statsBySubtest && Object.keys(statsBySubtest).length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Object.entries(statsBySubtest).map(([subtest, stats]) => (
            <Card key={subtest}>
              <CardHeader>
                <CardTitle className="capitalize">{subtest}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Moyenne</span>
                  <span className="font-semibold">
                    {(stats.totalScore / stats.count).toFixed(1)}/15
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Meilleur score</span>
                  <span className="font-semibold">{stats.bestScore}/15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Dernier score</span>
                  <span className="font-semibold">{stats.lastScore}/15</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600 dark:text-slate-400">Tests</span>
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
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Historique des tests
          </h2>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {tests.map((test: any) => (
              <div
                key={test.id}
                className="flex items-center justify-between py-2"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-medium capitalize text-slate-900 dark:text-white">
                      {test.subtest}
                    </p>
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      • {test.type}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(test.date).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                    {test.duration_minutes && ` • ${test.duration_minutes} min`}
                  </p>
                  {test.notes && (
                    <p className="text-xs text-slate-600 dark:text-slate-400">
                      {test.notes}
                    </p>
                  )}
                </div>
                <span className="text-2xl font-bold text-blue-600">{test.score}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <Plus className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-semibold">Aucun test enregistré</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Ajoutez votre premier test pour commencer à suivre votre progression
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


