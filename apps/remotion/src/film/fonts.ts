import {loadFont as loadInstrumentSerif} from "@remotion/google-fonts/InstrumentSerif";
import {loadFont} from "@remotion/fonts";
import {staticFile} from "remotion";

loadInstrumentSerif("normal", {
  weights: ["400"],
  subsets: ["latin"],
});

void Promise.all([
  loadFont({
    family: "General Sans",
    url: staticFile("fonts/GeneralSans-Regular.otf"),
    weight: "400",
  }),
  loadFont({
    family: "General Sans",
    url: staticFile("fonts/GeneralSans-Medium.otf"),
    weight: "500",
  }),
  loadFont({
    family: "General Sans",
    url: staticFile("fonts/GeneralSans-Semibold.ttf"),
    weight: "600",
  }),
  loadFont({
    family: "IBM Plex Mono",
    url: staticFile("fonts/IBMPlexMono-Regular.ttf"),
    weight: "400",
  }),
  loadFont({
    family: "IBM Plex Mono",
    url: staticFile("fonts/IBMPlexMono-Medium.ttf"),
    weight: "500",
  }),
]);
