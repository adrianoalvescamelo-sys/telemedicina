import { useState, useEffect } from 'react'
import { Stethoscope, Users, Clock, CheckCircle2 } from 'lucide-react'
import { Badge } from '@/components/ui/Badge'
import { Topbar } from '@/components/layout/Topbar'
import { STATUS_CONSULTA } from '@/lib/constants'
import { CLINICA } from '@/lib/constants'
import { cn } from '@/lib/utils'

interface FilaPageProps {
  isPublic?: boolean
}

const mockFila = [
  { id: '1', paciente: 'Ana Clara Lima',   horario: '08:30', status: 'em_atendimento', medico: 'Dra. Ucirlana' },
  { id: '2', paciente: 'João Pedro Silva', horario: '09:00', status: 'aguardando',      medico: 'Dra. Ucirlana' },
  { id: '3', paciente: 'Maria Costa',      horario: '09:30', status: 'confirmado',      medico: 'Dra. Ucirlana' },
  { id: '4', paciente: 'Pedro Alves',      horario: '10:00', status: 'agendado',        medico: 'Dra. Ucirlana' },
  { id: '5', paciente: 'Carla Melo',       horario: '10:30', status: 'agendado',        medico: 'Dra. Ucirlana' },
]

// ── Public TV view (sala de espera) ───────────────────────────
function FilaTV() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  const emAtendimento = mockFila.find(f => f.status === 'em_atendimento')
  const aguardando    = mockFila.filter(f => f.status === 'aguardando')

  return (
    <div className="min-h-screen bg-primary-700 text-white flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-10 pt-8 pb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center">
            <Stethoscope className="w-7 h-7" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{CLINICA.nome}</h1>
            <p className="text-white/60 text-sm">{CLINICA.endereco}</p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-4xl font-bold font-mono">
            {time.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-white/60 text-sm capitalize">
            {time.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
      </div>

      {/* Em atendimento */}
      {emAtendimento && (
        <div className="mx-10 mb-6">
          <p className="text-white/60 text-sm uppercase tracking-widest mb-3 font-medium">Em atendimento agora</p>
          <div className="bg-white/20 backdrop-blur rounded-3xl px-8 py-6 flex items-center gap-6 border border-white/10">
            <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse shrink-0" />
            <div>
              <p className="text-4xl font-bold tracking-wide">{emAtendimento.paciente}</p>
              <p className="text-white/70 text-lg mt-1">{emAtendimento.medico} · {emAtendimento.horario}</p>
            </div>
          </div>
        </div>
      )}

      {/* Fila de espera */}
      <div className="mx-10 flex-1">
        <p className="text-white/60 text-sm uppercase tracking-widest mb-3 font-medium">Próximos</p>
        <div className="space-y-3">
          {aguardando.slice(0, 5).map((item, i) => (
            <div key={item.id}
              className={cn(
                'flex items-center gap-4 px-6 py-4 rounded-2xl border border-white/10',
                i === 0 ? 'bg-white/15' : 'bg-white/8'
              )}
            >
              <span className="text-2xl font-bold text-white/40 w-8 text-center">{i + 1}</span>
              <div className="flex-1">
                <p className="text-xl font-semibold">{item.paciente}</p>
                <p className="text-white/60 text-sm">{item.horario}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-center py-6 text-white/30 text-xs">
        Clínica Vida Popular · Sistema de Gestão Clínica · {CLINICA.cnpj}
      </div>
    </div>
  )
}

// ── Internal panel view ────────────────────────────────────────
function FilaInterna() {
  const concluidos   = mockFila.filter(f => f.status === 'concluido').length
  const total        = mockFila.length

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Fila do Dia" subtitle="Painel de atendimento em tempo real" />
      <div className="p-6 space-y-4 flex-1 overflow-y-auto">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total hoje',     value: total,     icon: Users,         color: 'text-text'      },
            { label: 'Concluídos',     value: concluidos, icon: CheckCircle2, color: 'text-green-600' },
            { label: 'Aguardando',     value: mockFila.filter(f=>f.status==='aguardando').length, icon: Clock, color: 'text-yellow-600' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl border border-border p-4 flex items-center gap-3 card-shadow">
              <s.icon className={`w-5 h-5 ${s.color}`} />
              <div>
                <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                <p className="text-xs text-muted">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Fila */}
        <div className="bg-white rounded-xl border border-border card-shadow overflow-hidden">
          <div className="divide-y divide-border">
            {mockFila.map((item, i) => {
              const st = STATUS_CONSULTA[item.status as keyof typeof STATUS_CONSULTA]
              return (
                <div key={item.id} className="flex items-center gap-4 px-5 py-4 hover:bg-slate-50 transition-colors">
                  <span className="text-sm font-bold text-muted w-5 text-center">{i + 1}</span>
                  <div className="w-1 h-8 rounded-full shrink-0" style={{ backgroundColor: st.dot.replace('bg-','').includes('-') ? undefined : '#94a3b8' }}>
                    <div className={`w-1 h-full rounded-full ${st.dot}`} />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-text">{item.paciente}</p>
                    <p className="text-xs text-muted">{item.medico}</p>
                  </div>
                  <span className="text-sm font-mono text-muted">{item.horario}</span>
                  <Badge className={`${st.color} text-xs`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${st.dot} mr-1`} />
                    {st.label}
                  </Badge>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FilaPage({ isPublic = false }: FilaPageProps) {
  return isPublic ? <FilaTV /> : <FilaInterna />
}
