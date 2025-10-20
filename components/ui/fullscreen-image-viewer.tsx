'use client'

import { useEffect } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

interface FullscreenImageViewerProps {
  src: string
  alt?: string
  onClose: () => void
}

export function FullscreenImageViewer({ src, alt, onClose }: FullscreenImageViewerProps) {
  useEffect(() => {
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = originalOverflow
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[999] flex flex-col bg-black/95"
      role="dialog"
      aria-modal="true"
      onClick={onClose}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/60" />

      <button
        type="button"
        onClick={onClose}
        aria-label="Fermer l'image"
        className="absolute right-4 top-4 z-[1000] rounded-full border border-white/20 bg-black/60 p-2 text-white transition hover:bg-black/80"
      >
        <X className="h-5 w-5" />
      </button>

      <div className="flex h-full w-full items-center justify-center p-6">
        <div
          className="relative h-full w-full max-h-full max-w-full"
          onClick={(event) => event.stopPropagation()}
        >
          <Image
            src={src}
            alt={alt ?? 'Image en plein écran'}
            fill
            className="object-contain"
            priority
          />
        </div>
      </div>
    </div>
  )
}
