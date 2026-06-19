import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

const THEME_LABELS = {
  spark: '불꽃',
  wave: '흐름',
  neon: '선명함',
  steady: '차분함',
  'soft-shift': '부드러운 변화',
  citrus: '가벼운 활력',
  afterglow: '은은한 여운',
  studio: '정돈된 집중'
};

const getThemeLabel = (themeKey = '') => THEME_LABELS[themeKey] || themeKey || '오늘 무드';

const getEntryKey = (entry = {}, idx = 0) => entry.localEntryId || entry.createdAt || `${entry.mbti || 'result'}-${idx}`;
const FREE_HISTORY_LIMIT = 7;
const PREMIUM_PREVIEW_ITEMS = [
  '7일 성향 변화 그래프',
  '축별 안정성/변동성',
  '같은 타입 안의 미세한 차이',
  '30일 변화 리포트'
];

const getHistoryStageCopy = (historyCount = 0) => {
  if (historyCount === 0) {
    return {
      eyebrow: '첫 기록 준비',
      title: '오늘 결과가 첫 기준점이 됩니다',
      body: '테스트를 한 번 남겨두면 다음 결과부터 내 흐름이 이어지는지, 달라지는지 볼 수 있어요.',
      ctaLabel: '오늘 테스트 시작하기',
      ctaKind: 'start_first_history'
    };
  }
  if (historyCount < 3) {
    return {
      eyebrow: '흐름 시작',
      title: '비교가 막 시작됐어요',
      body: '기록이 조금 더 쌓이면 같은 타입 안의 무드 차이와 흔들리는 축이 더 잘 보여요.',
      ctaLabel: '다음 결과도 남기기',
      ctaKind: 'continue_history'
    };
  }
  if (historyCount < FREE_HISTORY_LIMIT) {
    return {
      eyebrow: '최근 흐름',
      title: '최근 패턴이 보이기 시작했어요',
      body: '최근 결과를 기준으로 자주 나온 타입과 가장 잘 움직이는 축을 가볍게 확인할 수 있어요.',
      ctaLabel: '7일 흐름 미리보기',
      ctaKind: 'preview_7d'
    };
  }
  return {
    eyebrow: '7일 흐름',
    title: '프리미엄 분석으로 확장하기 좋은 상태예요',
    body: '최근 기록이 충분히 쌓여 7일 흐름, 축별 변화, 같은 타입 안의 차이를 더 깊게 볼 수 있어요.',
    ctaLabel: '내 패턴 더 자세히 보기',
    ctaKind: 'preview_premium'
  };
};

const getSnapshotBadge = (entry = {}, isPremiumUser = false) => {
  if (!entry.resultSnapshotVersion) {
    return {
      icon: '',
      label: '요약 기록',
      className: 'border-white/10 bg-black/20 text-slate-400'
    };
  }

  if (isPremiumUser) {
    return {
      icon: '',
      label: '상세 열람',
      className: 'border-cyan-300/20 bg-cyan-300/[0.1] text-cyan-100'
    };
  }

  return {
    icon: '🔒',
    label: '프리미엄 잠금',
    className: 'border-amber-300/25 bg-amber-300/[0.1] text-amber-100'
  };
};

function SnapshotAxisRow({ axis }) {
  const intensity = Number(axis?.intensity) || 0;
  const dominantType = axis?.dominantType || '-';
  const pair = axis?.pair || `${axis?.left || ''}/${axis?.right || ''}`;

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[12px] font-black text-white">{pair}</p>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.1] px-3 py-1 text-[11px] font-bold text-cyan-100">
          {dominantType} {intensity}%
        </span>
      </div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-800">
        <div className="h-full rounded-full bg-gradient-to-r from-brand to-cyan-300" style={{ width: `${Math.max(8, Math.min(100, intensity))}%` }} />
      </div>
    </div>
  );
}

function HistoryDetailModal({ entry, getHistoryEntryNote, onClose }) {
  if (!entry) return null;

  const axes = Array.isArray(entry.axes) ? entry.axes : [];
  const context = entry.questionContextSummary || {};

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center bg-black/65 p-3 backdrop-blur-sm sm:items-center sm:p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.96, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 24 }}
        className="relative flex max-h-[88dvh] w-full max-w-sm flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="border-b border-white/10 bg-slate-900/95 px-5 py-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[11px] font-black tracking-[0.18em] text-cyan-100 uppercase">이전 결과 상세</p>
              <h3 className="mt-2 text-[30px] font-black leading-none text-white">{entry.mbti || '-'}</h3>
              <p className="mt-2 text-[12px] font-semibold text-slate-400">
                {[entry.date, entry.time].filter(Boolean).join(' · ') || '저장된 기록'}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-xl font-medium text-slate-200 transition-colors hover:bg-white/10"
              aria-label="이전 결과 상세 닫기"
            >
              ×
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08] px-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[11px] font-black tracking-[0.14em] text-cyan-100 uppercase">싱크로율</p>
                <p className="mt-2 text-2xl font-black text-white">{entry.percent || 0}%</p>
              </div>
              <div>
                <p className="text-[11px] font-black tracking-[0.14em] text-cyan-100 uppercase">오늘 무드</p>
                <p className="mt-2 text-[15px] font-black leading-tight text-white break-keep">{getThemeLabel(entry.themeKey)}</p>
              </div>
            </div>
            <p className="mt-3 text-[12px] leading-relaxed text-cyan-50/90 break-keep">
              {getHistoryEntryNote(entry, 0, [entry])}
            </p>
          </div>

          {axes.length > 0 && (
            <div className="mt-4 space-y-3">
              <p className="px-1 text-[11px] font-black tracking-[0.15em] text-slate-400 uppercase">당시 성향 축</p>
              {axes.map((axis, idx) => (
                <SnapshotAxisRow key={`${axis.pair || idx}-${idx}`} axis={axis} />
              ))}
            </div>
          )}

          <div className="mt-4 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
            <p className="text-[11px] font-black tracking-[0.15em] text-slate-400 uppercase">당시 문항 맥락</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-100 break-keep">
              {context.topLabel || context.topTag
                ? `${context.topLabel || context.topTag} 흐름이 가장 강하게 반영된 결과였어요.`
                : '이 기록에는 문항 맥락 스냅샷이 충분히 남아 있지 않아요.'}
            </p>
          </div>

          <div className="mt-4 rounded-2xl border border-amber-300/20 bg-amber-300/[0.07] px-4 py-4">
            <p className="text-[11px] font-black tracking-[0.15em] text-amber-100 uppercase">저장/공유 안내</p>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-200 break-keep">
              이전 결과 상세는 다시 읽기용으로 열려요. 결과 카드 저장/공유는 현재 새로 나온 결과 화면에서만 사용할 수 있습니다.
            </p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

function FlowMetricCard({ title, value, description }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-4">
      <p className="text-[11px] font-bold leading-snug tracking-[0.12em] text-slate-400 uppercase break-keep">{title}</p>
      <p className="mt-1 text-2xl font-black leading-none text-white">{value}</p>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-300 break-keep">{description}</p>
    </div>
  );
}

function RecentFlowStrip({ historyData }) {
  const recent = historyData.slice(0, FREE_HISTORY_LIMIT);
  if (!recent.length) return null;

  return (
    <div className="rounded-[1.35rem] border border-white/10 bg-black/20 px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black tracking-[0.15em] text-slate-400 uppercase">최근 기록</p>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-2.5 py-1 text-[10px] font-bold text-slate-300">
          최근 {recent.length}개
        </span>
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
        {recent.map((item, idx) => (
          <div
            key={getEntryKey(item, idx)}
            className="min-w-[4.6rem] rounded-2xl border border-white/10 bg-white/[0.045] px-3 py-3 text-center"
          >
            <p className="text-[17px] font-black leading-none text-white">{item.mbti || '-'}</p>
            <p className="mt-2 text-[10px] font-semibold text-slate-400">{item.date || '기록'}</p>
            {item.themeKey && <span className="mt-2 inline-block h-2 w-2 rounded-full bg-cyan-200/80" aria-hidden="true" />}
          </div>
        ))}
      </div>
      <p className="mt-3 text-center text-[11px] font-bold text-cyan-100/80 break-keep">
        아래로 더 내려 프리미엄 분석 미리보기를 확인해보세요 ↓
      </p>
    </div>
  );
}

function EmptyHistoryState({ stageCopy, onStartTest }) {
  return (
    <div className="rounded-[1.5rem] border border-cyan-300/20 bg-cyan-300/[0.08] px-5 py-6 text-center">
      <p className="text-[11px] font-black tracking-[0.17em] text-cyan-100 uppercase">{stageCopy.eyebrow}</p>
      <h4 className="mt-2 text-lg font-black text-white break-keep">{stageCopy.title}</h4>
      <p className="mt-3 text-[13px] leading-relaxed text-cyan-50/90 break-keep">{stageCopy.body}</p>
      <button
        type="button"
        onClick={onStartTest}
        className="mt-5 min-h-12 w-full rounded-2xl border border-cyan-200/20 bg-cyan-300/[0.15] px-4 py-3 text-[13px] font-black text-cyan-50 transition hover:bg-cyan-300/[0.22]"
      >
        {stageCopy.ctaLabel}
      </button>
    </div>
  );
}

function HistoryPremiumTeaser({ stageCopy, historyCount, topType, volatileAxis, onCtaClick }) {
  if (historyCount === 0) return null;

  return (
    <section className="rounded-[1.6rem] border border-amber-200/20 bg-[linear-gradient(135deg,rgba(251,191,36,0.12),rgba(255,255,255,0.035))] px-4 py-4 shadow-[0_20px_56px_rgba(2,6,23,0.2)]">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-black tracking-[0.17em] text-amber-100 uppercase">프리미엄 미리보기</p>
          <h4 className="mt-2 text-[17px] font-black leading-tight text-white break-keep">{stageCopy.title}</h4>
        </div>
        <span className="shrink-0 rounded-full border border-amber-200/20 bg-amber-300/[0.12] px-3 py-1.5 text-[10px] font-black text-amber-50">
          {historyCount}회 기록
        </span>
      </div>

      <p className="mt-3 text-[13px] font-semibold leading-relaxed text-slate-200 break-keep">{stageCopy.body}</p>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
          <p className="text-[10px] font-black tracking-[0.14em] text-slate-400 uppercase">자주 나온 타입</p>
          <p className="mt-2 text-2xl font-black text-white">{topType || '-'}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
          <p className="text-[10px] font-black tracking-[0.14em] text-slate-400 uppercase">움직인 축</p>
          <p className="mt-2 text-lg font-black text-white">{volatileAxis || '안정적'}</p>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/35 px-3 py-3">
        <p className="text-[10px] font-black tracking-[0.14em] text-slate-400 uppercase">열릴 수 있는 분석</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {PREMIUM_PREVIEW_ITEMS.map((item) => (
            <span key={item} className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1.5 text-[11px] font-bold text-slate-200">
              {item}
            </span>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={() => onCtaClick(stageCopy)}
        className="mt-4 min-h-12 w-full rounded-2xl border border-amber-200/20 bg-amber-300/[0.13] px-4 py-3 text-[13px] font-black text-amber-50 transition hover:bg-amber-300/[0.2]"
      >
        {stageCopy.ctaLabel}
      </button>
      <p className="mt-2 text-center text-[11px] font-semibold text-amber-50/70 break-keep">
        결과와 기본 공유는 계속 무료로 사용할 수 있어요.
      </p>
    </section>
  );
}

export default function HistoryModal({
  activitySummary,
  latestHistoryComparison,
  latestHistoryInsights,
  historyData,
  isPremiumUser = false,
  getHistoryEntryNote,
  trackEvent,
  onStartTest,
  onClose,
  onClearData
}) {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [lockNote, setLockNote] = useState('');
  const historyCount = historyData.length;
  const recentHistory = historyData.slice(0, FREE_HISTORY_LIMIT);
  const hiddenHistoryCount = Math.max(0, historyData.length - recentHistory.length);
  const latestEntry = historyData[0];
  const stageCopy = getHistoryStageCopy(historyCount);
  const topType = latestHistoryInsights?.topType?.mbti || latestEntry?.mbti || '';
  const volatileAxis = latestHistoryInsights?.mostVolatile?.flips ? latestHistoryInsights.mostVolatile.pair : '';
  const summaryCopy = latestHistoryComparison?.title || activitySummary.recentFlowNote || '기록이 쌓이면 나의 흐름이 더 선명해져요.';

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key !== 'Escape') return;
      if (selectedEntry) {
        setSelectedEntry(null);
        return;
      }
      onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose, selectedEntry]);

  useEffect(() => {
    if (historyCount === 0) return;
    trackEvent?.('history_premium_teaser_viewed', {
      historyCount,
      source: 'history_modal',
      variant: 'phase4a_history_teaser',
      topType: topType || '',
      mostVolatileAxis: volatileAxis || 'stable',
      isPremiumUser
    });
  }, [historyCount, isPremiumUser, topType, trackEvent, volatileAxis]);

  const handleHistoryEntryClick = (item) => {
    trackEvent?.('history_item_clicked', {
      historyCount,
      source: 'history_modal',
      hasSnapshot: Boolean(item.resultSnapshotVersion),
      isPremiumUser
    });

    if (isPremiumUser && item.resultSnapshotVersion) {
      setSelectedEntry(item);
      setLockNote('');
      return;
    }

    setLockNote(item.resultSnapshotVersion
      ? '이전 결과 상세는 프리미엄에서 열려요. 지금은 요약 기록만 확인할 수 있습니다.'
      : '이 기록은 예전 형식이라 상세 스냅샷이 없어요. 새 결과부터 상세 재열람 준비가 저장됩니다.');
  };

  const handleStartFromHistory = () => {
    trackEvent?.('history_empty_cta_clicked', {
      historyCount,
      source: 'history_modal',
      ctaKind: stageCopy.ctaKind
    });
    onClose();
    onStartTest?.();
  };

  const handlePremiumCta = (copy) => {
    trackEvent?.('history_premium_cta_clicked', {
      historyCount,
      source: 'history_modal',
      variant: 'phase4a_history_teaser',
      ctaKind: copy.ctaKind,
      topType: topType || '',
      mostVolatileAxis: volatileAxis || 'stable',
      isPremiumUser
    });
    setLockNote('프리미엄 분석은 준비 중이에요. 지금은 클릭 관심도를 확인하고, 결과와 기본 기록은 계속 무료로 열어두고 있습니다.');
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-end justify-center p-3 sm:items-center sm:p-6 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      >
      <motion.div
        initial={{ scale: 0.96, y: 24 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.96, y: 24 }}
        className="bg-slate-900 border border-white/10 rounded-[2rem] sm:rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden relative max-h-[88dvh] flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-brand/30 blur-3xl rounded-full"></div>

        <div className="relative z-10 flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10 bg-slate-900/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-black text-white flex items-center gap-2">나의 기록</h3>
            <button
              onClick={onClearData}
              className="inline-flex items-center justify-center rounded-full border border-rose-400/15 bg-rose-500/8 px-3 py-1.5 text-[11px] font-bold text-rose-200 hover:bg-rose-500/14 transition-colors"
            >
              초기화
            </button>
          </div>
          <button
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 text-xl font-medium hover:bg-white/10 transition-colors"
            aria-label="기록 모달 닫기"
          >
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="mb-4 rounded-[1.6rem] border border-cyan-300/20 bg-[linear-gradient(135deg,rgba(34,211,238,0.14),rgba(255,255,255,0.035))] px-4 py-5">
            <p className="text-[11px] font-black tracking-[0.18em] text-cyan-100 uppercase">{stageCopy.eyebrow}</p>
            <h4 className="mt-2 text-xl font-black leading-tight text-white break-keep">{stageCopy.title}</h4>
            <p className="mt-3 text-[13px] font-semibold leading-relaxed text-cyan-50/90 break-keep">{summaryCopy}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-slate-300 break-keep">{stageCopy.body}</p>
          </div>

          {latestHistoryInsights && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <FlowMetricCard title="자주 나온 흐름" value={latestHistoryInsights.topType?.mbti || '-'} description={activitySummary.topTypeNote} />
              <FlowMetricCard title="움직인 축" value={latestHistoryInsights.mostVolatile?.flips ? latestHistoryInsights.mostVolatile.pair : '안정적'} description={activitySummary.volatilityNote} />
            </div>
          )}

          <div className="mb-4 grid grid-cols-3 gap-2">
            <FlowMetricCard title="기록" value={historyCount} description="이 브라우저에 남은 결과" />
            <FlowMetricCard title="테스트" value={activitySummary.starts} description="지금까지 시작한 횟수" />
            <FlowMetricCard title="저장·공유" value={activitySummary.saveOrShare} description="카드로 남긴 횟수" />
          </div>

          <div className="mb-4">
            <RecentFlowStrip historyData={historyData} />
          </div>

          <div className="mb-4">
            <HistoryPremiumTeaser
              stageCopy={stageCopy}
              historyCount={historyCount}
              topType={topType}
              volatileAxis={volatileAxis}
              onCtaClick={handlePremiumCta}
            />
          </div>

          <div className="flex flex-col gap-3 pr-1">
            {historyCount === 0 ? (
              <EmptyHistoryState stageCopy={stageCopy} onStartTest={handleStartFromHistory} />
            ) : (
              <>
                <div className="flex items-center justify-between gap-3 px-1">
                  <p className="text-[11px] text-slate-400 font-bold tracking-[0.15em] uppercase">최근 결과 요약</p>
                  {hiddenHistoryCount > 0 && (
                    <span className="rounded-full border border-amber-200/20 bg-amber-300/[0.08] px-2.5 py-1 text-[10px] font-bold text-amber-100">
                      이전 {hiddenHistoryCount}개는 프리미엄 분석 후보
                    </span>
                  )}
                </div>
                {lockNote && (
                  <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] px-4 py-3">
                    <p className="text-[12px] font-bold leading-relaxed text-amber-100 break-keep">{lockNote}</p>
                  </div>
                )}
                {(isPremiumUser ? historyData : recentHistory).map((item, idx) => (
                  <HistoryEntryButton
                    key={getEntryKey(item, idx)}
                    item={item}
                    idx={idx}
                    historyData={historyData}
                    isPremiumUser={isPremiumUser}
                    getHistoryEntryNote={getHistoryEntryNote}
                    onClick={() => handleHistoryEntryClick(item)}
                  />
                ))}
              </>
            )}
          </div>
        </div>

      </motion.div>
      </motion.div>

      {selectedEntry && (
        <HistoryDetailModal
          entry={selectedEntry}
          getHistoryEntryNote={getHistoryEntryNote}
          onClose={() => setSelectedEntry(null)}
        />
      )}
    </>
  );
}

function HistoryEntryButton({ item, idx, historyData, isPremiumUser, getHistoryEntryNote, onClick }) {
  const badge = getSnapshotBadge(item, isPremiumUser);

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full rounded-2xl border border-white/5 bg-white/5 p-4 text-left transition hover:border-white/10 hover:bg-white/[0.075]"
    >
      <div className="flex justify-between items-center">
        <div className="flex flex-col">
          <span className="text-slate-300 font-medium text-sm">{item.date}</span>
          {item.time && <span className="text-[11px] text-slate-500">{item.time}</span>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black ${badge.className}`}>
            {badge.icon && <span aria-hidden="true">{badge.icon}</span>}
            <span>{badge.label}</span>
          </span>
          <div className="flex items-center gap-2">
            <span className="text-[11px] bg-brand/20 border border-brand/30 text-brand px-2 py-0.5 rounded-full">싱크로율 {item.percent}%</span>
            <span className="text-2xl font-black text-cyan-400 drop-shadow-md">{item.mbti}</span>
          </div>
        </div>
      </div>
      <p className="mt-2 text-[12px] text-slate-400 break-keep">{getHistoryEntryNote(item, idx, historyData)}</p>
      {item.themeKey && (
        <p className="mt-2 text-[11px] font-semibold text-slate-500 break-keep">무드: {getThemeLabel(item.themeKey)}</p>
      )}
    </button>
  );
}
