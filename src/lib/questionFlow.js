import { QUESTIONS_DB } from '../data/mbtiData.js';
import { QUESTIONS_META, QUESTIONS_EXTENDED, QUESTIONS_META_EXTENDED } from '../data/questionPools.js';

export const createEmptyScores = () => ({ E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 });

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
      id: meta[i]?.id,
      familyId: meta[i]?.familyId,
      role: meta[i]?.role,
      weight: meta[i]?.weight,
      _axis: axis
    }));

    const candidates = enriched.filter((q) => !recentIds.has(q.id));
    const pool2 = candidates.length >= 4 ? candidates : enriched;

    const anchors = pool2.filter((q) => q.role === 'anchor' && !usedFamilyIds.has(q.familyId));
    const anchor = anchors.length > 0
      ? anchors[Math.floor(Math.random() * anchors.length)]
      : pool2[Math.floor(Math.random() * pool2.length)];

    usedFamilyIds.add(anchor.familyId);
    usedIds.add(anchor.id);
    selected.push(anchor);

    const rest = pool2.filter((q) => !usedIds.has(q.id) && !usedFamilyIds.has(q.familyId));
    const totalW = rest.reduce((sum, q) => sum + q.weight, 0);
    const pick = (exclude) => {
      let r = Math.random() * totalW;
      for (const q of rest) {
        if (exclude.has(q.id) || usedFamilyIds.has(q.familyId)) continue;
        r -= q.weight;
        if (r <= 0) return q;
      }
      return rest.find((q) => !exclude.has(q.id) && !usedFamilyIds.has(q.familyId)) || rest[0];
    };

    const pick1 = pick(usedIds);
    if (pick1) {
      usedFamilyIds.add(pick1.familyId);
      usedIds.add(pick1.id);
      selected.push(pick1);
    }

    const pick2 = pick(usedIds);
    if (pick2) {
      usedFamilyIds.add(pick2.familyId);
      usedIds.add(pick2.id);
      selected.push(pick2);
    }
  });

  selected.sort(() => Math.random() - 0.5);
  return sortQuestionsForTempo(selected, recentIds);
};
