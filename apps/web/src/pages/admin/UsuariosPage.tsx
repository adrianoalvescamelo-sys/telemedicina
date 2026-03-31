import { useState } from 'react'
import { 
  UserPlus, Shield, 
  Search, MoreVertical, Edit2, ShieldAlert, Lock
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Topbar } from '@/components/layout/Topbar'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

const mockUsuarios = [
  { id: '1', nome: 'Dra. Ucirlana Martins', email: 'ucirlana@clinicavida.com', role: 'admin', depto: 'Médica (Proprietária)', status: 'ativo' },
  { id: '2', nome: 'Dr. Roberto Santos', email: 'roberto@clinicavida.com', role: 'medico', depto: 'Cardiologia', status: 'atendimento' },
  { id: '3', nome: 'Juliana Alves', email: 'juliana@clinicavida.com', role: 'recepcionista', depto: 'Recepção', status: 'ativo' },
  { id: '4', nome: 'Marcos Oliveira', email: 'marcos@clinicavida.com', role: 'recepcionista', depto: 'Faturamento', status: 'ferias' },
]

const roleBadge: Record<string, any> = {
  admin: { label: 'Admin', color: 'bg-primary-100 text-primary-700' },
  medico: { label: 'Médico', color: 'bg-blue-100 text-blue-700' },
  recepcionista: { label: 'Recepção', color: 'bg-green-100 text-green-700' },
}

const statusBadge: Record<string, any> = {
  ativo: { label: 'Ativo', dot: 'bg-green-500' },
  atendimento: { label: 'Em Atendimento', dot: 'bg-blue-500' },
  ferias: { label: 'Férias', dot: 'bg-yellow-500' },
}

export default function UsuariosPage() {
  const [search, setSearch] = useState('')

  return (
    <div className="flex flex-col h-full uppercase-titles">
      <Topbar 
        title="Usuários e Acessos" 
        subtitle="Gerencie os membros da equipe e níveis de permissão"
        actions={
          <Button size="sm">
            <UserPlus className="w-4 h-4" /> Novo Usuário
          </Button>
        }
      />

      <div className="p-6 space-y-4 flex-1 overflow-y-auto">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input 
              placeholder="Buscar por nome ou e-mail..." 
              leftIcon={<Search className="w-4 h-4" />}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline"><Shield className="w-4 h-4" /> Permissões</Button>
        </div>

        <div className="bg-white rounded-xl border border-border overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-border">
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase">Usuário</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase">Função</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase">Status</th>
                <th className="px-6 py-4 text-xs font-semibold text-muted uppercase">Último Acesso</th>
                <th className="px-6 py-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {mockUsuarios.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <Avatar name={u.nome} size="sm" />
                      <div>
                        <p className="text-sm font-semibold text-text">{u.nome}</p>
                        <p className="text-xs text-muted font-mono">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <Badge variant="secondary" className={`w-fit text-[10px] ${roleBadge[u.role].color}`}>
                        {roleBadge[u.role].label}
                      </Badge>
                      <span className="text-[10px] text-muted">{u.depto}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${statusBadge[u.status].dot}`} />
                      <span className="text-xs text-text">{statusBadge[u.status].label}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-muted">Hoje, 09:42</p>
                  </td>
                  <td className="px-6 py-4">
                    <DropdownMenu.Root>
                      <DropdownMenu.Trigger asChild>
                        <Button variant="ghost" size="icon-sm"><MoreVertical className="w-4 h-4" /></Button>
                      </DropdownMenu.Trigger>
                      <DropdownMenu.Portal>
                        <DropdownMenu.Content className="bg-white rounded-lg border border-border shadow-lg py-1 min-w-[160px] z-50">
                          <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-slate-50 cursor-pointer outline-none">
                            <Edit2 className="w-3.5 h-3.5" /> Editar Perfil
                          </DropdownMenu.Item>
                          <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-slate-50 cursor-pointer outline-none">
                            <Lock className="w-3.5 h-3.5" /> Redefinir Senha
                          </DropdownMenu.Item>
                          <DropdownMenu.Separator className="h-px bg-border my-1" />
                          <DropdownMenu.Item className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 cursor-pointer outline-none">
                            <ShieldAlert className="w-3.5 h-3.5" /> Bloquear Acesso
                          </DropdownMenu.Item>
                        </DropdownMenu.Content>
                      </DropdownMenu.Portal>
                    </DropdownMenu.Root>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
