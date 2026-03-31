import { Bell } from 'lucide-react'
import { useAuthStore } from '@/stores/authStore'
import { Avatar } from '@/components/ui/Avatar'
import { Button } from '@/components/ui/Button'
import { USER_ROLES } from '@/lib/constants'
import { formatDate } from '@/lib/utils'

interface TopbarProps {
  title: string
  subtitle?: string
  actions?: React.ReactNode
}

export function Topbar({ title, subtitle, actions }: TopbarProps) {
  const { user } = useAuthStore()
  if (!user) return null

  const roleInfo = USER_ROLES[user.role]
  const today = formatDate(new Date())

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white border-b border-border h-16 shrink-0">
      {/* Left: Page title */}
      <div>
        <h1 className="text-base font-semibold text-text leading-tight">{title}</h1>
        {subtitle && <p className="text-xs text-muted leading-tight">{subtitle}</p>}
      </div>

      {/* Right */}
      <div className="flex items-center gap-3">
        {actions}

        {/* Notifications */}
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
        </Button>

        {/* User chip */}
        <div className="flex items-center gap-2 pl-3 border-l border-border">
          <Avatar name={user.nome} size="sm" />
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-text leading-tight">{user.nome.split(' ')[0]}</p>
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${roleInfo.color}`}>
              {roleInfo.label}
            </span>
          </div>
        </div>

        {/* Today's date */}
        <div className="hidden md:block text-right">
          <p className="text-xs text-muted">{today}</p>
        </div>
      </div>
    </header>
  )
}
