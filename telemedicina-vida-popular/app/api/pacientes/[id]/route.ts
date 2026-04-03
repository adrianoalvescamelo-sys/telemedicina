import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/app/lib/db'
import { autenticarRequisicao } from '@/app/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!autenticarRequisicao(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const rows = await sql`SELECT * FROM pacientes WHERE id=${params.id}`
  if (!rows[0]) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json({ data: rows[0] })
}

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  if (!autenticarRequisicao(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const b = await req.json()
  const rows = await sql`
    UPDATE pacientes SET nome=${b.nome}, telefone=${b.telefone}, email=${b.email||null},
      endereco=${b.endereco||null}, convenio=${b.convenio||null},
      alergias=${b.alergias||[]}, observacoes=${b.observacoes||null}, atualizado_em=NOW()
    WHERE id=${params.id} RETURNING *`
  return NextResponse.json({ data: rows[0] })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  if (!autenticarRequisicao(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  await sql`UPDATE pacientes SET ativo=false WHERE id=${params.id}`
  return NextResponse.json({ ok: true })
}
