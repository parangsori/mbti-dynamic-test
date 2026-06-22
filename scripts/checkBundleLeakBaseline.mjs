import { existsSync } from 'node:fs';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createContentSnapshot } from '../server/content-vault/snapshot.js';
import { FOLLOWUP_QUESTIONS } from '../src/data/questionPools.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const distDir = path.join(projectRoot, 'dist');

const args = new Set(process.argv.slice(2));
const failOnSecret = args.has('--fail-on-secret');
const showExamples = args.has('--show-examples');

const TEXT_EXTENSIONS = new Set([
  '.css',
  '.html',
  '.js',
  '.json',
  '.mjs',
  '.svg',
  '.txt',
  '.webmanifest',
  '.xml'
]);

const IMAGE_EXTENSIONS = new Set([
  '.apng',
  '.avif',
  '.gif',
  '.jpg',
  '.jpeg',
  '.png',
  '.webp'
]);

const secretChecks = [
  {
    label: 'server secret env name',
    pattern: /\b(CONTENT_VAULT_KEY|SESSION_TOKEN_SECRET|POSTHOG_PERSONAL_API_KEY|CLOUDFLARE_ACCESS_AUD|CLOUDFLARE_ACCESS_JWKS_URL|ADMIN_DASHBOARD_TOKEN)\b/g
  },
  {
    label: 'service role marker',
    pattern: /\b(service_role|SUPABASE_SERVICE_ROLE|VITE_SUPABASE_SERVICE_ROLE_KEY)\b/g
  },
  {
    label: 'PostHog personal key shape',
    pattern: /\bphx_[A-Za-z0-9]{20,}\b/g
  },
  {
    label: 'browser-exposed server secret env name',
    pattern: /\b(VITE_CONTENT_VAULT_KEY|VITE_SESSION_TOKEN_SECRET|VITE_POSTHOG_PERSONAL_API_KEY|VITE_CLOUDFLARE_ACCESS_AUD|VITE_ADMIN_DASHBOARD_TOKEN)\b/g
  }
];

const internalFieldMarkers = [
  'QUESTIONS_DB',
  'QUESTIONS_EXTENDED',
  'QUESTIONS_META',
  'QUESTIONS_META_EXTENDED',
  'FOLLOWUP_QUESTIONS',
  'TYPE_CHARACTER_META',
  'MBTI_RESULTS',
  'BADGES',
  'familyId',
  'weight',
  'ageFit',
  'allowMiddleCandidate',
  '_axis',
  'contextTag',
  'followup',
  'discriminator',
  'consistency'
];

const escapeRegExp = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const walkFiles = async (dir) => {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...await walkFiles(fullPath));
    } else if (entry.isFile()) {
      files.push(fullPath);
    }
  }

  return files;
};

const readDist = async () => {
  if (!existsSync(distDir)) {
    throw new Error('dist directory not found. Run `npm run build` before `npm run check:bundle-leak`.');
  }

  const files = await walkFiles(distDir);
  const textFiles = [];
  const imageFiles = [];
  const sourcemaps = [];
  let combinedText = '';
  let totalBytes = 0;

  for (const filePath of files) {
    const relativePath = path.relative(projectRoot, filePath);
    const extension = path.extname(filePath).toLowerCase();
    const fileStat = await stat(filePath);
    totalBytes += fileStat.size;

    if (relativePath.endsWith('.map')) {
      sourcemaps.push(relativePath);
    }

    if (TEXT_EXTENSIONS.has(extension)) {
      const text = await readFile(filePath, 'utf8');
      textFiles.push({ filePath, relativePath, text });
      combinedText += `\n/* ${relativePath} */\n${text}`;
    }

    if (IMAGE_EXTENSIONS.has(extension)) {
      imageFiles.push(relativePath);
    }
  }

  return {
    combinedText,
    files,
    imageFiles,
    sourcemaps,
    textFiles,
    totalBytes
  };
};

const collectStrings = (value, collector, sourcePath = '') => {
  if (typeof value === 'string') {
    const normalized = value.trim();
    if (normalized.length >= 6 && /[가-힣A-Za-z0-9]/.test(normalized)) {
      collector.push({ marker: normalized, sourcePath });
    }
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((item, index) => collectStrings(item, collector, `${sourcePath}[${index}]`));
    return;
  }

  if (value && typeof value === 'object') {
    Object.entries(value).forEach(([key, item]) => {
      collectStrings(item, collector, sourcePath ? `${sourcePath}.${key}` : key);
    });
  }
};

const uniqueMarkers = (items) => {
  const seen = new Map();
  items.forEach((item) => {
    if (!seen.has(item.marker)) {
      seen.set(item.marker, item);
    }
  });
  return [...seen.values()];
};

const collectQuestionText = (questionGroups, sourcePath) => {
  const markers = [];
  collectStrings(questionGroups, markers, sourcePath);
  return uniqueMarkers(markers);
};

const collectContentMarkers = () => {
  const snapshot = createContentSnapshot();
  const resultMarkers = [];
  const typeCharacterMarkers = [];

  collectStrings({
    mbti: snapshot.results.mbti,
    badges: snapshot.results.badges,
    compatibility: snapshot.results.compatibility,
    tempoCopy: snapshot.results.tempoCopy
  }, resultMarkers, 'results');

  collectStrings(snapshot.assets.typeCharacters, typeCharacterMarkers, 'typeCharacters');

  return {
    baseQuestions: collectQuestionText(snapshot.questions.base, 'questions.base'),
    extendedQuestions: collectQuestionText(snapshot.questions.extended, 'questions.extended'),
    followupQuestions: collectQuestionText(FOLLOWUP_QUESTIONS, 'questions.followup'),
    resultCopy: uniqueMarkers(resultMarkers),
    typeCharacterMeta: uniqueMarkers(typeCharacterMarkers)
  };
};

const countLiteralMarker = (bundleText, marker) => {
  if (!marker) {
    return 0;
  }
  return (bundleText.match(new RegExp(escapeRegExp(marker), 'g')) || []).length;
};

const countMarkerCategory = (bundleText, markers) => {
  const found = [];
  let occurrences = 0;

  for (const item of markers) {
    const count = countLiteralMarker(bundleText, item.marker);
    if (count > 0) {
      found.push({ ...item, count });
      occurrences += count;
    }
  }

  return {
    found,
    foundCount: found.length,
    total: markers.length,
    occurrences
  };
};

const findPatternMatches = (textFiles, check) => {
  const matches = [];

  for (const file of textFiles) {
    const pattern = new RegExp(check.pattern.source, check.pattern.flags);
    const fileMatches = file.text.match(pattern) || [];
    if (fileMatches.length > 0) {
      matches.push({
        label: check.label,
        file: file.relativePath,
        count: fileMatches.length
      });
    }
  }

  return matches;
};

const countInternalFields = (bundleText) =>
  internalFieldMarkers
    .map((marker) => ({ marker, count: countLiteralMarker(bundleText, marker) }))
    .filter((item) => item.count > 0);

const formatRatio = (count, total) => `${count}/${total}`;

const formatBytes = (bytes) => {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KiB`;
  }
  return `${(bytes / 1024 / 1024).toFixed(1)} MiB`;
};

const printCategory = (label, result) => {
  const percent = result.total > 0 ? ((result.foundCount / result.total) * 100).toFixed(1) : '0.0';
  console.log(`- ${label}: ${formatRatio(result.foundCount, result.total)} markers found (${percent}%), ${result.occurrences} total occurrences`);

  if (showExamples && result.found.length > 0) {
    result.found.slice(0, 5).forEach((item) => {
      console.log(`  - ${item.sourcePath}: ${item.count} occurrence(s)`);
    });
  }
};

const main = async () => {
  const dist = await readDist();
  const markers = collectContentMarkers();

  const secretMatches = secretChecks.flatMap((check) => findPatternMatches(dist.textFiles, check));
  const internalFields = countInternalFields(dist.combinedText);

  const report = {
    baseQuestions: countMarkerCategory(dist.combinedText, markers.baseQuestions),
    extendedQuestions: countMarkerCategory(dist.combinedText, markers.extendedQuestions),
    followupQuestions: countMarkerCategory(dist.combinedText, markers.followupQuestions),
    resultCopy: countMarkerCategory(dist.combinedText, markers.resultCopy),
    typeCharacterMeta: countMarkerCategory(dist.combinedText, markers.typeCharacterMeta)
  };

  console.log('Bundle leak baseline report');
  console.log(`- dist files: ${dist.files.length} files, ${formatBytes(dist.totalBytes)}`);
  console.log(`- text files scanned: ${dist.textFiles.length}`);
  console.log(`- sourcemaps: ${dist.sourcemaps.length}`);
  console.log(`- image assets: ${dist.imageFiles.length}`);
  console.log('');
  console.log('Sensitive marker checks');
  console.log(`- forbidden secret markers: ${secretMatches.length}`);
  if (secretMatches.length > 0) {
    secretMatches.forEach((match) => {
      console.log(`  - ${match.label}: ${match.file} (${match.count})`);
    });
  }
  console.log(`- internal field markers: ${internalFields.length}`);
  if (internalFields.length > 0) {
    console.log(`  - ${internalFields.map((item) => `${item.marker}:${item.count}`).join(', ')}`);
  }
  console.log('');
  console.log('Product content marker baseline');
  printCategory('base question strings', report.baseQuestions);
  printCategory('extended question strings', report.extendedQuestions);
  printCategory('followup question strings', report.followupQuestions);
  printCategory('result/badge/compatibility strings', report.resultCopy);
  printCategory('type character metadata strings', report.typeCharacterMeta);

  const shouldFail = failOnSecret && (secretMatches.length > 0 || dist.sourcemaps.length > 0);
  if (shouldFail) {
    console.error('\nBundle leak check failed because --fail-on-secret was set.');
    process.exitCode = 1;
    return;
  }

  console.log('\nReport-only mode completed. Product content hits are expected until client bundle dependencies are removed.');
};

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
