import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppLayout } from '@/components/layout/AppLayout'
import { useAuthStore } from '@/stores/authStore'

// Pages
import LoginPage        from '@/pages/auth/LoginPage'
import AdminDashboard   from '@/pages/admin/AdminDashboard'
import AgendaPage       from '@/pages/agenda/AgendaPage'
import PacientesPage    from '@/pages/pacientes/PacientesPage'
import NovoPacientePage from '@/pages/pacientes/NovoPacientePage'
import AtendimentoPage  from '@/pages/medico/AtendimentoPage'
import FilaPage         from '@/pages/recepcao/FilaPage'
import FinanceiroPage   from '@/pages/financeiro/FinanceiroPage'
import ProntuariosPage  from '@/pages/pacientes/ProntuariosPage'
import UsuariosPage     from '@/pages/admin/UsuariosPage'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 60_000, retry: 1 } },
})

function RoleRedirect() {
  const { user } = useAuthStore()
  const routes: Record<string, string> = {
    admin: '/admin', medico: '/medico',
    recepcionista: '/agenda', paciente: '/portal',
  }
  return <Navigate to={user ? (routes[user.role] ?? '/admin') : '/login'} replace />
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/login"       element={<LoginPage />} />
          <Route path="/fila-publica" element={<FilaPage isPublic />} />

          {/* Protected */}
          <Route element={<AppLayout />}>
            <Route path="/" element={<RoleRedirect />} />
            <Route path="/admin"                  element={<AdminDashboard />} />
            <Route path="/agenda"                 element={<AgendaPage />} />
            <Route path="/fila"                   element={<FilaPage />} />
            <Route path="/pacientes"              element={<PacientesPage />} />
            <Route path="/pacientes/novo"         element={<NovoPacientePage />} />
            <Route path="/pacientes/:id"          element={<PacientesPage />} />
            <Route path="/prontuarios"            element={<ProntuariosPage />} />
            <Route path="/usuarios"               element={<UsuariosPage />} />
            <Route path="/medico"                 element={<AtendimentoPage />} />
            <Route path="/medico/atendimento/:id" element={<AtendimentoPage />} />
            <Route path="/financeiro"             element={<FinanceiroPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  )
}
