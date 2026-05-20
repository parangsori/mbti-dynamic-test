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

const HINT_VARIANTS = {
  shiftLead: [
    '오늘은 달라진 축이 보였어요. 평소처럼 넘기던 선택을 한 번만 천천히 봐도 좋아요.',
    '오늘 답변에는 작은 방향 전환이 있었어요. 급히 결론 내리기보다 달라진 장면 하나를 기억해두세요.',
    '이전과 다른 결이 살짝 보인 날이에요. 오늘 바뀐 선택이 어디서 나왔는지 가볍게 짚어보면 좋아요.'
  ],
  stableLead: [
    (label) => `같은 결과가 이어져도 오늘은 ${label} 쪽 결이 달라질 수 있어요.`,
    (label) => `MBTI는 같아도 오늘은 ${label} 장면에서 다른 표정이 보일 수 있어요.`,
    (label) => `반복되는 결과 안에서도 오늘은 ${label} 쪽 생활 신호를 눈여겨보면 좋아요.`
  ],
  boundaryTomorrow: [
    (axes) => `다음에 다시 볼 때는 ${axes} 축이 유지되는지 확인해보세요. 오늘 컨디션에 따라 달라질 수 있는 부분이에요.`,
    (axes) => `다음 테스트에서는 ${axes} 축이 어느 쪽으로 기우는지 비교해보세요. 지금은 유연하게 흔들릴 수 있는 지점이에요.`,
    (axes) => `다음에는 ${axes} 축에서 같은 선택이 반복되는지 보세요. 오늘의 애매함도 꽤 중요한 힌트입니다.`
  ],
  streakTomorrow: [
    '다음에는 같은 MBTI가 나오더라도 어떤 생활 장면에서 더 강하게 느껴지는지 비교해보세요.',
    '다음에 또 같은 결과가 나오면, 오늘과 달리 어떤 문항에서 더 확신했는지 살펴보세요.',
    '같은 타입이 반복된다면 다음에는 관계, 회복, 선택 중 어디가 제일 달라졌는지 비교해보세요.'
  ],
  lifeAction: {
    relationship: [
      '오늘은 맞는 말을 찾기보다, 서로 편한 말의 온도를 맞추는 쪽이 더 도움이 될 수 있어요.',
      '관계 장면이 크게 보인 날이에요. 오늘은 답보다 말의 속도를 조금 낮춰보는 게 좋습니다.',
      '사람 사이의 온도가 중요한 날이에요. 먼저 다가갈지, 한 박자 둘지 정해두면 덜 흔들려요.'
    ],
    rest_recovery: [
      '오늘은 회복을 뒤로 미루지 않는 게 중요해요. 짧게 쉬어도 리듬이 달라질 수 있습니다.',
      '몸과 마음의 충전 신호가 보였어요. 오늘은 쉬는 일을 할 일 목록 맨 아래에 두지 마세요.',
      '회복이 필요한 날일 수 있어요. 긴 휴식이 어렵다면 조용한 10분부터 챙겨도 충분합니다.'
    ],
    work_study: [
      '오늘은 시작 장벽을 낮추는 게 핵심이에요. 10분짜리 첫 칸이면 충분합니다.',
      '일이나 공부 쪽 리듬이 드러난 날이에요. 완벽한 몰입보다 첫 움직임을 작게 만드는 게 좋아요.',
      '해야 할 일이 크게 보이면, 오늘은 가장 작은 단위 하나만 끝내도 흐름이 살아납니다.'
    ],
    self_growth: [
      '오늘 떠오른 가능성은 크게 결심하지 말고 작게 실험해보세요.',
      '성장 쪽 감각이 보인 날이에요. 새 결심보다 오늘 바로 해볼 수 있는 작은 시도가 더 잘 맞습니다.',
      '새로운 방향이 살짝 고개를 들었어요. 이름 붙이기보다 한 번 해보는 쪽이 오늘은 더 유익합니다.'
    ],
    unexpected: [
      '예상 밖 변수가 생긴 날은 완벽한 선택보다 다시 회복할 수 있는 선택이 더 좋습니다.',
      '변수에 반응하는 방식이 보였어요. 오늘은 정답보다 다음 선택으로 넘어갈 힘을 남겨두세요.',
      '뜻밖의 상황 앞에서는 크게 결론 내리지 않아도 됩니다. 다시 잡을 수 있는 여지만 있어도 충분해요.'
    ],
    emotion_check: [
      '오늘 마음이 유난히 신경 쓰였다면, 넘기기보다 무엇 때문인지 짧게 확인해보세요.',
      '감정 신호가 살짝 크게 잡힌 날이에요. 좋다/싫다보다 어디서 그렇게 느꼈는지 한 번만 봐도 좋아요.',
      '마음의 알림이 켜진 날일 수 있어요. 오늘은 무시하기보다 짧게 이름 붙여주는 쪽이 낫습니다.'
    ],
    daily_choice: [
      '오늘 반복되는 작은 선택이 지금의 성향을 가장 솔직하게 보여줘요.',
      '큰 사건보다 사소한 선택에서 오늘의 결이 잘 보였어요. 작은 선택 하나를 의식해보세요.',
      '평범한 장면 안에서 성향이 드러난 날이에요. 오늘은 늘 하던 선택을 한 번만 다르게 봐도 좋습니다.'
    ]
  },
  lifeRelationship: {
    relationship: [
      '상대의 마음을 맞히려 하기보다, 오늘은 내가 원하는 반응 속도를 먼저 정해도 좋아요.',
      '대화가 길어질수록 결론보다 온도가 더 중요해질 수 있어요. 한 문장만 부드럽게 덧붙여보세요.',
      '관계의 흐름이 크게 보인 날에는 가까워지는 것만큼 적당히 멈추는 감각도 도움이 됩니다.'
    ],
    rest_recovery: [
      '지친 날의 관계는 친절함보다 여유가 먼저예요. 답을 늦게 해도 괜찮다는 기준을 세워보세요.',
      '회복이 필요한 날에는 사람을 피한다기보다, 오늘 감당 가능한 거리만 남기는 쪽이 좋아요.',
      '누군가를 챙기고 싶어도 내 충전 상태를 먼저 확인하면 관계가 덜 버거워집니다.'
    ],
    work_study: [
      '일이나 공부 얘기에서는 정확한 공유가 관계의 피로를 줄여줄 수 있어요.',
      '해야 할 일이 많을수록 부탁과 거절을 짧게 말하는 연습이 도움이 됩니다.',
      '협업이나 과제 장면에서는 좋은 태도보다 가능한 범위를 분명히 말하는 게 더 다정할 수 있어요.'
    ],
    self_growth: [
      '새로운 시도를 말할 때는 크게 선언하지 않아도 됩니다. 작은 실험이라고 말하면 부담이 줄어요.',
      '관계 속에서 성장하려면 잘 보이는 것보다 솔직하게 조율하는 쪽이 오래 갑니다.',
      '오늘 떠오른 방향은 누군가의 반응보다 내 마음이 계속 가는지 먼저 보는 게 좋아요.'
    ],
    unexpected: [
      '예상 밖 상황에서는 바로 설명하기보다 잠깐 정리한 뒤 말하는 편이 오해를 줄입니다.',
      '변수가 생겼을 때는 누가 맞는지보다 지금 무엇을 다시 맞출지가 더 중요할 수 있어요.',
      '갑작스러운 흐름 앞에서는 한 박자 쉬고 반응해도 관계가 크게 무너지지 않습니다.'
    ],
    emotion_check: [
      '감정이 크게 잡힌 날에는 상대의 의도보다 내가 어떤 지점에서 반응했는지 먼저 봐도 좋아요.',
      '오늘은 좋은 사람처럼 보이는 것보다 내 마음을 너무 숨기지 않는 쪽이 더 건강합니다.',
      '관계에서 마음이 쓰였다면 바로 결론 내리지 말고, 내 감정의 이름을 먼저 붙여보세요.'
    ],
    daily_choice: [
      '사소한 답장 하나에도 오늘의 거리감이 묻어날 수 있어요. 너무 잘하려고 애쓰지 않아도 됩니다.',
      '일상 관계에서는 큰 표현보다 꾸준히 편한 속도가 더 오래 남을 수 있어요.',
      '오늘은 상대를 맞히기보다 내가 편하게 유지할 수 있는 반응을 고르는 쪽이 좋습니다.'
    ]
  },
  lifeRecovery: {
    relationship: [
      '사람을 많이 살핀 날이라면 혼자 있는 시간을 벌칙이 아니라 정비 시간으로 둬도 좋아요.',
      '관계 피로가 남았다면 대화를 복기하기보다 몸이 편해지는 루틴 하나를 먼저 고르세요.',
      '오늘의 회복은 누군가와 더 이야기하는 것보다 조용히 내 편을 들어주는 시간에 가까울 수 있어요.'
    ],
    rest_recovery: [
      '회복 문항이 크게 보인 날에는 쉬는 시간을 “나중에”로 미루지 않는 게 제일 중요합니다.',
      '오늘은 휴식의 질보다 시작이 먼저예요. 짧게라도 끊어 쉬면 흐름이 달라질 수 있습니다.',
      '쉼이 필요하다는 신호를 봤다면, 오늘은 생산성보다 회복 가능성을 우선해도 됩니다.'
    ],
    work_study: [
      '해야 할 일이 많을수록 회복은 사치가 아니라 다음 집중을 위한 장치예요.',
      '머리가 꽉 찬 날에는 더 밀어붙이기보다 작은 완료 하나 뒤에 짧게 쉬는 편이 낫습니다.',
      '일이나 공부 리듬이 드러난 날에는 쉬는 구간까지 같이 설계해야 오래 갑니다.'
    ],
    self_growth: [
      '성장하려는 마음이 큰 날일수록, 쉬는 시간도 실험의 일부로 봐도 좋아요.',
      '새로운 시도 뒤에는 바로 평가하지 말고 흡수할 시간을 조금 남겨두세요.',
      '오늘은 더 잘하기보다 내가 계속 해볼 수 있는 속도를 찾는 게 회복에 가깝습니다.'
    ],
    unexpected: [
      '예상 밖 변수가 있었다면, 오늘 회복은 완벽한 마무리보다 다시 안정되는 쪽입니다.',
      '뜻밖의 상황을 지나온 날에는 아무 일 없던 척하기보다 긴장을 푸는 루틴이 필요해요.',
      '계획이 흔들린 날에는 마음도 같이 흔들릴 수 있어요. 오늘은 원래 속도로 돌아오는 데 집중해보세요.'
    ],
    emotion_check: [
      '감정이 진하게 남았다면 분석보다 진정이 먼저일 수 있어요. 따뜻한 것 하나를 곁에 두세요.',
      '마음의 알림이 켜진 날에는 자극을 더 넣기보다 조용히 낮추는 선택이 잘 맞습니다.',
      '오늘 회복은 감정을 정답으로 만들기보다, 충분히 지나가게 두는 쪽에 가까워요.'
    ],
    daily_choice: [
      '평범한 하루에도 피로는 쌓입니다. 오늘은 작은 쉼 하나를 일부러 끼워 넣어보세요.',
      '큰 문제가 없어도 쉬어도 됩니다. 회복은 사건이 생긴 뒤에만 필요한 게 아니에요.',
      '일상 선택이 많았던 날에는 아무것도 고르지 않는 시간도 꽤 좋은 회복입니다.'
    ]
  },
  axis: {
    E: {
      action: ['사람을 만나야 한다면 짧고 즐거운 연결부터 시작해보세요.', '오늘은 긴 만남보다 가벼운 연결 하나가 에너지를 살릴 수 있어요.', '말을 꺼내야 한다면 완벽한 타이밍보다 편한 첫마디가 더 좋습니다.'],
      relationship: ['대화를 열되, 상대의 속도도 같이 보는 게 오늘의 센스예요.', '먼저 분위기를 열어도 좋아요. 대신 상대가 따라올 여지도 남겨두세요.', '사람들과 있을 때 힘이 나는 날이어도, 모두의 온도가 같지는 않다는 점만 기억해두세요.'],
      recovery: ['혼자 쉬더라도 좋아하는 사람과 짧게 연결되면 회복이 더 쉬울 수 있어요.', '완전한 고립보다 반가운 사람과 짧은 연락이 더 편할 수 있어요.', '오늘 회복은 조용함과 연결감 사이의 적당한 지점에 있을 수 있습니다.']
    },
    I: {
      action: ['혼자 정리할 시간을 먼저 확보하면 나머지 선택이 덜 흔들려요.', '바로 반응하기보다 생각을 정리할 작은 틈을 먼저 챙겨보세요.', '오늘은 말하기 전에 마음속 초안을 한 번 만드는 쪽이 잘 맞을 수 있어요.'],
      relationship: ['바로 답하지 않아도 괜찮아요. 대신 늦더라도 진짜 문장을 보내면 충분합니다.', '거리두기가 무심함은 아니에요. 필요한 만큼 천천히 답해도 괜찮습니다.', '관계에서는 속도보다 진심의 밀도가 더 중요하게 느껴질 수 있어요.'],
      recovery: ['오늘은 조용한 공간에서 혼자 쉬는 시간이 회복에 잘 맞을 수 있어요.', '회복하려면 소음을 줄이는 선택부터 해보세요. 마음이 생각보다 빨리 가라앉을 수 있습니다.', '혼자 있는 시간이 길어져도 괜찮아요. 오늘은 정리되는 느낌이 먼저일 수 있습니다.']
    },
    T: {
      action: ['판단 기준을 한 줄로 적어두면 오늘의 선택이 훨씬 가벼워져요.', '결정을 미루기 어렵다면 기준 하나만 먼저 세워보세요.', '오늘은 감으로 밀기보다 판단 기준을 짧게 적어두는 쪽이 편합니다.'],
      relationship: ['정확한 말이 필요해도, 시작은 조금 부드러워도 괜찮습니다.', '맞는 말을 하더라도 상대가 받을 수 있는 순서로 말하면 더 잘 닿습니다.', '논리를 내려놓을 필요는 없어요. 다만 첫 문장만 조금 따뜻하게 시작해보세요.'],
      recovery: ['해결할 수 있는 일과 지금은 내려놓을 일을 나누면 마음이 덜 복잡해져요.', '머릿속 문제가 많다면 지금 풀 문제와 나중 문제를 나누는 것부터 해보세요.', '회복도 정리가 필요할 수 있어요. 오늘은 처리할 일보다 내려놓을 일을 먼저 고르세요.']
    },
    F: {
      action: ['마음을 너무 많이 읽느라 지치기 전에, 내 마음도 한 번 체크해보세요.', '상대 마음을 챙기기 전에 오늘 내 여유가 어느 정도인지 먼저 확인해보세요.', '다정함을 쓰는 날일수록 내 마음 잔량도 같이 봐야 오래 갑니다.'],
      relationship: ['다정함은 유지하되, 오늘 가능한 범위는 분명히 알려주는 게 좋아요.', '상대를 배려하는 만큼 내 기준도 부드럽게 알려주면 관계가 덜 지칩니다.', '마음을 챙기는 능력은 장점이에요. 오늘은 내 경계선도 같이 챙겨보세요.'],
      recovery: ['감정 온도가 높았다면 따뜻한 것 하나와 조용한 시간 하나를 챙겨보세요.', '마음이 바빴던 날이라면 감정을 설명하려 애쓰기보다 먼저 몸을 편하게 해주세요.', '회복은 누군가를 더 이해하는 것보다 나를 덜 몰아붙이는 데서 시작될 수 있어요.']
    },
    S: {
      action: ['큰 계획보다 바로 보이는 한 단계를 처리하면 안정감이 올라와요.', '오늘은 추상적인 결론보다 눈앞의 단서 하나를 확인하는 쪽이 편할 수 있어요.', '머릿속 정리보다 주변의 작은 정리 하나가 먼저 힘을 줄 수 있습니다.'],
      relationship: ['구체적으로 무엇이 필요했는지 물어보면 오해가 줄어듭니다.', '관계에서도 느낌만 추측하기보다 실제로 들은 말과 필요한 행동을 나눠보면 좋아요.', '상대의 분위기를 읽되, 확인할 수 있는 사실 하나를 함께 보면 덜 흔들립니다.'],
      recovery: ['눈에 보이는 정리 하나가 마음 정리까지 데려올 수 있어요.', '오늘은 몸이 편해지는 익숙한 루틴이 생각보다 빠르게 안정감을 줄 수 있습니다.', '복잡한 생각보다 손으로 할 수 있는 작은 정리가 회복에 잘 맞을 수 있어요.']
    },
    N: {
      action: ['떠오른 가능성을 하나만 메모해두세요. 오늘의 아이디어가 내일 길이 될 수 있어요.', '큰 그림이 먼저 보인 날에는 바로 결론 내리기보다 가능성 하나를 작게 남겨두세요.', '오늘 떠오른 연결고리를 놓치지 않게 짧은 메모로 붙잡아두면 좋아요.'],
      relationship: ['상대의 말 뒤에 있는 맥락을 읽되, 확인 질문도 한 번 곁들이면 좋아요.', '관계에서는 의미를 깊게 읽는 힘이 있지만, 오늘은 상대에게 직접 확인하는 한마디도 도움이 됩니다.', '분위기 뒤의 이유를 상상했다면, 그중 하나만 부드럽게 물어보세요.'],
      recovery: ['생각이 너무 많아졌다면, 오늘은 중요한 생각 한두 개만 적어두고 쉬어도 충분합니다.', '상상이 계속 뻗어간다면 닫아야 할 생각과 내일 이어갈 생각을 나눠보세요.', '오늘 회복은 생각을 멈추는 것보다, 생각이 머물 자리를 정해주는 쪽일 수 있어요.']
    },
    J: {
      action: ['오늘은 목록을 다 끝내기보다 가장 중요한 체크 하나만 확실히 해도 좋아요.', '계획을 세우는 힘이 보인 날이에요. 다만 오늘은 여백 하나까지 일정에 넣어보세요.', '정리하고 싶은 마음이 강하다면, 끝낼 일보다 먼저 정할 기준 하나를 골라보세요.'],
      relationship: ['계획이 바뀌어도 실패가 아니라 재정렬입니다. 캘린더와 짧은 평화협정을 맺어보세요.', '관계에서는 미리 정해둔 기대가 어긋날 수 있어요. 오늘은 변경 가능성도 함께 열어두면 덜 피곤합니다.', '상대가 예상과 다르게 움직여도 바로 평가하기보다 새 기준으로 다시 맞춰보세요.'],
      recovery: ['쉬는 시간도 일정으로 인정하면 마음이 덜 조급해져요.', '회복을 즉흥에 맡기면 계속 밀릴 수 있어요. 오늘은 쉬는 시간도 작은 약속처럼 잡아보세요.', '정리가 잘 되는 날일수록, 쉬는 일도 완료해야 할 항목이 아니라 유지 장치로 봐주세요.']
    },
    P: {
      action: ['흐름을 타되, 끝낼 기준 하나만 정해두면 오늘의 자유가 더 오래 갑니다.', '유연하게 움직이는 힘이 보인 날이에요. 다만 시작과 끝 중 하나만 정해두면 덜 흩어집니다.', '오늘은 즉흥성을 살리되, 놓치면 안 되는 작은 기준 하나만 주머니에 넣어두세요.'],
      relationship: ['즉흥적으로 반응해도 좋지만, 중요한 약속은 한 번만 더 확인해보세요.', '관계에서도 편한 흐름이 장점이에요. 다만 상대가 기대하는 최소 기준은 확인하면 더 안정적입니다.', '갑자기 바꾸고 싶어진 마음이 있다면, 상대에게도 선택지를 남겨주는 방식이 좋습니다.'],
      recovery: ['새로운 자극이 회복이 될 수 있어요. 다만 중간에 내 체력이 괜찮은지도 한 번 확인해보세요.', '오늘 회복은 익숙한 쉼보다 가벼운 전환에서 올 수 있어요. 대신 너무 멀리 가지 않아도 됩니다.', '흐름을 바꾸는 일이 쉬는 방식이 될 수 있어요. 작은 산책이나 다른 음악처럼 부담 없는 변화가 좋습니다.']
    }
  },
  age: {
    common: {
      action: ['오늘은 큰 결론보다 바로 할 수 있는 작은 선택 하나를 정해보면 좋아요.', '오늘은 거창한 변화보다 지금 할 수 있는 한 가지가 더 잘 맞습니다.', '큰 방향을 정하기 어렵다면 오늘은 작은 선택 하나만 또렷하게 잡아도 충분해요.'],
      relationship: ['관계에서는 정답을 찾기보다, 내가 편한 거리와 상대의 속도를 같이 보는 게 도움이 됩니다.', '사람 사이에서는 맞는 말보다 편한 속도가 더 중요할 때가 있어요.', '오늘은 상대를 맞히려 하기보다 내가 편한 거리도 함께 살펴보세요.'],
      recovery: ['쉬는 시간을 미루지 마세요. 잠깐 멈춰야 다음 선택도 더 편해져요.', '회복은 남는 시간이 아니라 다음 선택을 위한 준비일 수 있어요.', '오늘은 잠깐 멈추는 일이 생각보다 생산적인 선택이 될 수 있습니다.'],
      tomorrow: ['다음에 다시 보면 같은 MBTI 안에서도 어떤 생활 장면이 달라졌는지 비교해보세요.', '다음에는 오늘과 다른 컨디션에서 같은 선택이 나오는지 비교해보세요.', '다음 테스트에서는 관계, 선택, 회복 중 어느 쪽이 가장 달라지는지 봐도 좋아요.']
    },
    teen: {
      action: ['오늘은 반응을 잘하려고 애쓰기보다, 내 기준 하나를 작게 정해보면 좋아요.', '오늘은 모두에게 맞추기보다 내가 편한 선택 하나를 먼저 알아차려보세요.', '친구나 학교 장면에서 마음이 흔들렸다면, 오늘은 내 속도 하나만 지켜도 충분해요.'],
      relationship: ['친구 사이에서는 바로 결론 내기보다 “나는 이렇게 느꼈어”처럼 짧게 말해도 충분해요.', '관계에서는 센 척보다 솔직한 한마디가 더 오래 남을 수 있어요.', '친구 반응을 너무 빨리 판단하지 말고, 내 기분도 같이 확인해보세요.'],
      recovery: ['알림을 잠깐 내려놓고 좋아하는 것 하나에 집중해보세요. 마음이 천천히 가라앉을 수 있어요.', '오늘은 화면을 잠깐 내려놓고, 좋아하는 노래나 산책처럼 쉬운 회복을 골라도 좋아요.', '마음이 복잡하면 바로 해결하지 않아도 됩니다. 잠깐 멈추는 것도 꽤 좋은 선택이에요.'],
      tomorrow: ['다음에 다시 보면 친구나 학교 장면에서 내 반응이 오늘과 비슷한지 비교해보세요.', '다음 테스트에서는 친구, 공부, 쉬는 시간 중 어디에서 가장 나답게 반응했는지 봐도 좋아요.', '다음에는 오늘보다 마음이 가벼운 상태에서도 같은 선택을 하는지 비교해보세요.']
    },
    '20s': {
      action: ['오늘은 큰 결론보다 바로 해볼 수 있는 작은 선택 하나가 리듬을 살려줘요.', '탐색할 것이 많은 날에는 정답보다 작은 실험 하나가 더 현실적이에요.', '오늘은 완벽한 방향보다 지금 해볼 수 있는 한 가지를 고르는 쪽이 좋습니다.'],
      relationship: ['관계에서는 상대의 답을 맞히려 하기보다, 지금 내 여유가 어느 정도인지 먼저 알려주는 쪽이 덜 지칩니다.', '관계의 정답을 찾기보다 내 시간과 마음의 여유를 먼저 확인해보세요.', '좋은 사람이 되려 애쓰기 전에, 오늘 가능한 만큼만 반응해도 괜찮습니다.'],
      recovery: ['쉬는 시간을 남는 시간으로 두지 말고, 오늘 일정 안에 작게 넣어보세요.', '회복을 보상처럼 뒤로 미루면 더 지칠 수 있어요. 오늘은 작은 쉼을 먼저 배치해보세요.', '쉬는 것도 루틴입니다. 짧아도 미리 넣어두면 하루가 덜 흐트러져요.'],
      tomorrow: ['다음에는 일, 관계, 휴식 중 어디에서 성향이 가장 먼저 드러나는지 비교해보세요.', '다음 테스트에서는 진로, 관계, 루틴 중 어느 장면에서 답이 달라지는지 봐도 좋아요.', '다음에는 바쁜 날과 여유 있는 날의 선택 차이를 비교해보세요.']
    },
    '30s': {
      action: ['오늘은 결정할 것을 줄이고, 정말 중요한 한 가지에 판단력을 아껴두면 좋습니다.', '선택지가 많았다면 오늘은 덜 중요한 결정 하나를 과감히 단순화해보세요.', '오늘은 다 잘하려는 마음보다 꼭 필요한 선택 하나를 또렷하게 잡는 쪽이 낫습니다.'],
      relationship: ['관계에서는 좋은 사람 모드만 켜두기보다, 가능한 범위를 부드럽게 말해보세요.', '관계의 온도를 맞추려면 내 여유의 한계도 같이 알려주는 게 좋습니다.', '오늘은 이해해주는 사람 역할만 하기보다 내 입장도 짧게 남겨보세요.'],
      recovery: ['회복은 보상보다 정비에 가까워요. 오늘 쌓인 일을 하나만 덜어도 충분합니다.', '지친 날에는 더 채우기보다 하나를 덜어내는 회복이 잘 맞을 수 있어요.', '오늘 회복은 거창한 휴식보다 부담 하나를 내려놓는 쪽에 가깝습니다.'],
      tomorrow: ['다음에 다시 보면 부담이 줄었을 때 같은 성향이 더 선명해지는지 확인해보세요.', '다음에는 피로한 날과 여유 있는 날의 판단 방식이 어떻게 다른지 비교해보세요.', '다음 테스트에서는 일과 관계 중 어느 쪽이 오늘보다 더 크게 작동하는지 보세요.']
    },
    '40s': {
      action: ['오늘은 역할을 다 해내는 것보다, 꼭 직접 해야 할 일과 맡겨도 되는 일을 나눠보세요.', '오늘은 책임을 더 얹기보다 우선순위를 다시 나누는 쪽이 힘을 남깁니다.', '내가 붙잡아야 할 일과 흘려보내도 되는 일을 구분하면 하루가 조금 가벼워질 수 있어요.'],
      relationship: ['관계에서는 설명을 길게 하기보다, 원하는 거리와 온도를 차분히 맞추는 게 효과적이에요.', '관계의 균형은 오래 설명하는 것보다 필요한 선을 차분히 공유할 때 좋아집니다.', '오늘은 모두를 설득하기보다 서로 무리 없는 온도를 맞추는 쪽이 낫습니다.'],
      recovery: ['쉬는 것도 책임감 있게 해도 됩니다. 오늘은 무리하지 않는 쪽이 꽤 생산적인 선택이에요.', '오늘의 회복은 더 하는 것보다 덜어내는 쪽에 가까울 수 있습니다.', '잠깐 멈추는 시간이 흐름을 끊는 게 아니라 오래 가게 해주는 장치일 수 있어요.'],
      tomorrow: ['다음에는 생활이 조금 안정된 날, 판단과 유연함 중 어느 쪽이 더 편한지 비교해보세요.', '다음 테스트에서는 역할이 많은 날과 가벼운 날의 선택 차이를 비교해보세요.', '다음에는 관계와 책임 중 어느 장면에서 성향이 먼저 드러나는지 살펴보세요.']
    },
    '50s': {
      action: ['오늘은 속도를 더 내기보다, 내 페이스에 맞는 순서를 고르는 것이 힘을 오래 남깁니다.', '오늘은 빠르게 처리하기보다 오래 편한 순서를 고르는 쪽이 잘 맞습니다.', '내 리듬을 지키는 선택 하나가 오늘의 에너지를 오래 남길 수 있어요.'],
      relationship: ['관계에서는 다 챙기려 하기보다, 편안하게 오래 갈 수 있는 온도를 지키는 게 좋아요.', '관계의 폭보다 편안한 온도가 더 중요하게 느껴질 수 있어요.', '오늘은 무리해서 맞추기보다 오래 편한 거리를 선택해도 좋습니다.'],
      recovery: ['충분히 쉬는 일에도 품격이 있습니다. 오늘은 마음이 조용해지는 쪽을 먼저 두세요.', '회복은 속도를 늦추는 일이 아니라 내 리듬을 되찾는 일에 가까워요.', '오늘은 몸과 마음이 조용해지는 쪽을 먼저 고르면 다음 선택이 편해질 수 있어요.'],
      tomorrow: ['다음에 다시 보면 충분히 쉰 뒤에도 같은 성향이 유지되는지 차분히 비교해볼 수 있어요.', '다음에는 컨디션이 더 안정된 날에도 같은 선택을 하는지 비교해보세요.', '다음 테스트에서는 사람, 일상, 휴식 중 어느 장면에서 내 페이스가 잘 보이는지 살펴보세요.']
    }
  }
};

const getHintSeed = (parts = []) =>
  parts.join('|').split('').reduce((hash, char) => {
    const nextHash = ((hash << 5) - hash) + char.charCodeAt(0);
    return nextHash | 0;
  }, 0);

const pickHint = (items, seed, salt = '') => {
  if (!Array.isArray(items) || items.length === 0) return '';
  const saltedSeed = getHintSeed([seed, salt]);
  return items[Math.abs(saltedSeed) % items.length];
};

const resolveHint = (hint, ...args) => {
  if (typeof hint === 'function') return hint(...args);
  return typeof hint === 'string' ? hint : '';
};

const mergeHintPools = (...pools) =>
  pools.flatMap((pool) => Array.isArray(pool) ? pool : pool ? [pool] : []);

export const getDailyResultHints = ({
  mbti = '',
  createdAt = '',
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
  const seed = getHintSeed([
    createdAt,
    mbti,
    ageGroup,
    dominant,
    topLifeTag,
    presentation?.state,
    stableCount,
    boundaryAxes.map((axis) => `${axis.left}${axis.right}`).join(',')
  ]);
  const axisVariant = HINT_VARIANTS.axis[dominant] || {};
  const ageVariant = HINT_VARIANTS.age[ageGroup] || HINT_VARIANTS.age.common;
  const lifeActions = HINT_VARIANTS.lifeAction[topLifeTag] || HINT_VARIANTS.lifeAction.daily_choice;
  const lifeRelationships = HINT_VARIANTS.lifeRelationship[topLifeTag] || HINT_VARIANTS.lifeRelationship.daily_choice;
  const lifeRecoveries = HINT_VARIANTS.lifeRecovery[topLifeTag] || HINT_VARIANTS.lifeRecovery.daily_choice;
  const axisAction = pickHint(
    mergeHintPools(axisVariant.action, ageVariant.action, axisHints.action),
    seed,
    'axis-action'
  ) || ageHints.action;
  const relationshipHint = pickHint(
    mergeHintPools(lifeRelationships, axisVariant.relationship, ageVariant.relationship, axisHints.relationship),
    seed,
    'relationship-mixed'
  ) || ageHints.relationship;
  const recoveryHint = pickHint(
    mergeHintPools(lifeRecoveries, axisVariant.recovery, ageVariant.recovery, axisHints.recovery),
    seed,
    'recovery-mixed'
  ) || ageHints.recovery;

  const actionLead = hasShift
    ? pickHint(HINT_VARIANTS.shiftLead, seed, 'shift-lead')
    : stableCount >= 2
      ? resolveHint(pickHint(HINT_VARIANTS.stableLead, seed, 'stable-lead'), lifeHint.label) || lifeHint.action
      : pickHint(lifeActions, seed, 'life-action') || lifeHint.action;

  const tomorrowCheckPoint = hasBoundary
    ? resolveHint(
      pickHint(HINT_VARIANTS.boundaryTomorrow, seed, 'boundary-tomorrow'),
      boundaryAxes.map((axis) => `${axis.left}/${axis.right}`).join(', ')
    ) || ageHints.tomorrow
    : presentation?.state === 'streak'
      ? pickHint(HINT_VARIANTS.streakTomorrow, seed, 'streak-tomorrow')
      : pickHint(ageVariant.tomorrow, seed, 'age-tomorrow') || ageHints.tomorrow;

  return {
    dailyAction: `${actionLead} ${axisAction}`,
    relationshipHint,
    recoveryHint,
    tomorrowCheckPoint
  };
};
