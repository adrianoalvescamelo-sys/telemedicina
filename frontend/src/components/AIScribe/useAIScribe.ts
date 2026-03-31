import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

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

export type ScribeStatus =
  | 'idle'
  | 'waiting_consent'
  | 'recording'
  | 'generating'
  | 'done'
  | 'error';

interface UseAIScribeOptions {
  consultaId: string;
  paciente: PatientContext;
  wsUrl?: string;
}

export function useAIScribe({
  consultaId,
  paciente,
  wsUrl = import.meta.env.VITE_WS_URL ?? 'http://localhost:3000',
}: UseAIScribeOptions) {
  const [status, setStatus] = useState<ScribeStatus>('idle');
  const [transcript, setTranscript] = useState('');
  const [soapDraft, setSOAPDraft] = useState<SOAPDraft | null>(null);
  const [error, setError] = useState<string | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunkIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Conecta ao WebSocket ao montar
  useEffect(() => {
    const socket = io(`${wsUrl}/ai-scribe`, { autoConnect: false });
    socketRef.current = socket;

    socket.on('scribe:started', () => setStatus('recording'));

    socket.on('scribe:transcript', ({ acumulado }: { texto: string; acumulado: string }) => {
      setTranscript(acumulado);
    });

    socket.on('scribe:generating', () => setStatus('generating'));

    socket.on('scribe:soap_draft', ({ soap }: { soap: SOAPDraft; transcricaoCompleta: string }) => {
      setSOAPDraft(soap);
      setStatus('done');
    });

    socket.on('scribe:error', ({ message }: { code: string; message: string; transcricao?: string }) => {
      setError(message);
      setStatus('error');
    });

    socket.connect();

    return () => {
      socket.disconnect();
      stopMicrophone();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wsUrl]);

  const stopMicrophone = useCallback(() => {
    if (chunkIntervalRef.current) {
      clearInterval(chunkIntervalRef.current);
      chunkIntervalRef.current = null;
    }
    mediaRecorderRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    mediaRecorderRef.current = null;
    streamRef.current = null;
  }, []);

  /**
   * Chamado após o médico obter o consentimento do paciente.
   * Inicia a captura de microfone e o envio de chunks ao backend.
   */
  const startRecording = useCallback(async () => {
    setError(null);
    setTranscript('');
    setSOAPDraft(null);
    setStatus('recording');

    const socket = socketRef.current;
    if (!socket) return;

    // Solicita acesso ao microfone
    let stream: MediaStream;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setError('Permissão de microfone negada. Verifique as configurações do navegador.');
      setStatus('error');
      return;
    }

    streamRef.current = stream;

    // Informa o backend que a sessão foi iniciada com consentimento
    socket.emit('scribe:start', {
      consultaId,
      paciente,
      consentimentoAssinado: true,
    });

    // Envia chunks de áudio a cada 5 segundos para transcrição em tempo real
    const CHUNK_INTERVAL_MS = 5000;

    const sendChunk = () => {
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' });
      const chunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        const arrayBuffer = await blob.arrayBuffer();
        socket.emit('scribe:audio_chunk', { audio: arrayBuffer, mimeType: 'audio/webm' });
      };

      recorder.start();
      setTimeout(() => recorder.stop(), CHUNK_INTERVAL_MS - 100);
    };

    // Inicia o primeiro chunk imediatamente e depois a cada intervalo
    sendChunk();
    chunkIntervalRef.current = setInterval(sendChunk, CHUNK_INTERVAL_MS);
  }, [consultaId, paciente]);

  /**
   * Para a gravação e solicita a geração do rascunho SOAP final.
   */
  const stopRecording = useCallback(() => {
    stopMicrophone();
    setStatus('generating');
    socketRef.current?.emit('scribe:stop');
  }, [stopMicrophone]);

  /**
   * Abre o modal de consentimento (controla estado externo).
   */
  const requestConsent = useCallback(() => {
    setStatus('waiting_consent');
  }, []);

  const reset = useCallback(() => {
    stopMicrophone();
    setStatus('idle');
    setTranscript('');
    setSOAPDraft(null);
    setError(null);
  }, [stopMicrophone]);

  return {
    status,
    transcript,
    soapDraft,
    error,
    requestConsent,
    startRecording,
    stopRecording,
    reset,
  };
}
