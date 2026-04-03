import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/app/lib/db'
import { autenticarRequisicao } from '@/app/lib/auth'
import { z } from 'zod'

const schema = z.object({
  nome: z.string().min(3),
  cpf: z.string().min(11),
  rg: z.string().optional(),
  data_nasc: z.string(),
  sexo: z.enum(['Feminino', 'Masculino', 'Outro']),
  telefone: z.string().min(10),
  email: z.string().email().optional().or(z.literal('')),
  endereco: z.string().optional(),
  convenio: z.string().optional(),
  num_carteirinha: z.string().optional(),
  alergias: z.array(z.string()).optional(),
  observacoes: z.string().optional(),
})

export async function GET(req: NextRequest) {
  const medico = autenticarRequisicao(req)
  if (!medico) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const q = searchParams.get('q') || ''
  const page = parseInt(searchParams.get('page') || '1')
  const limit = 20
  const offset = (page - 1) * limit

  const rows = q
    ? await sql`
        SELECT id, nome, cpf, data_nasc, sexo, telefone, email, convenio, alergias, ativo, criado_em
        FROM pacientes WHERE ativo=true
        AND (nome ILIKE ${'%'+q+'%'} OR cpf ILIKE ${'%'+q+'%'})
        ORDER BY nome LIMIT ${limit} OFFSET ${offset}
      `
    : await sql`
        SELECT id, nome, cpf, data_nasc, sexo, telefone, email, convenio, alergias, ativo, criado_em
        FROM pacientes WHERE ativo=true ORDER BY nome LIMIT ${limit} OFFSET ${offset}
      `

  const total = await sql`SELECT COUNT(*) as c FROM pacientes WHERE ativo=true`
  return NextResponse.json({ data: rows, total: parseInt(total[0].c), page })
}

export async function POST(req: NextRequest) {
  const medico = autenticarRequisicao(req)
  if (!medico) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const parsed = schema.safeParse(await req.json())
  if (!parsed.success)
    return NextResponse.json({ error: 'Dados inválidos', detalhes: parsed.error.errors }, { status: 400 })

  const d = parsed.data
  const existe = await sql`SELECT id FROM pacientes WHERE cpf=${d.cpf}`
  if (existe.length > 0) return NextResponse.json({ error: 'CPF já cadastrado' }, { status: 409 })

  const rows = await sql`
    INSERT INTO pacientes (nome,cpf,rg,data_nasc,sexo,telefone,email,endereco,convenio,num_carteirinha,alergias,observacoes)
    VALUES (${d.nome},${d.cpf},${d.rg||null},${d.data_nasc},${d.sexo},${d.telefone},
            ${d.email||null},${d.endereco||null},${d.convenio||null},${d.num_carteirinha||null},
            ${d.alergias||[]},${d.observacoes||null})
    RETURNING *
  `
  return NextResponse.json({ data: rows[0] }, { status: 201 })
}
