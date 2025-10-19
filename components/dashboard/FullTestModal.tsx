'use client'

import { useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { FullTestWithSubtests } from '@/lib/types/database.types'
import { ChevronRight, X } from 'lucide-react'
import { SUBTEST_LABELS } from '@/lib/constants/subtests'
import { useIsMobile } from '@/lib/hooks/useIsMobile'

interface FullTestModalProps {
  test: FullTestWithSubtests | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onRetake: (test: FullTestWithSubtests) => void
}

export function FullTestModal({ test, open, onOpenChange, onRetake }: FullTestModalProps) {
  const isMobile = useIsMobile()

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

  if (!test) return null

  const contentView = (
    <div className="space-y-4">
      {/* Score principal */}
      <div className="text-center py-4 bg-muted/30 rounded-lg">
        <div className="text-4xl font-bold text-primary mb-1">
          {test.total_score}
        </div>
        <div className="text-sm text-muted-foreground">/ 600 points</div>
      </div>

      {/* Info date */}
      <div className="text-center text-sm text-muted-foreground">
        {new Date(test.date).toLocaleDateString('fr-FR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        })}
      </div>

      {/* Sous-tests */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Détails par sous-test</h3>
        <div className="space-y-1.5">
          {test.subtests.map((subtest) => (
            <div
              key={subtest.id}
              className="flex items-center justify-between py-2 px-3 bg-muted/20 rounded-lg"
            >
              <span className="text-sm font-medium">
                {SUBTEST_LABELS[subtest.subtest] || subtest.subtest}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted-foreground">
                  {subtest.correct_answers}/15
                </span>
                <span className="text-lg font-bold text-primary min-w-[3rem] text-right">
                  {subtest.score}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      {test.notes && (
        <div className="space-y-1.5 pt-2 border-t">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Notes</h3>
          <p className="text-sm text-muted-foreground">{test.notes}</p>
        </div>
      )}
    </div>
  )

  const footerView = (
    <Button
      onClick={() => {
        onRetake(test)
        onOpenChange(false)
      }}
      className="w-full h-14 text-base font-semibold rounded-2xl shadow-lg"
    >
      <ChevronRight className="mr-2 h-5 w-5" />
      Refaire ce test
    </Button>
  )

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
            {footerView}
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
      <div className="fixed bottom-28 left-0 right-0 px-4 pb-4 z-[60]">
        {footerView}
      </div>
    </div>
  )
}

