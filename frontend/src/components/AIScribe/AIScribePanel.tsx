import React, { useState } from 'react';
import { ConsentModal } from './ConsentModal';
import { useAIScribe, PatientContext, SOAPDraft } from './useAIScribe';

interface AIScribePanelProps {
  consultaId: string;
  paciente: PatientContext;
  medicoNome: string;
  /** Callback chamado quando o médico aceita o rascunho SOAP */
  onApplyDraft: (draft: SOAPDraft) => void;
}

/**
 * Painel lateral colapsável do AI Scribe.
 * Gerencia o fluxo: consentimento → gravação → rascunho SOAP → aplicar ao prontuário.
 */
export function AIScribePanel({
  consultaId,
  paciente,
  medicoNome,
  onApplyDraft,
}: AIScribePanelProps) {
  const [isOpen, setIsOpen] = useState(false);

  const {
    status,
    transcript,
    soapDraft,
    error,
    requestConsent,
    startRecording,
    stopRecording,
    reset,
  } = useAIScribe({ consultaId, paciente });

  const handleActivate = () => {
    setIsOpen(true);
    requestConsent();
  };

  const handleConsentAccept = () => {
    startRecording();
  };

  const handleConsentDecline = () => {
    reset();
    setIsOpen(false);
  };

  const handleClose = () => {
    reset();
    setIsOpen(false);
  };

  const handleApply = () => {
    if (soapDraft) {
      onApplyDraft(soapDraft);
      handleClose();
    }
  };

  return (
    <>
      {/* Botão flutuante para ativar o AI Scribe */}
      {!isOpen && (
        <button
          onClick={handleActivate}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-blue-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.344.344a3.5 3.5 0 01-4.95 0l-.344-.344z" />
          </svg>
          Ativar IA
        </button>
      )}

      {/* Modal de consentimento */}
      {status === 'waiting_consent' && (
        <ConsentModal
          pacienteNome={paciente.nome}
          medicoNome={medicoNome}
          onAccept={handleConsentAccept}
          onDecline={handleConsentDecline}
        />
      )}

      {/* Painel lateral */}
      {isOpen && status !== 'waiting_consent' && (
        <aside className="fixed right-0 top-0 z-30 flex h-full w-[420px] flex-col border-l border-gray-200 bg-white shadow-2xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div className="flex items-center gap-2">
              <div
                className={`h-2 w-2 rounded-full ${
                  status === 'recording' ? 'animate-pulse bg-red-500' : 'bg-gray-300'
                }`}
              />
              <span className="text-sm font-semibold text-gray-800">Assistente de IA</span>
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs text-blue-700">
                {statusLabel(status)}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="rounded p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Conteúdo scrollável */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Erro */}
            {error && (
              <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                <strong>Erro:</strong> {error}
              </div>
            )}

            {/* Controles de gravação */}
            {(status === 'recording' || status === 'idle') && (
              <div className="flex gap-2">
                {status === 'recording' ? (
                  <button
                    onClick={stopRecording}
                    className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="1" />
                    </svg>
                    Parar e gerar rascunho
                  </button>
                ) : null}
              </div>
            )}

            {/* Transcrição em tempo real */}
            {(status === 'recording' || status === 'generating' || status === 'done') &&
              transcript && (
                <section>
                  <h3 className="mb-1 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Transcrição
                  </h3>
                  <div className="max-h-40 overflow-y-auto rounded-lg bg-gray-50 p-3 text-sm text-gray-700">
                    {transcript}
                  </div>
                </section>
              )}

            {/* Gerando rascunho */}
            {status === 'generating' && (
              <div className="flex items-center gap-3 rounded-lg bg-blue-50 p-4 text-sm text-blue-700">
                <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Gerando rascunho SOAP com IA...
              </div>
            )}

            {/* Rascunho SOAP */}
            {status === 'done' && soapDraft && (
              <SOAPDraftView draft={soapDraft} />
            )}
          </div>

          {/* Footer */}
          {status === 'done' && soapDraft && (
            <div className="border-t border-gray-200 p-4 space-y-2">
              <p className="text-xs text-gray-500 text-center">
                Revise o rascunho antes de aplicar ao prontuário.
                As sugestões da IA devem ser validadas pelo médico responsável.
              </p>
              <button
                onClick={handleApply}
                className="w-full rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700"
              >
                Aplicar ao prontuário
              </button>
            </div>
          )}
        </aside>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Sub-componente: exibe o rascunho SOAP formatado
// ---------------------------------------------------------------------------

function SOAPDraftView({ draft }: { draft: SOAPDraft }) {
  return (
    <div className="space-y-4 text-sm">
      {/* Aviso de validação */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
        Rascunho gerado por IA. Revise e valide todas as informações antes de assinar.
      </div>

      <Section title="Queixa Principal">
        <p className="text-gray-700">{draft.queixaPrincipal}</p>
      </Section>

      <Section title="Prontuário SOAP">
        <SOAPField label="S — Subjetivo" value={draft.soap.subjetivo} />
        <SOAPField label="O — Objetivo" value={draft.soap.objetivo} />
        <SOAPField label="A — Avaliação" value={draft.soap.avaliacao} />
        <SOAPField label="P — Plano" value={draft.soap.plano} />
      </Section>

      {draft.diagnosticosDiferenciais.length > 0 && (
        <Section title="Diagnósticos Diferenciais">
          <ul className="space-y-2">
            {draft.diagnosticosDiferenciais.map((d, i) => (
              <li key={i} className="rounded bg-gray-50 p-2">
                <div className="flex items-center justify-between">
                  <span className="font-medium text-gray-800">
                    {d.cid10} — {d.descricao}
                  </span>
                  <ProbBadge prob={d.probabilidade} />
                </div>
                <p className="mt-1 text-xs text-gray-600">{d.justificativa}</p>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {draft.redFlags.length > 0 && (
        <Section title="Red Flags">
          <ul className="space-y-1">
            {draft.redFlags.map((f, i) => (
              <li key={i} className="flex items-start gap-2 text-red-700">
                <span className="mt-0.5">⚠</span>
                <span>{f}</span>
              </li>
            ))}
          </ul>
        </Section>
      )}

      {draft.examesSugeridos.length > 0 && (
        <Section title="Exames Sugeridos">
          <ul className="list-inside list-disc space-y-1 text-gray-700">
            {draft.examesSugeridos.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        </Section>
      )}

      {draft.camposIncompletos.length > 0 && (
        <Section title="Campos com Informação Insuficiente">
          <ul className="list-inside list-disc space-y-1 text-amber-700">
            {draft.camposIncompletos.map((c, i) => (
              <li key={i}>{c}</li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">{title}</h3>
      {children}
    </section>
  );
}

function SOAPField({ label, value }: { label: string; value: string }) {
  return (
    <div className="mb-2">
      <span className="text-xs font-semibold text-gray-600">{label}</span>
      <p className="mt-0.5 text-gray-700">{value || '—'}</p>
    </div>
  );
}

function ProbBadge({ prob }: { prob: 'alta' | 'média' | 'baixa' }) {
  const colors = {
    alta: 'bg-red-100 text-red-700',
    média: 'bg-yellow-100 text-yellow-700',
    baixa: 'bg-green-100 text-green-700',
  };
  return (
    <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${colors[prob]}`}>
      {prob}
    </span>
  );
}

function statusLabel(status: string): string {
  const labels: Record<string, string> = {
    idle: 'Inativo',
    waiting_consent: 'Aguardando consentimento',
    recording: 'Gravando',
    generating: 'Gerando rascunho',
    done: 'Rascunho pronto',
    error: 'Erro',
  };
  return labels[status] ?? status;
}
