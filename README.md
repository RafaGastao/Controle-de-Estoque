# Casa de Madeira — Controle de estoque

HTML, CSS e JavaScript no navegador, com um servidor Node.js e PostgreSQL.
O servidor é necessário para proteger o acesso e manter o banco fora do navegador.
Não há cadastro público: existe somente o administrador definido em `server.js`.

## Publicar no Render

1. Envie esta pasta para um repositório GitHub, incluindo `package-lock.json`.
   Não envie `.env` nem `node_modules`.
2. No Render, selecione **New → Blueprint**, conecte o repositório e use `render.yaml`.
   Revise os planos e os custos antes de criar os serviços.
3. O login já está definido em `server.js`: usuário `admin` e senha `CasaMadeira@2026!`.
4. O Blueprint cria o Web Service e o PostgreSQL. A conexão interna é configurada
   por `DATABASE_URL` e o segredo de sessão é gerado automaticamente.
5. Abra a URL do Web Service e entre com o login definido acima.

Se preferir criar manualmente: crie um PostgreSQL e um **Web Service Node** na mesma
região. Build: `npm ci --omit=dev`. Start: `npm start`. Health check: `/health`.
Configure `DATABASE_URL` com a **Internal Database URL** do banco, `NODE_ENV=production`,
e `SESSION_SECRET` (segredo aleatório com pelo menos 32 caracteres).
Use `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
para gerar o segredo localmente.

O sistema cria as tabelas automaticamente na inicialização. `database.sql` contém
o esquema. O inventário e o histórico ficam em JSONB no PostgreSQL, com revisão
para rejeitar gravações desatualizadas. As sessões também ficam no PostgreSQL.

## Login definido

- Usuário inicial: `admin`.
- Senha fixa: `CasaMadeira@2026!`.
- As credenciais estão no código do servidor e ficam visíveis a quem acessar o repositório.
- A senha é armazenada no banco como hash com salt (scrypt).
- A sessão usa cookie HttpOnly, SameSite Strict e Secure em produção; dura 8 horas.
- Há limite de tentativas de login e proteção de origem nas gravações.
- Para mudar usuário ou senha, altere `ADMIN_USERNAME` e `ADMIN_PASSWORD` em `server.js` e publique novamente.
  O administrador é atualizado na inicialização. Trocar só a senha não encerra
  sessões existentes: para encerrá-las, altere também `SESSION_SECRET`.
- Ao trocar o usuário, as contas anteriores são removidas automaticamente.

## Executar no computador

1. Instale Node.js 22 ou superior e PostgreSQL.
2. Crie um banco chamado `casa_madeira`.
3. Copie `.env.example` para `.env` e preencha a conexão do banco e o segredo de sessão.
4. Execute `npm ci` e depois `npm start`.
5. Acesse `http://localhost:3000`.

Agora o sistema deve ser aberto pelo servidor; abrir `index.html` diretamente não
conecta ao banco e não permite fazer login.

## Dados anteriores e backups

Se você já cadastrou ingredientes na versão local, abra essa versão no navegador
original e exporte o backup antes de substituí-la. Depois de entrar no novo sistema,
use **Restaurar backup**. A restauração substitui o estoque e o histórico compartilhados
e solicita confirmação. São aceitos arquivos JSON de até 5 MB.
Os dados locais antigos não são enviados automaticamente ao servidor.

## Arquivos para o GitHub

Envie os arquivos do projeto, incluindo `package-lock.json`, `database.sql`,
`.gitignore` e `render.yaml`. O servidor usa `database.sql` para criar as tabelas.
O Render usa `package-lock.json` para instalar as dependências.

Não envie `.env` nem `node_modules/`: ambos já estão no `.gitignore`.
Mantenha-os no computador para continuar executando localmente.

Documentação oficial: https://render.com/docs/deploy-node-express-app e
https://render.com/docs/postgresql-creating-connecting.
