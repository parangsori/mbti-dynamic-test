import { createHash, timingSafeEqual, webcrypto } from 'node:crypto';

const POSTHOG_EVENTS = [
  '$pageview',
  'start_click',
  'complete_test',
  'result_view',
  'share_copy',
  'result_image_share',
  'result_image_save',
  'result_image_download_fallback',
  'result_image_text_share',
  'result_image_save_fail',
  'home_screen_install_prompt',
  'home_screen_app_installed',
  'home_screen_standalone_open',
  'client_error',
  'result_server_sync_success',
  'result_server_sync_fail',
  'result_server_sync_skipped',
  'session_api_start_ok',
  'session_api_complete_ok',
  'session_api_fallback',
  'session_api_error',
  'followup_start'
];

const RANGE_DAYS = {
  '1d': 1,
  '7d': 7,
  '30d': 30
};

const DASHBOARD_TIME_ZONE = 'Asia/Seoul';
const RATE_LIMIT_WINDOW_MS = 60_000;
const RATE_LIMIT_MAX = 30;
const JWKS_CACHE_MS = 5 * 60_000;

const requestBuckets = new Map();
let cachedJwks = null;
let cachedJwksAt = 0;

const json = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.end(JSON.stringify(payload));
};

const getClientIp = (req) => {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
};

const rateLimit = (req) => {
  const now = Date.now();
  const ip = getClientIp(req);
  const current = requestBuckets.get(ip) || { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };

  if (current.resetAt <= now) {
    requestBuckets.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (current.count >= RATE_LIMIT_MAX) return false;

  current.count += 1;
  requestBuckets.set(ip, current);
  return true;
};

const base64UrlDecode = (value) => {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '=');
  return Buffer.from(padded, 'base64');
};

const parseJwt = (jwt) => {
  const parts = jwt.split('.');
  if (parts.length !== 3) throw new Error('invalid_jwt');

  return {
    header: JSON.parse(base64UrlDecode(parts[0]).toString('utf8')),
    payload: JSON.parse(base64UrlDecode(parts[1]).toString('utf8')),
    signedData: `${parts[0]}.${parts[1]}`,
    signature: base64UrlDecode(parts[2])
  };
};

const getJwks = async () => {
  const jwksUrl = process.env.CLOUDFLARE_ACCESS_JWKS_URL;
  if (!jwksUrl) throw new Error('missing_jwks_url');

  const now = Date.now();
  if (cachedJwks && now - cachedJwksAt < JWKS_CACHE_MS) return cachedJwks;

  const response = await fetch(jwksUrl, { headers: { Accept: 'application/json' } });
  if (!response.ok) throw new Error('jwks_fetch_failed');

  cachedJwks = await response.json();
  cachedJwksAt = now;
  return cachedJwks;
};

const verifyCloudflareAccessJwt = async (jwt) => {
  const expectedAud = process.env.CLOUDFLARE_ACCESS_AUD;
  if (!expectedAud) throw new Error('missing_access_aud');

  const { header, payload, signedData, signature } = parseJwt(jwt);
  if (header.alg !== 'RS256') throw new Error('unsupported_jwt_alg');

  const jwks = await getJwks();
  const key = jwks.keys?.find((item) => item.kid === header.kid);
  if (!key) throw new Error('jwt_key_not_found');

  const cryptoKey = await webcrypto.subtle.importKey(
    'jwk',
    key,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify']
  );

  const verified = await webcrypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    signature,
    new TextEncoder().encode(signedData)
  );
  if (!verified) throw new Error('jwt_signature_invalid');

  const nowSeconds = Math.floor(Date.now() / 1000);
  if (payload.exp && payload.exp < nowSeconds) throw new Error('jwt_expired');
  if (payload.nbf && payload.nbf > nowSeconds) throw new Error('jwt_not_active');

  const audiences = Array.isArray(payload.aud) ? payload.aud : [payload.aud];
  if (!audiences.includes(expectedAud)) throw new Error('jwt_audience_invalid');

  return true;
};

const safeEqual = (left, right) => {
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
};

const getBearerToken = (req) => {
  const header = req.headers.authorization || '';
  const match = /^Bearer\s+(.+)$/i.exec(header);
  return match?.[1] || '';
};

const authorize = async (req) => {
  const hasCloudflareAccessConfig = Boolean(
    process.env.CLOUDFLARE_ACCESS_AUD && process.env.CLOUDFLARE_ACCESS_JWKS_URL
  );

  if (hasCloudflareAccessConfig) {
    const jwt = req.headers['cf-access-jwt-assertion'];
    if (typeof jwt !== 'string' || !jwt) return { ok: false, status: 401, code: 'access_required' };

    try {
      await verifyCloudflareAccessJwt(jwt);
      return { ok: true, mode: 'cloudflare_access' };
    } catch {
      return { ok: false, status: 403, code: 'access_denied' };
    }
  }

  const expectedToken = process.env.ADMIN_DASHBOARD_TOKEN;
  if (expectedToken) {
    const token = getBearerToken(req);
    if (!token) return { ok: false, status: 401, code: 'token_required' };
    if (!safeEqual(token, expectedToken)) return { ok: false, status: 403, code: 'token_denied' };
    return { ok: true, mode: 'local_token' };
  }

  return { ok: false, status: 503, code: 'admin_auth_not_configured' };
};

const getRange = (rawRange) => (RANGE_DAYS[rawRange] ? rawRange : '1d');

const runPostHogQuery = async (query) => {
  const apiKey = process.env.POSTHOG_PERSONAL_API_KEY;
  const projectId = process.env.POSTHOG_PROJECT_ID;
  const apiHost = (process.env.POSTHOG_API_HOST || 'https://us.posthog.com').replace(/\/+$/, '');

  if (!apiKey || !projectId) {
    const error = new Error('posthog_not_configured');
    error.status = 503;
    throw error;
  }

  const response = await fetch(`${apiHost}/api/projects/${projectId}/query/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      query: {
        kind: 'HogQLQuery',
        query
      }
    })
  });

  if (!response.ok) {
    const error = new Error('posthog_query_failed');
    error.status = response.status >= 400 && response.status < 500 ? 502 : 503;
    throw error;
  }

  return response.json();
};

const eventListSql = () => POSTHOG_EVENTS.map((event) => `'${event.replace(/'/g, "''")}'`).join(', ');

const kstDateSql = (value) => `toDate(toTimeZone(${value}, '${DASHBOARD_TIME_ZONE}'))`;

const kstDateWindowSql = (days) => {
  const lookbackDays = Math.max(days - 1, 0);
  const scanDays = days + 1;

  return `
WHERE timestamp >= now() - INTERVAL ${scanDays} DAY
  AND timestamp <= now()
  AND ${kstDateSql('timestamp')} >= subtractDays(${kstDateSql('now()')}, ${lookbackDays})
`;
};

const buildEventCountQuery = (days) => `
SELECT
  event,
  count() AS total,
  count(DISTINCT distinct_id) AS actors
FROM events
${kstDateWindowSql(days)}
  AND event IN (${eventListSql()})
GROUP BY event
`;

const buildDailyQuery = (days) => `
SELECT
  ${kstDateSql('timestamp')} AS day,
  event,
  count() AS total
FROM events
${kstDateWindowSql(days)}
  AND event IN ('$pageview', 'start_click', 'complete_test', 'share_copy', 'result_image_share', 'result_image_save', 'result_image_download_fallback', 'result_image_text_share', 'result_image_save_fail')
GROUP BY day, event
ORDER BY day ASC
`;

const posthogPropertySql = (property) =>
  `coalesce(nullIf(toString(properties['${property.replace(/'/g, "''")}']), ''), '알 수 없음')`;

const buildLocationQuery = (days) => `
SELECT
  ${posthogPropertySql('$geoip_country_name')} AS country,
  ${posthogPropertySql('$geoip_city_name')} AS city,
  count() AS total,
  count(DISTINCT distinct_id) AS actors
FROM events
${kstDateWindowSql(days)}
  AND event = '$pageview'
GROUP BY country, city
ORDER BY total DESC
LIMIT 8
`;

const buildDeviceQuery = (days) => `
SELECT
  ${posthogPropertySql('$device_type')} AS deviceType,
  ${posthogPropertySql('$browser')} AS browser,
  ${posthogPropertySql('$os')} AS os,
  count() AS total,
  count(DISTINCT distinct_id) AS actors
FROM events
${kstDateWindowSql(days)}
  AND event = '$pageview'
GROUP BY deviceType, browser, os
ORDER BY total DESC
LIMIT 8
`;

const buildReferrerQuery = (days) => `
SELECT
  ${posthogPropertySql('$referring_domain')} AS source,
  count() AS total,
  count(DISTINCT distinct_id) AS actors
FROM events
${kstDateWindowSql(days)}
  AND event = '$pageview'
GROUP BY source
ORDER BY total DESC
LIMIT 8
`;

const buildErrorQuery = (days) => `
SELECT
  coalesce(nullIf(toString(properties['error_key']), ''), 'unknown_error') AS errorKey,
  coalesce(nullIf(toString(properties['error_source']), ''), 'app') AS source,
  coalesce(nullIf(toString(properties['error_name']), ''), 'Error') AS errorName,
  coalesce(nullIf(toString(properties['error_message']), ''), '상세 정보 없음 (이전 수집 데이터)') AS message,
  coalesce(nullIf(toString(properties['error_cause']), ''), '') AS cause,
  coalesce(nullIf(toString(properties['error_fingerprint']), ''), 'legacy') AS fingerprint,
  coalesce(nullIf(toString(properties['error_filename']), ''), '') AS filename,
  coalesce(nullIf(toString(properties['error_line']), ''), '0') AS errorLine,
  coalesce(nullIf(toString(properties['error_column']), ''), '0') AS errorColumn,
  coalesce(nullIf(toString(properties['error_stack']), ''), '') AS stack,
  coalesce(nullIf(toString(properties['error_component_stack']), ''), '') AS componentStack,
  coalesce(nullIf(toString(properties['error_resource_type']), ''), '') AS resourceType,
  coalesce(nullIf(toString(properties['app_version']), ''), '이전 버전') AS appVersion,
  coalesce(nullIf(toString(properties['path']), ''), '/') AS path,
  coalesce(nullIf(toString(properties['$browser']), ''), '알 수 없음') AS browser,
  coalesce(nullIf(toString(properties['$os']), ''), '알 수 없음') AS os,
  coalesce(nullIf(toString(properties['$device_type']), ''), '알 수 없음') AS deviceType,
  coalesce(nullIf(toString(properties['online']), ''), '알 수 없음') AS online,
  coalesce(nullIf(toString(properties['connection_type']), ''), '알 수 없음') AS connectionType,
  coalesce(nullIf(toString(properties['visibility_state']), ''), '알 수 없음') AS visibilityState,
  count() AS total,
  count(DISTINCT distinct_id) AS actors,
  min(timestamp) AS firstSeen,
  max(timestamp) AS lastSeen
FROM events
${kstDateWindowSql(days)}
  AND event = 'client_error'
GROUP BY errorKey, source, errorName, message, cause, fingerprint, filename, errorLine, errorColumn, stack, componentStack, resourceType, appVersion, path, browser, os, deviceType, online, connectionType, visibilityState
ORDER BY lastSeen DESC, total DESC
LIMIT 20
`;

const durationMsSql = () => `toFloatOrZero(toString(properties['durationMs']))`;

const buildSessionPerformanceQuery = (days) => {
  const durationMs = durationMsSql();

  return `
SELECT
  event,
  coalesce(nullIf(toString(properties['stage']), ''), if(event = 'session_api_start_ok', 'start', if(event = 'session_api_complete_ok', 'complete', ''))) AS stage,
  coalesce(nullIf(toString(properties['status']), ''), '') AS status,
  coalesce(nullIf(toString(properties['phase']), ''), '') AS phase,
  coalesce(nullIf(toString(properties['display_mode']), ''), 'unknown') AS displayMode,
  coalesce(nullIf(toString(properties['$device_type']), ''), '알 수 없음') AS deviceType,
  coalesce(nullIf(toString(properties['$browser']), ''), '알 수 없음') AS browser,
  coalesce(nullIf(toString(properties['$os']), ''), '알 수 없음') AS os,
  count() AS total,
  count(DISTINCT distinct_id) AS actors,
  countIf(${durationMs} > 0) AS durationSamples,
  round(avgIf(${durationMs}, ${durationMs} > 0)) AS avgMs,
  round(quantileIf(0.95)(${durationMs}, ${durationMs} > 0)) AS p95Ms,
  countIf(${durationMs} >= 1200) AS slow1200,
  countIf(${durationMs} >= 2000) AS slow2000
FROM events
${kstDateWindowSql(days)}
  AND event IN ('session_api_start_ok', 'session_api_complete_ok', 'session_api_fallback', 'session_api_error')
GROUP BY event, stage, status, phase, displayMode, deviceType, browser, os
ORDER BY slow2000 DESC, slow1200 DESC, p95Ms DESC, total DESC
LIMIT 24
`;
};

const rowsToCounts = (rows = []) =>
  rows.reduce((acc, row) => {
    const [event, total, actors] = row;
    acc[event] = {
      total: Number(total) || 0,
      actors: Number(actors) || 0
    };
    return acc;
  }, {});

const rowsToDaily = (rows = []) =>
  rows.map(([day, event, total]) => ({
    day,
    event,
    count: Number(total) || 0
  }));

const rowsToLocations = (rows = []) =>
  rows.map(([country, city, total, actors]) => ({
    country: country || '알 수 없음',
    city: city || '알 수 없음',
    total: Number(total) || 0,
    actors: Number(actors) || 0
  }));

const rowsToDevices = (rows = []) =>
  rows.map(([deviceType, browser, os, total, actors]) => ({
    deviceType: deviceType || '알 수 없음',
    browser: browser || '알 수 없음',
    os: os || '알 수 없음',
    total: Number(total) || 0,
    actors: Number(actors) || 0
  }));

const rowsToReferrers = (rows = []) =>
  rows.map(([source, total, actors]) => ({
    source: source && source !== '알 수 없음' ? source : '직접/알 수 없음',
    total: Number(total) || 0,
    actors: Number(actors) || 0
  }));

const rowsToErrors = (rows = []) =>
  rows.map(([
    errorKey,
    source,
    errorName,
    message,
    cause,
    fingerprint,
    filename,
    line,
    column,
    stack,
    componentStack,
    resourceType,
    appVersion,
    path,
    browser,
    os,
    deviceType,
    online,
    connectionType,
    visibilityState,
    total,
    actors,
    firstSeen,
    lastSeen
  ]) => ({
    errorKey: errorKey || 'unknown_error',
    source: source || 'app',
    errorName: errorName || 'Error',
    message: message || '상세 정보 없음',
    cause: cause || '',
    fingerprint: fingerprint || 'legacy',
    filename: filename || '',
    line: Number(line) || 0,
    column: Number(column) || 0,
    stack: stack || '',
    componentStack: componentStack || '',
    resourceType: resourceType || '',
    appVersion: appVersion || '이전 버전',
    path: path || '/',
    browser: browser || '알 수 없음',
    os: os || '알 수 없음',
    deviceType: deviceType || '알 수 없음',
    online: online || '알 수 없음',
    connectionType: connectionType || '알 수 없음',
    visibilityState: visibilityState || '알 수 없음',
    total: Number(total) || 0,
    actors: Number(actors) || 0,
    firstSeen: firstSeen || '',
    lastSeen: lastSeen || ''
  }));

const weightedAverage = (items, valueKey, weightKey = 'durationSamples') => {
  const weighted = items.reduce((acc, item) => {
    const weight = Number(item[weightKey]) || 0;
    return {
      total: acc.total + ((Number(item[valueKey]) || 0) * weight),
      weight: acc.weight + weight
    };
  }, { total: 0, weight: 0 });

  return weighted.weight > 0 ? Math.round(weighted.total / weighted.weight) : 0;
};

const rowsToSessionPerformance = (rows = []) => {
  const items = rows.map(([
    event,
    stage,
    status,
    phase,
    displayMode,
    deviceType,
    browser,
    os,
    total,
    actors,
    durationSamples,
    avgMs,
    p95Ms,
    slow1200,
    slow2000
  ]) => ({
    event: event || '',
    stage: stage || '',
    status: status || '',
    phase: phase || '',
    displayMode: displayMode || 'unknown',
    deviceType: deviceType || '알 수 없음',
    browser: browser || '알 수 없음',
    os: os || '알 수 없음',
    total: Number(total) || 0,
    actors: Number(actors) || 0,
    durationSamples: Number(durationSamples) || 0,
    avgMs: Number(avgMs) || 0,
    p95Ms: Number(p95Ms) || 0,
    slow1200: Number(slow1200) || 0,
    slow2000: Number(slow2000) || 0
  }));
  const startItems = items.filter((item) => item.event === 'session_api_start_ok');
  const completeItems = items.filter((item) => item.event === 'session_api_complete_ok');
  const errorItems = items.filter((item) => item.event === 'session_api_error');
  const fallbackItems = items.filter((item) => item.event === 'session_api_fallback');

  return {
    summary: {
      starts: startItems.reduce((sum, item) => sum + item.total, 0),
      completes: completeItems.reduce((sum, item) => sum + item.total, 0),
      errors: errorItems.reduce((sum, item) => sum + item.total, 0),
      fallbacks: fallbackItems.reduce((sum, item) => sum + item.total, 0),
      startAvgMs: weightedAverage(startItems, 'avgMs'),
      startP95Ms: Math.max(0, ...startItems.map((item) => item.p95Ms || 0)),
      completeAvgMs: weightedAverage(completeItems, 'avgMs'),
      completeP95Ms: Math.max(0, ...completeItems.map((item) => item.p95Ms || 0)),
      slowStarts: startItems.reduce((sum, item) => sum + item.slow1200, 0),
      slowCompletes: completeItems.reduce((sum, item) => sum + item.slow1200, 0)
    },
    items
  };
};

const percent = (value, base) => (base > 0 ? Math.round((value / base) * 100) : 0);

const buildNotes = ({ starts, completions, shares, installs, standaloneActors, errorTotal, serverSyncFailures, imageSaveFailures, sessionPerformance }) => {
  const notes = [];
  if (starts === 0) {
    notes.push('아직 시작 이벤트가 적어서 유입 품질 판단은 더 쌓인 뒤 보는 게 좋아요.');
  } else if (percent(completions, starts) >= 70) {
    notes.push('시작 대비 완료율이 안정적입니다. 다음 판단은 공유와 재방문 쪽이 좋아요.');
  } else {
    notes.push('시작 후 완료까지의 흐름에 이탈이 있습니다. 질문 진행 구간보다 첫 화면 기대와 결과 가치 전달을 먼저 점검해보세요.');
  }

  if (completions > 0 && shares === 0) {
    notes.push('완료는 있지만 공유/저장이 거의 없습니다. 결과 카드 문구나 공유 버튼 노출을 점검해보세요.');
  }

  if (installs > 0 || standaloneActors > 0) {
    notes.push('홈화면 설치/실행 신호가 잡히고 있습니다. 재방문 기반 사용자를 별도로 관찰할 수 있습니다.');
  }

  if (errorTotal > 0) {
    notes.push('클라이언트 오류 이벤트가 잡혔습니다. 오류 유형과 영향 사용자를 먼저 확인해주세요.');
  }

  if (serverSyncFailures > 0) {
    notes.push('결과 백업 동기화 실패 이벤트가 있습니다. Supabase 환경과 네트워크 실패율을 같이 보세요.');
  }

  if (imageSaveFailures > 0) {
    notes.push('결과 카드 저장/공유 실패 이벤트가 있습니다. 브라우저별 공유 API 지원 여부를 먼저 확인해주세요.');
  }

  if ((sessionPerformance?.summary?.slowStarts || 0) > 0 || (sessionPerformance?.summary?.slowCompletes || 0) > 0) {
    notes.push('서버 세션 응답이 1.2초 이상 걸린 이벤트가 있습니다. 기기/브라우저별 p95와 fallback 여부를 같이 확인하세요.');
  }

  return notes;
};

const buildMetrics = ({ range, counts, daily, locations, devices, referrers, errors, sessionPerformance }) => {
  const pageviews = counts.$pageview?.total || 0;
  const visitors = counts.$pageview?.actors || 0;
  const starts = counts.start_click?.total || 0;
  const startActors = counts.start_click?.actors || 0;
  const completions = counts.complete_test?.total || 0;
  const completionActors = counts.complete_test?.actors || 0;
  const resultViews = counts.result_view?.total || 0;
  const shareCopies = counts.share_copy?.total || 0;
  const imageShares = counts.result_image_share?.total || 0;
  const imageSaves = counts.result_image_save?.total || 0;
  const downloadFallbacks = counts.result_image_download_fallback?.total || 0;
  const textShares = counts.result_image_text_share?.total || 0;
  const imageSaveFailures = counts.result_image_save_fail?.total || 0;
  const shares = shareCopies + imageShares + imageSaves + textShares;
  const shareActors = Math.max(
    counts.share_copy?.actors || 0,
    counts.result_image_share?.actors || 0,
    counts.result_image_save?.actors || 0,
    counts.result_image_text_share?.actors || 0
  );
  const installPrompts = counts.home_screen_install_prompt?.total || 0;
  const installs = counts.home_screen_app_installed?.total || 0;
  const standaloneOpens = counts.home_screen_standalone_open?.total || 0;
  const standaloneActors = counts.home_screen_standalone_open?.actors || 0;
  const clientErrors = counts.client_error?.total || 0;
  const clientErrorActors = counts.client_error?.actors || 0;
  const serverSyncSuccess = counts.result_server_sync_success?.total || 0;
  const serverSyncFailures = counts.result_server_sync_fail?.total || 0;
  const serverSyncSkipped = counts.result_server_sync_skipped?.total || 0;
  const syncAttempts = serverSyncSuccess + serverSyncFailures;

  return {
    range,
    generatedAt: new Date().toISOString(),
    timeZone: DASHBOARD_TIME_ZONE,
    summary: {
      pageviews,
      visitors,
      starts,
      startActors,
      completions,
      completionActors,
      resultViews,
      completionRate: percent(completions, starts),
      shares,
      shareRate: percent(shares, completions),
      installPrompts,
      installs,
      installRate: percent(installs, installPrompts),
      standaloneOpens,
      standaloneActors,
      standaloneOpenRate: percent(standaloneActors, counts.$pageview?.actors || pageviews),
      clientErrors,
      clientErrorActors,
      serverSyncFailures
    },
    funnel: [
      { key: 'visitors', label: '방문자', count: visitors, rateFromPrevious: 100, caption: `${pageviews} 페이지뷰` },
      { key: 'start_click', label: '시작자', count: counts.start_click?.actors || 0, rateFromPrevious: percent(counts.start_click?.actors || 0, visitors) },
      { key: 'complete_test', label: '완료자', count: counts.complete_test?.actors || 0, rateFromPrevious: percent(counts.complete_test?.actors || 0, counts.start_click?.actors || starts) },
      { key: 'share', label: '공유/저장 사용자', count: shareActors, rateFromPrevious: percent(shareActors, counts.complete_test?.actors || completions) },
      { key: 'standalone', label: '홈화면 실행자', count: standaloneActors, rateFromPrevious: percent(standaloneActors, visitors) }
    ],
    sharing: {
      copies: shareCopies,
      imageShares,
      imageSaves,
      downloadFallbacks,
      textShares,
      imageSaveFailures
    },
    install: {
      prompts: installPrompts,
      accepted: installs,
      rate: percent(installs, installPrompts),
      standaloneOpens,
      standaloneActors
    },
    sync: {
      success: serverSyncSuccess,
      failures: serverSyncFailures,
      skipped: serverSyncSkipped,
      successRate: percent(serverSyncSuccess, syncAttempts)
    },
    sessionPerformance,
    errors: {
      total: clientErrors,
      actors: clientErrorActors,
      items: errors
    },
    acquisition: {
      locations,
      devices,
      referrers
    },
    daily,
    notes: buildNotes({ starts, completions, shares, installs, standaloneActors, errorTotal: clientErrors, serverSyncFailures, imageSaveFailures, sessionPerformance })
  };
};

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return json(res, 405, { error: 'method_not_allowed' });
  }

  if (!rateLimit(req)) {
    return json(res, 429, { error: 'too_many_requests' });
  }

  const auth = await authorize(req);
  if (!auth.ok) {
    return json(res, auth.status, { error: auth.code });
  }

  const range = getRange(req.query?.range);
  const days = RANGE_DAYS[range];

  try {
    const [eventCounts, dailyCounts, locationCounts, deviceCounts, referrerCounts, errorCounts, sessionPerformanceCounts] = await Promise.all([
      runPostHogQuery(buildEventCountQuery(days)),
      runPostHogQuery(buildDailyQuery(days)),
      runPostHogQuery(buildLocationQuery(days)),
      runPostHogQuery(buildDeviceQuery(days)),
      runPostHogQuery(buildReferrerQuery(days)),
      runPostHogQuery(buildErrorQuery(days)),
      runPostHogQuery(buildSessionPerformanceQuery(days))
    ]);

    const metrics = buildMetrics({
      range,
      counts: rowsToCounts(eventCounts.results),
      daily: rowsToDaily(dailyCounts.results),
      locations: rowsToLocations(locationCounts.results),
      devices: rowsToDevices(deviceCounts.results),
      referrers: rowsToReferrers(referrerCounts.results),
      errors: rowsToErrors(errorCounts.results),
      sessionPerformance: rowsToSessionPerformance(sessionPerformanceCounts.results)
    });

    return json(res, 200, metrics);
  } catch (error) {
    const status = error.status || 500;
    return json(res, status, {
      error: status === 503 ? 'metrics_temporarily_unavailable' : 'metrics_query_failed'
    });
  }
}
