import { useState, useEffect, useCallback } from 'react'
import {
  Calendar, Users, DollarSign,
  ArrowUpRight, ArrowDownRight, Activity
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Topbar } from '@/components/layout/Topbar'
import { formatCurrency } from '@/lib/utils'
import { STATUS_CONSULTA } from '@/lib/constants'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts'
import api from '@/lib/api'

// ── KPI Card ───────────────────────────────────────────────────
function KpiCard({
  title, value, subtitle, icon: Icon, color, trend, trendValue
}: {
  title: string; value: string | number; subtitle?: string
  icon: React.ElementType; color: string; trend?: 'up' | 'down'; trendValue?: string
}) {
  return (
    <Card className="border-none shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="pt-5">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</p>
            <p className="text-2xl font-black text-slate-800 mt-1">{value}</p>
            {subtitle && <p className="text-[10px] text-muted font-bold mt-0.5">{subtitle}</p>}
          </div>
          <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${color} shadow-sm`}>
            <Icon className="w-5 h-5" />
          </div>
        </div>
        {trend && trendValue && (
          <div className="flex items-center gap-1 mt-4">
            <div className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-bold ${trend === 'up' ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
              {trend === 'up' ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
              {trendValue}
            </div>
            <span className="text-[10px] text-muted font-bold uppercase tracking-tighter ml-1">vs. período anterior</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>(null)
  const [finStats, setFinStats] = useState<any>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [kpisRes, finRes] = await Promise.all([
        api.get('/dashboard/kpis'),
        api.get('/financeiro/stats')
      ])
      setData(kpisRes.data)
      setFinStats(finRes.data)
    } catch (e) {
      console.error('Erro ao buscar dados do dashboard:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  if (loading && !data) return (
    <div className="flex h-full items-center justify-center bg-slate-50">
      <div className="text-center animate-pulse space-y-4">
        <Activity className="w-12 h-12 mx-auto text-primary-500" />
        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando Metricas...</p>
      </div>
    </div>
  )

  const metaMes = 35000 // Valor fixo para este exemplo
  const receitaMes = finStats?.totalPago || 0

  return (
    <div className="flex flex-col h-full bg-slate-50/30">
      <Topbar title="Dashboard Administrativo" subtitle="Centro de comando e métricas em tempo real" />

      <div className="p-8 space-y-8 overflow-y-auto">
        {/* KPIs Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Consultas Hoje"
            value={data.consultasHoje}
            subtitle="Atendimentos confirmados"
            icon={Calendar}
            color="bg-blue-100 text-blue-600"
            trend="up" trendValue="+12%"
          />
          <KpiCard
            title="Receita Realizada"
            value={formatCurrency(receitaMes)}
            subtitle="Total pago este mês"
            icon={DollarSign}
            color="bg-green-100 text-green-600"
            trend="up" trendValue="+15%"
          />
          <KpiCard
            title="Pacientes Novos"
            value={data.pacientesNovos}
            subtitle="Novos cadastros mês"
            icon={Users}
            color="bg-purple-100 text-purple-600"
            trend="up" trendValue="+8%"
          />
          <KpiCard
            title="Taxa de Ocupação"
            value={`${data.taxaOcupacao}%`}
            subtitle="Eficiência da agenda"
            icon={Activity}
            color="bg-orange-100 text-orange-600"
            trendValue="ESTÁVEL"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 border-none shadow-sm">
            <CardHeader className="pb-0">
              <CardTitle className="text-sm font-black uppercase tracking-tight">Fluxo de Faturamento</CardTitle>
              <CardDescription className="text-xs">Consolidado mensal de receitas e despesas</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={finStats?.cashflow} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorEntrada" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.1} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                  <XAxis dataKey="mes" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} />
                  <YAxis tick={{ fontSize: 10, fontWeight: 600 }} axisLine={false} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    formatter={(v) => formatCurrency(Number(v))} 
                  />
                  <Area type="monotone" dataKey="entrada" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorEntrada)" name="Receita" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-none shadow-sm overflow-hidden">
            <div className="h-2 bg-primary-600" />
            <CardHeader>
              <CardTitle className="text-sm font-black uppercase tracking-tight">Metas e Inadimplência</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between text-[11px] font-bold text-slate-500 uppercase">
                  <span>Atingido</span>
                  <span>{Math.round((receitaMes/metaMes)*100)}%</span>
                </div>
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary-500 rounded-full animate-in slide-in-from-left duration-1000" style={{ width: `${(receitaMes/metaMes)*100}%` }} />
                </div>
                <div className="flex justify-between text-xs font-bold text-slate-800">
                  <span>{formatCurrency(receitaMes)}</span>
                  <span className="text-muted">de {formatCurrency(metaMes)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 space-y-4">
                <div className="flex justify-between items-center group">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Em Aberto</span>
                  <span className="text-sm font-black text-blue-600">{formatCurrency(finStats?.totalPendente || 0)}</span>
                </div>
                <div className="flex justify-between items-center group">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-tighter">Inadimplência</span>
                  <span className="text-sm font-black text-red-600">{formatCurrency(finStats?.totalInadimplente || 0)}</span>
                </div>
              </div>

              <Button size="sm" className="w-full h-10 font-bold uppercase tracking-widest bg-slate-800 hover:bg-slate-900 shadow-lg">
                Relatórios Completos
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Consultas de hoje */}
        <Card className="border-none shadow-sm overflow-hidden">
           <CardHeader className="bg-slate-50/50 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-black uppercase tracking-tight">Consultas Prioritárias Hoje</CardTitle>
                <CardDescription className="text-xs">Fluxo de atendimento da sala de espera</CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-primary-600 font-bold text-xs" onClick={() => window.location.href='/agenda'}>
                VER AGENDA COMPLETA
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-slate-100 px-6">
              {data.proximas.length === 0 ? (
                <div className="py-12 text-center text-muted italic text-sm">Sem consultas para o restante do dia</div>
              ) : (
                data.proximas.map((c: any) => {
                  const st = STATUS_CONSULTA[c.status as keyof typeof STATUS_CONSULTA] || STATUS_CONSULTA.agendado
                  return (
                    <div key={c.id} className="flex items-center gap-6 py-4 group hover:bg-slate-50/50 transition-colors">
                      <div className="text-sm font-black text-primary-600 w-16 shrink-0 font-mono tracking-tighter">
                        {new Date(c.data_hora_inicio).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-slate-800 uppercase tracking-tight truncate">{c.paciente?.nome_completo}</p>
                        <p className="text-[10px] text-muted font-bold uppercase">{c.medico?.nome} · {c.tipo || 'CONSULTA'}</p>
                      </div>
                      <Badge variant="secondary" className={`${st.color} text-[10px] font-black border-none uppercase px-3 rounded-full shadow-sm`}>
                         <div className={`w-1.5 h-1.5 rounded-full ${st.dot} mr-2`} />
                        {st.label}
                      </Badge>
                    </div>
                  )
                })
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
