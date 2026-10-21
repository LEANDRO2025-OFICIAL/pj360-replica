# Backend

Stack: Supabase (Postgres + Auth + RLS), acessado pelo Next.js com o JWT do usuário (`@supabase/ssr`, cookies http-only).
Sem as chaves no `.env.local`, o app cai no **modo demonstração** (dados em memória, sem login) e continua funcionando.

## O que você precisa fazer (uma vez)

1. Crie um projeto em https://supabase.com (plano gratuito serve). Região: **South America (São Paulo)**. Guarde a senha do banco num gerenciador de senhas.
2. Em **Authentication → Sign In / Providers**, desligue **Allow new users to sign up**. Só entra quem for convidado.
3. Em **Authentication → URL Configuration**: Site URL `http://localhost:3000`; em Redirect URLs adicione `http://localhost:3000/auth/confirm`.
4. Em **Authentication → Users → Invite user**, convide o seu e-mail. Abra o convite, defina a senha (o link cai em `/auth/confirm`).
5. Copie `web/.env.example` para `web/.env.local` e preencha com **Project Settings → API**:
   `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable/anon), `SUPABASE_SECRET_KEY` (secret/service role, só para o seed) e `SEED_ADMIN_EMAIL`.
6. Aplique as migrations: `cd web && npx supabase@2.47.0 login && npx supabase@2.47.0 link --project-ref <ref> --workdir .. && npm run db:push`
   (ou cole os dois arquivos de `supabase/migrations/` no SQL Editor, na ordem).
7. Opcional: `npm run seed` cria 2 diagnósticos fictícios no seu escritório.
8. Reinicie o `npm run dev`. O login passa a valer.

Claude não cria conta, não digita senha nem recebe chaves: tudo isso é você no painel do Supabase.

## Feito

- **Migrations** em `supabase/migrations/`: schema completo (11 tabelas, RLS em todas, view de KPIs), função `garantir_escritorio()` (primeiro acesso vira admin de um escritório novo) e catálogo inicial com 3 soluções.
- **Auth**: login com e-mail e senha, sair, esqueci a senha (link por e-mail, mesma resposta exista ou não a conta), definir nova senha, callback `/auth/confirm` (PKCE e token_hash), proxy que renova a sessão e manda para `/login` quem não está logado.
- **Dados**: `lib/data/supabase.ts` implementa o mesmo contrato `Dados` da versão em memória; nenhuma tela mudou. Dinheiro trafega como texto (`::text`) para não perder precisão.
- **Teste de acesso**: `npm run test:rls` roda as migrations reais num Postgres em memória e prova que o segundo usuário não vê, não grava e não altera nada do primeiro, e que sem login nada é acessível.
- **Seed** com empresas e números fictícios (`npm run seed`).
- **Estado de erro** nas telas logadas (`(app)/error.tsx`) e callback que funciona também em modo demonstração.

## Fora deste backend (não se aplica a uso interno)

- **Pagamentos (Stripe)**: o app é interno, sem plano nem cobrança (`skip` no features.csv).
- **E-mail transacional próprio**: só os e-mails de autenticação do Supabase. Antes de uso real, configure SMTP próprio (Resend) em Authentication → SMTP; o SMTP padrão do Supabase tem limite baixo de envio por hora.
- **Jobs**: nenhum. O cálculo é síncrono.
- **Integrações**: só a BrasilAPI (pública, sem chave, sem OAuth). Envia um User-Agent próprio; sem ele responde 403.
- **Exclusão de conta**: feita pelo admin no painel do Supabase (Authentication → Users → Delete); apaga em cascata o vínculo. Os diagnósticos ficam com o escritório (`criado_por` vira nulo).

## Checklist de segurança

- [x] segredos só em variáveis de ambiente; `.env*` no `.gitignore` (só o `.env.example` sem valores entra no git); a chave secreta não aparece em `src/`
- [x] entrada validada no servidor: zod no login/senha, validação de CNPJ, regime, origem e valores nas actions; busca saneada antes do filtro do PostgREST
- [x] autorização em toda leitura e escrita pela RLS, testada com um segundo usuário (`npm run test:rls`); `escritorio_id` nunca vem do navegador
- [ ] limites de tentativa: os do Supabase Auth valem por padrão (Authentication → Rate Limits). Revise antes de abrir para mais gente.
- [x] webhooks com assinatura — não há webhooks
- [x] uploads — não há uploads ainda (a importação em massa vai precisar de limite de tamanho e tipo)
- [x] sem dados de usuário em URLs nem em logs (o callback só leva `next` com caminho interno)
- [ ] dependências: `npm audit` acusa 7 vulnerabilidades "high", todas no CLI `shadcn` (braces/micromatch, só em linha de comando). Correção: `shadcn@1.0.0`, que tem mudanças incompatíveis; agendar.
- [ ] política de privacidade listando operadores (Supabase, Vercel, BrasilAPI) — antes de uso fora do escritório
- [ ] backups: confirmar no painel do Supabase (Database → Backups). O plano gratuito não tem backup diário; o Pro tem.

## Não validado ainda

- Nada foi testado contra um projeto Supabase real: falta o seu projeto e as chaves (passos 1 a 6). O comportamento do banco e das regras de acesso foi testado só no Postgres em memória.
