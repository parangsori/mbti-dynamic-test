import assert from 'node:assert/strict';
import { access, readFile, readdir } from 'node:fs/promises';

class LocalStorageMock {
  constructor() {
    this.items = new Map();
  }

  getItem(key) {
    return this.items.has(key) ? this.items.get(key) : null;
  }

  setItem(key, value) {
    this.items.set(String(key), String(value));
  }

  removeItem(key) {
    this.items.delete(key);
  }

  clear() {
    this.items.clear();
  }
}

if (!globalThis.atob) {
  globalThis.atob = (value) => Buffer.from(value, 'base64').toString('binary');
}

if (!globalThis.btoa) {
  globalThis.btoa = (value) => Buffer.from(value, 'binary').toString('base64');
}

const { importHomeScreenMigrationText, STORAGE_KEYS } = await import('../src/lib/storage.js');
const { createInFlightRequestDeduper } = await import('../src/lib/inFlightRequest.js');

const localStorage = new LocalStorageMock();

globalThis.window = {
  localStorage,
  location: {
    href: 'https://todaymbti.com/',
    host: 'todaymbti.com',
    hostname: 'todaymbti.com',
    pathname: '/',
    search: '',
    hash: ''
  },
  history: {
    replaceState() {}
  }
};
globalThis.localStorage = localStorage;

const encodeMigrationPayload = (payload) =>
  Buffer.from(JSON.stringify(payload), 'utf8')
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const buildMigrationText = (values) =>
  `https://todaymbti.com/#migrate=${encodeMigrationPayload({
    version: 1,
    sourceHost: 'mbti-dynamic-test.vercel.app',
    exportedAt: '2026-05-26T00:00:00.000Z',
    values
  })}`;

const runInvalidKeyGuardCheck = () => {
  localStorage.clear();

  const imported = importHomeScreenMigrationText(buildMigrationText({
    [STORAGE_KEYS.username]: JSON.stringify('user'),
    '__proto__': JSON.stringify({ polluted: true }),
    constructor: JSON.stringify({ polluted: true }),
    mbti_unapproved_key: JSON.stringify('should-not-import')
  }));

  assert.equal(imported, true, 'expected valid whitelisted data to import');
  assert.equal(localStorage.getItem(STORAGE_KEYS.username), JSON.stringify('user'));
  assert.equal(localStorage.getItem('__proto__'), null, 'must reject prototype pollution key');
  assert.equal(localStorage.getItem('constructor'), null, 'must reject constructor key');
  assert.equal(localStorage.getItem('mbti_unapproved_key'), null, 'must reject arbitrary localStorage key');
  assert.equal(Object.prototype.polluted, undefined, 'must not pollute Object.prototype');
};

const runValueSizeGuardCheck = () => {
  localStorage.clear();

  const imported = importHomeScreenMigrationText(buildMigrationText({
    [STORAGE_KEYS.username]: 'a'.repeat(250_001)
  }));

  assert.equal(imported, false, 'oversized value should not be imported');
  assert.equal(localStorage.getItem(STORAGE_KEYS.username), null);
};

const runTotalSizeGuardCheck = () => {
  localStorage.clear();

  const imported = importHomeScreenMigrationText(buildMigrationText({
    [STORAGE_KEYS.history]: JSON.stringify([{ localEntryId: 'history-1', createdAt: '2026-05-26T00:00:00.000Z' }]),
    [STORAGE_KEYS.activeSession]: 'a'.repeat(250_000),
    [STORAGE_KEYS.pendingResult]: 'b'.repeat(250_000),
    [STORAGE_KEYS.eventStats]: 'c'.repeat(249_900),
    [STORAGE_KEYS.profile]: JSON.stringify({ nickname: 'should-not-fit'.repeat(40) })
  }));

  assert.equal(imported, true, 'values within the cumulative limit should import');
  assert.notEqual(localStorage.getItem(STORAGE_KEYS.history), null);
  assert.notEqual(localStorage.getItem(STORAGE_KEYS.activeSession), null);
  assert.notEqual(localStorage.getItem(STORAGE_KEYS.pendingResult), null);
  assert.equal(localStorage.getItem(STORAGE_KEYS.eventStats), 'c'.repeat(249_900));
  assert.equal(localStorage.getItem(STORAGE_KEYS.profile), null, 'must reject entries after cumulative limit');
};

runInvalidKeyGuardCheck();
runValueSizeGuardCheck();
runTotalSizeGuardCheck();

const runServerSecretNameGuardCheck = () => {
  const forbiddenClientSecretNames = [
    'VITE_CONTENT_VAULT_KEY',
    'VITE_SESSION_TOKEN_SECRET',
    'VITE_POSTHOG_PERSONAL_API_KEY',
    'VITE_SUPABASE_SERVICE_ROLE_KEY'
  ];

  forbiddenClientSecretNames.forEach((name) => {
    assert.equal(
      process.env[name],
      undefined,
      `${name} must not be configured as a browser-exposed VITE_ variable`
    );
  });
};

runServerSecretNameGuardCheck();

const runServerCompleteFallbackGuardCheck = async () => {
  const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const completePhaseStart = appSource.indexOf('const completeServerPhase = async');
  const completePhaseEnd = appSource.indexOf('const createServerQuestionSnapshot', completePhaseStart);

  assert.ok(completePhaseStart >= 0 && completePhaseEnd > completePhaseStart, 'server completion flow must exist');

  const completePhaseSource = appSource.slice(completePhaseStart, completePhaseEnd);
  assert.doesNotMatch(
    completePhaseSource,
    /session_api_fallback|continueWithClientFallback|finishSession\(/,
    'server completion failures must not generate a local result fallback'
  );
  assert.match(
    completePhaseSource,
    /restoreServerQuestionSnapshot\(recoverySnapshot/,
    'server completion failures must restore a retryable question state'
  );
};

await runServerCompleteFallbackGuardCheck();

const runServerStartRequiredGuardCheck = async () => {
  const appSource = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');
  const startFlowStart = appSource.indexOf('const handleStart = async');
  const startFlowEnd = appSource.indexOf('const latestHistoryComparison', startFlowStart);
  assert.ok(startFlowStart >= 0 && startFlowEnd > startFlowStart, 'server start flow must exist');

  const startFlowSource = appSource.slice(startFlowStart, startFlowEnd);
  assert.doesNotMatch(
    startFlowSource,
    /startLocalSession|buildQuestionSession|session_api_fallback/,
    'server start failures must not create a local session fallback'
  );
  assert.match(startFlowSource, /setStartError\(/, 'server start failures must expose a retryable start error');
};

const runClientProductBoundaryGuardCheck = async () => {
  const [appSource, sessionFlowSource, resultViewSource, startViewSource] = await Promise.all([
    readFile(new URL('../src/App.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/hooks/useSessionFlow.js', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/ResultView.jsx', import.meta.url), 'utf8'),
    readFile(new URL('../src/components/StartView.jsx', import.meta.url), 'utf8')
  ]);
  const clientFlowSource = `${appSource}\n${sessionFlowSource}\n${resultViewSource}`;

  assert.doesNotMatch(
    clientFlowSource,
    /buildQuestionSession|buildFollowupQuestions|getScoredQuestionById|buildResultViewModel|getPersonalizedResultContext|questionFlow\.js|resultAnalysis\.js|spiritMeta\.js/,
    'client question and result surfaces must not import or synthesize proprietary product rules'
  );
  assert.doesNotMatch(
    appSource,
    /option\.type|question\.weight|question\._axis|SERVER_OPTION_INDEX_PATTERN|hydrateServerQuestionForFallback/,
    'client answer flow must keep option IDs opaque and avoid local scoring metadata'
  );
  assert.match(startViewSource, /role="alert"/, 'start failure must use an alert region');
  assert.match(startViewSource, /aria-live="assertive"/, 'start failure must be announced');
  assert.match(startViewSource, /startErrorRef\.current\?\.focus\(\)/, 'start failure must receive keyboard focus');
  assert.match(startViewSource, />\s*다시 시도\s*</, 'start failure must expose a retry action');
};

await runClientProductBoundaryGuardCheck();

const readClientSources = async (directoryUrl) => {
  const entries = await readdir(directoryUrl, { withFileTypes: true });
  const sources = [];
  for (const entry of entries) {
    const entryUrl = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directoryUrl);
    if (entry.isDirectory()) {
      sources.push(...await readClientSources(entryUrl));
    } else if (/\.(js|jsx)$/.test(entry.name)) {
      sources.push({ path: entryUrl.pathname, source: await readFile(entryUrl, 'utf8') });
    }
  }
  return sources;
};

const runServerProductOwnershipGuardCheck = async () => {
  const clientSources = await readClientSources(new URL('../src/', import.meta.url));
  const forbiddenImport = clientSources.find(({ source }) => (
    /from\s+['"][^'"]*(?:server\/product|questionFlow|resultAnalysis|personalization|spiritMeta|questionPools)['"]/.test(source)
  ));
  assert.equal(forbiddenImport, undefined, `client source imports server product logic: ${forbiddenImport?.path || ''}`);

  const removedClientProductPaths = [
    '../src/lib/questionFlow.js',
    '../src/lib/resultAnalysis.js',
    '../src/lib/personalization.js',
    '../src/data/questionPools.js',
    '../src/data/spiritMeta.js'
  ];
  await Promise.all(removedClientProductPaths.map(async (path) => {
    await assert.rejects(access(new URL(path, import.meta.url)), `proprietary module must not remain under src: ${path}`);
  }));
};

await runServerProductOwnershipGuardCheck();

const runInFlightDeduperCheck = async () => {
  const dedupe = createInFlightRequestDeduper();
  let calls = 0;
  let release;
  const request = () => {
    calls += 1;
    return new Promise((resolve) => {
      release = resolve;
    });
  };

  const first = dedupe('same-start', request);
  const second = dedupe('same-start', request);
  assert.equal(calls, 1, 'identical in-flight starts must share one request');
  release({ ok: true });
  assert.deepEqual(await Promise.all([first, second]), [{ ok: true }, { ok: true }]);

  const third = dedupe('same-start', async () => {
    calls += 1;
    return { ok: 'again' };
  });
  assert.deepEqual(await third, { ok: 'again' });
  assert.equal(calls, 2, 'settled starts must clear the in-flight entry');
};

await runServerStartRequiredGuardCheck();
await runInFlightDeduperCheck();

console.log('Security guard checks passed.');
