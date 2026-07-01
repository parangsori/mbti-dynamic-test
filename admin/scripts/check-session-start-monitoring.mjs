import assert from 'node:assert/strict';
import handler, {
  buildSessionStartMonitoringQuery,
  rowsToSessionStartMonitoring
} from '../api/admin/metrics.js';

const sensitiveMarker = 'daily-network-pseudonym-fixture';

const summaryRows = ({
  observed = 0,
  identified = 0,
  client = 0,
  warnings = 0,
  severe = 0,
  oneMinuteMax = 0,
  tenMinuteMax = 0
} = {}) => [
  ['summary', 'observed_starts', observed],
  ['summary', 'identity_available_starts', identified],
  ['summary', 'identity_coverage_percent', observed > 0 ? Math.round((identified / observed) * 100) : 0],
  ['summary', 'client_starts', client],
  ['summary', 'unmatched_client_starts', Math.max(0, observed - client)],
  ['summary', 'warning_windows', warnings],
  ['summary', 'severe_windows', severe],
  ['summary', 'max_one_minute_burst', oneMinuteMax],
  ['summary', 'max_ten_minute_burst', tenMinuteMax]
];

// Given: a monitoring query for the supported range.
// When: its aggregate rows are inspected.
// Then: it emits every required summary and breakdown without selecting identifiers as output rows.
const query = buildSessionStartMonitoringQuery(7);
for (const category of [
  'observed_starts',
  'identity_available_starts',
  'identity_coverage_percent',
  'client_starts',
  'unmatched_client_starts',
  'warning_windows',
  'severe_windows',
  'max_one_minute_burst',
  'max_ten_minute_burst'
]) {
  assert.match(query, new RegExp(`'${category}'`));
}
assert.match(query, /SELECT 'user_agent', userAgentFamily, count\(\)/);
assert.match(query, /SELECT 'access_tier', accessTier, count\(\)/);
assert.match(query, /WHERE identityAvailable/);
assert.match(query, /greatest\(toInt64\(observedTotal\) - toInt64\(client_starts\.total\), 0\)/);
assert.equal(query.includes(`'${sensitiveMarker}'`), false);

// Given: no aggregate rows.
// When: the response transformer runs.
// Then: it returns exact empty numeric defaults.
assert.deepEqual(rowsToSessionStartMonitoring([]), {
  status: 'empty',
  policy: {
    version: 1,
    enforcement: 'observation_only',
    warningThresholdPerMinute: 10,
    severeThresholdPerTenMinutes: 30
  },
  summary: {
    observedStarts: 0,
    identityAvailableStarts: 0,
    identityCoveragePercent: 0,
    clientStarts: 0,
    unmatchedClientStarts: 0,
    warningWindows: 0,
    severeWindows: 0,
    maxOneMinuteBurst: 0,
    maxTenMinuteBurst: 0
  },
  userAgents: [],
  accessTiers: []
});

// Given: normal aggregate rows with supported categorical breakdowns.
// When: the response transformer runs.
// Then: it returns bounded summary values and no raw aggregate rows.
const normal = rowsToSessionStartMonitoring([
  ...summaryRows({ observed: 12, identified: 9, client: 10, oneMinuteMax: 3, tenMinuteMax: 7 }),
  ['user_agent', 'chrome', 8],
  ['user_agent', 'safari', '4'],
  ['access_tier', 'anonymous', 10],
  ['access_tier', 'premium', 2],
  ['user_agent', sensitiveMarker, 999],
  ['raw_identifier', sensitiveMarker, 1]
]);
assert.equal(normal.status, 'observing');
assert.deepEqual(normal.summary, {
  observedStarts: 12,
  identityAvailableStarts: 9,
  identityCoveragePercent: 75,
  clientStarts: 10,
  unmatchedClientStarts: 2,
  warningWindows: 0,
  severeWindows: 0,
  maxOneMinuteBurst: 3,
  maxTenMinuteBurst: 7
});
assert.deepEqual(normal.userAgents, [
  { key: 'chrome', count: 8 },
  { key: 'safari', count: 4 }
]);
assert.deepEqual(normal.accessTiers, [
  { key: 'anonymous', count: 10 },
  { key: 'premium', count: 2 }
]);
assert.equal(JSON.stringify(normal).includes(sensitiveMarker), false);

// Given: warning and severe burst windows.
// When: the response transformer runs.
// Then: severe status wins while all burst aggregates remain available.
const burst = rowsToSessionStartMonitoring(summaryRows({
  observed: 40,
  identified: 40,
  client: 35,
  warnings: 2,
  severe: 1,
  oneMinuteMax: 12,
  tenMinuteMax: 35
}));
assert.equal(burst.status, 'severe');
assert.equal(burst.summary.warningWindows, 2);
assert.equal(burst.summary.severeWindows, 1);
assert.equal(burst.summary.maxOneMinuteBurst, 12);
assert.equal(burst.summary.maxTenMinuteBurst, 35);

// Given: observed rows without an available identity.
// When: coverage is calculated.
// Then: actor coverage remains zero without inventing burst activity.
const unidentified = rowsToSessionStartMonitoring(summaryRows({ observed: 5, client: 5 }));
assert.equal(unidentified.summary.identityAvailableStarts, 0);
assert.equal(unidentified.summary.identityCoveragePercent, 0);
assert.equal(unidentified.summary.maxOneMinuteBurst, 0);

// Given: fewer server observations than client success events.
// When: unmatched observations are calculated.
// Then: the estimate is clamped at zero.
const observedLessThanClient = rowsToSessionStartMonitoring(summaryRows({ observed: 2, identified: 2, client: 5 }));
assert.equal(observedLessThanClient.summary.unmatchedClientStarts, 0);

// Given: malformed aggregate totals including coercible non-numeric values.
// When: the response transformer runs.
// Then: booleans, nulls, arrays, and objects all become zero.
const malformed = rowsToSessionStartMonitoring([
  ['summary', 'observed_starts', true],
  ['summary', 'identity_available_starts', null],
  ['summary', 'client_starts', { valueOf: () => 7 }],
  ['summary', 'warning_windows', []],
  ['summary', 'severe_windows', false],
  ['summary', 'max_one_minute_burst', 'not-a-number'],
  ['summary', 'max_ten_minute_burst', -5],
  ['user_agent', 'chrome', {}],
  ['access_tier', 'anonymous', null]
]);
assert.deepEqual(malformed.summary, rowsToSessionStartMonitoring([]).summary);
assert.deepEqual(malformed.userAgents, []);
assert.deepEqual(malformed.accessTiers, []);

const invokeHandler = async ({ monitoringRows = [], failMonitoringQuery = false, clientIp }) => {
  const previousFetch = globalThis.fetch;
  const previousEnvironment = {
    ADMIN_DASHBOARD_TOKEN: process.env.ADMIN_DASHBOARD_TOKEN,
    POSTHOG_PERSONAL_API_KEY: process.env.POSTHOG_PERSONAL_API_KEY,
    POSTHOG_PROJECT_ID: process.env.POSTHOG_PROJECT_ID,
    POSTHOG_API_HOST: process.env.POSTHOG_API_HOST,
    CLOUDFLARE_ACCESS_AUD: process.env.CLOUDFLARE_ACCESS_AUD,
    CLOUDFLARE_ACCESS_JWKS_URL: process.env.CLOUDFLARE_ACCESS_JWKS_URL
  };

  process.env.ADMIN_DASHBOARD_TOKEN = 'local-admin-fixture-token';
  process.env.POSTHOG_PERSONAL_API_KEY = 'local-posthog-fixture-key';
  process.env.POSTHOG_PROJECT_ID = 'fixture-project';
  process.env.POSTHOG_API_HOST = 'https://posthog.example.invalid';
  delete process.env.CLOUDFLARE_ACCESS_AUD;
  delete process.env.CLOUDFLARE_ACCESS_JWKS_URL;

  globalThis.fetch = async (_url, options) => {
    const requestBody = JSON.parse(options.body);
    const queryText = requestBody.query.query;
    const isMonitoringQuery = queryText.includes('WITH\nobserved_starts AS');

    if (isMonitoringQuery && failMonitoringQuery) {
      return { ok: false, status: 503, json: async () => ({}) };
    }

    return {
      ok: true,
      status: 200,
      json: async () => ({ results: isMonitoringQuery ? monitoringRows : [] })
    };
  };

  const responseHeaders = new Map();
  let responseBody = '';
  const req = {
    method: 'GET',
    headers: { authorization: 'Bearer local-admin-fixture-token' },
    socket: { remoteAddress: clientIp },
    query: { range: '7d' }
  };
  const res = {
    statusCode: 0,
    setHeader: (name, value) => responseHeaders.set(name, value),
    end: (value) => {
      responseBody = value;
    }
  };

  try {
    await handler(req, res);
    return {
      statusCode: res.statusCode,
      headers: responseHeaders,
      body: JSON.parse(responseBody)
    };
  } finally {
    globalThis.fetch = previousFetch;
    for (const [key, value] of Object.entries(previousEnvironment)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

// Given: a healthy monitoring query and otherwise empty core metrics.
// When: the real admin handler serves the fixture.
// Then: the aggregate panel data is included without identifier leakage.
const healthyResponse = await invokeHandler({
  monitoringRows: [
    ...summaryRows({ observed: 12, identified: 9, client: 10 }),
    ['user_agent', 'chrome', 12],
    ['user_agent', sensitiveMarker, 100]
  ],
  clientIp: '127.0.0.41'
});
assert.equal(healthyResponse.statusCode, 200);
assert.equal(healthyResponse.headers.get('Cache-Control'), 'private, no-store');
assert.equal(healthyResponse.body.range, '7d');
assert.equal(healthyResponse.body.sessionStartMonitoring.summary.identityCoveragePercent, 75);
assert.deepEqual(healthyResponse.body.warnings, []);
assert.equal(JSON.stringify(healthyResponse.body).includes(sensitiveMarker), false);

// Given: only the optional monitoring query fails.
// When: the real admin handler serves core metrics.
// Then: core metrics stay usable and exactly one sanitized warning is returned.
const unavailableResponse = await invokeHandler({
  failMonitoringQuery: true,
  clientIp: '127.0.0.42'
});
assert.equal(unavailableResponse.statusCode, 200);
assert.equal(unavailableResponse.body.range, '7d');
assert.equal(unavailableResponse.body.sessionStartMonitoring.status, 'unavailable');
assert.deepEqual(unavailableResponse.body.warnings, ['session_start_monitoring_unavailable']);
assert.equal('counts' in unavailableResponse.body, false);

console.log('admin session start monitoring checks passed');
