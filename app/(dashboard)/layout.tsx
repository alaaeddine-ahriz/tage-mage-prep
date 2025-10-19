import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { BottomNav } from '@/components/layout/BottomNav'
import { Header } from '@/components/layout/Header'
import { OfflineIndicator } from '@/components/layout/OfflineIndicator'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header user={user} />
      <main className="flex-1 pb-24 md:pb-16">
        <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-6 sm:px-6 lg:px-8 md:pt-24">
          {children}
        </div>
      </main>
      <BottomNav />
      <OfflineIndicator />
    </div>
  )
}
