'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { DASHBOARD_NAV_ITEMS } from '@/lib/constants/navigation'

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 md:hidden w-[80%] max-w-md">
      <div className="grid h-16 grid-cols-4 rounded-full border border-amber-200 dark:border-primary/20 bg-card/60 backdrop-blur-2xl shadow-2xl shadow-amber-500/10 dark:shadow-primary/10 px-2">
        {DASHBOARD_NAV_ITEMS.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
          return (
            <Link
              key={item.name}
              href={item.href}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'relative flex items-center justify-center rounded-full transition-all duration-300 ease-out',
                isActive
                  ? 'text-amber-600 dark:text-primary'
                  : 'text-muted-foreground hover:text-primary'
              )}
            >
              {isActive && (
                // <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-amber-600 dark:bg-primary rounded-full" />
                <div className=""></div>
              )}
              <item.icon className={cn(
                'h-6 w-6 transition-all duration-300',
                isActive && 'scale-110'
              )} />
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
