import {Video} from "@remotion/media";
import {
  AbsoluteFill,
  interpolate,
  staticFile,
  useCurrentFrame,
} from "remotion";

export const liveFps = 30;
export const liveWidth = 1920;
export const liveHeight = 1080;

// 136.73s live take at 30 fps (ffprobe). Chapter times come from the cast
// event log mapped through agg's 10s idle compression.
export const liveDurationFrames = 4102;

const chapters = [
  {from: 0, index: "00", title: "Pi on MiMo"},
  {from: 15 * liveFps, index: "01", title: "Wishcraft cockpit"},
  {from: 24 * liveFps, index: "02", title: "Live run: fffind"},
  {from: 57 * liveFps, index: "03", title: "Subagent spawn"},
  {from: 70 * liveFps, index: "04", title: "Agent Top — live"},
  {from: 96 * liveFps, index: "05", title: "Orchestrator hub"},
  {from: 112 * liveFps, index: "06", title: "Mission scaffold"},
  {from: 125 * liveFps, index: "07", title: "Mission Control"},
] as const;

const ChapterLabel: React.FC = () => {
  const frame = useCurrentFrame();
  const chapter =
    [...chapters].reverse().find(({from}) => frame >= from) ?? chapters[0];
  const local = frame - chapter.from;
  const opacity = interpolate(
    local,
    [0, 10, 70, 88],
    [0, 1, 1, 0],
    {extrapolateLeft: "clamp", extrapolateRight: "clamp"},
  );

  return (
    <div
      style={{
        position: "absolute",
        top: 34,
        right: 42,
        display: "flex",
        alignItems: "center",
        gap: 14,
        padding: "10px 15px",
        border: "1px solid rgba(255,255,255,0.16)",
        borderRadius: 8,
        backgroundColor: "rgba(15,16,22,0.82)",
        color: "#F4F4F5",
        fontFamily: '"IBM Plex Mono", ui-monospace, monospace',
        fontSize: 18,
        letterSpacing: "-0.02em",
        opacity,
      }}
    >
      <span style={{color: "#FF6900"}}>{chapter.index}</span>
      <span>{chapter.title}</span>
      <span style={{color: "rgba(255,255,255,0.42)"}}>MiMo-V2.5-Pro</span>
    </div>
  );
};

export const LiveTerminal: React.FC = () => {
  return (
    <AbsoluteFill style={{backgroundColor: "#111111"}}>
      <Video
        src={staticFile("live-terminal.mp4")}
        muted
        objectFit="contain"
        style={{width: "100%", height: "100%"}}
      />
      <ChapterLabel />
    </AbsoluteFill>
  );
};
