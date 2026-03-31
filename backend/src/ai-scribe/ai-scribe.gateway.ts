import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger, UseGuards } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { AIScribeService, PatientContext } from './ai-scribe.service';

interface SessionState {
  transcricaoAcumulada: string;
  paciente: PatientContext;
  consultaId: string;
  consentimentoRegistrado: boolean;
}

/**
 * Gateway WebSocket para o AI Scribe.
 *
 * Eventos recebidos (cliente → servidor):
 *   scribe:start       — inicia sessão com dados do paciente e consultaId
 *   scribe:audio_chunk — chunk de áudio em ArrayBuffer
 *   scribe:stop        — encerra a sessão e solicita o rascunho SOAP final
 *
 * Eventos emitidos (servidor → cliente):
 *   scribe:transcript  — texto transcrito do chunk recebido
 *   scribe:soap_draft  — rascunho SOAP completo gerado pela Claude API
 *   scribe:error       — mensagem de erro
 */
@WebSocketGateway({ namespace: '/ai-scribe', cors: { origin: '*' } })
export class AIScribeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(AIScribeGateway.name);
  private readonly sessions = new Map<string, SessionState>();

  constructor(private readonly aiScribeService: AIScribeService) {}

  handleConnection(client: Socket) {
    this.logger.log(`Cliente conectado: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.sessions.delete(client.id);
    this.logger.log(`Cliente desconectado: ${client.id}`);
  }

  @SubscribeMessage('scribe:start')
  handleStart(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      consultaId: string;
      paciente: PatientContext;
      consentimentoAssinado: boolean;
    },
  ) {
    if (!payload.consentimentoAssinado) {
      client.emit('scribe:error', {
        code: 'CONSENT_REQUIRED',
        message: 'O consentimento do paciente é obrigatório antes de iniciar a gravação.',
      });
      return;
    }

    this.sessions.set(client.id, {
      transcricaoAcumulada: '',
      paciente: payload.paciente,
      consultaId: payload.consultaId,
      consentimentoRegistrado: true,
    });

    this.logger.log(`Sessão iniciada: consulta ${payload.consultaId}`);
    client.emit('scribe:started', { consultaId: payload.consultaId });
  }

  @SubscribeMessage('scribe:audio_chunk')
  async handleAudioChunk(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { audio: ArrayBuffer; mimeType?: string },
  ) {
    const session = this.sessions.get(client.id);
    if (!session) {
      client.emit('scribe:error', {
        code: 'SESSION_NOT_FOUND',
        message: 'Sessão não iniciada. Envie scribe:start primeiro.',
      });
      return;
    }

    try {
      const buffer = Buffer.from(payload.audio);
      const texto = await this.aiScribeService.transcribeChunk(
        buffer,
        payload.mimeType ?? 'audio/webm',
      );

      if (texto.trim()) {
        session.transcricaoAcumulada += ` ${texto}`;
        client.emit('scribe:transcript', { texto, acumulado: session.transcricaoAcumulada.trim() });
      }
    } catch (err) {
      this.logger.error('Erro na transcrição do chunk', err);
      client.emit('scribe:error', {
        code: 'TRANSCRIPTION_ERROR',
        message: 'Falha ao transcrever o áudio. Verifique a conexão e tente novamente.',
      });
    }
  }

  @SubscribeMessage('scribe:stop')
  async handleStop(@ConnectedSocket() client: Socket) {
    const session = this.sessions.get(client.id);
    if (!session) {
      client.emit('scribe:error', {
        code: 'SESSION_NOT_FOUND',
        message: 'Nenhuma sessão ativa encontrada.',
      });
      return;
    }

    try {
      client.emit('scribe:generating', { message: 'Gerando rascunho SOAP...' });

      const soap = await this.aiScribeService.generateSOAPDraft(
        session.transcricaoAcumulada.trim(),
        session.paciente,
      );

      client.emit('scribe:soap_draft', {
        consultaId: session.consultaId,
        transcricaoCompleta: session.transcricaoAcumulada.trim(),
        soap,
      });

      this.sessions.delete(client.id);
      this.logger.log(`Rascunho SOAP gerado para consulta ${session.consultaId}`);
    } catch (err) {
      this.logger.error('Erro ao gerar rascunho SOAP', err);
      client.emit('scribe:error', {
        code: 'SOAP_GENERATION_ERROR',
        message: 'Falha ao gerar o rascunho SOAP. O texto transcrito foi preservado.',
        transcricao: session.transcricaoAcumulada.trim(),
      });
    }
  }
}
