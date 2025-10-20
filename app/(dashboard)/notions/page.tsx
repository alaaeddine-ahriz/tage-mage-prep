'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
import { AddNotionForm } from '@/components/forms/AddNotionForm'
import { Plus, Clock, TrendingUp, Loader2 } from 'lucide-react'
import { isDueForReview, updateMasteryLevel, calculateNextReviewDate, getNextReviewInterval } from '@/lib/utils/spaced-repetition'
import { toast } from 'sonner'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import type { Notion } from '@/lib/types/database.types'
import { SUBTESTS, SUBTEST_LABELS } from '@/lib/constants/subtests'
import Image from 'next/image'
import { FullscreenImageViewer } from '@/components/ui/fullscreen-image-viewer'

export default function NotionsPage() {
  const [notions, setNotions] = useState<Notion[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedNotion, setSelectedNotion] = useState<Notion | null>(null)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [updating, setUpdating] = useState(false)
  const [isFormOpen, setIsFormOpen] = useState(false)
  const [filter, setFilter] = useState('all')
  const [fullscreenImage, setFullscreenImage] = useState<{ src: string; alt: string } | null>(null)
  const isMobile = useIsMobile(1500)
  const hasBottomNav = useIsMobile(768)
  const showMobileFilters = useIsMobile()

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

  const handleFormSuccess = () => {
    loadNotions()
    setIsFormOpen(false)
  }

  // Filter notions by subtest
  const filteredNotions = filter === 'all' 
    ? notions 
    : notions.filter((n) => n.subtest === filter)

  const notionsDue = filteredNotions.filter((n) => isDueForReview(n.next_review_at))
  const notionsUpcoming = filteredNotions.filter((n) => !isDueForReview(n.next_review_at))

  const openNotionModal = (notion: Notion) => {
    setSelectedNotion(notion)
    setFullscreenImage(null)
    // Find index in the combined list for carousel
    const allNotions = [...notionsDue, ...notionsUpcoming]
    const index = allNotions.findIndex(n => n.id === notion.id)
    setCurrentIndex(index >= 0 ? index : 0)
  }


  const handleReview = async (success: boolean, notionToReview?: Notion) => {
    const notion = notionToReview || selectedNotion
    if (!notion) return
    setUpdating(true)

    try {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) throw new Error('Not authenticated')

      const currentLevel = notion.mastery_level || 0
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
          review_count: (notion.review_count || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq('id', notion.id)

      if (updateError) throw updateError

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from('notion_reviews').insert({
        notion_id: notion.id,
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

      // Reload notions
      await loadNotions()
      
      // In mobile carousel, don't close - just stay on same index
      if (!isMobile) {
        setSelectedNotion(null)
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
    <div className="space-y-6 md:space-y-10 md:pt-4">
      {/* Header */}
      <div className="space-y-4 md:space-y-6 md:mt-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl md:text-4xl font-bold text-foreground">
            Notions
          </h1>

          {!showMobileFilters && (
            <MobileFormSheet
              open={isFormOpen}
              onOpenChange={setIsFormOpen}
              title="Nouvelle notion"
              trigger={
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Ajouter
                </Button>
              }
            >
              <AddNotionForm onSuccess={handleFormSuccess} />
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
              title="Nouvelle notion"
              trigger={
                <Button onClick={() => setIsFormOpen(true)} size="icon" className="shrink-0">
                  <Plus className="h-4 w-4" />
                </Button>
              }
            >
              <AddNotionForm onSuccess={handleFormSuccess} />
            </MobileFormSheet>
          </div>
        )}

        {/* Filtres - Desktop */}
        {!showMobileFilters && notions.length > 0 && (
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
              <div className="text-2xl font-bold text-foreground">{notions?.length || 0}</div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background p-4 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
            <div className="relative">
              <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-1">
                À réviser
              </div>
              <div className="text-2xl font-bold text-primary">{notionsDue.length}</div>
            </div>
          </div>
          <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/20 p-4 backdrop-blur-sm">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
            <div className="relative">
              <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-1">
                Niveau moyen
              </div>
              <div className="text-2xl font-bold text-foreground">
                {notions && notions.length > 0
                  ? (notions.reduce((acc: number, n) => acc + n.mastery_level, 0) / notions.length).toFixed(1)
                  : '0.0'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notions to Review */}
      {notionsDue.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">
            À réviser aujourd&apos;hui ({notionsDue.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {notionsDue.map((notion) => (
              <div
                key={notion.id}
                className="group relative h-48 w-full overflow-hidden rounded-lg border p-4 text-left transition-all hover:shadow-lg">
                  {/* Background */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${notion.image_url || '/gradient.jpeg'})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  
                  {/* Button to open modal */}
                  <button
                    onClick={() => openNotionModal(notion)}
                    className="absolute top-2 right-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 hover:bg-primary/90 active:scale-95"
                    aria-label="Voir la notion"
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
                        {SUBTEST_LABELS[notion.subtest] || notion.subtest}
                      </span>
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-white line-clamp-2">
                        {notion.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-white/90">
                        <span>Niveau {notion.mastery_level}/5</span>
                        <span>{notion.review_count} révisions</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/30">
                        <div 
                          className="h-full bg-white transition-all"
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
          <h2 className="text-lg font-semibold text-foreground">
            Prochaines révisions ({notionsUpcoming.length})
          </h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {notionsUpcoming.map((notion) => (
              <div key={notion.id} className="relative h-48 w-full overflow-hidden rounded-lg border transition-all hover:shadow-md">
                  {/* Background */}
                  <div 
                    className="absolute inset-0 bg-cover bg-center"
                    style={{ backgroundImage: `url(${notion.image_url || '/gradient.jpeg'})` }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
                  
                  {/* Button to open modal */}
                  <button
                    onClick={() => openNotionModal(notion)}
                    className="absolute top-2 right-2 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-110 hover:bg-primary/90 active:scale-95"
                    aria-label="Voir la notion"
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
                        {SUBTEST_LABELS[notion.subtest] || notion.subtest}
                      </span>
                      {notion.mastery_level >= 4 && (
                        <span className="inline-flex items-center rounded-md bg-primary/20 px-2 py-1 text-xs font-medium text-white">
                          <TrendingUp className="mr-1 h-3 w-3" />
                          Maîtrisée
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <h3 className="text-base font-semibold text-white line-clamp-2">
                        {notion.title}
                      </h3>
                      <div className="flex items-center justify-between text-xs text-white/90">
                        <span>Niveau {notion.mastery_level}/5</span>
                        <span>{notion.next_review_at ? new Date(notion.next_review_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : 'N/A'}</span>
                      </div>
                      <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/30">
                        <div 
                          className="h-full bg-white transition-all"
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

      {notions.length > 0 &&
        notionsDue.length === 0 &&
        notionsUpcoming.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border/60 bg-card/60 p-6 text-center text-sm text-muted-foreground">
            Aucune notion ne correspond aux filtres sélectionnés.
          </div>
        )}

      {/* Empty State */}
      {notions?.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">Aucune notion enregistrée</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Ajoutez vos premières notions pour commencer à les réviser
            </p>
          </CardContent>
        </Card>
      )}

      {/* Review Modal - Desktop */}
      {!isMobile && (
        <Dialog open={!!selectedNotion} onOpenChange={(open) => {
          if (!open) setSelectedNotion(null)
        }}>
          {selectedNotion && (
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-sm text-muted-foreground">
                  {SUBTEST_LABELS[selectedNotion.subtest] || selectedNotion.subtest}
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {selectedNotion.image_url && (
                  <div className="relative w-full h-64 overflow-hidden rounded-lg border bg-muted">
                    <Image
                      src={selectedNotion.image_url}
                      alt={selectedNotion.title || 'Notion'}
                      fill
                      className="object-contain"
                    />
                  </div>
                )}

                <h2 className="text-xl font-bold">{selectedNotion.title}</h2>

                {selectedNotion.description && (
                  <p className="text-muted-foreground whitespace-pre-wrap">
                    {selectedNotion.description}
                  </p>
                )}

                <div className="flex gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Niveau:</span>{' '}
                    <span className="font-medium">{selectedNotion.mastery_level}/5</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Révisions:</span>{' '}
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

      {/* Review Carousel - Mobile */}
      {isMobile && (
        <MobileCarousel
          isOpen={!!selectedNotion}
          onClose={() => {
            setSelectedNotion(null)
            setFullscreenImage(null)
          }}
          items={[...notionsDue, ...notionsUpcoming]}
          currentIndex={currentIndex}
          onIndexChange={(index) => {
            setCurrentIndex(index)
            const allNotions = [...notionsDue, ...notionsUpcoming]
            setSelectedNotion(allNotions[index])
            setFullscreenImage(null)
          }}
        >
          {(item) => {
            const notion = item as Notion
            return (
              <div className={`space-y-6 ${hasBottomNav ? 'pb-40' : 'pb-24'}`}>
                {/* Badge subtest */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-semibold bg-primary/10 text-primary">
                    {SUBTEST_LABELS[notion.subtest] || notion.subtest}
                  </span>
                  {isDueForReview(notion.next_review_at) && (
                    <span className="flex items-center gap-1 text-xs text-foreground">
                      <Clock className="h-3 w-3" />
                      À réviser
                    </span>
                  )}
                </div>

                {notion.image_url && (
                  <button
                    type="button"
                    onClick={() =>
                      setFullscreenImage({
                        src: notion.image_url!,
                        alt: notion.title || 'Notion',
                      })
                    }
                    className="relative aspect-video w-full overflow-hidden rounded-xl border bg-muted/40 cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <Image
                      src={notion.image_url}
                      alt={notion.title || 'Notion'}
                      fill
                      className="object-contain"
                    />
                  </button>
                )}

                {/* Title */}
                <h2 className="text-3xl font-bold text-foreground leading-tight">
                  {notion.title}
                </h2>

                {/* Description */}
                {notion.description && (
                  <div className="text-base text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {notion.description}
                  </div>
                )}

                {/* Stats modernes */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/20 p-4 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                    <div className="relative">
                      <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-1">
                        Maîtrise
                      </div>
                      <div className="text-2xl font-bold text-foreground">{notion.mastery_level}/5</div>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-background to-muted/20 p-4 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                    <div className="relative">
                      <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-1">
                        Révisions
                      </div>
                      <div className="text-2xl font-bold text-foreground">{notion.review_count}</div>
                    </div>
                  </div>
                  <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/5 to-background p-4 backdrop-blur-sm">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent" />
                    <div className="relative">
                      <div className="text-xs font-medium text-muted-foreground/80 uppercase tracking-wider mb-1">
                        Prochaine
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {notion.next_review_at ? new Date(notion.next_review_at).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'short'
                        }) : 'N/A'}
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
      {isMobile && selectedNotion && (
        <FloatingButtonsContainer hasBottomNav={hasBottomNav}>
          <FloatingButton
            variant="destructive"
            onClick={() => handleReview(false, selectedNotion)}
            disabled={updating}
          >
            {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Oublié'}
          </FloatingButton>
          <FloatingButton
            variant="success"
            onClick={() => handleReview(true, selectedNotion)}
            disabled={updating}
          >
            {updating ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Je sais'}
          </FloatingButton>
        </FloatingButtonsContainer>
      )}

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
