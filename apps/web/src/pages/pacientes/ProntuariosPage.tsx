import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FileText, Search, Plus, Filter, History, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Topbar } from '@/components/layout/Topbar'
import { formatDate, calculateAge } from '@/lib/utils'
import api from '@/lib/api'

export default function ProntuariosPage() {
  const navigate = useNavigate()
  const [search, setSearch] = useState('')
  const [pacientes, setPacientes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadPacientes = async () => {
      try {
        const { data } = await api.get('/pacientes')
        setPacientes(data)
      } catch (e) {
        console.error('Erro ao buscar pacientes:', e)
      } finally {
        setLoading(false)
      }
    }
    loadPacientes()
  }, [])

  const filtered = pacientes.filter(p => 
    p.nome_completo?.toLowerCase().includes(search.toLowerCase()) || 
    p.cpf?.includes(search)
  )

  return (
    <div className="flex flex-col h-full uppercase-titles">
      <Topbar 
        title="Prontuários" 
        subtitle="Histórico clínico e documentos dos pacientes"
      />

      <div className="p-6 space-y-4 flex-1 overflow-y-auto">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input 
              placeholder="Buscar por nome ou CPF..." 
              leftIcon={<Search className="w-4 h-4" />}
              value={search}
              onChange={(e: any) => setSearch(e.target.value)}
            />
          </div>
          <Button variant="outline"><Filter className="w-4 h-4" /> Filtros</Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 animate-pulse">
            <Loader2 className="w-10 h-10 text-primary-500 animate-spin mb-4" />
            <p className="text-sm text-muted">Carregando lista de pacientes...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map(p => (
              <Card key={p.id} hover className="group cursor-pointer border-l-4 border-l-primary-500" onClick={() => navigate(`/medico/atendimento/${p.id}`)}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar name={p.nome_completo} size="md" />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-text truncate">{p.nome_completo}</p>
                      <p className="text-xs text-muted">
                        {calculateAge(p.data_nascimento)} anos · CPF: {p.cpf}
                      </p>
                    </div>
                    <Badge variant={p.status === 'novo' ? 'success' : 'secondary'} className="text-[10px]">
                      {(p.status || 'ATIVO').toUpperCase()}
                    </Badge>
                  </div>

                  <div className="mt-4 pt-4 border-t border-border space-y-2">
                    <div className="flex items-center justify-between text-xs text-muted">
                      <span className="flex items-center gap-1"><History className="w-3 h-3" /> Última visita</span>
                      <span>{p.ultima_consulta ? formatDate(p.ultima_consulta) : 'Sem registros'}</span>
                    </div>
                    {p.alertas?.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {p.alertas.map((a: any) => (
                          <Badge key={a} variant="danger" className="text-[10px] py-0">{a}</Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button variant="ghost" size="sm" className="flex-1 text-xs">
                      <FileText className="w-3 h-3" /> Histórico
                    </Button>
                    <Button size="sm" className="flex-1 text-xs">
                      <Plus className="w-3 h-3" /> Novo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
            
            <Card className="border-dashed border-2 flex items-center justify-center py-12 bg-slate-50/50 hover:bg-slate-50 hover:border-primary-300 transition-all cursor-pointer group" onClick={() => navigate('/pacientes/novo')}>
              <div className="text-center space-y-2">
                <div className="w-10 h-10 rounded-full bg-white border border-border flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                  <Plus className="w-5 h-5 text-muted group-hover:text-primary-600" />
                </div>
                <p className="text-sm font-medium text-muted group-hover:text-primary-600">Novo Paciente</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
