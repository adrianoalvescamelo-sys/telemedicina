import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/app/lib/db'
import { verificarSenha, gerarToken } from '@/app/lib/auth'

export async function POST(req: NextRequest) {
  const { email, senha } = await req.json()
  if (!email || !senha)
    return NextResponse.json({ error: 'E-mail e senha obrigatórios' }, { status: 400 })

  const rows = await sql`
    SELECT id, nome, crm, especialidade, email, senha_hash, ativo
    FROM medicos WHERE email = ${email.toLowerCase()}
  `
  const m = rows[0]
  if (!m || !m.ativo)
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })

  const ok = await verificarSenha(senha, m.senha_hash)
  if (!ok)
    return NextResponse.json({ error: 'Credenciais inválidas' }, { status: 401 })

  const token = gerarToken({ id: m.id, nome: m.nome, crm: m.crm, email: m.email, especialidade: m.especialidade })

  const res = NextResponse.json({
    data: { medico: { id: m.id, nome: m.nome, crm: m.crm, especialidade: m.especialidade }, token }
  })
  res.cookies.set('auth_token', token, {
    httpOnly: true, secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax', maxAge: 28800, path: '/'
  })
  return res
}
