import { BADGES, MBTI_RESULTS } from '../data/mbtiData.js';
import { AXIS_META, COMPATIBILITY } from './constants.js';

export const getDisplayName = (name, fallback) => name.trim() || fallback;

export const computeResult = (scores) => {
  const axes = [
    { left: 'E', right: 'I', leftLabel: '외향적', rightLabel: '내향적' },
    { left: 'S', right: 'N', leftLabel: '현실적', rightLabel: '직관적' },
    { left: 'T', right: 'F', leftLabel: '이성적', rightLabel: '감성적' },
    { left: 'J', right: 'P', leftLabel: '계획적', rightLabel: '유연함' }
  ];

  const spectrum = axes.map(({ left, right, leftLabel, rightLabel }) => {
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
  const info = MBTI_RESULTS[mbti];
  const boundaryAxes = spectrum.filter((axis) => axis.isBoundary);

  return { mbti, percent, badges, info, spectrum, boundaryAxes };
};

export const getAxisNarratives = (spectrum) => {
  const copyMap = {
    E: '오늘은 혼자보다 사람 속에서 에너지가 더 살아나는 흐름이었어요.',
    I: '오늘은 사람보다 내 페이스를 지키는 쪽이 더 편하게 느껴졌어요.',
    S: '아이디어보다 눈앞의 사실과 익숙한 기준에 더 손이 갔어요.',
    N: '정답보다 가능성과 큰 그림 쪽으로 시선이 더 먼저 움직였어요.',
    T: '감정보다 기준과 판단을 먼저 세우는 흐름이 비교적 또렷했어요.',
    F: '결론보다 분위기와 관계의 온도를 함께 살피는 쪽에 가까웠어요.',
    J: '열어두기보다 정리하고 결론 내리는 흐름이 더 편했어요.',
    P: '딱 맞춰 움직이기보다 상황에 맞게 유연하게 가는 쪽이 자연스러웠어요.'
  };

  return spectrum.map((item) => ({
    ...item,
    pair: `${item.left}/${item.right}`,
    dominantLabel: item.dominantType === item.left ? item.leftLabel : item.rightLabel,
    narrative: copyMap[item.dominantType],
    stateLabel: item.isBoundary ? '상황 영향이 큰 축' : '비교적 안정적인 축'
  }));
};

export const getResultSummary = (mbti, spectrum, percent) => {
  const strongestAxis = [...spectrum].sort((a, b) => b.intensity - a.intensity)[0];
  const boundaryCount = spectrum.filter((item) => item.isBoundary).length;
  const strongestLabel = strongestAxis.dominantType === strongestAxis.left ? strongestAxis.leftLabel : strongestAxis.rightLabel;

  if (boundaryCount >= 2) return `오늘은 ${mbti} 쪽으로 기울었지만, 몇몇 축은 기분과 상황에 따라 꽤 유연하게 움직이고 있어요.`;
  if (percent >= 85) return `오늘은 ${strongestLabel} 흐름이 확실했어요. 여러 답변에서 비슷한 결이 또렷하게 이어졌어요.`;
  return `오늘은 ${strongestLabel} 쪽이 조금 더 강했어요. 다만 몇몇 판단 축에서는 다른 결도 함께 보였어요.`;
};

export const getConsistencyCopy = (percent, boundaryAxes) => {
  if (percent >= 88) return '오늘 답변의 결이 꽤 또렷했어요. 여러 축에서 비슷한 방향의 선택이 자연스럽게 이어졌어요.';
  if (boundaryAxes.length === 0) return '오늘의 흐름은 비교적 분명했어요. 다만 상황이 바뀌면 세부 톤은 충분히 달라질 수 있어요.';
  return '한쪽으로 딱 고정되기보다 여러 결이 함께 보였어요. 그래서 오늘 상태가 더 많이 반영된 결과에 가까워요.';
};

export const getBoundaryCopy = (boundaryAxes) => {
  if (boundaryAxes.length === 0) return '이번에는 크게 흔들리는 축이 많지 않았어요. 오늘의 선택 기준이 비교적 안정적으로 유지된 편이에요.';
  const axisNames = boundaryAxes.map((axis) => `${axis.left}/${axis.right}`).join(', ');
  return `${axisNames} 축은 우세 차이가 크지 않았어요. 누구와 함께 있느냐, 컨디션이 어떤지에 따라 가장 먼저 달라질 수 있는 영역이에요.`;
};

export const getCompatibilityCopy = (mbti) => {
  const pair = COMPATIBILITY[mbti] || { good: '알 수 없음', bad: '알 수 없음' };
  return {
    good: {
      type: pair.good,
      title: '오늘 잘 통할 가능성이 높은 유형',
      description: '대화 템포와 반응 방식이 자연스럽게 맞물릴 수 있어요.'
    },
    bad: {
      type: pair.bad,
      title: '오늘은 살짝 부딪힐 수 있는 유형',
      description: '우선순위나 표현 방식이 엇갈리면 괜히 피곤하게 느껴질 수 있어요.'
    }
  };
};

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

const PRESENTATION_THEMES = [
  {
    key: 'spark',
    label: '불꽃 무드',
    shortLabel: '불꽃',
    stampSuffix: '번쩍 올라온 오늘'
  },
  {
    key: 'wave',
    label: '파도 무드',
    shortLabel: '파도',
    stampSuffix: '흐름을 타는 오늘'
  },
  {
    key: 'neon',
    label: '네온 무드',
    shortLabel: '네온',
    stampSuffix: '선명하게 켜진 오늘'
  },
  {
    key: 'steady',
    label: '스테디 무드',
    shortLabel: '스테디',
    stampSuffix: '탄탄하게 잡힌 오늘'
  },
  {
    key: 'soft-shift',
    label: '소프트 시프트',
    shortLabel: '시프트',
    stampSuffix: '살짝 달라진 오늘'
  }
];

const PRESENTATION_VARIANTS = {
  streak: [
    {
      key: 'streak-glow',
      stateLabel: '연속 결과',
      hook: (mbti) => `또 ${mbti}, 그런데 오늘은 결이 더 선명한 날`,
      detail: '같은 유형이 이어져도 답변의 온도와 강한 축은 조금씩 달라지고 있어요.',
      boast: '반복될수록 내 패턴이 더 또렷하게 보이는 타입',
      tags: ['#연속무드', '#패턴발견', '#오늘의차이']
    },
    {
      key: 'streak-twist',
      stateLabel: '연속 결과',
      hook: (mbti) => `${mbti} 흐름은 유지, 포인트는 살짝 바뀐 날`,
      detail: '큰 방향은 비슷하지만 오늘은 특정 축의 힘이 다르게 들어왔어요.',
      boast: '같은 결과 안에서도 미묘한 변화를 잘 남기는 타입',
      tags: ['#같지만다름', '#미묘한변화', '#축포인트']
    }
  ],
  shift: [
    {
      key: 'shift-pop',
      stateLabel: '변화 감지',
      hook: (mbti) => `오늘은 ${mbti} 쪽으로 새로 방향 튼 날`,
      detail: '직전 결과와 다른 축이 움직이면서 오늘의 컨디션이 더 크게 반영됐어요.',
      boast: '상황에 따라 분위기가 확 바뀌는 반전형 타입',
      tags: ['#무드전환', '#오늘은다름', '#축변화']
    },
    {
      key: 'shift-signal',
      stateLabel: '변화 감지',
      hook: (mbti) => `${mbti} 신호가 새로 들어온 날`,
      detail: '평소 흐름과 다른 선택이 섞이면서 오늘만의 성향 신호가 잡혔어요.',
      boast: '변화가 생길 때 자기 상태가 더 잘 드러나는 타입',
      tags: ['#새신호', '#컨디션반영', '#변화감지']
    }
  ],
  boundary: [
    {
      key: 'boundary-float',
      stateLabel: '경계 축',
      hook: (mbti) => `${mbti}지만 몇 축은 살짝 떠 있는 날`,
      detail: '한쪽으로 딱 잠기기보다 상황과 사람에 따라 흔들릴 여지가 보여요.',
      boast: '고정된 답보다 오늘의 분위기를 더 잘 타는 타입',
      tags: ['#경계축', '#상황영향', '#유연한무드']
    },
    {
      key: 'boundary-pulse',
      stateLabel: '경계 축',
      hook: (mbti) => `${mbti} 안에서 작은 파동이 있는 날`,
      detail: '결과는 나왔지만 몇몇 판단은 오늘 컨디션을 많이 따라갔어요.',
      boast: '같은 유형 안에서도 감도와 리듬이 살아 있는 타입',
      tags: ['#작은파동', '#오늘감도', '#흔들리는축']
    }
  ],
  clear: [
    {
      key: 'clear-bright',
      stateLabel: '선명한 결과',
      hook: (mbti) => `${mbti} 무드가 꽤 또렷하게 켜진 날`,
      detail: '여러 답변에서 비슷한 방향이 반복되며 오늘의 성향이 선명하게 잡혔어요.',
      boast: '오늘만큼은 자기 결이 분명하게 드러나는 타입',
      tags: ['#선명한무드', '#답변일치', '#오늘확신']
    },
    {
      key: 'clear-drive',
      stateLabel: '선명한 결과',
      hook: (mbti) => `${mbti} 쪽으로 힘이 제대로 실린 날`,
      detail: '강한 축이 결과를 끌고 가면서 오늘의 반응 방식이 뚜렷했어요.',
      boast: '에너지 방향이 정해지면 존재감이 확 살아나는 타입',
      tags: ['#힘실림', '#존재감', '#성향선명']
    }
  ],
  default: [
    {
      key: 'daily-snap',
      stateLabel: '오늘 스냅샷',
      hook: (mbti) => `오늘의 나는 ${mbti} 쪽으로 기운 날`,
      detail: '짧은 답변 안에서도 오늘의 기분과 선택 기준이 가볍게 드러났어요.',
      boast: '매일 조금씩 다른 결을 남기는 데일리 스냅샷 타입',
      tags: ['#오늘의나', '#데일리MBTI', '#무드스냅샷']
    },
    {
      key: 'daily-layer',
      stateLabel: '오늘 스냅샷',
      hook: (mbti) => `${mbti} 위에 오늘의 분위기가 한 겹 얹힌 날`,
      detail: '기본 성향 위로 지금의 상황, 사람, 컨디션이 자연스럽게 섞였어요.',
      boast: '고정된 타입보다 오늘의 장면까지 같이 보여주는 타입',
      tags: ['#오늘분위기', '#성향레이어', '#지금이느낌']
    }
  ]
};

const getStableSeed = (parts) =>
  parts.join('|').split('').reduce((hash, char) => {
    const nextHash = ((hash << 5) - hash) + char.charCodeAt(0);
    return nextHash | 0;
  }, 0);

const pickSeeded = (items, seed) => items[Math.abs(seed) % items.length];

const getPresentationState = ({ percent, spectrum, historyInsights, historyComparison }) => {
  const boundaryCount = spectrum.filter((item) => item.isBoundary).length;
  const hasChanged = historyComparison?.title?.includes('달라졌어요');

  if (historyInsights?.stableCount >= 2) return 'streak';
  if (hasChanged) return 'shift';
  if (boundaryCount >= 1 || percent < 72) return 'boundary';
  if (percent >= 85) return 'clear';
  return 'default';
};

export const getResultPresentation = ({
  mbti,
  spectrum,
  percent,
  historyInsights = null,
  historyComparison = null,
  createdAt = ''
}) => {
  const strongestAxis = [...spectrum].sort((a, b) => b.intensity - a.intensity)[0];
  const state = getPresentationState({ percent, spectrum, historyInsights, historyComparison });
  const seed = getStableSeed([
    createdAt,
    mbti,
    strongestAxis?.dominantType || '',
    strongestAxis?.intensity || '',
    historyInsights?.stableCount || 0,
    historyComparison?.title || ''
  ]);
  const variant = pickSeeded(PRESENTATION_VARIANTS[state] || PRESENTATION_VARIANTS.default, seed);
  const theme = pickSeeded(PRESENTATION_THEMES, seed + state.length + (strongestAxis?.intensity || 0));

  return {
    state,
    variantKey: variant.key,
    themeKey: theme.key,
    themeLabel: theme.label,
    themeShortLabel: theme.shortLabel,
    stateLabel: variant.stateLabel,
    hook: variant.hook(mbti),
    detail: variant.detail,
    boast: variant.boast,
    tags: variant.tags,
    stamp: `${theme.stampSuffix} · ${getShareVibeStamp(mbti, spectrum)}`
  };
};

export const getShareMoodLine = (mbti, info, percent) => {
  const moodLead = percent >= 85 ? `오늘은 ${mbti} 모드가 꽤 선명한 날` : `오늘은 ${mbti} 쪽으로 조금 더 기울어진 날`;
  return `${moodLead} · ${info.nickname}`;
};

export const getShareHeadline = (mbti, info, percent) => {
  if (percent >= 88) return `오늘은 ${mbti} 무드가 또렷한 날`;
  if (percent >= 78) return `오늘은 ${mbti} 쪽으로 기운 하루`;
  return `오늘의 나는 ${mbti}에 조금 더 가까워요`;
};

export const getShareSummaryShort = (spectrum) => {
  const strongestAxis = [...spectrum].sort((a, b) => b.intensity - a.intensity)[0];
  if (!strongestAxis) return '오늘의 기분과 에너지가 반영된 가벼운 성향 스냅샷';
  const shortCopyMap = {
    E: '사람 속에서 에너지가 더 살아났어요.',
    I: '내 페이스를 지키는 쪽이 더 편했어요.',
    S: '익숙한 기준과 현실 감각이 더 강했어요.',
    N: '가능성과 큰 그림 쪽으로 시선이 갔어요.',
    T: '감정보다 기준과 판단이 앞섰어요.',
    F: '결론보다 분위기와 관계를 더 살폈어요.',
    J: '정리하고 결론 내리는 흐름이 편했어요.',
    P: '상황에 맞게 유연하게 가는 쪽이 자연스러웠어요.'
  };
  return shortCopyMap[strongestAxis.dominantType] || '오늘의 기분과 에너지가 반영된 가벼운 성향 스냅샷';
};

const SHARE_HOOKS = {
  INFP: '감정은 깊고, 표현은 다정한 타입',
  ENFP: '분위기를 살리고 판을 키우는 타입',
  INFJ: '조용한데 제일 깊게 보는 타입',
  ENFJ: '사람 마음을 먼저 읽는 무드 메이커',
  INTJ: '말수는 적어도 그림은 크게 보는 타입',
  ENTJ: '결론 빠르고 추진력 강한 리더형',
  INTP: '혼자 생각할수록 재밌어지는 타입',
  ENTP: '아이디어 한 번 꽂히면 끝까지 가는 타입',
  ISFP: '조용하지만 취향은 선명한 타입',
  ESFP: '지금 이 분위기를 제일 잘 즐기는 타입',
  ISTP: '필요할 땐 누구보다 정확한 실전형',
  ESTP: '순간 판단이 빠르고 움직임이 가벼운 타입',
  ISFJ: '티 안 나게 챙기는데 존재감은 확실한 타입',
  ESFJ: '분위기와 사람을 같이 끌어안는 타입',
  ISTJ: '기준은 단단하고 움직임은 안정적인 타입',
  ESTJ: '정리와 추진이 동시에 되는 실행형'
};

const SHARE_CARD_COPY = {
  INFP: { hook: '혼자 있을수록 더 선명해지는 날', detail: '오늘은 내 페이스를 지키면서도 감정의 결을 놓치지 않았어요.', boast: '겉은 조용한데 마음속 서사는 누구보다 풍부한 타입', tags: ['#혼자충전', '#감정선명', '#은근다정'] },
  ENFP: { hook: '분위기만 타면 판을 키우는 날', detail: '새로운 자극과 사람 사이에서 에너지가 빠르게 붙는 흐름이었어요.', boast: '가만히 있어도 텐션이 번지는 무드 메이커 타입', tags: ['#분위기메이커', '#즉흥매력', '#에너지폭발'] },
  INFJ: { hook: '조용한데 제일 깊게 보는 날', detail: '겉으로는 차분했지만 속으로는 누구보다 많은 걸 읽고 있었어요.', boast: '말수는 적어도 분위기와 마음은 제일 빨리 읽는 타입', tags: ['#깊게봄', '#조용한통찰', '#분위기레이더'] },
  ENFJ: { hook: '사람 마음부터 먼저 읽히는 날', detail: '대화의 흐름보다 사람의 온도를 먼저 챙기고 싶어졌어요.', boast: '분위기를 부드럽게 끌고 가는 인간 밸런서 타입', tags: ['#공감리더', '#분위기조율', '#사람중심'] },
  INTJ: { hook: '말보다 그림이 먼저 그려지는 날', detail: '작은 반응보다 큰 흐름과 다음 수가 더 또렷하게 보였어요.', boast: '겉은 담백한데 머릿속은 이미 두 수 앞인 타입', tags: ['#큰그림', '#전략모드', '#조용한확신'] },
  ENTJ: { hook: '결론이 빠르고 움직임도 빠른 날', detail: '머뭇거리기보다 정리하고 밀어붙이는 쪽이 훨씬 편했어요.', boast: '판단과 추진이 동시에 되는 실전 리더 타입', tags: ['#결론빠름', '#추진력', '#실행리더'] },
  INTP: { hook: '혼자 생각할수록 더 재밌어지는 날', detail: '사람보다 아이디어와 논리의 흐름 쪽으로 더 깊게 빠져들었어요.', boast: '겉으로는 무심한데 머릿속 대화는 제일 바쁜 타입', tags: ['#생각잠수', '#논리모드', '#혼자재밌음'] },
  ENTP: { hook: '아이디어가 꼬리를 무는 날', detail: '정답 하나보다 더 재밌는 가능성이 먼저 눈에 들어왔어요.', boast: '말 한마디로 판을 흔드는 발상가 타입', tags: ['#아이디어폭주', '#판흔들기', '#재치있음'] },
  ISFP: { hook: '조용하지만 취향은 선명한 날', detail: '크게 드러내기보다 내 감각과 기분을 더 섬세하게 따랐어요.', boast: '말보다 분위기와 감각으로 기억되는 타입', tags: ['#취향선명', '#감각중심', '#조용한매력'] },
  ESFP: { hook: '지금 이 분위기를 제일 잘 즐기는 날', detail: '계획보다 현장감과 재미가 더 크게 움직이는 흐름이었어요.', boast: '있는 자리의 온도를 바로 끌어올리는 타입', tags: ['#현장텐션', '#분위기상승', '#재미우선'] },
  ISTP: { hook: '필요할 때 제일 정확해지는 날', detail: '말을 늘리기보다 상황을 보고 바로 움직이는 쪽이 더 편했어요.', boast: '감정 과잉 없이 핵심만 딱 잡아내는 타입', tags: ['#실전형', '#군더더기없음', '#핵심파악'] },
  ESTP: { hook: '순간 판단이 유난히 빠른 날', detail: '생각보다 몸이 먼저 반응하고, 선택도 가볍게 이어졌어요.', boast: '망설임보다 액션이 먼저 나오는 타입', tags: ['#반응빠름', '#액션모드', '#현장강자'] },
  ISFJ: { hook: '티 안 나게 다 챙기고 싶은 날', detail: '눈에 띄는 것보다 놓치는 사람 없게 챙기는 흐름이 강했어요.', boast: '조용히 움직이는데 체감 존재감은 확실한 타입', tags: ['#조용한배려', '#안정감', '#든든함'] },
  ESFJ: { hook: '분위기와 사람을 같이 끌어안는 날', detail: '혼자 빛나기보다 다 같이 편한 흐름을 더 만들고 싶어졌어요.', boast: '따뜻함으로 판을 정리하는 관계 중심 타입', tags: ['#분위기케어', '#관계중심', '#다정리더'] },
  ISTJ: { hook: '기준이 유난히 단단한 날', detail: '감정보다 익숙한 원칙과 정리된 흐름 쪽이 더 믿음직했어요.', boast: '조용하지만 무너지지 않는 기준점 같은 타입', tags: ['#기준단단', '#안정적', '#신뢰감'] },
  ESTJ: { hook: '정리와 추진이 같이 되는 날', detail: '애매하게 두기보다 결론 내리고 움직이는 쪽이 더 시원했어요.', boast: '판을 정리하면서 속도까지 챙기는 실행형 타입', tags: ['#정리본능', '#속도감', '#실행캐릭터'] }
};

export const getShareVibeStamp = (mbti, spectrum) => {
  const strongestAxis = [...spectrum].sort((a, b) => b.intensity - a.intensity)[0];
  const strongestTagMap = {
    E: '밖으로 뻗는 에너지',
    I: '혼자일수록 선명한 무드',
    S: '현실 감각이 또렷한 날',
    N: '직감이 앞서는 날',
    T: '판단이 빠른 흐름',
    F: '감정 온도가 높은 날',
    J: '정리력이 강한 하루',
    P: '유연함이 빛나는 하루'
  };
  return strongestTagMap[strongestAxis?.dominantType] || `${mbti} 무드 스냅샷`;
};

export const getShareCardCopy = (mbti, spectrum, badges, info, percent, presentation = null) => {
  const shareMoodLine = getShareMoodLine(mbti, info, percent);
  const shareHeadline = getShareHeadline(mbti, info, percent);
  const shareSummaryShort = getShareSummaryShort(spectrum);
  const shareHook = SHARE_HOOKS[mbti] || `${mbti} 무드가 또렷한 타입`;
  const baseCopy = SHARE_CARD_COPY[mbti] || {
    hook: shareHook,
    detail: shareSummaryShort,
    boast: shareMoodLine,
    tags: badges.slice(0, 3).map((badge) => `#${badge}`)
  };
  const presentationCopy = presentation
    ? {
        hook: presentation.hook,
        detail: presentation.detail,
        boast: presentation.boast,
        tags: [...presentation.tags, ...baseCopy.tags].slice(0, 4)
      }
    : baseCopy;

  return {
    shareMoodLine,
    shareHeadline,
    shareSummaryShort,
    shareHook,
    shareVibeStamp: presentation?.stamp || getShareVibeStamp(mbti, spectrum),
    shareCardCopy: presentationCopy
  };
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

export const getRecentFlowSummary = (effectiveHistory, fallbackMbti = '') => {
  const recent = effectiveHistory.slice(0, 5);
  const flow = recent.map((item) => item.mbti).filter(Boolean);

  if (!flow.length) {
    return {
      chips: fallbackMbti ? [fallbackMbti] : [],
      note: '기록이 더 쌓이면 최근 흐름을 한눈에 읽기 쉬워져요.'
    };
  }

  const uniqueCount = new Set(flow).size;
  const note = uniqueCount === 1
    ? `최근 ${flow.length}번은 ${flow[0]} 흐름이 이어졌어요. 같은 결과 안의 미세한 차이를 보기 좋은 상태예요.`
    : `최근 ${flow.length}번 안에서 ${uniqueCount}가지 흐름이 보였어요. 지금은 작은 변화가 잘 드러나는 구간이에요.`;

  return {
    chips: flow,
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
    return '결과는 이어지고 있지만 강한 축과 문구 분위기는 달라질 수 있어요. 같은 MBTI 안의 결 차이를 보기 좋은 타이밍이에요.';
  }

  return '다시 해보면 완전히 다른 결과보다, 오늘 더 강했던 축이 유지되는지부터 비교해보면 좋아요.';
};

export const buildResultViewModel = ({
  scores,
  historyData,
  currentEntry,
  userName,
  defaultUserName,
  neutralCount = 0,
  usedFollowup = false
}) => {
  const { mbti, info, badges, percent, spectrum, boundaryAxes } = computeResult(scores);
  const axisNarratives = getAxisNarratives(spectrum);
  const strongestAxis = [...axisNarratives].sort((a, b) => b.intensity - a.intensity)[0];
  const currentHistoryEntry = {
    ...currentEntry,
    mbti,
    percent,
    axes: spectrum.map(toHistoryAxisSnapshot)
  };
  const effectiveHistory = getEffectiveHistory(currentHistoryEntry, historyData);
  const historyComparison = getHistoryComparison(mbti, effectiveHistory);
  const axisChanges = getAxisChangeDetails(mbti, effectiveHistory[1]?.mbti);
  const historyInsights = getHistoryInsights(effectiveHistory);
  const trendAnalysis = getTrendAnalysis(spectrum, effectiveHistory[1]?.axes);
  const presentation = getResultPresentation({
    mbti,
    spectrum,
    percent,
    historyInsights,
    historyComparison,
    createdAt: currentEntry?.createdAt
  });
  const { shareMoodLine, shareHeadline, shareCardCopy, shareVibeStamp } = getShareCardCopy(mbti, spectrum, badges, info, percent, presentation);
  const neutralReviewNote = neutralCount > 0
    ? usedFollowup
      ? '애매했던 축은 추가 질문으로 다시 확인했어요.'
      : '애매했던 답변은 결과 해석에 참고했어요.'
    : '';

  return {
    mbti,
    info,
    badges,
    percent,
    spectrum,
    boundaryAxes,
    axisNarratives,
    strongestAxis,
    summaryCopy: getResultSummary(mbti, spectrum, percent),
    consistencyCopy: getConsistencyCopy(percent, boundaryAxes),
    boundaryCopy: getBoundaryCopy(boundaryAxes),
    compCopy: getCompatibilityCopy(mbti),
    effectiveHistory,
    historyComparison,
    axisChanges,
    historyInsights,
    trendAnalysis,
    displayName: getDisplayName(userName, defaultUserName),
    retestPrompt: getRetestPrompt(boundaryAxes, historyInsights),
    recentFlowSummary: getRecentFlowSummary(effectiveHistory, mbti),
    revisitInsight: getRevisitInsight({ historyComparison, historyInsights, boundaryAxes, presentation }),
    presentation,
    shareMoodLine,
    shareHeadline,
    shareCardCopy,
    shareVibeStamp,
    neutralReviewNote,
    topChangeChip: axisChanges[0]
      ? `${axisChanges[0].pair} ${axisChanges[0].before}→${axisChanges[0].after}`
      : trendAnalysis?.title || '오늘 흐름이 제일 강했던 축'
  };
};
