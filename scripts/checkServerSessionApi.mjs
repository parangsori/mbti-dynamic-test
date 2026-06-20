import assert from 'node:assert/strict';
import {
  assertSafeSessionQuestions,
  completeServerSession,
  createServerSession
} from '../server/session/engine.js';

const secret = 'local-server-session-test-key';
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
    userName: '테스트',
    defaultUserName: '익명 탐험가',
    secret
  });
}

assert.equal(response.status, 'complete');
assert.match(response.result.mbti, /^[EISNTFJP]{4}$/);
assert.ok(response.result.percent >= 0 && response.result.percent <= 100);
assert.ok(response.result.questionContextSummary);

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

console.log('Server session API checks passed.');
