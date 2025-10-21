'use client'

import { useEffect, useMemo, useState } from 'react'
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
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { MobileCarousel } from '@/components/ui/mobile-carousel'
import { MobileFormSheet } from '@/components/ui/mobile-form-sheet'
import { FloatingButtonsContainer, FloatingButton } from '@/components/ui/floating-buttons'
import { AddErrorForm } from '@/components/forms/AddErrorForm'
import { EditErrorForm } from '@/components/forms/EditErrorForm'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Plus, Clock, CheckCircle, Loader2, MoreHorizontal, PenLine, Trash2 } from 'lucide-react'
import { isDueForReview, updateMasteryLevel, calculateNextReviewDate, getNextReviewInterval } from '@/lib/utils/spaced-repetition'
import { toast } from 'sonner'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import Image from 'next/image'
import { SUBTESTS, SUBTEST_LABELS } from '@/lib/constants/subtests'
import { FullscreenImageViewer } from '@/components/ui/fullscreen-image-viewer'
import { createClient } from '@/lib/supabase/client'
import { useDashboardData } from '@/lib/state/dashboard-data'
import type { Error as SupabaseError } from '@/lib/types/database.types'

export default function ErrorsPage() {
  const { errors, refreshErrors } = useDashboardData()
  const [filter, setFilter] = useState('all')
  const [selectedError, setSelectedError] = useState<SupabaseError | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [updating, setUpdating] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [isEditFormOpen, setIsEditFormOpen] = useState(false)
  const [errorToEdit, setErrorToEdit] = useState<SupabaseError | null>(null)
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false)
  const [errorToDelete, setErrorToDelete] = useState<SupabaseError | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [fullscreenImage, setFullscreenImage] = useState<{ src: string; alt: string } | null>(null)
  const isMobile = useIsMobile(1400)
  const hasBottomNav = useIsMobile(768)
  const showMobileFilters = useIsMobile()
  const isLoading = !errors
  const errorsList = useMemo(() => errors ?? [], [errors])

  useEffect(() => {
    if (!selectedError) return
    const updated = errorsList.find((err) => err.id === selectedError.id)
    if (updated && updated !== selectedError) {
      setSelectedError(updated)
    }
  }, [errorsList, selectedError])

  const handleFormSuccess = () => {
    setIsFormOpen(false)
  }

  const errorsDue = useMemo(
    () => errorsList.filter((error) => isDueForReview(error.next_review_at)),
    [errorsList]
  )

  const errorsUpcoming = useMemo(
    () => errorsList.filter((error) => !isDueForReview(error.next_review_at)),
    [errorsList]
  )

  const errorsMastered = useMemo(
    () => errorsList.filter((error) => error.mastery_level >= 4),
    [errorsList]
  )

  const filteredErrorsDue = useMemo(
    () =>
      filter === 'all'
        ? errorsDue
        : errorsDue.filter((error) => error.subtest === filter),
    [errorsDue, filter]
  )

  const filteredErrorsUpcoming = useMemo(
    () =>
      filter === 'all'
        ? errorsUpcoming
        : errorsUpcoming.filter((error) => error.subtest === filter),
    [errorsUpcoming, filter]
  )

  const combinedFilteredErrors = useMemo(
    () => [...filteredErrorsDue, ...filteredErrorsUpcoming],
    [filteredErrorsDue, filteredErrorsUpcoming]
  )

  useEffect(() => {
    if (!selectedError) return

    const nextIndex = combinedFilteredErrors.findIndex((err) => err.id === selectedError.id)
    if (nextIndex === -1) {
      setSelectedError(null)
      setCurrentIndex(0)
      return
    }

    const indexedError = combinedFilteredErrors[nextIndex] as SupabaseError
    if (indexedError !== selectedError) {
      setSelectedError(indexedError)
    }

    if (nextIndex !== currentIndex) {
      setCurrentIndex(nextIndex)
    }
  }, [combinedFilteredErrors, selectedError, currentIndex])

  const openErrorModal = (error: SupabaseError) => {
    setSelectedError(error)
    setFullscreenImage(null)
    const index = combinedFilteredErrors.findIndex((e) => e.id === error.id)
    setCurrentIndex(index >= 0 ? index : 0)
  }

  const openEditError = (error: SupabaseError) => {
    setErrorToEdit(error)
    setIsEditFormOpen(true)
  }

  const openDeleteError = (error: SupabaseError) => {
    setErrorToDelete(error)
    setIsDeleteConfirmOpen(true)
  }

  const handleDeleteError = async () => {
    if (!errorToDelete) return

    setIsDeleting(true)
    try {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        toast.error('Vous devez être connecté')
        return
      }

      const { error } = await supabase.from('errors').delete().eq('id', errorToDelete.id)
      if (error) throw error

      toast.success('Erreur supprimée')
      await refreshErrors()
      setSelectedError(null)
      setIsDeleteConfirmOpen(false)
      setErrorToDelete(null)
    } catch (error) {
      console.error('Error deleting error:', error)
      toast.error('Erreur lors de la suppression')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReview = async (success: boolean, errorToReview?: SupabaseError) => {
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

      await refreshErrors()
      
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

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  const selectedErrorLastReview = selectedError?.last_reviewed_at
    ? new Date(selectedError.last_reviewed_at)
    : null
  const selectedErrorHasImage = Boolean(selectedError?.image_url)

  return (
    <div className="space-y-6 md:space-y-10 md:pt-4">
      {/* Header */}
      <div className="space-y-4 md:space-y-6 md:mt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground">
            Erreurs
          </h1>

          {!showMobileFilters && (
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
        {showMobileFilters && (
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
        {!showMobileFilters && (
          <div className="flex flex-wrap gap-2">
            {SUBTESTS.map((subtest) => (
              <button
                key={subtest.value}
                onClick={() => setFilter(subtest.value)}
                className={`rounded-full border px-3 py-1.5 text-sm font-medium transition-colors backdrop-blur-sm ${
                  filter === subtest.value
                    ? 'border-primary/40 bg-gradient-to-br from-primary/15 via-primary/5 to-background/60 text-primary shadow-sm'
                    : 'border-border/50 bg-background/40 text-muted-foreground hover:border-primary/30 hover:bg-primary/10 hover:text-primary'
                }`}
              >
                {subtest.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Stats modernes - Desktop only */}
      {!isMobile && (
        <div className="grid grid-cols-3 gap-3">
          <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/20 p-4 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <div className="relative">
              <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-1">
                Total
              </div>
              <div className="text-2xl font-bold text-foreground">{errorsList.length}</div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background p-4 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="relative">
              <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-1">
                À réviser
              </div>
              <div className="text-2xl font-bold text-primary">{errorsDue.length}</div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/20 p-4 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <div className="relative">
              <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-1">
                Maîtrisées
              </div>
              <div className="text-2xl font-bold text-foreground">{errorsMastered.length}</div>
            </div>
          </div>
        </div>
      )}

      {/* Errors to Review */}
      {filteredErrorsDue.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-xl sm:text-3xl font-semibold text-foreground">
            À réviser aujourd&apos;hui ({filteredErrorsDue.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredErrorsDue.map((error) => (
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
                  aria-label="Voir l&rsquo;erreur"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="h-5 w-5 dark:text-white dark:drop-shadow-md">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                </button>

                {/* Content */}
                <div className="relative flex h-full flex-col justify-between pointer-events-none">
                  <div className="flex items-start gap-2">
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
      ) : null}

      {/* Upcoming Errors */}
      {filteredErrorsUpcoming.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-xl sm:text-3xl font-semibold text-foreground">
            Prochaines révisions ({filteredErrorsUpcoming.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredErrorsUpcoming.map((error) => (
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
                  aria-label="Voir l&rsquo;erreur"
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
                      <span>
                        {error.next_review_at
                          ? new Date(error.next_review_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : 'À planifier'}
                      </span>
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
      ) : null}

      {errorsList.length > 0 &&
        filteredErrorsDue.length === 0 &&
        filteredErrorsUpcoming.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/60 p-6 text-center text-sm text-muted-foreground">
            Aucun résultat ne correspond aux filtres sélectionnés.
          </div>
        )}

      {/* Empty State */}
      {errorsList.length === 0 && (
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
            <DialogContent className="max-w-4xl" showCloseButton={false}>
              <DialogHeader className="sr-only">
                <DialogTitle>Détail de l&rsquo;erreur</DialogTitle>
              </DialogHeader>

              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="inline-flex items-center rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                      {SUBTEST_LABELS[selectedError.subtest] || selectedError.subtest}
                    </span>
                    {isDueForReview(selectedError.next_review_at) && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-destructive/20 bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
                        <Clock className="h-3.5 w-3.5" />
                        À réviser
                      </span>
                    )}
                    {selectedErrorLastReview && (
                      <span className="inline-flex items-center gap-1 rounded-full border border-border/60 bg-background/80 px-3 py-1 text-xs font-medium text-muted-foreground">
                        Dernière révision{' '}
                        {selectedErrorLastReview.toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    )}
                  </div>

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-9 w-9">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40">
                      <DropdownMenuItem
                        onClick={() => openEditError(selectedError)}
                        className="cursor-pointer"
                      >
                        <PenLine className="mr-2 h-4 w-4" />
                        Modifier
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => openDeleteError(selectedError)}
                        className="cursor-pointer"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Supprimer
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div className="flex flex-col gap-5">
                  <h2 className="text-3xl font-bold text-foreground leading-tight">
                    {selectedError.explanation?.slice(0, 120) || 'Erreur'}
                  </h2>

                  {selectedErrorHasImage && (
                    <div className="relative w-full aspect-[4/3] overflow-hidden rounded-2xl border bg-muted/40">
                      <Image
                        src={selectedError.image_url as string}
                        alt={selectedError.explanation || 'Erreur'}
                        fill
                        className="object-cover"
                        priority
                        sizes="(min-width: 1024px) 620px, 90vw"
                      />
                    </div>
                  )}

                  {/* Stats card intentionally removed for cleaner layout */}
                </div>

                <div className="flex w-full flex-col gap-3 sm:flex-row sm:gap-4">
                  <Button
                    variant="destructive"
                    onClick={() => handleReview(false)}
                    disabled={updating}
                    className="w-full h-12 text-base font-semibold sm:flex-1"
                  >
                    {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Oublié'}
                  </Button>
                  <Button
                    variant="success"
                    onClick={() => handleReview(true)}
                    disabled={updating}
                    className="w-full h-12 text-base font-semibold sm:flex-1"
                  >
                    {updating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Je sais'}
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
          onClose={() => {
            setSelectedError(null)
            setFullscreenImage(null)
          }}
          items={combinedFilteredErrors}
          currentIndex={currentIndex}
          onIndexChange={(index) => {
            setCurrentIndex(index)
            const nextError = combinedFilteredErrors[index] ?? null
            setSelectedError(nextError)
            setFullscreenImage(null)
          }}
        >
          {(item) => {
            const error = item as SupabaseError
            return (
              <div className={`space-y-6 ${hasBottomNav ? 'pb-40' : 'pb-24'}`}>
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

                {/* Main content */}
                {!error.image_url ? (
                  error.explanation && (
                    <p className="text-3xl font-bold text-foreground leading-tight whitespace-pre-wrap">
                      {error.explanation}
                    </p>
                  )
                ) : (
                  // With image: traditional layout
                  <>
                    {/* Image - clickable to zoom */}
                    <button
                      type="button"
                      onClick={() =>
                        setFullscreenImage({
                          src: error.image_url!,
                          alt: error.explanation || 'Erreur',
                        })
                      }
                      className="relative h-[40vh] w-full overflow-hidden rounded-xl bg-muted cursor-zoom-in active:cursor-zoom-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      <Image
                        src={error.image_url!}
                        alt={error.explanation || 'Erreur'}
                        fill
                        className="object-cover transition-transform duration-200 hover:scale-105"
                        priority
                      />
                    </button>
                    
                    {/* Explanation */}
                    {error.explanation && (
                      <p className="text-3xl font-bold text-foreground leading-tight whitespace-pre-wrap">
                        {error.explanation}
                      </p>
                    )}
                  </>
                )}

                {/* Stats modernes */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/20 p-4 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                    <div className="relative">
                      <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-1">
                        Maîtrise
                      </div>
                      <div className="text-2xl font-bold text-foreground">{error.mastery_level}/5</div>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/20 p-4 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                    <div className="relative">
                      <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-1">
                        Révisions
                      </div>
                      <div className="text-2xl font-bold text-foreground">{error.review_count}</div>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background p-4 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                    <div className="relative">
                      <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-1">
                        Prochaine
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {error.next_review_at
                          ? new Date(error.next_review_at).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'short',
                            })
                          : 'À planifier'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          }}
        </MobileCarousel>
      )}

      {/* Fixed Action Buttons - Mobile */}
      {isMobile && selectedError && (
        <FloatingButtonsContainer hasBottomNav={hasBottomNav}>
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

      <MobileFormSheet
        open={isEditFormOpen}
        onOpenChange={(open) => {
          setIsEditFormOpen(open)
          if (!open) {
            setErrorToEdit(null)
          }
        }}
        title="Modifier l&rsquo;erreur"
      >
        {errorToEdit && (
          <EditErrorForm
            error={errorToEdit}
            onSuccess={() => {
              setIsEditFormOpen(false)
              setErrorToEdit(null)
            }}
          />
        )}
      </MobileFormSheet>

      <Dialog
        open={isDeleteConfirmOpen}
        onOpenChange={(open) => {
          setIsDeleteConfirmOpen(open)
          if (!open) {
            setErrorToDelete(null)
          }
        }}
      >
        <DialogContent className="max-w-sm" showCloseButton={false}>
          <DialogHeader>
            <DialogTitle>Supprimer l&rsquo;erreur ?</DialogTitle>
            <DialogDescription>
              Cette action est irréversible. L&rsquo;erreur et son historique de révision seront supprimés.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-end">
            <Button
              variant="outline"
              onClick={() => setIsDeleteConfirmOpen(false)}
              disabled={isDeleting}
            >
              Annuler
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteError}
              disabled={isDeleting}
            >
              {isDeleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {fullscreenImage && (
        <FullscreenImageViewer
          src={fullscreenImage.src}
          alt={fullscreenImage.alt}
          onClose={() => setFullscreenImage(null)}
        />
      )}
    </div>
  )
}
