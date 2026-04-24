import { motion } from 'framer-motion';

export default function HistoryModal({
  activitySummary,
  latestHistoryComparison,
  latestHistoryInsights,
  historyData,
  getHistoryEntryNote,
  onClose,
  onClearData
}) {
  return (
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
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-[11px] text-slate-400 font-bold tracking-[0.15em] uppercase">테스트 횟수</p>
              <p className="mt-2 text-2xl font-black text-white">{activitySummary.starts}</p>
              <p className="mt-1 text-[11px] text-slate-300 break-keep">지금까지 이 브라우저에서 해본 횟수</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-[11px] text-slate-400 font-bold tracking-[0.15em] uppercase">다시 해본 횟수</p>
              <p className="mt-2 text-2xl font-black text-white">{activitySummary.restarts}</p>
              <p className="mt-1 text-[11px] text-slate-300 break-keep">결과를 보고 다시 시작한 횟수</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-[11px] text-slate-400 font-bold tracking-[0.15em] uppercase">저장·공유</p>
              <p className="mt-2 text-2xl font-black text-white">{activitySummary.saveOrShare}</p>
              <p className="mt-1 text-[11px] text-slate-300 break-keep">결과 카드를 남긴 횟수</p>
            </div>
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
                <p className="text-[11px] text-slate-400 font-bold tracking-[0.15em] uppercase px-1">이전 결과 상세</p>
                {historyData.map((item, idx) => (
                  <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4">
                    <div className="flex justify-between items-center">
                      <div className="flex flex-col">
                        <span className="text-slate-300 font-medium text-sm">{item.date}</span>
                        {item.time && <span className="text-[11px] text-slate-500">{item.time}</span>}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] bg-brand/20 border border-brand/30 text-brand px-2 py-0.5 rounded-full">싱크로율 {item.percent}%</span>
                          <span className="text-2xl font-black text-cyan-400 drop-shadow-md">{item.mbti}</span>
                        </div>
                      </div>
                    </div>
                    <p className="mt-2 text-[12px] text-slate-400 break-keep">{getHistoryEntryNote(item, idx, historyData)}</p>
                  </div>
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
  );
}
