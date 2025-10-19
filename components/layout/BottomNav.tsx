'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { FileText, AlertCircle, Brain } from 'lucide-react'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Tests', href: '/tests', icon: FileText },
  { name: 'Erreurs', href: '/errors', icon: AlertCircle },
  { name: 'Notions', href: '/notions', icon: Brain },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card md:hidden">
      <div className="grid h-16 grid-cols-3">
        {navigation.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex flex-col items-center justify-center gap-1 transition-colors',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}


