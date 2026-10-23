// Exemplo didático hipotético (não são dados de clientes nem resultados reais da PriceMe).
// As contas são feitas em centavos inteiros; se algo ficar incoerente, o render falha.

export const brl = (v: number) =>
  "R$ " + v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const pct = (v: number) =>
  v.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "%";

export const produto = {
  preco: 89.9,
  custo: 31.47,
  despesasVariaveis: 12.68,
  tributos: 5.39,
  margem: 40.36, // margem de contribuição por unidade (antes das despesas fixas)
  margemPct: 44.89, // sobre o preço de venda
};

const c = (v: number) => Math.round(v * 100);
const confere = (ok: boolean, msg: string) => {
  if (!ok) throw new Error(`Conta incoerente: ${msg}`);
};
confere(
  c(produto.preco) - c(produto.custo) - c(produto.despesasVariaveis) - c(produto.tributos) === c(produto.margem),
  "margem de contribuição",
);
confere(Math.round((c(produto.margem) / c(produto.preco)) * 10000) / 100 === produto.margemPct, "percentual da margem");
confere(brl(89.9) === "R$ 89,90" && pct(44.89) === "44,89%", "formato brasileiro");
