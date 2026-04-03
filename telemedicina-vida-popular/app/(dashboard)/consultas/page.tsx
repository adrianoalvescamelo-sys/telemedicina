'use client'
import { useEffect, useState } from 'react'
interface Consulta { id:string; paciente_nome:string; agendada_para:string; status:string; tipo:string; sala_id:string }

export default function ConsultasPage() {
  const [lista, setLista] = useState<Consulta[]>([])
  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch('/api/consultas', { headers:{ Authorization:`Bearer ${token}` } })
      .then(r=>r.json()).then(j=>setLista(j.data||[]))
  }, [])

  const cores: Record<string,{bg:string;cor:string}> = {
    agendada:      { bg:'#FAEEDA', cor:'#633806' },
    aguardando:    { bg:'#E6F1FB', cor:'#0C447C' },
    em_andamento:  { bg:'#E1F5EE', cor:'#085041' },
    encerrada:     { bg:'#F1EFE8', cor:'#5F5E5A' },
    cancelada:     { bg:'#FAECE7', cor:'#D85A30' },
  }

  return (
    <div style={{padding:'24px'}}>
      <h1 style={{fontSize:'18px',fontWeight:'500',color:'#042C53',marginBottom:'20px'}}>Teleconsultas</h1>
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
                    <a href={`/consulta/${c.id}`} style={{color:'#185FA5',fontSize:'12px',textDecoration:'none',fontWeight:'500'}}>
                      {c.status==='em_andamento'?'Continuar →':'Iniciar →'}
                    </a>
                  </td>
                </tr>
              )
            })}
            {lista.length===0 && <tr><td colSpan={6} style={{padding:'40px',textAlign:'center',color:'#aaa',fontSize:'13px'}}>Nenhuma consulta encontrada</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
