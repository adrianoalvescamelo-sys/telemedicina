'use client'
import { useEffect, useState } from 'react'

interface Prontuario { id:string; criado_em:string; queixa_principal:string; medico_nome:string; agendada_para:string; diagnosticos:{cid:string;descricao:string}[] }
interface Paciente { id:string; nome:string; cpf:string }

export default function ProntuariosPage() {
  const [pacientes, setPacientes] = useState<Paciente[]>([])
  const [selecionado, setSelecionado] = useState<Paciente|null>(null)
  const [pronts, setPronts] = useState<Prontuario[]>([])
  const [q, setQ] = useState('')
  const token = () => localStorage.getItem('token')

  useEffect(() => {
    fetch(`/api/pacientes?q=${q}`, { headers:{Authorization:`Bearer ${token()}`} })
      .then(r=>r.json()).then(j=>setPacientes(j.data||[]))
  }, [q])

  async function selecionarPaciente(p: Paciente) {
    setSelecionado(p)
    const r = await fetch(`/api/prontuarios?paciente_id=${p.id}`, { headers:{Authorization:`Bearer ${token()}`} })
    const j = await r.json()
    setPronts(j.data||[])
  }

  return (
    <div style={{padding:'24px'}}>
      <h1 style={{fontSize:'18px',fontWeight:'500',color:'#042C53',marginBottom:'20px'}}>Prontuários</h1>
      <div style={{display:'grid',gridTemplateColumns:'280px 1fr',gap:'20px'}}>
        <div style={{background:'white',borderRadius:'12px',border:'0.5px solid rgba(0,0,0,0.1)',overflow:'hidden'}}>
          <div style={{padding:'12px',borderBottom:'0.5px solid rgba(0,0,0,0.08)'}}>
            <input value={q} onChange={e=>setQ(e.target.value)} placeholder="Buscar paciente..." style={{width:'100%',padding:'8px 10px',border:'0.5px solid rgba(0,0,0,0.2)',borderRadius:'8px',fontSize:'12px',fontFamily:'inherit'}} />
          </div>
          <div style={{maxHeight:'calc(100vh - 220px)',overflowY:'auto'}}>
            {pacientes.map(p=>(
              <div key={p.id} onClick={()=>selecionarPaciente(p)}
                style={{padding:'12px 14px',cursor:'pointer',borderBottom:'0.5px solid rgba(0,0,0,0.06)',background:selecionado?.id===p.id?'#E6F1FB':'transparent'}}>
                <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                  <div style={{width:'28px',height:'28px',borderRadius:'50%',background:'#E1F5EE',color:'#085041',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'10px',fontWeight:'600',flexShrink:0}}>
                    {p.nome.split(' ').map((n:string)=>n[0]).slice(0,2).join('')}
                  </div>
                  <div>
                    <div style={{fontSize:'12px',fontWeight:'500',color:'#042C53'}}>{p.nome}</div>
                    <div style={{fontSize:'10px',color:'#aaa',fontFamily:'monospace'}}>{p.cpf}</div>
                  </div>
                </div>
              </div>
            ))}
            {pacientes.length===0&&<div style={{padding:'24px',textAlign:'center',color:'#ccc',fontSize:'12px'}}>Nenhum paciente</div>}
          </div>
        </div>
        <div>
          {!selecionado ? (
            <div style={{background:'white',borderRadius:'12px',border:'0.5px solid rgba(0,0,0,0.1)',padding:'60px',textAlign:'center',color:'#ccc',fontSize:'13px'}}>← Selecione um paciente para ver os prontuários</div>
          ) : (
            <div>
              <div style={{background:'#E6F1FB',borderRadius:'10px',padding:'14px 18px',marginBottom:'16px',fontSize:'14px',fontWeight:'500',color:'#042C53'}}>
                {selecionado.nome} — {pronts.length} prontuário(s)
              </div>
              {pronts.length===0&&<div style={{background:'white',borderRadius:'12px',border:'0.5px solid rgba(0,0,0,0.1)',padding:'40px',textAlign:'center',color:'#ccc',fontSize:'13px'}}>Nenhum prontuário encontrado</div>}
              {pronts.map(pr=>(
                <div key={pr.id} style={{background:'white',borderRadius:'12px',border:'0.5px solid rgba(0,0,0,0.1)',padding:'18px',marginBottom:'12px'}}>
                  <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:'10px'}}>
                    <div>
                      <div style={{fontSize:'13px',fontWeight:'500',color:'#042C53'}}>{new Date(pr.agendada_para).toLocaleDateString('pt-BR',{day:'2-digit',month:'long',year:'numeric'})}</div>
                      <div style={{fontSize:'11px',color:'#888',marginTop:'2px'}}>{pr.medico_nome}</div>
                    </div>
                    <a href={`/prontuario/${pr.id}`} style={{color:'#185FA5',fontSize:'12px',textDecoration:'none',fontWeight:'500'}}>Abrir →</a>
                  </div>
                  {pr.queixa_principal&&<div style={{fontSize:'12px',color:'#444',marginBottom:'8px',lineHeight:'1.5'}}>{pr.queixa_principal}</div>}
                  <div style={{display:'flex',flexWrap:'wrap',gap:'4px'}}>
                    {(pr.diagnosticos||[]).map((d,i)=>(
                      <span key={i} style={{background:'#E6F1FB',color:'#0C447C',fontSize:'10px',padding:'3px 8px',borderRadius:'20px',fontFamily:'monospace',fontWeight:'500'}}>{d.cid} — {d.descricao}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
