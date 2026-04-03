'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [form, setForm] = useState({ email: '', senha: '' })
  const [erro, setErro] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setErro('')
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const json = await res.json()
    setLoading(false)
    if (!res.ok) { setErro(json.error || 'Erro ao entrar'); return }
    localStorage.setItem('medico', JSON.stringify(json.data.medico))
    localStorage.setItem('token', json.data.token)
    router.push('/dashboard')
  }

  return (
    <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'#f5f5f0'}}>
      <div style={{width:'100%',maxWidth:'380px',background:'white',borderRadius:'16px',padding:'36px',border:'0.5px solid rgba(0,0,0,0.12)'}}>
        <div style={{textAlign:'center',marginBottom:'28px'}}>
          <div style={{width:'48px',height:'48px',background:'#1D9E75',borderRadius:'12px',display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <h1 style={{fontSize:'18px',fontWeight:'500',color:'#042C53'}}>Clínica Vida Popular</h1>
          <p style={{fontSize:'13px',color:'#888',marginTop:'4px'}}>Telemedicina — Acesso médico</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{marginBottom:'14px'}}>
            <label style={{display:'block',fontSize:'11px',fontWeight:'500',color:'#666',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.04em'}}>E-mail</label>
            <input
              type="email" required
              value={form.email}
              onChange={e => setForm(f => ({...f, email: e.target.value}))}
              placeholder="seu@email.com"
              style={{width:'100%',padding:'10px 12px',border:'0.5px solid rgba(0,0,0,0.3)',borderRadius:'8px',fontSize:'13px'}}
            />
          </div>
          <div style={{marginBottom:'20px'}}>
            <label style={{display:'block',fontSize:'11px',fontWeight:'500',color:'#666',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.04em'}}>Senha</label>
            <input
              type="password" required
              value={form.senha}
              onChange={e => setForm(f => ({...f, senha: e.target.value}))}
              placeholder="••••••••"
              style={{width:'100%',padding:'10px 12px',border:'0.5px solid rgba(0,0,0,0.3)',borderRadius:'8px',fontSize:'13px'}}
            />
          </div>
          {erro && <div style={{background:'#FAECE7',border:'0.5px solid rgba(216,90,48,0.3)',borderRadius:'8px',padding:'10px 12px',fontSize:'12px',color:'#D85A30',marginBottom:'14px'}}>{erro}</div>}
          <button
            type="submit" disabled={loading}
            style={{width:'100%',padding:'11px',background:loading?'#999':'#185FA5',color:'white',border:'none',borderRadius:'8px',fontSize:'14px',fontWeight:'500',cursor:loading?'default':'pointer'}}
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <p style={{textAlign:'center',fontSize:'12px',color:'#888',marginTop:'20px'}}>
          Sem acesso? Fale com a administração da clínica.
        </p>
      </div>
    </div>
  )
}
