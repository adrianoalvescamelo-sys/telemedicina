import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/app/lib/db'
import { autenticarRequisicao } from '@/app/lib/auth'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  if (!autenticarRequisicao(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const rows = await sql`
    SELECT c.*, p.nome as paciente_nome, p.data_nasc, p.sexo, p.alergias, p.cpf,
           p.telefone as paciente_tel, p.convenio,
           m.nome as medico_nome, m.crm, m.especialidade
    FROM consultas c
    JOIN pacientes p ON p.id=c.paciente_id
    JOIN medicos m ON m.id=c.medico_id
    WHERE c.id=${params.id}`
  if (!rows[0]) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 })
  return NextResponse.json({ data: rows[0] })
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!autenticarRequisicao(req)) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { status } = await req.json()
  const extra = status === 'em_andamento' ? sql`, iniciada_em=NOW()` : status === 'encerrada' ? sql`, encerrada_em=NOW()` : sql``
  const rows = await sql`
    UPDATE consultas SET status=${status} ${extra} WHERE id=${params.id} RETURNING *`
  return NextResponse.json({ data: rows[0] })
}
