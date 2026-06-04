#!/usr/bin/env node
/**
 * narrator-clip-stager.cjs — First reference implementation for closing the narrator-to-showcase gap (Option A).
 *
 * Takes:
 *   - A narrator-generated high-level props file (preset, chapters, effects, etc.)
 *   - References to the original capture assets from the run (.cast files, etc.)
 *
 * Produces:
 *   - A minimal "clip-staged" props structure that is closer to what
 *     buildShowcasePropsFromRecipe / render-showcase.sh expect.
 *
 * This is deliberately a first-cut bridge. It does NOT yet perform the actual
 * .cast → video conversion (that would use agg + ffmpeg as in render-showcase.sh).
 * It focuses on producing the right shape + preserving the narrative intent.
 *
 * Usage examples:
 *   node narrator-clip-stager.cjs \
 *     --narrator-props real-improved-2026-05-28T07-00-46-props.json \
 *     --run-dir artifacts/runs/2026-05-28T07-00-46-... \
 *     --output staged-for-showcase.props.json
 *
 *   node narrator-clip-stager.cjs --help
 *
 * Output can then be fed (after actual clip video files exist in public/) to:
 *   scripts/render-showcase.sh --props staged-for-showcase.props.json <clip1.mp4> ...
 */

const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
let narratorPropsPath = null;
let runDir = null;
let outputPath = null;
let explicitAssets = [];

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--narrator-props' && args[i+1]) { narratorPropsPath = args[i+1]; i++; }
  if (args[i] === '--run-dir' && args[i+1]) { runDir = args[i+1]; i++; }
  if (args[i] === '--output' && args[i+1]) { outputPath = args[i+1]; i++; }
  if (args[i] === '--assets' && args[i+1]) {
    explicitAssets = explicitAssets.concat(args[i+1].split(','));
    i++;
  }
  if (args[i] === '--help' || args[i] === '-h') {
    printHelp();
    process.exit(0);
  }
}

function printHelp() {
  console.log(`
Usage: node narrator-clip-stager.cjs --narrator-props <file> [--run-dir <dir>] [--assets <cast1,cast2,...>] [--output <file>]

Options:
  --narrator-props PATH         Path to the high-level props produced by the narrator prototype / control-narrate
  --run-dir PATH                Optional: path to the original verified run directory (used to auto-discover .cast assets)
  --assets <cast1,cast2,...>    Optional: explicit comma-separated list of .cast files to convert (highest priority)
  --output PATH                 Output path for the clip-staged props (default: next to narrator-props)

This is a v0.1 bridge. It produces the structural shape expected by the production render pipeline
and (when .cast assets are available) performs real video conversion using agg + ffmpeg.
`);
}

if (!narratorPropsPath) {
  console.error('Error: --narrator-props is required');
  printHelp();
  process.exit(1);
}

const narratorProps = JSON.parse(fs.readFileSync(narratorPropsPath, 'utf8'));

// Discover or use explicit original capture assets
let originalAssets = [];
if (explicitAssets.length > 0) {
  originalAssets = explicitAssets.map(p => path.resolve(p));
} else if (runDir) {
  const absRun = path.resolve(runDir);
  const evidenceDir = path.join(absRun, 'evidence');
  if (fs.existsSync(evidenceDir)) {
    originalAssets = fs.readdirSync(evidenceDir)
      .filter(f => f.endsWith('.cast') || f.endsWith('.mp4') || f.endsWith('.txt'))
      .map(f => path.join(evidenceDir, f));
  }
  // Also check snapshots dir from older proof runs
  const snapshotsDir = path.join(absRun, 'snapshots');
  if (fs.existsSync(snapshotsDir)) {
    const snaps = fs.readdirSync(snapshotsDir)
      .filter(f => f.endsWith('.cast'))
      .map(f => path.join(snapshotsDir, f));
    originalAssets.push(...snaps);
  }
}

const PI_CLI_THEME = '181818,e0d0c0,15161e,f7768e,9ece6a,e0af68,7aa2f7,bb9af7,7dcfff,a9b1d6,414868,f7768e,9ece6a,e0af68,7aa2f7,bb9af7,7dcfff,c0caf5';

// Minimal cast dimensions helper (same logic as the project's helper)
function castDimensions(castPath) {
  const firstLine = fs.readFileSync(castPath, 'utf8').split('\n')[0];
  const header = JSON.parse(firstLine);
  return [header.width || 120, header.height || 36];
}

function convertCastClip(castClip, outputClip, fidelity = 'standard') {
  const { execSync } = require('child_process');

  const [cols, rows] = castDimensions(castClip);

  let aggFpsCap = 30;
  let aggIdleLimit = 5;
  let ffmpegCrf = 18;
  let ffmpegPreset = 'slow';

  if (fidelity === 'compact') {
    aggFpsCap = 24;
    aggIdleLimit = 3;
    ffmpegCrf = 21;
    ffmpegPreset = 'medium';
  } else if (fidelity === 'inspect') {
    aggFpsCap = 30;
    aggIdleLimit = 5;
    ffmpegCrf = 14;
    ffmpegPreset = 'slow';
  }

  const gifClip = outputClip.replace(/\.mp4$/, '.gif');

  // Step 1: agg .cast → .gif
  execSync(
    `agg --speed 1 --renderer fontdue --cols ${cols} --rows ${rows} --fps-cap ${aggFpsCap} --idle-time-limit ${aggIdleLimit} --theme "${PI_CLI_THEME}" "${castClip}" "${gifClip}"`,
    { stdio: 'inherit' }
  );

  // Step 2: ffmpeg .gif → .mp4
  execSync(
    `ffmpeg -y -i "${gifClip}" -movflags +faststart -pix_fmt yuv420p -preset ${ffmpegPreset} -crf ${ffmpegCrf} -vf "scale=trunc(iw/2)*2:trunc(ih/2)*2" "${outputClip}"`,
    { stdio: 'inherit' }
  );

  // Clean up intermediate gif
  try { fs.unlinkSync(gifClip); } catch (_) {}
}

// Build real video clips + clip-staged structure
const stagingDir = path.join(process.cwd(), 'artifacts', 'narrator-staged');
if (!fs.existsSync(stagingDir)) fs.mkdirSync(stagingDir, { recursive: true });

let finalClips = [];
let totalDuration = 0;

const castAssets = originalAssets.filter(a => a.endsWith('.cast'));

if (castAssets.length > 0) {
  console.error(`[narrator-clip-stager] Converting ${castAssets.length} .cast files to video...`);

  castAssets.slice(0, 4).forEach((castPath, idx) => {
    const base = path.basename(castPath, '.cast');
    const mp4Path = path.join(stagingDir, `${base}.mp4`);

    try {
      convertCastClip(castPath, mp4Path, 'standard');

      // Get real duration
      let duration = 12;
      try {
        const ffprobeOut = require('child_process').execSync(
          `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${mp4Path}"`,
          { encoding: 'utf8' }
        ).trim();
        duration = Math.max(1, Math.round(parseFloat(ffprobeOut)));
      } catch (_) {}

      finalClips.push({
        id: `clip-${idx + 1}`,
        source: mp4Path,
        duration,
        fidelity: 'standard'
      });
      totalDuration += duration;
    } catch (err) {
      console.error(`[narrator-clip-stager] Failed to convert ${castPath}: ${err.message}`);
    }
  });
}

// Fallback to synthetic if no casts could be converted
if (finalClips.length === 0) {
  finalClips = [
    { id: 'clip-1', source: 'example.cast', duration: 12, fidelity: 'standard' },
    { id: 'clip-2', source: 'example2.cast', duration: 18, fidelity: 'standard' }
  ];
  totalDuration = 30;
}

const clipStagedProps = {
  preset: narratorProps.preset || 'pi-warm',
  fidelity: 'standard',

  clips: finalClips,

  narrator: {
    version: '0.1-clip-stager',
    originalProps: narratorPropsPath,
    chapters: narratorProps.chapters || [],
    effects: narratorProps.effects || [],
    overlays: narratorProps.overlays || {}
  },

  clipDuration: totalDuration
};

const outFile = outputPath || path.join(path.dirname(narratorPropsPath), 'narrator-as-clip-staged.props.json');
fs.writeFileSync(outFile, JSON.stringify(clipStagedProps, null, 2));

console.log(JSON.stringify({
  ok: true,
  output: outFile,
  clips: finalClips.length,
  realVideoClips: finalClips.filter(c => c.source.endsWith('.mp4')).length,
  stagingDir,
  note: "Real video clips generated where possible. You can now try scripts/render-showcase.sh --props <this-file> <the-mp4s...>"
}, null, 2));