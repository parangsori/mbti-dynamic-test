import assert from 'node:assert/strict';
import {
  assertSafeSessionQuestions,
  completeServerSession,
  createServerSession
} from '../server/session/engine.js';
import { openJson, sealJson } from '../server/security/crypto.js';
import { validateServerDisplayModel } from '../src/lib/serverDisplayModel.js';
import { buildResultViewModel } from '../server/product/resultAnalysis.js';
import { assertStartHandlerHardening } from './checkServerSessionStartHandler.mjs';

const secret = 'local-server-session-test-key';
const sessionAad = 'today-mbti-session-v1';
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

let finalCompletionInput = {
  sessionToken: start.sessionToken,
  answers: firstAnswers,
  historyData,
  userName: '테스트',
  defaultUserName: '익명 탐험가',
  secret
};
let response = completeServerSession(finalCompletionInput);

if (response.status === 'needs_followup') {
  assert.ok(response.sessionToken);
  assert.ok(response.questions.length > 0);
  assertSafeSessionQuestions(response.questions);
  finalCompletionInput = {
    sessionToken: response.sessionToken,
    answers: response.questions.map((question) => ({
      questionId: question.id,
      optionId: question.options[0].id
    })),
    historyData,
    userName: '테스트',
    defaultUserName: '익명 탐험가',
    secret
  };
  response = completeServerSession(finalCompletionInput);
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
assert.equal(response.result.displayModel?.schemaVersion, 2);
assert.equal(response.result.displayModel?.resultId, response.result.resultId);
assert.deepEqual(response.result.displayModel?.currentEntry, response.result.currentEntry);
assert.ok(response.result.displayModel?.personalizedContext?.intro);
assert.ok(response.result.displayModel?.presentationThemes?.length >= 1);
assert.equal(validateServerDisplayModel(response.result.displayModel), response.result.displayModel);
const serializedDisplayModel = JSON.stringify(response.result.displayModel);
for (const forbiddenField of ['"weight"', '"_axis"', '"familyId"', '"ageFit"', '"allowMiddleCandidate"']) {
  assert.equal(serializedDisplayModel.includes(forbiddenField), false, `display model must not expose ${forbiddenField}`);
}

for (const requiredField of ['spirit', 'presentation', 'shareCardCopy', 'currentEntry']) {
  const invalidModel = { ...response.result.displayModel };
  delete invalidModel[requiredField];
  assert.throws(() => validateServerDisplayModel(invalidModel), /invalid_server_display_model/);
}
assert.throws(
  () => validateServerDisplayModel({ ...response.result.displayModel, schemaVersion: 999 }),
  /unsupported_server_display_model/
);

await new Promise((resolve) => setTimeout(resolve, 5));
const repeatedResponse = completeServerSession(finalCompletionInput);
assert.equal(repeatedResponse.status, 'complete');
assert.ok(response.result.resultId, 'completed results must include a stable result id');
assert.equal(repeatedResponse.result.resultId, response.result.resultId);
assert.deepEqual(repeatedResponse.result.currentEntry, response.result.currentEntry);
assert.equal(response.result.currentEntry.localEntryId, response.result.resultId);
assert.equal(
  repeatedResponse.result.displayModel.presentation.themeKey,
  response.result.displayModel.presentation.themeKey
);

const legacyPayload = openJson(start.sessionToken, secret, { aad: sessionAad });
legacyPayload.version = 1;
delete legacyPayload.resultIdentity;
const legacyInput = {
  ...finalCompletionInput,
  sessionToken: sealJson(legacyPayload, secret, { aad: sessionAad }),
  answers: firstAnswers
};
let legacyResponse = completeServerSession(legacyInput);
if (legacyResponse.status === 'needs_followup') {
  legacyInput.sessionToken = legacyResponse.sessionToken;
  legacyInput.answers = legacyResponse.questions.map((question) => ({
    questionId: question.id,
    optionId: question.options[0].id
  }));
  legacyResponse = completeServerSession(legacyInput);
}
const repeatedLegacyResponse = completeServerSession(legacyInput);
assert.match(legacyResponse.result.resultId, /^legacy-[a-f0-9]{24}$/);
assert.equal(repeatedLegacyResponse.result.resultId, legacyResponse.result.resultId);
assert.deepEqual(repeatedLegacyResponse.result.currentEntry, legacyResponse.result.currentEntry);

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

await assertStartHandlerHardening({ secret });

console.log('Server session API checks passed.');
