#!/usr/bin/env node
// Executa o schema SQL direto no Neon via variável de ambiente
// Uso: DATABASE_URL=... node scripts/migrate.js
// Ou após configurar .env.local: npm run db:migrate

const { neon } = require('@neondatabase/serverless')

const DATABASE_URL = process.env.DATABASE_URL
if (!DATABASE_URL) {
  console.error('❌  DATABASE_URL não definida. Configure .env.local ou exporte a variável.')
  process.exit(1)
}

const sql = neon(DATABASE_URL)

const SCHEMA = `
CREATE TABLE IF NOT EXISTS medicos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) NOT NULL,
  crm VARCHAR(20) NOT NULL UNIQUE,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  especialidade VARCHAR(100) NOT NULL DEFAULT 'Clínica Médica',
  email VARCHAR(200) NOT NULL UNIQUE,
  telefone VARCHAR(20),
  senha_hash VARCHAR(255) NOT NULL,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pacientes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(200) NOT NULL,
  cpf VARCHAR(14) NOT NULL UNIQUE,
  rg VARCHAR(20),
  data_nasc DATE NOT NULL,
  sexo VARCHAR(20) NOT NULL,
  telefone VARCHAR(20) NOT NULL,
  email VARCHAR(200),
  endereco TEXT,
  convenio VARCHAR(100),
  num_carteirinha VARCHAR(50),
  alergias TEXT[],
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consultas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id UUID NOT NULL REFERENCES pacientes(id),
  medico_id UUID NOT NULL REFERENCES medicos(id),
  agendada_para TIMESTAMPTZ NOT NULL,
  iniciada_em TIMESTAMPTZ,
  encerrada_em TIMESTAMPTZ,
  status VARCHAR(30) DEFAULT 'agendada',
  tipo VARCHAR(30) DEFAULT 'teleconsulta',
  sala_id VARCHAR(100),
  criado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prontuarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id UUID NOT NULL UNIQUE REFERENCES consultas(id),
  paciente_id UUID NOT NULL REFERENCES pacientes(id),
  medico_id UUID NOT NULL REFERENCES medicos(id),
  queixa_principal TEXT,
  hda TEXT,
  antecedentes TEXT,
  medicamentos_uso TEXT,
  alergias TEXT,
  exame_fisico TEXT,
  diagnosticos JSONB DEFAULT '[]',
  prescricao TEXT,
  exames_solicitados TEXT,
  transcricao TEXT,
  sugestoes_ia JSONB DEFAULT '[]',
  criado_em TIMESTAMPTZ DEFAULT NOW(),
  atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS transcricoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consulta_id UUID NOT NULL REFERENCES consultas(id),
  speaker VARCHAR(20) NOT NULL,
  texto TEXT NOT NULL,
  ts TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_consultas_paciente ON consultas(paciente_id);
CREATE INDEX IF NOT EXISTS idx_consultas_medico ON consultas(medico_id);
CREATE INDEX IF NOT EXISTS idx_consultas_status ON consultas(status);
CREATE INDEX IF NOT EXISTS idx_prontuarios_paciente ON prontuarios(paciente_id);
CREATE INDEX IF NOT EXISTS idx_transcricoes_consulta ON transcricoes(consulta_id);
`

async function main() {
  console.log('🔄  Conectando ao banco Neon...')
  const stmts = SCHEMA.split(';').map(s => s.trim()).filter(s => s.length > 10)
  for (const stmt of stmts) {
    try {
      await sql(stmt)
      const name = stmt.match(/(TABLE|INDEX)\s+IF NOT EXISTS\s+(\S+)/i)?.[2] || '...'
      console.log(`  ✅  ${name}`)
    } catch (e) {
      console.error(`  ❌  Erro: ${e.message}`)
    }
  }

  // Cria médica padrão
  const bcrypt = require('bcryptjs')
  const hash = await bcrypt.hash('vidapopular2024', 12)
  try {
    await sql`
      INSERT INTO medicos (nome, crm, cpf, especialidade, email, telefone, senha_hash)
      VALUES (
        'Dra. Ucirlana Martins Ingraça Camelo',
        '12894-MT', '93742614134', 'Clínica Médica',
        'ucirlana@vidapopular.com.br', '66999999999', ${hash}
      ) ON CONFLICT (crm) DO NOTHING
    `
    console.log('  ✅  Médica padrão criada (ou já existia)')
  } catch(e) {
    console.log('  ⚠️   Médica padrão:', e.message)
  }

  console.log('\n✅  Migração concluída!')
  console.log('📧  Login: ucirlana@vidapopular.com.br')
  console.log('🔑  Senha: vidapopular2024')
  console.log('⚠️   Troque a senha após o primeiro acesso!\n')
}

main().catch(e => { console.error(e); process.exit(1) })
