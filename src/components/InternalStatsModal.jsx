import { motion } from 'framer-motion';
import { formatEventLabel } from '../lib/internalStats.js';

const StatCard = ({ label, value, hint }) => (
  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
    <p className="text-[11px] font-bold tracking-[0.15em] text-slate-400 uppercase">{label}</p>
    <p className="mt-2 text-2xl font-black text-white">{value}</p>
    <p className="mt-1 text-[11px] leading-relaxed text-slate-400 break-keep">{hint}</p>
  </div>
);

export default function InternalStatsModal({ summary, onClose }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        className="w-full max-w-md max-h-[88dvh] overflow-hidden rounded-3xl border border-white/10 bg-slate-900 shadow-2xl flex flex-col"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
          <div>
            <p className="text-[11px] font-bold tracking-[0.2em] text-cyan-200 uppercase">Internal Stats</p>
            <h3 className="mt-1 text-xl font-black text-white">로컬 운영 요약</h3>
          </div>
          <button onClick={onClose} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-200 text-xl hover:bg-white/10 transition-colors">
            ×
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <div className="grid grid-cols-2 gap-3">
            <StatCard label="시작 수" value={summary.starts} hint="테스트 진입 횟수" />
            <StatCard label="3문항 도달" value={`${summary.reach3} / ${Math.round(summary.reach3Rate)}%`} hint="초반 흡입력 확인" />
            <StatCard label="완주" value={`${summary.completes} / ${Math.round(summary.completionRate)}%`} hint="시작 대비 완주율" />
            <StatCard label="저장/공유" value={`${summary.saveOrShare} / ${Math.round(summary.saveShareRate)}%`} hint="완주 대비 결과 반응" />
            <StatCard label="기록 열기" value={summary.historyOpens} hint="기록 확인 행동" />
            <StatCard label="다시하기" value={`${summary.restarts} / ${Math.round(summary.restartRate)}%`} hint="완주 대비 재도전" />
          </div>

          <div className="mt-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-4 py-4">
            <p className="text-[11px] font-bold tracking-[0.2em] text-cyan-100 uppercase">해석 메모</p>
            <div className="mt-3 flex flex-col gap-2">
              {summary.insights.map((insight, index) => (
                <p key={index} className="text-sm leading-relaxed text-slate-100 break-keep">{insight}</p>
              ))}
            </div>
          </div>

          <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
            <p className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">최근 이벤트</p>
            {summary.recent.length === 0 ? (
              <p className="mt-3 text-sm text-slate-400">아직 기록된 이벤트가 없습니다.</p>
            ) : (
              <div className="mt-3 flex flex-col gap-3">
                {summary.recent.map((event, index) => (
                  <div key={`${event.name}-${event.at}-${index}`} className="rounded-xl border border-white/5 bg-black/20 px-3 py-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-semibold text-white">{formatEventLabel(event.name)}</p>
                      <span className="text-[11px] text-slate-500">{new Date(event.at).toLocaleString('ko-KR')}</span>
                    </div>
                    {event.payload && Object.keys(event.payload).length > 0 && (
                      <p className="mt-2 text-[11px] text-slate-400 break-all">{JSON.stringify(event.payload)}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="border-t border-white/10 px-5 py-4">
          <button onClick={onClose} className="w-full rounded-2xl border border-white/10 bg-white/10 py-4 text-sm font-bold text-slate-200 hover:bg-white/20 transition-colors">
            닫기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
