import { AbsoluteFill, OffthreadVideo, staticFile } from "remotion";
import "../fontes";
import { AlimentarSistema, CalculoReverso, EnxergarLucro, EsforcoLucro } from "./Cartoes";
import { TextoFinal } from "./Correcoes";
import { Legenda } from "./Legenda";
import "./numeros";

// Reel 2: o vídeo original inteiro (imagem e áudio, sem cortes) com legendas completas,
// cartões sincronizados com a fala e correções pontuais do material original.
export const ReelPriceMe2: React.FC = () => (
  <AbsoluteFill style={{ background: "#000" }}>
    <OffthreadVideo src={staticFile("reel2/original.mp4")} style={{ width: 1080, height: 1920 }} />
    <EsforcoLucro />
    <CalculoReverso />
    <AlimentarSistema />
    <EnxergarLucro />
    <TextoFinal />
    <Legenda />
  </AbsoluteFill>
);
