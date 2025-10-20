'use client'

import { useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Calendar, Loader2, LogOut, Moon, Sun } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { SUBTEST_LABELS } from '@/lib/constants/subtests'
import {
  Notion,
  Error as ErrorType,
  TestWithAttempts,
  FullTestWithAttempts,
} from '@/lib/types/database.types'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'
import { signOut } from '@/lib/supabase/auth'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { useDashboardData } from '@/lib/state/dashboard-data'
import { WorkCalendar } from '@/components/dashboard/WorkCalendar'

export default function ProfilePage() {
  const [userEmail, setUserEmail] = useState<string>('Utilisateur')
  const { theme, setTheme, resolvedTheme } = useTheme()
  const router = useRouter()
  const isMobile = useIsMobile()
  const {
    tests: testsData,
    fullTests,
    errors,
    notions,
    isInitializing,
  } = useDashboardData()

  const tests = (testsData ?? []) as TestWithAttempts[]
  const fullTestsList = (fullTests ?? []) as FullTestWithAttempts[]
  const notionsList = (notions ?? []) as Notion[]

  useEffect(() => {
    const fetchUserEmail = async () => {
      try {
        const supabase = createClient()
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (user?.email) setUserEmail(user.email)
      } catch (error) {
        console.error(error)
      }
    }

    void fetchUserEmail()
  }, [])

  const errorsDue = useMemo(() => {
    const now = new Date()
    const list = (errors ?? []) as ErrorType[]
    return list.filter(
      (error) =>
        error.next_review_at && new Date(error.next_review_at) <= now
    )
  }, [errors])

  const notionsDue = useMemo(() => {
    const now = new Date()
    const list = (notions ?? []) as Notion[]
    return list.filter(
      (notion) =>
        notion.next_review_at && new Date(notion.next_review_at) <= now
    )
  }, [notions])

  if (isInitializing) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const averageScore = tests.length
    ? (tests.reduce((acc, t) => acc + t.score, 0) / tests.length).toFixed(1)
    : '0.0'

  const mastered = notionsList.filter((n) => n.mastery_level >= 4).length
  const masteryPct =
    notionsList.length > 0
      ? Math.round((mastered / notionsList.length) * 100)
      : 0

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
        <h1 className="text-2xl md:text-4xl font-bold text-foreground">Dashboard</h1>
      </div>

      {/* Résumé */}
      <div className="space-y-4">
        <h2 className="text-xl sm:text-3xl font-semibold text-foreground">Résumé</h2>

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

      {/* Calendrier des activités */}
      <div className="space-y-3">
        <h2 className="text-xl sm:text-3xl font-semibold text-foreground">Activités récentes</h2>
        <WorkCalendar tests={tests} fullTests={fullTestsList} />
      </div>

      {/* Historique des tests */}
      {tests.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xl sm:text-3xl font-semibold text-foreground">Derniers tests</h2>
          <div className="divide-y divide-border">
            {tests.slice(0, 5).map((test) => {
              const pct = (test.score / 15) * 100
              const color = pct < 60 ? 'text-destructive' : pct < 80 ? 'text-amber-500' : 'text-green-500'

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
                      <span className="capitalize">{test.type || '—'}</span>
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
