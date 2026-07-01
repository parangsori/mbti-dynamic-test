import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import startSessionHandler, { createStartSessionHandler } from '../api/session/start.js';
import { assertSafeSessionQuestions } from '../server/session/engine.js';

const invokeStartHandler = async ({
  secret,
  method = 'POST',
  body = '',
  headers = {},
  handler = startSessionHandler,
  onResponseEnd = () => {}
}) => {
  process.env.SESSION_TOKEN_SECRET = secret;
  const req = Readable.from(body ? [Buffer.from(body)] : []);
  req.method = method;
  req.headers = headers;
  const chunks = [];
  const res = {
    statusCode: 0,
    headers: {},
    setHeader(name, value) {
      this.headers[name.toLowerCase()] = value;
    },
    end(value) {
      chunks.push(String(value || ''));
      onResponseEnd();
    }
  };
  await handler(req, res);
  return {
    status: res.statusCode,
    headers: res.headers,
    body: JSON.parse(chunks.join('') || '{}')
  };
};

export const assertStartHandlerHardening = async ({ secret }) => {
  const observations = [];
  let responseEnded = false;
  const handler = createStartSessionHandler({
    observeSessionStart: (input) => {
      assert.equal(responseEnded, true, 'observation must be scheduled after the response ends');
      observations.push(input);
    }
  });
  let response = await invokeStartHandler({
    secret,
    body: JSON.stringify({ recentSessions: [], ageGroup: '30s', gender: 'female' }),
    headers: {
      'x-forwarded-for': '203.0.113.5',
      'user-agent': 'fixture-browser private-marker'
    },
    handler,
    onResponseEnd: () => {
      responseEnded = true;
    }
  });
  assert.equal(response.status, 200);
  assert.equal(response.body.questions.length, 12);
  assert.ok(response.body.sessionToken);
  assert.equal(response.headers['cache-control'], 'private, no-store');
  assertSafeSessionQuestions(response.body.questions);
  assert.ok(response.body.questions.every((question) => question.ui?.tempoMessage));
  assert.ok(response.body.questions.every((question) => question.ui?.contextVisual?.key));
  assert.equal(JSON.stringify(response.body).includes('monitoring'), false);
  assert.equal(observations.length, 1);
  assert.equal(observations[0].recentSessions.length, 0);
  assert.equal(observations[0].ageGroup, '30s');

  const invalidRequests = [
    { method: 'GET', expectedStatus: 405, expectedError: 'method_not_allowed' },
    { body: '{', expectedStatus: 400, expectedError: 'invalid_json' },
    { body: '[]', expectedStatus: 400, expectedError: 'invalid_request_body' },
    {
      body: JSON.stringify({ recentSessions: 'not-an-array' }),
      expectedStatus: 400,
      expectedError: 'invalid_recent_sessions'
    },
    {
      body: JSON.stringify({ recentSessions: [null] }),
      expectedStatus: 400,
      expectedError: 'invalid_recent_sessions'
    },
    {
      body: JSON.stringify({ ageGroup: '999s' }),
      expectedStatus: 400,
      expectedError: 'invalid_age_group'
    },
    {
      body: JSON.stringify({ gender: 'invalid' }),
      expectedStatus: 400,
      expectedError: 'invalid_gender'
    },
    {
      body: '{}',
      headers: { 'content-length': String(20 * 1024) },
      expectedStatus: 400,
      expectedError: 'request_too_large'
    },
    {
      body: 'x'.repeat(20 * 1024),
      expectedStatus: 400,
      expectedError: 'request_too_large'
    }
  ];
  for (const fixture of invalidRequests) {
    response = await invokeStartHandler({ secret, handler, ...fixture });
    assert.equal(response.status, fixture.expectedStatus);
    assert.equal(response.body.error, fixture.expectedError);
  }
  assert.equal(observations.length, 1, 'invalid requests must not schedule observations');

  const creationFailureHandler = createStartSessionHandler({
    createSession: () => {
      throw new Error('fixture_creation_failure');
    },
    observeSessionStart: (input) => observations.push(input)
  });
  response = await invokeStartHandler({ secret, body: '{}', handler: creationFailureHandler });
  assert.equal(response.status, 500);
  assert.equal(response.body.error, 'session_start_failed');
  assert.equal(observations.length, 1, 'session creation failures must not schedule observations');

  const warnings = [];
  const schedulingFailureHandler = createStartSessionHandler({
    observeSessionStart: () => {
      throw new Error('fixture_scheduler_failure');
    },
    logger: { warn: (key) => warnings.push(key) }
  });
  response = await invokeStartHandler({ secret, body: '{}', handler: schedulingFailureHandler });
  assert.equal(response.status, 200);
  assert.ok(response.body.sessionToken);
  assert.deepEqual(warnings, ['session_start_monitoring_scheduling_error']);
};
