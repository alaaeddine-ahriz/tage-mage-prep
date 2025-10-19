import { createClient } from '@/lib/supabase/server'
import { Brain, TrendingUp, AlertCircle, Target, Calendar } from 'lucide-react'

export default async function ProfilePage() {
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

  const { data: notions } = await supabase
    .from('notions')
    .select('*')
    .eq('user_id', user!.id)

  const { data: errorsDue } = await supabase
    .from('errors')
    .select('*')
    .eq('user_id', user!.id)
    .lte('next_review_at', new Date().toISOString())

  const { data: notionsDue } = await supabase
    .from('notions')
    .select('*')
    .eq('user_id', user!.id)
    .lte('next_review_at', new Date().toISOString())

  // Calculate stats
  const averageScore = tests && tests.length > 0
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? (tests.reduce((acc, test: any) => acc + test.score, 0) / tests.length).toFixed(1)
    : '0.0'

  const totalTests = tests?.length || 0
  const totalErrors = errors?.length || 0
  const totalNotions = notions?.length || 0
  const errorsDueCount = errorsDue?.length || 0
  const notionsDueCount = notionsDue?.length || 0

  // Get user email
  const userEmail = user?.email || 'Utilisateur'

  return (
    <div className="space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Profil</h1>
        <p className="mt-1 text-sm text-muted-foreground">{userEmail}</p>
      </div>

      {/* Stats */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="flex items-center justify-between rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2">
            <Target className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">Score Moyen</span>
          </div>
          <span className="text-xl font-bold text-foreground">{averageScore}/15</span>
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            <span className="text-sm text-muted-foreground">Tests</span>
          </div>
          <span className="text-xl font-bold text-foreground">{totalTests}</span>
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-orange-600 dark:text-orange-400" />
            <span className="text-sm text-muted-foreground">Erreurs à Réviser</span>
          </div>
          <span className="text-xl font-bold text-foreground">{errorsDueCount}</span>
        </div>

        <div className="flex items-center justify-between rounded-lg border bg-card p-3">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-purple-600 dark:text-purple-400" />
            <span className="text-sm text-muted-foreground">Notions à Réviser</span>
          </div>
          <span className="text-xl font-bold text-foreground">{notionsDueCount}</span>
        </div>
      </div>

      {/* Overview */}
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Erreurs</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-bold text-foreground">{totalErrors}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">À réviser</span>
              <span className="text-lg font-bold text-primary">{errorsDueCount}</span>
            </div>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <h3 className="mb-3 text-sm font-semibold text-foreground">Notions</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Total</span>
              <span className="text-lg font-bold text-foreground">{totalNotions}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">À réviser</span>
              <span className="text-lg font-bold text-primary">{notionsDueCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Historique des Tests */}
      {tests && tests.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-foreground">Historique des Tests</h2>
          <div className="space-y-2">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {tests.slice(0, 5).map((test: any) => {
              const score = test.score
              const maxScore = 15
              const percentage = (score / maxScore) * 100
              
              let badgeColor = 'bg-green-500'
              if (percentage < 40) badgeColor = 'bg-red-500'
              else if (percentage < 70) badgeColor = 'bg-yellow-500'
              
              return (
                <div key={test.id} className="flex items-center justify-between rounded-lg border bg-card p-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground capitalize truncate">{test.subtest}</p>
                    <div className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3 shrink-0" />
                      <span>{new Date(test.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' })}</span>
                      <span>•</span>
                      <span className="capitalize">{test.type}</span>
                    </div>
                  </div>
                  <div className={`ml-3 rounded-lg ${badgeColor} px-2.5 py-1 text-sm font-semibold text-white`}>
                    {score}/{maxScore}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Empty State */}
      {totalTests === 0 && totalErrors === 0 && totalNotions === 0 && (
        <div className="rounded-lg border bg-card py-12 text-center">
          <Target className="mx-auto h-12 w-12 text-muted-foreground" />
          <h3 className="mt-4 text-base font-semibold text-foreground">Commencez votre préparation</h3>
          <p className="mt-2 text-sm text-muted-foreground">
            Ajoutez vos premiers tests, erreurs et notions
          </p>
        </div>
      )}
    </div>
  )
}
