'use client'
import { useEffect, useState } from 'react'

interface Stats { total_hoje: number; em_andamento: number; aguardando: number; total_pacientes: number }
interface Consulta { id: string; paciente_nome: string; agendada_para: string; status: string; tipo: string }

export default function DashboardPage() {
  const [consultas, setConsultas] = useState<Consulta[]>([])
  const [medico, setMedico] = useState<{nome:string;crm:string}>({nome:'',crm:''})

  useEffect(() => {
    const m = localStorage.getItem('medico')
    if (m) setMedico(JSON.parse(m))
    const token = localStorage.getItem('token')
    fetch('/api/consultas', { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.json()).then(j => setConsultas(j.data || []))
  }, [])

  const hoje = new Date().toLocaleDateString('pt-BR', { weekday:'long', day:'numeric', month:'long' })

  return (
    <div style={{padding:'24px'}}>
      <div style={{marginBottom:'24px'}}>
        <h1 style={{fontSize:'20px',fontWeight:'500',color:'#042C53'}}>Bom dia, {medico.nome.split(' ').slice(0,2).join(' ')} 👋</h1>
        <p style={{fontSize:'13px',color:'#888',marginTop:'2px',textTransform:'capitalize'}}>{hoje}</p>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:'12px',marginBottom:'24px'}}>
        {[
          { label:'Consultas hoje',   value: consultas.length, cor:'#185FA5' },
          { label:'Aguardando',       value: consultas.filter(c=>c.status==='agendada').length, cor:'#BA7517' },
          { label:'Em andamento',     value: consultas.filter(c=>c.status==='em_andamento').length, cor:'#1D9E75' },
          { label:'Encerradas hoje',  value: consultas.filter(c=>c.status==='encerrada').length, cor:'#5F5E5A' },
        ].map(s => (
          <div key={s.label} style={{background:'white',borderRadius:'12px',padding:'16px',border:'0.5px solid rgba(0,0,0,0.1)'}}>
            <div style={{fontSize:'11px',color:'#888',marginBottom:'6px',textTransform:'uppercase',letterSpacing:'0.05em'}}>{s.label}</div>
            <div style={{fontSize:'28px',fontWeight:'500',color:s.cor}}>{s.value}</div>
          </div>
        ))}
      </div>

      <div style={{background:'white',borderRadius:'12px',border:'0.5px solid rgba(0,0,0,0.1)',overflow:'hidden'}}>
        <div style={{padding:'16px 20px',borderBottom:'0.5px solid rgba(0,0,0,0.08)',display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <span style={{fontSize:'13px',fontWeight:'500'}}>Agenda de hoje</span>
          <a href="/consultas" style={{fontSize:'12px',color:'#185FA5',textDecoration:'none'}}>Ver todas →</a>
        </div>
        {consultas.length === 0 ? (
          <div style={{padding:'40px',textAlign:'center',color:'#aaa',fontSize:'13px'}}>Nenhuma consulta agendada para hoje</div>
        ) : (
          <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
            <thead>
              <tr style={{background:'#f8f8f6'}}>
                {['Paciente','Horário','Tipo','Status',''].map(h => (
                  <th key={h} style={{textAlign:'left',padding:'10px 20px',fontSize:'10px',fontWeight:'600',color:'#888',textTransform:'uppercase',letterSpacing:'0.06em'}}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {consultas.map(c => (
                <tr key={c.id} style={{borderTop:'0.5px solid rgba(0,0,0,0.06)'}}>
                  <td style={{padding:'12px 20px',fontWeight:'500'}}>{c.paciente_nome}</td>
                  <td style={{padding:'12px 20px',fontFamily:'monospace',fontSize:'12px'}}>
                    {new Date(c.agendada_para).toLocaleTimeString('pt-BR', {hour:'2-digit',minute:'2-digit'})}
                  </td>
                  <td style={{padding:'12px 20px'}}>
                    <span style={{background:'#E6F1FB',color:'#0C447C',fontSize:'10px',fontWeight:'500',padding:'3px 10px',borderRadius:'20px'}}>{c.tipo}</span>
                  </td>
                  <td style={{padding:'12px 20px'}}>
                    <span style={{
                      background: c.status==='em_andamento'?'#E1F5EE':c.status==='encerrada'?'#F1EFE8':'#FAEEDA',
                      color: c.status==='em_andamento'?'#085041':c.status==='encerrada'?'#5F5E5A':'#633806',
                      fontSize:'10px',fontWeight:'500',padding:'3px 10px',borderRadius:'20px'
                    }}>{c.status.replace('_',' ')}</span>
                  </td>
                  <td style={{padding:'12px 20px'}}>
                    <a href={`/consulta/${c.id}`} style={{color:'#185FA5',fontSize:'12px',textDecoration:'none',fontWeight:'500'}}>Iniciar →</a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
