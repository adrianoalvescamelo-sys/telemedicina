-- =============================================================
-- ESQUEMA DO BANCO DE DADOS - CLÍNICA VIDA POPULAR (SUPABASE)
-- =============================================================

-- 1. ENUMS
CREATE TYPE user_role AS ENUM ('admin', 'medico', 'recepcionista', 'paciente');
CREATE TYPE status_consulta AS ENUM ('agendado', 'confirmado', 'aguardando', 'em_atendimento', 'concluido', 'faltou', 'cancelado');
CREATE TYPE sexo_tipo AS ENUM ('M', 'F', 'outro');
CREATE TYPE tipo_sanguineo AS ENUM ('A+','A-','B+','B-','AB+','AB-','O+','O-','desconhecido');

-- 2. TABELAS PERFIL (AUXILIARES AO AUTH)
CREATE TABLE usuarios (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    nome        VARCHAR(255) NOT NULL,
    email       VARCHAR(255) UNIQUE NOT NULL,
    role        user_role NOT NULL DEFAULT 'paciente',
    ativo       BOOLEAN DEFAULT true,
    criado_em   TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PACIENTES
CREATE TABLE pacientes (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id          UUID REFERENCES usuarios(id),
    nome_completo       VARCHAR(255) NOT NULL,
    cpf                 VARCHAR(14) UNIQUE NOT NULL,
    data_nascimento     DATE NOT NULL,
    sexo                sexo_tipo,
    telefone_whatsapp   VARCHAR(20) NOT NULL,
    email               VARCHAR(255),
    tipo_sanguineo      tipo_sanguineo DEFAULT 'desconhecido',
    alergias            TEXT[],
    medicamentos_uso    TEXT,
    doencas_previas     TEXT,
    consentimento_lgpd  BOOLEAN DEFAULT false,
    criado_em           TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CONSULTAS / AGENDA
CREATE TABLE consultas (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    paciente_id         UUID NOT NULL REFERENCES pacientes(id),
    medico_id           UUID NOT NULL REFERENCES usuarios(id),
    data_hora_inicio    TIMESTAMPTZ NOT NULL,
    data_hora_fim       TIMESTAMPTZ NOT NULL,
    status              status_consulta DEFAULT 'agendado',
    tipo                VARCHAR(50) DEFAULT 'presencial',
    valor               DECIMAL(10,2),
    observacoes         TEXT,
    criado_em           TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- 5. PRONTUÁRIOS
CREATE TABLE prontuarios (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    consulta_id     UUID UNIQUE NOT NULL REFERENCES consultas(id),
    paciente_id     UUID NOT NULL REFERENCES pacientes(id),
    medico_id       UUID NOT NULL REFERENCES usuarios(id),
    soap_subjetivo  TEXT,
    soap_objetivo   TEXT,
    soap_avaliacao  TEXT,
    soap_plano      TEXT,
    diagnostico     TEXT,
    cids            TEXT[],
    assinado        BOOLEAN DEFAULT false,
    assinado_em     TIMESTAMPTZ,
    criado_em       TIMESTAMPTZ DEFAULT NOW(),
    atualizado_em   TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FINANCEIRO (LANÇAMENTOS)
CREATE TABLE lancamentos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    descricao       VARCHAR(255) NOT NULL,
    valor           DECIMAL(10,2) NOT NULL,
    tipo            VARCHAR(10) NOT NULL, -- 'entrada' ou 'saida'
    data_vencimento DATE NOT NULL,
    data_pagamento  TIMESTAMPTZ,
    status          VARCHAR(20) DEFAULT 'pendente', -- 'pendente', 'pago', 'atrasado'
    categoria       VARCHAR(50),
    paciente_id     UUID REFERENCES pacientes(id),
    criado_em       TIMESTAMPTZ DEFAULT NOW()
);

-- 7. ROW LEVEL SECURITY (RLS) - Exemplo Básico
ALTER TABLE pacientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultas ENABLE ROW LEVEL SECURITY;
ALTER TABLE prontuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE lancamentos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso para funcionários (admin, medico, recepcionista)
CREATE POLICY staff_access_pacientes ON pacientes 
    FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'medico', 'recepcionista')));

CREATE POLICY staff_access_consultas ON consultas 
    FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'medico', 'recepcionista')));

CREATE POLICY medical_access_prontuarios ON prontuarios 
    FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'medico')));

CREATE POLICY staff_access_lancamentos ON lancamentos 
    FOR ALL USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role IN ('admin', 'recepcionista')));

-- 8. TRIGGERS PARA USUÁRIOS (Sincronizar auth.users com public.usuarios)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.usuarios (id, nome, email, role)
  VALUES (new.id, new.raw_user_meta_data->>'nome', new.email, (new.raw_user_meta_data->>'role')::user_role);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
