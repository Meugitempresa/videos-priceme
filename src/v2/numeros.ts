// Simulações ilustrativas (exemplos fictícios, não são resultados de clientes nem saídas da PriceMe).
// As contas são conferidas aqui: se algum valor ficar incoerente, o render falha.

export const brl = (v: number) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Exemplo 2 — resultado mensal simplificado de uma loja fictícia
export const mes = {
  receita: 14873.46,
  variaveis: 5962.18,
  fixas: 4718.35,
  resultado: 4192.93,
};

// Exemplo 3 — contribuição por unidade de dois produtos fictícios
export const produtos = [
  { nome: "Produto A", preco: 79.9, variaveis: 48.37, contribuicao: 31.53 },
  { nome: "Produto B", preco: 44.9, variaveis: 21.14, contribuicao: 23.76 },
];

const confere = (ok: boolean, msg: string) => {
  if (!ok) throw new Error(`Conta incoerente: ${msg}`);
};
// contas feitas em centavos inteiros, sem erro de arredondamento
const c = (v: number) => Math.round(v * 100);
confere(c(mes.receita) - c(mes.variaveis) - c(mes.fixas) === c(mes.resultado), "resultado do mês");
for (const p of produtos) confere(c(p.preco) - c(p.variaveis) === c(p.contribuicao), `contribuição de ${p.nome}`);
confere(produtos[0].contribuicao > produtos[1].contribuicao, "Produto A contribui mais por unidade");
confere(brl(14873.46) === "R$ 14.873,46", "formato brasileiro");
