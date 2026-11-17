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
    .filter((item) => item && item.id && item.nome)
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

/** "Bom dia" / "Boa tarde" / "Boa noite" no horário de Brasília (UTC-3, sem horário de verão). */
export function saudacaoPorHorario(agora) {
  const data = agora instanceof Date ? agora : new Date();
  const hora = (data.getUTCHours() + 21) % 24;
  if (hora >= 5 && hora < 12) return 'Bom dia';
  if (hora >= 12 && hora < 18) return 'Boa tarde';
  return 'Boa noite';
}

/** Só os dígitos do número do WhatsApp ("5511999999999@s.whatsapp.net" -> "5511999999999"). */
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
 *  1. "0" / "voltar" / "menu"  -> acao "menu" (volta à primeira mensagem)
 *  2. número de 1 a N          -> o item
 *  3. nome ou apelido do item  -> o item (vence a frase mais longa encontrada)
 *  4. saudação                 -> acao "menu" (cumprimento + menu)
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
    'pharma', 'pharmaonline', 'pharmaonlineplus', 'farmacia', 'salve', 'saudacoes', 'prezados',
    'prezado', 'prezada', 'ok', 'sim', 'da', 'do', 'de', 'a', 'o', 'aqui', 'ai',
  ];
  const ehCumprimento = palavras.every((p) => cumprimentos.includes(p));
  const temSaudacao = palavras.some((p) =>
    ['oi', 'oii', 'oiii', 'oie', 'ola', 'olaa', 'opa', 'eai', 'hey', 'hi', 'hello', 'alo', 'bom', 'boa',
      'salve', 'saudacoes', 'prezados', 'prezado', 'prezada', 'tudo'].includes(p)) || t === 'e ai';
  if (ehCumprimento && temSaudacao) return resultado('menu');

  // 5. Agradecimento ("obrigado", "muito obrigada", "valeu")
  const agradecimentos = ['obrigado', 'obrigada', 'obg', 'brigado', 'brigada', 'valeu', 'vlw', 'grato', 'grata', 'agradeco'];
  if (palavras.some((p) => agradecimentos.includes(p)) && palavras.length <= 6) return resultado('agradecimento');

  // 6. Não reconhecida
  return resultado('desconhecido');
}

/** Tudo que o fluxo do Typebot precisa depois de receber uma mensagem, num JSON só. */
export function processarMensagem(entrada, config, remoteJid, baseFormulario) {
  const r = reconhecer(entrada, config);
  return JSON.stringify({
    acao: r.acao,
    item_nome: r.nome,
    link_form: r.formulario ? linkFormulario(baseFormulario, r.nome, remoteJid) : '',
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

/** Corpo do POST à Evolution para o atendente: texto livre ou modelo aprovado pela Meta. */
export function corpoAtendente(dados, numeroAtendente, template, idioma, agora) {
  const numero = String(numeroAtendente ?? '').replace(/\D/g, '');
  const nomeTemplate = String(template ?? '').trim();
  if (!nomeTemplate) {
    return JSON.stringify({ number: numero, text: montarResumo(dados, agora) });
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
    number: numero,
    name: nomeTemplate,
    language: String(idioma ?? '').trim() || 'pt_BR',
    components: [{ type: 'body', parameters: parametros }],
  });
}

/** Corpo do POST à Evolution com o aviso para o cliente (vai para o WhatsApp de origem). */
export function corpoCliente(whatsapp, telefoneDigitado, texto) {
  const numero = numeroDoWhatsApp(whatsapp) || String(telefoneDigitado ?? '').replace(/\D/g, '');
  return JSON.stringify({ number: numero, text: String(texto ?? '') });
}
