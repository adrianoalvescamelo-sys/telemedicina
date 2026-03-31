import { useState, useCallback, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import {
  FileText, Save, Mic, MicOff, Bot,
  Pill, AlertTriangle, Activity,
  Plus, X, CheckCircle2, History
} from 'lucide-react'
import { pdfService } from '@/lib/pdfService'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Textarea } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Avatar } from '@/components/ui/Avatar'
import { Topbar } from '@/components/layout/Topbar'
import { cn, formatDate, calculateAge } from '@/lib/utils'
import { useAudioRecorder } from '@/hooks/useAudioRecorder'
import api from '@/lib/api'
import { useAuthStore } from '@/stores/authStore'

// ── AI Panel ──────────────────────────────────────────────────
function AiPanel({ onClose, onApply, patient }: { onClose: () => void, onApply: (soap: any) => void, patient: any }) {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const { isRecording, startRecording, stopRecording, getAudioBlob } = useAudioRecorder()

  const handleAnalize = async () => {
    setLoading(true)
    try {
      const audioBlob = getAudioBlob()
      let transcript = ""

      if (audioBlob) {
        const formData = new FormData()
        formData.append('audio', audioBlob, 'consulta.webm')
        const transRes = await api.post('/ia/transcrever', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
        transcript = transRes.data.text
      }

      const res = await api.post('/ia/analisar', {
        transcript,
        patientContext: patient
      })
      setResult(res.data.analysis)
    } catch (e) {
      console.error('Erro na análise IA:', e)
    } finally {
      setLoading(false)
    }
  }

  const parseSoapAndApply = () => {
    if (!result) return
    const soap = {
      s: result.match(/S:?\s*([\s\S]*?)(?=O:|$)/)?.[1]?.trim() || "",
      o: result.match(/O:?\s*([\s\S]*?)(?=A:|$)/)?.[1]?.trim() || "",
      a: result.match(/A:?\s*([\s\S]*?)(?=P:|$)/)?.[1]?.trim() || "",
      p: result.match(/P:?\s*([\s\S]*?)(?=Red Flags:|$)/)?.[1]?.trim() || "",
    }
    onApply(soap)
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-border shadow-2xl">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-gradient-to-r from-primary-700 to-primary-500 text-white">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4" />
          <span className="text-sm font-semibold tracking-tight">Agente IA Clínico</span>
          <Badge className="bg-white/20 text-white text-[10px] border-none">BETA</Badge>
        </div>
        <button onClick={onClose} className="text-white/70 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
        {!result && !loading && (
          <div className="text-center py-8 space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto shadow-sm">
              <Bot className="w-7 h-7 text-primary-600" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-bold text-text uppercase tracking-wide">Assistente SOAP</p>
              <p className="text-xs text-muted leading-relaxed px-4">
                Escuto a consulta em tempo real e gero um rascunho clínico inteligente para você.
              </p>
            </div>
            
            <div className="pt-2 px-2">
              {!isRecording ? (
                <Button size="sm" onClick={startRecording} variant="outline" className="w-full mb-2 bg-white hover:bg-primary-50 border-primary-200 text-primary-700">
                  <Mic className="w-4 h-4" /> Iniciar Gravação
                </Button>
              ) : (
                <Button size="sm" onClick={stopRecording} variant="danger" className="w-full mb-2 animate-pulse">
                  <MicOff className="w-4 h-4" /> Parar agora
                </Button>
              )}
              
              <Button size="sm" onClick={handleAnalize} className="w-full shadow-md" disabled={isRecording}>
                <Activity className="w-3.5 h-3.5" />
                Gerar Rascunho IA
              </Button>
            </div>
          </div>
        )}

        {loading && (
          <div className="text-center py-12 space-y-4">
            <div className="relative w-16 h-16 mx-auto">
              <div className="absolute inset-0 rounded-2xl bg-primary-200 animate-ping opacity-25" />
              <div className="relative w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center shadow-inner">
                <Bot className="w-8 h-8 text-primary-600" />
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-sm font-medium text-primary-700">Claude está analisando...</p>
              <div className="flex justify-center gap-1.5">
                {[0,1,2].map(i => (
                  <div key={i} className="w-1.5 h-1.5 bg-primary-400 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            </div>
          </div>
        )}

        {result && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex gap-3 text-xs text-amber-800 shadow-sm">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
              <p>Valide as informações geradas. A IA pode sugerir CID-10 e condutas, mas a decisão final é sua.</p>
            </div>
            <div className="bg-slate-900 rounded-xl p-5 text-[11px] text-slate-100 leading-relaxed whitespace-pre-wrap font-mono shadow-xl border border-slate-700 max-h-[500px] overflow-y-auto custom-scrollbar">
              {result}
            </div>
            <div className="flex gap-3 pt-2">
              <Button size="sm" variant="outline" className="flex-1 bg-white" onClick={() => setResult(null)}>
                Descartar
              </Button>
              <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 shadow-lg" onClick={parseSoapAndApply}>
                <CheckCircle2 className="w-3.5 h-3.5" /> Aplicar no SOAP
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────
export default function AtendimentoPage() {
  const { id } = useParams()
  const [patient, setPatient] = useState<any>(null)
  const [history, setHistory] = useState<any[]>([])
  const [aiOpen, setAiOpen] = useState(false)
  const [tab, setTab] = useState<'soap' | 'anamnese' | 'exame' | 'documentos'>('soap')
  const [saved, setSaved] = useState(false)
  const [soapData, setSoapData] = useState({ s: '', o: '', a: '', p: '' })
  const { user } = useAuthStore()

  // Document states
  const [prescricao, setPrescricao] = useState('')
  const [atestadoDias, setAtestadoDias] = useState('1')
  const [atestadoCid, setAtestadoCid] = useState('')

  const loadData = useCallback(async () => {
    if (!id) return
    try {
      const [patientRes, historyRes] = await Promise.all([
        api.get(`/pacientes/${id}`),
        api.get(`/prontuarios/paciente/${id}`)
      ])
      setPatient(patientRes.data)
      setHistory(historyRes.data)
    } catch (e) {
      console.error('Erro ao carregar dados do atendimento:', e)
    }
  }, [id])

  useEffect(() => { loadData() }, [loadData])

  const handleSave = async () => {
    if (!patient) return
    setSaved(true)
    try {
      await api.post('/prontuarios', {
        paciente_id: patient.id,
        ...soapData
      })
      alert('Prontuário salvo com sucesso!')
      loadData()
    } catch (e) {
      console.error('Erro ao salvar prontuário:', e)
    } finally {
      setSaved(false)
    }
  }

  const handleApplyAi = (data: any) => {
    setSoapData(prev => ({
      s: prev.s + (prev.s ? '\n\n' : '') + data.s,
      o: prev.o + (prev.o ? '\n\n' : '') + data.o,
      a: prev.a + (prev.a ? '\n\n' : '') + data.a,
      p: prev.p + (prev.p ? '\n\n' : '') + data.p,
    }))
    setTab('soap')
    setAiOpen(false)
  }

  const handlePrintReceita = () => {
    if (!patient) return
    pdfService.generatePrescription(
      { nome_completo: patient.nome_completo, cpf: patient.cpf },
      prescricao || soapData.p,
      { 
        nome: user?.nome || 'Médico(a)', 
        crm: (user as any)?.crm || 'N/A' 
      }
    )
  }

  const handlePrintAtestado = () => {
    if (!patient) return
    pdfService.generateSickNote(
      { nome_completo: patient.nome_completo, cpf: patient.cpf },
      atestadoDias,
      atestadoCid,
      { 
        nome: user?.nome || 'Médico(a)', 
        crm: (user as any)?.crm || 'N/A' 
      }
    )
  }

  if (!patient) return (
    <div className="flex h-full items-center justify-center bg-slate-50">
      <div className="text-center animate-pulse space-y-4">
        <Bot className="w-14 h-14 mx-auto text-primary-400 rotate-12" />
        <p className="text-sm font-medium text-muted uppercase tracking-widest">Sincronizando prontuário...</p>
      </div>
    </div>
  )

  const tabs = [
    { id: 'soap',      label: 'REGISTRO SOAP' },
    { id: 'anamnese',  label: 'ANAMNESE' },
    { id: 'exame',     label: 'EXAME FÍSICO' },
    { id: 'documentos',label: 'DOCUMENTOS' },
  ] as const

  return (
    <div className="flex flex-col h-full">
      <Topbar
        title="Atendimento Clínico"
        subtitle={`${patient.nome_completo} · ${calculateAge(patient.data_nascimento)} anos · CPF ${patient.cpf}`}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant={aiOpen ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setAiOpen(!aiOpen)}
              className={cn("transition-all", aiOpen && "bg-primary-100 border-primary-300")}
            >
              <Bot className="w-4 h-4" />
              {aiOpen ? 'Fechar Assistente' : 'Assistente IA'}
            </Button>
            <Button size="sm" onClick={handleSave} loading={saved} className="bg-primary-600 hover:bg-primary-700 shadow-md">
              {saved ? <><CheckCircle2 className="w-4 h-4" /> Salvo!</> : <><Save className="w-4 h-4" /> Salvar</>}
            </Button>
            <Button size="sm" variant="danger" className="shadow-md font-bold uppercase tracking-widest text-[10px] h-8">
              Finalizar Consulta
            </Button>
          </div>
        }
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar: Patient Info & History */}
        <div className="w-85 shrink-0 border-r border-border bg-slate-50 overflow-y-auto hidden lg:block scrollbar-hide">
          <div className="p-7 space-y-8">
            <div className="text-center relative">
              <Avatar name={patient.nome_completo} size="xl" className="mx-auto mb-5 border-4 border-white shadow-xl" />
              <h2 className="font-extrabold text-xl text-slate-800 uppercase leading-none tracking-tight">{patient.nome_completo}</h2>
              <Badge className="mt-4 bg-primary-50 text-primary-700 border border-primary-200 px-3 py-1 font-mono text-[10px]">
                ID PACIENTE: #{patient.id.slice(0, 8)}
              </Badge>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Idade</p>
                <p className="text-sm font-black text-slate-800">{calculateAge(patient.data_nascimento)} ANOS</p>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
                <p className="text-[9px] text-muted-foreground uppercase font-bold tracking-wider mb-1">Gênero</p>
                <p className="text-sm font-black text-slate-800">{patient.genero || 'FEM'}</p>
              </div>
            </div>

            <div className="space-y-5 pt-2">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Histórico Recente</span>
                <Badge className="bg-slate-200 text-slate-600 border-none text-[9px] h-4">{history.length}</Badge>
              </div>
              
              <div className="space-y-3">
                {history.length === 0 ? (
                  <div className="text-center py-10 bg-slate-100/50 rounded-3xl border border-dashed border-slate-300">
                    <History className="w-6 h-6 text-slate-300 mx-auto mb-3" />
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">Sem registros prévios</p>
                  </div>
                ) : (
                  history.slice(0, 4).map((h) => (
                    <Card key={h.id} className="bg-white border-slate-200 shadow-sm hover:shadow-md hover:border-primary-400 transition-all cursor-pointer group rounded-2xl overflow-hidden">
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-[10px] font-black text-primary-600 bg-primary-50 px-2 py-0.5 rounded-full">
                            {formatDate(h.criado_em)}
                          </span>
                          <span className="text-[9px] font-bold text-slate-400 uppercase">{h.status || 'FINALIZADO'}</span>
                        </div>
                        <p className="text-xs text-slate-700 font-medium line-clamp-3 leading-snug">
                          {h.a || h.s || 'Resumo clínico não disponível...'}
                        </p>
                      </div>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main content */}
        <div className={cn('flex flex-col flex-1 overflow-hidden bg-white', aiOpen && 'lg:w-[calc(100%-650px)]')}>
          {/* Tabs */}
          <div className="flex border-b border-border bg-slate-50/30 px-8 gap-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  'px-6 py-4 text-[11px] font-black tracking-widest border-b-4 transition-all uppercase',
                  tab === t.id
                    ? 'border-primary-600 text-primary-700 bg-white'
                    : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-100/50'
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-y-auto p-8 space-y-6">
            {tab === 'soap' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-300">
                <Card className="border-slate-200 shadow-sm overflow-hidden group">
                  <div className="bg-blue-600 h-1.5 w-full opacity-80" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[11px] font-black text-blue-700 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-blue-600" /> S — Subjetivo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      placeholder="Relato do paciente: queixa, história, sintomas, duração..." 
                      className="min-h-[180px] border-none shadow-none text-sm resize-none focus-visible:ring-0 px-0"
                      value={soapData.s}
                      onChange={(e) => setSoapData({...soapData, s: e.target.value})}
                    />
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm overflow-hidden group">
                  <div className="bg-green-600 h-1.5 w-full opacity-80" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[11px] font-black text-green-700 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-600" /> O — Objetivo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      placeholder="Exame físico, sinais vitais, observações clínicas..." 
                      className="min-h-[180px] border-none shadow-none text-sm resize-none focus-visible:ring-0 px-0"
                      value={soapData.o}
                      onChange={(e) => setSoapData({...soapData, o: e.target.value})}
                    />
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm overflow-hidden group">
                  <div className="bg-purple-600 h-1.5 w-full opacity-80" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[11px] font-black text-purple-700 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-purple-600" /> A — Avaliação
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Textarea 
                      placeholder="Hipóteses diagnósticas e códigos CID-10..." 
                      className="min-h-[100px] border-none shadow-none text-sm resize-none focus-visible:ring-0 px-0"
                      value={soapData.a}
                      onChange={(e) => setSoapData({...soapData, a: e.target.value})}
                    />
                    <div className="pt-2 border-t border-slate-100 flex gap-2">
                      <Input placeholder="Codificar CID-10..." className="bg-slate-50 border-none text-xs h-8" />
                      <Button size="sm" variant="outline" className="h-8 px-2"><Plus className="w-3 h-3" /></Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm overflow-hidden group">
                  <div className="bg-orange-600 h-1.5 w-full opacity-80" />
                  <CardHeader className="pb-2">
                    <CardTitle className="text-[11px] font-black text-orange-700 uppercase tracking-widest flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-orange-600" /> P — Plano
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Textarea 
                      placeholder="Conduta medicamentosa, exames pedidos, orientações..." 
                      className="min-h-[140px] border-none shadow-none text-sm resize-none focus-visible:ring-0 px-0"
                      value={soapData.p}
                      onChange={(e) => setSoapData({...soapData, p: e.target.value})}
                    />
                  </CardContent>
                </Card>
              </div>
            )}

            {tab === 'anamnese' && (
              <Card className="max-w-4xl border-slate-200 shadow-sm">
                <CardContent className="space-y-6 pt-8">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Antecedentes Clínicos</label>
                    <Textarea placeholder="Diabetes, Hipertensão, Cirurgias anteriores..." rows={4} className="bg-slate-50/50" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-700">Alergias Conhecidas</label>
                      <Input placeholder="Dipirona, Látex..." />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-700">Medicamentos em Uso</label>
                      <Input placeholder="Aspirina, Metformina..." />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {tab === 'exame' && (
              <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200 animate-in fade-in duration-700">
                <Loader2 className="w-8 h-8 text-slate-300 animate-spin mb-4" />
                <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Exame Físico em desenvolvimento</p>
              </div>
            )}

            {tab === 'documentos' && (
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 animate-in fade-in zoom-in-95 duration-500">
                <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden focus-within:border-primary-400 transition-colors">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-sm font-black uppercase flex items-center gap-2 text-blue-700">
                      <Pill className="w-4 h-4" /> Receituário Médico
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <Textarea 
                      placeholder="Medicação, dosagem e via de administração..." 
                      className="min-h-[250px] bg-slate-50/30 border-slate-200 rounded-xl text-sm leading-relaxed focus:bg-white transition-all"
                      value={prescricao}
                      onChange={(e) => setPrescricao(e.target.value)}
                    />
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 font-bold uppercase tracking-widest h-11 shadow-lg" onClick={handlePrintReceita}>
                      <FileText className="w-4 h-4" /> Gerar Receita PDF
                    </Button>
                  </CardContent>
                </Card>

                <Card className="border-slate-200 shadow-sm rounded-2xl overflow-hidden focus-within:border-primary-400 transition-colors">
                  <CardHeader className="bg-slate-50/50 border-b border-slate-100">
                    <CardTitle className="text-sm font-black uppercase flex items-center gap-2 text-primary-700">
                      <FileText className="w-4 h-4" /> Atestado Médico
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Dias de Repouso</label>
                        <Input 
                          type="number" 
                          value={atestadoDias} 
                          onChange={(e) => setAtestadoDias(e.target.value)} 
                          className="bg-slate-50/50 border-slate-200 rounded-xl h-11 font-bold text-slate-700"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">CID-10 (Opcional)</label>
                        <Input 
                          placeholder="Ex: J00, Z00.0" 
                          value={atestadoCid} 
                          onChange={(e) => setAtestadoCid(e.target.value)}
                          className="bg-slate-50/50 border-slate-200 rounded-xl h-11 font-bold text-slate-700"
                        />
                      </div>
                    </div>
                    <div className="pt-4">
                      <Button className="w-full bg-primary-600 hover:bg-primary-700 font-bold uppercase tracking-widest h-11 shadow-lg" onClick={handlePrintAtestado}>
                        <FileText className="w-4 h-4" /> Gerar Atestado PDF
                      </Button>
                      <p className="text-[10px] text-center text-muted font-bold mt-4 uppercase tracking-tighter">O atestado será gerado com a data de hoje</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* IA Panel */}
        {aiOpen && (
          <div className="w-[350px] shrink-0 hidden lg:flex flex-col animate-in slide-in-from-right duration-500">
            <AiPanel 
              onClose={() => setAiOpen(false)} 
              onApply={handleApplyAi} 
              patient={patient}
            />
          </div>
        )}
      </div>
    </div>
  )
}

import { Loader2 } from 'lucide-react'
