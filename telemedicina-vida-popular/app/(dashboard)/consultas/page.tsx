'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Consulta { id:string; paciente_nome:string; agendada_para:string; status:string; tipo:string; sala_id:string }
interface Paciente { id:string; nome:string; cpf:string }

export default function ConsultasPage() {
  const router = useRouter()
  const [lista, setLista] = useState<Consulta[]>([])
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ paciente_id:'', agendada_para:'', tipo:'teleconsulta' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const [data, setData] = useState(new Date().toISOString().split('T')[0])

  const token = () => localStorage.getItem('token')

  async function load(d = data) {
    const r = await fetch(`/api/consultas?data=${d}`, { headers:{ Authorization:`Bearer ${token()}` } })
    const j = await r.json(); setLista(j.data || [])
  }

  async function loadPacientes() {
    const r = await fetch('/api/pacientes?limit=200', { headers:{ Authorization:`Bearer ${token()}` } })
    const j = await r.json(); setPacientes(j.data || [])
  }

  useEffect(() => { load(); loadPacientes() }, [])

  async function agendar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const r = await fetch('/api/consultas', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${token()}`},
      body: JSON.stringify(form)
    })
    const j = await r.json(); setSaving(false)
    if (!r.ok) { setToast(j.error || 'Erro ao agendar'); setTimeout(()=>setToast(''),3000); return }
    setModal(false)
    setForm({ paciente_id:'', agendada_para:'', tipo:'teleconsulta' })
    setToast('Consulta agendada!')
    setTimeout(()=>setToast(''),3000)
    load()
  }

  async function iniciar(c: Consulta) {
    await fetch(`/api/consultas/${c.id}`, {
      method:'PATCH',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${token()}`},
      body: JSON.stringify({ status:'em_andamento' })
    })
    router.push(`/consulta/${c.id}`)
  }

  const cores: Record<string,{bg:string;cor:string}> = {
    agendada:     { bg:'#FAEEDA', cor:'#633806' },
    aguardando:   { bg:'#E6F1FB', cor:'#0C447C' },
    em_andamento: { bg:'#E1F5EE', cor:'#085041' },
    encerrada:    { bg:'#F1EFE8', cor:'#5F5E5A' },
    cancelada:    { bg:'#FAECE7', cor:'#D85A30' },
  }

  const inp = { width:'100%',padding:'9px 12px',border:'0.5px solid rgba(0,0,0,0.25)',borderRadius:'8px',fontSize:'13px',background:'white' }

  return (
    <div style={{padding:'24px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
        <h1 style={{fontSize:'18px',fontWeight:'500',color:'#042C53'}}>Teleconsultas</h1>
        <div style={{display:'flex',gap:'10px',alignItems:'center'}}>
          <input type="date" value={data} onChange={e=>{setData(e.target.value);load(e.target.value)}}
            style={{...inp,width:'auto',fontSize:'12px'}} />
          <button onClick={()=>setModal(true)} style={{background:'#185FA5',color:'white',border:'none',borderRadius:'8px',padding:'9px 16px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>+ Nova consulta</button>
        </div>
      </div>

      <div style={{background:'white',borderRadius:'12px',border:'0.5px solid rgba(0,0,0,0.1)',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
          <thead>
            <tr style={{background:'#f8f8f6'}}>
              {['Paciente','Horário','Tipo','Status','Sala','Ação'].map(h=>(
                <th key={h} style={{textAlign:'left',padding:'10px 16px',fontSize:'10px',fontWeight:'600',color:'#888',textTransform:'uppercase',letterSpacing:'0.06em'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.map(c => {
              const cor = cores[c.status] || cores.agendada
              return (
                <tr key={c.id} style={{borderTop:'0.5px solid rgba(0,0,0,0.06)'}}>
                  <td style={{padding:'12px 16px',fontWeight:'500'}}>{c.paciente_nome}</td>
                  <td style={{padding:'12px 16px',fontFamily:'monospace',fontSize:'12px',color:'#666'}}>
                    {new Date(c.agendada_para).toLocaleString('pt-BR',{day:'2-digit',month:'2-digit',hour:'2-digit',minute:'2-digit'})}
                  </td>
                  <td style={{padding:'12px 16px'}}><span style={{background:'#E6F1FB',color:'#0C447C',fontSize:'10px',padding:'3px 8px',borderRadius:'20px',fontWeight:'500'}}>{c.tipo}</span></td>
                  <td style={{padding:'12px 16px'}}><span style={{background:cor.bg,color:cor.cor,fontSize:'10px',padding:'3px 8px',borderRadius:'20px',fontWeight:'500'}}>{c.status.replace('_',' ')}</span></td>
                  <td style={{padding:'12px 16px',fontFamily:'monospace',fontSize:'11px',color:'#aaa'}}>{c.sala_id}</td>
                  <td style={{padding:'12px 16px'}}>
                    {c.status === 'encerrada' ? (
                      <a href={`/prontuario/${c.id}`} style={{color:'#888',fontSize:'12px',textDecoration:'none'}}>Ver prontuário →</a>
                    ) : (
                      <button onClick={()=>iniciar(c)} style={{background:'#185FA5',color:'white',border:'none',borderRadius:'6px',padding:'6px 12px',fontSize:'11px',fontWeight:'500',cursor:'pointer'}}>
                        {c.status==='em_andamento'?'▶ Continuar':'▶ Iniciar'}
                      </button>
                    )}
                  </td>
                </tr>
              )
            })}
            {lista.length===0 && <tr><td colSpan={6} style={{padding:'40px',textAlign:'center',color:'#aaa',fontSize:'13px'}}>Nenhuma consulta para esta data</td></tr>}
          </tbody>
        </table>
      </div>

      {/* MODAL NOVA CONSULTA */}
      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div style={{background:'white',borderRadius:'14px',padding:'28px',width:'100%',maxWidth:'440px'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{fontSize:'16px',fontWeight:'500'}}>Agendar teleconsulta</h2>
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
                <label style={{display:'block',fontSize:'11px',fontWeight:'500',color:'#666',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.04em'}}>Data e horário *</label>
                <input type="datetime-local" value={form.agendada_para} onChange={e=>setForm(f=>({...f,agendada_para:e.target.value}))} required style={inp} />
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
                  {saving?'Agendando...':'Agendar consulta'}
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
