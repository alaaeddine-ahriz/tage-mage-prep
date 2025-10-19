'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Target, TrendingUp, AlertCircle, Brain, Calendar, Loader2, LogOut, Moon, Sun, Monitor } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SUBTEST_LABELS } from '@/lib/constants/subtests'
import { Notion, Error as ErrorType } from '@/lib/types/database.types'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/supabase/auth'
import { useIsMobile } from '@/lib/hooks/useIsMobile'

interface Test {
  id: string
  name: string
  score: number
  date: string
  subtest: string
  type: string
}

export default function ProfilePage() {
  const [loading, setLoading] = useState(true)
  const [tests, setTests] = useState<Test[]>([])
  const [errorsDue, setErrorsDue] = useState<ErrorType[]>([])
  const [notionsDue, setNotionsDue] = useState<Notion[]>([])
  const [notions, setNotions] = useState<Notion[]>([])
  const [userEmail, setUserEmail] = useState<string>('Utilisateur')
  const { theme, setTheme, resolvedTheme } = useTheme()
  const router = useRouter()
  const isMobile = useIsMobile()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user?.email) setUserEmail(user.email)

      const [
        { data: testsData },
        { data: errorsDueData },
        { data: notionsDueData },
        { data: notionsData }
      ] = await Promise.all([
        supabase.from('tests').select('*').eq('user_id', user!.id).order('date', { ascending: false }),
        supabase.from('errors').select('*').eq('user_id', user!.id).lte('next_review_at', new Date().toISOString()),
        supabase.from('notions').select('*').eq('user_id', user!.id).lte('next_review_at', new Date().toISOString()),
        supabase.from('notions').select('*').eq('user_id', user!.id)
      ])

      setTests(testsData || [])
      setErrorsDue(errorsDueData || [])
      setNotionsDue(notionsDueData || [])
      setNotions(notionsData || [])
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const averageScore = tests.length
    ? (tests.reduce((acc, t) => acc + t.score, 0) / tests.length).toFixed(1)
    : '0.0'

  const mastered = notions.filter((n) => n.mastery_level >= 4).length
  const masteryPct = notions.length > 0 ? Math.round((mastered / notions.length) * 100) : 0

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  const handleThemeToggle = () => {
    if (theme === 'system') {
      setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')
    } else {
      setTheme(theme === 'dark' ? 'light' : 'dark')
    }
  }

  const isDarkMode = resolvedTheme === 'dark'

  return (
    <div className="space-y-8 md:space-y-12 md:pt-4">
      {/* Header */}
      <div className="space-y-1 md:space-y-2 md:mt-6">
        <h1 className="text-2xl md:text-4xl font-bold text-foreground">Profil</h1>
        <p className="text-sm md:text-base text-muted-foreground">{userEmail}</p>
      </div>

      {/* Résumé */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-foreground">Résumé</h2>

        {/* Progression globale */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Progression globale</p>
          <div className="h-2 w-full rounded-full bg-muted">
            <div
              className="h-full bg-primary rounded-full transition-all"
              style={{ width: `${masteryPct}%` }}
            />
          </div>
          <p className="text-xs text-muted-foreground">{masteryPct}% de notions maîtrisées</p>
        </div>

        {/* Stats principales */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/20 p-4 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <div className="relative">
              <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-1">
                Score moyen
              </div>
              <div className="text-2xl font-bold text-foreground">{averageScore}/60</div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/20 p-4 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <div className="relative">
              <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-1">
                Tests
              </div>
              <div className="text-2xl font-bold text-foreground">{tests.length}</div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background p-4 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="relative">
              <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-1">
                Erreurs
              </div>
              <div className="text-2xl font-bold text-primary">{errorsDue.length}</div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background p-4 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="relative">
              <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-1">
                Notions
              </div>
              <div className="text-2xl font-bold text-primary">{notionsDue.length}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Historique des tests */}
      {tests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Derniers tests</h2>
          <div className="divide-y divide-border">
            {tests.slice(0, 5).map((test) => {
              const pct = (test.score / 15) * 100
              const color = pct < 40 ? 'text-destructive' : pct < 70 ? 'text-amber-500' : 'text-green-500'

              return (
                <div key={test.id} className="flex items-center justify-between py-3">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium truncate">
                      {test.name || SUBTEST_LABELS[test.subtest] || test.subtest}
                    </p>
                    <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(test.date).toLocaleDateString('fr-FR')}</span>
                      <span>•</span>
                      <span className="capitalize">{test.type}</span>
                    </div>
                  </div>
                  <span className={`ml-3 font-semibold ${color}`}>
                    {test.score}/60
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}
      
      {/* Mobile: Theme Toggle & Sign Out - At the bottom */}
      {isMobile && (
        <div className="flex gap-3">
          <Button
            onClick={handleThemeToggle}
            variant="outline"
            className="flex-1 h-12 rounded-xl"
          >
            {isDarkMode ? (
              <>
                <Sun className="h-5 w-5 mr-2" />
                Mode clair
              </>
            ) : (
              <>
                <Moon className="h-5 w-5 mr-2" />
                Mode sombre
              </>
            )}
          </Button>
          <Button
            onClick={handleSignOut}
            variant="destructive"
            className="flex-1 h-12 rounded-xl"
          >
            <LogOut className="h-5 w-5 mr-2" />
            Déconnexion
          </Button>
        </div>
      )}
    </div>
  )
}

function Stat({ label, value, icon }: { label: string; value: string | number; icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-md border bg-muted px-3 py-2 text-sm">
      <div className="flex flex-col leading-tight">
        <span className="text-muted-foreground text-xs">{label}</span>
        <span className="font-semibold text-foreground text-base">{value}</span>
      </div>
      <div className="shrink-0">{icon}</div>
    </div>
  )
}
