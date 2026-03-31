import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import { SupabaseService } from '../supabase/supabase.service';

@Injectable()
export class IaService {
  private readonly logger = new Logger(IaService.name);
  private openai: OpenAI;
  private anthropic: Anthropic;

  constructor(
    private configService: ConfigService,
    private supabase: SupabaseService,
  ) {
    const openaiKey = this.configService.get<string>('OPENAI_API_KEY');
    const anthropicKey = this.configService.get<string>('ANTHROPIC_API_KEY');

    if (openaiKey) this.openai = new OpenAI({ apiKey: openaiKey });
    if (anthropicKey) this.anthropic = new Anthropic({ apiKey: anthropicKey });
  }

  async saveAudioToSupabase(file: Express.Multer.File, storagePath: string): Promise<string> {
    const { data, error } = await this.supabase
      .getClient()
      .storage.from('audio_consultas')
      .upload(storagePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (error) {
      this.logger.error(`Error saving audio to Supabase Storage: ${error.message}`);
      throw error;
    }

    const { data: publicUrlData } = this.supabase
      .getClient()
      .storage.from('audio_consultas')
      .getPublicUrl(storagePath);

    return publicUrlData.publicUrl;
  }

  async transcribe(file: Express.Multer.File): Promise<string> {
    if (!this.openai) throw new Error('OpenAI API Key not configured');
    
    // Process audio via OpenAI Whisper
    const transcription = await this.openai.audio.transcriptions.create({
      file: await OpenAI.toFile(file.buffer, 'audio.webm'),
      model: 'whisper-1',
      language: 'pt',
    });

    return transcription.text;
  }

  async analyzeClinical(transcript: string, patientContext: any): Promise<string> {
    if (!this.anthropic) throw new Error('Anthropic API Key not configured');

    const prompt = `
      Você é um assistente clínico especializado para a Clínica Vida Popular. Analise a seguinte transcrição de consulta médica e gere um rascunho de prontuário no formato SOAP (Subjetivo, Objetivo, Avaliação, Plano).
      
      ESTRUTURA OBRIGATÓRIA (Use Markdown):
      - S (Subjetivo): Queixas relatadas pelo paciente, histórico atual.
      - O (Objetivo): Sinais vitais mencionados (PA, FC, Temp, etc.), achados do exame físico.
      - A (Avaliação): Hipóteses diagnósticas com códigos CID-10 correspondentes.
      - P (Plano): Prescrições sugeridas, exames solicitados, orientações e retornos.
      
      IDENTIFICAÇÃO DE RISCO:
      - Liste "Red Flags" caso identifique perigo clínico imediato.
      
      CONTEÚDO DA CONSULTA:
      ${transcript}
      
      DADOS DO PACIENTE:
      ${JSON.stringify(patientContext)}
      
      REGRAS:
      - Texto 100% em Português (Brasil).
      - Linguagem formal e direta (médica).
      - Se a transcrição for insuficiente, peça mais detalhes.
    `;

    const response = await this.anthropic.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      max_tokens: 2000,
      messages: [{ role: 'user', content: prompt }],
    });

    return (response.content[0] as any).text;
  }
}
