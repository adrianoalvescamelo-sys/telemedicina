import React from 'react';

interface ConsentModalProps {
  pacienteNome: string;
  medicoNome: string;
  onAccept: () => void;
  onDecline: () => void;
}

/**
 * Exibe o Termo de Consentimento para gravação/transcrição da consulta.
 * Deve ser apresentado ao paciente antes de ativar o AI Scribe.
 * Conforme LGPD e normas do CFM.
 */
export function ConsentModal({
  pacienteNome,
  medicoNome,
  onAccept,
  onDecline,
}: ConsentModalProps) {
  const hoje = new Date().toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-w-lg rounded-2xl bg-white p-6 shadow-xl">
        {/* Cabeçalho */}
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100">
            <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Termo de Consentimento para Uso de IA
            </h2>
            <p className="text-sm text-gray-500">Clínica Vida Popular</p>
          </div>
        </div>

        {/* Corpo do termo */}
        <div className="mb-6 space-y-3 rounded-lg bg-gray-50 p-4 text-sm text-gray-700">
          <p>
            <strong>Paciente:</strong> {pacienteNome}
            <br />
            <strong>Médico responsável:</strong> {medicoNome}
            <br />
            <strong>Data:</strong> {hoje}
          </p>

          <p>
            Durante esta consulta, com seu consentimento, o sistema irá realizar a{' '}
            <strong>transcrição automática da conversa por inteligência artificial</strong>. O
            objetivo é apoiar o médico no preenchimento do prontuário eletrônico.
          </p>

          <ul className="list-inside list-disc space-y-1 text-gray-600">
            <li>O áudio será processado por IA e armazenado de forma criptografada.</li>
            <li>O conteúdo será vinculado ao seu prontuário médico.</li>
            <li>O médico revisará e validará todas as informações antes de assinar.</li>
            <li>Você pode revogar este consentimento a qualquer momento.</li>
            <li>Seus dados são protegidos pela <strong>LGPD</strong> (Lei 13.709/2018).</li>
          </ul>

          <p className="text-xs text-gray-500">
            Este consentimento será registrado com data, hora e identificação do dispositivo,
            conforme exigido pela legislação vigente.
          </p>
        </div>

        {/* Ações */}
        <div className="flex gap-3">
          <button
            onClick={onDecline}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Não autorizo
          </button>
          <button
            onClick={onAccept}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
          >
            Autorizo a gravação
          </button>
        </div>
      </div>
    </div>
  );
}
