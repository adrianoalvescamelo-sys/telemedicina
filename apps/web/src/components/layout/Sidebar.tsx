import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard, Calendar, Users, FileText, DollarSign,
  Settings, LogOut, Stethoscope, ClipboardList,
  Activity, UserCog
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/stores/authStore'
import { Avatar } from '@/components/ui/Avatar'
import { CLINICA } from '@/lib/constants'

const navByRole = {
  admin: [
    { to: '/admin',            icon: LayoutDashboard, label: 'Dashboard'    },
    { to: '/agenda',           icon: Calendar,        label: 'Agenda'       },
    { to: '/pacientes',        icon: Users,           label: 'Pacientes'    },
    { to: '/prontuarios',      icon: FileText,        label: 'Prontuários'  },
    { to: '/financeiro',       icon: DollarSign,      label: 'Financeiro'   },
    { to: '/relatorios',       icon: Activity,        label: 'Relatórios'   },
    { to: '/usuarios',         icon: UserCog,         label: 'Usuários'     },
    { to: '/configuracoes',    icon: Settings,        label: 'Configurações'},
  ],
  medico: [
    { to: '/medico',           icon: LayoutDashboard, label: 'Minha Agenda' },
    { to: '/pacientes',        icon: Users,           label: 'Pacientes'    },
    { to: '/prontuarios',      icon: FileText,        label: 'Prontuários'  },
  ],
  recepcionista: [
    { to: '/agenda',           icon: Calendar,        label: 'Agenda'       },
    { to: '/pacientes',        icon: Users,           label: 'Pacientes'    },
    { to: '/fila',             icon: ClipboardList,   label: 'Fila do Dia'  },
    { to: '/financeiro',       icon: DollarSign,      label: 'Financeiro'   },
  ],
  paciente: [
    { to: '/portal',           icon: LayoutDashboard, label: 'Minhas Consultas' },
    { to: '/portal/documentos',icon: FileText,        label: 'Documentos'   },
  ],
}

export function Sidebar() {
  const { user, logout } = useAuthStore()
  if (!user) return null

  const navItems = navByRole[user.role] ?? []

  return (
    <aside className="flex flex-col w-60 min-h-screen bg-primary-700 text-white shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
        <div className="flex items-center justify-center w-9 h-9 rounded-lg bg-white/15">
          <Stethoscope className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-bold leading-tight">{CLINICA.nome}</p>
          <p className="text-xs text-white/60 leading-tight">Sinop – MT</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex flex-col gap-0.5 px-3 py-4 flex-1">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to.split('/').length <= 2}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:bg-white/10 hover:text-white'
              )
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* User footer */}
      <div className="border-t border-white/10 p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-white/10 group">
          <Avatar name={user.nome} size="sm" className="border-2 border-white/30" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate leading-tight">{user.nome}</p>
            <p className="text-xs text-white/50 capitalize leading-tight">{user.role}</p>
          </div>
          <button
            onClick={logout}
            title="Sair"
            className="opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-white"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
