-- ============================================================
-- SCHEMA DO BANCO DE DADOS — CSP GESTÃO 2027
-- Execute este SQL no Supabase SQL Editor
-- ============================================================

-- Extensão para UUIDs
create extension if not exists "uuid-ossp";

-- ============================================================
-- TABELA: profiles (dados dos usuários por papel)
-- ============================================================
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  nome text not null,
  email text not null,
  role text not null check (role in ('coordenadora', 'direcao', 'professor')),
  turma text,
  ativo boolean default true,
  created_at timestamptz default now()
);

-- Trigger: criar perfil automaticamente ao registrar usuário
create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, nome, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'professor')
  );
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ============================================================
-- TABELA: eventos (calendário escolar)
-- ============================================================
create table eventos (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  descricao text,
  data_inicio date not null,
  data_fim date,
  horario time,
  tipo text not null check (tipo in (
    'Pedagógico','Cultural','Esportivo','Administrativo',
    'Feriado','Recesso','Avaliação','Simulado','Formação','Reunião'
  )),
  bimestre text check (bimestre in ('1º','2º','3º','4º','Pré-ano','Pós-ano')),
  responsavel_id uuid references profiles(id),
  status text default 'Planejado' check (status in ('Planejado','Em andamento','Realizado','Cancelado')),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: reunioes
-- ============================================================
create table reunioes (
  id uuid default uuid_generate_v4() primary key,
  tipo text not null check (tipo in (
    'Pedagógica','Com Pais','Diretiva','Conselho de Classe','Formação Docente'
  )),
  data timestamptz not null,
  pauta text,
  participantes_convocados int default 0,
  participantes_presentes int default 0,
  decisoes text,
  ata_url text,
  proxima_data date,
  bimestre text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: projetos pedagógicos
-- ============================================================
create table projetos (
  id uuid default uuid_generate_v4() primary key,
  nome text not null,
  objetivo text,
  disciplinas text[],
  turmas text[],
  data_inicio date,
  data_fim date,
  responsavel_id uuid references profiles(id),
  status text default 'Planejamento' check (status in (
    'Planejamento','Em execução','Concluído','Suspenso'
  )),
  progresso int default 0 check (progresso between 0 and 100),
  resultado text check (resultado in ('Excelente','Bom','Regular','Insatisfatório')),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: avaliacoes
-- ============================================================
create table avaliacoes (
  id uuid default uuid_generate_v4() primary key,
  bimestre text not null,
  disciplina text not null,
  turmas text[],
  data_aplicacao date not null,
  data_devolucao date,
  media numeric(4,2),
  pct_abaixo_5 numeric(5,2),
  pct_acima_7 numeric(5,2),
  observacao text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: simulados
-- ============================================================
create table simulados (
  id uuid default uuid_generate_v4() primary key,
  numero int not null,
  data date not null,
  turmas text[],
  n_participantes int default 0,
  media_geral numeric(5,2),
  media_cn numeric(5,2),
  media_ch numeric(5,2),
  media_lc numeric(5,2),
  media_mt numeric(5,2),
  meta numeric(5,2),
  status text default 'Planejado' check (status in ('Planejado','Realizado','Cancelado')),
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: formacoes (formação docente)
-- ============================================================
create table formacoes (
  id uuid default uuid_generate_v4() primary key,
  tema text not null,
  data date not null,
  formador text,
  carga_horaria numeric(4,1) default 0,
  professores_convidados int default 0,
  professores_presentes int default 0,
  avaliacao_media numeric(3,1),
  aplicacao text check (aplicacao in ('Sim','Parcial','Não aplicado')),
  observacao text,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- TABELA: checklist_items
-- ============================================================
create table checklist_items (
  id uuid default uuid_generate_v4() primary key,
  atividade text not null,
  categoria text,
  frequencia text check (frequencia in ('Diário','Semanal','Mensal','Bimestral','Semestral','Anual')),
  mes int check (mes between 1 and 12),
  prazo date,
  responsavel text,
  prioridade text default 'Importante' check (prioridade in ('Crítico','Importante','Complementar')),
  concluido boolean default false,
  data_conclusao date,
  created_by uuid references profiles(id),
  created_at timestamptz default now()
);

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

alter table profiles enable row level security;
alter table eventos enable row level security;
alter table reunioes enable row level security;
alter table projetos enable row level security;
alter table avaliacoes enable row level security;
alter table simulados enable row level security;
alter table formacoes enable row level security;
alter table checklist_items enable row level security;

-- Profiles: cada usuário vê todos, mas edita só o próprio
create policy "Profiles visíveis para autenticados" on profiles
  for select using (auth.role() = 'authenticated');

create policy "Perfil editável pelo próprio usuário" on profiles
  for update using (auth.uid() = id);

-- Eventos: autenticados veem tudo; coordenadora e direção podem editar
create policy "Eventos visíveis para autenticados" on eventos
  for select using (auth.role() = 'authenticated');

create policy "Coordenadora e direção podem inserir eventos" on eventos
  for insert with check (
    exists (select 1 from profiles where id = auth.uid() and role in ('coordenadora','direcao'))
  );

create policy "Coordenadora e direção podem atualizar eventos" on eventos
  for update using (
    exists (select 1 from profiles where id = auth.uid() and role in ('coordenadora','direcao'))
  );

create policy "Coordenadora pode deletar eventos" on eventos
  for delete using (
    exists (select 1 from profiles where id = auth.uid() and role = 'coordenadora')
  );

-- Reuniões: mesma lógica de eventos
create policy "Reuniões visíveis para autenticados" on reunioes
  for select using (auth.role() = 'authenticated');

create policy "Coordenadora e direção podem gerir reuniões" on reunioes
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role in ('coordenadora','direcao'))
  );

-- Projetos, avaliações, simulados, formações, checklist: mesma lógica
create policy "Projetos visíveis para autenticados" on projetos
  for select using (auth.role() = 'authenticated');
create policy "Coordenadora gere projetos" on projetos
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'coordenadora'));

create policy "Avaliações visíveis" on avaliacoes
  for select using (auth.role() = 'authenticated');
create policy "Coordenadora gere avaliações" on avaliacoes
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'coordenadora'));

create policy "Simulados visíveis" on simulados
  for select using (auth.role() = 'authenticated');
create policy "Coordenadora gere simulados" on simulados
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'coordenadora'));

create policy "Formações visíveis" on formacoes
  for select using (auth.role() = 'authenticated');
create policy "Coordenadora gere formações" on formacoes
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'coordenadora'));

create policy "Checklist visível para autenticados" on checklist_items
  for select using (auth.role() = 'authenticated');
create policy "Coordenadora gere checklist" on checklist_items
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'coordenadora'));

-- ============================================================
-- DADOS INICIAIS: Feriados Nacionais 2027
-- ============================================================
-- (Execute após criar o primeiro usuário coordenadora e substituir o UUID abaixo)
-- insert into eventos (nome, data_inicio, tipo, status) values
--   ('Confraternização Universal', '2027-01-01', 'Feriado', 'Planejado'),
--   ('Carnaval', '2027-02-08', 'Feriado', 'Planejado'),
--   ('Carnaval', '2027-02-09', 'Feriado', 'Planejado'),
--   ('Quarta-feira de Cinzas', '2027-02-10', 'Feriado', 'Planejado'),
--   ('Páscoa', '2027-03-28', 'Feriado', 'Planejado'),
--   ('Tiradentes', '2027-04-21', 'Feriado', 'Planejado'),
--   ('Dia do Trabalhador', '2027-05-01', 'Feriado', 'Planejado'),
--   ('Corpus Christi', '2027-05-27', 'Feriado', 'Planejado'),
--   ('Independência do Brasil', '2027-09-07', 'Feriado', 'Planejado'),
--   ('N.S. Aparecida / Dia das Crianças', '2027-10-12', 'Feriado', 'Planejado'),
--   ('Finados', '2027-11-02', 'Feriado', 'Planejado'),
--   ('Proclamação da República', '2027-11-15', 'Feriado', 'Planejado'),
--   ('Consciência Negra', '2027-11-20', 'Feriado', 'Planejado'),
--   ('Natal', '2027-12-25', 'Feriado', 'Planejado');
