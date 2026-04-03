import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/app/lib/db'
import { hashSenha, gerarToken } from '@/app/lib/auth'
import { z } from 'zod'

const schema = z.object({
  nome: z.string().min(3),
  crm: z.string().min(5),
  cpf: z.string().min(11),
  especialidade: z.string().default('Clínica Médica'),
  email: z.string().email(),
  telefone: z.string().optional(),
  senha: z.string().min(8),
})

export async function POST(req: NextRequest) {
  const parsed = schema.safeParse(await req.json())
  if (!parsed.success)
    return NextResponse.json({ error: 'Dados inválidos', detalhes: parsed.error.errors }, { status: 400 })

  const d = parsed.data
  const existe = await sql`SELECT id FROM medicos WHERE email=${d.email.toLowerCase()} OR crm=${d.crm}`
  if (existe.length > 0)
    return NextResponse.json({ error: 'E-mail ou CRM já cadastrado' }, { status: 409 })

  const hash = await hashSenha(d.senha)
  const rows = await sql`
    INSERT INTO medicos (nome, crm, cpf, especialidade, email, telefone, senha_hash)
    VALUES (${d.nome}, ${d.crm}, ${d.cpf}, ${d.especialidade}, ${d.email.toLowerCase()}, ${d.telefone||null}, ${hash})
    RETURNING id, nome, crm, especialidade, email
  `
  const m = rows[0]
  const token = gerarToken({ id: m.id, nome: m.nome, crm: m.crm, email: m.email, especialidade: m.especialidade })
  const res = NextResponse.json({ data: { medico: m, token } }, { status: 201 })
  res.cookies.set('auth_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 28800, path: '/' })
  return res
}
