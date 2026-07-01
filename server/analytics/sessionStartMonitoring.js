import { createHmac } from 'node:crypto';
import { isIP } from 'node:net';
import { waitUntil } from '@vercel/functions';

const EVENT_NAME = 'session_api_start_observed';
const POLICY_VERSION = 1;
const DEFAULT_TIMEOUT_MS = 1000;
const VALID_ENVIRONMENTS = new Set(['production', 'preview', 'development']);
const VALID_ACCESS_TIERS = new Set(['free', 'premium']);
const VALID_REPORTED_ACCESS_TIERS = new Set(['anonymous', 'free', 'premium']);
const VALID_USER_AGENT_FAMILIES = new Set(['chrome', 'edge', 'firefox', 'safari', 'other', 'unknown']);
const VALID_RECENT_SESSION_BUCKETS = new Set(['0', '1-2', '3-9', '10+']);
const ACTOR_KEY_PATTERN = /^[a-f0-9]{64}$/;
const ALLOWED_PROPERTY_KEYS = new Set([
  '$process_person_profile',
  'access_tier',
  'account_actor_key',
  'account_identity_available',
  'age_group_present',
  'distinct_id',
  'environment',
  'identity_available',
  'policy_version',
  'recent_session_count_bucket',
  'user_agent_family'
]);

let missingConfigWarningEmitted = false;

const hmacSha256 = (salt, value) =>
  createHmac('sha256', salt).update(value).digest('hex');

const hasUsableSalt = (salt) => typeof salt === 'string' && salt.length > 0;

const normalizeForwardingIp = (forwardingFor) => {
  if (typeof forwardingFor !== 'string') return null;
  const firstHop = forwardingFor.split(',', 1)[0].trim();
  return isIP(firstHop) > 0 ? firstHop.toLowerCase() : null;
};

const kstDateParts = (now) => {
  const date = now instanceof Date && Number.isFinite(now.getTime()) ? now : new Date();
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(date).reduce((parts, part) => {
    if (part.type === 'year' || part.type === 'month' || part.type === 'day') {
      parts[part.type] = part.value;
    }
    return parts;
  }, {});
};

export const kstDayBucket = (now = new Date()) => {
  const { year, month, day } = kstDateParts(now);
  return `${year}-${month}-${day}`;
};

export const kstMonthBucket = (now = new Date()) => {
  const { year, month } = kstDateParts(now);
  return `${year}-${month}`;
};

export const coarseUserAgentFamily = (userAgent) => {
  if (typeof userAgent !== 'string') return 'unknown';
  const normalized = userAgent.toLowerCase();
  if (normalized.includes('edg/')) return 'edge';
  if (normalized.includes('firefox/')) return 'firefox';
  if (normalized.includes('chrome/') && !normalized.includes('bot')) return 'chrome';
  if (normalized.includes('safari/') && !normalized.includes('chrome/')) return 'safari';
  return 'other';
};

export const createNetworkActorKey = ({ forwardingFor, userAgent, salt, now = new Date() }) => {
  const networkIp = normalizeForwardingIp(forwardingFor);
  if (!networkIp || !hasUsableSalt(salt)) return null;
  return hmacSha256(
    salt,
    `network:${kstDayBucket(now)}:${networkIp}:${coarseUserAgentFamily(userAgent)}`
  );
};

const verifiedAccount = (verifiedAccountContext) => {
  if (!verifiedAccountContext || verifiedAccountContext.verified !== true) return null;
  if (typeof verifiedAccountContext.accountId !== 'string' || !verifiedAccountContext.accountId) {
    return null;
  }
  if (!VALID_ACCESS_TIERS.has(verifiedAccountContext.accessTier)) return null;
  return verifiedAccountContext;
};

export const createAccountActorKey = ({ verifiedAccountContext, salt, now = new Date() }) => {
  const account = verifiedAccount(verifiedAccountContext);
  if (!account || !hasUsableSalt(salt)) return null;
  return hmacSha256(salt, `account:${kstMonthBucket(now)}:${account.accountId}`);
};

const recentSessionCountBucket = (recentSessionCount) => {
  if (!Number.isFinite(recentSessionCount) || recentSessionCount <= 0) return '0';
  if (recentSessionCount <= 2) return '1-2';
  if (recentSessionCount <= 9) return '3-9';
  return '10+';
};

const safeEnvironment = (environment) =>
  VALID_ENVIRONMENTS.has(environment) ? environment : 'unknown';

export const buildSessionStartObservation = ({
  forwardingFor,
  userAgent,
  recentSessionCount,
  ageGroup,
  environment,
  salt,
  now = new Date(),
  verifiedAccountContext
}) => {
  const networkActorKey = createNetworkActorKey({ forwardingFor, userAgent, salt, now });
  const account = verifiedAccount(verifiedAccountContext);
  const accountActorKey = createAccountActorKey({ verifiedAccountContext, salt, now });
  const properties = {
    distinct_id: networkActorKey || 'session-monitoring-unavailable',
    $process_person_profile: false,
    policy_version: POLICY_VERSION,
    environment: safeEnvironment(environment),
    identity_available: Boolean(networkActorKey),
    account_identity_available: Boolean(accountActorKey),
    access_tier: accountActorKey && account ? account.accessTier : 'anonymous',
    user_agent_family: coarseUserAgentFamily(userAgent),
    recent_session_count_bucket: recentSessionCountBucket(recentSessionCount),
    age_group_present: typeof ageGroup === 'string' && ageGroup.length > 0
  };
  if (accountActorKey) properties.account_actor_key = accountActorKey;
  return { event: EVENT_NAME, properties };
};

const isStrictObservation = (observation) => {
  if (!observation || observation.event !== EVENT_NAME || !observation.properties) return false;
  const properties = observation.properties;
  const keysAreAllowed = Object.keys(properties).every((key) => ALLOWED_PROPERTY_KEYS.has(key));
  const networkIdentityIsValid = properties.identity_available
    ? typeof properties.distinct_id === 'string'
      && ACTOR_KEY_PATTERN.test(properties.distinct_id)
    : properties.distinct_id === 'session-monitoring-unavailable';
  const accountIdentityIsValid = properties.account_identity_available
    ? typeof properties.account_actor_key === 'string'
      && ACTOR_KEY_PATTERN.test(properties.account_actor_key)
      && VALID_ACCESS_TIERS.has(properties.access_tier)
    : properties.account_actor_key === undefined && properties.access_tier === 'anonymous';
  return keysAreAllowed
    && properties.$process_person_profile === false
    && properties.policy_version === POLICY_VERSION
    && typeof properties.identity_available === 'boolean'
    && typeof properties.account_identity_available === 'boolean'
    && networkIdentityIsValid
    && accountIdentityIsValid
    && (VALID_ENVIRONMENTS.has(properties.environment) || properties.environment === 'unknown')
    && VALID_REPORTED_ACCESS_TIERS.has(properties.access_tier)
    && VALID_USER_AGENT_FAMILIES.has(properties.user_agent_family)
    && VALID_RECENT_SESSION_BUCKETS.has(properties.recent_session_count_bucket)
    && typeof properties.age_group_present === 'boolean';
};

const captureUrl = (posthogHost) => {
  try {
    return new URL('/capture/', posthogHost).toString();
  } catch {
    return null;
  }
};

export const captureSessionStartObservation = async ({
  observation,
  posthogToken,
  posthogHost,
  fetchImpl = globalThis.fetch,
  timeoutMs = DEFAULT_TIMEOUT_MS
}) => {
  if (!isStrictObservation(observation)) {
    return { ok: false, status: 'disabled', reason: 'invalid_event' };
  }
  const endpoint = captureUrl(posthogHost);
  if (typeof posthogToken !== 'string' || !posthogToken || !endpoint || typeof fetchImpl !== 'function') {
    return { ok: false, status: 'disabled', reason: 'missing_config' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetchImpl(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ api_key: posthogToken, ...observation }),
      signal: controller.signal
    });
    if (!response.ok) return { ok: false, status: 'failed', reason: 'http_error' };
    return { ok: true, status: 'captured' };
  } catch {
    return {
      ok: false,
      status: 'failed',
      reason: controller.signal.aborted ? 'timeout' : 'network_error'
    };
  } finally {
    clearTimeout(timeout);
  }
};

const logDeliveryOutcome = (outcome, logger) => {
  if (outcome.reason === 'missing_config') {
    if (!missingConfigWarningEmitted) {
      missingConfigWarningEmitted = true;
      logger.warn('session_start_monitoring_missing_config');
    }
    return;
  }
  if (!outcome.ok) logger.warn(`session_start_monitoring_${outcome.reason}`);
};

export const scheduleSessionStartObservation = ({
  observation,
  posthogToken,
  posthogHost,
  fetchImpl,
  timeoutMs = DEFAULT_TIMEOUT_MS,
  waitUntilImpl = waitUntil,
  logger = console
}) => {
  const delivery = captureSessionStartObservation({
    observation,
    posthogToken,
    posthogHost,
    fetchImpl,
    timeoutMs
  }).then((outcome) => {
    logDeliveryOutcome(outcome, logger);
    return outcome;
  });

  delivery.catch(() => logger.warn('session_start_monitoring_delivery_error'));
  try {
    waitUntilImpl(delivery);
    return { ok: true, status: 'scheduled' };
  } catch {
    logger.warn('session_start_monitoring_scheduling_error');
    return { ok: false, status: 'failed', reason: 'scheduling_error' };
  }
};
