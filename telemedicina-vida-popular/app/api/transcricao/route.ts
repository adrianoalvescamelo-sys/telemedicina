// app/api/transcricao/route.ts
// Transcrição de áudio via OpenAI Whisper
// Recebe chunks de áudio (webm/wav) e retorna texto

import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { sql } from '@/app/lib/db'
import { autenticarRequisicao } from '@/app/lib/auth'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! })

export async function POST(req: NextRequest) {
  const medico = autenticarRequisicao(req)
  if (!medico) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  try {
    const formData = await req.formData()
    const audio = formData.get('audio') as File
    const consulta_id = formData.get('consulta_id') as string
    const speaker = (formData.get('speaker') as string) || 'paciente'

    if (!audio) return NextResponse.json({ error: 'Áudio obrigatório' }, { status: 400 })

    // Transcreve com Whisper
    const transcricao = await openai.audio.transcriptions.create({
      file: audio,
      model: 'whisper-1',
      language: 'pt',
      prompt: 'Consulta médica em português brasileiro. Termos técnicos médicos.',
    })

    const texto = transcricao.text.trim()
    if (!texto) return NextResponse.json({ data: { texto: '' } })

    // Salva chunk no banco se tiver consulta_id
    if (consulta_id) {
      await sql`
        INSERT INTO transcricoes (consulta_id, speaker, texto)
        VALUES (${consulta_id}, ${speaker}, ${texto})
      `
    }

    return NextResponse.json({ data: { texto, speaker } })
  } catch (error) {
    console.error('Erro na transcrição:', error)
    return NextResponse.json({ error: 'Falha na transcrição' }, { status: 500 })
  }
}

// Busca transcrição completa de uma consulta
export async function GET(req: NextRequest) {
  const medico = autenticarRequisicao(req)
  if (!medico) return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })

  const { searchParams } = new URL(req.url)
  const consulta_id = searchParams.get('consulta_id')
  if (!consulta_id) return NextResponse.json({ error: 'consulta_id obrigatório' }, { status: 400 })

  const rows = await sql`
    SELECT speaker, texto, ts
    FROM transcricoes
    WHERE consulta_id = ${consulta_id}
    ORDER BY ts ASC
  `

  const textoCompleto = rows
    .map(r => `${r.speaker === 'medico' ? 'Médico' : 'Paciente'}: ${r.texto}`)
    .join('\n')

  return NextResponse.json({ data: { chunks: rows, texto_completo: textoCompleto } })
}
