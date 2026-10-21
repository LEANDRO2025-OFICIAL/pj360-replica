-- Schema inicial (Supabase / Postgres 15+). Primeira migration.
-- Acesso: Row Level Security em todas as tabelas, por escritório (escritorio_id).
-- Dinheiro: bigint em centavos. shortcut: só BRL, sem coluna de moeda; adicionar se um dia houver outra moeda.

create extension if not exists pgcrypto;

-- updated_at automático
create or replace function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

-- ---------------------------------------------------------------------------
-- Escritórios e membros
-- ---------------------------------------------------------------------------
create table escritorios (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table membros (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references escritorios(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  telefone text,
  papel text not null default 'consultor' check (papel in ('admin', 'consultor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (escritorio_id, user_id)
);
create index on membros (user_id);

-- Usado por todas as policies. security definer evita recursão de RLS em membros.
create or replace function is_membro(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from membros m where m.escritorio_id = e and m.user_id = auth.uid());
$$;

create or replace function is_admin(e uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from membros m where m.escritorio_id = e and m.user_id = auth.uid() and m.papel = 'admin');
$$;

-- ---------------------------------------------------------------------------
-- Empresas (dados públicos do CNPJ, cache por escritório) e sócios
-- ---------------------------------------------------------------------------
create table empresas (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references escritorios(id) on delete cascade,
  cnpj char(14) not null check (cnpj ~ '^[0-9A-Z]{12}[0-9]{2}$'),  -- aceita o CNPJ alfanumérico (Receita, 2026)
  razao_social text not null,
  nome_fantasia text,
  natureza_juridica text,
  cnae_principal text,
  cnaes_secundarios text[] not null default '{}',
  atividade_economica text,
  segmento text,
  endereco jsonb not null default '{}',          -- logradouro, numero, bairro, municipio, uf, cep
  data_abertura date,
  optante_simples boolean,
  fonte text not null default 'brasilapi',
  dados_publicos jsonb not null default '{}',    -- resposta bruta da fonte, para auditoria
  dados_publicos_em timestamptz,                 -- quando a fonte foi consultada (cache)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (escritorio_id, cnpj)
);
create index on empresas (escritorio_id, razao_social);
create index on empresas (escritorio_id, segmento);

create table socios (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references escritorios(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete cascade,
  nome text not null,
  qualificacao text,                             -- tipo de sócio
  tipo_pessoa text not null check (tipo_pessoa in ('PF', 'PJ')),
  documento text,                                -- CPF vem mascarado da fonte pública; CNPJ completo
  participacao_pct numeric(5,2) check (participacao_pct between 0 and 100),
  email text,
  telefone text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on socios (empresa_id);
create index on socios (escritorio_id);

-- ---------------------------------------------------------------------------
-- Catálogo de soluções e teses (global, só leitura para usuários)
-- ---------------------------------------------------------------------------
create table solucoes (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,                     -- chave da regra em código: lib/solucoes/<slug>.ts
  nome text not null,
  grupo text not null check (grupo in ('TAX','CONTABILIDADE','CORPORATE','BANK','ENERGY','FAMILY','BROKERS')),
  pilar text check (pilar in ('reducao_custos','aumento_performance','compliance')),
  area text not null,
  bloco_relatorio text not null default 'institucional'
    check (bloco_relatorio in ('institucional','teses','faixas_risco','por_tributo','elegibilidade','recuperacao','aderencia','questionario','valuation')),
  texto_institucional text not null default '',
  ordem int not null default 0,
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on solucoes (grupo, ordem);

create table teses (
  id uuid primary key default gen_random_uuid(),
  solucao_id uuid not null references solucoes(id) on delete cascade,
  tributo text not null,
  descricao text not null,
  probabilidade text not null check (probabilidade in ('provavel','possivel','remota')),
  condicao jsonb not null default '{}',          -- ex.: {"regimes":["REAL"],"cnae_prefix":["46"]}
  ativo boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on teses (solucao_id);

-- ---------------------------------------------------------------------------
-- Diagnósticos, oportunidades, assessment, análise IA
-- ---------------------------------------------------------------------------
create table diagnosticos (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references escritorios(id) on delete cascade,
  empresa_id uuid not null references empresas(id) on delete restrict,  -- não apaga empresa com histórico
  criado_por uuid references auth.users(id) on delete set null,
  tipo text not null default 'cnpj' check (tipo in ('cnpj','procuracao')),
  origem_cliente text not null default 'prospeccao_fria'
    check (origem_cliente in ('prospeccao_fria','indicacao','minha_carteira')),
  observacao text,
  status text not null default 'aguardando_confirmacao'
    check (status in ('aguardando_confirmacao','processando','concluido','erro')),
  -- dados confirmados em S06 (entradas das regras)
  regime_tributario text check (regime_tributario in ('SIMPLES','PRESUMIDO','REAL','NAO_SE_ENQUADRA')),
  faturamento_inicial_cents bigint check (faturamento_inicial_cents >= 0),
  faturamento_final_cents bigint check (faturamento_final_cents >= 0),
  faturamento_medio_cents bigint check (faturamento_medio_cents >= 0),
  colaboradores_clt int check (colaboradores_clt >= 0),
  colaboradores_base text not null default 'cnpj' check (colaboradores_base in ('cnpj','matriz_filiais')),
  passivo_tributario_cents bigint check (passivo_tributario_cents >= 0),
  -- resultado
  total_estimado_cents bigint not null default 0,
  versao_regras text,                            -- qual versão do motor gerou as oportunidades
  erro text,
  confirmado_em timestamptz,
  concluido_em timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on diagnosticos (escritorio_id, created_at desc);
create index on diagnosticos (escritorio_id, total_estimado_cents desc);
create index on diagnosticos (empresa_id);
create index on diagnosticos (criado_por);

create table oportunidades (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references escritorios(id) on delete cascade,
  diagnostico_id uuid not null references diagnosticos(id) on delete cascade,
  solucao_id uuid not null references solucoes(id) on delete restrict,
  elegivel boolean not null,
  prioridade text not null check (prioridade in ('alto','medio','baixo')),
  estimativa_cents bigint check (estimativa_cents >= 0),  -- null = "Sem estimativa"
  score_aderencia smallint check (score_aderencia between 0 and 10),
  detalhe jsonb not null default '{}',           -- teses, faixas, quebra por tributo, faixa de recuperação
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (diagnostico_id, solucao_id)            -- reprocessar = upsert, nunca duplica
);
create index on oportunidades (escritorio_id);
create index on oportunidades (solucao_id);

create table assessments (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references escritorios(id) on delete cascade,
  diagnostico_id uuid not null unique references diagnosticos(id) on delete cascade,
  respostas jsonb not null default '{}',         -- {perfil:{...}, energia:{...}, tax:{...}, bank:{endividamentos:[...]}, ...}
  etapas_concluidas text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on assessments (escritorio_id);

create table analises_ia (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null references escritorios(id) on delete cascade,
  diagnostico_id uuid not null references diagnosticos(id) on delete cascade,
  status text not null default 'gerando' check (status in ('gerando','concluida','erro')),
  texto text,
  modelo text,
  erro text,
  criado_por uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on analises_ia (diagnostico_id, created_at desc);
create index on analises_ia (escritorio_id);

create table config_pdf (
  id uuid primary key default gen_random_uuid(),
  escritorio_id uuid not null unique references escritorios(id) on delete cascade,
  mostrar_cabecalho boolean not null default true,
  mostrar_intro boolean not null default true,
  mostrar_info_comercial boolean not null default true,
  texto_cabecalho text not null default '',
  texto_intro text not null default '',
  contato_nome text,
  contato_telefone text,
  contato_email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- triggers de updated_at
do $$
declare t text;
begin
  foreach t in array array['escritorios','membros','empresas','socios','solucoes','teses',
                           'diagnosticos','oportunidades','assessments','analises_ia','config_pdf']
  loop
    execute format('create trigger %I_updated_at before update on %I for each row execute function set_updated_at()', t, t);
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table escritorios   enable row level security;
alter table membros       enable row level security;
alter table empresas      enable row level security;
alter table socios        enable row level security;
alter table solucoes      enable row level security;
alter table teses         enable row level security;
alter table diagnosticos  enable row level security;
alter table oportunidades enable row level security;
alter table assessments   enable row level security;
alter table analises_ia   enable row level security;
alter table config_pdf    enable row level security;

create policy escritorio_ler on escritorios for select using (is_membro(id));
create policy escritorio_editar on escritorios for update using (is_admin(id));

create policy membros_ler on membros for select using (is_membro(escritorio_id));
create policy membros_admin on membros for all using (is_admin(escritorio_id)) with check (is_admin(escritorio_id));

-- tabelas do escritório: qualquer membro lê e escreve; só admin apaga
do $$
declare t text;
begin
  foreach t in array array['empresas','socios','diagnosticos','oportunidades','assessments','analises_ia']
  loop
    execute format('create policy %I_ler on %I for select using (is_membro(escritorio_id))', t, t);
    execute format('create policy %I_inserir on %I for insert with check (is_membro(escritorio_id))', t, t);
    execute format('create policy %I_editar on %I for update using (is_membro(escritorio_id)) with check (is_membro(escritorio_id))', t, t);
    execute format('create policy %I_apagar on %I for delete using (is_admin(escritorio_id))', t, t);
  end loop;
end $$;

create policy config_pdf_ler on config_pdf for select using (is_membro(escritorio_id));
create policy config_pdf_admin on config_pdf for all using (is_admin(escritorio_id)) with check (is_admin(escritorio_id));

-- catálogo: leitura para logados; escrita só via service role (seed/migration)
create policy solucoes_ler on solucoes for select to authenticated using (true);
create policy teses_ler on teses for select to authenticated using (true);

-- ---------------------------------------------------------------------------
-- KPIs do painel (S01/S04). security_invoker faz a view respeitar a RLS.
-- ---------------------------------------------------------------------------
create view kpis_escritorio with (security_invoker = true) as
select
  d.escritorio_id,
  count(distinct d.empresa_id)                                                      as cnpjs_consultados,
  count(distinct d.id) filter (where d.created_at >= date_trunc('month', now()))    as diagnosticos_mes,
  coalesce(sum(o.estimativa_cents) filter (where o.elegivel and s.pilar = 'reducao_custos'), 0)      as reducao_custos_cents,
  coalesce(sum(o.estimativa_cents) filter (where o.elegivel and s.pilar = 'aumento_performance'), 0) as aumento_performance_cents,
  coalesce(sum(o.estimativa_cents) filter (where o.elegivel and s.pilar = 'compliance'), 0)          as compliance_cents
from diagnosticos d
left join oportunidades o on o.diagnostico_id = d.id
left join solucoes s on s.id = o.solucao_id
where d.status = 'concluido'
group by d.escritorio_id;
