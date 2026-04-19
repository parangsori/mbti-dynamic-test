import { readJson, STORAGE_KEYS } from './storage.js';

const DEFAULT_COUNTS = {
  start_click: 0,
  question_reach_3: 0,
  complete_test: 0,
  history_open: 0,
  restart_click: 0,
  result_image_save: 0,
  result_image_share: 0,
  version_open: 0,
  session_resume: 0,
  session_discard: 0
};

const toPercent = (value) => `${Math.round(value)}%`;

export const isInternalStatsEnabled = () =>
  Boolean((import.meta.env.VITE_INTERNAL_STATS_PASSWORD_HASH || '').trim());

export const hashInternalPassword = async (value) => {
  const normalized = value.trim();
  if (!normalized || !window.crypto?.subtle) return '';
  const encoded = new TextEncoder().encode(normalized);
  const digest = await window.crypto.subtle.digest('SHA-256', encoded);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const verifyInternalPassword = async (value) => {
  const expectedHash = (import.meta.env.VITE_INTERNAL_STATS_PASSWORD_HASH || '').trim().toLowerCase();
  if (!expectedHash) return false;
  const actualHash = await hashInternalPassword(value);
  return actualHash === expectedHash;
};

export const readEventStats = () => readJson(STORAGE_KEYS.eventStats, { counts: {}, recent: [] });

export const summarizeEventStats = (raw = readEventStats()) => {
  const counts = { ...DEFAULT_COUNTS, ...(raw?.counts || {}) };
  const recent = Array.isArray(raw?.recent) ? raw.recent.slice(0, 10) : [];

  const starts = counts.start_click;
  const reach3 = counts.question_reach_3;
  const completes = counts.complete_test;
  const saved = counts.result_image_save;
  const shared = counts.result_image_share;
  const saveOrShare = saved + shared;
  const historyOpens = counts.history_open;
  const restarts = counts.restart_click;

  const reach3Rate = starts > 0 ? (reach3 / starts) * 100 : 0;
  const completionRate = starts > 0 ? (completes / starts) * 100 : 0;
  const saveShareRate = completes > 0 ? (saveOrShare / completes) * 100 : 0;
  const restartRate = completes > 0 ? (restarts / completes) * 100 : 0;

  const insights = [];
  if (starts === 0) {
    insights.push('아직 이벤트 데이터가 없어요. 테스트를 몇 번 진행하면 흐름을 읽을 수 있어요.');
  } else {
    if (reach3Rate < 60) insights.push(`시작 대비 3문항 도달률이 ${toPercent(reach3Rate)}예요. 초반 질문 흡입력이 병목일 수 있어요.`);
    if (reach3Rate >= 60 && completionRate < 55) insights.push(`3문항 이후 완주율이 ${toPercent(completionRate)}예요. 중반 질문 템포를 다시 볼 필요가 있어요.`);
    if (completionRate >= 55 && saveShareRate < 30) insights.push(`완주 후 저장/공유 비율이 ${toPercent(saveShareRate)}예요. 결과 카드나 CTA 매력을 더 키울 여지가 있어요.`);
    if (historyOpens > 0 && restarts < Math.max(1, Math.floor(historyOpens * 0.4))) insights.push('기록은 자주 보지만 다시하기는 적어요. 재도전 이유 문구를 더 강하게 줄 수 있어요.');
    if (!insights.length) insights.push('현재 퍼널은 비교적 안정적으로 보입니다. 다음 단계는 공유 반응이나 성능 최적화 쪽을 봐도 좋아요.');
  }

  return {
    counts,
    recent,
    starts,
    reach3,
    completes,
    saved,
    shared,
    saveOrShare,
    historyOpens,
    restarts,
    reach3Rate,
    completionRate,
    saveShareRate,
    restartRate,
    insights
  };
};

export const formatEventLabel = (name) => {
  const labels = {
    start_click: '테스트 시작',
    question_reach_3: '3문항 도달',
    complete_test: '테스트 완료',
    history_open: '기록 열기',
    restart_click: '다시하기',
    result_image_save: '결과 저장',
    result_image_share: '결과 공유',
    version_open: '버전 보기',
    session_resume: '이어하기',
    session_discard: '이어하기 취소',
    share_copy: '한 줄 복사',
    result_view: '결과 보기'
  };

  return labels[name] || name;
};
