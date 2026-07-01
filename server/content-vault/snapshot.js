import { QUESTIONS_DB, MBTI_RESULTS, BADGES } from '../product/content.js';
import { QUESTIONS_META } from '../product/questionsMeta.js';
import { QUESTIONS_EXTENDED, QUESTIONS_META_EXTENDED } from '../product/questionsExtended.js';
import { TYPE_CHARACTER_META } from '../product/spiritMeta.js';
import { COMPATIBILITY, QUESTION_TEMPO_COPY } from '../product/productConstants.js';

export const CONTENT_VAULT_VERSION = 1;

export const createContentSnapshot = () => ({
  version: CONTENT_VAULT_VERSION,
  exportedAt: new Date().toISOString(),
  questions: {
    base: QUESTIONS_DB,
    extended: QUESTIONS_EXTENDED,
    baseMeta: QUESTIONS_META,
    extendedMeta: QUESTIONS_META_EXTENDED
  },
  results: {
    mbti: MBTI_RESULTS,
    badges: BADGES,
    compatibility: COMPATIBILITY,
    tempoCopy: QUESTION_TEMPO_COPY
  },
  assets: {
    typeCharacters: TYPE_CHARACTER_META
  }
});

const countQuestionGroups = (groups = {}) =>
  Object.values(groups).reduce((sum, items) => sum + (Array.isArray(items) ? items.length : 0), 0);

export const getContentSnapshotStats = (snapshot = createContentSnapshot()) => ({
  version: snapshot.version,
  baseQuestionCount: countQuestionGroups(snapshot.questions.base),
  extendedQuestionCount: countQuestionGroups(snapshot.questions.extended),
  resultTypeCount: Object.keys(snapshot.results.mbti || {}).length,
  typeCharacterCount: Object.keys(snapshot.assets.typeCharacters || {}).length
});
