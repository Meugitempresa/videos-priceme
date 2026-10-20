import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import "../fontes";
import { marca } from "../marca";
import { Apresentadora } from "./Apresentadora";
import { Cena5Lucro } from "./cenas/Cena5Lucro";
import { Cena6Centavos } from "./cenas/Cena6Centavos";
import { Cena7Investir } from "./cenas/Cena7Investir";
import { Cena8Analise } from "./cenas/Cena8Analise";
import { Faixa } from "./Faixa";
import { Legenda } from "./Legenda";
import { Painel } from "./Painel";
import { telaCheia } from "./TelaCheia";
import { DURACAO, q } from "./tempo";

// Cenas da parte de cima, na ordem da tabela aprovada. Cada uma começa ~3 quadros antes
// da frase que ilustra e sai quando a próxima frase começa.
const CENAS: { de: number; ate: number; Cena: React.FC }[] = [
  { de: q("e", 2) - 6, ate: q("Com") - 3, Cena: Cena5Lucro },
  { de: q("Com") - 3, ate: q("e", 4) - 3, Cena: Cena6Centavos },
  { de: q("e", 4) - 3, ate: q("Ou") - 3, Cena: Cena7Investir },
  { de: q("Ou") - 3, ate: q("Enfim") - 3, Cena: Cena8Analise },
];

export const ReelPriceMe: React.FC = () => {
  const frame = useCurrentFrame();
  const cena = CENAS.find((c) => frame >= c.de && frame < c.ate);
  const cheia = telaCheia(frame);
  return (
    <AbsoluteFill style={{ background: marca.azulNoite }}>
      <Apresentadora />
      <Painel cheia={cheia}>
        {cena ? <cena.Cena /> : null}
        <Faixa />
      </Painel>
      <Legenda />
      <Audio src={staticFile("voz-tratada.wav")} />
    </AbsoluteFill>
  );
};

export const DURACAO_REEL = DURACAO;
