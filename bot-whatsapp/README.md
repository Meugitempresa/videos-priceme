# Bot de atendimento pHarmaOnline (WhatsApp)

O bot usa Typebot, conectado à Evolution API v2 e à **API oficial do WhatsApp (Cloud API da Meta)**.
É um bot **simples e engessado**: não tem IA e não conversa. Ele mostra um menu numerado e responde a cada opção.
Se a mensagem não tiver relação com o menu, ele explica em uma frase como escolher a opção e mostra o menu de novo.

## Situação (Parte 1)

| Nº | Opção | Status |
|----|-------|--------|
| 0 | Voltar ao menu inicial | ✅ pronto (funciona em qualquer ponto da conversa) |
| 1 | Orçamento pelo app | ✅ pronto (links provisórios) |
| 2 | Orçamento pelo WhatsApp (ordem de pedido) | ⏳ próxima parte (responde "disponível em breve") |
| 3 | Acessar o site | ✅ pronto (link provisório) |
| 4 | Administrativo/Financeiro | ✅ pronto (formulário web) |
| 5 | Redes sociais | ✅ pronto (links provisórios @pharmaonlineplus) |
| 6 | Fale conosco | ✅ pronto (formulário web) |

**Dados pendentes (a cliente envia):**
- links do app, do site e das redes sociais;
- número do atendente que recebe os formulários;
- domínios e servidor;
- textos finais das mensagens.

## Como o bot entende as mensagens

A lógica fica em `src/logica.js` e segue esta ordem:
1. **"0"**, "voltar", "menu" ou "início" → primeira mensagem, com o menu completo.
2. **Número da opção** → resposta da opção. Também aceita "1.", "opção 1", "nº 1" e "1️⃣".
3. **Nome ou frase da opção** → mesma resposta do número. Ex.: "orçamento em tempo real pelo app", "quero falar com atendente",
   "vocês têm instagram?". As frases aceitas ficam em `apelidos`, em `config/menu.json`.
4. **Saudação** ("oi", "olá", "bom dia, tudo bem?"…) → "Bom dia/Boa tarde/Boa noite" (horário de Brasília) e o menu.
5. **Agradecimento** ("obrigado", "valeu") → resposta curta e educada.
6. **Qualquer outra coisa** → "Desculpe, não consegui identificar…" e o menu.

Áudio, figurinha e foto não têm texto. Para esses casos, use a "mensagem desconhecida" da Evolution (passo 4 da instalação).

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

- `npm test` roda 23 testes: reconhecimento, renumeração e o fluxo completo, inclusive o envio à Evolution.
- O simulador executa o mesmo JSON que vai para o Typebot.
- `npm run gerar` recria `typebot/*.json` depois de editar os arquivos em `config/`.

Com um Typebot rodando, este comando compara as respostas reais com as do simulador:

```bash
TYPEBOT_VIEWER_URL=https://bot.seudominio.com.br node scripts/testar-typebot-real.mjs pharma-atendimento
```

## Instalação no servidor

1. **VPS** com Docker, pelo menos 4 GB de RAM e 4 domínios apontados para ela (painel do Typebot, bot, Evolution e
   arquivos). Em `servidor/`, copie `.env.example` para `.env`, preencha os dados e rode:

   ```bash
   docker compose up -d
   ```

2. **Typebot** (`https://DOMINIO_TYPEBOT`): entre com o e-mail do administrador e use **Criar → Importar arquivo** para
   importar os dois fluxos:
   - `typebot/formulario.json`: em "⚙️ Configuração (edite aqui)", preencha a chave da instância (`evolution_apikey`) e o
     número do atendente. Publique com o ID público `pharma-formulario`.
   - `typebot/atendimento.json`: preencha os links (`link_formulario` = `https://DOMINIO_VIEWER/pharma-formulario`).
     Publique com o ID público `pharma-atendimento`.
3. **Cloud API da Meta**:
   1. Crie a instância na Evolution:

      ```bash
      curl -X POST https://DOMINIO_EVOLUTION/instance/create \
        -H "apikey: EVOLUTION_API_KEY" -H "Content-Type: application/json" \
        -d '{"instanceName":"pharmaonline","integration":"WHATSAPP-BUSINESS","token":"TOKEN_PERMANENTE_META","number":"ID_DO_NUMERO","businessId":"ID_DA_CONTA_WHATSAPP_BUSINESS","qrcode":false}'
      ```

   2. No app da Meta (developers.facebook.com → WhatsApp → Configuração), configure o webhook:
      - URL de callback: `https://DOMINIO_EVOLUTION/webhook/meta`;
      - token de verificação: o mesmo de `META_TOKEN_VERIFICACAO_WEBHOOK`;
      - campo assinado: `messages`.
4. **Ligar o Typebot ao número**:

   ```bash
   curl -X POST https://DOMINIO_EVOLUTION/typebot/create/pharmaonline \
     -H "apikey: EVOLUTION_API_KEY" -H "Content-Type: application/json" \
     -d '{"enabled":true,"url":"https://DOMINIO_VIEWER","typebot":"pharma-atendimento","triggerType":"all","expire":0,"keywordFinish":"","delayMessage":1000,"unknownMessage":"Desculpe, não consigo ler áudios, imagens ou figurinhas. Por favor, digite o número da opção desejada ou 0 para ver o menu.","listeningFromMe":false,"stopBotFromMe":false,"keepOpen":false,"debounceTime":3}'
   ```

5. **Modelo de mensagem para o atendente** (exigência da Meta: fora da janela de 24 h, só modelos aprovados são
   entregues). Crie no Gerenciador do WhatsApp um modelo **Utilidade**, em pt_BR, chamado `novo_atendimento`, com o corpo:

   ```
   Novo atendimento recebido pelo formulário.
   Assunto: {{1}}
   Nome: {{2}}
   Telefone: {{3}}
   E-mail: {{4}}
   Mensagem: {{5}}
   Anexos: {{6}}
   ```

   Depois que o modelo for aprovado, preencha `template_atendente = novo_atendimento` no fluxo do formulário. Enquanto
   o campo estiver vazio, o resumo segue como texto livre. Esse texto só é entregue se o número do atendente tiver
   falado com o número do bot nas últimas 24 h.
   - O aviso ao cliente não precisa de modelo, porque ele acabou de falar com o bot.
   - Todos os formulários também ficam salvos no painel do Typebot, em **Resultados**.

## Arquivos

| Caminho | O que é |
|---------|---------|
| `config/menu.json` | itens do menu (ordem, nomes, frases aceitas, ativo/inativo) |
| `config/textos.json` | textos-modelo de todas as mensagens |
| `config/variaveis.example.json` | links, número do atendente e dados da Evolution (copie para `variaveis.json`) |
| `src/logica.js` | reconhecimento das mensagens, menu, resumo do formulário (copiado para dentro do Typebot) |
| `src/motor.js` | executor local dos fluxos (simulador e testes) |
| `scripts/gerar-typebot.mjs` | gera `typebot/atendimento.json` e `typebot/formulario.json` |
| `scripts/simular.mjs` | conversa no terminal |
| `scripts/testar-typebot-real.mjs` | compara um Typebot publicado com o simulador |
| `servidor/` | docker-compose (Evolution + Typebot + Postgres + Redis + MinIO + HTTPS) |
| `docs/previa-formulario-*.png` | capturas do formulário rodando no Typebot, nas cores da marca |
