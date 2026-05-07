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
export const getPersonalizedTempoMessage = (ageGroup, index, defaultMessage) => {
  const config = TONE_CONFIG[ageGroup];
  if (!config) return defaultMessage;
  const messages = config.tempoMessages;
  return messages[index % messages.length] || defaultMessage;
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
