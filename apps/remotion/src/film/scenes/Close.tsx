import {Easing, Interactive, interpolate, useCurrentFrame} from "remotion";
import {Canvas, SceneIn} from "../shell";
import {theme, type} from "../theme";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

const installs = [
  "pi install npm:@groeponline/pi-wishcraft",
  "pi install npm:@groeponline/pi-agent-orchestrator",
  "pi install npm:@groeponline/pi-tools",
  "pi install npm:@groeponline/pi-missions",
] as const;

export const Close: React.FC = () => {
  const frame = useCurrentFrame();

  return (
    <Canvas>
      <SceneIn>
        <Interactive.Div
          name="Close stage"
          style={{
            position: "absolute",
            left: 120,
            right: 120,
            top: 96,
            bottom: 88,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Interactive.Div
            name="Close title"
            style={{
              fontFamily: type.display,
              fontSize: 88,
              letterSpacing: "-0.03em",
              lineHeight: 0.96,
              opacity: interpolate(frame, [4, 20], [0, 1], {
                ...clamp,
                easing: Easing.bezier(0.16, 1, 0.3, 1),
              }),
            }}
          >
            Stock Pi stays
            <br />
            the engine.
          </Interactive.Div>
          <Interactive.Div
            name="Installs"
            style={{marginTop: 48}}
          >
            {installs.map((cmd, i) => {
              const from = 22 + i * 10;
              return (
                <Interactive.Div
                  key={cmd}
                  name={cmd}
                  style={{
                    padding: "14px 0",
                    borderBottom: `1px solid ${theme.line}`,
                    color: theme.accentInk,
                    fontFamily: type.mono,
                    fontSize: 22,
                    fontWeight: 500,
                    opacity: interpolate(frame, [from, from + 12], [0, 1], {
                      ...clamp,
                      easing: Easing.bezier(0.16, 1, 0.3, 1),
                    }),
                  }}
                >
                  {cmd}
                </Interactive.Div>
              );
            })}
          </Interactive.Div>
          <Interactive.Div
            name="Close footer"
            style={{
              marginTop: "auto",
              color: theme.faint,
              fontFamily: type.mono,
              fontSize: 16,
            }}
          >
            groeponline · pi.dev/packages
          </Interactive.Div>
        </Interactive.Div>
      </SceneIn>
    </Canvas>
  );
};
