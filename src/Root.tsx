import { Composition } from "remotion";
import { DURACAO_REEL, ReelPriceMe } from "./edicao/ReelPriceMe";
import { DURACAO as DURACAO_REEL2 } from "./reel2/tempo";
import { ReelPriceMe2 } from "./reel2/ReelPriceMe2";
import { DURACAO as DURACAO_PHARMA, PharmaOnline } from "./pharma/PharmaOnline";
import { TestePriceMe } from "./TestePriceMe";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="ReelPriceMe"
        component={ReelPriceMe}
        durationInFrames={DURACAO_REEL}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="ReelPriceMe2"
        component={ReelPriceMe2}
        durationInFrames={DURACAO_REEL2}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="PharmaOnline"
        component={PharmaOnline}
        durationInFrames={DURACAO_PHARMA}
        fps={30}
        width={1080}
        height={1920}
      />
      <Composition
        id="TestePriceMe"
        component={TestePriceMe}
        durationInFrames={90}
        fps={30}
        width={1080}
        height={1920}
      />
    </>
  );
};
