import { Composition } from "remotion";
import { DURACAO_REEL, ReelPriceMe } from "./edicao/ReelPriceMe";
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
