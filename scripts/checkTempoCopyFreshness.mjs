import { QUESTION_TEMPO_COPY } from '../server/product/productConstants.js';
import { getPersonalizedTempoMessage } from '../server/product/personalization.js';
import { getFollowupTempoMessage } from '../server/product/questionFlow.js';

const AGE_GROUPS = ['child', 'teen', '20s', '30s', '40s', '50s'];
const TOTAL_BASE_QUESTIONS = 12;
const MAX_FOLLOWUP_QUESTIONS = 3;

const findDuplicates = (items) => {
  const counts = new Map();
  items.forEach((item) => counts.set(item, (counts.get(item) || 0) + 1));
  return [...counts.entries()].filter(([, count]) => count > 1);
};

const assertNoDuplicates = (label, messages) => {
  const duplicates = findDuplicates(messages);
  if (!duplicates.length) return;

  throw new Error(
    `${label} has duplicate tempo copy: ${duplicates
      .map(([message, count]) => `${count}x "${message}"`)
      .join(', ')}`
  );
};

const defaultMessages = Array.from(
  { length: TOTAL_BASE_QUESTIONS },
  (_, index) => QUESTION_TEMPO_COPY[index]
);
assertNoDuplicates('default question tempo', defaultMessages);

AGE_GROUPS.forEach((ageGroup) => {
  const messages = Array.from(
    { length: TOTAL_BASE_QUESTIONS },
    (_, index) => getPersonalizedTempoMessage(
      ageGroup,
      index,
      TOTAL_BASE_QUESTIONS,
      QUESTION_TEMPO_COPY[index]
    )
  );
  assertNoDuplicates(`${ageGroup} question tempo`, messages);
});

for (let total = 1; total <= MAX_FOLLOWUP_QUESTIONS; total += 1) {
  const messages = Array.from(
    { length: total },
    (_, index) => getFollowupTempoMessage(index, total)
  );
  assertNoDuplicates(`followup tempo total ${total}`, messages);
}

console.log('Tempo copy freshness check passed.');
