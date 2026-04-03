'use client'
import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'

interface Sugestao { nome:string; cid:string; confianca:number; descricao:string; conduta_sugerida:string; alertas?:string[] }
interface Chunk { speaker:string; texto:string; ts:string }

export default function ConsultaPage() {
  const { id } = useParams()
  const router = useRouter()
  const [consulta, setConsulta] = useState<Record<string,string>>({})
  const [transcricao, setTranscricao] = useState<Chunk[]>([])
  const [sugestoes, setSugestoes] = useState<Sugestao[]>([])
  const [resumo, setResumo] = useState('')
  const [alertas, setAlertas] = useState<string[]>([])
  const [gravando, setGravando] = useState(false)
  const [tempoConsulta, setTempoConsulta] = useState(0)
  const [carregandoIA, setCarregandoIA] = useState(false)
  const [toast, setToast] = useState('')

  const mediaRecorderRef = useRef<MediaRecorder|null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout|null>(null)
  const transScrollRef = useRef<HTMLDivElement>(null)
  const token = () => localStorage.getItem('token')

  useEffect(() => {
    fetch(`/api/consultas/${id}`, { headers:{Authorization:`Bearer ${token()}`} })
      .then(r=>r.json()).then(j=>setConsulta(j.data||{}))
  }, [id])

  useEffect(() => {
    if (gravando) {
      timerRef.current = setInterval(() => setTempoConsulta(t => t+1), 1000)
    } else {
      if (timerRef.current) clearInterval(timerRef.current)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [gravando])

  useEffect(() => {
    if (transScrollRef.current) transScrollRef.current.scrollTop = transScrollRef.current.scrollHeight
  }, [transcricao])

  const formatTempo = (s: number) => {
    const m = Math.floor(s/60), sec = s%60
    return `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`
  }

  async function buscarSugestoes(trans: Chunk[]) {
    if (trans.length < 2) return
    setCarregandoIA(true)
    const textoTrans = trans.map(c=>`${c.speaker==='medico'?'Médico':'Paciente'}: ${c.texto}`).join('\n')
    const historico = `Paciente: ${consulta.paciente_nome}. Alergias: ${(consulta.alergias as unknown as string[])?.join(', ')||'Nenhuma conhecida'}`
    try {
      const r = await fetch('/api/ai/sugestoes', {
        method:'POST',
        headers:{'Content-Type':'application/json','Authorization':`Bearer ${token()}`},
        body: JSON.stringify({ transcricao: textoTrans, historico_paciente: historico })
      })
      const j = await r.json()
      if (j.data) {
        setSugestoes(j.data.sugestoes || [])
        setResumo(j.data.resumo_clinico || '')
        setAlertas(j.data.alertas_gerais || [])
      }
    } catch(e) { console.error(e) }
    setCarregandoIA(false)
  }

  async function iniciarGravacao(speaker: 'medico'|'paciente') {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    const mr = new MediaRecorder(stream, { mimeType: 'audio/webm' })
    mediaRecorderRef.current = mr
    chunksRef.current = []
    mr.ondataavailable = e => chunksRef.current.push(e.data)
    mr.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type:'audio/webm' })
      const fd = new FormData()
      fd.append('audio', blob, 'audio.webm')
      fd.append('consulta_id', id as string)
      fd.append('speaker', speaker)
      try {
        const r = await fetch('/api/transcricao', { method:'POST', headers:{Authorization:`Bearer ${token()}`}, body:fd })
        const j = await r.json()
        if (j.data?.texto) {
          const novoChunk = { speaker, texto: j.data.texto, ts: new Date().toISOString() }
          setTranscricao(prev => {
            const novo = [...prev, novoChunk]
            // A cada 4 chunks, pede sugestões da IA
            if (novo.length % 4 === 0) buscarSugestoes(novo)
            return novo
          })
        }
      } catch(e) { console.error(e) }
      stream.getTracks().forEach(t => t.stop())
    }
    mr.start()
    setGravando(true)
  }

  function pararGravacao() {
    mediaRecorderRef.current?.stop()
    setGravando(false)
  }

  async function encerrarConsulta() {
    pararGravacao()
    const textoTrans = transcricao.map(c=>`${c.speaker==='medico'?'Médico':'Paciente'}: ${c.texto}`).join('\n')
    // Salva no prontuário
    await fetch('/api/prontuarios', {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${token()}`},
      body: JSON.stringify({
        consulta_id: id,
        paciente_id: consulta.paciente_id,
        transcricao: textoTrans,
        sugestoes_ia: sugestoes,
      })
    })
    await fetch(`/api/consultas/${id}`, {
      method:'PATCH',
      headers:{'Content-Type':'application/json','Authorization':`Bearer ${token()}`},
      body: JSON.stringify({ status:'encerrada' })
    })
    router.push(`/prontuario/${id}`)
  }

  const confColor = (c: number) => c >= 0.85 ? '#185FA5' : c >= 0.6 ? '#BA7517' : '#D85A30'
  const confBg = (c: number) => c >= 0.85 ? '#E6F1FB' : c >= 0.6 ? '#FAEEDA' : '#FAECE7'

  return (
    <div style={{padding:'20px',height:'calc(100vh - 0px)',overflow:'hidden',display:'flex',flexDirection:'column'}}>
      {/* HEADER */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'16px',flexShrink:0}}>
        <div>
          <h1 style={{fontSize:'16px',fontWeight:'500',color:'#042C53'}}>{consulta.paciente_nome}</h1>
          <p style={{fontSize:'12px',color:'#888'}}>
            Consulta iniciada · {formatTempo(tempoConsulta)}
            {consulta.alergias && (consulta.alergias as unknown as string[]).length > 0 && <span style={{marginLeft:'8px',background:'#FAECE7',color:'#D85A30',padding:'2px 8px',borderRadius:'20px',fontSize:'10px'}}>⚠ Alergias: {(consulta.alergias as unknown as string[]).join(', ')}</span>}
          </p>
        </div>
        <button onClick={encerrarConsulta} style={{background:'#c0392b',color:'white',border:'none',borderRadius:'8px',padding:'9px 16px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>Encerrar consulta</button>
      </div>

      <div style={{display:'grid',gridTemplateColumns:'1fr 340px',gap:'16px',flex:1,minHeight:0}}>
        {/* VIDEO SIMULADO */}
        <div style={{display:'flex',flexDirection:'column',gap:'12px'}}>
          <div style={{background:'#0a1628',borderRadius:'12px',flex:1,position:'relative',overflow:'hidden',display:'flex',alignItems:'center',justifyContent:'center',minHeight:'250px'}}>
            <div style={{textAlign:'center'}}>
              <div style={{width:'72px',height:'72px',borderRadius:'50%',background:'rgba(55,138,221,0.2)',border:'2px solid rgba(55,138,221,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'24px',fontWeight:'500',color:'#B5D4F4',margin:'0 auto 10px'}}>
                {consulta.paciente_nome?.split(' ').map((n:string)=>n[0]).slice(0,2).join('')}
              </div>
              <div style={{color:'white',fontSize:'14px',fontWeight:'500'}}>{consulta.paciente_nome}</div>
              <div style={{color:'rgba(255,255,255,0.4)',fontSize:'11px',marginTop:'4px'}}>Aguardando conexão de vídeo</div>
              <div style={{fontSize:'11px',color:'rgba(255,255,255,0.3)',marginTop:'6px',fontFamily:'monospace'}}>Sala: {consulta.sala_id}</div>
            </div>
            <div style={{position:'absolute',bottom:'12px',right:'12px',width:'96px',height:'68px',background:'#1a2a44',borderRadius:'8px',border:'1.5px solid rgba(55,138,221,0.4)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'20px',color:'rgba(255,255,255,0.6)'}}>👩‍⚕️</div>
            <div style={{position:'absolute',top:'12px',left:'12px',background:'rgba(0,0,0,0.5)',padding:'5px 10px',borderRadius:'20px',display:'flex',alignItems:'center',gap:'6px'}}>
              <div style={{width:'6px',height:'6px',borderRadius:'50%',background:gravando?'#1D9E75':'#888'}}></div>
              <span style={{color:'white',fontSize:'11px',fontFamily:'monospace'}}>{formatTempo(tempoConsulta)}</span>
            </div>
          </div>

          {/* CONTROLES */}
          <div style={{background:'white',borderRadius:'12px',padding:'12px 16px',border:'0.5px solid rgba(0,0,0,0.1)',display:'flex',alignItems:'center',justifyContent:'center',gap:'10px',flexShrink:0}}>
            <button onClick={()=>gravando?pararGravacao():iniciarGravacao('paciente')}
              style={{padding:'9px 18px',borderRadius:'8px',border:'none',background:gravando?'#D85A30':'#185FA5',color:'white',fontSize:'12px',fontWeight:'500',cursor:'pointer',display:'flex',alignItems:'center',gap:'6px'}}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/><line x1="8" y1="23" x2="16" y2="23"/></svg>
              {gravando ? 'Parar gravação' : 'Gravar paciente'}
            </button>
            <button onClick={()=>gravando?pararGravacao():iniciarGravacao('medico')}
              style={{padding:'9px 18px',borderRadius:'8px',border:'0.5px solid rgba(0,0,0,0.25)',background:'white',color:'#185FA5',fontSize:'12px',fontWeight:'500',cursor:'pointer'}}>
              Gravar médico
            </button>
            <button onClick={()=>buscarSugestoes(transcricao)} disabled={carregandoIA}
              style={{padding:'9px 18px',borderRadius:'8px',border:'none',background:carregandoIA?'#999':'#7F77DD',color:'white',fontSize:'12px',fontWeight:'500',cursor:'pointer',marginLeft:'8px'}}>
              {carregandoIA?'Analisando...':'🤖 Analisar IA'}
            </button>
          </div>
        </div>

        {/* PAINEL IA */}
        <div style={{display:'flex',flexDirection:'column',gap:'12px',overflowY:'auto',minHeight:0}}>
          {/* TRANSCRIÇÃO */}
          <div style={{background:'white',borderRadius:'12px',border:'0.5px solid rgba(0,0,0,0.1)',padding:'14px',flexShrink:0}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
              <span style={{fontSize:'11px',fontWeight:'500',color:'#888',textTransform:'uppercase',letterSpacing:'0.05em'}}>Transcrição ao vivo</span>
              {gravando && <span style={{display:'flex',alignItems:'center',gap:'5px',fontSize:'10px',color:'#0F6E56',fontWeight:'500'}}>
                <span style={{width:'6px',height:'6px',borderRadius:'50%',background:'#1D9E75',display:'inline-block'}}></span>Gravando
              </span>}
            </div>
            <div ref={transScrollRef} style={{maxHeight:'160px',overflowY:'auto',fontSize:'12px',lineHeight:'1.7'}}>
              {transcricao.length === 0 && <div style={{color:'#ccc',fontSize:'12px',fontStyle:'italic'}}>Clique em "Gravar" para iniciar a transcrição...</div>}
              {transcricao.map((c,i) => (
                <div key={i} style={{marginBottom:'4px'}}>
                  <span style={{fontWeight:'500',color:c.speaker==='medico'?'#185FA5':'#0F6E56'}}>{c.speaker==='medico'?'Médica':'Paciente'}:</span>
                  {' '}{c.texto}
                </div>
              ))}
            </div>
          </div>

          {/* SUGESTÕES IA */}
          <div style={{background:'white',borderRadius:'12px',border:'0.5px solid rgba(0,0,0,0.1)',padding:'14px'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'10px'}}>
              <span style={{fontSize:'11px',fontWeight:'500',color:'#888',textTransform:'uppercase',letterSpacing:'0.05em'}}>Sugestões diagnósticas IA</span>
              <span style={{background:'#EEEDFE',color:'#534AB7',fontSize:'9px',fontWeight:'500',padding:'3px 8px',borderRadius:'20px'}}>Claude AI</span>
            </div>

            {resumo && <div style={{background:'#E6F1FB',borderRadius:'8px',padding:'10px',fontSize:'12px',color:'#0C447C',marginBottom:'10px',lineHeight:'1.5'}}>{resumo}</div>}
            {alertas.map((a,i)=><div key={i} style={{background:'#FAECE7',borderRadius:'8px',padding:'8px 10px',fontSize:'11px',color:'#D85A30',marginBottom:'6px'}}>⚠ {a}</div>)}

            {sugestoes.length === 0 && !carregandoIA && (
              <div style={{color:'#ccc',fontSize:'12px',fontStyle:'italic'}}>Aguardando transcrição para análise...</div>
            )}
            {carregandoIA && <div style={{color:'#888',fontSize:'12px',fontStyle:'italic'}}>🤖 Analisando consulta...</div>}

            {sugestoes.map((s,i) => (
              <div key={i} style={{background:confBg(s.confianca),borderRadius:'8px',padding:'10px 12px',marginBottom:'8px',border:`0.5px solid ${confColor(s.confianca)}22`,cursor:'pointer'}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'4px'}}>
                  <span style={{fontSize:'12px',fontWeight:'500',color:confColor(s.confianca)}}>{s.nome}</span>
                  <span style={{fontSize:'10px',fontWeight:'500',background:'white',color:confColor(s.confianca),padding:'2px 7px',borderRadius:'10px'}}>{Math.round(s.confianca*100)}%</span>
                </div>
                <div style={{fontSize:'11px',color:confColor(s.confianca),lineHeight:'1.4',marginBottom:'4px'}}>{s.descricao}</div>
                <div style={{fontSize:'11px',color:confColor(s.confianca),opacity:0.8,lineHeight:'1.4'}}>{s.conduta_sugerida}</div>
                <div style={{fontSize:'9px',fontFamily:'monospace',color:confColor(s.confianca),marginTop:'4px',opacity:0.7}}>CID-10: {s.cid}</div>
                {s.alertas?.map((a,ai)=><div key={ai} style={{fontSize:'10px',color:'#D85A30',marginTop:'4px'}}>⚠ {a}</div>)}
              </div>
            ))}
          </div>

          {/* HISTÓRICO */}
          <div style={{background:'white',borderRadius:'12px',border:'0.5px solid rgba(0,0,0,0.1)',padding:'14px',flexShrink:0}}>
            <div style={{fontSize:'11px',fontWeight:'500',color:'#888',textTransform:'uppercase',letterSpacing:'0.05em',marginBottom:'8px'}}>Dados do paciente</div>
            <div style={{fontSize:'12px',color:'#042C53',fontWeight:'500',marginBottom:'4px'}}>{consulta.paciente_nome}</div>
            {consulta.data_nasc && <div style={{fontSize:'11px',color:'#888'}}>Nascimento: {new Date(consulta.data_nasc).toLocaleDateString('pt-BR')}</div>}
            {consulta.convenio && <div style={{fontSize:'11px',color:'#888'}}>Convênio: {consulta.convenio}</div>}
            {(consulta.alergias as unknown as string[])?.length > 0 && (
              <div style={{marginTop:'8px'}}>
                {(consulta.alergias as unknown as string[]).map((a:string,i:number)=>(
                  <span key={i} style={{background:'#FAECE7',color:'#D85A30',fontSize:'10px',padding:'3px 8px',borderRadius:'20px',marginRight:'4px',fontWeight:'500'}}>⚠ {a}</span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
