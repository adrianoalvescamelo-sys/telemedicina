// app/api/ai/sugestoes/route.ts
// Sugestões diagnósticas em tempo real usando Claude (Anthropic)

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { autenticarRequisicao } from '@/app/lib/auth'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })
  const medico = autenticarRequisicao(req)
  if (!medico) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 })
  }

  const { transcricao, historico_paciente, sintomas_destacados } = await req.json()

  if (!transcricao) {
    return NextResponse.json({ error: 'Transcrição obrigatória' }, { status: 400 })
  }

  const prompt = `Você é um assistente de apoio diagnóstico para médicos. Analise a transcrição da consulta e o histórico do paciente para sugerir hipóteses diagnósticas.

HISTÓRICO DO PACIENTE:
${historico_paciente || 'Não informado'}

SINTOMAS DESTACADOS:
${sintomas_destacados?.join(', ') || 'Extrair da transcrição'}

TRANSCRIÇÃO DA CONSULTA:
${transcricao}

Responda APENAS com JSON válido, sem markdown, no seguinte formato:
{
  "sugestoes": [
    {
      "nome": "Nome do diagnóstico",
      "cid": "CID-10 (ex: I10)",
      "confianca": 0.94,
      "descricao": "Justificativa clínica baseada nos sintomas apresentados (2-3 frases)",
      "conduta_sugerida": "Sugestão de medicamento/exame/conduta (1-2 frases)",
      "alertas": ["Alerta de interação ou atenção especial, se houver"]
    }
  ],
  "resumo_clinico": "Resumo objetivo dos achados clínicos em 2 frases",
  "alertas_gerais": ["Lista de alertas importantes para o médico, se houver"]
}

Regras:
- Máximo 3 sugestões, ordenadas por confiança (maior primeiro)
- Confiança entre 0.0 e 1.0
- Alertas: apenas se houver interações medicamentosas ou sinais de alerta importantes
- Seja objetivo e clínico. Não invente sintomas que não estão na transcrição.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-opus-4-5',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
    })

    const content = message.content[0]
    if (content.type !== 'text') throw new Error('Resposta inesperada da IA')

    const resultado = JSON.parse(content.text)
    return NextResponse.json({ data: resultado })
  } catch (error) {
    console.error('Erro na IA:', error)
    return NextResponse.json(
      { error: 'Falha ao gerar sugestões diagnósticas' },
      { status: 500 }
    )
  }
}
