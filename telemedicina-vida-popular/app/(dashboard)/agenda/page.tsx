'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Consulta { id:string; paciente_nome:string; agendada_para:string; status:string; tipo:string }
interface Paciente { id:string; nome:string; cpf:string }

const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb']
const MESES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro']
const HORAS = ['07:00','08:00','09:00','10:00','11:00','12:00','13:00','14:00','15:00','16:00','17:00','18:00']

export default function AgendaPage() {
  const router = useRouter()
  const hoje = new Date()
  const [ano, setAno] = useState(hoje.getFullYear())
  const [mes, setMes] = useState(hoje.getMonth())
  const [diaSel, setDiaSel] = useState(hoje.getDate())
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [modal, setModal] = useState(false)
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [form, setForm] = useState({ paciente_id:'', hora:'09:00', tipo:'teleconsulta' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const token = () => localStorage.getItem('token')

  const dataSel = `${ano}-${String(mes+1).padStart(2,'0')}-${String(diaSel).padStart(2,'0')}`

  async function loadConsultas(d = dataSel) {
    const r = await fetch(`/api/consultas?data=${d}`, { headers:{ Authorization:`Bearer ${token()}` } })
    const j = await r.json(); setConsultas(j.data || [])
  }

  async function loadPacientes() {
    const r = await fetch('/api/pacientes?limit=200', { headers:{ Authorization:`Bearer ${token()}` } })
    const j = await r.json(); setPacientes(j.data || [])
  }

  useEffect(() => { loadConsultas(); loadPacientes() }, [])
  useEffect(() => { loadConsultas(dataSel) }, [diaSel, mes, ano])

  async function agendar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const agendada_para = `${dataSel}T${form.hora}`
    const r = await fetch('/api/consultas', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${token()}`},
      body: JSON.stringify({ paciente_id: form.paciente_id, agendada_para, tipo: form.tipo })
    })
    const j = await r.json(); setSaving(false)
    if (!r.ok) { setToast(j.error||'Erro'); setTimeout(()=>setToast(''),3000); return }
    setModal(false); setToast('Consulta agendada!'); setTimeout(()=>setToast(''),3000)
    loadConsultas()
  }

  async function iniciar(c: Consulta) {
    await fetch(`/api/consultas/${c.id}`, {
      method:'PATCH',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${token()}`},
      body: JSON.stringify({ status:'em_andamento' })
    })
    router.push(`/consulta/${c.id}`)
  }

  // Calendário
  const primeiroDia = new Date(ano, mes, 1).getDay()
  const diasNoMes = new Date(ano, mes+1, 0).getDate()
  const celulas = [...Array(primeiroDia).fill(null), ...Array.from({length:diasNoMes},(_,i)=>i+1)]

  function navMes(dir: number) {
    const d = new Date(ano, mes + dir, 1)
    setAno(d.getFullYear()); setMes(d.getMonth()); setDiaSel(1)
  }

  const corStatus: Record<string,string> = {
    agendada:'#185FA5', em_andamento:'#1D9E75', encerrada:'#888', cancelada:'#D85A30'
  }

  const inp = { width:'100%',padding:'9px 12px',border:'0.5px solid rgba(0,0,0,0.25)',borderRadius:'8px',fontSize:'13px',background:'white' }

  return (
    <div style={{padding:'24px',display:'grid',gridTemplateColumns:'300px 1fr',gap:'20px',height:'calc(100vh - 48px)'}}>
      {/* CALENDÁRIO */}
      <div style={{background:'white',borderRadius:'12px',border:'0.5px solid rgba(0,0,0,0.1)',padding:'20px',alignSelf:'start'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px'}}>
          <button onClick={()=>navMes(-1)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'16px',color:'#666',padding:'4px 8px'}}>‹</button>
          <span style={{fontSize:'13px',fontWeight:'500',color:'#042C53'}}>{MESES[mes]} {ano}</span>
          <button onClick={()=>navMes(1)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'16px',color:'#666',padding:'4px 8px'}}>›</button>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px',marginBottom:'4px'}}>
          {DIAS.map(d=><div key={d} style={{textAlign:'center',fontSize:'9px',fontWeight:'600',color:'#aaa',padding:'4px 0',textTransform:'uppercase'}}>{d}</div>)}
        </div>
        <div style={{display:'grid',gridTemplateColumns:'repeat(7,1fr)',gap:'2px'}}>
          {celulas.map((dia,i) => {
            if (!dia) return <div key={i} />
            const isHoje = dia===hoje.getDate() && mes===hoje.getMonth() && ano===hoje.getFullYear()
            const isSel = dia===diaSel
            return (
              <div key={i} onClick={()=>setDiaSel(dia)}
                style={{
                  textAlign:'center',padding:'6px 4px',borderRadius:'6px',cursor:'pointer',fontSize:'12px',fontWeight: isSel||isHoje?'600':'400',
                  background: isSel?'#185FA5':isHoje?'#E6F1FB':'transparent',
                  color: isSel?'white':isHoje?'#185FA5':'#333',
                }}>
                {dia}
              </div>
            )
          })}
        </div>

        <div style={{marginTop:'16px',paddingTop:'16px',borderTop:'0.5px solid rgba(0,0,0,0.08)'}}>
          <div style={{fontSize:'11px',color:'#888',marginBottom:'8px',fontWeight:'500'}}>
            {new Date(ano,mes,diaSel).toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long'})}
          </div>
          <div style={{fontSize:'13px',fontWeight:'500',color:'#185FA5',marginBottom:'12px'}}>
            {consultas.length} consulta{consultas.length!==1?'s':''} agendada{consultas.length!==1?'s':''}
          </div>
          <button onClick={()=>setModal(true)} style={{width:'100%',background:'#185FA5',color:'white',border:'none',borderRadius:'8px',padding:'10px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>
            + Agendar consulta
          </button>
        </div>
      </div>

      {/* AGENDA DO DIA */}
      <div style={{background:'white',borderRadius:'12px',border:'0.5px solid rgba(0,0,0,0.1)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'16px 20px',borderBottom:'0.5px solid rgba(0,0,0,0.08)',flexShrink:0}}>
          <h2 style={{fontSize:'14px',fontWeight:'500',color:'#042C53'}}>
            Agenda — {new Date(ano,mes,diaSel).toLocaleDateString('pt-BR',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}
          </h2>
        </div>

        <div style={{flex:1,overflowY:'auto'}}>
          {HORAS.map(hora => {
            const consultasHora = consultas.filter(c => {
              const h = new Date(c.agendada_para).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})
              return h.startsWith(hora.split(':')[0])
            })
            return (
              <div key={hora} style={{display:'flex',borderBottom:'0.5px solid rgba(0,0,0,0.05)',minHeight:'56px'}}>
                <div style={{width:'60px',padding:'8px 12px',fontSize:'11px',color:'#aaa',fontFamily:'monospace',flexShrink:0,paddingTop:'12px'}}>{hora}</div>
                <div style={{flex:1,padding:'6px 12px',display:'flex',flexDirection:'column',gap:'4px'}}>
                  {consultasHora.map(c => (
                    <div key={c.id} onClick={()=>iniciar(c)}
                      style={{background:`${corStatus[c.status] || '#185FA5'}15`,border:`1px solid ${corStatus[c.status]||'#185FA5'}40`,borderLeft:`3px solid ${corStatus[c.status]||'#185FA5'}`,borderRadius:'6px',padding:'6px 10px',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
                      <div>
                        <div style={{fontSize:'12px',fontWeight:'500',color:'#042C53'}}>{c.paciente_nome}</div>
                        <div style={{fontSize:'10px',color:'#888'}}>{c.tipo} · {new Date(c.agendada_para).toLocaleTimeString('pt-BR',{hour:'2-digit',minute:'2-digit'})}</div>
                      </div>
                      <span style={{fontSize:'10px',fontWeight:'500',color:corStatus[c.status]||'#185FA5',background:'white',padding:'2px 8px',borderRadius:'20px'}}>
                        {c.status==='em_andamento'?'▶ Continuar':'▶ Iniciar'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL */}
      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div style={{background:'white',borderRadius:'14px',padding:'28px',width:'100%',maxWidth:'440px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{fontSize:'16px',fontWeight:'500'}}>
                Agendar — {new Date(ano,mes,diaSel).toLocaleDateString('pt-BR',{day:'numeric',month:'long'})}
              </h2>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',fontSize:'22px',cursor:'pointer',color:'#aaa'}}>×</button>
            </div>
            <form onSubmit={agendar}>
              <div style={{marginBottom:'14px'}}>
                <label style={{display:'block',fontSize:'11px',fontWeight:'500',color:'#666',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.04em'}}>Paciente *</label>
                <select value={form.paciente_id} onChange={e=>setForm(f=>({...f,paciente_id:e.target.value}))} required style={inp}>
                  <option value="">Selecione o paciente</option>
                  {pacientes.map(p=><option key={p.id} value={p.id}>{p.nome} — {p.cpf}</option>)}
                </select>
              </div>
              <div style={{marginBottom:'14px'}}>
                <label style={{display:'block',fontSize:'11px',fontWeight:'500',color:'#666',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.04em'}}>Horário *</label>
                <select value={form.hora} onChange={e=>setForm(f=>({...f,hora:e.target.value}))} style={inp}>
                  {HORAS.map(h=><option key={h} value={h}>{h}</option>)}
                </select>
              </div>
              <div style={{marginBottom:'20px'}}>
                <label style={{display:'block',fontSize:'11px',fontWeight:'500',color:'#666',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.04em'}}>Tipo</label>
                <select value={form.tipo} onChange={e=>setForm(f=>({...f,tipo:e.target.value}))} style={inp}>
                  <option value="teleconsulta">Teleconsulta</option>
                  <option value="presencial">Presencial</option>
                  <option value="retorno">Retorno</option>
                </select>
              </div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:'8px'}}>
                <button type="button" onClick={()=>setModal(false)} style={{padding:'9px 16px',border:'0.5px solid rgba(0,0,0,0.25)',borderRadius:'8px',background:'transparent',cursor:'pointer',fontSize:'13px'}}>Cancelar</button>
                <button type="submit" disabled={saving} style={{padding:'9px 16px',background:saving?'#999':'#185FA5',color:'white',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>
                  {saving?'Agendando...':'Agendar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div style={{position:'fixed',bottom:'24px',right:'24px',background:'#1D9E75',color:'white',padding:'12px 20px',borderRadius:'10px',fontSize:'13px',fontWeight:'500',zIndex:200}}>{toast}</div>}
    </div>
  )
}
