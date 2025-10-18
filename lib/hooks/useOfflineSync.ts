'use client'

import { useEffect, useState, useCallback } from 'react'
import { getQueue, removeFromQueue, isOnline } from '@/lib/utils/offline-queue'
import { toast } from 'sonner'

export function useOfflineSync() {
  const [syncing, setSyncing] = useState(false)
  const [queueSize, setQueueSize] = useState(0)

  const updateQueueSize = useCallback(() => {
    const queue = getQueue()
    setQueueSize(queue.length)
  }, [])

  const syncQueue = useCallback(async () => {
    const queue = getQueue()
    if (queue.length === 0 || syncing) return

    setSyncing(true)

    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ queue }),
      })

      if (!response.ok) throw new Error('Sync failed')

      const { results } = await response.json()

      // Remove successfully synced items
      results.forEach((result: { id: string; success: boolean }) => {
        if (result.success) {
          removeFromQueue(result.id)
        }
      })

      const successCount = results.filter((r: { success: boolean }) => r.success).length
      const failCount = results.filter((r: { success: boolean }) => !r.success).length

      if (successCount > 0) {
        toast.success(`${successCount} élément(s) synchronisé(s)`)
      }

      if (failCount > 0) {
        toast.error(`${failCount} élément(s) non synchronisé(s)`)
      }

      updateQueueSize()
    } catch (error) {
      console.error('Sync error:', error)
      toast.error('Erreur de synchronisation')
    } finally {
      setSyncing(false)
    }
  }, [syncing, updateQueueSize])

  useEffect(() => {
    // Update queue size on mount
    updateQueueSize()

    // Listen for online/offline events
    const handleOnline = () => {
      toast.success('Connexion rétablie')
      syncQueue()
    }

    const handleOffline = () => {
      toast.info('Mode hors ligne activé')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Check queue periodically
    const interval = setInterval(() => {
      if (isOnline()) {
        syncQueue()
      }
      updateQueueSize()
    }, 30000) // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      clearInterval(interval)
    }
  }, [syncQueue, updateQueueSize])

  return {
    syncing,
    queueSize,
    syncQueue,
  }
}

