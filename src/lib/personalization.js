/**
 * M3: 나이/성별 기반 개인화 모듈
 * - 생년월일에서 나이 자동 계산
 * - 확장된 연령 구간 (어린이 ~ 50대 이상)
 * - 질문 톤앤매너 조정
 * - 결과 해석 맥락 반영
 */

/**
 * 생년월일에서 나이 계산
 */
export const calculateAge = (birthDate) => {
  if (!birthDate || !birthDate.year) return null;
  const today = new Date();
  const birthYear = birthDate.year;
  const birthMonth = birthDate.month || 1;
  const birthDay = birthDate.day || 1;

  let age = today.getFullYear() - birthYear;
  const monthDiff = today.getMonth() + 1 - birthMonth;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDay)) {
    age--;
  }
  return age;
};

/**
 * 나이에서 연령 구간 키 매핑
 * ~12세: child, 13~18세: teen, 19~29세: 20s, 30~39세: 30s, 40~49세: 40s, 50+: 50s
 */
export const getAgeGroupKey = (age) => {
  if (age === null || age === undefined) return '';
  if (age <= 12) return 'child';
  if (age <= 18) return 'teen';
  if (age <= 29) return '20s';
  if (age <= 39) return '30s';
  if (age <= 49) return '40s';
  return '50s';
};

/**
 * 생년월일에서 연령 구간 키 직접 반환
 */
export const getAgeGroupFromBirthDate = (birthDate) => {
  const age = calculateAge(birthDate);
  return getAgeGroupKey(age);
};

/**
 * 연령대별 톤앤매너 설정 (확장)
 */
const TONE_CONFIG = {
  'child': {
    label: '어린이',
    style: 'playful',
    resultTone: 'fun',
    tempoMessages: [
      '느낌 가는 대로 골라봐! 🌟',
      '어려운 건 없어~ 그냥 느낌으로!',
      '잘하고 있어! 계속 가보자~',
      '좋아! 거의 다 왔어!',
      '마지막까지 화이팅! ✨',
      '멋지다! 조금만 더~',
      '거의 끝! 대단해!',
      '완전 잘하고 있어!'
    ]
  },
  'teen': {
    label: '10대',
    style: 'casual',
    resultTone: 'trendy',
    tempoMessages: [
      '편하게 골라봐~',
      '느낌 가는 대로 ㄱㄱ',
      '직감으로 슉슉!',
      '오늘 기분 그대로~',
      '생각 말고 느낌으로!',
      '가볍게 가볍게~',
      '거의 다 왔어!',
      '마지막 스퍼트~'
    ]
  },
  '20s': {
    label: '20대',
    style: 'friendly',
    resultTone: 'relatable',
    tempoMessages: [
      '지금 느낌 그대로 골라보세요',
      '정답 없으니 편하게!',
      '오늘 기분에 맞게~',
      '직감이 제일 정확해요',
      '생각보다 느낌으로!',
      '거의 다 왔어요!',
      '마지막까지 가볍게~',
      '곧 결과 나와요!'
    ]
  },
  '30s': {
    label: '30대',
    style: 'balanced',
    resultTone: 'insightful',
    tempoMessages: [
      '지금의 결대로 가볍게 골라보세요',
      '오늘 컨디션 그대로 반영해보세요',
      '직감을 따라가 보세요',
      '편하게 선택해주세요',
      '거의 마무리 단계예요',
      '오늘의 흐름이 보이기 시작해요',
      '마지막 질문들이에요',
      '곧 결과를 확인할 수 있어요'
    ]
  },
  '40s': {
    label: '40대',
    style: 'respectful',
    resultTone: 'thoughtful',
    tempoMessages: [
      '편하게 골라보세요',
      '오늘 느끼시는 그대로 선택해주세요',
      '직감을 따라가 보세요',
      '천천히 선택하셔도 괜찮아요',
      '거의 마무리 단계입니다',
      '오늘의 흐름이 보이기 시작합니다',
      '마지막 질문들입니다',
      '곧 결과를 확인하실 수 있어요'
    ]
  },
  '50s': {
    label: '50대 이상',
    style: 'polite',
    resultTone: 'warm',
    tempoMessages: [
      '편안하게 골라보세요',
      '느끼시는 그대로 선택해주시면 됩니다',
      '천천히 생각하셔도 좋습니다',
      '잘하고 계십니다',
      '거의 마무리 단계입니다',
      '오늘의 성향이 곧 나옵니다',
      '마지막 질문입니다',
      '곧 결과를 확인하실 수 있습니다'
    ]
  }
};

/**
 * 연령대에 맞는 템포 메시지 반환
 */
export const getPersonalizedTempoMessage = (ageGroup, index, total = 12, defaultMessage) => {
  const config = TONE_CONFIG[ageGroup];
  if (!config) return defaultMessage;
  const messages = config.tempoMessages;
  if (!messages.length) return defaultMessage;

  const safeTotal = Math.max(1, Number(total) || 1);
  const current = Math.min(Math.max(1, index + 1), safeTotal);
  const progress = current / safeTotal;
  const lastIndex = messages.length - 1;
  const lastNonFinalIndex = Math.max(0, lastIndex - 2);
  const finalMessageIndex = messages.findLastIndex((message) => /마지막 선택|마지막 질문/.test(message));
  const safeFinalIndex = finalMessageIndex >= 0 ? finalMessageIndex : lastIndex;

  if (current >= safeTotal) return messages[safeFinalIndex] || defaultMessage;
  if (current === safeTotal - 1) {
    const penultimateIndex = safeFinalIndex === lastIndex ? Math.max(0, lastIndex - 1) : lastIndex;
    return messages[penultimateIndex] || defaultMessage;
  }

  if (progress < 0.3) {
    return messages[Math.min(index, 2)] || defaultMessage;
  }

  if (progress < 0.5) {
    return messages[Math.min(3, lastIndex)] || defaultMessage;
  }

  if (progress < 0.75) {
    return messages[Math.min(Math.max(4, Math.floor(messages.length * 0.55)), lastNonFinalIndex)] || defaultMessage;
  }

  return messages[Math.min(Math.max(5, Math.floor(messages.length * 0.72)), lastNonFinalIndex)] || defaultMessage;
};

/**
 * 결과 해석에 연령대/성별 맥락 반영
 */
export const getPersonalizedResultContext = (ageGroup, gender, mbti, percent) => {
  const ageConfig = TONE_CONFIG[ageGroup];
  if (!ageConfig) return null;

  const contexts = {
    'child': {
      intro: `오늘은 ${mbti} 느낌이 ${percent >= 80 ? '아주 강하게' : '살짝'} 나왔어!`,
      advice: getChildAdvice(mbti, gender),
      tone: '재미있는'
    },
    'teen': {
      intro: `요즘 ${mbti} 바이브가 강하게 나오고 있어!`,
      advice: getTeenAdvice(mbti, gender),
      tone: '트렌디'
    },
    '20s': {
      intro: `오늘은 ${mbti} 에너지가 ${percent >= 80 ? '확실하게' : '은근히'} 나왔어요.`,
      advice: getTwentiesAdvice(mbti, gender),
      tone: '공감형'
    },
    '30s': {
      intro: `오늘의 성향 흐름은 ${mbti} 쪽으로 ${percent >= 80 ? '또렷하게' : '조금 더'} 기울었습니다.`,
      advice: getThirtiesAdvice(mbti, gender),
      tone: '인사이트'
    },
    '40s': {
      intro: `오늘은 ${mbti} 성향이 ${percent >= 80 ? '분명하게' : '자연스럽게'} 드러났습니다.`,
      advice: getFortiesAdvice(mbti, gender),
      tone: '사려깊음'
    },
    '50s': {
      intro: `오늘은 ${mbti} 성향이 ${percent >= 80 ? '뚜렷하게' : '편안하게'} 나타났습니다.`,
      advice: getFiftiesAdvice(mbti, gender),
      tone: '따뜻함'
    }
  };

  return contexts[ageGroup] || null;
};

function getChildAdvice(mbti, gender) {
  const firstLetter = mbti[0];
  if (firstLetter === 'E') return '오늘은 친구들이랑 놀면 더 신나는 날이야!';
  return '오늘은 혼자 좋아하는 거 하면 기분이 더 좋아지는 날이야!';
}

function getTeenAdvice(mbti, gender) {
  const firstLetter = mbti[0];
  if (firstLetter === 'E') return '친구들 사이에서 분위기 메이커 역할이 잘 맞는 날이야!';
  return '혼자만의 시간이 오히려 에너지를 채워주는 날이야!';
}

function getTwentiesAdvice(mbti, gender) {
  const firstLetter = mbti[0];
  if (firstLetter === 'E') return '오늘은 사람들과 함께할 때 에너지가 더 올라가는 흐름이에요.';
  return '오늘은 나만의 공간에서 충전하는 게 더 맞는 흐름이에요.';
}

function getThirtiesAdvice(mbti, gender) {
  const thirdLetter = mbti[2];
  if (thirdLetter === 'T') return '오늘은 논리적 판단이 더 선명한 날입니다. 중요한 결정이 있다면 지금이 좋을 수 있어요.';
  return '오늘은 감정의 온도가 높은 날입니다. 주변 사람들과의 관계에서 따뜻함이 더 잘 전달될 수 있어요.';
}

function getFortiesAdvice(mbti, gender) {
  const fourthLetter = mbti[3];
  if (fourthLetter === 'J') return '오늘은 계획대로 움직이는 것이 마음 편한 날입니다. 정리하고 싶은 일이 있다면 지금 시작해보세요.';
  return '오늘은 유연하게 흐름을 타는 것이 더 자연스러운 날입니다. 여유를 가져보세요.';
}

function getFiftiesAdvice(mbti, gender) {
  const fourthLetter = mbti[3];
  if (fourthLetter === 'J') return '오늘은 차분하게 계획을 세우고 실행하기 좋은 날입니다. 마음이 가는 일부터 시작해보세요.';
  return '오늘은 흐름에 맡기며 여유롭게 보내기 좋은 날입니다. 무리하지 마세요.';
}

/**
 * 공유 텍스트에 연령대 맥락 추가
 */
export const getPersonalizedShareSuffix = (ageGroup) => {
  const suffixes = {
    'child': '나도 해보기! ✨',
    'teen': '🔥 나도 해보기 →',
    '20s': '나도 오늘의 MBTI 확인하기 →',
    '30s': '나의 오늘 성향도 확인해보세요 →',
    '40s': '나의 성향도 확인해보세요 →',
    '50s': '나의 성향도 확인해보세요 →'
  };
  return suffixes[ageGroup] || '나도 해보기 →';
};

const AGE_CONTEXT_HINTS = {
  common: {
    action: '오늘은 큰 결론보다 바로 할 수 있는 작은 선택 하나를 정해보면 좋아요.',
    relationship: '관계에서는 정답을 찾기보다, 내가 편한 거리와 상대의 속도를 같이 보는 게 도움이 됩니다.',
    recovery: '쉬는 시간을 미루지 마세요. 잠깐 멈춰야 다음 선택도 더 편해져요.',
    tomorrow: '다음에 다시 보면 같은 MBTI 안에서도 어떤 생활 장면이 달라졌는지 비교해보세요.'
  },
  child: {
    action: '오늘은 잘하려고 애쓰기보다, 편한 선택 하나를 골라보는 것만으로도 충분해요.',
    relationship: '친구나 가족에게는 “나는 이게 좋아”처럼 짧게 말해도 마음이 잘 전해질 수 있어요.',
    recovery: '좋아하는 놀이와 조용한 쉬는 시간을 하나씩 챙기면 마음이 더 편안해져요.',
    tomorrow: '내일 다시 보면 오늘과 비슷한 선택을 하는지 가볍게 비교해보세요.'
  },
  teen: {
    action: '오늘은 반응을 잘하려고 애쓰기보다, 내 기준 하나를 작게 정해보면 좋아요.',
    relationship: '친구 사이에서는 바로 결론 내기보다 “나는 이렇게 느꼈어”처럼 짧게 말해도 충분해요.',
    recovery: '알림을 잠깐 내려놓고 좋아하는 것 하나에 집중해보세요. 마음이 천천히 가라앉을 수 있어요.',
    tomorrow: '다음에 다시 보면 친구나 학교 장면에서 내 반응이 오늘과 비슷한지 비교해보세요.'
  },
  '20s': {
    action: '오늘은 큰 결론보다 바로 해볼 수 있는 작은 선택 하나가 리듬을 살려줘요.',
    relationship: '관계에서는 상대의 답을 맞히려 하기보다, 지금 내 여유가 어느 정도인지 먼저 알려주는 쪽이 덜 지칩니다.',
    recovery: '쉬는 시간을 남는 시간으로 두지 말고, 오늘 일정 안에 작게 넣어보세요.',
    tomorrow: '다음에는 일, 관계, 휴식 중 어디에서 성향이 가장 먼저 드러나는지 비교해보세요.'
  },
  '30s': {
    action: '오늘은 결정할 것을 줄이고, 정말 중요한 한 가지에 판단력을 아껴두면 좋습니다.',
    relationship: '관계에서는 좋은 사람 모드만 켜두기보다, 가능한 범위를 부드럽게 말해보세요.',
    recovery: '회복은 보상보다 정비에 가까워요. 오늘 쌓인 일을 하나만 덜어도 충분합니다.',
    tomorrow: '다음에 다시 보면 부담이 줄었을 때 같은 성향이 더 선명해지는지 확인해보세요.'
  },
  '40s': {
    action: '오늘은 역할을 다 해내는 것보다, 꼭 직접 해야 할 일과 맡겨도 되는 일을 나눠보세요.',
    relationship: '관계에서는 설명을 길게 하기보다, 원하는 거리와 온도를 차분히 맞추는 게 효과적이에요.',
    recovery: '쉬는 것도 책임감 있게 해도 됩니다. 오늘은 무리하지 않는 쪽이 꽤 생산적인 선택이에요.',
    tomorrow: '다음에는 생활이 조금 안정된 날, 판단과 유연함 중 어느 쪽이 더 편한지 비교해보세요.'
  },
  '50s': {
    action: '오늘은 속도를 더 내기보다, 내 페이스에 맞는 순서를 고르는 것이 힘을 오래 남깁니다.',
    relationship: '관계에서는 다 챙기려 하기보다, 편안하게 오래 갈 수 있는 온도를 지키는 게 좋아요.',
    recovery: '충분히 쉬는 일에도 품격이 있습니다. 오늘은 마음이 조용해지는 쪽을 먼저 두세요.',
    tomorrow: '다음에 다시 보면 충분히 쉰 뒤에도 같은 성향이 유지되는지 차분히 비교해볼 수 있어요.'
  }
};

const AXIS_HINTS = {
  E: {
    action: '사람을 만나야 한다면 짧고 즐거운 연결부터 시작해보세요.',
    relationship: '대화를 열되, 상대의 속도도 같이 보는 게 오늘의 센스예요.',
    recovery: '혼자 쉬더라도 좋아하는 사람과 짧게 연결되면 회복이 더 쉬울 수 있어요.'
  },
  I: {
    action: '혼자 정리할 시간을 먼저 확보하면 나머지 선택이 덜 흔들려요.',
    relationship: '바로 답하지 않아도 괜찮아요. 대신 늦더라도 진짜 문장을 보내면 충분합니다.',
    recovery: '오늘은 조용한 공간에서 혼자 쉬는 시간이 회복에 잘 맞을 수 있어요.'
  },
  S: {
    action: '큰 계획보다 바로 보이는 한 단계를 처리하면 안정감이 올라와요.',
    relationship: '구체적으로 무엇이 필요했는지 물어보면 오해가 줄어듭니다.',
    recovery: '눈에 보이는 정리 하나가 마음 정리까지 데려올 수 있어요.'
  },
  N: {
    action: '떠오른 가능성을 하나만 메모해두세요. 오늘의 아이디어가 내일 길이 될 수 있어요.',
    relationship: '상대의 말 뒤에 있는 맥락을 읽되, 확인 질문도 한 번 곁들이면 좋아요.',
    recovery: '생각이 너무 많아졌다면, 오늘은 중요한 생각 한두 개만 적어두고 쉬어도 충분합니다.'
  },
  T: {
    action: '판단 기준을 한 줄로 적어두면 오늘의 선택이 훨씬 가벼워져요.',
    relationship: '정확한 말이 필요해도, 시작은 조금 부드러워도 괜찮습니다.',
    recovery: '해결할 수 있는 일과 지금은 내려놓을 일을 나누면 마음이 덜 복잡해져요.'
  },
  F: {
    action: '마음을 너무 많이 읽느라 지치기 전에, 내 마음도 한 번 체크해보세요.',
    relationship: '다정함은 유지하되, 오늘 가능한 범위는 분명히 알려주는 게 좋아요.',
    recovery: '감정 온도가 높았다면 따뜻한 것 하나와 조용한 시간 하나를 챙겨보세요.'
  },
  J: {
    action: '오늘은 목록을 다 끝내기보다 가장 중요한 체크 하나만 확실히 해도 좋아요.',
    relationship: '계획이 바뀌어도 실패가 아니라 재정렬입니다. 캘린더와 짧은 평화협정을 맺어보세요.',
    recovery: '쉬는 시간도 일정으로 인정하면 마음이 덜 조급해져요.'
  },
  P: {
    action: '흐름을 타되, 끝낼 기준 하나만 정해두면 오늘의 자유가 더 오래 갑니다.',
    relationship: '즉흥적으로 반응해도 좋지만, 중요한 약속은 한 번만 더 확인해보세요.',
    recovery: '새로운 자극이 회복이 될 수 있어요. 다만 중간에 내 체력이 괜찮은지도 한 번 확인해보세요.'
  }
};

const LIFE_TAG_HINTS = {
  relationship: {
    label: '관계 온도',
    action: '오늘은 맞는 말을 찾기보다, 서로 편한 말의 온도를 맞추는 쪽이 더 도움이 될 수 있어요.'
  },
  rest_recovery: {
    label: '회복 루틴',
    action: '오늘은 회복을 뒤로 미루지 않는 게 중요해요. 짧게 쉬어도 리듬이 달라질 수 있습니다.'
  },
  work_study: {
    label: '일/학습 리듬',
    action: '오늘은 시작 장벽을 낮추는 게 핵심이에요. 10분짜리 첫 칸이면 충분합니다.'
  },
  self_growth: {
    label: '성장 감각',
    action: '오늘 떠오른 가능성은 크게 결심하지 말고 작게 실험해보세요.'
  },
  unexpected: {
    label: '예상 밖 상황',
    action: '예상 밖 변수가 생긴 날은 완벽한 선택보다 다시 회복할 수 있는 선택이 더 좋습니다.'
  },
  emotion_check: {
    label: '감정 점검',
    action: '오늘 마음이 유난히 신경 쓰였다면, 넘기기보다 무엇 때문인지 짧게 확인해보세요.'
  },
  daily_choice: {
    label: '일상 선택',
    action: '오늘 반복되는 작은 선택이 지금의 성향을 가장 솔직하게 보여줘요.'
  }
};

export const getDailyResultHints = ({
  ageGroup = '',
  strongestAxis = null,
  questionContextSummary = null,
  boundaryAxes = [],
  historyComparison = null,
  historyInsights = null,
  presentation = null
} = {}) => {
  const ageHints = AGE_CONTEXT_HINTS[ageGroup] || AGE_CONTEXT_HINTS.common;
  const dominant = strongestAxis?.dominantType || '';
  const axisHints = AXIS_HINTS[dominant] || {};
  const topLifeTag = questionContextSummary?.topLifeTag || 'daily_choice';
  const lifeHint = LIFE_TAG_HINTS[topLifeTag] || LIFE_TAG_HINTS.daily_choice;
  const hasShift = historyComparison?.title?.includes('달라졌어요');
  const hasBoundary = boundaryAxes.length > 0;
  const stableCount = historyInsights?.stableCount || 0;

  const actionLead = hasShift
    ? '오늘은 달라진 축이 보였으니, 평소처럼 넘기던 선택을 한 번만 천천히 봐도 좋아요.'
    : stableCount >= 2
      ? `같은 결과가 이어져도 오늘은 ${lifeHint.label} 쪽 결이 달라질 수 있어요.`
      : lifeHint.action;

  const tomorrowCheckPoint = hasBoundary
    ? `다음에 다시 볼 때는 ${boundaryAxes.map((axis) => `${axis.left}/${axis.right}`).join(', ')} 축이 유지되는지 확인해보세요. 오늘 컨디션에 따라 달라질 수 있는 부분이에요.`
    : presentation?.state === 'streak'
      ? '다음에는 같은 MBTI가 나오더라도 어떤 생활 장면에서 더 강하게 느껴지는지 비교해보세요.'
      : ageHints.tomorrow;

  return {
    dailyAction: `${actionLead} ${axisHints.action || ageHints.action}`,
    relationshipHint: axisHints.relationship || ageHints.relationship,
    recoveryHint: axisHints.recovery || ageHints.recovery,
    tomorrowCheckPoint
  };
};
