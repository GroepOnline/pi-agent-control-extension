import { Config } from "@remotion/cli/config";

Config.setConcurrency(4);
Config.setOutputLocation("../../artifacts/showcases/");
Config.setChromiumOpenGlRenderer("angle");

export default Config;
