// app/types/index.ts

export interface Medico {
  id: string
  nome: string
  crm: string
  cpf: string
  especialidade: string
  email: string
  telefone?: string
  ativo: boolean
  criado_em: string
}

export interface Paciente {
  id: string
  nome: string
  cpf: string
  rg?: string
  data_nasc: string
  sexo: string
  telefone: string
  email?: string
  endereco?: string
  convenio?: string
  num_carteirinha?: string
  alergias?: string[]
  observacoes?: string
  ativo: boolean
  criado_em: string
}

export interface Consulta {
  id: string
  paciente_id: string
  medico_id: string
  agendada_para: string
  iniciada_em?: string
  encerrada_em?: string
  status: 'agendada' | 'aguardando' | 'em_andamento' | 'encerrada' | 'cancelada'
  tipo: 'teleconsulta' | 'presencial'
  sala_id?: string
  paciente?: Paciente
  medico?: Medico
}

export interface Diagnostico {
  cid: string
  descricao: string
  tipo: 'principal' | 'secundario' | 'diferencial'
}

export interface SugestaoIA {
  nome: string
  cid: string
  confianca: number
  descricao: string
  conduta_sugerida: string
  alertas?: string[]
  aceita?: boolean
}

export interface Prontuario {
  id: string
  consulta_id: string
  paciente_id: string
  medico_id: string
  queixa_principal?: string
  hda?: string
  antecedentes?: string
  medicamentos_uso?: string
  alergias?: string
  exame_fisico?: string
  diagnosticos: Diagnostico[]
  prescricao?: string
  exames_solicitados?: string
  transcricao?: string
  sugestoes_ia: SugestaoIA[]
  criado_em: string
  atualizado_em: string
}

export interface ChunkTranscricao {
  speaker: 'medico' | 'paciente'
  texto: string
  ts: string
}

export interface APIResponse<T = unknown> {
  data?: T
  error?: string
  message?: string
}
