'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'

interface Diagnostico { cid:string; descricao:string; tipo:string }

export default function ProntuarioPage() {
  const { id } = useParams()
  const [pront, setPront] = useState<Record<string,unknown>>({})
  const [form, setForm] = useState({ queixa_principal:'', hda:'', antecedentes:'', medicamentos_uso:'', alergias:'', exame_fisico:'', prescricao:'', exames_solicitados:'' })
  const [diags, setDiags] = useState<Diagnostico[]>([])
  const [novoDiag, setNovoDiag] = useState('')
  const [saving, setSaving] = useState(false)
  const [copied, setCopied] = useState(false)
  const [toast, setToast] = useState('')

  const token = () => localStorage.getItem('token')

  useEffect(() => {
    fetch(`/api/prontuarios?consulta_id=${id}`, { headers:{Authorization:`Bearer ${token()}`} })
      .then(r=>r.json()).then(j => {
        const d = j.data
        if (d) {
          setPront(d)
          setForm({
            queixa_principal: d.queixa_principal||'',
            hda: d.hda||'',
            antecedentes: d.antecedentes||'',
            medicamentos_uso: d.medicamentos_uso||'',
            alergias: d.alergias||'',
            exame_fisico: d.exame_fisico||'',
            prescricao: d.prescricao||'',
            exames_solicitados: d.exames_solicitados||'',
          })
          setDiags((d.diagnosticos as Diagnostico[]) || [])
        }
        // Pré-popula sugestões da IA como diagnósticos se não houver diags
        if ((!d?.diagnosticos || d.diagnosticos.length === 0) && d?.sugestoes_ia?.length > 0) {
          const sugs = (d.sugestoes_ia as Array<{nome:string;cid:string}>) || []
          setDiags(sugs.slice(0,2).map(s=>({ cid:s.cid, descricao:s.nome, tipo:'principal' })))
        }
      })
  }, [id])

  async function salvar() {
    setSaving(true)
    const r = await fetch('/api/prontuarios', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${token()}`},
      body: JSON.stringify({
        consulta_id: id,
        paciente_id: pront.paciente_id,
        ...form,
        diagnosticos: diags,
        transcricao: pront.transcricao,
        sugestoes_ia: pront.sugestoes_ia,
      })
    })
    setSaving(false)
    if (r.ok) { setToast('Prontuário salvo!'); setTimeout(()=>setToast(''),3000) }
  }

  function copiarProntuario() {
    const data = new Date().toLocaleDateString('pt-BR')
    const txt = [
      `PRONTUÁRIO — ${pront.paciente_nome || ''}`,
      `Data: ${data} | Médica: ${pront.medico_nome || ''} | CRM: ${pront.medico_crm || ''}`,
      `Clínica Vida Popular — Sinop, MT`,
      '',
      form.queixa_principal ? `QUEIXA PRINCIPAL:\n${form.queixa_principal}` : '',
      form.hda ? `\nHISTÓRIA DA DOENÇA ATUAL:\n${form.hda}` : '',
      form.antecedentes ? `\nANTECEDENTES:\n${form.antecedentes}` : '',
      form.medicamentos_uso ? `\nMEDICAMENTOS EM USO:\n${form.medicamentos_uso}` : '',
      form.alergias ? `\nALERGIAS:\n${form.alergias}` : '',
      form.exame_fisico ? `\nEXAME FÍSICO:\n${form.exame_fisico}` : '',
      diags.length > 0 ? `\nDIAGNÓSTICOS (CID-10):\n${diags.map(d=>`• ${d.cid} — ${d.descricao} (${d.tipo})`).join('\n')}` : '',
      form.prescricao ? `\nPRESCRIÇÃO / CONDUTA:\n${form.prescricao}` : '',
      form.exames_solicitados ? `\nEXAMES SOLICITADOS:\n${form.exames_solicitados}` : '',
      pront.transcricao ? `\nTRANSCRIÇÃO DA CONSULTA:\n${pront.transcricao}` : '',
    ].filter(Boolean).join('\n')

    navigator.clipboard.writeText(txt).then(() => {
      setCopied(true)
      setToast('Prontuário copiado!')
      setTimeout(() => { setCopied(false); setToast('') }, 3000)
    })
  }

  function addDiag() {
    const match = novoDiag.match(/^([A-Z]\d{2}(?:\.\d+)?)\s*[—\-]?\s*(.+)$/)
    if (!match) { setToast('Formato: CID — Descrição'); setTimeout(()=>setToast(''),2000); return }
    setDiags(d => [...d, { cid:match[1], descricao:match[2].trim(), tipo:'principal' }])
    setNovoDiag('')
  }

  const ta = (rows=2) => ({ width:'100%',padding:'9px 12px',border:'0.5px solid rgba(0,0,0,0.2)',borderRadius:'8px',fontSize:'13px',resize:'vertical' as const,minHeight:`${rows*24+18}px`,fontFamily:'inherit',background:'white',color:'inherit' })
  const inp = { width:'100%',padding:'9px 12px',border:'0.5px solid rgba(0,0,0,0.2)',borderRadius:'8px',fontSize:'13px',fontFamily:'inherit',background:'white' }

  return (
    <div style={{padding:'24px'}}>
      {/* HEADER */}
      <div style={{background:'#E6F1FB',borderRadius:'12px',padding:'16px 20px',marginBottom:'20px',display:'flex',alignItems:'center',gap:'12px'}}>
        <div style={{width:'44px',height:'44px',borderRadius:'50%',background:'#B5D4F4',color:'#0C447C',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'14px',fontWeight:'600',flexShrink:0}}>
          {(pront.paciente_nome as string)?.split(' ').map((n:string)=>n[0]).slice(0,2).join('')}
        </div>
        <div style={{flex:1}}>
          <div style={{fontWeight:'500',fontSize:'15px',color:'#042C53'}}>{pront.paciente_nome as string}</div>
          <div style={{fontSize:'12px',color:'#378ADD'}}>
            {pront.data_nasc ? `${Math.floor((Date.now()-new Date(pront.data_nasc as string).getTime())/31536000000)} anos` : ''}
            {pront.medico_nome ? ` · ${pront.medico_nome}` : ''}
            {pront.medico_crm ? ` · CRM ${pront.medico_crm}` : ''}
          </div>
        </div>
        <div style={{display:'flex',gap:'8px'}}>
          <button onClick={copiarProntuario} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',background:copied?'#EAF3DE':'white',border:`0.5px solid ${copied?'#639922':'#B5D4F4'}`,borderRadius:'8px',cursor:'pointer',fontSize:'12px',fontWeight:'500',color:copied?'#3B6D11':'#0C447C'}}>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
            {copied?'Copiado!':'Copiar'}
          </button>
          <a href={`/receituario/${id}`} style={{display:'flex',alignItems:'center',gap:'6px',padding:'8px 14px',background:'white',border:'0.5px solid #B5D4F4',borderRadius:'8px',textDecoration:'none',fontSize:'12px',fontWeight:'500',color:'#0C447C'}}>
            🖨️ Receituário / PDF
          </a>
          <button onClick={salvar} disabled={saving} style={{padding:'8px 16px',background:saving?'#999':'#185FA5',color:'white',border:'none',borderRadius:'8px',fontSize:'12px',fontWeight:'500',cursor:'pointer'}}>
            {saving?'Salvando...':'Salvar'}
          </button>
        </div>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'20px'}}>
        <div>
          {[
            ['Queixa principal','queixa_principal',2],
            ['História da doença atual (HDA)','hda',4],
            ['Antecedentes pessoais e familiares','antecedentes',2],
            ['Medicamentos em uso','medicamentos_uso',2],
            ['Alergias','alergias',1],
            ['Exame físico','exame_fisico',3],
          ].map(([label,field,rows]) => (
            <div key={field as string} style={{marginBottom:'16px'}}>
              <label style={{display:'block',fontSize:'10px',fontWeight:'600',color:'#888',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</label>
              <textarea value={(form as Record<string,string>)[field as string]}
                onChange={e=>setForm(f=>({...f,[field as string]:e.target.value}))}
                style={ta(rows as number)}
              />
            </div>
          ))}
        </div>

        <div>
          {/* DIAGNÓSTICOS */}
          <div style={{marginBottom:'16px'}}>
            <label style={{display:'block',fontSize:'10px',fontWeight:'600',color:'#888',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.06em'}}>Diagnósticos (CID-10)</label>
            <div style={{marginBottom:'8px'}}>
              {diags.map((d,i) => (
                <div key={i} style={{display:'inline-flex',alignItems:'center',gap:'4px',background:'#F1EFE8',border:'0.5px solid rgba(0,0,0,0.12)',padding:'4px 10px',borderRadius:'20px',fontSize:'11px',margin:'3px',fontFamily:'monospace'}}>
                  <span style={{fontWeight:'600',color:'#185FA5'}}>{d.cid}</span>
                  <span style={{color:'#444',fontFamily:'inherit'}}> — {d.descricao}</span>
                  <span onClick={()=>setDiags(ds=>ds.filter((_,j)=>j!==i))} style={{cursor:'pointer',color:'#D85A30',fontSize:'14px',lineHeight:'1',marginLeft:'2px'}}>×</span>
                </div>
              ))}
            </div>
            <div style={{display:'flex',gap:'8px'}}>
              <input value={novoDiag} onChange={e=>setNovoDiag(e.target.value)}
                onKeyDown={e=>e.key==='Enter'&&addDiag()}
                placeholder="Ex: I10 — Hipertensão arterial" style={{...inp,flex:1,fontSize:'12px'}}/>
              <button onClick={addDiag} style={{padding:'9px 12px',background:'#185FA5',color:'white',border:'none',borderRadius:'8px',cursor:'pointer',fontSize:'12px',fontWeight:'500',whiteSpace:'nowrap'}}>+ Adicionar</button>
            </div>
          </div>

          {[
            ['Prescrição / Conduta','prescricao',5],
            ['Exames solicitados','exames_solicitados',2],
          ].map(([label,field,rows]) => (
            <div key={field as string} style={{marginBottom:'16px'}}>
              <label style={{display:'block',fontSize:'10px',fontWeight:'600',color:'#888',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.06em'}}>{label}</label>
              <textarea value={(form as Record<string,string>)[field as string]}
                onChange={e=>setForm(f=>({...f,[field as string]:e.target.value}))}
                style={ta(rows as number)}
              />
            </div>
          ))}

          {/* TRANSCRIÇÃO */}
          {pront.transcricao && (
            <div style={{marginBottom:'16px'}}>
              <label style={{display:'block',fontSize:'10px',fontWeight:'600',color:'#888',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.06em'}}>Transcrição da consulta</label>
              <div style={{background:'#E6F1FB',borderRadius:'8px',padding:'12px',fontSize:'11px',lineHeight:'1.8',color:'#0C447C',maxHeight:'180px',overflowY:'auto'}}>
                {(pront.transcricao as string).split('\n').map((linha,i)=>(
                  <div key={i}>{linha}</div>
                ))}
              </div>
            </div>
          )}

          {/* SUGESTÕES IA */}
          {(pront.sugestoes_ia as unknown[])?.length > 0 && (
            <div>
              <label style={{display:'block',fontSize:'10px',fontWeight:'600',color:'#888',marginBottom:'8px',textTransform:'uppercase',letterSpacing:'0.06em'}}>Sugestões da IA (referência)</label>
              {(pront.sugestoes_ia as Array<{nome:string;cid:string;confianca:number;conduta_sugerida:string}>).map((s,i)=>(
                <div key={i} style={{background:'#EEEDFE',borderRadius:'8px',padding:'10px',marginBottom:'6px'}}>
                  <div style={{fontSize:'12px',fontWeight:'500',color:'#3C3489'}}>{s.nome} <span style={{fontSize:'9px',fontFamily:'monospace',fontWeight:'400'}}>CID: {s.cid}</span></div>
                  <div style={{fontSize:'11px',color:'#534AB7',marginTop:'3px'}}>{s.conduta_sugerida}</div>
                  <div style={{fontSize:'10px',color:'#7F77DD',marginTop:'2px'}}>Confiança: {Math.round(s.confianca*100)}%</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {toast && <div style={{position:'fixed',bottom:'24px',right:'24px',background:'#1D9E75',color:'white',padding:'12px 20px',borderRadius:'10px',fontSize:'13px',fontWeight:'500',zIndex:200,boxShadow:'0 4px 16px rgba(0,0,0,0.15)'}}>{toast}</div>}
    </div>
  )
}
