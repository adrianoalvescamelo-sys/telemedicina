import { NextRequest, NextResponse } from 'next/server'
import { sql } from '@/app/lib/db'
import { autenticarRequisicao } from '@/app/lib/auth'

export async function GET(req: NextRequest) {
  const medico = autenticarRequisicao(req)
  if (!medico) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { searchParams } = new URL(req.url)
  const consulta_id = searchParams.get('consulta_id')
  const paciente_id = searchParams.get('paciente_id')

  if (consulta_id) {
    const rows = await sql`
      SELECT pr.*, c.agendada_para,
             p.nome as paciente_nome, p.data_nasc, p.alergias as paciente_alergias,
             m.nome as medico_nome, m.crm as medico_crm
      FROM prontuarios pr
      JOIN consultas c ON c.id=pr.consulta_id
      JOIN pacientes p ON p.id=pr.paciente_id
      JOIN medicos m ON m.id=pr.medico_id
      WHERE pr.consulta_id=${consulta_id}`
    return NextResponse.json({ data: rows[0] || null })
  }
  if (paciente_id) {
    const rows = await sql`
      SELECT pr.id, pr.criado_em, pr.diagnosticos, pr.queixa_principal,
             m.nome as medico_nome, c.agendada_para
      FROM prontuarios pr
      JOIN consultas c ON c.id=pr.consulta_id
      JOIN medicos m ON m.id=pr.medico_id
      WHERE pr.paciente_id=${paciente_id}
      ORDER BY pr.criado_em DESC`
    return NextResponse.json({ data: rows })
  }
  return NextResponse.json({ error: 'consulta_id ou paciente_id obrigatório' }, { status: 400 })
}

export async function POST(req: NextRequest) {
  const medico = autenticarRequisicao(req)
  if (!medico) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  const { consulta_id, paciente_id, ...d } = await req.json()
  if (!consulta_id || !paciente_id)
    return NextResponse.json({ error: 'consulta_id e paciente_id obrigatórios' }, { status: 400 })

  const rows = await sql`
    INSERT INTO prontuarios
      (consulta_id,paciente_id,medico_id,queixa_principal,hda,antecedentes,
       medicamentos_uso,alergias,exame_fisico,diagnosticos,prescricao,
       exames_solicitados,transcricao,sugestoes_ia)
    VALUES
      (${consulta_id},${paciente_id},${medico.id},${d.queixa_principal||null},
       ${d.hda||null},${d.antecedentes||null},${d.medicamentos_uso||null},
       ${d.alergias||null},${d.exame_fisico||null},
       ${JSON.stringify(d.diagnosticos||[])},${d.prescricao||null},
       ${d.exames_solicitados||null},${d.transcricao||null},
       ${JSON.stringify(d.sugestoes_ia||[])})
    ON CONFLICT (consulta_id) DO UPDATE SET
      queixa_principal=EXCLUDED.queixa_principal, hda=EXCLUDED.hda,
      antecedentes=EXCLUDED.antecedentes, medicamentos_uso=EXCLUDED.medicamentos_uso,
      alergias=EXCLUDED.alergias, exame_fisico=EXCLUDED.exame_fisico,
      diagnosticos=EXCLUDED.diagnosticos, prescricao=EXCLUDED.prescricao,
      exames_solicitados=EXCLUDED.exames_solicitados, transcricao=EXCLUDED.transcricao,
      sugestoes_ia=EXCLUDED.sugestoes_ia, atualizado_em=NOW()
    RETURNING *`
  return NextResponse.json({ data: rows[0] }, { status: 201 })
}
