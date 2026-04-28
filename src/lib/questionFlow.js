import { QUESTIONS_DB } from '../../data.js';
import {
  FOLLOWUP_QUESTIONS,
  QUESTIONS_META,
  QUESTIONS_EXTENDED,
  QUESTIONS_META_EXTENDED
} from '../data/questionPools.js';

export const createEmptyScores = () => ({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });
export const createEmptyNeutralSignals = () => ({ EI: 0, SN: 0, TF: 0, JP: 0 });

const DEFAULT_CONTEXT_TAG = 'daily';
const FRESH_CONTEXT_WEIGHT_BOOST = 4;

const CONTEXT_LABELS = {
  today: '오늘 컨디션',
  relationship: '관계 상황',
  daily: '일상 선택',
  situation: '상황 반응',
  calibration: '보정 문항'
};

const CONTEXT_PRIORITY = ['relationship', 'today', 'situation', 'calibration', 'daily'];

const getQuestionContextTag = (question = {}) => {
  if (question.contextTag) return question.contextTag;
  if (question.role === 'followup') return 'calibration';
  if (question.role === 'state') return 'today';
  if (['forced_choice', 'parallel'].includes(question.role)) return 'situation';
  return DEFAULT_CONTEXT_TAG;
};

export const summarizeQuestionContext = (baseQuestions = [], followupQuestions = []) => {
  const allQuestions = [...baseQuestions, ...followupQuestions].filter(Boolean);
  const counts = CONTEXT_PRIORITY.reduce((acc, tag) => ({ ...acc, [tag]: 0 }), {});

  allQuestions.forEach((question) => {
    const tag = getQuestionContextTag(question);
    counts[tag] = (counts[tag] || 0) + 1;
  });

  const topTag = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort(([tagA, countA], [tagB, countB]) => {
      if (countA !== countB) return countB - countA;
      return CONTEXT_PRIORITY.indexOf(tagA) - CONTEXT_PRIORITY.indexOf(tagB);
    })[0]?.[0] || DEFAULT_CONTEXT_TAG;

  return {
    topTag,
    topLabel: CONTEXT_LABELS[topTag] || CONTEXT_LABELS[DEFAULT_CONTEXT_TAG],
    counts,
    usedCalibration: (counts.calibration || 0) > 0,
    total: allQuestions.length
  };
};

export const getQuestionTempoMessage = (index, fallback = '지금의 결대로 가볍게 골라보세요', source = []) =>
  source[index] || fallback;

export const formatMicroCopy = (micro = '') => {
  const trimmed = micro
    .split(/[,.!]/)[0]
    .replace(/\s+/g, ' ')
    .trim();

  if (trimmed.length <= 14) return trimmed;
  return `${trimmed.slice(0, 13)}…`;
};

export const getOpeningPriority = (question) => {
  let score = 0;
  if (question.role === 'discriminator') score += 4;
  if (question.role === 'anchor') score += 3;
  if (question.q.length <= 26) score += 2;
  if (/오늘|친구|약속|톡|주말|카페|여행|단톡|소개팅|지금/.test(question.q)) score += 2;
  if (/뭐해|어디|바로|일단|먼저|주말|휴일|친구|약속|여행|카페|전화|문자/.test(question.q)) score += 3;
  return score;
};

const shuffle = (items) => [...items].sort(() => Math.random() - 0.5);

const pickRandomSubset = (items, count) => shuffle(items).slice(0, count);

const getSelectionWeight = (question) => {
  const roleBoost = question.role === 'state' || question.role === 'parallel' ? 1.18 : 1;
  const middleBoost = question.allowMiddleCandidate ? 1.25 : 1;
  const freshnessBoost = question.contextTag ? FRESH_CONTEXT_WEIGHT_BOOST : 1;
  return (question.weight || 1) * roleBoost * middleBoost * freshnessBoost;
};

const pickWeightedQuestion = (pool, { recentIds, usedIds, usedFamilyIds }) => {
  const usable = pool.filter((question) =>
    !usedIds.has(question.id) &&
    !usedFamilyIds.has(question.familyId)
  );
  if (!usable.length) return null;

  const fresh = usable.filter((question) => !recentIds.has(question.id));
  const candidates = fresh.length > 0 ? fresh : usable;
  const totalWeight = candidates.reduce((sum, question) => sum + getSelectionWeight(question), 0);
  let cursor = Math.random() * totalWeight;

  for (const question of candidates) {
    cursor -= getSelectionWeight(question);
    if (cursor <= 0) return question;
  }

  return candidates[0];
};

const addPickedQuestion = (question, selected, usedIds, usedFamilyIds) => {
  if (!question) return false;
  selected.push(question);
  usedIds.add(question.id);
  usedFamilyIds.add(question.familyId);
  return true;
};

const AXIS_CONFIG = [
  { code: 'EI', left: 'E', right: 'I' },
  { code: 'SN', left: 'S', right: 'N' },
  { code: 'TF', left: 'T', right: 'F' },
  { code: 'JP', left: 'J', right: 'P' }
];

const getAxisConfidence = (scores) =>
  AXIS_CONFIG.map(({ code, left, right }) => {
    const leftScore = scores[left] || 0;
    const rightScore = scores[right] || 0;
    const total = leftScore + rightScore || 1;
    const dominantType = leftScore >= rightScore ? left : right;
    const dominantScore = Math.max(leftScore, rightScore);
    const intensity = Math.round((dominantScore / total) * 100);
    const diff = Math.abs(leftScore - rightScore);
    return {
      code,
      left,
      right,
      leftScore,
      rightScore,
      total,
      dominantType,
      intensity,
      diff
    };
  });

export const getFollowupAxes = (scores, neutralSignals = {}, maxAxes = 3) =>
  getAxisConfidence(scores)
    .map((axis) => ({
      ...axis,
      neutralCount: neutralSignals?.[axis.code] || 0
    }))
    .filter((axis) => axis.neutralCount > 0 || axis.intensity < 60 || axis.diff <= 1)
    .sort((a, b) => {
      if (a.neutralCount !== b.neutralCount) return b.neutralCount - a.neutralCount;
      if (a.intensity !== b.intensity) return a.intensity - b.intensity;
      return a.diff - b.diff;
    })
    .slice(0, maxAxes);

const pickFollowupQuestion = (axisCode, recentIds, usedIds) => {
  const pool = FOLLOWUP_QUESTIONS[axisCode] || [];
  const fresh = pool.filter((item) => !recentIds.has(item.id) && !usedIds.has(item.id));
  const reusable = pool.filter((item) => !usedIds.has(item.id));
  const candidates = fresh.length > 0 ? fresh : reusable.length > 0 ? reusable : pool;
  if (!candidates.length) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
};

export const buildFollowupQuestions = (scores, recentSessions = [], currentIds = [], neutralSignals = {}) => {
  const recentIds = new Set(recentSessions.flat());
  const usedIds = new Set(currentIds);

  return getFollowupAxes(scores, neutralSignals).map((axis) => {
    const question = pickFollowupQuestion(axis.code, recentIds, usedIds);
    if (question) usedIds.add(question.id);
    return question
      ? {
          ...question,
          _axis: axis.code,
          trigger: {
            intensity: axis.intensity,
            diff: axis.diff,
            dominantType: axis.dominantType,
            neutralCount: axis.neutralCount
          }
        }
      : null;
  }).filter(Boolean);
};

export const sortQuestionsForTempo = (selected, recentIds = new Set()) => {
  const introCandidates = selected.filter((item) => getOpeningPriority(item) >= 7);
  const introFresh = introCandidates.filter((item) => !recentIds.has(item.id));
  const introPool = introFresh.length >= 3 ? introFresh : introCandidates;
  const opening = pickRandomSubset(introPool, Math.min(3, introPool.length));
  const openingIds = new Set(opening.map((item) => item.id));
  const remaining = shuffle(selected.filter((item) => !openingIds.has(item.id)));

  if (opening.length < 3) {
    const supplement = remaining.slice(0, 3 - opening.length);
    const supplementIds = new Set(supplement.map((item) => item.id));
    return [
      ...opening,
      ...supplement,
      ...remaining.filter((item) => !supplementIds.has(item.id))
    ];
  }

  return [...opening, ...remaining];
};

export const buildQuestionSession = (recentSessions = []) => {
  const recentIds = new Set(recentSessions.flat());
  const axisKeys = ['EI', 'SN', 'TF', 'JP'];
  const selected = [];
  const usedFamilyIds = new Set();
  const usedIds = new Set();

  axisKeys.forEach((axis) => {
    const basePool = QUESTIONS_DB[axis] || [];
    const extPool = QUESTIONS_EXTENDED?.[axis] || [];
    const baseMeta = QUESTIONS_META[axis] || [];
    const extMeta = QUESTIONS_META_EXTENDED?.[axis] || [];

    const pool = [...basePool, ...extPool];
    const meta = [...baseMeta, ...extMeta];

    const enriched = pool.map((q, i) => ({
      ...q,
      id: meta[i]?.id || `${axis}_${i + 1}`,
      familyId: meta[i]?.familyId || `${axis}_${i + 1}`,
      role: meta[i]?.role,
      weight: meta[i]?.weight || 1,
      contextTag: meta[i]?.contextTag || q.contextTag,
      allowMiddleCandidate: meta[i]?.allowMiddleCandidate || false,
      _axis: axis
    }));

    const rolePools = [
      enriched.filter((question) => question.role === 'anchor'),
      enriched.filter((question) => ['discriminator', 'forced_choice'].includes(question.role)),
      enriched.filter((question) => ['state', 'parallel'].includes(question.role))
    ];

    rolePools.forEach((rolePool) => {
      const question = pickWeightedQuestion(rolePool.length ? rolePool : enriched, {
        recentIds,
        usedIds,
        usedFamilyIds
      });
      addPickedQuestion(question, selected, usedIds, usedFamilyIds);
    });

    while (selected.filter((question) => question._axis === axis).length < 3) {
      const fallback = pickWeightedQuestion(enriched, { recentIds, usedIds, usedFamilyIds });
      if (!addPickedQuestion(fallback, selected, usedIds, usedFamilyIds)) break;
    }
  });

  const ordered = sortQuestionsForTempo(selected, recentIds);
  let totalMiddleSlots = 0;
  let openingMiddleSlots = 0;

  return ordered.map((question, idx) => {
    const canAllowMiddle =
      question.allowMiddleCandidate &&
      totalMiddleSlots < 2 &&
      (idx >= 3 || openingMiddleSlots < 1);

    if (canAllowMiddle) {
      totalMiddleSlots += 1;
      if (idx < 3) openingMiddleSlots += 1;
    }

    return {
      ...question,
      allowMiddle: canAllowMiddle
    };
  });
};

export const getFollowupTempoMessage = (index, total) => {
  if (total <= 1) return '결과 정확도를 위해 한 문항만 더 볼게요';
  if (index === 0) return '결과 정확도를 위해 몇 문항만 더 볼게요';
  if (index === total - 1) return '마지막 보정 질문이에요. 결과가 더 또렷해져요';
  return '조금만 더 보면 결과가 더 또렷해져요';
};
