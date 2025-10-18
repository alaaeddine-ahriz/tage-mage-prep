'use client'

type QueueItem = {
  id: string
  type: 'insert' | 'update' | 'delete'
  table: string
  data: Record<string, unknown>
  timestamp: number
}

const QUEUE_KEY = 'offline_queue'

export function addToQueue(item: Omit<QueueItem, 'id' | 'timestamp'>) {
  if (typeof window === 'undefined') return

  const queue = getQueue()
  const newItem: QueueItem = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: Date.now(),
  }
  queue.push(newItem)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
}

export function getQueue(): QueueItem[] {
  if (typeof window === 'undefined') return []

  const queueStr = localStorage.getItem(QUEUE_KEY)
  if (!queueStr) return []
  
  try {
    return JSON.parse(queueStr)
  } catch {
    return []
  }
}

export function clearQueue() {
  if (typeof window === 'undefined') return
  localStorage.removeItem(QUEUE_KEY)
}

export function removeFromQueue(id: string) {
  if (typeof window === 'undefined') return

  const queue = getQueue()
  const filtered = queue.filter(item => item.id !== id)
  localStorage.setItem(QUEUE_KEY, JSON.stringify(filtered))
}

export function isOnline(): boolean {
  return typeof window !== 'undefined' && window.navigator.onLine
}

