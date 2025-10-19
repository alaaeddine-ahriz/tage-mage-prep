'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface MobileFormSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  trigger?: React.ReactNode
  children: React.ReactNode
  className?: string
}

export function MobileFormSheet({
  open,
  onOpenChange,
  title,
  trigger,
  children,
  className,
}: MobileFormSheetProps) {
  const isMobile = useIsMobile()

  // Prevent body scroll when sheet is open on mobile
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

  // Desktop: Use regular Dialog
  if (!isMobile) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
        <DialogContent className={cn("max-w-md max-h-[90vh] overflow-y-auto", className)}>
          <DialogHeader>
            <DialogTitle>{title}</DialogTitle>
          </DialogHeader>
          {children}
        </DialogContent>
      </Dialog>
    )
  }

  // Mobile: Full screen sheet
  if (!open) return trigger ? <>{trigger}</> : null

  return (
    <div className="fixed inset-0 z-50 bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 backdrop-blur-sm px-4 py-3">
        <h2 className="text-lg font-semibold">{title}</h2>
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
      <div className={cn("h-[calc(100vh-60px)] overflow-y-auto", className)}>
        <div className="container max-w-4xl mx-auto p-4">
          {children}
        </div>
      </div>
    </div>
  )
}

