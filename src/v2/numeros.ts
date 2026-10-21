// Simulações ilustrativas (exemplos fictícios, não são resultados de clientes nem saídas da PriceMe).
// As contas são conferidas aqui: se algum valor ficar incoerente, o render falha.

export const brl = (v: number) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Exemplo 2 — resultado mensal simplificado de uma loja fictícia
export const mes = {
  receita: 15000,
  variaveis: 6000,
  fixas: 5000,
  resultado: 4000,
};

// Exemplo 3 — contribuição por unidade de dois produtos fictícios
export const produtos = [
  { nome: "Produto A", preco: 80, variaveis: 50, contribuicao: 30 },
  { nome: "Produto B", preco: 45, variaveis: 20, contribuicao: 25 },
];

const confere = (ok: boolean, msg: string) => {
  if (!ok) throw new Error(`Conta incoerente: ${msg}`);
};
confere(mes.receita - mes.variaveis - mes.fixas === mes.resultado, "resultado do mês");
for (const p of produtos) confere(p.preco - p.variaveis === p.contribuicao, `contribuição de ${p.nome}`);
confere(brl(15000) === "R$ 15.000,00", "formato brasileiro");
