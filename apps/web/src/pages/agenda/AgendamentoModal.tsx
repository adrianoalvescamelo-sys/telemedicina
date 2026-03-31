import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Calendar, Clock } from 'lucide-react'
import * as Dialog from '@radix-ui/react-dialog'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Badge } from '@/components/ui/Badge'
import { STATUS_CONSULTA, TIPOS_CONSULTA } from '@/lib/constants'

const schema = z.object({
  pacienteId:    z.string().min(1, 'Selecione um paciente'),
  medicoId:      z.string().min(1, 'Selecione um médico'),
  dataHora:      z.string().min(1, 'Informe data e hora'),
  duracao:       z.string(),
  tipo:          z.string(),
  convenioId:    z.string().optional(),
  observacoes:   z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface Props {
  open: boolean
  onClose: () => void
  selectedDate?: string
  event?: any
}

const mockPacientes = [
  { value: '1', label: 'Ana Lima' },
  { value: '2', label: 'João Silva' },
  { value: '3', label: 'Maria Costa' },
]

const mockMedicos = [
  { value: '1', label: 'Dra. Ucirlana Martins Ingraça Camelo' },
]

export function AgendamentoModal({ open, onClose, selectedDate, event }: Props) {
  const isEditing = !!event

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      tipo: 'presencial',
      duracao: '30',
    }
  })

  useEffect(() => {
    if (selectedDate) {
      const dt = selectedDate.slice(0, 16).replace('T', 'T')
      setValue('dataHora', dt)
    }
    if (event) {
      setValue('pacienteId', event.extendedProps?.pacienteId ?? '')
      setValue('medicoId',   event.extendedProps?.medicoId   ?? '')
    }
  }, [selectedDate, event, setValue])

  async function onSubmit(data: FormData) {
    console.log('Submitting:', data)
    // TODO: call API
    await new Promise(r => setTimeout(r, 500))
    reset()
    onClose()
  }

  const statusAtual = event?.extendedProps?.status
  const st = statusAtual ? STATUS_CONSULTA[statusAtual as keyof typeof STATUS_CONSULTA] : null

  return (
    <Dialog.Root open={open} onOpenChange={onClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 animate-in fade-in" />
        <Dialog.Content className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg animate-in zoom-in-95">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-primary-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary-600" />
                </div>
                <div>
                  <Dialog.Title className="text-base font-semibold text-text">
                    {isEditing ? 'Detalhes do Agendamento' : 'Novo Agendamento'}
                  </Dialog.Title>
                  {st && (
                    <Badge className={`${st.color} text-xs mt-0.5`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${st.dot} mr-1`} />
                      {st.label}
                    </Badge>
                  )}
                </div>
              </div>
              <Dialog.Close asChild>
                <Button variant="ghost" size="icon-sm"><X className="w-4 h-4" /></Button>
              </Dialog.Close>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
              <Select
                label="Paciente"
                required
                options={mockPacientes}
                placeholder="Selecionar paciente..."
                error={errors.pacienteId?.message}
                {...register('pacienteId')}
              />
              <Select
                label="Médico"
                required
                options={mockMedicos}
                placeholder="Selecionar médico..."
                error={errors.medicoId?.message}
                {...register('medicoId')}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Data e Hora"
                  type="datetime-local"
                  required
                  leftIcon={<Clock className="w-4 h-4" />}
                  error={errors.dataHora?.message}
                  {...register('dataHora')}
                />
                <Select
                  label="Duração"
                  options={[
                    { value: '15', label: '15 min' },
                    { value: '30', label: '30 min' },
                    { value: '45', label: '45 min' },
                    { value: '60', label: '1 hora' },
                  ]}
                  {...register('duracao')}
                />
              </div>
              <Select
                label="Tipo de Consulta"
                options={TIPOS_CONSULTA.map(t => ({ value: t.value, label: t.label }))}
                {...register('tipo')}
              />
              <Input
                label="Observações"
                placeholder="Motivo da consulta..."
                {...register('observacoes')}
              />

              {/* Actions */}
              <div className="flex justify-between pt-2">
                {isEditing && (
                  <Button type="button" variant="danger" size="sm">
                    Cancelar Consulta
                  </Button>
                )}
                <div className="flex gap-2 ml-auto">
                  <Button type="button" variant="outline" size="sm" onClick={onClose}>
                    Fechar
                  </Button>
                  <Button type="submit" size="sm" loading={isSubmitting}>
                    {isEditing ? 'Salvar Alterações' : 'Agendar'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
