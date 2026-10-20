import { Img, staticFile } from "remotion";
import { marca } from "../marca";

// Logo oficial sem alterações: o quadrado azul do arquivo se funde a um cartão do mesmo azul.
// Só é recortado o fundo liso; o desenho mantém proporção, cores e nitidez (sem desfoque).
export const Logo: React.FC<{ largura: number; style?: React.CSSProperties }> = ({ largura, style }) => {
  const img = largura * 1.18; // a arte ocupa ~50 % do arquivo de 945 px
  const altura = largura * 0.53;
  return (
    <div
      style={{
        position: "absolute",
        width: largura,
        height: altura,
        overflow: "hidden",
        borderRadius: 28,
        background: marca.azul,
        boxShadow: "0 18px 50px rgba(0,0,0,0.35)",
        ...style,
      }}
    >
      <Img
        src={staticFile("marca/logo-priceme.png")}
        style={{
          position: "absolute",
          width: img,
          height: img,
          left: largura / 2 - img * (545 / 945),
          top: altura / 2 - img * (497 / 945),
        }}
      />
    </div>
  );
};
