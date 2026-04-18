import {
  QUESTIONS_DB,
  MBTI_RESULTS as RAW_MBTI_RESULTS,
  BADGES,
  IMAGE_BASE64
} from '../../data.js';

import ISTJImage from '../../resources/ISTJ.png';
import ISFJImage from '../../resources/ISFJ.png';
import INFJImage from '../../resources/INFJ.png';
import INTJImage from '../../resources/INTJ.png';
import ISTPImage from '../../resources/ISTP.png';
import ISFPImage from '../../resources/ISFP.png';
import INFPImage from '../../resources/INFP.png';
import INTPImage from '../../resources/INTP.png';
import ESTPImage from '../../resources/ESTP.png';
import ESFPImage from '../../resources/ESFP.png';
import ENFPImage from '../../resources/ENFP.png';
import ENTPImage from '../../resources/ENTP.png';
import ESTJImage from '../../resources/ESTJ.png';
import ESFJImage from '../../resources/ESFJ.png';
import ENFJImage from '../../resources/ENFJ.png';
import ENTJImage from '../../resources/ENTJ.png';

const IMAGE_ASSETS = {
  'resources/ISTJ.png': ISTJImage,
  'resources/ISFJ.png': ISFJImage,
  'resources/INFJ.png': INFJImage,
  'resources/INTJ.png': INTJImage,
  'resources/ISTP.png': ISTPImage,
  'resources/ISFP.png': ISFPImage,
  'resources/INFP.png': INFPImage,
  'resources/INTP.png': INTPImage,
  'resources/ESTP.png': ESTPImage,
  'resources/ESFP.png': ESFPImage,
  'resources/ENFP.png': ENFPImage,
  'resources/ENTP.png': ENTPImage,
  'resources/ESTJ.png': ESTJImage,
  'resources/ESFJ.png': ESFJImage,
  'resources/ENFJ.png': ENFJImage,
  'resources/ENTJ.png': ENTJImage
};

export const MBTI_RESULTS = Object.fromEntries(
  Object.entries(RAW_MBTI_RESULTS).map(([type, info]) => [
    type,
    {
      ...info,
      image: IMAGE_ASSETS[info.image] || info.image
    }
  ])
);

export { QUESTIONS_DB, BADGES, IMAGE_BASE64 };
