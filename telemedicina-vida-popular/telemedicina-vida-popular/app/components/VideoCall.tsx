'use client'
import { useEffect, useRef, useState, useCallback } from 'react'

interface Props {
  salaId: string
  role: 'medico' | 'paciente'
  nomePaciente?: string
}

export default function VideoCall({ salaId, role, nomePaciente }: Props) {
  const [conectado, setConectado] = useState(false)
  const [inicializando, setInicializando] = useState(true)
  const [erro, setErro] = useState('')
  const [micAtivo, setMicAtivo] = useState(true)
  const [camAtiva, setCamAtiva] = useState(true)

  const localVideoRef = useRef<HTMLVideoElement>(null)
  const remoteVideoRef = useRef<HTMLVideoElement>(null)
  const peerRef = useRef<any>(null)
  const localStreamRef = useRef<MediaStream | null>(null)

  // IDs únicos por sala: prefixo + UUID sem hífens + role
  const myId = `vida${salaId.replace(/-/g, '')}${role}`
  const otherId = `vida${salaId.replace(/-/g, '')}${role === 'medico' ? 'paciente' : 'medico'}`

  const onRemoteStream = useCallback((stream: MediaStream) => {
    if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream
    setConectado(true)
  }, [])

  useEffect(() => {
    let destroyed = false

    async function init() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        if (destroyed) { stream.getTracks().forEach(t => t.stop()); return }

        localStreamRef.current = stream
        if (localVideoRef.current) localVideoRef.current.srcObject = stream

        const { Peer } = await import('peerjs')
        if (destroyed) return

        const peer = new Peer(myId, { host: '0.peerjs.com', port: 443, path: '/', secure: true })
        peerRef.current = peer

        peer.on('open', () => {
          setInicializando(false)
          if (role === 'paciente') {
            const call = peer.call(otherId, stream)
            call.on('stream', onRemoteStream)
            call.on('error', () => setErro('Não foi possível conectar ao médico.'))
          }
        })

        peer.on('call', call => {
          call.answer(stream)
          call.on('stream', onRemoteStream)
        })

        peer.on('error', err => {
          if (err.type === 'unavailable-id') {
            // ID ocupado: tenta novamente com sufixo único
            peer.destroy()
          }
          setErro('Erro de conexão. Verifique sua internet.')
          setInicializando(false)
        })

      } catch (err: any) {
        setErro(
          err.name === 'NotAllowedError'
            ? 'Permissão de câmera/microfone negada. Verifique as configurações do navegador.'
            : 'Não foi possível acessar câmera ou microfone.'
        )
        setInicializando(false)
      }
    }

    init()

    return () => {
      destroyed = true
      peerRef.current?.destroy()
      localStreamRef.current?.getTracks().forEach(t => t.stop())
    }
  }, [salaId, role])

  function toggleMic() {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !t.enabled })
    setMicAtivo(v => !v)
  }

  function toggleCam() {
    localStreamRef.current?.getVideoTracks().forEach(t => { t.enabled = !t.enabled })
    setCamAtiva(v => !v)
  }

  const iniciais = nomePaciente?.split(' ').map(n => n[0]).slice(0, 2).join('') || 'P'

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', background: '#0a1628', borderRadius: '12px', overflow: 'hidden', minHeight: '250px' }}>
      {/* Vídeo remoto */}
      <video
        ref={remoteVideoRef}
        autoPlay
        playsInline
        style={{ width: '100%', height: '100%', objectFit: 'cover', display: conectado ? 'block' : 'none' }}
      />

      {/* Placeholder enquanto aguarda conexão */}
      {!conectado && (
        <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'rgba(55,138,221,0.2)', border: '2px solid rgba(55,138,221,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '26px', fontWeight: '600', color: '#B5D4F4', marginBottom: '10px' }}>
            {iniciais}
          </div>
          <div style={{ color: 'white', fontSize: '14px', fontWeight: '500' }}>{nomePaciente || 'Paciente'}</div>
          <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '11px', marginTop: '6px' }}>
            {inicializando ? 'Conectando...' : erro || 'Aguardando paciente entrar na sala...'}
          </div>
        </div>
      )}

      {/* Vídeo local (miniatura) */}
      <video
        ref={localVideoRef}
        autoPlay
        playsInline
        muted
        style={{ position: 'absolute', bottom: '56px', right: '12px', width: '100px', height: '75px', borderRadius: '8px', objectFit: 'cover', border: '1.5px solid rgba(55,138,221,0.4)', background: '#1a2a44' }}
      />

      {/* Controles */}
      <div style={{ position: 'absolute', bottom: '12px', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '8px' }}>
        <button
          onClick={toggleMic}
          title={micAtivo ? 'Silenciar' : 'Ativar microfone'}
          style={{ width: '38px', height: '38px', borderRadius: '50%', border: 'none', background: micAtivo ? 'rgba(255,255,255,0.2)' : '#D85A30', color: 'white', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {micAtivo ? '🎤' : '🔇'}
        </button>
        <button
          onClick={toggleCam}
          title={camAtiva ? 'Desligar câmera' : 'Ligar câmera'}
          style={{ width: '38px', height: '38px', borderRadius: '50%', border: 'none', background: camAtiva ? 'rgba(255,255,255,0.2)' : '#D85A30', color: 'white', cursor: 'pointer', fontSize: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {camAtiva ? '📹' : '📷'}
        </button>
      </div>

      {/* Badge conectado */}
      {conectado && (
        <div style={{ position: 'absolute', top: '12px', right: '12px', background: 'rgba(29,158,117,0.9)', color: 'white', fontSize: '10px', fontWeight: '600', padding: '4px 10px', borderRadius: '20px' }}>
          ● Conectado
        </div>
      )}

      {/* Erro */}
      {erro && (
        <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', background: 'rgba(216,90,48,0.92)', color: 'white', fontSize: '11px', padding: '8px 12px', borderRadius: '8px', textAlign: 'center' }}>
          {erro}
        </div>
      )}
    </div>
  )
}
