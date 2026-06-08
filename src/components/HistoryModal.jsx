import { useState } from 'react';
import { motion } from 'framer-motion';

const THEME_LABELS = {
  spark: '반짝임',
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

function ActivityMetricCard({ title, value, description }) {
  return (
    <div className="flex min-h-[10rem] flex-col rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <div className="flex min-h-[2.4rem] items-start">
        <p className="text-[11px] font-bold leading-snug tracking-[0.12em] text-slate-400 uppercase break-keep">{title}</p>
      </div>
      <p className="mt-1 text-2xl font-black leading-none text-white">{value}</p>
      <p className="mt-3 text-[11px] leading-relaxed text-slate-300 break-keep">{description}</p>
    </div>
  );
}

export default function HistoryModal({
  activitySummary,
  latestHistoryComparison,
  latestHistoryInsights,
  historyData,
  isPremiumUser = false,
  getHistoryEntryNote,
  onClose,
  onClearData
}) {
  const [selectedEntry, setSelectedEntry] = useState(null);
  const [lockNote, setLockNote] = useState('');

  const handleHistoryEntryClick = (item) => {
    if (isPremiumUser && item.resultSnapshotVersion) {
      setSelectedEntry(item);
      setLockNote('');
      return;
    }

    setLockNote(item.resultSnapshotVersion
      ? '이전 결과 상세는 프리미엄에서 열려요. 지금은 요약 기록만 확인할 수 있습니다.'
      : '이 기록은 예전 형식이라 상세 스냅샷이 없어요. 새 결과부터 상세 재열람 준비가 저장됩니다.');
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
            <h3 className="text-xl font-black text-white flex items-center gap-2">🕒 나의 기록 & 활동</h3>
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
          <div className="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-4">
            <p className="text-[11px] font-bold tracking-[0.2em] text-cyan-100 uppercase">나의 활동 리포트</p>
            <p className="mt-2 text-[15px] font-semibold leading-relaxed text-white break-keep">{activitySummary.headline}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-cyan-50/90 break-keep">{activitySummary.subline}</p>
            <p className="mt-3 text-[11px] leading-relaxed text-cyan-100/70 break-keep">{activitySummary.localNote}</p>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <ActivityMetricCard title="테스트 횟수" value={activitySummary.starts} description="지금까지 이 브라우저에서 해본 횟수" />
            <ActivityMetricCard title="다시 해본 횟수" value={activitySummary.restarts} description="결과를 보고 다시 시작한 횟수" />
            <ActivityMetricCard title="저장·공유" value={activitySummary.saveOrShare} description="결과 카드를 남긴 횟수" />
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-[11px] text-slate-400 font-bold tracking-[0.15em] uppercase">완료율</p>
              <p className="mt-2 text-2xl font-black text-white">{activitySummary.completionRate}%</p>
              <p className="mt-1 text-[11px] text-slate-300 break-keep">{activitySummary.funnelNote}</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-[11px] text-slate-400 font-bold tracking-[0.15em] uppercase">시스템 상태</p>
              <p className="mt-2 text-lg font-black text-white">{activitySummary.totalErrors > 0 ? `오류 ${activitySummary.totalErrors}건` : '안정적'}</p>
              <p className="mt-1 text-[11px] text-slate-300 break-keep">{activitySummary.systemNote}</p>
            </div>
          </div>

          {latestHistoryComparison && (
            <div className="mb-4 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-4">
              <p className="text-sm font-bold text-cyan-100 break-keep">{latestHistoryComparison.title}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-slate-300 break-keep">{latestHistoryComparison.body}</p>
            </div>
          )}

          {latestHistoryInsights && (
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-[11px] text-slate-400 font-bold tracking-[0.15em] uppercase">가장 자주 나온 흐름</p>
                <p className="mt-2 text-2xl font-black text-white">{latestHistoryInsights.topType?.mbti || '-'}</p>
                <p className="mt-1 text-[11px] text-slate-300 break-keep">{activitySummary.topTypeNote}</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-[11px] text-slate-400 font-bold tracking-[0.15em] uppercase">가장 잘 흔들리는 축</p>
                <p className="mt-2 text-lg font-black text-white">{latestHistoryInsights.mostVolatile?.pair || '-'}</p>
                <p className="mt-1 text-[11px] text-slate-300 break-keep">{activitySummary.volatilityNote}</p>
              </div>
            </div>
          )}

          {activitySummary.recentFlowNote && (
            <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-[11px] text-slate-400 font-bold tracking-[0.15em] uppercase">최근 흐름</p>
              <p className="mt-2 text-[13px] leading-relaxed text-white break-keep">{activitySummary.recentFlowNote}</p>
              <p className="mt-2 text-[11px] text-slate-300 break-keep">{activitySummary.activityNote}</p>
            </div>
          )}

          <div className="mb-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-[11px] text-slate-400 font-bold tracking-[0.15em] uppercase">운영에서 볼 포인트</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold text-slate-200">시작 {activitySummary.starts}</span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold text-slate-200">결과 도달 {activitySummary.completions}</span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold text-slate-200">보정 진입 {activitySummary.followupStarts}</span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold text-slate-200">복사 {activitySummary.copied}</span>
              <span className="rounded-full border border-white/10 bg-black/20 px-3 py-1 text-[11px] font-semibold text-slate-200">저장·공유 {activitySummary.saveOrShare}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 pr-1">
            {historyData.length === 0 ? (
              <p className="text-slate-400 text-center py-8 text-sm">
                아직 기록이 많지 않아요.
                <br />
                몇 번 더 해보면 나만의 흐름이 더 또렷하게 보여요.
              </p>
            ) : (
              <>
                <p className="text-[11px] text-slate-400 font-bold tracking-[0.15em] uppercase px-1">이전 결과 요약</p>
                {lockNote && (
                  <div className="rounded-2xl border border-amber-300/20 bg-amber-300/[0.08] px-4 py-3">
                    <p className="text-[12px] font-bold leading-relaxed text-amber-100 break-keep">{lockNote}</p>
                  </div>
                )}
                {historyData.map((item, idx) => (
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

        <div className="border-t border-white/10 bg-slate-900/95 px-5 py-4">
          <button onClick={onClose} className="w-full py-4 bg-white/10 border border-white/10 rounded-2xl text-slate-200 font-bold hover:bg-white/20 transition-colors">
            닫기
          </button>
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
