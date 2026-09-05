import { execFileSync } from "node:child_process";

const raw = execFileSync("npm", ["pack", "--dry-run", "--json", "--ignore-scripts"], {
  encoding: "utf8",
});
const parsed = JSON.parse(raw);
const pack = Array.isArray(parsed) ? parsed[0] : parsed[Object.keys(parsed)[0]];
const paths = new Set(pack.files.map((file) => file.path));
const required = [
  "package.json",
  "README.md",
  "LICENSE",
  "packages/extension/index.ts",
  "scripts/validate-package.py",
  "scripts/verify-package.mjs",
];
const requiredPrefixes = ["packages/skills/", "apps/remotion/src/"];
const missing = required.filter((path) => !paths.has(path));
const forbiddenPrefixes = [
  "apps/remotion/node_modules/",
  "apps/remotion/artifacts/",
];
const forbiddenFragments = ["/node_modules/", "apps/remotion/artifacts/runs/"];
const forbidden = [...paths].filter((path) =>
  forbiddenPrefixes.some((prefix) => path.startsWith(prefix)) ||
  forbiddenFragments.some((fragment) => path.includes(fragment)),
);
if (forbidden.length) {
  console.error(`Invalid npm tarball; forbidden generated/dependency paths included: ${forbidden.slice(0, 10).join(", ")}`);
  process.exit(1);
}
const maxUnpackedSize = 10 * 1024 * 1024;
if (pack.unpackedSize > maxUnpackedSize) {
  console.error(`Invalid npm tarball; unpacked size ${pack.unpackedSize} exceeds ${maxUnpackedSize} bytes`);
  process.exit(1);
}
for (const prefix of requiredPrefixes) {
  if (![...paths].some((path) => path.startsWith(prefix))) missing.push(`${prefix}*`);
}
if (pack.size > 5 * 1024 * 1024) {
  console.error(`Invalid npm tarball; package is unexpectedly large: ${pack.size} bytes`);
  process.exit(1);
}
if (missing.length) {
  console.error(`Invalid npm tarball; missing: ${missing.join(", ")}`);
  process.exit(1);
}
const pkg = JSON.parse(execFileSync(process.execPath, ["-e", "process.stdout.write(JSON.stringify(require('./package.json')))"]));
for (const entrypoint of [...(pkg.pi?.extensions ?? []), ...(pkg.pi?.skills ?? [])]) {
  const rel = entrypoint.replace(/^\.\//, "").replace(/\/$/, "");
  if (!paths.has(rel) && ![...paths].some((path) => path.startsWith(`${rel}/`))) {
    console.error(`Pi manifest target is absent from npm tarball: ${entrypoint}`);
    process.exit(1);
  }
}
console.log(`package contract ok: ${pack.name}@${pack.version}, ${pack.files.length} files, ${pack.size} bytes`);
