'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { AddNotionForm } from '@/components/forms/AddNotionForm'
import { Plus, Clock, TrendingUp, Loader2 } from 'lucide-react'
import { isDueForReview, updateMasteryLevel, calculateNextReviewDate, getNextReviewInterval } from '@/lib/utils/spaced-repetition'
import { toast } from 'sonner'

interface Notion {
  id: string
  title: string
  description?: string
  subtest: string
  mastery_level: number
  review_count: number
  next_review_at: string
  last_reviewed_at?: string
  user_id: string
  created_at: string
  updated_at: string
}

export default function NotionsPage() {
  const [notions, setNotions] = useState<Notion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotion, setSelectedNotion] = useState<Notion | null>(null)
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    loadNotions()
  }, [])

  const loadNotions = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('notions')
        .select('*')
        .eq('user_id', user!.id)
        .order('next_review_at', { ascending: true })

      setNotions(data || [])
    } catch (error) {
      console.error('Error loading notions:', error)
    } finally {
      setLoading(false)
    }
  }

  const notionsDue = notions.filter((n) => isDueForReview(n.next_review_at))
  const notionsUpcoming = notions.filter((n) => !isDueForReview(n.next_review_at))

  const openNotionModal = (notion: Notion) => {
    setSelectedNotion(notion)
  }


  const handleReview = async (success: boolean) => {
    if (!selectedNotion) return
    setUpdating(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')

      const currentLevel = selectedNotion.mastery_level || 0
      const newMasteryLevel = updateMasteryLevel(currentLevel, success)
      const nextReviewDate = calculateNextReviewDate(newMasteryLevel)
      const intervalDays = getNextReviewInterval(newMasteryLevel)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('notions')
        .update({
          mastery_level: newMasteryLevel,
          last_reviewed_at: new Date().toISOString(),
          next_review_at: nextReviewDate.toISOString(),
          review_count: (selectedNotion.review_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', selectedNotion.id)

      if (updateError) throw updateError

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('notion_reviews').insert({
        notion_id: selectedNotion.id,
        user_id: user.id,
        success,
        new_mastery_level: newMasteryLevel,
        next_review_interval_days: intervalDays,
      })

      toast.success(
        success
          ? `Parfait ! Prochaine révision dans ${intervalDays} jour${intervalDays > 1 ? 's' : ''}`
          : 'On révise demain !'
      )

      // Reload notions and close modal
      await loadNotions()
      setSelectedNotion(null)
    } catch (error) {
      console.error('Error updating:', error)
      toast.error('Erreur lors de la mise à jour')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Notions
        </h1>

        <Dialog>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Ajouter
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nouvelle notion</DialogTitle>
            </DialogHeader>
            <AddNotionForm onSuccess={loadNotions} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats compactes */}
      <div className="flex gap-2">
        <div className="flex items-center gap-1.5 rounded-md border bg-slate-50 px-3 py-1.5 dark:bg-slate-900">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total</span>
          <span className="text-lg font-bold">{notions?.length || 0}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-orange-200 bg-orange-50 px-3 py-1.5 dark:border-orange-900/50 dark:bg-orange-950/50">
          <Clock className="h-3.5 w-3.5 text-orange-600" />
          <span className="text-lg font-bold text-orange-600">{notionsDue.length}</span>
        </div>
        <div className="flex items-center gap-1.5 rounded-md border border-green-200 bg-green-50 px-3 py-1.5 dark:border-green-900/50 dark:bg-green-950/50">
          <TrendingUp className="h-3.5 w-3.5 text-green-600" />
          <span className="text-lg font-bold text-green-600">
            {notions && notions.length > 0
              ? (notions.reduce((acc: number, n) => acc + n.mastery_level, 0) / notions.length).toFixed(1)
              : '0.0'}
          </span>
        </div>
      </div>

      {/* Notions to Review */}
      {notionsDue.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            À réviser maintenant ({notionsDue.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {notionsDue.map((notion) => (
              <div
                key={notion.id}
                className="group relative h-48 w-full overflow-hidden rounded-lg border-2 border-orange-200 bg-gradient-to-br from-orange-100 via-orange-50 to-amber-100 dark:from-orange-950 dark:via-orange-900 dark:to-amber-950 p-4 text-left transition-all hover:shadow-lg dark:border-orange-900">
                  {/* Button to open modal */}
                  <button
                    onClick={() => openNotionModal(notion)}
                    className="absolute top-2 right-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-orange-600 text-white shadow-lg transition-transform hover:scale-110 hover:bg-orange-700 active:scale-95"
                    aria-label="Voir la notion"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  </button>
                  
                  {/* Content */}
                  <div className="relative flex h-full flex-col justify-between pointer-events-none">
                    <div className="flex items-start justify-between">
                      <span className="inline-flex items-center rounded-md bg-white/90 dark:bg-black/90 px-2 py-1 text-xs font-medium capitalize">
                        {notion.subtest}
                      </span>
                      <span className="inline-flex items-center rounded-md bg-orange-600 px-2 py-1 text-xs font-medium text-white">
                        <Clock className="mr-1 h-3 w-3" />
                        Réviser
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-slate-900 line-clamp-2 dark:text-white">
                        {notion.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                        <span>Niveau {notion.mastery_level}/5</span>
                        <span>{notion.review_count} révisions</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/50 dark:bg-black/30">
                        <div 
                          className="h-full bg-orange-600 transition-all"
                          style={{ width: `${(notion.mastery_level / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Notions */}
      {notionsUpcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">
            Prochaines révisions ({notionsUpcoming.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {notionsUpcoming.map((notion) => (
              <div key={notion.id} className="relative h-48 w-full overflow-hidden rounded-lg border transition-all hover:shadow-md">
                  {/* Background dégradé */}
                  <div className="absolute inset-0 bg-gradient-to-br from-slate-100 via-slate-50 to-blue-50 dark:from-slate-900 dark:via-slate-800 dark:to-blue-950" />
                  
                  {/* Button to open modal */}
                  <button
                    onClick={() => openNotionModal(notion)}
                    className="absolute top-2 right-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition-transform hover:scale-110 hover:bg-blue-700 active:scale-95"
                    aria-label="Voir la notion"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                    </svg>
                  </button>
                  
                  {/* Content overlay */}
                  <div className="relative flex h-full flex-col justify-between p-4 pointer-events-none">
                    <div className="flex items-start justify-between">
                      <span className="inline-flex items-center rounded-md bg-white/90 dark:bg-black/90 px-2 py-1 text-xs font-medium capitalize">
                        {notion.subtest}
                      </span>
                      {notion.mastery_level >= 4 && (
                        <span className="inline-flex items-center rounded-md bg-green-100 px-2 py-1 text-xs font-medium text-green-800 dark:bg-green-900 dark:text-green-100">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          Maîtrisée
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-slate-900 line-clamp-2 dark:text-white">
                        {notion.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-slate-700 dark:text-slate-300">
                        <span>Niveau {notion.mastery_level}/5</span>
                        <span>{new Date(notion.next_review_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/50 dark:bg-black/30">
                        <div 
                          className="h-full bg-blue-500 transition-all"
                          style={{ width: `${(notion.mastery_level / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {notions?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-slate-400" />
            <h3 className="mt-4 text-lg font-semibold">Aucune notion enregistrée</h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Ajoutez vos premières notions pour commencer à les réviser
            </p>
          </CardContent>
        </Card>
      )}

      {/* Review Modal */}
      <Dialog open={!!selectedNotion} onOpenChange={(open) => {
        if (!open) setSelectedNotion(null)
      }}>
        {selectedNotion && (
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-sm capitalize text-slate-600 dark:text-slate-400">
                {selectedNotion.subtest}
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4">
              <h2 className="text-xl font-bold">{selectedNotion.title}</h2>

              {selectedNotion.description && (
                <p className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap">
                  {selectedNotion.description}
                </p>
              )}

              <div className="flex gap-4 text-sm">
                <div>
                  <span className="text-slate-500">Niveau:</span>{' '}
                  <span className="font-medium">{selectedNotion.mastery_level}/5</span>
                </div>
                <div>
                  <span className="text-slate-500">Révisions:</span>{' '}
                  <span className="font-medium">{selectedNotion.review_count}</span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="destructive"
                  onClick={() => handleReview(false)}
                  disabled={updating}
                  className="flex-1"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Oublié'}
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleReview(true)}
                  disabled={updating}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Je sais'}
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>
    </div>
  )
}

