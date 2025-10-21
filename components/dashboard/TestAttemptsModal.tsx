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
import { TestWithAttempts, TestAttempt } from '@/lib/types/database.types'
import { SUBTEST_LABELS } from '@/lib/constants/subtests'
import { useIsMobile } from '@/lib/hooks/useIsMobile'

interface TestAttemptsModalProps {
  test: TestWithAttempts | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

type AttemptWithFlag = (TestWithAttempts | TestAttempt) & { is_original?: boolean }

export function TestAttemptsModal({ test, open, onOpenChange, onSuccess }: TestAttemptsModalProps) {
  const isMobile = useIsMobile()
  const [loading, setLoading] = useState(false)
  const [showAddForm, setShowAddForm] = useState(false)
  const [newAttempt, setNewAttempt] = useState({
    date: new Date().toISOString().split('T')[0],
    score: '',
    duration_minutes: '',
    notes: '',
  })

  // Prevent body scroll when open on mobile
  useEffect(() => {
    if (isMobile && open) {
      document.body.style.overflow = 'hidden'
      document.body.style.overscrollBehavior = 'none'
    } else {
      document.body.style.overflow = ''
      document.body.style.overscrollBehavior = ''
    }
    return () => {
      document.body.style.overflow = ''
      document.body.style.overscrollBehavior = ''
    }
  }, [isMobile, open])

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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any).from('test_attempts').insert({
        test_id: test.id,
        date: new Date(newAttempt.date).toISOString(),
        score: parseInt(newAttempt.score) * 4, // Convert to score out of 60
        duration_minutes: newAttempt.duration_minutes ? parseInt(newAttempt.duration_minutes) : null,
        notes: newAttempt.notes || null,
      })

      if (error) throw error

      toast.success('Score ajouté avec succès!')
      setShowAddForm(false)
      setNewAttempt({
        date: new Date().toISOString().split('T')[0],
        score: '',
        duration_minutes: '',
        notes: '',
      })
      onSuccess()
    } catch (error) {
      console.error('Error adding attempt:', error)
      toast.error('Erreur lors de l\'ajout')
    } finally {
      setLoading(false)
    }
  }

  if (!test) return null

  const allAttempts: AttemptWithFlag[] = [
    { ...test, is_original: true },
    ...test.attempts.map(a => ({ ...a, is_original: false }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  const bestScore = Math.max(...allAttempts.map(a => a.score))
  const averageScore = allAttempts.reduce((sum, a) => sum + a.score, 0) / allAttempts.length

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
                <div className="text-2xl font-bold text-foreground">{averageScore.toFixed(1)}</div>
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
                  className="flex items-center justify-between py-3"
                >
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
                    {attempt.score === bestScore && allAttempts.length > 1 && (
                      <TrendingUp className="h-3.5 w-3.5 text-primary" />
                    )}
                    <span className="text-2xl font-bold text-primary">{attempt.score}</span>
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

          <div className="space-y-2">
            <Label htmlFor="score">Bonnes réponses (/15)</Label>
            <Input
              id="score"
              type="number"
              min="0"
              max="15"
              value={newAttempt.score}
              onChange={(e) => setNewAttempt({ ...newAttempt, score: e.target.value })}
              placeholder="0"
              required
            />
            <p className="text-xs text-muted-foreground">
              Score : {parseInt(newAttempt.score) * 4 || 0}/60
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Durée (minutes, optionnel)</Label>
            <Input
              id="duration"
              type="number"
              min="0"
              value={newAttempt.duration_minutes}
              onChange={(e) => setNewAttempt({ ...newAttempt, duration_minutes: e.target.value })}
              placeholder="20"
            />
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
                disabled={loading || !newAttempt.score}
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
          disabled={loading || !newAttempt.score}
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
            <DialogTitle>
              {test.name || SUBTEST_LABELS[test.subtest] || test.subtest}
            </DialogTitle>
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
        <h2 className="text-lg font-semibold">
          {test.name || SUBTEST_LABELS[test.subtest] || test.subtest}
        </h2>
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
