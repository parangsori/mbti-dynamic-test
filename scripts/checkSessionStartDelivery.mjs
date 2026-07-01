import assert from 'node:assert/strict';
import {
  captureSessionStartObservation,
  scheduleSessionStartObservation
} from '../server/analytics/sessionStartMonitoring.js';

const captureOptions = {
  posthogToken: 'public-project-token',
  posthogHost: 'https://analytics.example.invalid'
};

export const assertSessionStartDelivery = async ({
  anonymousObservation,
  verifiedObservation,
  sourceMarkers,
  assertNoSourceMarkers
}) => {
  // Given: a configured capture endpoint and strict observation.
  // When: capture succeeds.
  // Then: the mocked wire payload is allowlisted and the outcome is binary/sanitized.
  let capturedRequest;
  const successOutcome = await captureSessionStartObservation({
    observation: verifiedObservation,
    ...captureOptions,
    fetchImpl: async (url, options) => {
      capturedRequest = { url, options };
      return { ok: true, status: 200 };
    }
  });
  assert.deepEqual(successOutcome, { ok: true, status: 'captured' });
  assert.equal(capturedRequest.url, 'https://analytics.example.invalid/capture/');
  assert.equal(capturedRequest.options.method, 'POST');
  const capturedPayload = JSON.parse(capturedRequest.options.body);
  assert.equal(capturedPayload.api_key, 'public-project-token');
  assert.equal(capturedPayload.event, 'session_api_start_observed');
  assert.deepEqual(capturedPayload.properties, verifiedObservation.properties);
  assertNoSourceMarkers(capturedPayload);

  // Given: missing configuration, an HTTP 500, and an aborting endpoint.
  // When: capture is attempted.
  // Then: each path resolves a sanitized outcome and never throws into the caller.
  assert.deepEqual(
    await captureSessionStartObservation({ observation: anonymousObservation }),
    { ok: false, status: 'disabled', reason: 'missing_config' }
  );
  assert.deepEqual(
    await captureSessionStartObservation({
      observation: anonymousObservation,
      ...captureOptions,
      fetchImpl: async () => ({ ok: false, status: 500 })
    }),
    { ok: false, status: 'failed', reason: 'http_error' }
  );
  const abortingFetch = async (_url, { signal }) =>
    new Promise((_resolve, reject) => {
      signal.addEventListener('abort', () => {
        const error = new Error('fixture includes sensitive data but must not escape');
        error.name = 'AbortError';
        reject(error);
      });
    });
  assert.deepEqual(
    await captureSessionStartObservation({
      observation: anonymousObservation,
      ...captureOptions,
      timeoutMs: 5,
      fetchImpl: abortingFetch
    }),
    { ok: false, status: 'failed', reason: 'timeout' }
  );

  const coercibleActorKey = {
    toString: () => 'a'.repeat(64),
    toJSON: () => sourceMarkers.body
  };
  for (const observation of [
    { event: 'malicious-event', properties: { body: sourceMarkers.body } },
    {
      ...anonymousObservation,
      properties: { ...anonymousObservation.properties, distinct_id: sourceMarkers.ip }
    },
    {
      ...anonymousObservation,
      properties: { ...anonymousObservation.properties, distinct_id: coercibleActorKey }
    },
    {
      ...verifiedObservation,
      properties: { ...verifiedObservation.properties, account_actor_key: coercibleActorKey }
    }
  ]) {
    let rejectedFetchCalls = 0;
    const rejectedOutcome = await captureSessionStartObservation({
      observation,
      ...captureOptions,
      fetchImpl: async () => {
        rejectedFetchCalls += 1;
        return { ok: true, status: 200 };
      }
    });
    assert.deepEqual(rejectedOutcome, { ok: false, status: 'disabled', reason: 'invalid_event' });
    assert.equal(rejectedFetchCalls, 0);
    assertNoSourceMarkers(rejectedOutcome);
  }

  // Given: scheduler seams for success, missing config, HTTP 500, timeout, and throw.
  // When: delivery is scheduled.
  // Then: outcomes and logs stay sanitized while scheduling remains non-blocking.
  const scheduledDeliveries = [];
  const warningKeys = [];
  const waitUntilImpl = (promise) => scheduledDeliveries.push(promise);
  const logger = { warn: (key) => warningKeys.push(key) };
  const schedule = (options) => scheduleSessionStartObservation({
    observation: anonymousObservation,
    waitUntilImpl,
    logger,
    ...options
  });

  assert.deepEqual(schedule({}), { ok: true, status: 'scheduled' });
  assert.deepEqual(schedule({}), { ok: true, status: 'scheduled' });
  assert.deepEqual(schedule({
    ...captureOptions,
    fetchImpl: async () => ({ ok: true, status: 200 })
  }), { ok: true, status: 'scheduled' });
  assert.deepEqual(schedule({
    ...captureOptions,
    fetchImpl: async () => ({ ok: false, status: 500 })
  }), { ok: true, status: 'scheduled' });
  assert.deepEqual(schedule({
    ...captureOptions,
    timeoutMs: 5,
    fetchImpl: abortingFetch
  }), { ok: true, status: 'scheduled' });

  assert.deepEqual(await Promise.all(scheduledDeliveries), [
    { ok: false, status: 'disabled', reason: 'missing_config' },
    { ok: false, status: 'disabled', reason: 'missing_config' },
    { ok: true, status: 'captured' },
    { ok: false, status: 'failed', reason: 'http_error' },
    { ok: false, status: 'failed', reason: 'timeout' }
  ]);
  assert.deepEqual(warningKeys, [
    'session_start_monitoring_missing_config',
    'session_start_monitoring_http_error',
    'session_start_monitoring_timeout'
  ]);

  assert.deepEqual(scheduleSessionStartObservation({
    observation: anonymousObservation,
    waitUntilImpl: () => {
      throw new Error('fixture scheduler private marker');
    },
    logger
  }), { ok: false, status: 'failed', reason: 'scheduling_error' });
  assert.equal(warningKeys.at(-1), 'session_start_monitoring_scheduling_error');
};
