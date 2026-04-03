'use client'
import { useRouter, usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'

const NAV = [
  { href: '/dashboard',  label: 'Dashboard',    icon: 'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 3h2v-2h-2zm0 4h2v-2h-2zm4-4h-2v2h2v2h-4v-4h2v-2h2zm-4 0v-2h2v2z' },
  { href: '/consultas',  label: 'Teleconsulta', icon: 'M23 7l-7 5 7 5V7zM1 5h15a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H1a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2z', badge: true },
  { href: '/prontuarios',label: 'Prontuários',  icon: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm0 0v6h6M9 13h6M9 17h6' },
  { href: '/pacientes',  label: 'Pacientes',    icon: 'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 0a3 3 0 0 1 0 6M23 21v-2a4 4 0 0 0-3-3.87' },
  { href: '/medicos',    label: 'Médicos',      icon: 'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const path = usePathname()
  const [medico, setMedico] = useState<{nome:string;crm:string}>({ nome: '', crm: '' })

  useEffect(() => {
    const m = localStorage.getItem('medico')
    if (m) setMedico(JSON.parse(m))
    else router.push('/login')
  }, [router])

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' })
    localStorage.clear()
    router.push('/login')
  }

  return (
    <div style={{display:'flex',height:'100vh',overflow:'hidden',fontFamily:'var(--font-sans)'}}>
      {/* SIDEBAR */}
      <aside style={{width:'220px',flexShrink:0,background:'#042C53',display:'flex',flexDirection:'column'}}>
        <div style={{padding:'20px 16px 16px',borderBottom:'0.5px solid rgba(255,255,255,0.1)'}}>
          <div style={{width:'32px',height:'32px',background:'#1D9E75',borderRadius:'8px',display:'flex',alignItems:'center',justifyContent:'center',marginBottom:'8px'}}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>
          </div>
          <div style={{fontSize:'13px',fontWeight:'600',color:'white',lineHeight:'1.3'}}>Vida Popular<br/>Telemedicina</div>
          <div style={{fontSize:'10px',color:'rgba(255,255,255,0.45)',marginTop:'2px'}}>Clínica Vida Popular</div>
        </div>

        <nav style={{padding:'12px 10px',flex:1}}>
          {NAV.map(n => (
            <div key={n.href}
              onClick={() => router.push(n.href)}
              style={{
                display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',
                borderRadius:'8px',cursor:'pointer',marginBottom:'1px',
                background: path === n.href ? 'rgba(55,138,221,0.3)' : 'transparent',
                color: path === n.href ? 'white' : 'rgba(255,255,255,0.6)',
                fontSize:'12px',fontWeight: path === n.href ? '500' : '400',
                transition:'background 0.15s',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" style={{flexShrink:0}}>
                <path d={n.icon}/>
              </svg>
              {n.label}
              {n.badge && <span style={{marginLeft:'auto',background:'#1D9E75',color:'white',fontSize:'9px',fontWeight:'600',padding:'2px 6px',borderRadius:'10px'}}>3</span>}
            </div>
          ))}
        </nav>

        <div style={{padding:'12px 10px',borderTop:'0.5px solid rgba(255,255,255,0.1)'}}>
          <div style={{fontSize:'11px',color:'rgba(255,255,255,0.5)',marginBottom:'2px',paddingLeft:'10px',overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{medico.nome}</div>
          <div style={{fontSize:'10px',color:'rgba(255,255,255,0.3)',paddingLeft:'10px',marginBottom:'8px'}}>CRM {medico.crm}</div>
          <div onClick={logout} style={{display:'flex',alignItems:'center',gap:'8px',padding:'8px 10px',borderRadius:'8px',cursor:'pointer',color:'rgba(255,255,255,0.5)',fontSize:'12px'}}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9"/></svg>
            Sair
          </div>
        </div>
      </aside>

      {/* CONTENT */}
      <main style={{flex:1,overflowY:'auto',background:'#f5f5f0'}}>
        {children}
      </main>
    </div>
  )
}
