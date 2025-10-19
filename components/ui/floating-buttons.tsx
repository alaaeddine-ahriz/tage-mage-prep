'use client'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import * as React from 'react'

interface FloatingButtonsContainerProps {
  children: React.ReactNode
  className?: string
}

export function FloatingButtonsContainer({ children, className }: FloatingButtonsContainerProps) {
  return (
    <div className={cn('fixed bottom-28 left-0 right-0 px-4 pb-0 z-[60]', className)}>
      <div className="flex gap-3">
        {children}
      </div>
    </div>
  )
}

interface FloatingButtonProps extends Omit<React.ComponentProps<typeof Button>, 'variant'> {
  variant?: 'default' | 'destructive' | 'outline' | 'success'
}

export function FloatingButton({ className, variant = 'default', ...props }: FloatingButtonProps) {
  const variantStyles: Record<string, string> = {
    default: 'backdrop-blur-xl bg-primary/85 hover:bg-primary/95 border border-primary-foreground/10 text-primary-foreground',
    destructive: 'backdrop-blur-xl bg-destructive/70 hover:bg-destructive/85 border border-white/20 text-white',
    success: 'backdrop-blur-xl bg-success/70 hover:bg-success/85 border border-white/20 text-white',
    outline: 'backdrop-blur-xl bg-background/85 hover:bg-background/95 border border-border',
  }

  return (
    <Button
      variant={variant}
      className={cn(
        'flex-1 h-14 text-base font-semibold rounded-full shadow-2xl transition-all duration-300',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
}

