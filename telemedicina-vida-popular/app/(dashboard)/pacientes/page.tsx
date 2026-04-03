'use client'
import { useEffect, useState } from 'react'

interface Paciente { id:string; nome:string; cpf:string; data_nasc:string; sexo:string; telefone:string; email:string; convenio:string; alergias:string[] }
const SEXOS = ['Feminino','Masculino','Outro']
const CONVENIOS = ['Particular','Unimed','SUS','Bradesco Saúde','Amil','Porto Seguro','Outros']

export default function PacientesPage() {
  const [lista, setLista] = useState<Paciente[]>([])
  const [q, setQ] = useState('')
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ nome:'',cpf:'',rg:'',data_nasc:'',sexo:'Feminino',telefone:'',email:'',endereco:'',convenio:'Particular',alergias:'' })
  const [saving, setSaving] = useState(false)
  const [toast, setToast] = useState('')

  const token = () => localStorage.getItem('token')

  async function load(busca = '') {
    const r = await fetch(`/api/pacientes?q=${busca}`, { headers: { Authorization: `Bearer ${token()}` } })
    const j = await r.json(); setLista(j.data || [])
  }

  useEffect(() => { load() }, [])

  async function salvar(e: React.FormEvent) {
    e.preventDefault(); setSaving(true)
    const body = { ...form, alergias: form.alergias.split(',').map(s=>s.trim()).filter(Boolean) }
    const r = await fetch('/api/pacientes', { method:'POST', headers:{'Content-Type':'application/json','Authorization':`Bearer ${token()}`}, body: JSON.stringify(body) })
    const j = await r.json(); setSaving(false)
    if (!r.ok) { setToast(j.error || 'Erro'); return }
    setModal(false); setToast('Paciente cadastrado!'); load()
    setForm({ nome:'',cpf:'',rg:'',data_nasc:'',sexo:'Feminino',telefone:'',email:'',endereco:'',convenio:'Particular',alergias:'' })
    setTimeout(() => setToast(''), 3000)
  }

  const inp = (style?: object) => ({
    width:'100%',padding:'9px 12px',border:'0.5px solid rgba(0,0,0,0.25)',borderRadius:'8px',fontSize:'13px',background:'white', ...style
  })

  return (
    <div style={{padding:'24px'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'20px'}}>
        <h1 style={{fontSize:'18px',fontWeight:'500',color:'#042C53'}}>Pacientes</h1>
        <button onClick={()=>setModal(true)} style={{background:'#185FA5',color:'white',border:'none',borderRadius:'8px',padding:'9px 16px',fontSize:'13px',fontWeight:'500',cursor:'pointer'}}>+ Novo paciente</button>
      </div>

      <div style={{position:'relative',marginBottom:'16px',maxWidth:'360px'}}>
        <svg style={{position:'absolute',left:'10px',top:'50%',transform:'translateY(-50%)',color:'#aaa'}} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
        <input value={q} onChange={e=>{setQ(e.target.value);load(e.target.value)}} placeholder="Buscar por nome ou CPF..." style={{...inp(),paddingLeft:'32px'}} />
      </div>

      <div style={{background:'white',borderRadius:'12px',border:'0.5px solid rgba(0,0,0,0.1)',overflow:'hidden'}}>
        <table style={{width:'100%',borderCollapse:'collapse',fontSize:'13px'}}>
          <thead>
            <tr style={{background:'#f8f8f6'}}>
              {['Paciente','CPF','Nascimento','Telefone','Convênio','Alergias',''].map(h=>(
                <th key={h} style={{textAlign:'left',padding:'10px 16px',fontSize:'10px',fontWeight:'600',color:'#888',textTransform:'uppercase',letterSpacing:'0.06em'}}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {lista.map(p => (
              <tr key={p.id} style={{borderTop:'0.5px solid rgba(0,0,0,0.06)'}}>
                <td style={{padding:'12px 16px'}}>
                  <div style={{display:'flex',alignItems:'center',gap:'8px'}}>
                    <div style={{width:'30px',height:'30px',borderRadius:'50%',background:'#E1F5EE',color:'#085041',display:'flex',alignItems:'center',justifyContent:'center',fontSize:'11px',fontWeight:'600',flexShrink:0}}>
                      {p.nome.split(' ').map((n:string)=>n[0]).slice(0,2).join('')}
                    </div>
                    <span style={{fontWeight:'500'}}>{p.nome}</span>
                  </div>
                </td>
                <td style={{padding:'12px 16px',color:'#888',fontFamily:'monospace',fontSize:'12px'}}>{p.cpf}</td>
                <td style={{padding:'12px 16px',color:'#888',fontSize:'12px'}}>{new Date(p.data_nasc).toLocaleDateString('pt-BR')}</td>
                <td style={{padding:'12px 16px',color:'#888',fontSize:'12px'}}>{p.telefone}</td>
                <td style={{padding:'12px 16px'}}><span style={{background:'#E6F1FB',color:'#0C447C',fontSize:'10px',padding:'3px 8px',borderRadius:'20px',fontWeight:'500'}}>{p.convenio||'Particular'}</span></td>
                <td style={{padding:'12px 16px'}}>
                  {p.alergias?.length > 0 && <span style={{background:'#FAECE7',color:'#D85A30',fontSize:'10px',padding:'3px 8px',borderRadius:'20px',fontWeight:'500'}}>⚠ {p.alergias.slice(0,1).join('')}{p.alergias.length>1?` +${p.alergias.length-1}`:''}</span>}
                </td>
                <td style={{padding:'12px 16px'}}><a href={`/pacientes/${p.id}`} style={{color:'#185FA5',fontSize:'12px',textDecoration:'none'}}>Ver →</a></td>
              </tr>
            ))}
            {lista.length === 0 && <tr><td colSpan={7} style={{padding:'40px',textAlign:'center',color:'#aaa',fontSize:'13px'}}>Nenhum paciente encontrado</td></tr>}
          </tbody>
        </table>
      </div>

      {/* MODAL CADASTRO */}
      {modal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',zIndex:100,display:'flex',alignItems:'center',justifyContent:'center',padding:'20px'}} onClick={e=>{if(e.target===e.currentTarget)setModal(false)}}>
          <div style={{background:'white',borderRadius:'14px',padding:'28px',width:'100%',maxWidth:'560px',maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:'20px'}}>
              <h2 style={{fontSize:'16px',fontWeight:'500'}}>Cadastrar paciente</h2>
              <button onClick={()=>setModal(false)} style={{background:'none',border:'none',fontSize:'22px',cursor:'pointer',color:'#aaa'}}>×</button>
            </div>
            <form onSubmit={salvar}>
              {[
                [['Nome completo *','nome','text','Nome completo'],['Data de nascimento *','data_nasc','date','']],
                [['CPF *','cpf','text','000.000.000-00'],['RG','rg','text','Número do RG']],
                [['Telefone *','telefone','text','(66) 99999-9999'],['E-mail','email','email','email@exemplo.com']],
                [['Endereço','endereco','text','Rua, número, bairro — Sinop, MT'],null],
              ].map((row, ri) => (
                <div key={ri} style={{display:'grid',gridTemplateColumns:row[1]?'1fr 1fr':'1fr',gap:'12px',marginBottom:'12px'}}>
                  {row.filter(Boolean).map(([label,field,type,placeholder]: string[]) => (
                    <div key={field}>
                      <label style={{display:'block',fontSize:'11px',fontWeight:'500',color:'#666',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.04em'}}>{label}</label>
                      <input type={type} placeholder={placeholder}
                        value={(form as Record<string,string>)[field]}
                        onChange={e=>setForm(f=>({...f,[field]:e.target.value}))}
                        required={label.includes('*')}
                        style={inp()}
                      />
                    </div>
                  ))}
                </div>
              ))}

              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:'12px',marginBottom:'12px'}}>
                <div>
                  <label style={{display:'block',fontSize:'11px',fontWeight:'500',color:'#666',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.04em'}}>Sexo *</label>
                  <select value={form.sexo} onChange={e=>setForm(f=>({...f,sexo:e.target.value}))} style={inp()}>
                    {SEXOS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{display:'block',fontSize:'11px',fontWeight:'500',color:'#666',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.04em'}}>Convênio</label>
                  <select value={form.convenio} onChange={e=>setForm(f=>({...f,convenio:e.target.value}))} style={inp()}>
                    {CONVENIOS.map(c=><option key={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div style={{marginBottom:'20px'}}>
                <label style={{display:'block',fontSize:'11px',fontWeight:'500',color:'#666',marginBottom:'5px',textTransform:'uppercase',letterSpacing:'0.04em'}}>Alergias (separadas por vírgula)</label>
                <input value={form.alergias} onChange={e=>setForm(f=>({...f,alergias:e.target.value}))} placeholder="Ex: Penicilina, AAS, Dipirona" style={inp()} />
              </div>

              <div style={{display:'flex',justifyContent:'flex-end',gap:'8px'}}>
                <button type="button" onClick={()=>setModal(false)} style={{padding:'9px 16px',border:'0.5px solid rgba(0,0,0,0.25)',borderRadius:'8px',background:'transparent',cursor:'pointer',fontSize:'13px'}}>Cancelar</button>
                <button type="submit" disabled={saving} style={{padding:'9px 16px',background:saving?'#999':'#185FA5',color:'white',border:'none',borderRadius:'8px',fontSize:'13px',fontWeight:'500',cursor:saving?'default':'pointer'}}>
                  {saving?'Salvando...':'Salvar paciente'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <div style={{position:'fixed',bottom:'24px',right:'24px',background:'#1D9E75',color:'white',padding:'12px 20px',borderRadius:'10px',fontSize:'13px',fontWeight:'500',zIndex:200}}>{toast}</div>}
    </div>
  )
}
