# Prompt para continuar o projeto no Claude Code do computador

Copie tudo o que está entre as linhas `=====` e cole como primeira mensagem no Claude Code aberto na pasta do projeto.

=====

Você vai continuar um projeto que comecei com o Claude numa sessão na nuvem. Eu não sou técnica: explique tudo de
forma simples, como para uma criança, em português, um passo de cada vez. Antes de qualquer ação que mude algo fora
desta pasta (principalmente no servidor), me diga o que vai fazer e espere eu aprovar.

## Onde está o projeto
- Repositório GitHub `meugitempresa/videos-priceme`, branch `claude/busy-cerf-foqvfi`, pasta `bot-whatsapp/`.
- Leia primeiro: `bot-whatsapp/README.md`, `bot-whatsapp/PROXIMOS-PASSOS.md` e a seção do bot em `CLAUDE.md`.
- Comandos (dentro de `bot-whatsapp/`): `npm test` (33 testes, todos devem passar), `npm run gerar` (recria
  `typebot/*.json` a partir de `config/`), `npm run simular` (conversa de teste no terminal),
  `node scripts/gerar-pdf.mjs` e `node scripts/gerar-pdf-formulario.mjs` (guias em PDF; usam o Playwright).

## O que é o bot (já pronto e aprovado por mim)
Bot de atendimento no WhatsApp da **pHarma Online** (sempre escrito assim, separado). Typebot com a integração
**nativa** do WhatsApp na **API oficial da Meta (Cloud API)**, **sem Evolution API** (decisão minha). Bot simples,
**sem IA**: não há "temperatura"; ele só envia textos fixos aprovados. Nunca adicione IA.

- Primeira mensagem e saudações: banner (`midia/banner-pharmaonline.jpg`, só na saudação) + "Olá! Seja bem-vindo(a) à
  *pHarma Online*! 💊💜" + menu. Opção **0** (ou "voltar"/"menu") mostra só o menu, de qualquer ponto.
- Menu: 1 Orçamento pelo app · 2 Orçamento pelo WhatsApp (ordem de pedido) · 3 Administrativo/Financeiro ·
  4 Redes sociais · 5 Fale conosco. "Acessar o site" está **oculto** até a loja da Nuvemshop ser publicada
  (`"oculto": true` em `config/menu.json`; ao mostrar, vira a opção 3). A numeração é automática.
- Reconhece número ou frase da opção. Fora do menu (inclusive áudio/figurinha): só pede para escolher um número do menu.
- **Links: use exclusivamente os que eu forneci, exatamente como estão. Nunca crie, invente, encurte ou complete URLs.**
  - App: https://orcpharm.app/pharmaonline/
  - Opção 2 (atendimento humano no (31) 99921-1377): https://wa.me/5531999211377 (aprovado por mim)
  - Opção 5, quem ainda não é cliente: https://orcpharm.app/pharmaonline/pergunta
  - Opção 5, quem já é cliente: https://orcpharm.app/pharmaonline/fale-conosco
  - Redes: https://www.instagram.com/pharmaonlineplus/ · https://www.facebook.com/pharmaonlineplus/ ·
    https://www.tiktok.com/@pharmaonlineplus · https://www.youtube.com/@pharmaonlineplus
  - `test/seguranca.test.mjs` garante isso; não o enfraqueça.
- Opção 3 usa o **formulário web** (Typebot, cores #2D4589 azul e #F49AC1 rosa): nome, telefone, e-mail
  (obrigatórios), dúvida, imagens opcionais; no fim, botão rosa **"Enviar respostas"**. Ao tocar, as respostas vão por
  **e-mail** para **suporte.pharmaonline@gmail.com** e aparece só a confirmação na tela.
  **O formulário não envia nada pelo WhatsApp** (decisão minha, por causa do custo da Meta).
- Opção 5 (Fale conosco) não tem formulário: uma mensagem com os dois links (💙 não clientes, 🩷 clientes).

## Servidor e domínio
- Domínio **pharmaonlinedigital.com** (comprado na **GoDaddy**, ainda sem uso). Subdomínios planejados:
  `typebot.` (painel), `bot.` (bot e formulário: https://bot.pharmaonlinedigital.com/pharma-formulario) e
  `arquivos.` (banner e anexos). Já configurados em `servidor/.env.example` e `config/variaveis.example.json`.
- VPS: IP **187.41.106.98**, usuário **root**. **Esse servidor já roda outro projeto meu: não pode quebrar nada.**
  A instalação deve ficar separada (pasta e banco próprios) e não pode disputar portas com o projeto existente.
- `servidor/docker-compose.yml` sobe Caddy (HTTPS, portas 80/443), Postgres, Redis, MinIO, Typebot builder e viewer.
  Se as portas 80/443 já estiverem em uso (Nginx, Traefik, um painel etc.), adapte para usar o proxy que já existe
  em vez do Caddy.

## Regras de segurança
- **Nunca me peça senhas, tokens ou chaves no chat.** Senhas (root, Gmail, MinIO, Postgres) e o token da Meta eu
  digito direto no servidor (arquivo `.env`) ou no painel do Typebot. `config/variaveis.json` e `servidor/.env` não vão
  para o git.
- Para acessar o servidor, prefira uma chave SSH: gere o par aqui no meu computador, me mostre só a **chave pública**
  para eu adicionar no servidor, e nunca exiba a privada.
- Primeiro rode no servidor só comandos de leitura (diagnóstico). Mudanças, só com a minha aprovação.

## Próximos passos (nesta ordem)
1. Acessar o servidor e fazer o diagnóstico (sistema, memória, disco, Docker, contêineres e portas em uso, servidor web).
   Me explicar o que já roda lá e como o bot vai conviver com isso.
2. Na GoDaddy (DNS de pharmaonlinedigital.com): me guiar para criar 3 registros **A** (`typebot`, `bot`,
   `arquivos`) apontando para 187.41.106.98.
3. Adaptar o `docker-compose` ao servidor, criar o `.env` (eu preencho as senhas), subir os serviços e conferir o HTTPS.
4. E-mail de envio (SMTP): usar suporte.pharmaonline@gmail.com com **senha de app** do Gmail (verificação em duas
   etapas → Senhas de app). O login no painel do Typebot é por link enviado a esse e-mail.
5. No Typebot: importar `typebot/atendimento.json` e `typebot/formulario.json`; publicar com os IDs públicos
   `pharma-atendimento` e `pharma-formulario`; enviar o banner e preencher `link_banner`.
6. Meta (número **+55 31 9788-2066**, hoje "Offline", instalado no app WhatsApp Business, sem atender clientes):
   - eu passo o **ID do número** e o **ID da conta do WhatsApp Business** (ainda pendentes);
   - gero o **token permanente** (usuário do sistema, com `whatsapp_business_messaging` e
     `whatsapp_business_management`) e a **chave secreta do app**, e colo direto no Typebot (Compartilhar → WhatsApp);
   - **cartão**: desde 01/10/2026 a Meta cobra também as respostas (há uma franquia de ~1.000 mensagens/mês a
     confirmar); a conta está em **dólar**, então o cartão precisa aceitar compras internacionais;
   - registrar o número com um **PIN de 6 dígitos** e configurar o webhook do app da Meta com a URL e o token de
     verificação que o Typebot mostrar (campo `messages`). Ao registrar, o app WhatsApp Business do celular deixa de
     funcionar com esse número (já aceito; fazer backup antes).
7. Testar com um celular de verdade (opções 0 a 5, frases, mensagem fora do menu, formulário e e-mail recebido) e
   rodar `TYPEBOT_VIEWER_URL=https://bot.pharmaonlinedigital.com node scripts/testar-typebot-real.mjs pharma-atendimento`.

## Pendências que não impedem a instalação
- Link do site (quando a loja da Nuvemshop for publicada): trocar `link_site` e pôr `"oculto": false`.
- Emoji 🩷 na opção 5: posso trocar pelo 💗 se aparecer como quadradinho em celulares antigos.

Comece lendo os arquivos citados e rodando `npm test`. Depois me diga, em poucas linhas, o que entendeu e qual é o
primeiro passo.

=====
