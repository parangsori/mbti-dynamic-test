/**
 * M3: 나이/성별 기반 개인화 모듈
 * - 질문 톤앤매너 조정
 * - 결과 해석 맥락 반영
 */

const STORAGE_KEY_PROFILE = 'mbti_user_profile';

export const readProfile = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_PROFILE);
    return raw ? JSON.parse(raw) : { ageGroup: '', gender: '' };
  } catch {
    return { ageGroup: '', gender: '' };
  }
};

export const writeProfile = (profile) => {
  try {
    localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(profile));
  } catch {
    // ignore
  }
};

/**
 * 연령대별 톤앤매너 설정
 */
const TONE_CONFIG = {
  '10s': {
    label: '10대',
    questionPrefix: '',
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
    questionPrefix: '',
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
    questionPrefix: '',
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
    label: '40대+',
    questionPrefix: '',
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
    '10s': {
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
    }
  };

  return contexts[ageGroup] || null;
};

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

/**
 * 공유 텍스트에 연령대 맥락 추가
 */
export const getPersonalizedShareSuffix = (ageGroup) => {
  const suffixes = {
    '10s': '🔥 나도 해보기 →',
    '20s': '나도 오늘의 MBTI 확인하기 →',
    '30s': '나의 오늘 성향도 확인해보세요 →',
    '40s': '나의 성향도 확인해보세요 →'
  };
  return suffixes[ageGroup] || '나도 해보기 →';
};
