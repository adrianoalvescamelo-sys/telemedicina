import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  User, Phone, MapPin, Heart, Shield,
  AlertTriangle, ChevronRight, ChevronLeft, Save, Check
} from 'lucide-react'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select, Textarea } from '@/components/ui/Select'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/Card'
import { Topbar } from '@/components/layout/Topbar'
import { cn } from '@/lib/utils'

const schema = z.object({
  // Dados pessoais
  nomeCompleto:     z.string().min(3, 'Nome deve ter ao menos 3 caracteres'),
  cpf:              z.string().length(11, 'CPF inválido').regex(/^\d+$/, 'Apenas números'),
  dataNascimento:   z.string().min(1, 'Obrigatório'),
  sexo:             z.string().min(1, 'Obrigatório'),
  estadoCivil:      z.string().optional(),
  naturalidade:     z.string().optional(),
  // Contato
  telefoneWhatsapp: z.string().min(10, 'Telefone inválido'),
  email:            z.string().email('E-mail inválido').optional().or(z.literal('')),
  // Endereço
  cep:              z.string().optional(),
  logradouro:       z.string().optional(),
  numero:           z.string().optional(),
  complemento:      z.string().optional(),
  bairro:           z.string().optional(),
  cidade:           z.string().optional(),
  estado:           z.string().optional(),
  // Saúde
  tipoSanguineo:    z.string().optional(),
  alergias:         z.string().optional(),
  medicamentosUso:  z.string().optional(),
  doencasPrevias:   z.string().optional(),
  // Convênio
  convenioId:       z.string().optional(),
  numeroCarteirinha:z.string().optional(),
  validadeCarteirinha: z.string().optional(),
  // Emergência
  contatoEmergenciaNome: z.string().optional(),
  contatoEmergenciaTel:  z.string().optional(),
  // Consentimentos
  consentimentoLgpd: z.boolean(),
})

type FormData = z.infer<typeof schema>

const steps = [
  { id: 1, label: 'Dados Pessoais', icon: User },
  { id: 2, label: 'Contato',        icon: Phone },
  { id: 3, label: 'Saúde',          icon: Heart },
  { id: 4, label: 'Convênio',       icon: Shield },
  { id: 5, label: 'Confirmação',    icon: Check },
]

export default function NovoPacientePage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      nomeCompleto: '',
      cpf: '',
      dataNascimento: '',
      sexo: '',
      telefoneWhatsapp: '',
      consentimentoLgpd: false,
    },
  })

  const { register, handleSubmit, trigger, formState: { errors, isSubmitting } } = form

  const nextStep = async () => {
    const fieldsPerStep: Record<number, (keyof FormData)[]> = {
      1: ['nomeCompleto', 'cpf', 'dataNascimento', 'sexo'],
      2: ['telefoneWhatsapp'],
      3: [], 4: [], 5: [],
    }
    const ok = await trigger(fieldsPerStep[step])
    if (ok) setStep(s => Math.min(5, s + 1))
  }

  async function onSubmit(data: FormData) {
    console.log('Cadastrando paciente:', data)
    await new Promise(r => setTimeout(r, 800))
    navigate('/pacientes')
  }

  return (
    <div className="flex flex-col h-full">
      <Topbar title="Novo Paciente" subtitle="Preencha os dados do paciente" />

      <div className="p-6 max-w-3xl mx-auto w-full space-y-6">
        {/* Stepper */}
        <div className="flex items-center gap-0">
          {steps.map((s, i) => (
            <div key={s.id} className="flex items-center flex-1 last:flex-none">
              <button
                onClick={() => step > s.id && setStep(s.id)}
                className={cn(
                  'flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all',
                  step === s.id && 'bg-primary-100 text-primary-700',
                  step > s.id && 'text-green-600 cursor-pointer hover:bg-green-50',
                  step < s.id && 'text-muted cursor-default'
                )}
              >
                <div className={cn(
                  'w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0',
                  step === s.id && 'bg-primary-500 text-white',
                  step > s.id && 'bg-green-500 text-white',
                  step < s.id && 'bg-slate-200 text-slate-500',
                )}>
                  {step > s.id ? <Check className="w-3 h-3" /> : s.id}
                </div>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={cn('flex-1 h-px mx-1', step > s.id ? 'bg-green-300' : 'bg-slate-200')} />
              )}
            </div>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)}>
          <Card>
            <CardHeader>
              <CardTitle>{steps[step - 1].label}</CardTitle>
              <CardDescription>Passo {step} de {steps.length}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">

              {/* Step 1 – Dados Pessoais */}
              {step === 1 && (
                <>
                  <Input label="Nome Completo" required placeholder="Nome completo do paciente"
                    error={errors.nomeCompleto?.message} {...register('nomeCompleto')} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="CPF" required placeholder="Apenas números" maxLength={11}
                      error={errors.cpf?.message} {...register('cpf')} />
                    <Input label="Data de Nascimento" type="date" required
                      error={errors.dataNascimento?.message} {...register('dataNascimento')} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <Select label="Sexo" required
                      options={[{ value: 'F', label: 'Feminino' }, { value: 'M', label: 'Masculino' }, { value: 'outro', label: 'Outro' }]}
                      placeholder="Selecionar..." error={errors.sexo?.message} {...register('sexo')} />
                    <Select label="Estado Civil"
                      options={[
                        { value: 'solteiro', label: 'Solteiro(a)' }, { value: 'casado', label: 'Casado(a)' },
                        { value: 'divorciado', label: 'Divorciado(a)' }, { value: 'viuvo', label: 'Viúvo(a)' },
                      ]}
                      placeholder="Selecionar..." {...register('estadoCivil')} />
                  </div>
                  <Input label="Naturalidade" placeholder="Cidade de nascimento" {...register('naturalidade')} />
                </>
              )}

              {/* Step 2 – Contato e Endereço */}
              {step === 2 && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="WhatsApp" required placeholder="(66) 99999-9999"
                      error={errors.telefoneWhatsapp?.message} {...register('telefoneWhatsapp')} />
                    <Input label="E-mail" type="email" placeholder="email@exemplo.com"
                      error={errors.email?.message} {...register('email')} />
                  </div>
                  <div className="border-t border-border pt-4">
                    <p className="text-sm font-medium text-text mb-3 flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted" /> Endereço
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                      <Input label="CEP" placeholder="00000-000" {...register('cep')} />
                      <Input label="Cidade" placeholder="Sinop" className="col-span-2" {...register('cidade')} />
                    </div>
                    <div className="grid grid-cols-3 gap-3 mt-3">
                      <Input label="Logradouro" placeholder="Av. dos Tarumãs" className="col-span-2" {...register('logradouro')} />
                      <Input label="Número" placeholder="650" {...register('numero')} />
                    </div>
                    <div className="grid grid-cols-2 gap-3 mt-3">
                      <Input label="Bairro" placeholder="Setor Sul" {...register('bairro')} />
                      <Select label="Estado"
                        options={['MT','GO','MS','PA','AM','RO','AC','RR','AP','TO'].map(s => ({ value: s, label: s }))}
                        placeholder="UF" {...register('estado')} />
                    </div>
                  </div>
                  <div className="border-t border-border pt-4">
                    <p className="text-sm font-medium text-text mb-3">Contato de Emergência</p>
                    <div className="grid grid-cols-2 gap-3">
                      <Input label="Nome" placeholder="Nome completo" {...register('contatoEmergenciaNome')} />
                      <Input label="Telefone" placeholder="(66) 99999-9999" {...register('contatoEmergenciaTel')} />
                    </div>
                  </div>
                </>
              )}

              {/* Step 3 – Saúde */}
              {step === 3 && (
                <>
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-sm text-red-700">
                      Informações clínicas críticas. Preencha com atenção — alergias e medicamentos em uso são exibidos em destaque no prontuário.
                    </p>
                  </div>
                  <Select label="Tipo Sanguíneo"
                    options={['A+','A-','B+','B-','AB+','AB-','O+','O-','desconhecido'].map(v => ({ value: v, label: v }))}
                    placeholder="Selecionar..." {...register('tipoSanguineo')} />
                  <Textarea label="Alergias Conhecidas"
                    placeholder="Ex: Dipirona, Penicilina, látex... (separar por vírgula)"
                    rows={2} {...register('alergias')} />
                  <Textarea label="Medicamentos em Uso Contínuo"
                    placeholder="Ex: Losartana 50mg 1x/dia, Metformina 850mg 2x/dia..."
                    rows={3} {...register('medicamentosUso')} />
                  <Textarea label="Doenças Pré-existentes"
                    placeholder="Ex: Hipertensão arterial, Diabetes tipo 2, Asma..."
                    rows={2} {...register('doencasPrevias')} />
                </>
              )}

              {/* Step 4 – Convênio */}
              {step === 4 && (
                <>
                  <Select label="Plano de Saúde / Convênio"
                    options={[
                      { value: '1', label: 'Unimed' },
                      { value: '2', label: 'SulAmérica' },
                      { value: '3', label: 'Bradesco Saúde' },
                      { value: '4', label: 'Particular' },
                    ]}
                    placeholder="Selecionar convênio..." {...register('convenioId')} />
                  <div className="grid grid-cols-2 gap-3">
                    <Input label="Número da Carteirinha" placeholder="000.0000.0000.00"
                      {...register('numeroCarteirinha')} />
                    <Input label="Validade" type="date" {...register('validadeCarteirinha')} />
                  </div>
                  <div className="border-t border-border pt-4">
                    <label className="flex items-start gap-3 cursor-pointer">
                      <input type="checkbox" className="mt-0.5 accent-primary-500" {...register('consentimentoLgpd')} />
                      <span className="text-sm text-text">
                        O paciente autoriza o armazenamento e processamento dos seus dados de saúde pela Clínica Vida Popular,
                        em conformidade com a <strong>LGPD (Lei 13.709/2018)</strong>.
                        Os dados serão utilizados exclusivamente para fins de atendimento médico e gestão clínica.
                      </span>
                    </label>
                  </div>
                </>
              )}

              {/* Step 5 – Confirmação */}
              {step === 5 && (
                <div className="text-center py-8 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-text">Pronto para cadastrar</h3>
                    <p className="text-muted text-sm mt-1">
                      Revise os dados e clique em "Salvar Paciente" para concluir o cadastro.
                    </p>
                  </div>
                  <div className="bg-slate-50 rounded-xl p-4 text-left space-y-2 max-w-sm mx-auto">
                    <p className="text-sm"><strong>Nome:</strong> {form.watch('nomeCompleto') || '—'}</p>
                    <p className="text-sm"><strong>CPF:</strong> {form.watch('cpf') || '—'}</p>
                    <p className="text-sm"><strong>WhatsApp:</strong> {form.watch('telefoneWhatsapp') || '—'}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between mt-4">
            <Button type="button" variant="outline" onClick={() => step > 1 ? setStep(s => s - 1) : navigate('/pacientes')}>
              <ChevronLeft className="w-4 h-4" />
              {step === 1 ? 'Cancelar' : 'Voltar'}
            </Button>
            {step < 5 ? (
              <Button type="button" onClick={nextStep}>
                Próximo <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button type="submit" loading={isSubmitting}>
                <Save className="w-4 h-4" />
                Salvar Paciente
              </Button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
