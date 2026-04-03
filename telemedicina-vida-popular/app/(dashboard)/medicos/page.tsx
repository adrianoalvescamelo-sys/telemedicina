'use client'
import { useEffect, useState } from 'react'

interface Medico { id:string; nome:string; crm:string; especialidade:string; email:string; telefone:string }
const ESPECIALIDADES = ['Clínica Médica','Cardiologia','Pediatria','Ginecologia','Ortopedia','Neurologia','Psiquiatria','Dermatologia','Oftalmologia','Urologia']

export default function MedicosPage() {
  const [lista, setLista] = useState<Medico[]>([])
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nome:'', crm:'', cpf:'', especialidade:'Clínica Médica', email:'', telefone:'', senha:'' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')
  const token = () => localStorage.getItem('token')

  useEffect(() => {
    fetch('/api/auth/me', { headers:{Authorization:`Bearer ${token()}`} })
      .then(r=>r.json()).then(j=>{ if(j.data) setLista([j.data]) })
  }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const r = await fetch('/api/auth/registro', {
      method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token()}`},
      body: JSON.stringify(form)
    })
    const j = await r.json(); setSaving(false)
    if (!r.ok) { setToast(j.error||'Erro'); setTimeout(()=>setToast(''),3000); return }
    setModal(false); setToast('Médico cadastrado!'); setTimeout(()=>setToast(''),3000)
    setForm({ nome:'', crm:'', cpf:'', especialidade:'Clínica Médica', email:'', telefone:'', senha:'' })
    fetch('/api/auth/me', { headers:{Authorization:`Bearer ${token()}`} }).then(r=>r.json()).then(j=>{ if(j.data) setLista(l=>[...l,j.data]) })
  }

  const inp = { width:'100%', padding:'9px 12px', border:'0.5px solid rgba(0,0,0,0.25)', borderRadius:'8px', fontSize:'13px', background:'white', fontFamily:'inherit' }
  const lbl = { display:'block' as const, fontSize:'11px', fontWeight:'500' as const, color:'#666', marginBottom:'5px', textTransform:'uppercase' as const, letterSpacing:'0.04em' }

  return (
    <div style={{padding:'24px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
        <h1 style={{fontSize:'18px',fontWeight:'500',color:'#042C53'}}>Médicos</h1>
        <button onClick={()=>setModal(true)} style={{background:'#185FA5',color:'white',border:'none',borderRadius:'8px',padding:'9px 16px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>+ Cadastrar médico</button>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill,minmax(300px,1fr))',gap:'16px'}}>
        {lista.map(m=>(
          <div key={m.id} style={{background:'white',borderRadius:'12px',border:'0.5px solid rgba(0,0,0,0.1)',padding:'20px'}}>
            <div style={{display:'flex',alignItems:'center',gap:'12px',marginBottom:'14px'}}>
              <div style={{width:'48px',height:'48px',borderRadius:'50%',background:'#E6F1FB',color:'#0C447C',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'15px',fontWeight:'600',flexShrink:0}}>
                {m.nome.split(' ').filter((n:string)=>n.length>2).map((n:string)=>n[0]).slice(0,2).join('')}
              </div>
              <div style={{flex:1}}>
                <div style={{fontWeight:'500',fontSize:'14px',color:'#042C53'}}>{m.nome}</div>
                <div style={{fontSize:'12px',color:'#888'}}>{m.especialidade}</div>
              </div>
              <span style={{background:'#E1F5EE',color:'#085041',fontSize:'10px',fontWeight:'500',padding:'3px 8px',borderRadius:'20px'}}>Ativo</span>
            </div>
            <div style={{borderTop:'0.5px solid rgba(0,0,0,0.08)',paddingTop:'12px',display:'flex',flexDirection:'column',gap:'6px'}}>
              {[['CRM',m.crm],['E-mail',m.email],['Telefone',m.telefone||'—']].map(([k,v])=>(
                <div key={k} style={{display:'flex',justifyContent:'space-between',fontSize:'12px'}}>
                  <span style={{color:'#888'}}>{k}</span>
                  <span style={{color:'#042C53',fontWeight:'500',fontFamily:k==='CRM'?'monospace':'inherit'}}>{v as string}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
        <div onClick={()=>setModal(true)} style={{background:'white',borderRadius:'12px',border:'0.5px dashed rgba(0,0,0,0.2)',padding:'20px',display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',gap:'8px',cursor:'pointer',minHeight:'160px'}}>
          <div style={{width:'40px',height:'40px',borderRadius:'50%',background:'#f5f5f0',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'22px',color:'#aaa'}}>+</div>
          <span style={{fontSize:'13px',color:'#aaa'}}>Adicionar médico</span>
        </div>
      </div>

      {modal&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div style={{background:'white',borderRadius:'14px',padding:'28px',width:'100%',maxWidth:'500px',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{fontSize:'16px',fontWeight:'500'}}>Cadastrar médico</h2>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',fontSize:'22px',cursor:'pointer',color:'#aaa'}}>×</button>
            </div>
            <form onSubmit={salvar}>
              <div style={{marginBottom:'12px'}}><label style={lbl}>Nome completo *</label><input required value={form.nome} onChange={e=>setForm(f=>({...f,nome:e.target.value}))} placeholder="Dr. / Dra. Nome" style={inp}/></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
                <div><label style={lbl}>CRM *</label><input required value={form.crm} onChange={e=>setForm(f=>({...f,crm:e.target.value}))} placeholder="00000-MT" style={inp}/></div>
                <div><label style={lbl}>CPF *</label><input required value={form.cpf} onChange={e=>setForm(f=>({...f,cpf:e.target.value}))} placeholder="000.000.000-00" style={inp}/></div>
              </div>
              <div style={{marginBottom:'12px'}}><label style={lbl}>Especialidade *</label><select required value={form.especialidade} onChange={e=>setForm(f=>({...f,especialidade:e.target.value}))} style={inp}>{ESPECIALIDADES.map(e=><option key={e}>{e}</option>)}</select></div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
                <div><label style={lbl}>E-mail *</label><input required type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} style={inp}/></div>
                <div><label style={lbl}>Telefone</label><input value={form.telefone} onChange={e=>setForm(f=>({...f,telefone:e.target.value}))} placeholder="(66) 99999-9999" style={inp}/></div>
              </div>
              <div style={{marginBottom:'20px'}}><label style={lbl}>Senha (mín. 8 caracteres) *</label><input required type="password" minLength={8} value={form.senha} onChange={e=>setForm(f=>({...f,senha:e.target.value}))} style={inp}/></div>
              <div style={{display:'flex',justifyContent:'flex-end',gap:'8px'}}>
                <button type="button" onClick={()=>setModal(false)} style={{padding:'9px 16px',border:'0.5px solid rgba(0,0,0,0.25)',borderRadius:'8px',background:'transparent',cursor:'pointer',fontSize:'13px'}}>Cancelar</button>
                <button type="submit" disabled={saving} style={{padding:'9px 16px',background:saving?'#999':'#185FA5',color:'white',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>{saving?'Salvando...':'Cadastrar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {toast&&<div style={{position:'fixed',bottom:'24px',right:'24px',background:'#1D9E75',color:'white',padding:'12px 20px',borderRadius:'10px',fontSize:'13px',fontWeight:'500',zIndex:200}}>{toast}</div>}
    </div>
  )
}
