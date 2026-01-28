#!/usr/bin/env node
/**
 * Copy the latest Playwright video from test-results to e2e/videos/complete-workflow-demo.webm.
 * Run after: npm run test:e2e:record (runs full-workflow test with record config)
 */
const fs = require('fs');
const path = require('path');

const resultsDir = path.join(__dirname, '..', 'test-results');
const outDir = path.join(__dirname, '..', 'e2e', 'videos');
const outPath = path.join(outDir, 'complete-workflow-demo.webm');

  if (!fs.existsSync(resultsDir)) {
  console.warn('No test-results directory found. Run npm run test:e2e:record first.');
  process.exit(1);
}

const dirs = fs.readdirSync(resultsDir);
let latestVideo = null;
let latestMtime = 0;

for (const d of dirs) {
  const sub = path.join(resultsDir, d);
  if (!fs.statSync(sub).isDirectory()) continue;
  const v = path.join(sub, 'video.webm');
  if (fs.existsSync(v)) {
    const m = fs.statSync(v).mtimeMs;
    if (m > latestMtime) {
      latestMtime = m;
      latestVideo = v;
    }
  }
}

if (!latestVideo) {
  console.warn('No video.webm found in test-results.');
  process.exit(1);
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
fs.copyFileSync(latestVideo, outPath);
console.log('Video copied to:', outPath);
