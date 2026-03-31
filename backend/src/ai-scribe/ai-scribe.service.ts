import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { Readable } from 'stream';

export interface PatientContext {
  nome: string;
  dataNascimento: string;
  alergias: string[];
  medicamentosEmUso: string[];
  doencasPreExistentes: string[];
  prontuarioAnterior?: string;
}

export interface SOAPDraft {
  queixaPrincipal: string;
  soap: {
    subjetivo: string;
    objetivo: string;
    avaliacao: string;
    plano: string;
  };
  diagnosticosDiferenciais: Array<{
    cid10: string;
    descricao: string;
    justificativa: string;
    probabilidade: 'alta' | 'média' | 'baixa';
  }>;
  examesSugeridos: string[];
  redFlags: string[];
  camposIncompletos: string[];
}

@Injectable()
export class AIScribeService {
  private readonly logger = new Logger(AIScribeService.name);
  private readonly openai: OpenAI;
  private readonly anthropic: Anthropic;

  constructor(private readonly config: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.config.getOrThrow<string>('OPENAI_API_KEY'),
    });
    this.anthropic = new Anthropic({
      apiKey: this.config.getOrThrow<string>('ANTHROPIC_API_KEY'),
    });
  }

  /**
   * Transcreve um chunk de áudio usando OpenAI Whisper.
   * O áudio deve ser enviado em formato WebM/Opus ou WAV.
   */
  async transcribeChunk(audioBuffer: Buffer, mimeType = 'audio/webm'): Promise<string> {
    const extension = mimeType.includes('wav') ? 'wav' : 'webm';
    const filename = `audio_chunk.${extension}`;

    const readable = Readable.from(audioBuffer);
    const file = await OpenAI.toFile(readable, filename, { type: mimeType });

    const response = await this.openai.audio.transcriptions.create({
      file,
      model: 'whisper-1',
      language: 'pt',
      prompt:
        'Transcrição de consulta médica em português brasileiro. ' +
        'Termos médicos comuns: pressão arterial, frequência cardíaca, ' +
        'ausculta, dispneia, disfagia, taquicardia, hipertensão, diabetes.',
    });

    return response.text;
  }

  /**
   * Gera o rascunho SOAP completo via Claude API com base na
   * transcrição acumulada e no contexto do paciente.
   */
  async generateSOAPDraft(
    transcricao: string,
    paciente: PatientContext,
  ): Promise<SOAPDraft> {
    const prompt = this.buildPrompt(transcricao, paciente);

    const message = await this.anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      throw new Error('Resposta inesperada da Claude API');
    }

    return this.parseSOAPResponse(content.text);
  }

  private buildPrompt(transcricao: string, paciente: PatientContext): string {
    return `Você é um assistente médico clínico da Clínica Vida Popular, em Sinop/MT.
Sua função é apoiar o médico durante o atendimento — nunca substituí-lo.

Com base na transcrição da consulta e no histórico do paciente fornecido,
gere as seguintes seções em formato JSON estrito:

{
  "queixaPrincipal": "Resumo objetivo em até 2 frases",
  "soap": {
    "subjetivo": "O que o paciente relatou",
    "objetivo": "Sinais vitais e achados do exame físico mencionados",
    "avaliacao": "Hipóteses diagnósticas com CID-10, ordenadas por probabilidade",
    "plano": "Conduta, medicamentos, exames e retorno"
  },
  "diagnosticosDiferenciais": [
    {
      "cid10": "X00",
      "descricao": "Nome da condição",
      "justificativa": "Breve justificativa clínica",
      "probabilidade": "alta|média|baixa"
    }
  ],
  "examesSugeridos": ["Apenas os clinicamente pertinentes ao caso"],
  "redFlags": ["Sinais de alerta que merecem atenção imediata"],
  "camposIncompletos": ["Liste os campos que não puderam ser preenchidos por falta de informação na transcrição"]
}

Regras obrigatórias:
- Responda SOMENTE com o JSON, sem texto adicional antes ou depois.
- Responda sempre em português brasileiro formal e clínico.
- Seja conciso — o médico revisará tudo.
- Nunca invente dados ausentes na transcrição.
- Sinalize em "camposIncompletos" quando alguma informação estiver ausente.
- Sempre deixe claro (via camposIncompletos) que as sugestões precisam ser validadas pelo médico responsável.
- Máximo de 5 diagnósticos diferenciais.

--- TRANSCRIÇÃO DA CONSULTA ---
${transcricao || '[Nenhuma transcrição disponível]'}

--- DADOS DO PACIENTE ---
Nome: ${paciente.nome}
Data de nascimento: ${paciente.dataNascimento}
Alergias: ${paciente.alergias.length ? paciente.alergias.join(', ') : 'Nenhuma conhecida'}
Medicamentos em uso: ${paciente.medicamentosEmUso.length ? paciente.medicamentosEmUso.join(', ') : 'Nenhum'}
Doenças pré-existentes: ${paciente.doencasPreExistentes.length ? paciente.doencasPreExistentes.join(', ') : 'Nenhuma'}
${paciente.prontuarioAnterior ? `\nÚltimo prontuário:\n${paciente.prontuarioAnterior}` : ''}
`;
  }

  private parseSOAPResponse(raw: string): SOAPDraft {
    try {
      // Remove possíveis blocos de código markdown caso a API os inclua
      const cleaned = raw.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleaned) as SOAPDraft;
    } catch {
      this.logger.error('Falha ao parsear resposta da Claude API', raw);
      throw new Error('Formato de resposta inválido da Claude API');
    }
  }
}
