import { Composition } from "remotion";
import { TestePriceMe } from "./TestePriceMe";

export const RemotionRoot: React.FC = () => {
  return (
    <Composition
      id="TestePriceMe"
      component={TestePriceMe}
      durationInFrames={90}
      fps={30}
      width={1080}
      height={1920}
    />
  );
};
