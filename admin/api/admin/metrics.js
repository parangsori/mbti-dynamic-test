import { createHash, timingSafeEqual, webcrypto } from 'node:crypto';

const POSTHOG_EVENTS = [
  '$pageview',
  'start_click',
  'question_reach_3',
  'question_reach_6',
  'question_reach_9',
  'complete_test',
  'share_copy',
  'result_image_share',
  'result_image_save',
  'home_screen_install_prompt',
  'home_screen_app_installed',
  'home_screen_standalone_open'
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

const getRange = (rawRange) => (RANGE_DAYS[rawRange] ? rawRange : '7d');

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
  AND event IN ('$pageview', 'start_click', 'complete_test', 'share_copy', 'result_image_share', 'result_image_save')
GROUP BY day, event
ORDER BY day ASC
`;

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

const percent = (value, base) => (base > 0 ? Math.round((value / base) * 100) : 0);

const buildNotes = ({ starts, completions, shares, installs, reach3, reach6, reach9 }) => {
  const notes = [];
  if (starts === 0) {
    notes.push('아직 시작 이벤트가 적어서 퍼널 판단은 더 쌓인 뒤 보는 게 좋아요.');
  } else if (percent(completions, starts) >= 70) {
    notes.push('시작 대비 완료율이 안정적입니다. 다음 판단은 공유와 재방문 쪽이 좋아요.');
  } else {
    notes.push('시작 후 완료까지의 흐름에 이탈이 있습니다. 질문 진행 구간별 차이를 먼저 확인해보세요.');
  }

  if (starts > 0 && reach3 > 0 && reach6 < reach3 * 0.7) {
    notes.push('3문항 이후 6문항 도달 비율이 낮습니다. 초반 질문 피로도나 스와이프 이해도를 점검할 만합니다.');
  } else if (reach6 > 0 && reach9 < reach6 * 0.7) {
    notes.push('중반 이후 이탈이 보입니다. 보정 질문 전까지의 진행 호흡을 확인해보세요.');
  }

  if (completions > 0 && shares === 0) {
    notes.push('완료는 있지만 공유/저장이 거의 없습니다. 결과 카드 문구나 공유 버튼 노출을 점검해보세요.');
  }

  if (installs > 0) {
    notes.push('홈화면 설치 이벤트가 잡히고 있습니다. 설치 이후 재방문 지표를 같이 보는 단계로 확장할 수 있습니다.');
  }

  return notes;
};

const buildMetrics = ({ range, counts, daily }) => {
  const pageviews = counts.$pageview?.total || 0;
  const visitors = counts.$pageview?.actors || 0;
  const starts = counts.start_click?.total || 0;
  const completions = counts.complete_test?.total || 0;
  const reach3 = counts.question_reach_3?.total || 0;
  const reach6 = counts.question_reach_6?.total || 0;
  const reach9 = counts.question_reach_9?.total || 0;
  const shareCopies = counts.share_copy?.total || 0;
  const imageShares = counts.result_image_share?.total || 0;
  const imageSaves = counts.result_image_save?.total || 0;
  const shares = shareCopies + imageShares + imageSaves;
  const installPrompts = counts.home_screen_install_prompt?.total || 0;
  const installs = counts.home_screen_app_installed?.total || 0;
  const standaloneOpens = counts.home_screen_standalone_open?.total || 0;
  const standaloneActors = counts.home_screen_standalone_open?.actors || 0;

  return {
    range,
    generatedAt: new Date().toISOString(),
    timeZone: DASHBOARD_TIME_ZONE,
    summary: {
      pageviews,
      visitors,
      starts,
      completions,
      completionRate: percent(completions, starts),
      shares,
      shareRate: percent(shares, completions),
      installPrompts,
      installs,
      installRate: percent(installs, installPrompts),
      standaloneOpens,
      standaloneActors,
      standaloneOpenRate: percent(standaloneActors, counts.$pageview?.actors || pageviews)
    },
    funnel: [
      { key: 'pageview', label: '방문', count: pageviews, rateFromPrevious: 100 },
      { key: 'start_click', label: '시작', count: starts, rateFromPrevious: percent(starts, pageviews) },
      { key: 'question_reach_3', label: '3문항', count: reach3, rateFromPrevious: percent(reach3, starts) },
      { key: 'question_reach_6', label: '6문항', count: reach6, rateFromPrevious: percent(reach6, reach3) },
      { key: 'question_reach_9', label: '9문항', count: reach9, rateFromPrevious: percent(reach9, reach6) },
      { key: 'complete_test', label: '완료', count: completions, rateFromPrevious: percent(completions, reach9 || starts) },
      { key: 'share', label: '공유/저장', count: shares, rateFromPrevious: percent(shares, completions) }
    ],
    sharing: {
      copies: shareCopies,
      imageShares,
      imageSaves
    },
    install: {
      prompts: installPrompts,
      accepted: installs,
      rate: percent(installs, installPrompts),
      standaloneOpens,
      standaloneActors
    },
    daily,
    notes: buildNotes({ starts, completions, shares, installs, reach3, reach6, reach9 })
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
    const [eventCounts, dailyCounts] = await Promise.all([
      runPostHogQuery(buildEventCountQuery(days)),
      runPostHogQuery(buildDailyQuery(days))
    ]);

    const metrics = buildMetrics({
      range,
      counts: rowsToCounts(eventCounts.results),
      daily: rowsToDaily(dailyCounts.results)
    });

    return json(res, 200, metrics);
  } catch (error) {
    const status = error.status || 500;
    return json(res, status, {
      error: status === 503 ? 'metrics_temporarily_unavailable' : 'metrics_query_failed'
    });
  }
}
