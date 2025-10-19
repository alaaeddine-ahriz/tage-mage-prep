'use client'

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { signOut } from '@/lib/supabase/auth'
import { LogOut, Moon, Sun, User } from 'lucide-react'
import { useTheme } from 'next-themes'
import { useRouter } from 'next/navigation'

interface HeaderProps {
  user: {
    email?: string
    user_metadata?: {
      avatar_url?: string
      full_name?: string
    }
  } | null
}

export function Header({ user }: HeaderProps) {
  const { theme, setTheme } = useTheme()
  const router = useRouter()

  const handleSignOut = async () => {
    await signOut()
    router.push('/login')
    router.refresh()
  }

  const initials =
    user?.user_metadata?.full_name
      ?.split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase() ||
    user?.email?.[0]?.toUpperCase() ||
    'U'

  return (
    <header className="sticky top-0 z-30 hidden border-b bg-card md:block">
      <div className="flex h-14 items-center justify-end px-4 md:px-6 gap-3">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="relative rounded-full hover:bg-muted transition-colors"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-10 w-10 rounded-full hover:bg-muted transition-colors"
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.user_metadata?.avatar_url} alt={user?.email} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-56 rounded-xl shadow-md p-2 bg-popover"
          >
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium leading-none">
                {user?.user_metadata?.full_name || 'Utilisateur'}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>

            <DropdownMenuSeparator />

            <DropdownMenuItem onClick={() => router.push('/')} className="cursor-pointer">
              <User className="mr-2 h-4 w-4" />
              Profil
            </DropdownMenuItem>

            <DropdownMenuItem onClick={handleSignOut} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Déconnexion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
