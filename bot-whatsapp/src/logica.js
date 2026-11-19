// Lógica do bot, em JavaScript puro e determinístico (sem IA).
// Estas funções rodam em dois lugares:
//  1. aqui no Node (testes e simulador);
//  2. dentro do Typebot: o gerador (scripts/gerar-typebot.mjs) copia o código-fonte de todas elas
//     para os blocos "Set variable" do fluxo. Por isso cada função usa só JavaScript padrão,
//     sem imports e sem variáveis de fora; elas só chamam umas às outras.

/** Minúsculas, sem acentos, sem pontuação/emojis e com espaços simples. "1️⃣" vira "1". */
export function normalizar(texto) {
  return String(texto ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    // reserva, caso o ambiente não decomponha acentos com normalize()
    .replace(/[áàâãä]/g, 'a').replace(/[éèêë]/g, 'e').replace(/[íìîï]/g, 'i')
    .replace(/[óòôõö]/g, 'o').replace(/[úùûü]/g, 'u').replace(/ç/g, 'c').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/** Lê a configuração do menu (texto JSON do Typebot, lista ou objeto { itens }). */
export function lerMenu(config) {
  let dados = config;
  if (typeof dados === 'string') {
    try { dados = JSON.parse(dados); } catch (e) { dados = []; }
  }
  if (dados && !Array.isArray(dados)) dados = dados.itens;
  if (!Array.isArray(dados)) return [];
  return dados
    // oculto: true tira o item do menu (não aparece, não ganha número e não é reconhecido)
    .filter((item) => item && item.id && item.nome && item.oculto !== true)
    .map((item, i) => ({
      id: String(item.id),
      nome: String(item.nome),
      apelidos: Array.isArray(item.apelidos) ? item.apelidos.map(String) : [],
      ativo: item.ativo !== false,
      formulario: item.formulario === true,
      numero: i + 1,
    }));
}

/**
 * Lista numerada: o 0 fixo e depois os itens na ordem da configuração (números automáticos).
 * O Typebot lê o valor das variáveis como Markdown: **n** vira negrito (e *n* no WhatsApp).
 */
export function montarMenu(config) {
  const linhas = ['**0** - Voltar ao menu inicial'];
  for (const item of lerMenu(config)) linhas.push('**' + item.numero + '** - ' + item.nome);
  return linhas.join('\n');
}

/** Só os dígitos do número do WhatsApp ("+55 11 99999-9999" ou "5511999999999@s.whatsapp.net" -> "5511999999999"). */
export function numeroDoWhatsApp(remoteJid) {
  return String(remoteJid ?? '').split('@')[0].replace(/\D/g, '');
}

/** Link do formulário web com o assunto e o WhatsApp de quem pediu. */
export function linkFormulario(base, assunto, whatsapp) {
  const url = String(base ?? '').trim();
  if (!url) return '';
  let link = url + (url.includes('?') ? '&' : '?') + 'assunto=' + encodeURIComponent(assunto || '');
  const numero = numeroDoWhatsApp(whatsapp);
  if (numero) link += '&whatsapp=' + numero;
  return link;
}

/**
 * Decide o que fazer com a mensagem recebida. Ordem:
 *  1. "0" / "voltar" / "menu"  -> acao "menu" (só o menu, sem banner)
 *  2. número de 1 a N          -> o item
 *  3. nome ou apelido do item  -> o item (vence a frase mais longa encontrada)
 *  4. saudação                 -> acao "saudacao" (banner + boas-vindas + menu)
 *  5. agradecimento            -> acao "agradecimento"
 *  6. qualquer outra coisa     -> acao "desconhecido" (explica e mostra o menu)
 * Item ativo -> acao = id do item; item inativo -> acao "indisponivel".
 */
export function reconhecer(entrada, config) {
  const menu = lerMenu(config);
  const t = normalizar(entrada);
  const resultado = (acao, item) => ({
    acao,
    id: item ? item.id : '',
    nome: item ? item.nome : '',
    numero: item ? item.numero : null,
    formulario: item ? item.formulario : false,
  });
  const doItem = (item) => resultado(item.ativo ? item.id : 'indisponivel', item);

  if (!t) return resultado('desconhecido');

  // 1. Voltar ao menu inicial
  const voltar = [
    '0', 'opcao 0', 'numero 0', 'zero', 'voltar', 'volta', 'menu', 'menu inicial', 'inicio',
    'voltar ao menu', 'voltar ao menu inicial', 'voltar ao inicio', 'voltar para o menu',
    'voltar pro menu', 'ver o menu', 'ver menu', 'opcoes', 'ver opcoes',
  ];
  if (voltar.includes(t)) return resultado('menu');

  // 2. Número digitado ("1", "1.", "opção 1", "nº 1", "1️⃣")
  const numero = t.match(/^(?:opcao|op|numero|n|item)?\s*(\d{1,2})$/);
  if (numero) {
    const n = Number(numero[1]);
    if (n === 0) return resultado('menu');
    const item = menu.find((i) => i.numero === n);
    return item ? doItem(item) : resultado('desconhecido');
  }

  // 3. Nome ou apelido do item (frase inteira contida na mensagem, ou todas as palavras importantes dela)
  const irrelevantes = [
    'a', 'o', 'as', 'os', 'de', 'do', 'da', 'dos', 'das', 'e', 'em', 'no', 'na', 'nos', 'nas',
    'pelo', 'pela', 'por', 'para', 'pra', 'pro', 'com', 'um', 'uma', 'ao', 'quero', 'gostaria',
    'queria', 'preciso', 'fazer', 'ver', 'saber', 'sobre', 'meu', 'minha', 'qual', 'quais', 'o que',
  ];
  const palavras = t.split(' ');
  let melhor = null;
  for (const item of menu) {
    for (const frase of [item.nome, ...item.apelidos]) {
      const f = normalizar(frase);
      if (!f) continue;
      const importantes = f.split(' ').filter((p) => !irrelevantes.includes(p));
      const contida = (' ' + t + ' ').includes(' ' + f + ' ');
      const todas = importantes.length > 0 && importantes.every((p) => palavras.includes(p));
      if ((contida || todas) && (!melhor || f.length > melhor.tamanho)) {
        melhor = { item, tamanho: f.length };
      }
    }
  }
  if (melhor) return doItem(melhor.item);

  // 4. Saudação: a mensagem só tem palavras de cumprimento ("Oi, bom dia! Tudo bem?")
  const cumprimentos = [
    'oi', 'oii', 'oiii', 'oie', 'ola', 'olaa', 'opa', 'eai', 'e', 'ai', 'hey', 'hi', 'hello', 'alo',
    'bom', 'boa', 'dia', 'tarde', 'noite', 'madrugada', 'tudo', 'bem', 'td', 'bm', 'como', 'vai',
    'voce', 'vc', 'vcs', 'voces', 'esta', 'ta', 'tao', 'estao', 'pessoal', 'gente', 'equipe',
    'pharma', 'online', 'pharmaonline', 'pharmaonlineplus', 'farmacia', 'salve', 'saudacoes', 'prezados',
    'prezado', 'prezada', 'ok', 'sim', 'da', 'do', 'de', 'a', 'o', 'aqui', 'ai',
  ];
  const ehCumprimento = palavras.every((p) => cumprimentos.includes(p));
  const temSaudacao = palavras.some((p) =>
    ['oi', 'oii', 'oiii', 'oie', 'ola', 'olaa', 'opa', 'eai', 'hey', 'hi', 'hello', 'alo', 'bom', 'boa',
      'salve', 'saudacoes', 'prezados', 'prezado', 'prezada', 'tudo'].includes(p)) || t === 'e ai';
  if (ehCumprimento && temSaudacao) return resultado('saudacao');

  // 5. Agradecimento ("obrigado", "muito obrigada", "valeu")
  const agradecimentos = ['obrigado', 'obrigada', 'obg', 'brigado', 'brigada', 'valeu', 'vlw', 'grato', 'grata', 'agradeco'];
  if (palavras.some((p) => agradecimentos.includes(p)) && palavras.length <= 6) return resultado('agradecimento');

  // 6. Não reconhecida
  return resultado('desconhecido');
}

/** Tudo que o fluxo do Typebot precisa depois de receber uma mensagem, num JSON só. */
export function processarMensagem(entrada, config, telefoneWhatsApp, baseFormulario) {
  const r = reconhecer(entrada, config);
  return JSON.stringify({
    acao: r.acao,
    item_nome: r.nome,
    link_form: r.formulario ? linkFormulario(baseFormulario, r.nome, telefoneWhatsApp) : '',
  });
}

/** Data e hora de Brasília: "17/11/2026 às 14:32". */
export function dataHoraBrasilia(agora) {
  const d = new Date((agora instanceof Date ? agora : new Date()).getTime() - 3 * 3600 * 1000);
  const dois = (n) => String(n).padStart(2, '0');
  return dois(d.getUTCDate()) + '/' + dois(d.getUTCMonth() + 1) + '/' + d.getUTCFullYear() +
    ' às ' + dois(d.getUTCHours()) + ':' + dois(d.getUTCMinutes());
}

/** Anexos do Typebot (lista ou texto separado por vírgula) -> lista de links. */
export function listaDeAnexos(anexos) {
  if (Array.isArray(anexos)) return anexos.map((a) => String(a ?? '').trim()).filter(Boolean);
  const texto = String(anexos ?? '').trim();
  if (!texto) return [];
  return texto.split(/\s*,\s*(?=https?:\/\/)|\s+(?=https?:\/\/)/).map((a) => a.trim()).filter(Boolean);
}

/** Mensagem única e organizada que vai para o atendente. */
export function montarResumo(dados, agora) {
  const v = (x) => String(x ?? '').trim() || '(não informado)';
  const anexos = listaDeAnexos(dados.anexos);
  const linhas = [
    '📋 *Novo atendimento: ' + v(dados.assunto) + '*',
    '',
    '*Nome:* ' + v(dados.nome),
    '*Telefone:* ' + v(dados.telefone),
    '*E-mail:* ' + v(dados.email),
  ];
  const whatsapp = numeroDoWhatsApp(dados.whatsapp);
  if (whatsapp) linhas.push('*WhatsApp de origem:* +' + whatsapp);
  linhas.push('', '*Dúvida/mensagem:*', v(dados.duvida), '');
  if (anexos.length) {
    linhas.push('*Anexos (' + anexos.length + '):*');
    anexos.forEach((a, i) => linhas.push((i + 1) + '. ' + a));
  } else {
    linhas.push('*Anexos:* nenhum');
  }
  linhas.push('', 'Enviado em ' + dataHoraBrasilia(agora));
  return linhas.join('\n');
}

/** Corpo do POST à API da Meta para o atendente: texto livre ou modelo aprovado (exige cartão na conta da Meta). */
export function corpoAtendente(dados, numeroAtendente, template, idioma, agora) {
  const numero = String(numeroAtendente ?? '').replace(/\D/g, '');
  const nomeTemplate = String(template ?? '').trim();
  if (!nomeTemplate) {
    return JSON.stringify({
      messaging_product: 'whatsapp', recipient_type: 'individual', to: numero, type: 'text',
      text: { preview_url: false, body: montarResumo(dados, agora) },
    });
  }
  // Parâmetros de modelo não aceitam quebras de linha nem 4+ espaços seguidos.
  const limpar = (x) => (String(x ?? '').trim() || '(não informado)')
    .replace(/\s*\n+\s*/g, ' / ').replace(/\s{4,}/g, '   ').slice(0, 1000);
  const anexos = listaDeAnexos(dados.anexos);
  const parametros = [
    dados.assunto, dados.nome, dados.telefone, dados.email, dados.duvida,
    anexos.length ? anexos.join(' ; ') : 'nenhum',
  ].map((texto) => ({ type: 'text', text: limpar(texto) }));
  return JSON.stringify({
    messaging_product: 'whatsapp', recipient_type: 'individual', to: numero, type: 'template',
    template: {
      name: nomeTemplate,
      language: { code: String(idioma ?? '').trim() || 'pt_BR' },
      components: [{ type: 'body', parameters: parametros }],
    },
  });
}

/** Assunto do e-mail para o atendente. */
export function assuntoEmail(dados) {
  const nome = String(dados.nome ?? '').trim();
  return 'Novo atendimento: ' + (String(dados.assunto ?? '').trim() || 'Fale conosco') + (nome ? ' – ' + nome : '');
}

/** E-mail (HTML) para o atendente com tudo o que o cliente preencheu, nas cores da marca. */
export function montarResumoHtml(dados, agora) {
  const esc = (x) => String(x ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const v = (x) => esc(String(x ?? '').trim() || '(não informado)');
  const anexos = listaDeAnexos(dados.anexos);
  const whatsapp = numeroDoWhatsApp(dados.whatsapp);
  const linha = (rotulo, valor) =>
    '<tr><td style="padding:6px 12px 6px 0;color:#2D4589;font-weight:bold;white-space:nowrap;vertical-align:top">' +
    rotulo + '</td><td style="padding:6px 0;color:#1F2A44">' + valor + '</td></tr>';
  const email = String(dados.email ?? '').trim();
  const linhas = [
    linha('Nome', v(dados.nome)),
    linha('Telefone', v(dados.telefone)),
    linha('E-mail', email ? '<a href="mailto:' + esc(email) + '" style="color:#2D4589">' + esc(email) + '</a>' : v('')),
  ];
  if (whatsapp) linhas.push(linha('WhatsApp de origem', '<a href="https://wa.me/' + whatsapp + '" style="color:#2D4589">+' + whatsapp + '</a>'));
  const listaAnexos = anexos.length
    ? '<ol style="margin:0;padding-left:20px">' + anexos.map((a) =>
      '<li><a href="' + esc(a) + '" style="color:#2D4589">' + esc(a) + '</a></li>').join('') + '</ol>'
    : 'nenhum';
  return '<div style="font-family:Montserrat,Arial,sans-serif;max-width:600px;margin:0 auto;border:1px solid #E3E7F2;border-radius:10px;overflow:hidden">' +
    '<div style="background:#2D4589;color:#FFFFFF;padding:18px 22px;font-size:18px;font-weight:bold">' +
    'Novo atendimento: ' + v(dados.assunto) + '</div>' +
    '<div style="height:4px;background:#F49AC1"></div>' +
    '<div style="padding:18px 22px;font-size:15px;line-height:1.5">' +
    '<table style="border-collapse:collapse">' + linhas.join('') + '</table>' +
    '<p style="margin:18px 0 6px;color:#2D4589;font-weight:bold">Dúvida/mensagem</p>' +
    '<div style="background:#F6F7FB;border-left:4px solid #F49AC1;padding:12px 14px;color:#1F2A44">' +
    v(dados.duvida).replace(/\r?\n/g, '<br>') + '</div>' +
    '<p style="margin:18px 0 6px;color:#2D4589;font-weight:bold">Anexos (' + anexos.length + ')</p>' + listaAnexos +
    '<p style="margin:22px 0 0;color:#6B7280;font-size:13px">Enviado em ' + dataHoraBrasilia(agora) +
    ' pelo formulário de atendimento. Para falar com o cliente, basta responder este e-mail.</p>' +
    '</div></div>';
}

/** Corpo do POST à API da Meta com o aviso para o cliente (vai para o WhatsApp de origem). */
export function corpoCliente(whatsapp, telefoneDigitado, texto) {
  const numero = numeroDoWhatsApp(whatsapp) || String(telefoneDigitado ?? '').replace(/\D/g, '');
  return JSON.stringify({
    messaging_product: 'whatsapp', recipient_type: 'individual', to: numero, type: 'text',
    text: { preview_url: false, body: String(texto ?? '') },
  });
}

/** Endereço da API da Meta para enviar mensagens pelo número do bot. */
export function urlMensagensMeta(base, versao, idNumero) {
  return String(base ?? '').trim().replace(/\/+$/, '') + '/' + (String(versao ?? '').trim() || 'v21.0') + '/' +
    String(idNumero ?? '').trim() + '/messages';
}
