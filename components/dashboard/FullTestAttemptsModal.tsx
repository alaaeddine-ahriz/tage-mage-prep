'use client'

import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { FloatingButtonsContainer, FloatingButton } from '@/components/ui/floating-buttons'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { Loader2, Plus, TrendingUp, X } from 'lucide-react'
import { FullTestWithAttempts } from '@/lib/types/database.types'
import { SUBTEST_LABELS } from '@/lib/constants/subtests'
import { useIsMobile } from '@/lib/hooks/useIsMobile'

interface FullTestAttemptsModalProps {
  test: FullTestWithAttempts | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function FullTestAttemptsModal({ test, open, onOpenChange, onSuccess }: FullTestAttemptsModalProps) {
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAttempt, setNewAttempt] = useState({
    date: new Date().toISOString().split('T')[0],
    notes: '',
    subtests: {} as Record<string, string>,
  })

  // Prevent body scroll when open on mobile
  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isMobile, open])

  // Initialize subtest scores from original test
  useEffect(() => {
    if (test && showAddForm) {
      const initialScores: Record<string, string> = {}
      test.subtests.forEach(subtest => {
        initialScores[subtest.subtest] = subtest.correct_answers.toString()
      })
      setNewAttempt(prev => ({ ...prev, subtests: initialScores }))
    }
  }, [test, showAddForm])

  const handleAddAttempt = async () => {
    if (!test) return

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Vous devez être connecté')
        return
      }

      // Calculate total score
      let rawTotalScore = 0
      const subtestsData = Object.entries(newAttempt.subtests).map(([subtest, correctAnswers]) => {
        const score = parseInt(correctAnswers) * 4
        rawTotalScore += score
        return {
          subtest,
          correct_answers: parseInt(correctAnswers),
          score,
        }
      })

      // Normalize score from 360 to 600
      // (6 subtests × 15 questions × 4 points = 360 max raw score)
      const totalScore = Math.round((rawTotalScore / 360) * 600)

      // Insert attempt
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: attemptData, error: attemptError } = await (supabase as any)
        .from('full_test_attempts')
        .insert({
          full_test_id: test.id,
          date: newAttempt.date,
          total_score: totalScore,
          notes: newAttempt.notes || null,
        })
        .select()
        .single()

      if (attemptError) throw attemptError

      // Insert subtests
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: subtestsError } = await (supabase as any)
        .from('full_test_attempt_subtests')
        .insert(
          subtestsData.map(st => ({
            attempt_id: attemptData.id,
            ...st,
          }))
        )

      if (subtestsError) throw subtestsError

      toast.success('Score ajouté avec succès')
      setNewAttempt({
        date: new Date().toISOString().split('T')[0],
        notes: '',
        subtests: {},
      })
      setShowAddForm(false)
      onSuccess()
    } catch (error) {
      console.error('Error adding attempt:', error)
      toast.error('Erreur lors de l\'ajout du score')
    } finally {
      setLoading(false)
    }
  }

  if (!test) return null

  // Combine original test with attempts for display
  const allAttempts = [
    {
      id: test.id,
      date: test.date,
      total_score: test.total_score,
      notes: test.notes,
      subtests: test.subtests,
      is_original: true,
    },
    ...test.attempts.map(a => ({ ...a, is_original: false })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const bestScore = Math.max(...allAttempts.map(a => a.total_score))
  const averageScore = allAttempts.reduce((sum, a) => sum + a.total_score, 0) / allAttempts.length

  const contentView = (
    <>
      {!showAddForm ? (
        <div className="space-y-4">
          {/* Stats modernes */}
          <div className="grid grid-cols-3 gap-3">
            <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/20 p-4 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="relative">
                <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-1">
                  Tentatives
                </div>
                <div className="text-2xl font-bold text-foreground">{allAttempts.length}</div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background p-4 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
              <div className="relative">
                <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-1">
                  Meilleur
                </div>
                <div className="text-2xl font-bold text-primary">{bestScore}</div>
              </div>
            </div>
            <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/20 p-4 backdrop-blur-sm">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="relative">
                <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-1">
                  Moyenne
                </div>
                <div className="text-2xl font-bold text-foreground">{averageScore.toFixed(0)}</div>
              </div>
            </div>
          </div>

          {/* Liste des scores */}
          <div className="space-y-2">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Historique</h3>
            <div className="divide-y divide-border">
              {allAttempts.map((attempt, index) => (
                <div
                  key={attempt.id || index}
                  className="py-3 space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          {new Date(attempt.date).toLocaleDateString('fr-FR', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </span>
                        {attempt.is_original && (
                          <span className="text-xs text-muted-foreground">• Initial</span>
                        )}
                      </div>
                      {attempt.notes && (
                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                          {attempt.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 ml-3 shrink-0">
                      {attempt.total_score === bestScore && allAttempts.length > 1 && (
                        <TrendingUp className="h-3.5 w-3.5 text-primary" />
                      )}
                      <span className="text-2xl font-bold text-primary">{attempt.total_score}</span>
                    </div>
                  </div>
                  
                  {/* Détails des sous-tests */}
                  <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs pl-0">
                    {attempt.subtests.map((subtest) => (
                      <div key={subtest.id} className="flex items-center justify-between">
                        <span className="text-muted-foreground">
                          {SUBTEST_LABELS[subtest.subtest] || subtest.subtest}
                        </span>
                        <span className="font-semibold">{subtest.score}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <form onSubmit={(e) => { e.preventDefault(); handleAddAttempt(); }} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="date">Date</Label>
            <Input
              id="date"
              type="date"
              value={newAttempt.date}
              onChange={(e) => setNewAttempt({ ...newAttempt, date: e.target.value })}
              required
            />
          </div>

          {/* Scores par sous-test */}
          <div className="space-y-3">
            <Label>Scores par sous-test (bonnes réponses /15)</Label>
            <div className="grid grid-cols-2 gap-3">
              {test.subtests.map((subtest) => (
                <div key={subtest.id} className="space-y-1">
                  <Label htmlFor={`subtest-${subtest.subtest}`} className="text-xs">
                    {SUBTEST_LABELS[subtest.subtest] || subtest.subtest}
                  </Label>
                  <Input
                    id={`subtest-${subtest.subtest}`}
                    type="number"
                    min="0"
                    max="15"
                    value={newAttempt.subtests[subtest.subtest] || ''}
                    onChange={(e) => setNewAttempt({
                      ...newAttempt,
                      subtests: {
                        ...newAttempt.subtests,
                        [subtest.subtest]: e.target.value,
                      }
                    })}
                    placeholder="0"
                    required
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optionnel)</Label>
            <Textarea
              id="notes"
              value={newAttempt.notes}
              onChange={(e) => setNewAttempt({ ...newAttempt, notes: e.target.value })}
              placeholder="Commentaires..."
              rows={3}
              className="resize-none"
            />
          </div>
        </form>
      )}
    </>
  )

  const renderFooter = (mobile: boolean) => {
    const isFormValid = Object.keys(newAttempt.subtests).length === test.subtests.length

    if (mobile) {
      return (
        <>
          {!showAddForm ? (
            <FloatingButton onClick={() => setShowAddForm(true)} className="w-full">
              <Plus className="mr-2 h-5 w-5" />
              Ajouter un score
            </FloatingButton>
          ) : (
            <>
              <FloatingButton
                type="button"
                onClick={handleAddAttempt}
                disabled={loading || !isFormValid}
              >
                {loading && <Loader2 className="mr-2 h-5 w-5 animate-spin" />}
                Enregistrer
              </FloatingButton>
              <FloatingButton
                type="button"
                variant="outline"
                onClick={() => setShowAddForm(false)}
                disabled={loading}
              >
                Annuler
              </FloatingButton>
            </>
          )}
        </>
      )
    }

    if (!showAddForm) {
      return (
        <div className="flex justify-end gap-3">
          <Button type="button" onClick={() => setShowAddForm(true)} disabled={loading}>
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un score
          </Button>
        </div>
      )
    }

    return (
      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => setShowAddForm(false)}
          disabled={loading}
        >
          Annuler
        </Button>
        <Button
          type="button"
          onClick={handleAddAttempt}
          disabled={loading || !isFormValid}
        >
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Enregistrer
        </Button>
      </div>
    )
  }

  // Desktop: Use Dialog
  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{test.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {contentView}
            {renderFooter(false)}
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  // Mobile: Full screen
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4 py-3">
        <h2 className="text-lg font-semibold">{test.name}</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onOpenChange(false)}
          className="h-9 w-9 shrink-0"
        >
          <X className="h-5 w-5" />
        </Button>
      </div>

      {/* Content */}
      <div className="h-[calc(100vh-60px)] overflow-y-auto pb-32">
        <div className="container max-w-4xl mx-auto p-4">
          {contentView}
        </div>
      </div>

      {/* Footer - Flottant au dessus de la navbar */}
      <FloatingButtonsContainer>
        {renderFooter(true)}
      </FloatingButtonsContainer>
    </div>
  )
}
