import { createHash, randomUUID } from 'node:crypto';
import {
  buildFollowupQuestions,
  buildQuestionSession,
  createEmptyNeutralSignals,
  createEmptyScores,
  getFollowupTempoMessage,
  getQuestionContextVisual,
  getQuestionTempoMessage,
  summarizeQuestionContext
} from '../product/questionFlow.js';
import { buildResultViewModel, PRESENTATION_THEMES } from '../product/resultAnalysis.js';
import { getPersonalizedResultContext, getPersonalizedTempoMessage } from '../product/personalization.js';
import { QUESTION_TEMPO_COPY } from '../product/productConstants.js';
import { BADGES, MBTI_RESULTS } from '../product/content.js';
import { sealJson, openJson } from '../security/crypto.js';

const SESSION_AAD = 'today-mbti-session-v1';
const SESSION_TTL_MS = 30 * 60_000;
const OPTION_ID_PREFIX = 'opt';
const MIDDLE_OPTION_ID = 'middle';
const RESULT_AXES = [
  { left: 'E', right: 'I', leftLabel: '외향적', rightLabel: '내향적' },
  { left: 'S', right: 'N', leftLabel: '현실적', rightLabel: '직관적' },
  { left: 'T', right: 'F', leftLabel: '이성적', rightLabel: '감성적' },
  { left: 'J', right: 'P', leftLabel: '계획적', rightLabel: '유연함' }
];

export const getSessionSecret = () =>
  process.env.SESSION_TOKEN_SECRET ||
  process.env.CONTENT_VAULT_KEY ||
  '';

const getNow = () => Date.now();

const normalizeRecentSessions = (value) => Array.isArray(value)
  ? value.slice(0, 12).map((session) => ({
      ids: Array.isArray(session) ? session.slice(0, 24) : (session?.ids || []).slice(0, 24),
      ageGroup: sanitizeAgeGroup(session?.ageGroup),
      savedAt: typeof session?.savedAt === 'string' ? session.savedAt : ''
    }))
  : [];

const sanitizeAgeGroup = (value) =>
  ['child', 'teen', '20s', '30s', '40s', '50s'].includes(value) ? value : '';

const sanitizeGender = (value) =>
  ['male', 'female', 'other'].includes(value) ? value : '';

const sanitizeHistoryData = (value) => Array.isArray(value) ? value.slice(0, 30) : [];

const createCurrentEntry = ({ id, createdAt } = {}) => {
  const now = new Date(createdAt || Date.now());
  return {
    localEntryId: id || now.toISOString(),
    createdAt: now.toISOString(),
    date: now.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' }),
    time: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
  };
};

const createResultIdentity = () => ({
  id: randomUUID(),
  createdAt: new Date().toISOString()
});

const getResultIdentity = (payload = {}) => {
  if (payload.resultIdentity?.id && payload.resultIdentity?.createdAt) {
    return payload.resultIdentity;
  }

  const createdAt = new Date(Number(payload.createdAt) || Date.now()).toISOString();
  const legacySource = JSON.stringify({
    createdAt: payload.createdAt,
    expiresAt: payload.expiresAt,
    questionIds: (payload.baseQuestions || []).map((question) => question.id)
  });
  const id = `legacy-${createHash('sha256').update(legacySource).digest('hex').slice(0, 24)}`;
  return { id, createdAt };
};

const makeOptionId = (questionId, index) => `${OPTION_ID_PREFIX}_${questionId}_${index + 1}`;

const sanitizeQuestion = (question, { ageGroup = '', index = 0, phase = 'base', total = 12, followupHasNeutralReview = false } = {}) => ({
  id: question.id,
  q: question.q,
  allowMiddle: Boolean(question.allowMiddle),
  ui: {
    contextVisual: getQuestionContextVisual(question),
    tempoMessage: phase === 'followup'
      ? getFollowupTempoMessage(index, total)
      : getPersonalizedTempoMessage(
          ageGroup,
          index,
          total,
          getQuestionTempoMessage(index, total, '지금의 결대로 가볍게 골라보세요', QUESTION_TEMPO_COPY)
        ),
    phaseHint: phase === 'followup'
      ? followupHasNeutralReview
        ? '방금 애매했던 부분을 조금 더 또렷하게 볼게요'
        : '경계에 있는 축을 한 번 더 확인하고 있어요'
      : question.allowMiddle
        ? '둘 중 하나가 딱 안 잡히면 보조 버튼으로 넘어갈 수 있어요'
        : '',
    middleMicroCopy: question.allowMiddle ? '이 부분은 서버에서 한 번 더 확인할게요' : ''
  },
  options: (question.options || []).map((option, index) => ({
    id: makeOptionId(question.id, index),
    text: option.text,
    micro: option.micro || ''
  }))
});

const sanitizeQuestionBatch = (questions = [], { ageGroup = '', phase = 'base' } = {}) => {
  const followupHasNeutralReview = phase === 'followup'
    && questions.some((question) => Number(question.trigger?.neutralCount) > 0);
  return questions.map((question, index) => sanitizeQuestion(question, {
    ageGroup,
    index,
    phase,
    total: questions.length,
    followupHasNeutralReview
  }));
};

const buildAnswerKey = (questions = []) => Object.fromEntries(
  questions.map((question) => [
    question.id,
    {
      id: question.id,
      allowMiddle: Boolean(question.allowMiddle),
      axis: question._axis || '',
      weight: Number(question.weight) || 1,
      options: Object.fromEntries((question.options || []).map((option, index) => [
        makeOptionId(question.id, index),
        {
          type: option.type,
          micro: option.micro || ''
        }
      ]))
    }
  ])
);

const createSessionToken = (payload, secret) => sealJson(payload, secret, { aad: SESSION_AAD });

const readSessionToken = (token, secret) => {
  let payload;
  try {
    payload = openJson(token, secret, { aad: SESSION_AAD });
  } catch {
    throw new Error('invalid_token');
  }
  if (!payload || ![1, 2].includes(payload.version)) throw new Error('invalid_session');
  if (!Number.isFinite(payload.expiresAt) || payload.expiresAt < getNow()) throw new Error('expired_session');
  return payload;
};

const validateAnswers = ({ answers, answerKey, expectedQuestionIds }) => {
  if (!Array.isArray(answers)) throw new Error('invalid_answers');
  if (answers.length !== expectedQuestionIds.length) throw new Error('incomplete_answers');

  const seen = new Set();
  return answers.map((answer) => {
    const questionId = String(answer?.questionId || '');
    const optionId = String(answer?.optionId || '');
    if (!questionId || !optionId || seen.has(questionId)) throw new Error('invalid_answers');
    seen.add(questionId);
    if (!expectedQuestionIds.includes(questionId)) throw new Error('unknown_question');
    const key = answerKey[questionId];
    if (!key) throw new Error('unknown_question');
    if (optionId === MIDDLE_OPTION_ID) {
      if (!key.allowMiddle) throw new Error('unknown_option');
      return { questionId, optionId, middle: true, axis: key.axis };
    }
    const option = key.options?.[optionId];
    if (!option?.type) throw new Error('unknown_option');
    return {
      questionId,
      optionId,
      type: option.type,
      weight: key.weight,
      micro: option.micro || ''
    };
  });
};

const applyAnswers = ({ baseScores = createEmptyScores(), baseNeutralSignals = createEmptyNeutralSignals(), answers }) => {
  const scores = { ...baseScores };
  const neutralSignals = { ...baseNeutralSignals };
  const neutralQuestionIds = [];

  answers.forEach((answer) => {
    if (answer.middle) {
      if (answer.axis) neutralSignals[answer.axis] = (neutralSignals[answer.axis] || 0) + 1;
      neutralQuestionIds.push(answer.questionId);
      return;
    }
    scores[answer.type] = (scores[answer.type] || 0) + answer.weight;
  });

  return { scores, neutralSignals, neutralQuestionIds };
};

const computeResult = (scores) => {
  const spectrum = RESULT_AXES.map(({ left, right, leftLabel, rightLabel }) => {
    const leftScore = scores[left] || 0;
    const rightScore = scores[right] || 0;
    const total = leftScore + rightScore || 1;
    const dominantType = leftScore >= rightScore ? left : right;
    const dominantScore = Math.max(leftScore, rightScore);
    const intensity = Math.round((dominantScore / total) * 100);
    const isBoundary = intensity < 62;
    return { left, right, leftLabel, rightLabel, leftScore, rightScore, dominantType, intensity, isBoundary };
  });

  const mbti = spectrum.map((axis) => axis.dominantType).join('');
  const percent = Math.round(spectrum.reduce((sum, axis) => sum + axis.intensity, 0) / 4);
  const badges = spectrum.map((axis) => BADGES[axis.dominantType][axis.intensity >= 75 ? 3 : 2]);
  const info = MBTI_RESULTS[mbti] || {};
  const boundaryAxes = spectrum.filter((axis) => axis.isBoundary);
  return { mbti, percent, badges, info, spectrum, boundaryAxes };
};

const toAxisNarrative = (axis) => ({
  ...axis,
  pair: `${axis.left}/${axis.right}`,
  dominantLabel: axis.dominantType === axis.left ? axis.leftLabel : axis.rightLabel
});

const buildResult = ({ tokenPayload, scores, neutralQuestionIds = [], historyData, userName, defaultUserName }) => {
  const allQuestions = [...(tokenPayload.baseQuestions || []), ...(tokenPayload.followupQuestions || [])];
  const questionContextSummary = summarizeQuestionContext(tokenPayload.baseQuestions || [], tokenPayload.followupQuestions || []);
  const usedFollowup = (tokenPayload.followupQuestions || []).length > 0;
  const { mbti, percent, badges, info, spectrum, boundaryAxes } = computeResult(scores);
  const axisNarratives = spectrum.map(toAxisNarrative);
  const strongestAxis = [...axisNarratives].sort((a, b) => b.intensity - a.intensity)[0];
  const displayName = String(userName || '').trim() || defaultUserName;
  const resultIdentity = getResultIdentity(tokenPayload);
  const currentEntry = createCurrentEntry(resultIdentity);
  const generatedDisplayModel = buildResultViewModel({
      scores,
      historyData,
      currentEntry,
      userName,
      defaultUserName,
      ageGroup: tokenPayload.ageGroup || '',
      neutralCount: neutralQuestionIds.length,
      usedFollowup,
      questionContextSummary
    });
  const displayModel = {
    ...generatedDisplayModel,
    schemaVersion: 2,
    resultId: resultIdentity.id,
    currentEntry,
    spirit: {
      ...generatedDisplayModel.spirit,
      asset: '',
      assetKey: mbti
    },
    personalizedContext: getPersonalizedResultContext(
      tokenPayload.ageGroup || '',
      tokenPayload.gender || '',
      mbti,
      percent
    ),
    presentationThemes: PRESENTATION_THEMES,
    questionContextSummary,
    neutralCount: neutralQuestionIds.length,
    usedFollowup
  };

  return {
    status: 'complete',
    schemaVersion: 2,
    result: {
      resultId: resultIdentity.id,
      mbti,
      info,
      badges,
      percent,
      spectrum,
      boundaryAxes,
      axisNarratives,
      strongestAxis,
      displayName,
      questionContextSummary,
      neutralCount: neutralQuestionIds.length,
      usedFollowup,
      historyCount: historyData.length,
      sessionQuestionIds: allQuestions.map((question) => question.id),
      recentSessionSnapshot: {
        ids: allQuestions.map((question) => question.id),
        ageGroup: tokenPayload.ageGroup || '',
        savedAt: resultIdentity.createdAt
      },
      followupCount: (tokenPayload.followupQuestions || []).length,
      currentEntry,
      displayModel
    }
  };
};

export const createServerSession = ({ recentSessions, ageGroup, gender, secret = getSessionSecret() } = {}) => {
  if (!secret) throw new Error('session_secret_not_configured');
  const safeRecentSessions = normalizeRecentSessions(recentSessions);
  const safeAgeGroup = sanitizeAgeGroup(ageGroup);
  const safeGender = sanitizeGender(gender);
  const baseQuestions = buildQuestionSession(safeRecentSessions, { ageGroup: safeAgeGroup });
  const now = getNow();
  const tokenPayload = {
    version: 2,
    phase: 'base',
    createdAt: now,
    expiresAt: now + SESSION_TTL_MS,
    ageGroup: safeAgeGroup,
    gender: safeGender,
    recentSessions: safeRecentSessions,
    baseQuestions,
    followupQuestions: [],
    answerKey: buildAnswerKey(baseQuestions),
    baseScores: createEmptyScores(),
    baseNeutralSignals: createEmptyNeutralSignals(),
    neutralQuestionIds: [],
    resultIdentity: createResultIdentity()
  };

  return {
    sessionToken: createSessionToken(tokenPayload, secret),
    expiresAt: new Date(tokenPayload.expiresAt).toISOString(),
    questions: sanitizeQuestionBatch(baseQuestions, { ageGroup: safeAgeGroup, phase: 'base' })
  };
};

export const completeServerSession = ({
  sessionToken,
  answers,
  historyData = [],
  userName = '',
  defaultUserName = '익명 탐험가',
  secret = getSessionSecret()
} = {}) => {
  if (!secret) throw new Error('session_secret_not_configured');
  const tokenPayload = readSessionToken(sessionToken, secret);
  const activeQuestions = tokenPayload.phase === 'followup'
    ? tokenPayload.followupQuestions || []
    : tokenPayload.baseQuestions || [];
  const expectedQuestionIds = activeQuestions.map((question) => question.id);
  const validatedAnswers = validateAnswers({
    answers,
    answerKey: tokenPayload.answerKey || {},
    expectedQuestionIds
  });
  const applied = applyAnswers({
    baseScores: tokenPayload.baseScores || createEmptyScores(),
    baseNeutralSignals: tokenPayload.baseNeutralSignals || createEmptyNeutralSignals(),
    answers: validatedAnswers
  });
  const neutralQuestionIds = [
    ...(tokenPayload.neutralQuestionIds || []),
    ...applied.neutralQuestionIds
  ];

  if (tokenPayload.phase === 'base') {
    const baseIds = (tokenPayload.baseQuestions || []).map((question) => question.id);
    const followupQuestions = buildFollowupQuestions(
      applied.scores,
      tokenPayload.recentSessions || [],
      baseIds,
      applied.neutralSignals
    );
    if (followupQuestions.length > 0) {
      const now = getNow();
      const nextPayload = {
        ...tokenPayload,
        phase: 'followup',
        expiresAt: now + SESSION_TTL_MS,
        followupQuestions,
        answerKey: buildAnswerKey(followupQuestions),
        baseScores: applied.scores,
        baseNeutralSignals: applied.neutralSignals,
        neutralQuestionIds
      };
      return {
        status: 'needs_followup',
        sessionToken: createSessionToken(nextPayload, secret),
        expiresAt: new Date(nextPayload.expiresAt).toISOString(),
        questions: sanitizeQuestionBatch(followupQuestions, {
          ageGroup: tokenPayload.ageGroup || '',
          phase: 'followup'
        })
      };
    }
  }

  return buildResult({
    tokenPayload,
    scores: applied.scores,
    neutralQuestionIds,
    historyData: sanitizeHistoryData(historyData),
    userName: String(userName || '').slice(0, 80),
    defaultUserName
  });
};

export const assertSafeSessionQuestions = (questions = []) => {
  const serialized = JSON.stringify(questions);
  const forbidden = ['"type"', '"weight"', '"_axis"', '"familyId"', '"ageFit"', '"role"', '"contextTag"'];
  const leaked = forbidden.find((token) => serialized.includes(token));
  if (leaked) throw new Error(`session_question_leak:${leaked}`);
  return true;
};
