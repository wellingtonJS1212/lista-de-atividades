# Controle Total do App

## Objetivo

Centralizar o controle do aplicativo para Android, web e Windows com:

- login por e-mail e senha
- aprovação manual de usuários
- bloqueio de acesso
- painel administrativo
- coleta de feedback e sugestões
- distribuição centralizada por versão

## Arquitetura recomendada

1. `Supabase` para autenticação e banco de dados.
2. `admin.html` como painel web administrativo.
3. `index.html` como app principal para mobile, web e PWA.
4. `Windows` via PWA instalável após publicar a versão web.

## Fluxo de acesso

1. O usuário informa nome, e-mail e senha no app.
2. Se a conta ainda não existir, o app cria o cadastro remoto com `approved = false`.
3. O usuário fica aguardando aprovação.
4. Você aprova no painel administrativo.
5. Depois disso o usuário consegue entrar normalmente.
6. Se o usuário for bloqueado, o acesso é removido no próximo login.

## Dados coletados

Somente:

- nome
- e-mail
- feedback
- sugestão

## Segurança

- Nunca coloque `service_role` no app ou no painel público.
- Use apenas a `anon key` no cliente.
- O controle de acesso fica nas regras RLS do Supabase.
- Mantenha o repositório privado sempre que possível.
- Guarde a sua keystore Android em local seguro e fora do Git.

## Arquivos desta implementação

- `backend-config.js`
- `remote-api.js`
- `admin.html`
- `admin.css`
- `admin.js`
- `supabase-schema.sql`

## Próximos passos

1. Criar o projeto no Supabase.
2. Executar o SQL de `supabase-schema.sql`.
3. Preencher `backend-config.js`.
4. Criar seu primeiro usuário no app.
5. Tornar esse usuário `admin` pelo painel do Supabase.
6. Entrar em `admin.html` e aprovar os demais usuários.
