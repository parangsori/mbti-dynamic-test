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
const DEFAULT_LIFE_TAG = 'daily_choice';
const FRESH_CONTEXT_WEIGHT_BOOST = 4;
const AGE_FIT_WEIGHT_BOOST = 2.15;
const FRESH_LIFE_TAG_WEIGHT_BOOST = 1.22;
const MAX_LIFE_TAG_PER_SESSION = 3;
const AGE_FIT_MIN_PER_AXIS = 1;

const AGE_MISMATCH_PATTERNS = {
  child: /퇴근|직장|동료|회사|신규 사업|소개팅|데이트|상사|회의/,
  teen: /퇴근|직장|동료|회사|신규 사업|소개팅|데이트|상사|회식|술 한잔|펍/
};

const CONTEXT_LABELS = {
  today: '오늘 컨디션',
  relationship: '관계 상황',
  daily: '일상 선택',
  situation: '상황 반응',
  calibration: '보정 문항'
};

const CONTEXT_PRIORITY = ['relationship', 'today', 'situation', 'calibration', 'daily'];

export const LIFE_TAG_LABELS = {
  work_study: '일/학습 리듬',
  relationship: '관계 온도',
  rest_recovery: '회복 루틴',
  self_growth: '성장 감각',
  daily_choice: '일상 선택',
  unexpected: '예상 밖 상황',
  emotion_check: '감정 점검'
};

const LIFE_TAG_PRIORITY = [
  'relationship',
  'rest_recovery',
  'work_study',
  'emotion_check',
  'unexpected',
  'self_growth',
  'daily_choice'
];

export const getQuestionContextTag = (question = {}) => {
  if (question.contextTag) return question.contextTag;
  if (question.role === 'followup') return 'calibration';
  if (question.role === 'state') return 'today';
  if (['forced_choice', 'parallel'].includes(question.role)) return 'situation';
  return DEFAULT_CONTEXT_TAG;
};

export const getQuestionContextVisual = (question = {}) => {
  const key = getQuestionContextTag(question);
  const label = CONTEXT_LABELS[key] || CONTEXT_LABELS[DEFAULT_CONTEXT_TAG];
  return {
    key: CONTEXT_LABELS[key] ? key : DEFAULT_CONTEXT_TAG,
    label,
    alt: `${label} 질문 분위기`
  };
};

export const getQuestionLifeTag = (question = {}) => {
  if (question.lifeTag && LIFE_TAG_LABELS[question.lifeTag]) return question.lifeTag;
  const contextTag = getQuestionContextTag(question);
  if (contextTag === 'relationship') return 'relationship';
  if (contextTag === 'today') return 'emotion_check';
  if (contextTag === 'situation') return 'unexpected';
  if (question.role === 'state') return 'emotion_check';
  if (question.role === 'parallel') return 'self_growth';
  return DEFAULT_LIFE_TAG;
};

const getQuestionTextBundle = (question = {}) => [
  question.q,
  ...(question.options || []).flatMap((option) => [option.text, option.micro])
].filter(Boolean).join(' ');

const isAgeFit = (question = {}, ageGroup = '') =>
  Boolean(ageGroup && Array.isArray(question.ageFit) && question.ageFit.includes(ageGroup));

const isQuestionAgeCompatible = (question = {}, ageGroup = '') => {
  if (!ageGroup) return true;
  if (isAgeFit(question, ageGroup)) return true;
  const mismatchPattern = AGE_MISMATCH_PATTERNS[ageGroup];
  if (!mismatchPattern) return true;
  return !mismatchPattern.test(getQuestionTextBundle(question));
};

const getRecentSessionIds = (session) => {
  if (Array.isArray(session)) return session;
  if (session?.ids && Array.isArray(session.ids)) return session.ids;
  return [];
};

const getRecentSessionLifeTags = (session) => {
  if (session?.lifeTags && Array.isArray(session.lifeTags)) return session.lifeTags;
  return [];
};

export const createRecentSessionSnapshot = ({ questions = [], ids = [], ageGroup = '' } = {}) => {
  const idSet = new Set(ids);
  const selectedQuestions = questions.filter((question) => !idSet.size || idSet.has(question.id));

  return {
    ids: ids.length ? ids : selectedQuestions.map((question) => question.id),
    lifeTags: selectedQuestions.map(getQuestionLifeTag).filter(Boolean),
    ageGroup,
    savedAt: new Date().toISOString()
  };
};

export const summarizeQuestionContext = (baseQuestions = [], followupQuestions = []) => {
  const allQuestions = [...baseQuestions, ...followupQuestions].filter(Boolean);
  const counts = CONTEXT_PRIORITY.reduce((acc, tag) => ({ ...acc, [tag]: 0 }), {});
  const lifeCounts = LIFE_TAG_PRIORITY.reduce((acc, tag) => ({ ...acc, [tag]: 0 }), {});

  allQuestions.forEach((question) => {
    const tag = getQuestionContextTag(question);
    counts[tag] = (counts[tag] || 0) + 1;
    const lifeTag = getQuestionLifeTag(question);
    lifeCounts[lifeTag] = (lifeCounts[lifeTag] || 0) + 1;
  });

  const topTag = Object.entries(counts)
    .filter(([, count]) => count > 0)
    .sort(([tagA, countA], [tagB, countB]) => {
      if (countA !== countB) return countB - countA;
      return CONTEXT_PRIORITY.indexOf(tagA) - CONTEXT_PRIORITY.indexOf(tagB);
    })[0]?.[0] || DEFAULT_CONTEXT_TAG;
  const topLifeTag = Object.entries(lifeCounts)
    .filter(([, count]) => count > 0)
    .sort(([tagA, countA], [tagB, countB]) => {
      if (countA !== countB) return countB - countA;
      return LIFE_TAG_PRIORITY.indexOf(tagA) - LIFE_TAG_PRIORITY.indexOf(tagB);
    })[0]?.[0] || DEFAULT_LIFE_TAG;

  return {
    topTag,
    topLabel: CONTEXT_LABELS[topTag] || CONTEXT_LABELS[DEFAULT_CONTEXT_TAG],
    topLifeTag,
    topLifeLabel: LIFE_TAG_LABELS[topLifeTag] || LIFE_TAG_LABELS[DEFAULT_LIFE_TAG],
    counts,
    lifeCounts,
    usedCalibration: (counts.calibration || 0) > 0,
    total: allQuestions.length
  };
};

export const getQuestionTempoMessage = (index, total = 12, fallback = '지금의 결대로 가볍게 골라보세요', source = []) => {
  if (!source.length) return fallback;

  const safeTotal = Math.max(1, Number(total) || 1);
  const current = Math.min(Math.max(1, index + 1), safeTotal);
  const progress = current / safeTotal;
  const lastIndex = source.length - 1;
  const lastNonFinalIndex = Math.max(0, lastIndex - 2);
  const finalMessageIndex = source.findLastIndex((message) => /마지막 선택|마지막 질문/.test(message));
  const safeFinalIndex = finalMessageIndex >= 0 ? finalMessageIndex : lastIndex;

  if (current >= safeTotal) return source[safeFinalIndex] || fallback;
  if (current === safeTotal - 1) {
    const penultimateIndex = safeFinalIndex === lastIndex ? Math.max(0, lastIndex - 1) : lastIndex;
    return source[penultimateIndex] || fallback;
  }

  if (progress < 0.3) {
    return source[Math.min(index, 2)] || fallback;
  }

  if (progress < 0.5) {
    return source[Math.min(3, lastIndex)] || fallback;
  }

  if (progress < 0.75) {
    return source[Math.min(Math.max(4, Math.floor(source.length * 0.55)), lastNonFinalIndex)] || fallback;
  }

  return source[Math.min(Math.max(5, Math.floor(source.length * 0.72)), lastNonFinalIndex)] || fallback;
};

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

const getSelectionWeight = (question, { ageGroup = '', recentLifeTags = new Set() } = {}) => {
  const roleBoost = question.role === 'state' || question.role === 'parallel' ? 1.18 : 1;
  const middleBoost = question.allowMiddleCandidate ? 1.25 : 1;
  const freshnessBoost = question.contextTag ? FRESH_CONTEXT_WEIGHT_BOOST : 1;
  const lifeTag = getQuestionLifeTag(question);
  const lifeBoost = recentLifeTags.has(lifeTag) ? 1 : FRESH_LIFE_TAG_WEIGHT_BOOST;
  const ageBoost = ageGroup && question.ageFit?.includes(ageGroup) ? AGE_FIT_WEIGHT_BOOST : 1;
  return (question.weight || 1) * roleBoost * middleBoost * freshnessBoost * lifeBoost * ageBoost;
};

const pickWeightedQuestion = (pool, { recentIds, recentLifeTags, usedIds, usedFamilyIds, usedLifeTagCounts, ageGroup }) => {
  const usableBase = pool.filter((question) =>
    !usedIds.has(question.id) &&
    !usedFamilyIds.has(question.familyId) &&
    isQuestionAgeCompatible(question, ageGroup)
  );
  const usable = usableBase.filter((question) => {
    const lifeTag = getQuestionLifeTag(question);
    return (usedLifeTagCounts[lifeTag] || 0) < MAX_LIFE_TAG_PER_SESSION;
  });
  const fallbackUsable = usable.length ? usable : usableBase;
  if (!fallbackUsable.length) return null;

  const fresh = fallbackUsable.filter((question) => !recentIds.has(question.id));
  const freshLife = fresh.filter((question) => !recentLifeTags.has(getQuestionLifeTag(question)));
  const candidates = freshLife.length > 0 ? freshLife : fresh.length > 0 ? fresh : fallbackUsable;
  const totalWeight = candidates.reduce((sum, question) => sum + getSelectionWeight(question, { ageGroup, recentLifeTags }), 0);
  let cursor = Math.random() * totalWeight;

  for (const question of candidates) {
    cursor -= getSelectionWeight(question, { ageGroup, recentLifeTags });
    if (cursor <= 0) return question;
  }

  return candidates[0];
};

const addPickedQuestion = (question, selected, usedIds, usedFamilyIds, usedLifeTagCounts) => {
  if (!question) return false;
  selected.push(question);
  usedIds.add(question.id);
  usedFamilyIds.add(question.familyId);
  const lifeTag = getQuestionLifeTag(question);
  usedLifeTagCounts[lifeTag] = (usedLifeTagCounts[lifeTag] || 0) + 1;
  return true;
};

const removePickedQuestion = (question, selected, usedIds, usedFamilyIds, usedLifeTagCounts) => {
  const index = selected.findIndex((item) => item.id === question.id);
  if (index < 0) return false;
  selected.splice(index, 1);
  usedIds.delete(question.id);
  usedFamilyIds.delete(question.familyId);
  const lifeTag = getQuestionLifeTag(question);
  usedLifeTagCounts[lifeTag] = Math.max((usedLifeTagCounts[lifeTag] || 1) - 1, 0);
  return true;
};

const ensureAgeFitForAxis = ({ axis, enriched, selected, usedIds, usedFamilyIds, usedLifeTagCounts, recentIds, recentLifeTags, ageGroup }) => {
  if (!ageGroup) return;
  const axisSelected = selected.filter((question) => question._axis === axis);
  const ageFitCount = axisSelected.filter((question) => isAgeFit(question, ageGroup)).length;
  if (ageFitCount >= AGE_FIT_MIN_PER_AXIS) return;

  const ageFitPool = enriched.filter((question) => isAgeFit(question, ageGroup));
  const replacement = pickWeightedQuestion(ageFitPool, {
    recentIds,
    recentLifeTags,
    usedIds,
    usedFamilyIds,
    usedLifeTagCounts,
    ageGroup
  });
  if (!replacement) return;

  const replaceTarget = [...axisSelected]
    .filter((question) => !isAgeFit(question, ageGroup))
    .sort((a, b) => (a.weight || 1) - (b.weight || 1))[0];

  if (!replaceTarget) return;
  removePickedQuestion(replaceTarget, selected, usedIds, usedFamilyIds, usedLifeTagCounts);
  addPickedQuestion(replacement, selected, usedIds, usedFamilyIds, usedLifeTagCounts);
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
  const recentIds = new Set(recentSessions.flatMap(getRecentSessionIds));
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

const applyQuestionAgeVariant = (question, ageGroup = '') => {
  const variants = question.ageVariants;
  const variant = ageGroup && variants?.[ageGroup] ? variants[ageGroup] : null;
  if (!variant) return question;

  return {
    ...question,
    ...variant,
    options: Array.isArray(variant.options) ? variant.options : question.options,
    ageVariantKey: ageGroup
  };
};

export const buildQuestionSession = (recentSessions = [], { ageGroup = '' } = {}) => {
  const recentIds = new Set(recentSessions.flatMap(getRecentSessionIds));
  const recentLifeTags = new Set(recentSessions.flatMap(getRecentSessionLifeTags));
  const axisKeys = ['EI', 'SN', 'TF', 'JP'];
  const selected = [];
  const usedFamilyIds = new Set();
  const usedIds = new Set();
  const usedLifeTagCounts = {};

  axisKeys.forEach((axis) => {
    const basePool = QUESTIONS_DB[axis] || [];
    const extPool = QUESTIONS_EXTENDED?.[axis] || [];
    const baseMeta = QUESTIONS_META[axis] || [];
    const extMeta = QUESTIONS_META_EXTENDED?.[axis] || [];

    const pool = [...basePool, ...extPool];
    const meta = [...baseMeta, ...extMeta];

    const enriched = pool.map((q, i) => applyQuestionAgeVariant({
      ...q,
      id: meta[i]?.id || `${axis}_${i + 1}`,
      familyId: meta[i]?.familyId || `${axis}_${i + 1}`,
      role: meta[i]?.role,
      weight: meta[i]?.weight || 1,
      contextTag: meta[i]?.contextTag || q.contextTag,
      lifeTag: meta[i]?.lifeTag || q.lifeTag,
      ageFit: Array.isArray(meta[i]?.ageFit) ? meta[i].ageFit : q.ageFit,
      allowMiddleCandidate: meta[i]?.allowMiddleCandidate || false,
      _axis: axis
    }, ageGroup));

    const rolePools = [
      enriched.filter((question) => question.role === 'anchor'),
      enriched.filter((question) => ['discriminator', 'forced_choice'].includes(question.role)),
      enriched.filter((question) => ['state', 'parallel'].includes(question.role))
    ];

    rolePools.forEach((rolePool) => {
      const question = pickWeightedQuestion(rolePool.length ? rolePool : enriched, {
        recentIds,
        recentLifeTags,
        usedIds,
        usedFamilyIds,
        usedLifeTagCounts,
        ageGroup
      });
      addPickedQuestion(question, selected, usedIds, usedFamilyIds, usedLifeTagCounts);
    });

    while (selected.filter((question) => question._axis === axis).length < 3) {
      const fallback = pickWeightedQuestion(enriched, {
        recentIds,
        recentLifeTags,
        usedIds,
        usedFamilyIds,
        usedLifeTagCounts,
        ageGroup
      });
      if (!addPickedQuestion(fallback, selected, usedIds, usedFamilyIds, usedLifeTagCounts)) break;
    }

    ensureAgeFitForAxis({
      axis,
      enriched,
      selected,
      usedIds,
      usedFamilyIds,
      usedLifeTagCounts,
      recentIds,
      recentLifeTags,
      ageGroup
    });
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
