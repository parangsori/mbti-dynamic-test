const FOLLOWUP_WEIGHT = 1.3;

const AXES = [
  { code: 'EI', left: 'E', right: 'I' },
  { code: 'SN', left: 'S', right: 'N' },
  { code: 'TF', left: 'T', right: 'F' },
  { code: 'JP', left: 'J', right: 'P' }
];

const scenarios = [
  {
    id: 'clear_enfp',
    label: '명확한 ENFP',
    expectedMbti: 'ENFP',
    baseScores: { E: 6, I: 1, S: 1, N: 6, T: 1, F: 6, J: 1, P: 6 },
    neutralSignals: {},
    followupResponses: {}
  },
  {
    id: 'clear_istj',
    label: '명확한 ISTJ',
    expectedMbti: 'ISTJ',
    baseScores: { E: 1, I: 6, S: 6, N: 1, T: 6, F: 1, J: 6, P: 1 },
    neutralSignals: {},
    followupResponses: {}
  },
  {
    id: 'clear_enfj',
    label: '명확한 ENFJ',
    expectedMbti: 'ENFJ',
    baseScores: { E: 6, I: 1, S: 1, N: 6, T: 1, F: 6, J: 6, P: 1 },
    neutralSignals: {},
    followupResponses: {}
  },
  {
    id: 'clear_intp',
    label: '명확한 INTP',
    expectedMbti: 'INTP',
    baseScores: { E: 1, I: 6, S: 1, N: 6, T: 6, F: 1, J: 1, P: 6 },
    neutralSignals: {},
    followupResponses: {}
  },
  {
    id: 'boundary_tf_flip',
    label: 'TF 경계 보정으로 ESFJ',
    expectedMbti: 'ESFJ',
    baseScores: { E: 5, I: 1, S: 5, N: 1, T: 3, F: 2, J: 5, P: 1 },
    neutralSignals: {},
    followupResponses: { TF: 'F' }
  },
  {
    id: 'boundary_jp_flip',
    label: 'JP 경계 보정으로 ENFJ',
    expectedMbti: 'ENFJ',
    baseScores: { E: 5, I: 1, S: 1, N: 5, T: 1, F: 5, J: 2, P: 3 },
    neutralSignals: {},
    followupResponses: { JP: 'J' }
  },
  {
    id: 'boundary_ei_flip',
    label: 'EI 경계 보정으로 ENTP',
    expectedMbti: 'ENTP',
    baseScores: { E: 2, I: 3, S: 1, N: 5, T: 5, F: 1, J: 1, P: 5 },
    neutralSignals: {},
    followupResponses: { EI: 'E' }
  },
  {
    id: 'boundary_sn_flip',
    label: 'SN 경계 보정으로 INFJ',
    expectedMbti: 'INFJ',
    baseScores: { E: 1, I: 5, S: 3, N: 2, T: 1, F: 5, J: 5, P: 1 },
    neutralSignals: {},
    followupResponses: { SN: 'N' }
  },
  {
    id: 'neutral_tf_esfj',
    label: 'TF 애매 응답 보정으로 ESFJ',
    expectedMbti: 'ESFJ',
    baseScores: { E: 5, I: 1, S: 5, N: 1, T: 3.3, F: 2.2, J: 5, P: 1 },
    neutralSignals: { TF: 1 },
    followupResponses: { TF: 'F' }
  },
  {
    id: 'neutral_jp_enfj',
    label: 'JP 애매 응답 보정으로 ENFJ',
    expectedMbti: 'ENFJ',
    baseScores: { E: 5, I: 1, S: 1, N: 5, T: 1, F: 5, J: 2.2, P: 3.3 },
    neutralSignals: { JP: 1 },
    followupResponses: { JP: 'J' }
  },
  {
    id: 'neutral_ei_infj',
    label: 'EI 애매 응답 보정으로 INFJ',
    expectedMbti: 'INFJ',
    baseScores: { E: 3.3, I: 2.2, S: 1, N: 5, T: 1, F: 5, J: 5, P: 1 },
    neutralSignals: { EI: 1 },
    followupResponses: { EI: 'I' }
  },
  {
    id: 'neutral_sn_infp',
    label: 'SN 애매 응답 보정으로 INFP',
    expectedMbti: 'INFP',
    baseScores: { E: 1, I: 5, S: 3.3, N: 2.2, T: 1, F: 5, J: 1, P: 5 },
    neutralSignals: { SN: 1 },
    followupResponses: { SN: 'N' }
  }
];

const computeSimpleResult = (scores) => {
  const spectrum = AXES.map(({ code, left, right }) => {
    const leftScore = scores[left] || 0;
    const rightScore = scores[right] || 0;
    const total = leftScore + rightScore || 1;
    const dominantType = leftScore >= rightScore ? left : right;
    const dominantScore = Math.max(leftScore, rightScore);
    const intensity = Math.round((dominantScore / total) * 100);
    const diff = Math.abs(leftScore - rightScore);
    return { code, left, right, leftScore, rightScore, dominantType, intensity, diff };
  });

  return {
    mbti: spectrum.map((axis) => axis.dominantType).join(''),
    spectrum
  };
};

const getOldFollowupAxes = (scores, maxAxes = 3) =>
  computeSimpleResult(scores).spectrum
    .filter((axis) => axis.intensity < 60 || axis.diff <= 1)
    .sort((a, b) => {
      if (a.intensity !== b.intensity) return a.intensity - b.intensity;
      return a.diff - b.diff;
    })
    .slice(0, maxAxes)
    .map((axis) => axis.code);

const getNewFollowupAxes = (scores, neutralSignals = {}, maxAxes = 3) =>
  computeSimpleResult(scores).spectrum
    .map((axis) => ({
      ...axis,
      neutralCount: neutralSignals[axis.code] || 0
    }))
    .filter((axis) => axis.neutralCount > 0 || axis.intensity < 60 || axis.diff <= 1)
    .sort((a, b) => {
      if (a.neutralCount !== b.neutralCount) return b.neutralCount - a.neutralCount;
      if (a.intensity !== b.intensity) return a.intensity - b.intensity;
      return a.diff - b.diff;
    })
    .slice(0, maxAxes)
    .map((axis) => axis.code);

const applyFollowups = (baseScores, axes, followupResponses = {}) => {
  const nextScores = { ...baseScores };
  axes.forEach((axisCode) => {
    const selected = followupResponses[axisCode];
    if (selected) nextScores[selected] = (nextScores[selected] || 0) + FOLLOWUP_WEIGHT;
  });
  return nextScores;
};

const results = scenarios.map((scenario) => {
  const oldAxes = getOldFollowupAxes(scenario.baseScores);
  const newAxes = getNewFollowupAxes(scenario.baseScores, scenario.neutralSignals);
  const oldResult = computeSimpleResult(applyFollowups(scenario.baseScores, oldAxes, scenario.followupResponses));
  const newResult = computeSimpleResult(applyFollowups(scenario.baseScores, newAxes, scenario.followupResponses));

  return {
    id: scenario.id,
    label: scenario.label,
    expected: scenario.expectedMbti,
    oldMbti: oldResult.mbti,
    newMbti: newResult.mbti,
    oldAxes,
    newAxes,
    improved: oldResult.mbti !== scenario.expectedMbti && newResult.mbti === scenario.expectedMbti,
    oldMatch: oldResult.mbti === scenario.expectedMbti,
    newMatch: newResult.mbti === scenario.expectedMbti
  };
});

const summary = {
  total: results.length,
  oldMatchCount: results.filter((item) => item.oldMatch).length,
  newMatchCount: results.filter((item) => item.newMatch).length,
  improvedCount: results.filter((item) => item.improved).length,
  results
};

console.log(JSON.stringify(summary, null, 2));
