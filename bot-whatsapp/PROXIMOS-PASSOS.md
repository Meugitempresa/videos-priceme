# Bot pHarmaOnline: onde paramos e próximos passos

Atualizado em 19/11/2026.

**Decisão (19/11):** número na **API oficial da Meta + Typebot**, pela integração nativa do Typebot, **sem Evolution**.
A SendPulse foi avaliada e descartada.

## Pronto
- **Base do bot:**
  - menu de 0 a 6 com renumeração automática;
  - reconhecimento por número ou frase;
  - saudações;
  - "0" volta ao menu em qualquer ponto;
  - resposta padrão para mensagens fora do assunto.
- **Opções prontas:**
  - 1 (app), 3 (site) e 5 (redes): respostas com links provisórios;
  - 4 (Administrativo/Financeiro) e 6 (Fale conosco): formulário web nas cores #2D4589 e #F49AC1.
- **Formulário:**
  - o resumo vai **por e-mail** para o atendente, e "Responder" fala direto com o cliente;
  - o cliente recebe o aviso no WhatsApp;
  - o resumo também por WhatsApp está pronto, mas desligado, porque exige cartão na Meta.
- **Testes e validação:**
  - os fluxos passaram no esquema oficial do Typebot e rodaram no Typebot real;
  - 26 testes automáticos (`npm test`).
- **Servidor:** configuração pronta em `servidor/` (Typebot + Postgres + Redis + MinIO + HTTPS).
- **Integração nativa testada:** o Typebot oficial respondeu a mensagens no formato da Meta (com uma "Meta falsa").

## Falta (a cliente envia)
- [ ] **ID do número de telefone** e **ID da conta do WhatsApp Business**. Ficam em developers.facebook.com → app →
      WhatsApp → Configuração da API. Há um lembrete agendado para 18/11 às 10h.
- [x] **E-mail que recebe os formulários:** suporte.pharmaonline@gmail.com (no bot desde 19/11).
- [ ] **E-mail que envia (SMTP):** basta dizer o provedor (Gmail, Outlook, Hostinger, Locaweb…) e o endereço.
      A senha **não** vai no chat; ela entra direto no `.env` do servidor. No Gmail, use uma "senha de app"
      (verificação em duas etapas → Senhas de app).
- [x] **Redes sociais:** no bot exatamente como a cliente enviou (regra de 24/11: usar só os links fornecidos, sem alterar).
      Facebook com nome de usuário criado em 19/11: facebook.com/pharmaonlineplus.
- [x] **Link do app:** https://orcpharm.app/pharmaonline/ (um link só, que serve para acessar o app; opção 1 ajustada).
- [ ] **Link do site:** a loja está na Nuvemshop e ainda não foi publicada. O item `site` está **oculto** (não aparece
      no menu; os outros itens ficam numerados de 1 a 5). Quando publicar, a cliente ativa: trocar `link_site` e pôr
      `"oculto": false` (no Typebot, bloco `menu_config`; ou em `config/menu.json`). O site volta como opção 3.
- [ ] **Aprovação dos textos** (`config/textos.json`). Ajustes de 19/11 feitos:
      - saudação fixa, sem horário;
      - opções 3 e 5 avisam que a resposta vem por e-mail;
      - "Fale conosco" sem "Ficamos felizes…";
      - slogan com 💜 no agradecimento;
      - tela final e aviso no WhatsApp citam o e-mail.
- [ ] **Servidor:** VPS com Docker (2 a 4 GB de RAM) e 3 domínios: painel do Typebot, bot e arquivos.
- [x] **Opção 2** (19/11): encaminha para atendimento humano no (31) 9921-1377 (link wa.me/553199211377), pedindo a foto da receita.

- [ ] **Banner da primeira mensagem:** arquivo em `midia/banner-pharmaonline.jpg`. Na instalação, enviar para o
      servidor (ou fazer upload no balão de imagem do Typebot) e preencher `link_banner`. Vazio = bot começa pela saudação.
- Textos (19/11): saudação curta com 💊💜 e banner só na saudação; opção 2 com "Toque no link abaixo" para o (31) 99921-1377;
  demais mensagens na versão completa, citando o e-mail. Guia em `docs/mensagens-do-bot.pdf` (`node scripts/gerar-pdf.mjs`).
  Aguardando "aprovado".

- **Regra anti-alucinação (24/11):** o bot não usa IA (não há temperatura); só envia textos fixos e links fornecidos.
  `test/seguranca.test.mjs` falha se surgir link fora da configuração, link escrito à mão nos textos ou bloco de IA.
- [x] **24/11:** link `https://wa.me/5531999211377` aprovado pela cliente. Opção 5 (Fale conosco) **sem formulário**: pede
      para escrever para suporte.pharmaonline@gmail.com. Só a opção 3 (Administrativo/Financeiro) usa o formulário.
- [ ] Link do formulário (só opção 3): o bot acrescenta `?assunto=…&whatsapp=…` ao link (nosso, criado na instalação),
      para mostrar o assunto e avisar o cliente no WhatsApp. Confirmar com a cliente se quiser o link sem esses dados.

- [x] **24/11:** formulário sem nenhuma mensagem pelo WhatsApp (custo da Meta). No fim há o botão rosa "Enviar respostas";
      ao tocar, as respostas vão por e-mail e aparece só a confirmação com o agradecimento.
- [x] **Opção 5 (Fale conosco), aprovada em 24/11:** uma mensagem com dois links (💙 ainda não é cliente:
      https://orcpharm.app/pharmaonline/pergunta; 🩷 já é cliente:
      https://orcpharm.app/pharmaonline/fale-conosco). Os dois PDFs foram regenerados.

## Situação na Meta (WhatsApp Cloud API)
- O número **+55 31 9788-2066 (Pharma Online)** já está na conta do WhatsApp na Meta, com status **"Offline"**:
  foi adicionado, mas ainda não foi registrado na API.
- Ele está instalado no **app WhatsApp Business**, mas ainda não atende clientes. Ao registrar na API, o app deixa de
  funcionar com esse número (aceito). Fazer backup antes, se houver algo a guardar.
- **Registrar só quando o servidor estiver pronto:**
  1. Registro com PIN de 6 dígitos (`POST /{ID_DO_NUMERO}/register`), pelo Explorador da Graph API;
  2. No Typebot, Compartilhar → WhatsApp: informar o token e o ID do número;
  3. Colar a URL de callback e o token de verificação mostrados pelo Typebot no webhook do app da Meta, com o campo
     `messages`.
- **Cobrança (correção de 19/11):** desde 01/10/2026, segundo parceiros da Meta, as respostas aos clientes também são
  cobradas por mensagem. A franquia citada é de cerca de 1.000 mensagens por mês por número. Sem forma de pagamento, a
  entrega pode parar. **Provavelmente será preciso cadastrar cartão** (internacional, porque a conta está em dólar).
  Confirmar no Gerenciador do WhatsApp. O resumo ao atendente continua por e-mail.
- **A moeda da conta está em dólar** e não pode ser mudada. Se um dia cadastrar cartão, ele precisa aceitar compras
  internacionais. A alternativa é uma nova conta em reais, que dá mais trabalho.
- **Token permanente:** business.facebook.com → Usuários do sistema (Admin) → atribuir app e conta do WhatsApp →
  gerar token sem expiração, com `whatsapp_business_messaging` e `whatsapp_business_management`. **Nunca colar no chat.**

## Quando retomarmos
1. Receber os IDs, os e-mails e os links e preenchê-los em `config/variaveis.json` (ou direto no Typebot).
2. Subir o servidor (`servidor/`), importar os dois fluxos no Typebot e publicar.
3. Registrar o número na Meta, ligar o WhatsApp no Typebot (Compartilhar → WhatsApp) e configurar o webhook.
4. Testar com um celular de verdade: opções 0 a 6, formulário e e-mail ao atendente.
