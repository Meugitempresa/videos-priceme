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
- [ ] **E-mail que recebe os formulários** (`email_atendente`).
- [ ] **E-mail que envia (SMTP):** basta dizer o provedor (Gmail, Outlook, Hostinger, Locaweb…) e o endereço.
      A senha **não** vai no chat; ela entra direto no `.env` do servidor. No Gmail, use uma "senha de app"
      (verificação em duas etapas → Senhas de app).
- [ ] **Links:** download do app, abrir o app, site, Instagram, Facebook, TikTok e YouTube. Os das redes foram
      deduzidos de @pharmaonlineplus e precisam de confirmação.
- [ ] **Aprovação dos textos das mensagens** (`config/textos.json`).
- [ ] **Servidor:** VPS com Docker (2 a 4 GB de RAM) e 3 domínios: painel do Typebot, bot e arquivos.
- [ ] **Opção 2** (Orçamento pelo WhatsApp / ordem de pedido): falta definir quais documentos pedir e para onde vai o pedido.

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
5. Fazer a opção 2.
