import { NextRequest, NextResponse } from 'next/server'
import { autenticarRequisicao } from '@/app/lib/auth'
import { sql } from '@/app/lib/db'

export async function GET(req: NextRequest) {
  const medico = autenticarRequisicao(req)
  if (!medico) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const rows = await sql`SELECT id,nome,crm,especialidade,email,telefone FROM medicos WHERE id=${medico.id}`
  return NextResponse.json({ data: rows[0] })
}
