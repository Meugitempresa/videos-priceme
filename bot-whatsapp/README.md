# Bot de atendimento pHarmaOnline (WhatsApp)

O bot usa o **Typebot** conectado direto à **API oficial do WhatsApp (Cloud API da Meta)**, pela integração nativa do
Typebot, sem nenhum intermediário.
É um bot **simples e engessado**: não tem IA e não conversa. Ele mostra um menu numerado e responde a cada opção.
Se a mensagem não tiver relação com o menu, ele explica em uma frase como escolher a opção e mostra o menu de novo.

## Situação (Parte 1)

| Nº | Opção | Status |
|----|-------|--------|
| 0 | Voltar ao menu inicial | ✅ funciona em qualquer ponto da conversa |
| 1 | Orçamento pelo app | ✅ link https://orcpharm.app/pharmaonline/ |
| 2 | Orçamento pelo WhatsApp (ordem de pedido) | ✅ encaminha para atendimento humano: (31) 9921-1377 (wa.me/553199211377) |
| 3 | Administrativo/Financeiro | ✅ formulário web; resposta por e-mail |
| 4 | Redes sociais | ✅ Instagram, Facebook, TikTok e YouTube (@pharmaonlineplus) |
| 5 | Fale conosco | ✅ dois links do app: não clientes (…/pergunta) e clientes (…/fale-conosco); sem formulário |
| – | Acessar o site | 🙈 oculto até a loja da Nuvemshop ser publicada (`"oculto": true`; ao mostrar, vira a opção 3) |

A saudação é fixa ("Olá! Seja muito bem-vindo(a)…"), sem variar por horário. O agradecimento termina com o slogan:
"pHarmaOnline, conectando confiança à sua conveniência 💜".

**Como chega o formulário preenchido (opção 3):** o cliente toca em **"Enviar respostas"** no fim do formulário e vê a
confirmação na tela. A equipe recebe **um e-mail organizado** com todos os dados (`docs/previa-email-atendente.png`); o botão
"Responder" do e-mail já vai para o cliente. Nada é enviado pelo WhatsApp.

**Dados pendentes (a cliente envia):**
- link do site (quando a loja for publicada);
- e-mail que envia os avisos (SMTP);
- domínios e servidor;
- textos finais das mensagens.

## Como o bot entende as mensagens

A lógica fica em `src/logica.js` e segue esta ordem:
1. **"0"**, "voltar", "menu" ou "início" → primeira mensagem, com o menu completo.
2. **Número da opção** → resposta da opção. Também aceita "1.", "opção 1", "nº 1" e "1️⃣".
3. **Nome ou frase da opção** → mesma resposta do número. Ex.: "orçamento em tempo real pelo app", "quero falar com atendente",
   "vocês têm instagram?". As frases aceitas ficam em `apelidos`, em `config/menu.json`.
4. **Saudação** ("oi", "olá", "bom dia, tudo bem?"…) → boas-vindas e o menu.
5. **Agradecimento** ("obrigado", "valeu") → resposta curta e educada.
6. **Qualquer outra coisa** → "Desculpe, não consegui identificar…" e o menu.

Áudio, figurinha e foto não têm texto: caem no item 6 ("não consegui identificar" e o menu). Isso foi testado no Typebot real.

## Editar o menu (sem quebrar a ordem)

O menu está em `config/menu.json`. Depois da importação, ele também fica no Typebot, no bloco **`menu_config`** do grupo
"⚙️ Configuração (edite aqui)".
- **O número de cada item vem da posição na lista.** Para excluir ou reordenar, apague ou mova o item. A numeração
  se ajusta sozinha, sem buracos.
- `id` liga o item à resposta dele. **Não altere.** `nome` é o texto do menu. `ativo: false` faz o item responder
  "disponível em breve".
- O texto de cada resposta fica no grupo "💬 …" de cada item, no Typebot, ou em `config/textos.json`.
- Para criar um item novo: inclua-o na lista, crie um grupo de resposta e adicione `acao = id` no bloco Condition do
  grupo "⌨️ Aguardar resposta". Pelos arquivos, basta incluir o item em `menu.json` e o texto em `textos.json`, e depois
  rodar `npm run gerar`.

## Testar no computador (sem servidor)

Requer Node 20 ou mais recente.

```bash
npm test
```

```bash
npm run simular
```

```bash
npm run simular -- --roteiro "oi|1|asdf|0|5"
```

```bash
npm run simular -- --formulario
```

- `npm test` roda 26 testes: reconhecimento, renumeração e o fluxo completo, inclusive o e-mail e o envio pela API da Meta.
- O simulador executa o mesmo JSON que vai para o Typebot.
- `npm run gerar` recria `typebot/*.json` depois de editar os arquivos em `config/`.

Com um Typebot rodando, este comando compara as respostas reais com as do simulador:

```bash
TYPEBOT_VIEWER_URL=https://bot.seudominio.com.br node scripts/testar-typebot-real.mjs pharma-atendimento
```

## Instalação no servidor

1. **VPS** com Docker, pelo menos 2 a 4 GB de RAM e 3 domínios apontados para ela (painel do Typebot, bot e arquivos).
   Em `servidor/`, copie `.env.example` para `.env`, preencha os dados (inclusive o SMTP do e-mail que envia) e rode:

   ```bash
   docker compose up -d
   ```

2. **Importar os fluxos** em `https://DOMINIO_TYPEBOT`: entre com o e-mail do administrador e use **Criar → Importar
   arquivo** para os dois fluxos.
   - `typebot/formulario.json`: em "⚙️ Configuração (edite aqui)", preencha:
     - `email_atendente`: quem recebe os formulários (suporte.pharmaonline@gmail.com).

     Publique com o ID público `pharma-formulario`. O e-mail sai pelo SMTP do `.env`. O formulário não envia nada pelo
     WhatsApp: no fim, o cliente toca em **"Enviar respostas"** e vê a confirmação só na tela.
   - `typebot/atendimento.json`: preencha os links (`link_formulario` = `https://DOMINIO_VIEWER/pharma-formulario`).
     Publique com o ID público `pharma-atendimento`.
3. **Ligar o número da Meta ao Typebot** (integração nativa):
   1. No fluxo `pharma-atendimento`, abra **Compartilhar → WhatsApp** e siga o assistente. Ele pede:
      - o **token permanente** do usuário do sistema da Meta;
      - o **ID do número de telefone**;
      - a chave secreta do app (opcional, recomendada).
   2. O assistente mostra uma **URL de callback** e um **token de verificação**. No app da Meta (developers.facebook.com →
      WhatsApp → Configuração → Webhook), cole os dois, clique em verificar e assine o campo **messages**.
   3. Ative o WhatsApp no fluxo e **publique**. A conversa recomeça pelas boas-vindas depois de 12 h sem mensagens
      (configurável no mesmo painel).
   4. Se o número estiver "Offline" no Gerenciador do WhatsApp, registre-o uma vez na API, com um PIN de 6 dígitos
      escolhido por vocês. Pode ser pelo Explorador da Graph API da Meta, sem programar:

      ```bash
      curl -X POST "https://graph.facebook.com/v21.0/ID_DO_NUMERO/register" \
        -H "Authorization: Bearer TOKEN_PERMANENTE" -H "Content-Type: application/json" \
        -d '{"messaging_product":"whatsapp","pin":"123456"}'
      ```

      Ao registrar, o número deixa de funcionar no app WhatsApp Business do celular.
4. **Custos da Meta:** desde 01/10/2026, segundo parceiros da Meta, as respostas aos clientes também são cobradas por
   mensagem. Há uma franquia mensal citada de cerca de 1.000 mensagens por número. Confirme no Gerenciador do WhatsApp:
   pode ser necessário cadastrar uma forma de pagamento para as mensagens continuarem sendo entregues.
5. **Sem mensagens pelo WhatsApp no formulário (decisão de 24/11):** para evitar custos com a Meta, nem o cliente nem a
   equipe recebem avisos pelo WhatsApp. A equipe recebe por e-mail, e o cliente vê a confirmação na tela. Todos os
   formulários também ficam no painel do Typebot, em **Resultados**.

**Validação feita:** o Typebot oficial rodou com uma "Meta falsa" no lugar da API real.
- Mensagens no formato da Meta, enviadas ao webhook nativo, foram respondidas: menu, opções, frases, 0, figurinha e
  agradecimento.
- O formulário enviou o e-mail à equipe (na versão anterior, que ainda avisava o cliente pelo WhatsApp).

## Arquivos

| Caminho | O que é |
|---------|---------|
| `config/menu.json` | itens do menu (ordem, nomes, frases aceitas, ativo/inativo) |
| `config/textos.json` | textos-modelo de todas as mensagens |
| `config/variaveis.example.json` | links, e-mail do atendente e dados da Meta (copie para `variaveis.json`) |
| `src/logica.js` | reconhecimento das mensagens, menu, resumo do formulário (copiado para dentro do Typebot) |
| `src/motor.js` | executor local dos fluxos (simulador e testes) |
| `scripts/gerar-typebot.mjs` | gera `typebot/atendimento.json` e `typebot/formulario.json` |
| `scripts/simular.mjs` | conversa no terminal |
| `scripts/testar-typebot-real.mjs` | compara um Typebot publicado com o simulador |
| `servidor/` | docker-compose (Typebot + Postgres + Redis + MinIO + HTTPS) |
| `docs/previa-formulario-*.png` | capturas do formulário rodando no Typebot, nas cores da marca |
| `docs/previa-email-atendente.png` | e-mail que o atendente recebe (capturado do Typebot real) |
| `docs/mensagens-do-bot.pdf` | guia com todas as mensagens, para aprovação (gerado por `scripts/gerar-pdf.mjs`) |
| `docs/formulario-de-atendimento.pdf` | guia do formulário: passo a passo, regras, e-mail à equipe e perguntas frequentes (`scripts/gerar-pdf-formulario.mjs`) |
| `midia/banner-pharmaonline.jpg` | banner enviado na saudação (preencher `link_banner` depois de enviar ao servidor) |
