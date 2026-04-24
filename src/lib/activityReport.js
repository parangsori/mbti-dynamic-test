import { readJson, STORAGE_KEYS } from './storage.js';
import { readLocalErrorStats } from './observability.js';

const DEFAULT_COUNTS = {
  start_click: 0,
  complete_test: 0,
  restart_click: 0,
  followup_start: 0,
  question_reach_3: 0,
  question_reach_6: 0,
  question_reach_9: 0,
  result_image_save: 0,
  result_image_share: 0,
  history_open: 0,
  share_copy: 0
};

export const readEventStats = () => readJson(STORAGE_KEYS.eventStats, { counts: {}, recent: [] });

export const summarizeActivityReport = (
  { historyData = [], historyInsights = null, historyComparison = null },
  raw = readEventStats(),
  errorRaw = readLocalErrorStats()
) => {
  const counts = { ...DEFAULT_COUNTS, ...(raw?.counts || {}) };
  const starts = counts.start_click;
  const completions = counts.complete_test;
  const restarts = counts.restart_click;
  const followupStarts = counts.followup_start;
  const progressTouches = counts.question_reach_3 + counts.question_reach_6 + counts.question_reach_9;
  const saved = counts.result_image_save;
  const shared = counts.result_image_share;
  const copied = counts.share_copy;
  const saveOrShare = saved + shared;
  const completionRate = starts > 0 ? Math.round((completions / starts) * 100) : 0;
  const recentErrors = errorRaw?.recent || [];
  const totalErrors = Object.values(errorRaw?.counts || {}).reduce((sum, value) => sum + value, 0);
  const hasErrors = totalErrors > 0;

  const headline = starts === 0 && historyData.length === 0
    ? '아직 활동이 많지 않아요. 몇 번 더 해보면 나만의 패턴이 보여요.'
    : hasErrors
      ? '대부분은 잘 동작하고 있지만, 몇몇 저장·처리 흐름에서 확인이 필요한 흔적이 있어요.'
    : restarts >= 2
      ? '요즘 이 테스트를 자주 다시 해보며 내 흐름을 비교하고 있어요.'
      : saveOrShare > 0
        ? '결과를 저장하거나 공유하면서 내 무드를 기록하고 있어요.'
        : '조금씩 기록이 쌓이면서 오늘의 결이 어떻게 바뀌는지 보이기 시작했어요.';

  const subline = historyInsights?.topType?.mbti
    ? `최근엔 ${historyInsights.topType.mbti} 흐름이 가장 자주 나왔어요.`
    : '결과가 쌓일수록 자주 나오는 흐름과 흔들리는 축을 더 잘 볼 수 있어요.';

  const recentFlowNote = historyComparison?.title || (historyInsights?.stableCount > 1
    ? `최근 ${historyInsights.stableCount}번은 비슷한 흐름이 이어졌어요.`
    : historyData[0]
      ? `가장 최근 결과는 ${historyData[0].mbti}였어요.`
      : '');

  return {
    starts,
    completions,
    completionRate,
    restarts,
    followupStarts,
    progressTouches,
    saveOrShare,
    saved,
    shared,
    copied,
    totalErrors,
    latestError: recentErrors[0] || null,
    localNote: '이 리포트는 지금 쓰는 브라우저 기준으로 저장돼요.',
    headline,
    subline,
    recentFlowNote,
    funnelNote: starts > 0
      ? `시작 ${starts}회 중 ${completions}회가 결과까지 이어졌고, 보정 질문은 ${followupStarts}회 진입했어요.`
      : '아직 시작 기록이 적어서 흐름을 판단하기 어려워요.',
    activityNote: restarts > 0
      ? '다시 해본 기록이 쌓이면 어느 축이 자주 흔들리는지 더 또렷하게 보여요.'
      : '같은 날 다시 해보면 어떤 축이 먼저 달라지는지 비교해보기 좋아요.',
    topTypeNote: historyInsights?.topType?.count > 1
      ? `최근 ${historyInsights.topType.count}번 정도 이 흐름이 이어졌어요.`
      : '요즘은 이 흐름이 자주 보여요. 다음에도 이어질지 보기 좋아요.',
    volatilityNote: historyInsights?.mostVolatile?.flips
      ? '다시 해보면 이 축부터 달라질 수 있어요.'
      : '최근엔 거의 같은 결이 이어졌어요.',
    systemNote: hasErrors
      ? `최근 브라우저 기준 오류 흔적 ${totalErrors}건이 남아 있어요. 가장 최근은 ${recentErrors[0]?.context?.stage || recentErrors[0]?.context?.source || '처리 단계'}에서 발생했어요.`
      : '최근 브라우저 기준 오류 흔적은 없어요. 결과 저장과 기록 흐름이 비교적 안정적으로 유지되고 있어요.'
  };
};
