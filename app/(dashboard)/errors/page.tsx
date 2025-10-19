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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MobileCarousel } from '@/components/ui/mobile-carousel'
import { MobileFormSheet } from '@/components/ui/mobile-form-sheet'
import { FloatingButtonsContainer, FloatingButton } from '@/components/ui/floating-buttons'
import { AddErrorForm } from '@/components/forms/AddErrorForm'
import { Plus, Clock, CheckCircle, Loader2 } from 'lucide-react'
import { isDueForReview, updateMasteryLevel, calculateNextReviewDate, getNextReviewInterval } from '@/lib/utils/spaced-repetition'
import { toast } from 'sonner'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import Image from 'next/image'
import { SUBTESTS, SUBTEST_LABELS } from '@/lib/constants/subtests'

export default function ErrorsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [errors, setErrors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [selectedError, setSelectedError] = useState<any>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [updating, setUpdating] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const isMobile = useIsMobile()

  useEffect(() => {
    loadErrors()
  }, [])

  const loadErrors = async () => {
    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data } = await (supabase as any)
        .from('errors')
        .select('*')
        .eq('user_id', user!.id)
        .order('next_review_at', { ascending: true })

      setErrors(data || [])
    } catch (error) {
      console.error('Error loading errors:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFormSuccess = () => {
    loadErrors()
    setIsFormOpen(false)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errorsDue = errors.filter((e: any) => isDueForReview(e.next_review_at))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errorsUpcoming = errors.filter((e: any) => !isDueForReview(e.next_review_at))
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const errorsMastered = errors.filter((e: any) => e.mastery_level >= 4)

  const filteredErrorsDue = filter === 'all' 
    ? errorsDue 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : errorsDue.filter((e: any) => e.subtest === filter)

  const filteredErrorsUpcoming = filter === 'all' 
    ? errorsUpcoming 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    : errorsUpcoming.filter((e: any) => e.subtest === filter)

  const openErrorModal = (error: unknown) => {
    setSelectedError(error)
    // Find index in the combined list for carousel
    const allErrors = [...filteredErrorsDue, ...filteredErrorsUpcoming]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const index = allErrors.findIndex((e: any) => (e as any).id === (error as any).id)
    setCurrentIndex(index >= 0 ? index : 0)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleReview = async (success: boolean, errorToReview?: any) => {
    const error = errorToReview || selectedError
    if (!error) return
    setUpdating(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')

      const currentLevel = error.mastery_level || 0
      const newMasteryLevel = updateMasteryLevel(currentLevel, success)
      const nextReviewDate = calculateNextReviewDate(newMasteryLevel)
      const intervalDays = getNextReviewInterval(newMasteryLevel)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (supabase as any)
        .from('errors')
        .update({
          mastery_level: newMasteryLevel,
          last_reviewed_at: new Date().toISOString(),
          next_review_at: nextReviewDate.toISOString(),
          review_count: (error.review_count || 0) + 1,
        })
        .eq('id', error.id)

      if (updateError) throw updateError

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('error_reviews').insert({
        error_id: error.id,
        user_id: user.id,
        success,
        new_mastery_level: newMasteryLevel,
        next_review_interval_days: intervalDays,
      })

      toast.success(
        success
          ? `Bien joué! Prochaine révision dans ${intervalDays} jour${intervalDays > 1 ? 's' : ''}`
          : 'On révise demain !'
      )

      // Reload errors
      await loadErrors()
      
      // In mobile carousel, don't close - just stay on same index
      if (!isMobile) {
        setSelectedError(null)
      }
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
            Erreurs
          </h1>

          {!isMobile && (
            <MobileFormSheet
              open={isFormOpen}
              onOpenChange={setIsFormOpen}
              title="Ajouter une erreur"
              trigger={
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              }
            >
              <AddErrorForm onSuccess={handleFormSuccess} />
            </MobileFormSheet>
          )}
        </div>

        {/* Filtres + Bouton - Mobile */}
        {isMobile && (
          <div className="flex gap-2">
            <Select value={filter} onValueChange={setFilter}>
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

            <MobileFormSheet
              open={isFormOpen}
              onOpenChange={setIsFormOpen}
              title="Ajouter une erreur"
              trigger={
                <Button onClick={() => setIsFormOpen(true)} size="icon" className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              }
            >
              <AddErrorForm onSuccess={handleFormSuccess} />
            </MobileFormSheet>
          </div>
        )}

        {/* Filtres - Desktop */}
        {!isMobile && (
          <div className="flex flex-wrap gap-2">
            {SUBTESTS.map((subtest) => (
              <button
                key={subtest.value}
                onClick={() => setFilter(subtest.value)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
                  filter === subtest.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {subtest.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats compactes - Desktop only */}
      {!isMobile && (
        <div className="flex gap-2">
          <div className="flex items-center gap-1.5 rounded-md border bg-muted px-3 py-1.5">
            <span className="text-xs text-muted-foreground">Total</span>
            <span className="text-lg font-bold">{errors.length}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-primary/50 bg-primary/10 px-3 py-1.5">
            <Clock className="h-3.5 w-3.5 text-primary" />
            <span className="text-lg font-bold text-primary">{errorsDue.length}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-md border border-primary/50 bg-primary/10 px-3 py-1.5">
            <CheckCircle className="h-3.5 w-3.5 text-primary" />
            <span className="text-lg font-bold text-primary">{errorsMastered.length}</span>
          </div>
        </div>
      )}

      {/* Errors to Review */}
      {filteredErrorsDue.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            À réviser aujourd&apos;hui ({filteredErrorsDue.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {filteredErrorsDue.map((error: any) => (
              <div
                key={error.id}
                className="relative h-48 w-full overflow-hidden rounded-lg border p-4 text-left transition-all hover:shadow-lg"
              >
                {/* Background */}
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: error.image_url ? `url(${error.image_url})` : 'url(/gradient.jpeg)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                
                {/* Button to open modal */}
                <button
                  onClick={() => openErrorModal(error)}
                  className="absolute top-2 right-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 hover:bg-primary/90 active:scale-95"
                  aria-label="Voir l'erreur"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5 dark:text-white dark:drop-shadow-md">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </button>
                
                  {/* Content */}
                  <div className="relative flex h-full flex-col justify-between pointer-events-none">
                    <div className="flex items-start gap-2">
                      {/* <span className="inline-flex items-center rounded-md bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
                        <Clock className="mr-1 h-3 w-3" />
                        Réviser
                      </span> */}
                      <span className="inline-flex items-center rounded-md bg-background/90 px-2 py-1 text-xs font-medium">
                        {SUBTEST_LABELS[error.subtest] || error.subtest}
                      </span>
                    </div>
                  
                  <div className="space-y-2">
                    {error.explanation && (
                      <p className="text-base font-medium text-white line-clamp-2">
                        {error.explanation}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-white/90">
                      <span>Niveau {error.mastery_level}/5</span>
                      <span>{error.review_count} révisions</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/30">
                      <div 
                        className="h-full bg-white transition-all"
                        style={{ width: `${(error.mastery_level / 5) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upcoming Errors */}
      {filteredErrorsUpcoming.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            Prochaines révisions ({filteredErrorsUpcoming.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {filteredErrorsUpcoming.map((error: any) => (
              <div
                key={error.id}
                className="relative h-48 w-full overflow-hidden rounded-lg border transition-all hover:shadow-md"
              >
                {/* Background */}
                <div 
                  className="absolute inset-0 bg-cover bg-center"
                  style={{ backgroundImage: error.image_url ? `url(${error.image_url})` : 'url(/gradient.jpeg)' }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                
                {/* Button to open modal */}
                <button
                  onClick={() => openErrorModal(error)}
                  className="absolute top-2 right-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 hover:bg-primary/90 active:scale-95"
                  aria-label="Voir l'erreur"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5 dark:text-white dark:drop-shadow-md">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </button>
                
                {/* Content overlay */}
                <div className="relative flex h-full flex-col justify-between p-4 pointer-events-none">
                  <div className="flex items-start gap-2">
                    <span className="inline-flex items-center rounded-md bg-background/90 px-2 py-1 text-xs font-medium">
                      {SUBTEST_LABELS[error.subtest] || error.subtest}
                    </span>
                    {error.mastery_level >= 4 && (
                      <span className="inline-flex items-center rounded-md bg-primary/20 px-2 py-1 text-xs font-medium text-white">
                        <CheckCircle className="mr-1 h-3 w-3" />
                        Maîtrisée
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    {error.explanation && (
                      <p className="text-base font-medium text-white line-clamp-2">
                        {error.explanation}
                      </p>
                    )}
                    <div className="flex items-center justify-between text-xs text-white/90">
                      <span>Niveau {error.mastery_level}/5</span>
                      <span>{new Date(error.next_review_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/30">
                      <div 
                        className="h-full bg-white transition-all"
                        style={{ width: `${(error.mastery_level / 5) * 100}%` }}
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
      {errors.length === 0 && !loading && (
        <Card className="mt-8">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Clock className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-lg font-medium text-foreground">
              Aucune erreur enregistrée
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Commencez à suivre vos erreurs pour mieux progresser
            </p>
          </CardContent>
        </Card>
      )}

      {/* Error Modal - Desktop */}
      {!isMobile && (
        <Dialog open={!!selectedError} onOpenChange={(open) => {
          if (!open) setSelectedError(null)
        }}>
          {selectedError && (
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-sm text-muted-foreground">
                  {SUBTEST_LABELS[selectedError.subtest] || selectedError.subtest}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {selectedError.image_url && (
                  <div className="relative w-full h-96 rounded-lg overflow-hidden bg-muted border">
                    <Image
                      src={selectedError.image_url}
                      alt="Error"
                      fill
                      className="object-contain"
                      priority
                    />
                  </div>
                )}

                {selectedError.explanation && (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedError.explanation}
                  </p>
                )}

                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Niveau:</span>{' '}
                    <span className="font-medium">{selectedError.mastery_level}/5</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Révisions:</span>{' '}
                    <span className="font-medium">{selectedError.review_count}</span>
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
                    variant="success"
                    onClick={() => handleReview(true)}
                    disabled={updating}
                    className="flex-1"
                  >
                    {updating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Je sais'}
                  </Button>
                </div>
              </div>
            </DialogContent>
          )}
        </Dialog>
      )}

      {/* Error Carousel - Mobile */}
      {isMobile && (
        <MobileCarousel
          isOpen={!!selectedError}
          onClose={() => setSelectedError(null)}
          items={[...filteredErrorsDue, ...filteredErrorsUpcoming]}
          currentIndex={currentIndex}
          onIndexChange={(index) => {
            setCurrentIndex(index)
            const allErrors = [...filteredErrorsDue, ...filteredErrorsUpcoming]
            setSelectedError(allErrors[index])
          }}
        >
          {(item) => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const error = item as any
            return (
              <div className="space-y-6 pb-40">
                {/* Badge subtest */}
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-primary/10 text-primary">
                    {SUBTEST_LABELS[error.subtest] || error.subtest}
                  </span>
                  {isDueForReview(error.next_review_at) && (
                    <span className="flex items-center gap-1 text-xs text-foreground">
                      <Clock className="h-3 w-3" />
                      À réviser
                    </span>
                  )}
                  {error.mastery_level >= 4 && (
                    <span className="flex items-center gap-1 text-xs text-foreground">
                      <CheckCircle className="h-3 w-3" />
                      Maîtrisée
                    </span>
                  )}
                </div>

                {/* Main content - different layout if image exists */}
                {!error.image_url ? (
                  // No image: text-only layout similar to notions
                  <>
                    {/* Title - either correct_answer or first line of explanation */}
                    {error.correct_answer ? (
                      <h2 className="text-3xl font-bold text-foreground leading-tight">
                        {error.correct_answer}
                      </h2>
                    ) : error.explanation ? (
                      <div className="text-3xl font-bold text-foreground leading-tight whitespace-pre-wrap">
                        {error.explanation}
                      </div>
                    ) : null}
                    
                    {/* Additional explanation if correct_answer exists */}
                    {error.correct_answer && error.explanation && (
                      <div className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                        {error.explanation}
                      </div>
                    )}
                  </>
                ) : (
                  // With image: traditional layout
                  <>
                    {/* Image - clickable to zoom */}
                    <div 
                      className="relative w-full h-[40vh] rounded-xl overflow-hidden bg-muted cursor-zoom-in active:cursor-zoom-out"
                      onClick={(e) => {
                        const img = e.currentTarget.querySelector('img')
                        if (img) {
                          // Toggle fullscreen zoom
                          if (!document.fullscreenElement) {
                            e.currentTarget.requestFullscreen?.()
                          } else {
                            document.exitFullscreen?.()
                          }
                        }
                      }}
                    >
                      <Image
                        src={error.image_url}
                        alt="Erreur"
                        fill
                        className="object-cover transition-transform duration-200 hover:scale-105"
                        priority
                      />
                    </div>
                    
                    {/* Explanation */}
                    {error.explanation && (
                      <div className="space-y-0">
                        <p className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                          {error.explanation}
                        </p>
                      </div>
                    )}
                  </>
                )}

                {/* Compact Stats */}
                <div className="grid grid-cols-3 gap-6">
                  {/* Mastery */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Maîtrise</p>
                    <div className="flex items-baseline gap-0.5">
                      <span className="text-3xl font-bold text-foreground">{error.mastery_level}</span>
                      <span className="text-sm text-muted-foreground">/5</span>
                    </div>
                  </div>
                  {/* Reviews */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Révisions</p>
                    <p className="text-3xl font-bold text-foreground">{error.review_count}</p>
                  </div>
                  {/* Next review */}
                  <div>
                    <p className="text-xs text-muted-foreground mb-1.5">Prochaine</p>
                    <p className="text-3xl font-bold text-foreground">
                      {new Date(error.next_review_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'short'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            )
          }}
        </MobileCarousel>
      )}

      {/* Fixed Action Buttons - Mobile */}
      {isMobile && selectedError && (
        <FloatingButtonsContainer>
          <FloatingButton
            variant="destructive"
            onClick={() => handleReview(false, selectedError)}
            disabled={updating}
          >
            {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Oublié'}
          </FloatingButton>
          <FloatingButton
            variant="success"
            onClick={() => handleReview(true, selectedError)}
            disabled={updating}
          >
            {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Je sais'}
          </FloatingButton>
        </FloatingButtonsContainer>
      )}
    </div>
  )
}


