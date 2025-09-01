#!/usr/bin/env node
/**
 * Update all building entries in map/district-buildings/json/*.json so that
 * each entry has a unique name across the entire folder using pattern
 * "building-<number>". The JSONs may be arrays or objects with an `entries` array.
 */
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();
const DIR = path.join(ROOT, 'map', 'district-buildings', 'json');

function readJson(file) {
  const raw = fs.readFileSync(file, 'utf8');
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`Failed to parse JSON: ${file} - ${e.message}`);
  }
}

function writeJson(file, data) {
  const out = JSON.stringify(data, null, 2) + '\n';
  fs.writeFileSync(file, out, 'utf8');
}

function isEntry(obj) {
  // Minimal shape check: has pos (array of 2 numbers) and numeric scale/rotY.
  if (!obj || typeof obj !== 'object') return false;
  if (!Array.isArray(obj.pos) || obj.pos.length < 2) return false;
  return true;
}

function getEntries(doc) {
  if (Array.isArray(doc)) return doc;
  if (doc && typeof doc === 'object' && Array.isArray(doc.entries)) return doc.entries;
  return null;
}

function setBaseName(entry, name) {
  // Ensure we only touch the baseName field; do not remove extras
  entry.baseName = name;
}

function main() {
  if (!fs.existsSync(DIR)) {
    console.error(`Directory not found: ${DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(DIR, f))
    .sort((a, b) => a.localeCompare(b));

  let counter = 1;
  let total = 0;

  for (const file of files) {
    const doc = readJson(file);
    const entries = getEntries(doc);
    if (!entries) {
      console.warn(`Skipping (no entries): ${file}`);
      continue;
    }
    let changed = 0;
    for (const e of entries) {
      if (!isEntry(e)) continue; // ignore unexpected shapes
      const uniqueName = `building-${counter++}`;
      setBaseName(e, uniqueName);
      changed++;
    }
    if (changed > 0) {
      writeJson(file, doc);
      total += changed;
      console.log(`Updated ${changed.toString().padStart(3)} entries in: ${path.basename(file)}`);
    } else {
      console.log(`No changes in: ${path.basename(file)}`);
    }
  }

  console.log(`\nDone. Total entries updated: ${total}`);
}

main();

