// app/api/ai/stream/route.ts
// Sugestões em streaming (Server-Sent Events) para atualização ao vivo

import { NextRequest } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { autenticarRequisicao } from '@/app/lib/auth'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! })

export async function POST(req: NextRequest) {
  const medico = autenticarRequisicao(req)
  if (!medico) return new Response('Não autorizado', { status: 401 })

  const { transcricao, historico } = await req.json()

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await anthropic.messages.create({
          model: 'claude-opus-4-5',
          max_tokens: 800,
          stream: true,
          messages: [{
            role: 'user',
            content: `Com base nesta transcrição médica, forneça em streaming 2-3 hipóteses diagnósticas resumidas com CID-10 e conduta. Seja direto e clínico.

Histórico: ${historico || 'N/A'}
Transcrição: ${transcricao}

Formato: para cada diagnóstico, inicie com "DIAG:" seguido do nome, CID e conduta em uma linha.`
          }],
        })

        for await (const event of response) {
          if (
            event.type === 'content_block_delta' &&
            event.delta.type === 'text_delta'
          ) {
            const data = `data: ${JSON.stringify({ texto: event.delta.text })}\n\n`
            controller.enqueue(encoder.encode(data))
          }
        }

        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      } catch (error) {
        console.error('Stream error:', error)
        controller.enqueue(encoder.encode('data: [ERROR]\n\n'))
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
