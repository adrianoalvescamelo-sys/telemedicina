'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { useParams } from 'next/navigation'

const VideoCall = dynamic(() => import('@/app/components/VideoCall'), { ssr: false })

export default function SalaPage() {
  const { id } = useParams()
  const [nome, setNome] = useState('')
  const [entrou, setEntrou] = useState(false)

  if (!entrou) {
    return (
      <div style={{ minHeight: '100vh', background: '#042C53', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        <div style={{ background: 'white', borderRadius: '16px', padding: '36px 32px', width: '100%', maxWidth: '380px', textAlign: 'center', boxShadow: '0 8px 40px rgba(0,0,0,0.3)' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '50%', background: '#E6F1FB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', margin: '0 auto 16px' }}>
            📹
          </div>
          <h1 style={{ fontSize: '20px', fontWeight: '600', color: '#042C53', marginBottom: '6px' }}>Teleconsulta</h1>
          <p style={{ fontSize: '13px', color: '#888', marginBottom: '24px' }}>Clínica Vida Popular</p>

          <input
            type="text"
            placeholder="Digite seu nome completo"
            value={nome}
            onChange={e => setNome(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && nome.trim() && setEntrou(true)}
            style={{ width: '100%', border: '1px solid #ddd', borderRadius: '8px', padding: '10px 14px', fontSize: '14px', marginBottom: '14px', boxSizing: 'border-box', outline: 'none' }}
          />

          <button
            onClick={() => setEntrou(true)}
            disabled={!nome.trim()}
            style={{ width: '100%', background: nome.trim() ? '#185FA5' : '#ccc', color: 'white', border: 'none', borderRadius: '8px', padding: '12px', fontSize: '14px', fontWeight: '500', cursor: nome.trim() ? 'pointer' : 'not-allowed' }}
          >
            Entrar na consulta
          </button>

          <p style={{ fontSize: '11px', color: '#aaa', marginTop: '16px', lineHeight: '1.5' }}>
            Ao entrar, sua câmera e microfone serão ativados.<br />
            Seus dados são protegidos pela LGPD.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ height: '100vh', background: '#0a1628', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '12px 20px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <span style={{ color: 'white', fontSize: '13px', fontWeight: '500' }}>Clínica Vida Popular · Teleconsulta</span>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{nome}</span>
      </div>
      <div style={{ flex: 1 }}>
        <VideoCall salaId={id as string} role="paciente" nomePaciente={nome} />
      </div>
    </div>
  )
}
