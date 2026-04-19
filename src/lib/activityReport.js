import { readJson, STORAGE_KEYS } from './storage.js';

const DEFAULT_COUNTS = {
  start_click: 0,
  restart_click: 0,
  result_image_save: 0,
  result_image_share: 0,
  history_open: 0
};

export const readEventStats = () => readJson(STORAGE_KEYS.eventStats, { counts: {}, recent: [] });

export const summarizeActivityReport = (
  { historyData = [], historyInsights = null, historyComparison = null },
  raw = readEventStats()
) => {
  const counts = { ...DEFAULT_COUNTS, ...(raw?.counts || {}) };
  const starts = counts.start_click;
  const restarts = counts.restart_click;
  const saved = counts.result_image_save;
  const shared = counts.result_image_share;
  const saveOrShare = saved + shared;

  const headline = starts === 0 && historyData.length === 0
    ? '아직 활동이 많지 않아요. 몇 번 더 해보면 나만의 패턴이 보여요.'
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
    restarts,
    saveOrShare,
    saved,
    shared,
    localNote: '이 리포트는 지금 쓰는 브라우저 기준으로 저장돼요.',
    headline,
    subline,
    recentFlowNote,
    activityNote: restarts > 0
      ? '다시 해본 기록이 쌓이면 어느 축이 자주 흔들리는지 더 또렷하게 보여요.'
      : '같은 날 다시 해보면 어떤 축이 먼저 달라지는지 비교해보기 좋아요.',
    topTypeNote: historyInsights?.topType?.count > 1
      ? `최근 ${historyInsights.topType.count}번 정도 이 흐름이 이어졌어요.`
      : '요즘은 이 흐름이 자주 보여요. 다음에도 이어질지 보기 좋아요.',
    volatilityNote: historyInsights?.mostVolatile?.flips
      ? '다시 해보면 이 축부터 달라질 수 있어요.'
      : '최근엔 거의 같은 결이 이어졌어요.'
  };
};
