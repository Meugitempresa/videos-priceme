# Bot de atendimento pHarmaOnline (WhatsApp)

O bot usa o **Typebot** conectado direto à **API oficial do WhatsApp (Cloud API da Meta)**, pela integração nativa do
Typebot, sem nenhum intermediário.
É um bot **simples e engessado**: não tem IA e não conversa. Ele mostra um menu numerado e responde a cada opção.
Se a mensagem não tiver relação com o menu, ele explica em uma frase como escolher a opção e mostra o menu de novo.

## Situação (Parte 1)

| Nº | Opção | Status |
|----|-------|--------|
| 0 | Voltar ao menu inicial | ✅ pronto (funciona em qualquer ponto da conversa) |
| 1 | Orçamento pelo app | ✅ pronto (links provisórios) |
| 2 | Orçamento pelo WhatsApp (ordem de pedido) | ⏳ próxima parte (responde "disponível em breve") |
| 3 | Acessar o site | ✅ pronto (link provisório) |
| 4 | Administrativo/Financeiro | ✅ pronto (formulário web; resumo ao atendente por e-mail) |
| 5 | Redes sociais | ✅ pronto (links provisórios @pharmaonlineplus) |
| 6 | Fale conosco | ✅ pronto (formulário web; resumo ao atendente por e-mail) |

**Como chega o formulário preenchido:** o atendente recebe **um e-mail organizado** com todos os dados
(`docs/previa-email-atendente.png`). O botão "Responder" do e-mail já vai para o cliente. O cliente recebe no WhatsApp o aviso
de que em breve entrarão em contato. O envio do resumo também por WhatsApp está pronto, mas desligado: ele exige cartão na
conta da Meta (veja o passo 5 da instalação).

**Dados pendentes (a cliente envia):**
- links do app, do site e das redes sociais;
- e-mail que recebe os formulários (`email_atendente`);
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
     - `email_atendente`: quem recebe os formulários;
     - `meta_id_numero` e `meta_token`: os mesmos do passo 3.

     Deixe `numero_atendente` vazio. Publique com o ID público `pharma-formulario`. O e-mail sai pelo SMTP do `.env`.
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
5. **(Opcional, exige cartão) Resumo também por WhatsApp para o atendente.** Hoje ele vai só por e-mail. Mensagens
   iniciadas pela empresa precisam de modelo aprovado. Para ligar, preencha `numero_atendente` no fluxo do formulário e
   crie no Gerenciador do WhatsApp um modelo **Utilidade**, em pt_BR, chamado `novo_atendimento`, com o corpo:

   ```
   Novo atendimento recebido pelo formulário.
   Assunto: {{1}}
   Nome: {{2}}
   Telefone: {{3}}
   E-mail: {{4}}
   Mensagem: {{5}}
   Anexos: {{6}}
   ```

   Depois que o modelo for aprovado, preencha `template_atendente = novo_atendimento`. Enquanto o campo estiver vazio, o
   resumo segue como texto livre. Esse texto só é entregue se o atendente tiver falado com o número do bot nas últimas
   24 h. Todos os formulários também ficam salvos no painel do Typebot, em **Resultados**.

**Validação feita:** o Typebot oficial rodou com uma "Meta falsa" no lugar da API real.
- Mensagens no formato da Meta, enviadas ao webhook nativo, foram respondidas: menu, opções, frases, 0, figurinha e
  agradecimento.
- O formulário enviou o e-mail ao atendente e o aviso ao cliente pela API da Meta.

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
