// app/lib/db.ts — Neon Serverless PostgreSQL
import { neon } from '@neondatabase/serverless'

const DATABASE_URL = process.env.DATABASE_URL!

export const sql = neon(DATABASE_URL)

// Helper: query com array de params (para casos dinâmicos)
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const rows = await sql(text, params)
  return rows as T[]
}

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS medicos (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome          VARCHAR(200) NOT NULL,
  crm           VARCHAR(20)  NOT NULL UNIQUE,
  cpf           VARCHAR(14)  NOT NULL UNIQUE,
  especialidade VARCHAR(100) NOT NULL DEFAULT 'Clínica Médica',
  email         VARCHAR(200) NOT NULL UNIQUE,
  telefone      VARCHAR(20),
  senha_hash    VARCHAR(255) NOT NULL,
  ativo         BOOLEAN DEFAULT true,
  criado_em     TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pacientes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome            VARCHAR(200) NOT NULL,
  cpf             VARCHAR(14)  NOT NULL UNIQUE,
  rg              VARCHAR(20),
  data_nasc       DATE NOT NULL,
  sexo            VARCHAR(20)  NOT NULL,
  telefone        VARCHAR(20)  NOT NULL,
  email           VARCHAR(200),
  endereco        TEXT,
  convenio        VARCHAR(100),
  num_carteirinha VARCHAR(50),
  alergias        TEXT[],
  observacoes     TEXT,
  ativo           BOOLEAN DEFAULT true,
  criado_em       TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consultas (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id   UUID NOT NULL REFERENCES pacientes(id),
  medico_id     UUID NOT NULL REFERENCES medicos(id),
  agendada_para TIMESTAMPTZ NOT NULL,
  iniciada_em   TIMESTAMPTZ,
  encerrada_em  TIMESTAMPTZ,
  status        VARCHAR(30) DEFAULT 'agendada',
  tipo          VARCHAR(30) DEFAULT 'teleconsulta',
  sala_id       VARCHAR(100),
  criado_em     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prontuarios (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id        UUID NOT NULL UNIQUE REFERENCES consultas(id),
  paciente_id        UUID NOT NULL REFERENCES pacientes(id),
  medico_id          UUID NOT NULL REFERENCES medicos(id),
  queixa_principal   TEXT,
  hda                TEXT,
  antecedentes       TEXT,
  medicamentos_uso   TEXT,
  alergias           TEXT,
  exame_fisico       TEXT,
  diagnosticos       JSONB DEFAULT '[]',
  prescricao         TEXT,
  exames_solicitados TEXT,
  transcricao        TEXT,
  sugestoes_ia       JSONB DEFAULT '[]',
  criado_em          TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transcricoes (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id UUID NOT NULL REFERENCES consultas(id),
  speaker     VARCHAR(20) NOT NULL,
  texto       TEXT NOT NULL,
  ts          TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultas_paciente   ON consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_consultas_medico     ON consultas(medico_id);
CREATE INDEX IF NOT EXISTS idx_consultas_status     ON consultas(status);
CREATE INDEX IF NOT EXISTS idx_prontuarios_paciente ON prontuarios(paciente_id);
CREATE INDEX IF NOT EXISTS idx_transcricoes_consulta ON transcricoes(consulta_id);
`
