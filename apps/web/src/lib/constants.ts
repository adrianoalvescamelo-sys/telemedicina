// Dados fixos da Clínica Vida Popular
export const CLINICA = {
  nome: 'Clínica Vida Popular',
  razaoSocial: 'U. Martins Ingraça – Lana Assistencia Medica',
  cnpj: '42.921.417/0001-37',
  endereco: 'Av. dos Tarumãs, 650-B, Setor Residencial Sul',
  cidade: 'Sinop',
  estado: 'MT',
  cep: '78.550-001',
  medicaResponsavel: 'Dra. Ucirlana Martins Ingraça Camelo',
  crm: '12894-MT',
  telefone: '',
  email: '',
  whatsapp: '',
} as const

export const STATUS_CONSULTA = {
  agendado:       { label: 'Agendado',        color: 'bg-blue-100 text-blue-700',   dot: 'bg-blue-500'   },
  confirmado:     { label: 'Confirmado',       color: 'bg-green-100 text-green-700', dot: 'bg-green-500'  },
  aguardando:     { label: 'Aguardando',       color: 'bg-yellow-100 text-yellow-700',dot:'bg-yellow-500' },
  em_atendimento: { label: 'Em Atendimento',   color: 'bg-purple-100 text-purple-700',dot:'bg-purple-500' },
  concluido:      { label: 'Concluído',        color: 'bg-slate-100 text-slate-700', dot: 'bg-slate-400'  },
  faltou:         { label: 'Faltou',           color: 'bg-red-100 text-red-700',     dot: 'bg-red-500'    },
  cancelado:      { label: 'Cancelado',        color: 'bg-red-50 text-red-500',      dot: 'bg-red-300'    },
} as const

export const FORMAS_PAGAMENTO = [
  { value: 'dinheiro',          label: 'Dinheiro' },
  { value: 'pix',               label: 'PIX' },
  { value: 'debito',            label: 'Cartão Débito' },
  { value: 'credito',           label: 'Cartão Crédito' },
  { value: 'credito_parcelado', label: 'Crédito Parcelado' },
  { value: 'convenio',          label: 'Convênio' },
] as const

export const TIPOS_CONSULTA = [
  { value: 'presencial',   label: 'Presencial' },
  { value: 'teleconsulta', label: 'Teleconsulta' },
  { value: 'retorno',      label: 'Retorno' },
  { value: 'urgencia',     label: 'Urgência' },
  { value: 'procedimento', label: 'Procedimento' },
] as const

export const USER_ROLES = {
  admin:          { label: 'Administrador',  color: 'bg-purple-100 text-purple-700' },
  medico:         { label: 'Médico',         color: 'bg-blue-100 text-blue-700'    },
  recepcionista:  { label: 'Recepcionista',  color: 'bg-green-100 text-green-700'  },
  paciente:       { label: 'Paciente',       color: 'bg-slate-100 text-slate-700'  },
} as const

export const CALENDAR_COLORS: Record<string, string> = {
  agendado:       '#3B82F6',
  confirmado:     '#22C55E',
  aguardando:     '#F59E0B',
  em_atendimento: '#8B5CF6',
  concluido:      '#94A3B8',
  faltou:         '#EF4444',
  cancelado:      '#FCA5A5',
}
