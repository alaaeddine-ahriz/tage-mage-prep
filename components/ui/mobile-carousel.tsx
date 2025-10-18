'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Button } from '@/components/ui/button'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

interface MobileCarouselProps {
  isOpen: boolean
  onClose: () => void
  items: unknown[]
  currentIndex: number
  onIndexChange: (index: number) => void
  children: (item: unknown, index: number) => React.ReactNode
  className?: string
}

export function MobileCarousel({
  isOpen,
  onClose,
  items,
  currentIndex,
  onIndexChange,
  children,
  className,
}: MobileCarouselProps) {
  const [touchStart, setTouchStart] = useState<number | null>(null)
  const [touchEnd, setTouchEnd] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Minimum swipe distance (in px)
  const minSwipeDistance = 50

  const goToPrevious = useCallback(() => {
    if (currentIndex > 0) {
      onIndexChange(currentIndex - 1)
    }
  }, [currentIndex, onIndexChange])

  const goToNext = useCallback(() => {
    if (currentIndex < items.length - 1) {
      onIndexChange(currentIndex + 1)
    }
  }, [currentIndex, items.length, onIndexChange])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose()
      } else if (e.key === 'ArrowLeft') {
        goToPrevious()
      } else if (e.key === 'ArrowRight') {
        goToNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose, goToPrevious, goToNext])

  // Handle touch events for swipe
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart(e.targetTouches[0].clientX)
  }

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX)
  }

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return
    
    const distance = touchStart - touchEnd
    const isLeftSwipe = distance > minSwipeDistance
    const isRightSwipe = distance < -minSwipeDistance

    if (isLeftSwipe) {
      goToNext()
    } else if (isRightSwipe) {
      goToPrevious()
    }
  }

  // Prevent body scroll when carousel is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-white dark:bg-slate-950">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm px-4 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-9 w-9"
          >
            <X className="h-5 w-5" />
          </Button>
          <span className="text-sm font-medium">
            {currentIndex + 1} / {items.length}
          </span>
        </div>

        {/* Navigation arrows for desktop */}
        <div className="hidden sm:flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="h-9 w-9"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={goToNext}
            disabled={currentIndex === items.length - 1}
            className="h-9 w-9"
          >
            <ChevronRight className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div
        ref={containerRef}
        className={cn(
          "h-[calc(100vh-60px)] overflow-y-auto bg-white dark:bg-slate-950",
          className
        )}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="container max-w-4xl mx-auto px-6 py-8">
          {children(items[currentIndex], currentIndex)}
        </div>
      </div>

      {/* Mobile Navigation Dots */}
      {items.length > 1 && (
        <div className="fixed bottom-0 left-0 right-0 flex justify-center gap-2 bg-white/95 dark:bg-slate-950/95 backdrop-blur-sm border-t px-4 py-3 sm:hidden">
          {items.map((_, index) => (
            <button
              key={index}
              onClick={() => onIndexChange(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                index === currentIndex
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted-foreground/30"
              )}
              aria-label={`Aller à l'item ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Side navigation buttons for mobile (tap zones) - only if multiple items */}
      {items.length > 1 && (
        <>
          <button
            onClick={goToPrevious}
            disabled={currentIndex === 0}
            className="fixed left-0 top-1/2 -translate-y-1/2 z-40 h-24 w-16 flex items-center justify-start pl-2 opacity-0 hover:opacity-100 active:opacity-100 transition-opacity sm:hidden disabled:opacity-0"
            aria-label="Précédent"
          >
            <div className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
              <ChevronLeft className="h-6 w-6" />
            </div>
          </button>
          <button
            onClick={goToNext}
            disabled={currentIndex === items.length - 1}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-40 h-24 w-16 flex items-center justify-end pr-2 opacity-0 hover:opacity-100 active:opacity-100 transition-opacity sm:hidden disabled:opacity-0"
            aria-label="Suivant"
          >
            <div className="bg-white/90 dark:bg-slate-950/90 backdrop-blur-sm rounded-full p-2 shadow-lg">
              <ChevronRight className="h-6 w-6" />
            </div>
          </button>
        </>
      )}
    </div>
  )
}

