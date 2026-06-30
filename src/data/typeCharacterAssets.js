export const TYPE_CHARACTER_ASSETS = {
  INFJ: '/assets/type-characters/INFJ_Lumi.png',
  INFP: '/assets/type-characters/INFP_Moa.png',
  ENFP: '/assets/type-characters/ENFP_Popo.png',
  ENFJ: '/assets/type-characters/ENFJ_Onyu.png',
  INTJ: '/assets/type-characters/INTJ_Seon.png',
  ENTJ: '/assets/type-characters/ENTJ_Root.png',
  INTP: '/assets/type-characters/INTP_Nube.png',
  ENTP: '/assets/type-characters/ENTP_Tilt.png',
  ISFP: '/assets/type-characters/ISFP_Aro.png',
  ESFP: '/assets/type-characters/ESFP_Ruru.png',
  ISTP: '/assets/type-characters/ISTP_Ten.png',
  ESTP: '/assets/type-characters/ESTP_Kiro.png',
  ISFJ: '/assets/type-characters/ISFJ_Somi.png',
  ESFJ: '/assets/type-characters/ESFJ_Raon.png',
  ISTJ: '/assets/type-characters/ISTJ_Or.png',
  ESTJ: '/assets/type-characters/ESTJ_Bareun.png'
};

export const getTypeCharacterAsset = (mbti) => TYPE_CHARACTER_ASSETS[mbti] || '';
