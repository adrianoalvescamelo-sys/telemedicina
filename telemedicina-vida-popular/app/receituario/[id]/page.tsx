'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Pront {
  paciente_nome: string
  data_nasc: string
  medico_nome: string
  medico_crm: string
  especialidade: string
  prescricao: string
  diagnosticos: Array<{cid:string;descricao:string;tipo:string}>
  exames_solicitados: string
  queixa_principal: string
  criado_em: string
}

export default function ReceituarioPage() {
  const { id } = useParams()
  const [pront, setPront] = useState<Pront | null>(null)
  const [tipo, setTipo] = useState<'receita'|'atestado'|'exames'>('receita')
  const [diasAtestado, setDiasAtestado] = useState('1')

  useEffect(() => {
    const token = localStorage.getItem('token')
    fetch(`/api/prontuarios?consulta_id=${id}`, { headers:{ Authorization:`Bearer ${token}` } })
      .then(r=>r.json()).then(j=>setPront(j.data))
  }, [id])

  if (!pront) return <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'100vh',color:'#888'}}>Carregando...</div>

  const dataConsulta = new Date(pront.criado_em).toLocaleDateString('pt-BR',{day:'numeric',month:'long',year:'numeric'})
  const idade = pront.data_nasc ? Math.floor((Date.now()-new Date(pront.data_nasc).getTime())/31536000000) : ''

  return (
    <div style={{minHeight:'100vh',background:'#f5f5f0',padding:'24px'}}>
      {/* CONTROLES (não imprimem) */}
      <div className="no-print" style={{maxWidth:'700px',margin:'0 auto 20px',display:'flex',gap:'10px',alignItems:'center',flexWrap:'wrap'}}>
        <a href={`/prontuario/${id}`} style={{color:'#185FA5',fontSize:'13px',textDecoration:'none',marginRight:'auto'}}>← Voltar ao prontuário</a>
        {(['receita','atestado','exames'] as const).map(t=>(
          <button key={t} onClick={()=>setTipo(t)}
            style={{padding:'8px 16px',borderRadius:'8px',border:'0.5px solid rgba(0,0,0,0.2)',background:tipo===t?'#185FA5':'white',color:tipo===t?'white':'#333',fontSize:'12px',fontWeight:'500',cursor:'pointer',textTransform:'capitalize'}}>
            {t==='receita'?'Receituário':t==='atestado'?'Atestado Médico':'Pedido de Exames'}
          </button>
        ))}
        {tipo==='atestado' && (
          <select value={diasAtestado} onChange={e=>setDiasAtestado(e.target.value)}
            style={{padding:'8px 12px',borderRadius:'8px',border:'0.5px solid rgba(0,0,0,0.2)',fontSize:'12px',background:'white'}}>
            {['1','2','3','5','7','10','15','30'].map(d=><option key={d} value={d}>{d} dia{d!=='1'?'s':''}</option>)}
          </select>
        )}
        <button onClick={()=>window.print()} style={{background:'#1D9E75',color:'white',border:'none',borderRadius:'8px',padding:'8px 16px',fontSize:'12px',fontWeight:'500',cursor:'pointer'}}>
          🖨️ Imprimir / PDF
        </button>
      </div>

      {/* DOCUMENTO */}
      <div id="documento" style={{maxWidth:'700px',margin:'0 auto',background:'white',borderRadius:'12px',boxShadow:'0 2px 20px rgba(0,0,0,0.08)',padding:'48px 56px',fontFamily:'Georgia, serif',color:'#1a1a1a'}}>
        {/* CABEÇALHO */}
        <div style={{borderBottom:'2px solid #042C53',paddingBottom:'20px',marginBottom:'24px',display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
          <div>
            <div style={{fontSize:'20px',fontWeight:'700',color:'#042C53',letterSpacing:'-0.5px'}}>Clínica Vida Popular</div>
            <div style={{fontSize:'12px',color:'#666',marginTop:'3px'}}>Telemedicina · Sinop — MT</div>
            <div style={{fontSize:'11px',color:'#aaa',marginTop:'2px'}}>CNPJ: 00.000.000/0001-00 · CRM-MT</div>
          </div>
          <div style={{textAlign:'right'}}>
            <div style={{fontSize:'13px',fontWeight:'600',color:'#042C53'}}>{pront.medico_nome}</div>
            <div style={{fontSize:'11px',color:'#666'}}>{pront.especialidade}</div>
            <div style={{fontSize:'11px',color:'#888'}}>CRM {pront.medico_crm}</div>
          </div>
        </div>

        {/* TÍTULO */}
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <div style={{fontSize:'16px',fontWeight:'700',color:'#042C53',textTransform:'uppercase',letterSpacing:'2px'}}>
            {tipo==='receita'?'Receituário Médico':tipo==='atestado'?'Atestado Médico':'Pedido de Exames'}
          </div>
          <div style={{fontSize:'11px',color:'#888',marginTop:'4px'}}>{dataConsulta}</div>
        </div>

        {/* PACIENTE */}
        <div style={{background:'#f8f8f6',borderRadius:'8px',padding:'14px 18px',marginBottom:'28px',fontSize:'13px'}}>
          <span style={{color:'#666'}}>Paciente: </span><strong>{pront.paciente_nome}</strong>
          {idade && <><span style={{color:'#aaa',margin:'0 8px'}}>·</span><span style={{color:'#666'}}>{idade} anos</span></>}
        </div>

        {/* CONTEÚDO */}
        {tipo === 'receita' && (
          <div>
            {pront.diagnosticos?.length > 0 && (
              <div style={{marginBottom:'20px'}}>
                <div style={{fontSize:'11px',fontWeight:'700',color:'#888',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'8px'}}>Diagnóstico(s)</div>
                {pront.diagnosticos.map((d,i)=>(
                  <div key={i} style={{fontSize:'13px',marginBottom:'4px'}}>
                    <span style={{fontFamily:'monospace',fontWeight:'600',color:'#185FA5'}}>{d.cid}</span>
                    <span style={{color:'#555',margin:'0 6px'}}>—</span>
                    <span>{d.descricao}</span>
                  </div>
                ))}
              </div>
            )}
            <div style={{marginBottom:'20px'}}>
              <div style={{fontSize:'11px',fontWeight:'700',color:'#888',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'12px'}}>Prescrição</div>
              <div style={{fontSize:'14px',lineHeight:'2',whiteSpace:'pre-wrap',color:'#1a1a1a',minHeight:'120px'}}>
                {pront.prescricao || <span style={{color:'#ccc',fontStyle:'italic'}}>Sem prescrição registrada</span>}
              </div>
            </div>
          </div>
        )}

        {tipo === 'atestado' && (
          <div style={{fontSize:'14px',lineHeight:'2',color:'#1a1a1a',minHeight:'200px'}}>
            <p>Atesto, para os devidos fins, que o(a) paciente <strong>{pront.paciente_nome}</strong>{idade?`, ${idade} anos,`:','} esteve sob meus cuidados médicos na data de {dataConsulta}.</p>
            <br/>
            <p>Em virtude de condições de saúde, o(a) paciente necessita de afastamento de suas atividades pelo período de <strong>{diasAtestado} ({['zero','um','dois','três','quatro','cinco','seis','sete','oito','nove','dez'][Number(diasAtestado)]||diasAtestado}) dia{Number(diasAtestado)!==1?'s':''}</strong>, a contar da presente data.</p>
            <br/>
            {pront.diagnosticos?.length > 0 && (
              <p>CID-10: {pront.diagnosticos.map(d=>`${d.cid} — ${d.descricao}`).join('; ')}</p>
            )}
          </div>
        )}

        {tipo === 'exames' && (
          <div>
            <div style={{fontSize:'11px',fontWeight:'700',color:'#888',textTransform:'uppercase',letterSpacing:'1px',marginBottom:'12px'}}>Exames Solicitados</div>
            <div style={{fontSize:'14px',lineHeight:'2',whiteSpace:'pre-wrap',color:'#1a1a1a',minHeight:'160px'}}>
              {pront.exames_solicitados || <span style={{color:'#ccc',fontStyle:'italic'}}>Sem exames registrados</span>}
            </div>
          </div>
        )}

        {/* ASSINATURA */}
        <div style={{marginTop:'60px',paddingTop:'20px',borderTop:'1px solid #eee',display:'flex',justifyContent:'center'}}>
          <div style={{textAlign:'center'}}>
            <div style={{width:'200px',borderBottom:'1px solid #333',marginBottom:'8px'}}></div>
            <div style={{fontSize:'13px',fontWeight:'600',color:'#042C53'}}>{pront.medico_nome}</div>
            <div style={{fontSize:'11px',color:'#888'}}>CRM {pront.medico_crm} · {pront.especialidade}</div>
            <div style={{fontSize:'11px',color:'#aaa',marginTop:'2px'}}>Sinop — MT, {dataConsulta}</div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          .no-print { display: none !important; }
          body { background: white; }
          #documento { box-shadow: none; border-radius: 0; margin: 0; max-width: 100%; }
        }
      `}</style>
    </div>
  )
}
