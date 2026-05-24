import { AXIS_META } from './constants.js';

export const getHistoryComparison = (currentMbti, historyData) => {
  if (!historyData.length) return null;
  const resolvedCurrentMbti = currentMbti || historyData[0]?.mbti || '';
  const previousEntry = historyData.length > 1 ? historyData[1] : null;
  if (!previousEntry) {
    return {
      title: '오늘 결과가 첫 기준점이에요',
      body: '다음 번부터는 어떤 축이 먼저 흔들리는지 바로 비교해볼 수 있어요.'
    };
  }
  const changedAxes = resolvedCurrentMbti
    .split('')
    .map((char, idx) => (char !== previousEntry.mbti[idx] ? idx : null))
    .filter((idx) => idx !== null)
    .map((idx) => ['E/I', 'S/N', 'T/F', 'J/P'][idx]);

  if (changedAxes.length === 0) {
    return {
      title: `직전 기록과 같은 ${resolvedCurrentMbti} 흐름이에요`,
      body: '요즘은 비슷한 결이 이어지고 있어요. 지금 다시 해보면 어느 축부터 흔들리는지 볼 수 있어요.'
    };
  }

  return {
    title: `${changedAxes.join(', ')} 축이 직전 결과와 달라졌어요`,
    body: '컨디션이나 주변 맥락이 바뀌면 이 축들이 가장 먼저 움직일 수 있어요.'
  };
};

export const getTrendAnalysis = (currentSpectrum, previousAxes) => {
  if (!currentSpectrum?.length || !previousAxes?.length) return null;
  const deltas = currentSpectrum
    .map((axis, idx) => {
      const previousAxis = previousAxes[idx];
      if (!previousAxis) return null;
      const currentSigned = axis.dominantType === axis.left ? axis.intensity : -axis.intensity;
      const previousSigned = previousAxis.dominantType === previousAxis.left ? previousAxis.intensity : -previousAxis.intensity;
      return { pair: axis.pair || `${axis.left}/${axis.right}`, dominantType: axis.dominantType, diff: Math.abs(currentSigned - previousSigned) };
    })
    .filter(Boolean)
    .sort((a, b) => b.diff - a.diff);

  const strongestDelta = deltas[0];
  if (!strongestDelta || strongestDelta.diff < 3) {
    return {
      title: '지난 결과와 큰 차이는 없어요',
      body: '최근 결과와 비교했을 때 오늘의 성향 흐름은 비교적 안정적으로 이어지고 있어요.'
    };
  }
  return {
    title: `지난번보다 ${strongestDelta.dominantType} 성향이 ${strongestDelta.diff}% 더 두드러졌어요`,
    body: `${strongestDelta.pair} 축에서 변화가 가장 크게 나타났어요. 오늘의 기분이나 주변 맥락이 이 축에 특히 반영된 것 같아요.`
  };
};

export const getEffectiveHistory = (currentEntry, historyData) => {
  if (!currentEntry) return historyData;
  if (!historyData.length) return [currentEntry];
  if (historyData[0].createdAt && currentEntry.createdAt && historyData[0].createdAt === currentEntry.createdAt) return historyData;
  return [currentEntry, ...historyData].slice(0, 7);
};

export const getAxisChangeDetails = (currentMbti, previousMbti) =>
  AXIS_META.map((axis, idx) => {
    const before = previousMbti?.[idx];
    const after = currentMbti?.[idx];
    if (!before || before === after) return null;
    return { ...axis, before, after, title: `${axis.label} 변화`, description: `${before}에서 ${after} 쪽으로 기울었어요.` };
  }).filter(Boolean);

export const getHistoryInsights = (historyData) => {
  if (!historyData.length) return null;
  const recent = historyData.slice(0, 5);
  const countMap = recent.reduce((acc, item) => {
    acc[item.mbti] = (acc[item.mbti] || 0) + 1;
    return acc;
  }, {});
  const topType = Object.entries(countMap).sort((a, b) => b[1] - a[1])[0];
  let stableCount = 1;
  for (let i = 1; i < recent.length; i += 1) {
    if (recent[i].mbti === recent[0].mbti) stableCount += 1;
    else break;
  }
  const volatility = AXIS_META.map((axis, idx) => {
    let flips = 0;
    for (let i = 0; i < recent.length - 1; i += 1) {
      if (recent[i].mbti[idx] !== recent[i + 1].mbti[idx]) flips += 1;
    }
    return { ...axis, flips };
  }).sort((a, b) => b.flips - a.flips);

  return {
    recentCount: recent.length,
    topType: topType ? { mbti: topType[0], count: topType[1] } : null,
    stableCount,
    mostVolatile: volatility[0],
    mostStable: [...volatility].sort((a, b) => a.flips - b.flips)[0]
  };
};

export const getHistoryEntryNote = (item, idx, historyData) => {
  const nextEntry = historyData[idx + 1];
  if (!nextEntry) return '기준점이 되는 기록';
  const changedAxes = getAxisChangeDetails(item.mbti, nextEntry.mbti);
  return changedAxes.length ? `${changedAxes.map((axis) => axis.pair).join(', ')} 축 변화` : `직전 기록과 같은 ${item.mbti} 흐름`;
};

export const getRetestPrompt = (boundaryAxes, historyInsights) => {
  if (historyInsights?.mostVolatile?.flips) {
    return `${historyInsights.mostVolatile.pair} 축이 가장 자주 흔들렸어요. 지금 다시 해보면 여기부터 달라질 수 있어요.`;
  }
  if (boundaryAxes.length > 0) {
    const pairs = boundaryAxes.map((axis) => `${axis.left}/${axis.right}`).join(', ');
    return `${pairs} 축은 오늘 컨디션 영향을 많이 받을 수 있어요. 다시 해보면 결이 살짝 달라질 수 있어요.`;
  }
  return '같은 날 다시 해보면 예상보다 작은 축 하나가 먼저 달라질 수 있어요.';
};

export const toHistoryAxisSnapshot = (axis) => ({
  pair: `${axis.left}/${axis.right}`,
  left: axis.left,
  right: axis.right,
  dominantType: axis.dominantType,
  intensity: axis.intensity,
  leftScore: axis.leftScore,
  rightScore: axis.rightScore
});

export const getRecentFlowSummary = (effectiveHistory, fallbackMbti = '', currentThemeKey = '') => {
  const recent = effectiveHistory.slice(0, 5);
  const flow = recent.map((item) => item.mbti).filter(Boolean);

  const timeline = recent.map((item) => ({
    mbti: item.mbti,
    themeKey: item.themeKey || currentThemeKey,
    percent: item.percent || 100
  })).reverse();

  if (!flow.length) {
    return {
      chips: fallbackMbti ? [fallbackMbti] : [],
      timeline: fallbackMbti ? [{ mbti: fallbackMbti, themeKey: currentThemeKey, percent: 100 }] : [],
      note: '기록이 더 쌓이면 최근 흐름을 한눈에 읽기 쉬워져요.'
    };
  }

  const uniqueCount = new Set(flow).size;
  const note = uniqueCount === 1
    ? `최근 ${flow.length}번은 ${flow[0]} 흐름이 이어졌어요. 같은 결과 안의 미세한 차이를 보기 좋은 상태예요.`
    : `최근 ${flow.length}번 안에서 ${uniqueCount}가지 흐름이 보였어요. 지금은 작은 변화가 잘 드러나는 구간이에요.`;

  return {
    chips: flow,
    timeline,
    note
  };
};

export const getRevisitInsight = ({ historyComparison, historyInsights, boundaryAxes, presentation }) => {
  if (historyComparison?.title?.includes('달라졌어요')) {
    return '직전과 달라진 축이 이미 잡혔어요. 지금 다시 하면 오늘 변화가 일시적인지 더 분명하게 볼 수 있어요.';
  }

  if (historyInsights?.mostVolatile?.flips) {
    return `${historyInsights.mostVolatile.pair} 축이 가장 자주 흔들렸어요. 다음 테스트에서는 이 축 변화부터 눈여겨보면 좋아요.`;
  }

  if (boundaryAxes.length > 0) {
    const pairs = boundaryAxes.map((axis) => `${axis.left}/${axis.right}`).join(', ');
    return `${pairs} 축은 오늘 컨디션 영향을 크게 받을 수 있어요. 같은 날 다시 하면 여기부터 달라질 가능성이 높아요.`;
  }

  if (presentation?.state === 'streak') {
    return '결과는 이어지고 있지만 오늘 강했던 축과 문구 분위기는 달라질 수 있어요. 다시 하면 같은 MBTI 안의 결 차이를 더 또렷하게 볼 수 있어요.';
  }

  return '다시 해보면 완전히 다른 결과보다 오늘 더 강했던 축이 유지되는지, 어떤 장면 문항에서 달라지는지부터 비교해보면 좋아요.';
};
