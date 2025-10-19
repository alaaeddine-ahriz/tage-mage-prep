'use client'

import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { WifiOff, RefreshCw, Wifi } from 'lucide-react'
import { useOfflineSync } from '@/lib/hooks/useOfflineSync'
import { isOnline } from '@/lib/utils/offline-queue'

export function OfflineIndicator() {
  const [online, setOnline] = useState(true)
  const { syncing, queueSize, syncQueue } = useOfflineSync()

  useEffect(() => {
    const updateOnlineStatus = () => {
      setOnline(isOnline())
    }

    updateOnlineStatus()
    window.addEventListener('online', updateOnlineStatus)
    window.addEventListener('offline', updateOnlineStatus)

    return () => {
      window.removeEventListener('online', updateOnlineStatus)
      window.removeEventListener('offline', updateOnlineStatus)
    }
  }, [])

  if (online && queueSize === 0) return null

  return (
    <div className="fixed bottom-20 right-4 z-50 md:bottom-4">
      <div className="rounded-lg border bg-card p-3 shadow-lg">
        <div className="flex items-center gap-3">
          {!online ? (
            <>
              <WifiOff className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">Mode hors ligne</p>
                {queueSize > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {queueSize} action{queueSize > 1 ? 's' : ''} en attente
                  </p>
                )}
              </div>
            </>
          ) : (
            <>
              <Wifi className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="text-sm font-medium">En ligne</p>
                {queueSize > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {queueSize} action{queueSize > 1 ? 's' : ''} à synchroniser
                  </p>
                )}
              </div>
              {queueSize > 0 && (
                <Button
                  size="sm"
                  onClick={syncQueue}
                  disabled={syncing}
                >
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                </Button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

