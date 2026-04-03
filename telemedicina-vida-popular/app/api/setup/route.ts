// app/api/setup/route.ts — inicializa banco no Neon
import { NextRequest, NextResponse } from 'next/server'
import { sql, SCHEMA_SQL } from '@/app/lib/db'

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-setup-secret')
  if (secret !== process.env.JWT_SECRET) {
    return NextResponse.json({ error: 'Acesso negado' }, { status: 403 })
  }

  try {
    const statements = SCHEMA_SQL
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 10)

    for (const stmt of statements) {
      await sql(stmt)
    }

    const bcrypt = await import('bcryptjs')
    const hash = await bcrypt.hash('vidapopular2024', 12)

    await sql`
      INSERT INTO medicos (nome, crm, cpf, especialidade, email, telefone, senha_hash)
      VALUES (
        'Dra. Ucirlana Martins Ingraça Camelo',
        '12894-MT',
        '93742614134',
        'Clínica Médica',
        'ucirlana@vidapopular.com.br',
        '66999999999',
        ${hash}
      )
      ON CONFLICT (crm) DO NOTHING
    `

    return NextResponse.json({
      ok: true,
      message: 'Banco inicializado!',
      acesso: { email: 'ucirlana@vidapopular.com.br', senha: 'vidapopular2024' }
    })
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 })
  }
}
