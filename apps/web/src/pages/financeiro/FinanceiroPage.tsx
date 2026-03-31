import { useState, useEffect, useCallback } from 'react'
import { 
  DollarSign, TrendingUp, TrendingDown, Plus, 
  Check, Filter, CheckCircle2 
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Topbar } from '@/components/layout/Topbar'
import { formatCurrency, formatDate } from '@/lib/utils'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '@/lib/api'

const statusStyles: Record<string, string> = {
  pendente:    'bg-yellow-100 text-yellow-700',
  pago:        'bg-green-100 text-green-700',
  parcial:     'bg-blue-100 text-blue-700',
  atrasado:    'bg-red-100 text-red-700',
  cortesia:    'bg-slate-100 text-slate-500',
}

export default function FinanceiroPage() {
  const [tab, setTab] = useState<'receber' | 'pagar' | 'fluxo'>('receber')
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [transactions, setTransactions] = useState<any[]>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    try {
      const [statsRes, transRes] = await Promise.all([
        api.get('/financeiro/stats'),
        api.get('/financeiro')
      ])
      setStats(statsRes.data)
      setTransactions(transRes.data)
    } catch (e) {
      console.error('Erro ao buscar dados financeiros:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadData() }, [loadData])

  const handleReceber = async (id: string) => {
    try {
      await api.patch(`/financeiro/${id}/status`, { status: 'pago' })
      loadData()
    } catch (e) {
      console.error('Erro ao processar recebimento:', e)
    }
  }

  if (loading && !stats) return (
    <div className="flex h-full items-center justify-center bg-slate-50">
      <div className="text-center animate-pulse">
        <DollarSign className="w-12 h-12 mx-auto text-primary-600 mb-4" />
        <p className="text-sm text-muted">Carregando dados financeiros...</p>
      </div>
    </div>
  )

  return (
    <div className="flex flex-col h-full">
      <Topbar
        title="Financeiro"
        subtitle="Controle de contas e fluxo de caixa"
        actions={
          <Button size="sm">
            <Plus className="w-4 h-4" /> Novo Lançamento
          </Button>
        }
      />

      <div className="p-6 space-y-5 flex-1 overflow-y-auto">
        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { label: 'A Receber', value: stats?.totalPendente,    icon: TrendingUp,   color: 'text-blue-600',  bg: 'bg-blue-100'  },
            { label: 'Pago',      value: stats?.totalPago,         icon: Check,        color: 'text-green-600', bg: 'bg-green-100' },
            { label: 'Inadimpl.', value: stats?.totalInadimplente, icon: TrendingDown, color: 'text-red-600',   bg: 'bg-red-100'   },
          ].map(k => (
            <Card key={k.label}>
              <CardContent className="pt-5 flex items-center gap-4">
                <div className={`w-10 h-10 rounded-xl ${k.bg} flex items-center justify-center shrink-0`}>
                  <k.icon className={`w-5 h-5 ${k.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted font-medium uppercase tracking-tight">{k.label}</p>
                  <p className={`text-xl font-bold ${k.color}`}>{formatCurrency(k.value || 0)}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <div className="flex gap-0 border-b border-border">
          {([['receber','A Receber'],['pagar','A Pagar'],['fluxo','Fluxo de Caixa']] as const).map(([id, label]) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`px-5 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                tab === id ? 'border-primary-500 text-primary-600 bg-primary-50/50' : 'border-transparent text-muted hover:text-text'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Contas a receber */}
        {tab === 'receber' && (
          <Card className="border-none shadow-sm">
            <CardHeader className="bg-slate-50/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-bold uppercase">Contas a Receber</CardTitle>
                <Button variant="outline" size="sm" className="h-8 text-xs font-bold"><Filter className="w-3.5 h-3.5" /> Filtrar</Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border bg-slate-50/80">
                      {['Descrição','Valor','Vencimento','Status','Ação'].map(h => (
                        <th key={h} className="text-left text-[10px] font-black text-slate-500 uppercase tracking-widest px-6 py-3 last:text-center">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {transactions.filter(t => t.tipo === 'entrada').length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-20 text-center text-muted italic text-sm">Nenhum lançamento encontrado</td>
                      </tr>
                    ) : (
                      transactions.filter(t => t.tipo === 'entrada').map(r => (
                        <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <p className="text-sm font-semibold text-text">{r.descricao}</p>
                            {r.paciente_id && <p className="text-[10px] text-muted uppercase font-bold tracking-tight">Paciente Vinculado</p>}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold text-slate-700">{formatCurrency(r.valor)}</td>
                          <td className="px-6 py-4 text-sm text-muted">{formatDate(r.data_vencimento)}</td>
                          <td className="px-6 py-4">
                            <Badge className={`${statusStyles[r.status]} text-[10px] font-black uppercase px-2 py-0 border-none`}>
                              {r.status === 'atrasado' ? 'INADIMPLENTE' : r.status}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center">
                            {r.status === 'pendente' ? (
                              <Button size="sm" variant="success" className="h-7 text-[10px] font-black uppercase tracking-tighter" onClick={() => handleReceber(r.id)}>
                                <Check className="w-3 h-3" /> Receber
                              </Button>
                            ) : r.status === 'pago' ? (
                              <div className="flex flex-col items-center gap-0.5 opacity-60">
                                <CheckCircle2 className="w-3.5 h-3.5 text-green-600" />
                                <span className="text-[8px] font-bold text-green-600 uppercase">Recebido</span>
                              </div>
                            ) : null}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Fluxo de caixa */}
        {tab === 'fluxo' && (
          <Card className="border-none shadow-sm">
            <CardHeader className="bg-slate-50/50">
              <CardTitle className="text-sm font-bold uppercase tracking-tight">Fluxo de Caixa — Últimos 6 Meses</CardTitle>
              <CardDescription className="text-xs">Consolidado mensal de entradas e saídas</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stats?.cashflow} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                    <XAxis dataKey="mes" tick={{ fontSize: 10, fontWeight: 700 }} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fontWeight: 600 }} tickFormatter={v => `R$${(v/1000).toFixed(0)}k`} axisLine={false} />
                    <Tooltip 
                      cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      formatter={(v) => formatCurrency(Number(v))} 
                    />
                    <Bar dataKey="entrada" name="Entradas" fill="#10B981" radius={[6,6,0,0]} barSize={24} />
                    <Bar dataKey="saida"   name="Saídas"   fill="#EF4444" radius={[6,6,0,0]} barSize={24} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {tab === 'pagar' && (
          <Card className="py-20 text-center border-none shadow-sm">
            <CardContent>
              <div className="w-16 h-16 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4 border border-slate-200">
                <DollarSign className="w-8 h-8 text-slate-300" />
              </div>
              <p className="text-muted text-sm font-medium">Controle de Saídas</p>
              <p className="text-xs text-muted/60 mt-1">Cadastre fornecedores e gerencie despesas fixas</p>
              <Button size="sm" className="mt-6 font-bold text-xs uppercase"><Plus className="w-3.5 h-3.5" /> Lançar Despesa</Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
