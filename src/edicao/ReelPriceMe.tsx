import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from "remotion";
import "../fontes";
import { marca } from "../marca";
import { Apresentadora } from "./Apresentadora";
import { Cena5Lucro } from "./cenas/Cena5Lucro";
import { Cena6Centavos } from "./cenas/Cena6Centavos";
import { Cortina } from "./Cortina";
import { Faixa } from "./Faixa";
import { Legenda } from "./Legenda";
import { Painel } from "./Painel";
import { DURACAO, q, s } from "./tempo";

// Cenas da parte de cima, na ordem da tabela aprovada (as demais entram na versão completa)
const CENAS: { de: number; ate: number; Cena: React.FC }[] = [
  { de: q("e", 2) - 6, ate: s(17.3), Cena: Cena5Lucro },
  { de: s(17.3), ate: q("e", 4) - 4, Cena: Cena6Centavos },
];

export const ReelPriceMe: React.FC = () => {
  const frame = useCurrentFrame();
  const cena = CENAS.find((c) => frame >= c.de && frame < c.ate);
  return (
    <AbsoluteFill style={{ background: marca.azulNoite }}>
      <Apresentadora />
      <Painel>{cena ? <cena.Cena /> : null}</Painel>
      <Faixa />
      <Cortina />
      <Legenda />
      <Audio src={staticFile("voz-tratada.wav")} />
    </AbsoluteFill>
  );
};

export const DURACAO_REEL = DURACAO;
