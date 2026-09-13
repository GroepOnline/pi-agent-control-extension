import {
  AbsoluteFill,
  Easing,
  Interactive,
  interpolate,
  useCurrentFrame,
} from "remotion";
import {theme, type} from "./theme";

const clamp = {
  extrapolateLeft: "clamp" as const,
  extrapolateRight: "clamp" as const,
};

export const Canvas: React.FC<{children: React.ReactNode}> = ({children}) => {
  return (
    <AbsoluteFill
      name="Canvas"
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        fontFamily: type.sans,
      }}
    >
      <Measure />
      {children}
    </AbsoluteFill>
  );
};

const Measure: React.FC = () => {
  const frame = useCurrentFrame();
  const dots = 28;

  return (
    <Interactive.Div
      name="Measure"
      style={{
        position: "absolute",
        left: 72,
        top: 96,
        bottom: 96,
        width: 12,
      }}
    >
      <Interactive.Div
        name="Rule"
        style={{
          position: "absolute",
          left: 5,
          top: 0,
          bottom: 0,
          width: 1,
          backgroundColor: theme.lineStrong,
        }}
      />
      {Array.from({length: dots}, (_, i) => {
        const lit = interpolate(frame, [i * 2, i * 2 + 8], [0, 1], clamp);
        return (
          <Interactive.Div
            key={i}
            name={`Tick ${i + 1}`}
            style={{
              position: "absolute",
              left: i % 5 === 0 ? 0 : 3,
              top: `${(i / (dots - 1)) * 100}%`,
              width: i % 5 === 0 ? 12 : 6,
              height: 1,
              backgroundColor: theme.accent,
              opacity: interpolate(lit, [0, 1], [0.18, 0.7], clamp),
            }}
          />
        );
      })}
    </Interactive.Div>
  );
};

export const SceneIn: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();

  return (
    <Interactive.Div
      name="Scene in"
      style={{
        position: "absolute",
        inset: 0,
        opacity: interpolate(frame, [0, 16], [0, 1], {
          ...clamp,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        translate: interpolate(frame, [0, 18], ["0px 22px", "0px 0px"], {
          ...clamp,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
      }}
    >
      {children}
    </Interactive.Div>
  );
};

export const Stage: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Interactive.Div
    name="Stage"
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
    {children}
  </Interactive.Div>
);

export const Eyebrow: React.FC<{index: string; label: string}> = ({
  index,
  label,
}) => (
  <Interactive.Div
    name="Eyebrow"
    style={{
      display: "flex",
      alignItems: "baseline",
      gap: 16,
      color: theme.accentInk,
      fontFamily: type.mono,
      fontSize: 18,
      fontWeight: 500,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
    }}
  >
    <Interactive.Span name="Index" style={{color: theme.accent}}>
      {index}
    </Interactive.Span>
    <Interactive.Span name="Label">{label}</Interactive.Span>
  </Interactive.Div>
);

export const Title: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Interactive.Div
    name="Title"
    style={{
      marginTop: 22,
      maxWidth: 1400,
      fontFamily: type.display,
      fontSize: 92,
      fontWeight: 400,
      letterSpacing: "-0.03em",
      lineHeight: 0.96,
    }}
  >
    {children}
  </Interactive.Div>
);

export const Line: React.FC<{children: React.ReactNode}> = ({children}) => (
  <Interactive.Div
    name="Line"
    style={{
      marginTop: 22,
      maxWidth: 1100,
      color: theme.muted,
      fontSize: 28,
      fontWeight: 400,
      letterSpacing: "-0.01em",
      lineHeight: 1.4,
    }}
  >
    {children}
  </Interactive.Div>
);

export const CommandRow: React.FC<{
  from: number;
  command: string;
  hint: string;
}> = ({from, command, hint}) => {
  const frame = useCurrentFrame();

  return (
    <Interactive.Div
      name={command}
      style={{
        display: "flex",
        alignItems: "baseline",
        gap: 28,
        padding: "16px 0",
        borderBottom: `1px solid ${theme.line}`,
        opacity: interpolate(frame, [from, from + 12], [0, 1], {
          ...clamp,
          easing: Easing.bezier(0.16, 1, 0.3, 1),
        }),
        translate: interpolate(
          frame,
          [from, from + 14],
          ["0px 10px", "0px 0px"],
          {
            ...clamp,
            easing: Easing.bezier(0.16, 1, 0.3, 1),
          },
        ),
      }}
    >
      <Interactive.Span
        name="Command"
        style={{
          minWidth: 280,
          color: theme.accentInk,
          fontFamily: type.mono,
          fontSize: 22,
          fontWeight: 500,
        }}
      >
        {command}
      </Interactive.Span>
      <Interactive.Span
        name="Hint"
        style={{
          color: theme.muted,
          fontFamily: type.sans,
          fontSize: 22,
          fontWeight: 400,
        }}
      >
        {hint}
      </Interactive.Span>
    </Interactive.Div>
  );
};

export const Footer: React.FC<{packageId: string}> = ({packageId}) => (
  <Interactive.Div
    name="Footer"
    style={{
      marginTop: "auto",
      color: theme.faint,
      fontFamily: type.mono,
      fontSize: 16,
      letterSpacing: "0.02em",
    }}
  >
    {packageId}
  </Interactive.Div>
);
