import {TransitionSeries} from "@remotion/transitions";
import {fade} from "@remotion/transitions/fade";
import "./fonts";
import {Close} from "./scenes/Close";
import {Control} from "./scenes/Control";
import {Missions} from "./scenes/Missions";
import {Open} from "./scenes/Open";
import {Orchestrator} from "./scenes/Orchestrator";
import {Stack} from "./scenes/Stack";
import {Tools} from "./scenes/Tools";
import {Wishcraft} from "./scenes/Wishcraft";
import {fadeTiming, sceneFrames} from "./timing";

export const PiExtensionsFilm: React.FC = () => {
  return (
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={sceneFrames.open} name="Open">
        <Open />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence durationInFrames={sceneFrames.stack} name="Stack">
        <Stack />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence
        durationInFrames={sceneFrames.wishcraft}
        name="Wishcraft"
      >
        <Wishcraft />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence
        durationInFrames={sceneFrames.orchestrator}
        name="Orchestrator"
      >
        <Orchestrator />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence durationInFrames={sceneFrames.tools} name="Tools">
        <Tools />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence
        durationInFrames={sceneFrames.missions}
        name="Missions"
      >
        <Missions />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence
        durationInFrames={sceneFrames.control}
        name="Control"
      >
        <Control />
      </TransitionSeries.Sequence>
      <TransitionSeries.Transition presentation={fade()} timing={fadeTiming} />
      <TransitionSeries.Sequence durationInFrames={sceneFrames.close} name="Close">
        <Close />
      </TransitionSeries.Sequence>
    </TransitionSeries>
  );
};
