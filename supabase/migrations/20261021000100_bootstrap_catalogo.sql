-- Primeiro acesso: quem entra e ainda não é membro de nenhum escritório vira admin de um escritório novo.
-- O cadastro aberto fica DESLIGADO no Supabase (Auth → Sign in / Providers → "Allow new users to sign up" = off):
-- só entra quem for convidado pelo painel do Supabase ou por um admin.
create or replace function garantir_escritorio() returns uuid
language plpgsql security definer set search_path = public as $$
declare
  e uuid;
  u uuid := auth.uid();
begin
  if u is null then
    raise exception 'não autenticado';
  end if;
  select escritorio_id into e from membros where user_id = u order by created_at limit 1;
  if e is null then
    insert into escritorios (nome) values ('Meu escritório') returning id into e;
    insert into membros (escritorio_id, user_id, nome, papel)
    values (e, u, coalesce((select split_part(email, '@', 1) from auth.users where id = u), 'Consultor'), 'admin');
  end if;
  return e;
end $$;

revoke all on function garantir_escritorio() from public;
grant execute on function garantir_escritorio() to authenticated;

-- Catálogo inicial: as 3 soluções com regra em código (web/src/lib/solucoes). As demais entram com as regras.
insert into solucoes (slug, nome, grupo, pilar, area, bloco_relatorio, ordem) values
  ('transacao-tributaria', 'Transação Tributária', 'TAX', 'reducao_custos', 'Tributário administrativo', 'recuperacao', 10),
  ('revisao-previdenciaria', 'Revisão Previdenciária', 'TAX', 'reducao_custos', 'Tributário administrativo', 'faixas_risco', 20),
  ('supply-tax', 'Planejamento tributário da cadeia de suprimentos', 'TAX', 'reducao_custos', 'Planejamento tributário', 'elegibilidade', 30)
on conflict (slug) do nothing;
