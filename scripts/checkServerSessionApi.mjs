import assert from 'node:assert/strict';
import { Readable } from 'node:stream';
import startSessionHandler from '../api/session/start.js';
import {
  assertSafeSessionQuestions,
  completeServerSession,
  createServerSession
} from '../server/session/engine.js';
import { buildResultViewModel } from '../src/lib/resultAnalysis.js';

const secret = 'local-server-session-test-key';
const invokeStartHandler = async ({ method = 'POST', body = '', headers = {} } = {}) => {
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
    }
  };

  await startSessionHandler(req, res);

  return {
    status: res.statusCode,
    headers: res.headers,
    body: JSON.parse(chunks.join('') || '{}')
  };
};

const assertStartHandlerHardening = async () => {
  let handlerResponse = await invokeStartHandler({
    body: JSON.stringify({ recentSessions: [], ageGroup: '30s' })
  });
  assert.equal(handlerResponse.status, 200);
  assert.equal(handlerResponse.body.questions.length, 12);
  assert.ok(handlerResponse.body.sessionToken);
  assert.equal(handlerResponse.headers['cache-control'], 'private, no-store');
  assertSafeSessionQuestions(handlerResponse.body.questions);

  handlerResponse = await invokeStartHandler({ method: 'GET' });
  assert.equal(handlerResponse.status, 405);
  assert.equal(handlerResponse.body.error, 'method_not_allowed');

  handlerResponse = await invokeStartHandler({ body: '{' });
  assert.equal(handlerResponse.status, 400);
  assert.equal(handlerResponse.body.error, 'invalid_json');

  handlerResponse = await invokeStartHandler({ body: '[]' });
  assert.equal(handlerResponse.status, 400);
  assert.equal(handlerResponse.body.error, 'invalid_request_body');

  handlerResponse = await invokeStartHandler({
    body: JSON.stringify({ recentSessions: 'not-an-array' })
  });
  assert.equal(handlerResponse.status, 400);
  assert.equal(handlerResponse.body.error, 'invalid_recent_sessions');

  handlerResponse = await invokeStartHandler({
    body: JSON.stringify({ recentSessions: [null] })
  });
  assert.equal(handlerResponse.status, 400);
  assert.equal(handlerResponse.body.error, 'invalid_recent_sessions');

  handlerResponse = await invokeStartHandler({
    body: JSON.stringify({ ageGroup: '999s' })
  });
  assert.equal(handlerResponse.status, 400);
  assert.equal(handlerResponse.body.error, 'invalid_age_group');

  handlerResponse = await invokeStartHandler({
    body: '{}',
    headers: { 'content-length': String(20 * 1024) }
  });
  assert.equal(handlerResponse.status, 400);
  assert.equal(handlerResponse.body.error, 'request_too_large');

  handlerResponse = await invokeStartHandler({
    body: 'x'.repeat(20 * 1024)
  });
  assert.equal(handlerResponse.status, 400);
  assert.equal(handlerResponse.body.error, 'request_too_large');
};

const historyData = [
  {
    createdAt: '2026-06-20T12:00:00.000Z',
    date: '6월 20일 토',
    time: '21:00',
    mbti: 'ISFJ',
    percent: 74,
    axes: [
      { left: 'E', right: 'I', dominantType: 'I', intensity: 70, leftScore: 2, rightScore: 5 },
      { left: 'S', right: 'N', dominantType: 'S', intensity: 75, leftScore: 6, rightScore: 2 },
      { left: 'T', right: 'F', dominantType: 'F', intensity: 72, leftScore: 2, rightScore: 5 },
      { left: 'J', right: 'P', dominantType: 'J', intensity: 78, leftScore: 7, rightScore: 2 }
    ]
  }
];
const start = createServerSession({ ageGroup: '30s', recentSessions: [], secret });

assert.ok(start.sessionToken);
assert.equal(start.questions.length, 12);
assertSafeSessionQuestions(start.questions);

const firstAnswers = start.questions.map((question) => ({
  questionId: question.id,
  optionId: question.options[0].id
}));

let response = completeServerSession({
  sessionToken: start.sessionToken,
  answers: firstAnswers,
  historyData,
  userName: '테스트',
  defaultUserName: '익명 탐험가',
  secret
});

if (response.status === 'needs_followup') {
  assert.ok(response.sessionToken);
  assert.ok(response.questions.length > 0);
  assertSafeSessionQuestions(response.questions);
  response = completeServerSession({
    sessionToken: response.sessionToken,
    answers: response.questions.map((question) => ({
      questionId: question.id,
      optionId: question.options[0].id
    })),
    historyData,
    userName: '테스트',
    defaultUserName: '익명 탐험가',
    secret
  });
}

assert.equal(response.status, 'complete');
assert.match(response.result.mbti, /^[EISNTFJP]{4}$/);
assert.ok(response.result.percent >= 0 && response.result.percent <= 100);
assert.ok(response.result.questionContextSummary);
assert.ok(response.result.currentEntry?.createdAt);
assert.equal(response.result.displayModel?.mbti, response.result.mbti);
assert.equal(response.result.displayModel?.percent, response.result.percent);
assert.equal(response.result.displayModel?.questionContextSummary?.topTag, response.result.questionContextSummary.topTag);
assert.ok(response.result.displayModel?.presentation?.themeKey);

const scoresFromSpectrum = Object.fromEntries(
  response.result.spectrum.flatMap((axis) => [
    [axis.left, axis.leftScore],
    [axis.right, axis.rightScore]
  ])
);
const rebuiltDisplayModel = buildResultViewModel({
  scores: scoresFromSpectrum,
  historyData,
  currentEntry: response.result.currentEntry,
  userName: '테스트',
  defaultUserName: '익명 탐험가',
  ageGroup: '30s',
  neutralCount: response.result.neutralCount,
  usedFollowup: response.result.usedFollowup,
  questionContextSummary: response.result.questionContextSummary
});

assert.equal(response.result.displayModel.historyComparison?.title, rebuiltDisplayModel.historyComparison?.title);
assert.equal(response.result.displayModel.presentation.themeKey, rebuiltDisplayModel.presentation.themeKey);
assert.deepEqual(response.result.displayModel.shareCardCopy, rebuiltDisplayModel.shareCardCopy);

assert.throws(() => completeServerSession({
  sessionToken: `${start.sessionToken.slice(0, -2)}xx`,
  answers: firstAnswers,
  secret
}), /invalid_token|Unsupported state|unable to authenticate/i);

assert.throws(() => completeServerSession({
  sessionToken: start.sessionToken,
  answers: [firstAnswers[0], firstAnswers[0], ...firstAnswers.slice(2)],
  secret
}), /invalid_answers|incomplete_answers/);

assert.throws(() => completeServerSession({
  sessionToken: start.sessionToken,
  answers: firstAnswers.map((answer, index) => index === 0 ? { ...answer, optionId: 'missing' } : answer),
  secret
}), /unknown_option/);

await assertStartHandlerHardening();

console.log('Server session API checks passed.');
