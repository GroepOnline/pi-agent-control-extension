# Unique Feature Candidate 03: Autonomous Cinematic Narrator

**Status**: Draft — "dddddddddoor" continuation execution  
**Seed**: Original Ralph plan Feature C (Autonomous Cinematic Narrator)  
**Data sources**: `skills/showcase/SKILL.md` + `skills/compose/SKILL.md` + remotion/src structure

---

## 1. The Opportunity

The project already has an exceptionally mature cinematic output pipeline:

- 6+ high-quality presets (`pi-warm`, `pi-hero`, `hero`, `macos`, `presentation`, `minimal`)
- Automatic palette selection and visual treatment (warm glow + particles for Pi branding, cool Catppuccin for others)
- Rich effect system: spotlight, zoom, callout, keystroke overlay, code annotations, motion-blur / whip-pan / light-leak / glitch transitions
- Strict integration with the `verify` skill (duration targets, ffprobe checks, commitment mapping)
- Full props schema for `compose` + `render-showcase.sh` that handles .cast conversion, staging, rendering, and cleanup

Currently this is all **manual orchestration** by the agent (or human). The agent has to manually:
- Choose preset
- Decide effects tier
- Build the complex props JSON
- Handle speed notes, sections, keystroke timing adjustments
- Call the render script correctly

This is powerful but laborious.

---

## 2. The Feature: Autonomous Cinematic Narrator

After a successful `verify` pass (or in parallel with it), an agent can invoke a "narrate" flow that:

1. Reads the `verification.md` + `run.json` + capture metadata
2. Automatically determines:
   - Best preset (Pi-branded for official content, clean for internal)
   - Effects tier based on run character (full cinematic for marketing/PR, utilitarian for QA)
   - Key moments to highlight (from verification claims + timestamps)
   - Chapter sections
   - Keystroke or code annotation overlays
3. Generates the full `showcase-props.json`
4. Calls the render pipeline
5. Produces both a high-polish "hero" version and a more compact version if needed

Bonus: It can even generate a short "director's note" or voiceover script that explains what was proved, using the verification commitments.

---

## 3. Why This Is Uniquely Powerful

Very few agent systems produce **cinematic, stakeholder-ready video artifacts** as a first-class output.

Even fewer do it with:
- Brand-consistent Pi visual language (pi-warm / pi-hero)
- Automatic, verification-driven editing decisions
- Deep integration with terminal capture fidelity (tuistory/true-input color/escape handling)

This turns every verified run into potential marketing or executive material with almost zero extra human effort.

It compounds heavily with the other candidates (especially Evidence Attestations — you can embed the attestation hash visibly in the title card).

---

## 4. Delta vs Current Contract

**Very favorable**:

- Builds 100% on existing `compose` + `showcase` + Remotion infrastructure
- No changes needed to guards, validator, or core evidence schema
- Can live as an extension of the existing `showcase` and `compose` skills
- The hard parts (Remotion components, render script, preset system, verification tie-in) already exist

Main new work:
- A "narrator" atom/skill that reads verification output and emits good props
- Possibly some heuristics for preset + effects selection
- Optional: LLM-assisted editorial decisions for sections/highlights (can be thin at first)

---

## 5. Agent Leverage

After any control task that produces evidence:

```
/capture ... --format cast
/verify ...
/narrate --style hero --output artifacts/showcases/my-feature.mp4
```

The agent gets back a polished, on-brand video ready for PRs, demos, or the website — with the right preset, effects, and proof points automatically highlighted.

Huge productivity and quality multiplier.

---

## 6. Security / Evidence Angle

- The narrator runs **after** verification succeeds
- Can embed attestation hashes or run IDs visibly in the video (title card or watermark)
- Strengthens the "provable work" story even further

---

## 7. Risks (low)

- Render time and resource usage (already known and managed via timeouts)
- Over-polish for internal work (mitigated by having clear "demo" vs "showcase" modes and letting the narrator choose based on context)
- Dependency on Remotion/Chrome/ffmpeg (already a hard dependency of the project)

---

*Continuing the 4 unique features discovery in non-stopping loop mode.*