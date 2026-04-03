import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/app/lib/db'
import { autenticarRequisicao } from '@/app/lib/auth'

export async function GET(req: NextRequest) {
  const medico = autenticarRequisicao(req)
  if (!medico) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const status = searchParams.get('status')
  const data = searchParams.get('data') || new Date().toISOString().split('T')[0]

  const rows = status
    ? await sql`
        SELECT c.*, p.nome as paciente_nome, p.data_nasc, p.alergias, p.telefone as paciente_tel
        FROM consultas c JOIN pacientes p ON p.id=c.paciente_id
        WHERE c.medico_id=${medico.id} AND c.status=${status}
        ORDER BY c.agendada_para ASC`
    : await sql`
        SELECT c.*, p.nome as paciente_nome, p.data_nasc, p.alergias, p.telefone as paciente_tel
        FROM consultas c JOIN pacientes p ON p.id=c.paciente_id
        WHERE c.medico_id=${medico.id}
        AND DATE(c.agendada_para)=${data}
        ORDER BY c.agendada_para ASC`

  return NextResponse.json({ data: rows })
}

export async function POST(req: NextRequest) {
  const medico = autenticarRequisicao(req)
  if (!medico) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { paciente_id, agendada_para, tipo } = await req.json()
  if (!paciente_id || !agendada_para)
    return NextResponse.json({ error: 'paciente_id e agendada_para obrigatórios' }, { status: 400 })

  const { v4: uuidv4 } = await import('uuid')
  const sala_id = `sala-${uuidv4().split('-')[0]}`

  const rows = await sql`
    INSERT INTO consultas (paciente_id, medico_id, agendada_para, tipo, sala_id, status)
    VALUES (${paciente_id}, ${medico.id}, ${agendada_para}, ${tipo||'teleconsulta'}, ${sala_id}, 'agendada')
    RETURNING *`
  return NextResponse.json({ data: rows[0] }, { status: 201 })
}
