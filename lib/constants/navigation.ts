import type { LucideIcon } from 'lucide-react'
import { FileText, AlertCircle, Brain, User } from 'lucide-react'

export type DashboardNavItem = {
  name: string
  href: string
  icon: LucideIcon
}

export const DASHBOARD_NAV_ITEMS: DashboardNavItem[] = [
  { name: 'Tests', href: '/tests', icon: FileText },
  { name: 'Erreurs', href: '/errors', icon: AlertCircle },
  { name: 'Notions', href: '/notions', icon: Brain },
  { name: 'Profil', href: '/', icon: User },
]
