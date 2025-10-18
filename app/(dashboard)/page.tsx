import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Brain, TrendingUp, AlertCircle, Target } from 'lucide-react'

export default async function DashboardPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch stats
  const { data: tests } = await supabase
    .from('tests')
    .select('*')
    .eq('user_id', user!.id)
    .order('date', { ascending: false })

  const { data: errors } = await supabase
    .from('errors')
    .select('*')
    .eq('user_id', user!.id)
    .lte('next_review_at', new Date().toISOString())

  const { data: notionsDue } = await supabase
    .from('notions')
    .select('*')
    .eq('user_id', user!.id)
    .lte('next_review_at', new Date().toISOString())

  const averageScore = tests && tests.length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (tests.reduce((acc, test: any) => acc + test.score, 0) / tests.length).toFixed(1)
    : '0.0'

  const totalTests = tests?.length || 0
  const errorsDueCount = errors?.length || 0
  const notionsToReview = notionsDue?.length || 0

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
          Dashboard
        </h1>
        <p className="mt-2 text-slate-600 dark:text-slate-400">
          Vue d&apos;ensemble de votre préparation au Tage Mage
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score Moyen</CardTitle>
            <Target className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageScore}/15</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Sur {totalTests} test{totalTests > 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tests Effectués</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTests}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              TD et blancs confondus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Erreurs à Réviser</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorsDueCount}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aujourd&apos;hui
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Notions à Réviser</CardTitle>
            <Brain className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notionsToReview}</div>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aujourd&apos;hui
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Tests */}
      {tests && tests.length > 0 && (
        <div className="space-y-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Tests Récents
          </h2>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {tests.slice(0, 5).map((test: any) => (
              <div
                key={test.id}
                className="flex items-center justify-between py-2"
              >
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-white capitalize">
                    {test.subtest}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {new Date(test.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} • {test.type}
                  </p>
                </div>
                <span className="text-2xl font-bold text-blue-600">{test.score}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalTests === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-semibold">Aucun test enregistré</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Commencez par ajouter votre premier test pour suivre votre progression
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}


