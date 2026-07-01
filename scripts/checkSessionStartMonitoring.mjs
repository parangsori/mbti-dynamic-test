import assert from 'node:assert/strict';
import {
  buildSessionStartObservation,
  coarseUserAgentFamily,
  createAccountActorKey,
  createNetworkActorKey,
  kstDayBucket,
  kstMonthBucket
} from '../server/analytics/sessionStartMonitoring.js';
import { assertSessionStartDelivery } from './checkSessionStartDelivery.mjs';

const salt = 'local-monitoring-test-salt-with-enough-entropy';
const sourceMarkers = {
  ip: '203.0.113.77',
  userAgent:
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/126.0.0.0 Safari/537.36 private-marker',
  accountId: 'f0f9efcb-7de6-4dc0-84de-37ac71c37071',
  email: 'private-person@example.invalid',
  token: 'private-session-token-marker',
  name: 'private-name-marker',
  question: 'private-question-marker',
  body: 'private-body-marker'
};

const allowedPropertyKeys = [
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
];

const assertNoSourceMarkers = (value) => {
  const serialized = JSON.stringify(value);
  for (const marker of Object.values(sourceMarkers)) {
    assert.equal(serialized.includes(marker), false, `serialized observation leaked ${marker}`);
  }
};

// Given: timestamps around KST midnight and month boundaries.
// When: their KST buckets are calculated.
// Then: bucket changes follow KST rather than UTC boundaries.
assert.equal(kstDayBucket(new Date('2026-07-01T14:59:59.999Z')), '2026-07-01');
assert.equal(kstDayBucket(new Date('2026-07-01T15:00:00.000Z')), '2026-07-02');
assert.equal(kstMonthBucket(new Date('2026-06-30T14:59:59.999Z')), '2026-06');
assert.equal(kstMonthBucket(new Date('2026-06-30T15:00:00.000Z')), '2026-07');

// Given: common and malformed browser user agents.
// When: a coarse family is derived.
// Then: only a small categorical vocabulary is returned.
assert.equal(coarseUserAgentFamily(sourceMarkers.userAgent), 'chrome');
assert.equal(coarseUserAgentFamily('Mozilla/5.0 Edg/126.0.0.0 Chrome/126.0.0.0'), 'edge');
assert.equal(coarseUserAgentFamily('Mozilla/5.0 Firefox/127.0'), 'firefox');
assert.equal(coarseUserAgentFamily('Mozilla/5.0 Version/17.5 Safari/605.1.15'), 'safari');
assert.equal(coarseUserAgentFamily('Googlebot/2.1'), 'other');
assert.equal(coarseUserAgentFamily({ malicious: true }), 'unknown');

// Given: equivalent first-hop forwarding values within and across KST days.
// When: network actor keys are derived.
// Then: the daily key is deterministic and rotates the next KST day.
const networkKey = createNetworkActorKey({
  forwardingFor: `${sourceMarkers.ip}, 198.51.100.2`,
  userAgent: sourceMarkers.userAgent,
  salt,
  now: new Date('2026-07-01T01:00:00.000Z')
});
const equivalentNetworkKey = createNetworkActorKey({
  forwardingFor: `  ${sourceMarkers.ip}  `,
  userAgent: sourceMarkers.userAgent,
  salt,
  now: new Date('2026-07-01T13:00:00.000Z')
});
const nextDayNetworkKey = createNetworkActorKey({
  forwardingFor: sourceMarkers.ip,
  userAgent: sourceMarkers.userAgent,
  salt,
  now: new Date('2026-07-01T15:00:00.000Z')
});
assert.match(networkKey, /^[a-f0-9]{64}$/);
assert.equal(equivalentNetworkKey, networkKey);
assert.notEqual(nextDayNetworkKey, networkKey);
assert.equal(
  createNetworkActorKey({ forwardingFor: 'not-an-ip', userAgent: sourceMarkers.userAgent, salt }),
  null
);

// Given: a server-verified account and month boundary timestamps.
// When: account actor keys are derived.
// Then: the monthly key is deterministic, rotates monthly, and rejects unverified input.
const verifiedAccountContext = {
  verified: true,
  accountId: sourceMarkers.accountId,
  accessTier: 'premium',
  email: sourceMarkers.email
};
const accountKey = createAccountActorKey({
  verifiedAccountContext,
  salt,
  now: new Date('2026-07-01T01:00:00.000Z')
});
assert.match(accountKey, /^[a-f0-9]{64}$/);
assert.equal(
  createAccountActorKey({
    verifiedAccountContext,
    salt,
    now: new Date('2026-07-31T14:59:59.999Z')
  }),
  accountKey
);
assert.notEqual(
  createAccountActorKey({
    verifiedAccountContext,
    salt,
    now: new Date('2026-07-31T15:00:00.000Z')
  }),
  accountKey
);
assert.equal(
  createAccountActorKey({
    verifiedAccountContext: { ...verifiedAccountContext, verified: false },
    salt
  }),
  null
);

// Given: sensitive request-shaped data and an unverified premium claim.
// When: the strict observation is constructed.
// Then: it remains anonymous and serializes only allowlisted categorical fields.
const anonymousObservation = buildSessionStartObservation({
  forwardingFor: sourceMarkers.ip,
  userAgent: sourceMarkers.userAgent,
  recentSessionCount: 12,
  ageGroup: '30s',
  environment: 'production',
  salt,
  now: new Date('2026-07-01T01:00:00.000Z'),
  verifiedAccountContext: {
    verified: false,
    accountId: sourceMarkers.accountId,
    accessTier: 'premium'
  },
  email: sourceMarkers.email,
  sessionToken: sourceMarkers.token,
  name: sourceMarkers.name,
  question: sourceMarkers.question,
  body: sourceMarkers.body
});
assert.equal(anonymousObservation.event, 'session_api_start_observed');
assert.deepEqual(Object.keys(anonymousObservation.properties).sort(), allowedPropertyKeys.filter(
  (key) => key !== 'account_actor_key'
).sort());
assert.equal(anonymousObservation.properties.$process_person_profile, false);
assert.equal(anonymousObservation.properties.policy_version, 1);
assert.equal(anonymousObservation.properties.access_tier, 'anonymous');
assert.equal(anonymousObservation.properties.account_identity_available, false);
assert.equal(anonymousObservation.properties.identity_available, true);
assert.equal(anonymousObservation.properties.recent_session_count_bucket, '10+');
assert.equal(anonymousObservation.properties.age_group_present, true);
assertNoSourceMarkers(anonymousObservation);

// Given: a verified premium account context.
// When: the observation is constructed.
// Then: only the monthly account actor key and coarse tier are added.
const verifiedObservation = buildSessionStartObservation({
  forwardingFor: sourceMarkers.ip,
  userAgent: sourceMarkers.userAgent,
  recentSessionCount: 0,
  ageGroup: '',
  environment: 'preview',
  salt,
  now: new Date('2026-07-01T01:00:00.000Z'),
  verifiedAccountContext
});
assert.deepEqual(Object.keys(verifiedObservation.properties).sort(), allowedPropertyKeys.sort());
assert.equal(verifiedObservation.properties.account_actor_key, accountKey);
assert.equal(verifiedObservation.properties.access_tier, 'premium');
assert.equal(verifiedObservation.properties.account_identity_available, true);
assert.equal(verifiedObservation.properties.recent_session_count_bucket, '0');
assert.equal(verifiedObservation.properties.age_group_present, false);
assertNoSourceMarkers(verifiedObservation);

// Given: malformed source input and a missing salt.
// When: an observation is constructed.
// Then: identity becomes unavailable without throwing or carrying source values.
const malformedObservation = buildSessionStartObservation({
  forwardingFor: ['not-an-ip'],
  userAgent: null,
  recentSessionCount: Number.NaN,
  environment: sourceMarkers.body,
  salt: '',
  verifiedAccountContext: verifiedAccountContext
});
assert.equal(malformedObservation.properties.identity_available, false);
assert.equal(malformedObservation.properties.account_identity_available, false);
assert.equal(malformedObservation.properties.access_tier, 'anonymous');
assert.equal(malformedObservation.properties.environment, 'unknown');
assert.equal(malformedObservation.properties.distinct_id, 'session-monitoring-unavailable');
assertNoSourceMarkers(malformedObservation);

await assertSessionStartDelivery({
  anonymousObservation,
  verifiedObservation,
  sourceMarkers,
  assertNoSourceMarkers
});

console.log('session start monitoring checks passed');
