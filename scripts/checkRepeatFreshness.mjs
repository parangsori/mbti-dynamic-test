import {
  buildQuestionSession,
  createRecentSessionSnapshot,
  getQuestionLifeTag
} from '../src/lib/questionFlow.js';

const SESSION_COUNT = 5;
const EXPECTED_AXIS_COUNT = 3;
const MAX_REPEAT_RATE = 0.18;
const MIN_LIFE_TAGS_PER_SESSION = 3;
const MIN_AGE_FIT_PER_SESSION = 4;
const AXES = ['EI', 'SN', 'TF', 'JP'];
const AGE_GROUPS = ['teen', '20s', '30s', '40s', '50s'];
const PRESENTATION_STATES = ['streak', 'shift', 'boundary', 'clear', 'default'];
const PRESENTATION_STATE_EXPECTED_MIN = 5;
const SAMPLE_MBTIS = ['INFP', 'ENFP', 'ISTJ', 'ENTJ', 'ISFJ'];
const STRESS_SESSION_COUNT = 20;
const STRESS_AGE_GROUP = '30s';
const MAX_STRESS_SINGLE_QUESTION_REPEAT = 5;
const MAX_STRESS_REPEAT_RATE = 0.32;
const AGE_TONE_RISK_PATTERNS = {
  teen: /퇴근|직장|회사|상사|회식|술 한잔|펍|신규 사업|소개팅|데이트/,
  '20s': /어린이|친구들과 놀면|학교 숙제/,
  '30s': /어린이|학교 숙제/,
  '40s': /ㄱㄱ|스퍼트|불도저|중독|폭발|노년|어르신/,
  '50s': /ㄱㄱ|스퍼트|불도저|중독|폭발|노년|어르신|품격/
};

const readSource = async (path) => {
  const { readFile } = await import('node:fs/promises');
  return readFile(new URL(path, import.meta.url), 'utf8');
};

const getQuestionId = (question) => question.id || '';
const getFamilyId = (question) => question.familyId || '';
const hasAgeFit = (question, ageGroup) => Array.isArray(question.ageFit) && question.ageFit.includes(ageGroup);
const getQuestionTextBundle = (question = {}) => [
  question.q,
  ...(question.options || []).flatMap((option) => [option.text, option.micro])
].filter(Boolean).join(' ');

const countBy = (items, getKey) =>
  items.reduce((acc, item) => {
    const key = getKey(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

const getDuplicateKeys = (items, getKey) => {
  const counts = countBy(items, getKey);
  return Object.entries(counts)
    .filter(([, count]) => count > 1)
    .map(([key, count]) => ({ key, count }));
};

const getStableSeed = (parts) =>
  parts.join('|').split('').reduce((hash, char) => {
    const nextHash = ((hash << 5) - hash) + char.charCodeAt(0);
    return nextHash | 0;
  }, 0);

const getPresentationVariantStats = async () => {
  const source = await readSource('../src/lib/resultAnalysis.js');
  const blockMatch = source.match(/const PRESENTATION_VARIANTS = \{([\s\S]*?)\n\};\n\nconst getStableSeed/);
  if (!blockMatch) {
    throw new Error('PRESENTATION_VARIANTS 블록을 찾을 수 없습니다.');
  }

  return Object.fromEntries(
    PRESENTATION_STATES.map((state) => {
      const stateMatch = blockMatch[1].match(new RegExp(`${state}: \\[([\\s\\S]*?)\\n  \\]`));
      const keys = stateMatch
        ? [...stateMatch[1].matchAll(/key: '([^']+)'/g)].map((match) => match[1])
        : [];
      const samples = Array.from({ length: 60 }, (_, index) => {
        const seed = getStableSeed([
          `2026-04-28T09:${String(index).padStart(2, '0')}:00.000Z`,
          SAMPLE_MBTIS[index % SAMPLE_MBTIS.length],
          index % 2 === 0 ? 'I' : 'F',
          72 + index,
          state === 'streak' ? 2 : 0,
          state === 'shift' ? '직전과 달라졌어요' : ''
        ]);
        return keys.length ? keys[Math.abs(seed) % keys.length] : '';
      }).filter(Boolean);

      return [state, {
        count: keys.length,
        sampleDistribution: countBy(samples, (item) => item)
      }];
    })
  );
};

const recentSessions = [];
const sessions = [];

for (let i = 0; i < SESSION_COUNT; i += 1) {
  const ageGroup = AGE_GROUPS[i % AGE_GROUPS.length];
  const questions = buildQuestionSession(recentSessions, { ageGroup });
  sessions.push(questions);
  recentSessions.unshift(createRecentSessionSnapshot({
    questions,
    ids: questions.map(getQuestionId),
    ageGroup
  }));
}

const allQuestions = sessions.flat();
const repeatedIds = getDuplicateKeys(allQuestions, getQuestionId);
const repeatedFamiliesBySession = sessions.map((questions, index) => ({
  session: index + 1,
  duplicates: getDuplicateKeys(questions, getFamilyId)
}));
const lifeTagsBySession = sessions.map((questions, index) => {
  const tags = questions.map(getQuestionLifeTag);
  return {
    session: index + 1,
    counts: countBy(tags, (tag) => tag),
    uniqueCount: new Set(tags).size
  };
});
const ageFitBySession = sessions.map((questions, index) => {
  const ageGroup = AGE_GROUPS[index % AGE_GROUPS.length];
  return {
    session: index + 1,
    ageGroup,
    count: questions.filter((question) => hasAgeFit(question, ageGroup)).length
  };
});
const ageToneRisksBySession = sessions.map((questions, index) => {
  const ageGroup = AGE_GROUPS[index % AGE_GROUPS.length];
  const pattern = AGE_TONE_RISK_PATTERNS[ageGroup];
  return {
    session: index + 1,
    ageGroup,
    risks: pattern
      ? questions
        .map((question) => ({ id: getQuestionId(question), text: getQuestionTextBundle(question) }))
        .filter((item) => pattern.test(item.text))
        .map(({ id }) => id)
      : []
  };
});

const axisCountsBySession = sessions.map((questions, index) => ({
  session: index + 1,
  counts: countBy(questions, (question) => question._axis)
}));

const repeatRate = allQuestions.length > 0 ? repeatedIds.length / allQuestions.length : 0;
const presentationVariantStats = await getPresentationVariantStats();

const stressRecentSessions = [];
const stressSessions = [];

for (let i = 0; i < STRESS_SESSION_COUNT; i += 1) {
  const questions = buildQuestionSession(stressRecentSessions, { ageGroup: STRESS_AGE_GROUP });
  stressSessions.push(questions);
  stressRecentSessions.unshift(createRecentSessionSnapshot({
    questions,
    ids: questions.map(getQuestionId),
    ageGroup: STRESS_AGE_GROUP
  }));
  stressRecentSessions.splice(12);
}

const stressAllQuestions = stressSessions.flat();
const stressRepeatedIds = getDuplicateKeys(stressAllQuestions, getQuestionId)
  .sort((a, b) => b.count - a.count);
const stressRepeatRate = stressAllQuestions.length > 0
  ? (stressAllQuestions.length - new Set(stressAllQuestions.map(getQuestionId)).size) / stressAllQuestions.length
  : 0;

const failures = [];

axisCountsBySession.forEach(({ session, counts }) => {
  AXES.forEach((axis) => {
    if (counts[axis] !== EXPECTED_AXIS_COUNT) {
      failures.push(`session ${session}: ${axis} 문항 수가 ${EXPECTED_AXIS_COUNT}개가 아닙니다. actual=${counts[axis] || 0}`);
    }
  });
});

repeatedFamiliesBySession.forEach(({ session, duplicates }) => {
  if (duplicates.length > 0) {
    failures.push(`session ${session}: 같은 familyId가 한 세션에 중복되었습니다. ${JSON.stringify(duplicates)}`);
  }
});

lifeTagsBySession.forEach(({ session, uniqueCount, counts }) => {
  if (uniqueCount < MIN_LIFE_TAGS_PER_SESSION) {
    failures.push(`session ${session}: lifeTag 종류가 ${MIN_LIFE_TAGS_PER_SESSION}개보다 적습니다. ${JSON.stringify(counts)}`);
  }
});

ageFitBySession.forEach(({ session, ageGroup, count }) => {
  if (count < MIN_AGE_FIT_PER_SESSION) {
    failures.push(`session ${session}: ${ageGroup} ageFit 문항이 ${MIN_AGE_FIT_PER_SESSION}개보다 적습니다. actual=${count}`);
  }
});

ageToneRisksBySession.forEach(({ session, ageGroup, risks }) => {
  if (risks.length > 0) {
    failures.push(`session ${session}: ${ageGroup} 톤/생활맥락 리스크 문항이 포함되었습니다. ${risks.join(', ')}`);
  }
});

if (repeatRate > MAX_REPEAT_RATE) {
  failures.push(`연속 ${SESSION_COUNT}회 문항 ID 반복률이 높습니다. repeatRate=${repeatRate}`);
}

if (stressRepeatRate > MAX_STRESS_REPEAT_RATE) {
  failures.push(`같은 연령대 ${STRESS_SESSION_COUNT}회 반복 문항 ID 반복률이 높습니다. repeatRate=${stressRepeatRate}`);
}

const overRepeatedStressIds = stressRepeatedIds.filter(({ count }) => count > MAX_STRESS_SINGLE_QUESTION_REPEAT);
if (overRepeatedStressIds.length > 0) {
  failures.push(`같은 연령대 반복에서 특정 문항이 과다 반복됩니다. ${JSON.stringify(overRepeatedStressIds.slice(0, 5))}`);
}

Object.entries(presentationVariantStats).forEach(([state, stats]) => {
  if (stats.count < PRESENTATION_STATE_EXPECTED_MIN) {
    failures.push(`${state} presentation 변주가 ${PRESENTATION_STATE_EXPECTED_MIN}개보다 적습니다. actual=${stats.count}`);
  }
});

const summary = {
  sessionCount: SESSION_COUNT,
  totalQuestions: allQuestions.length,
  uniqueQuestionIds: new Set(allQuestions.map(getQuestionId)).size,
  repeatedIds,
  repeatRate: Number(repeatRate.toFixed(3)),
  axisCountsBySession,
  repeatedFamiliesBySession,
  lifeTagsBySession,
  ageFitBySession,
  ageToneRisksBySession,
  stressRepeat: {
    ageGroup: STRESS_AGE_GROUP,
    sessionCount: STRESS_SESSION_COUNT,
    uniqueQuestionIds: new Set(stressAllQuestions.map(getQuestionId)).size,
    repeatRate: Number(stressRepeatRate.toFixed(3)),
    topRepeatedIds: stressRepeatedIds.slice(0, 8)
  },
  presentationVariantStats,
  passed: failures.length === 0,
  failures
};

console.log(JSON.stringify(summary, null, 2));

if (failures.length > 0) {
  process.exitCode = 1;
}
