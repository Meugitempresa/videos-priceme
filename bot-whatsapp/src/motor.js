// Motor local que executa os fluxos gerados (typebot/*.json) imitando as regras do Typebot:
//  - "Set variable": o código roda com as variáveis {{nome}} passadas como argumentos e os valores
//    convertidos como no Typebot (parseGuessedValueType: "1" vira número, "0" também);
//    se o código der erro, o valor vira o texto com as variáveis trocadas (é assim que o campo
//    "Value" do Typebot funciona);
//  - Condition "Equal to" / "Is set" / "Is empty";
//  - HTTP request (bloco "Webhook") com corpo que é uma variável;
//  - entradas de texto, e-mail, telefone e arquivo, com as validações básicas.
// Serve para o simulador (scripts/simular.mjs) e para os testes. Não substitui o teste no Typebot real.

const AsyncFunction = (async () => {}).constructor;

export function valorAdivinhado(valor) {
  if (valor === null) return null;
  if (valor === undefined) return undefined;
  if (typeof valor !== 'string') return valor;
  if (valor.startsWith('0') && !valor.startsWith('0.') && valor.length > 1) return valor;
  if (valor.startsWith('+')) return valor;
  if (valor === 'true') return true;
  if (valor === 'false') return false;
  if (valor === 'null') return null;
  if (valor === 'undefined') return undefined;
  const n = Number(valor);
  if (Number.isNaN(n)) return valor;
  if (Number.isInteger(n) && !Number.isSafeInteger(n)) return valor;
  return n;
}

const comoTexto = (valor) => {
  if (valor === undefined || valor === null) return '';
  if (Array.isArray(valor)) return valor.join(', ');
  return typeof valor === 'string' ? valor : JSON.stringify(valor);
};

export function criarSessao(typebot, { preenchidas = {}, fetch: fetchFn = globalThis.fetch, log = () => {} } = {}) {
  const porNome = new Map(typebot.variables.map((v) => [v.name, v]));
  const porId = new Map(typebot.variables.map((v) => [v.id, v]));
  const valores = new Map();
  for (const [nome, valor] of Object.entries(preenchidas)) {
    if (porNome.has(nome)) valores.set(porNome.get(nome).id, valor);
  }
  const grupos = new Map(typebot.groups.map((g) => [g.id, g]));
  const arestas = new Map(typebot.edges.map((e) => [e.id, e]));
  const http = [];
  const emails = [];
  let pendente = null; // { grupo, indice, bloco }
  let terminou = false;

  const trocarTexto = (texto, { dentroDeJson = false } = {}) =>
    String(texto ?? '').replace(/\{\{([^{}]+?)\}\}/g, (_t, nome) => {
      const v = porNome.get(nome);
      if (!v || !valores.has(v.id) || valores.get(v.id) === undefined) return '';
      const valor = valores.get(v.id);
      if (dentroDeJson) return JSON.stringify(comoTexto(valor)).slice(1, -1);
      return comoTexto(valor);
    });

  async function executarCodigo(codigo) {
    const usadas = [];
    const corpo = codigo.replace(/\{\{([^{}]+?)\}\}/g, (t, nome) => {
      const v = porNome.get(nome);
      if (!v) return '';
      if (!usadas.includes(v)) usadas.push(v);
      return v.id;
    });
    const fn = new AsyncFunction(...usadas.map((v) => v.id), corpo.includes('return ') ? corpo : 'return ' + corpo);
    return fn(...usadas.map((v) => valorAdivinhado(valores.get(v.id))));
  }

  async function avaliar(expr) {
    const ehUmaVariavel = expr.startsWith('{{') && expr.endsWith('}}') && expr.split('{{').length === 2;
    if (ehUmaVariavel) return trocarTexto(expr);
    try {
      return await executarCodigo(expr);
    } catch (e) {
      return trocarTexto(expr);
    }
  }

  // Nos balões, o Typebot lê o valor das variáveis como Markdown (**x** = negrito, *x* ou _x_ = itálico);
  // a Evolution manda negrito como *x* e itálico como _x_ para o WhatsApp.
  const markdownParaWhatsApp = (texto) => texto
    .replace(/\*\*([^*\n]+)\*\*/g, '\u0000$1\u0000')
    .replace(/(^|[^\w*])\*([^*\n]+)\*(?![\w*])/g, '$1_$2_')
    .replace(/\u0000([^\u0000]+)\u0000/g, '*$1*');
  const renderizar = (bloco) => bloco.content.richText
    .map((p) => p.children.map((c) => {
      const texto = markdownParaWhatsApp(trocarTexto(c.text));
      return c.bold && texto ? '*' + texto + '*' : texto;
    }).join(''))
    .join('\n');

  const seguirAresta = (edgeId) => {
    const e = arestas.get(edgeId);
    if (!e) return null;
    const g = grupos.get(e.to.groupId);
    const indice = e.to.blockId ? g.blocks.findIndex((b) => b.id === e.to.blockId) : 0;
    return { grupo: g, indice };
  };

  function condicaoVale(item) {
    const resultados = item.content.comparisons.map((c) => {
      const valor = valores.get(c.variableId);
      const texto = valor === undefined || valor === null ? valor : comoTexto(valor);
      switch (c.comparisonOperator) {
        case 'Equal to': return texto !== undefined && texto !== null && texto.normalize() === String(c.value ?? '').normalize();
        case 'Is set': return texto !== undefined && texto !== null && texto.length > 0;
        case 'Is empty': return texto === undefined || texto === null || texto.length === 0;
        default: throw new Error('operador não suportado no motor: ' + c.comparisonOperator);
      }
    });
    return item.content.logicalOperator === 'OR' ? resultados.some(Boolean) : resultados.every(Boolean);
  }

  async function rodar(posicao) {
    const mensagens = [];
    let atual = posicao;
    let passos = 0;
    while (atual) {
      if (++passos > 500) throw new Error('fluxo em laço infinito');
      const { grupo, indice } = atual;
      const bloco = grupo.blocks[indice];
      if (!bloco) { terminou = true; break; }
      const proximo = () => (bloco.outgoingEdgeId ? seguirAresta(bloco.outgoingEdgeId) : { grupo, indice: indice + 1 });
      switch (bloco.type) {
        case 'text':
          mensagens.push(renderizar(bloco));
          atual = proximo();
          break;
        case 'Set variable': {
          const valor = await avaliar(bloco.options.expressionToEvaluate ?? '');
          valores.set(bloco.options.variableId, valor);
          log('set', porId.get(bloco.options.variableId).name, valor);
          atual = proximo();
          break;
        }
        case 'Condition': {
          const item = bloco.items.find(condicaoVale);
          atual = item ? seguirAresta(item.outgoingEdgeId) : (bloco.outgoingEdgeId ? seguirAresta(bloco.outgoingEdgeId) : { grupo, indice: indice + 1 });
          break;
        }
        case 'Jump':
          atual = { grupo: grupos.get(bloco.options.groupId), indice: 0 };
          break;
        case 'Webhook': {
          const w = bloco.options.webhook;
          const url = trocarTexto(w.url);
          const headers = Object.fromEntries((w.headers ?? []).map((h) => [h.key, trocarTexto(h.value)]));
          const corpoEhVariavel = /^\{\{[^{}]+\}\}$/.test((w.body ?? '').trim());
          const body = trocarTexto(w.body, { dentroDeJson: !corpoEhVariavel });
          const registro = { url, method: w.method, headers, body };
          http.push(registro);
          try {
            const r = await fetchFn(url, { method: w.method, headers, body });
            registro.status = r.status;
          } catch (e) {
            registro.erro = String(e.message ?? e);
          }
          for (const m of bloco.options.responseVariableMapping ?? []) {
            if (m.bodyPath === 'statusCode' && m.variableId) valores.set(m.variableId, registro.status ?? 500);
          }
          atual = proximo();
          break;
        }
        case 'Email': {
          const o = bloco.options;
          const email = {
            para: (o.recipients ?? []).map((r) => trocarTexto(r)).filter(Boolean),
            assunto: trocarTexto(o.subject),
            html: o.isBodyCode ? trocarTexto(o.body) : undefined,
            texto: o.isBodyCode ? undefined : trocarTexto(o.body),
            responderPara: trocarTexto(o.replyTo),
          };
          emails.push(email);
          log('email', email);
          atual = proximo();
          break;
        }
        case 'text input':
        case 'email input':
        case 'phone number input':
        case 'file input':
          pendente = { grupo, indice, bloco };
          return mensagens;
        default:
          throw new Error('bloco não suportado no motor: ' + bloco.type);
      }
    }
    terminou = true;
    return mensagens;
  }

  function validarEntrada(bloco, texto) {
    const t = String(texto ?? '').trim();
    switch (bloco.type) {
      case 'text input':
        return t ? { ok: true, valor: t } : { ok: false };
      case 'email input':
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t) ? { ok: true, valor: t } : { ok: false, aviso: bloco.options.retryMessageContent };
      case 'phone number input': {
        let digitos = t.replace(/\D/g, '');
        if (!t.startsWith('+') && (digitos.length === 10 || digitos.length === 11)) digitos = '55' + digitos;
        return digitos.length >= 12 && digitos.length <= 13
          ? { ok: true, valor: '+' + digitos }
          : { ok: false, aviso: bloco.options.retryMessageContent };
      }
      case 'file input': {
        if (!t || /^(pular|skip|nao|não)$/i.test(t)) {
          return bloco.options.isRequired === false ? { ok: true, valor: undefined } : { ok: false };
        }
        const urls = t.split(/\s+/).filter((u) => /^https?:\/\//.test(u));
        if (!urls.length) return { ok: false };
        return { ok: true, valor: bloco.options.isMultipleAllowed ? urls : urls[0] };
      }
      default:
        return { ok: false };
    }
  }

  return {
    get valores() {
      return Object.fromEntries([...valores.entries()].map(([id, v]) => [porId.get(id).name, v]));
    },
    get http() { return http; },
    get emails() { return emails; },
    get terminou() { return terminou; },
    get aguardando() { return pendente?.bloco.type ?? null; },
    async iniciar() {
      const inicio = typebot.events.find((e) => e.type === 'start');
      return rodar(seguirAresta(inicio.outgoingEdgeId));
    },
    async responder(texto) {
      if (!pendente) throw new Error('o fluxo não está esperando resposta');
      const { grupo, indice, bloco } = pendente;
      const r = validarEntrada(bloco, texto);
      if (!r.ok) return r.aviso ? [r.aviso] : [];
      pendente = null;
      if (r.valor !== undefined) valores.set(bloco.options.variableId, r.valor);
      const seguinte = bloco.outgoingEdgeId ? seguirAresta(bloco.outgoingEdgeId) : { grupo, indice: indice + 1 };
      return rodar(seguinte);
    },
  };
}
