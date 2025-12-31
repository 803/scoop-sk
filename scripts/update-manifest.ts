#!/usr/bin/env bun

const version = process.argv[2]?.replace(/^sk@/, "");
if (!version) {
  console.error("Usage: bun update-manifest.ts <tag>  (e.g., sk@0.1.0)");
  process.exit(1);
}

const REPO = "803/skillssupply";
const MANIFEST_PATH = "bucket/sk.json";

// Fetch SHASUMS256.txt and parse Windows hash
const shasumsUrl = `https://github.com/${REPO}/releases/download/sk@${version}/SHASUMS256.txt`;
const response = await fetch(shasumsUrl);
if (!response.ok) {
  console.error(`Failed to fetch ${shasumsUrl}: ${response.status}`);
  process.exit(1);
}
const shasums = await response.text();
console.log("SHASUMS256.txt:\n" + shasums);

// Find Windows x64 hash
let windowsHash = "";
for (const line of shasums.trim().split("\n")) {
  const [hash, filename] = line.split(/\s+/);
  if (filename.includes("sk-windows-x64")) {
    windowsHash = hash;
    break;
  }
}

if (!windowsHash) {
  console.error("Windows hash not found in SHASUMS256.txt");
  process.exit(1);
}

console.log(`\nWindows x64 hash: ${windowsHash}`);

// Update manifest
const manifest = JSON.parse(await Bun.file(MANIFEST_PATH).text());
manifest.version = version;
manifest.architecture["64bit"].url =
  `https://github.com/${REPO}/releases/download/sk@${version}/sk-windows-x64.zip`;
manifest.architecture["64bit"].hash = windowsHash;

await Bun.write(MANIFEST_PATH, JSON.stringify(manifest, null, 4));
console.log(`\nUpdated ${MANIFEST_PATH} to sk@${version}`);
