import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, Filter, Phone, FileText, MoreVertical, User } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Card, CardContent } from '@/components/ui/Card'
import { Topbar } from '@/components/layout/Topbar'
import { formatDate, formatCPF, formatPhone, calculateAge } from '@/lib/utils'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'

// ── Mock data ─────────────────────────────────────────────────
const mockPacientes = [
  {
    id: '1', nome: 'Ana Clara Lima', cpf: '12345678901', dataNascimento: '1985-04-12',
    telefoneWhatsapp: '66991234567', email: 'ana@email.com', sexo: 'F',
    convenio: 'Unimed', ativo: true, ultimaConsulta: '2026-03-15', totalConsultas: 8,
    alergias: ['Dipirona'], doencasPrevias: ['HAS'],
  },
  {
    id: '2', nome: 'João Pedro Silva', cpf: '98765432100', dataNascimento: '1972-11-30',
    telefoneWhatsapp: '66998765432', email: 'joao@email.com', sexo: 'M',
    convenio: null, ativo: true, ultimaConsulta: '2026-02-20', totalConsultas: 3,
    alergias: [], doencasPrevias: ['Diabetes Tipo 2', 'Obesidade'],
  },
  {
    id: '3', nome: 'Maria Eduarda Costa', cpf: '11122233344', dataNascimento: '1998-07-05',
    telefoneWhatsapp: '66994561234', email: '', sexo: 'F',
    convenio: 'SulAmérica', ativo: true, ultimaConsulta: '2026-03-28', totalConsultas: 1,
    alergias: ['Amoxicilina', 'Penicilina'], doencasPrevias: [],
  },
  {
    id: '4', nome: 'Pedro Henrique Alves', cpf: '55566677788', dataNascimento: '1960-01-18',
    telefoneWhatsapp: '66993216789', email: 'pedro@email.com', sexo: 'M',
    convenio: 'Bradesco Saúde', ativo: true, ultimaConsulta: '2026-01-10', totalConsultas: 15,
    alergias: [], doencasPrevias: ['HAS', 'Dislipidemia', 'IAM prévio'],
  },
  {
    id: '5', nome: 'Carla Fernanda Melo', cpf: '22233344455', dataNascimento: '1990-09-22',
    telefoneWhatsapp: '66997894561', email: 'carla@email.com', sexo: 'F',
    convenio: null, ativo: false, ultimaConsulta: '2025-11-05', totalConsultas: 2,
    alergias: [], doencasPrevias: [],
  },
]

export default function PacientesPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')

  const filtered = mockPacientes.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.cpf.includes(search.replace(/\D/g, '')) ||
    p.telefoneWhatsapp.includes(search.replace(/\D/g, ''))
  )

  return (
    <div className="flex flex-col h-full">
      <Topbar
        title="Pacientes"
        subtitle={`${mockPacientes.filter(p => p.ativo).length} pacientes ativos`}
        actions={
          <Button size="sm" onClick={() => navigate('/pacientes/novo')}>
            <Plus className="w-4 h-4" />
            Novo Paciente
          </Button>
        }
      />

      <div className="p-6 space-y-4 flex-1 overflow-y-auto">
        {/* Busca */}
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Buscar por nome, CPF ou telefone..."
              leftIcon={<Search className="w-4 h-4" />}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4" />
            Filtros
          </Button>
        </div>

        {/* Stats rápidas */}
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Total', value: mockPacientes.length, color: 'text-text' },
            { label: 'Ativos', value: mockPacientes.filter(p => p.ativo).length, color: 'text-green-600' },
            { label: 'Com convênio', value: mockPacientes.filter(p => p.convenio).length, color: 'text-blue-600' },
            { label: 'Com alergias', value: mockPacientes.filter(p => p.alergias.length > 0).length, color: 'text-red-600' },
          ].map(s => (
            <Card key={s.label}>
              <CardContent className="pt-4 pb-4 text-center">
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted mt-0.5">{s.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabela */}
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-slate-50">
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-5 py-3">Paciente</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-4 py-3 hidden md:table-cell">CPF</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Contato</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-4 py-3 hidden lg:table-cell">Convênio</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-4 py-3 hidden xl:table-cell">Última consulta</th>
                  <th className="text-left text-xs font-semibold text-muted uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filtered.map(p => (
                  <tr
                    key={p.id}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                    onClick={() => navigate(`/pacientes/${p.id}`)}
                  >
                    {/* Nome + avatar */}
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={p.nome} size="sm" />
                        <div>
                          <p className="text-sm font-medium text-text">{p.nome}</p>
                          <p className="text-xs text-muted">
                            {calculateAge(p.dataNascimento)} anos · {p.sexo === 'F' ? 'Feminino' : 'Masculino'}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* CPF */}
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-sm font-mono text-muted">{formatCPF(p.cpf)}</span>
                    </td>

                    {/* Contato */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1 text-xs text-muted">
                        <Phone className="w-3 h-3" />
                        {formatPhone(p.telefoneWhatsapp)}
                      </div>
                    </td>

                    {/* Convênio */}
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {p.convenio
                        ? <Badge variant="default" className="text-xs">{p.convenio}</Badge>
                        : <span className="text-xs text-muted">Particular</span>
                      }
                    </td>

                    {/* Última consulta */}
                    <td className="px-4 py-3 hidden xl:table-cell">
                      <span className="text-sm text-text">{formatDate(p.ultimaConsulta)}</span>
                      <p className="text-xs text-muted">{p.totalConsultas} consultas</p>
                    </td>

                    {/* Status + alertas */}
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <Badge variant={p.ativo ? 'success' : 'secondary'} className="text-xs w-fit">
                          {p.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {p.alergias.length > 0 && (
                          <Badge variant="danger" className="text-xs w-fit">⚠ Alergia</Badge>
                        )}
                        {p.doencasPrevias.length > 0 && (
                          <Badge variant="warning" className="text-xs w-fit">Crônico</Badge>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                      <DropdownMenu.Root>
                        <DropdownMenu.Trigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenu.Trigger>
                        <DropdownMenu.Portal>
                          <DropdownMenu.Content
                            className="bg-white rounded-lg border border-border shadow-lg py-1 min-w-[160px] z-50"
                            align="end"
                          >
                            {[
                              { label: 'Ver prontuário', icon: FileText, action: () => navigate(`/prontuarios/${p.id}`) },
                              { label: 'Agendar consulta', icon: Plus, action: () => navigate(`/agenda?paciente=${p.id}`) },
                              { label: 'Editar cadastro', icon: User, action: () => navigate(`/pacientes/${p.id}/editar`) },
                            ].map(item => (
                              <DropdownMenu.Item
                                key={item.label}
                                className="flex items-center gap-2 px-3 py-2 text-sm text-text hover:bg-slate-50 cursor-pointer outline-none"
                                onSelect={item.action}
                              >
                                <item.icon className="w-4 h-4 text-muted" />
                                {item.label}
                              </DropdownMenu.Item>
                            ))}
                          </DropdownMenu.Content>
                        </DropdownMenu.Portal>
                      </DropdownMenu.Root>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div className="text-center py-12 text-muted">
                <User className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">Nenhum paciente encontrado</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
