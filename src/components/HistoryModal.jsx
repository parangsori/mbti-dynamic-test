import { motion } from 'framer-motion';

export default function HistoryModal({
  latestHistoryComparison,
  latestHistoryInsights,
  historyData,
  getHistoryEntryNote,
  onClose
}) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl overflow-hidden relative"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-brand/30 blur-3xl rounded-full"></div>
        <h3 className="text-xl font-black text-white mb-6 flex items-center gap-2">🕒 최근 변화 기록</h3>

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
              <p className="mt-1 text-[11px] text-slate-300 break-keep">요즘은 이 흐름이 자주 보여요. 다음에도 이어질지 보기 좋아요.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <p className="text-[11px] text-slate-400 font-bold tracking-[0.15em] uppercase">가장 잘 흔들리는 축</p>
              <p className="mt-2 text-lg font-black text-white">{latestHistoryInsights.mostVolatile?.pair || '-'}</p>
              <p className="mt-1 text-[11px] text-slate-300">
                {latestHistoryInsights.mostVolatile?.flips ? '다시 해보면 이 축부터 달라질 수 있어요' : '최근엔 거의 같은 결이 이어졌어요'}
              </p>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-3 max-h-[60vh] overflow-y-auto pr-2">
          {historyData.length === 0 ? (
            <p className="text-slate-400 text-center py-8 text-sm">
              아직 기록이 없습니다.
              <br />
              오늘 결과가 쌓이면 변화 흐름도 함께 보여드릴게요.
            </p>
          ) : (
            historyData.map((item, idx) => (
              <div key={idx} className="bg-white/5 border border-white/5 rounded-2xl p-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-300 font-medium text-sm">{item.date}</span>
                  <div className="flex flex-col items-end gap-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] bg-brand/20 border border-brand/30 text-brand px-2 py-0.5 rounded-full">싱크로율 {item.percent}%</span>
                      <span className="text-2xl font-black text-cyan-400 drop-shadow-md">{item.mbti}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-2 text-[12px] text-slate-400 break-keep">{getHistoryEntryNote(item, idx, historyData)}</p>
              </div>
            ))
          )}
        </div>

        <button onClick={onClose} className="w-full py-4 mt-6 bg-white/10 border border-white/10 rounded-2xl text-slate-200 font-bold hover:bg-white/20 transition-colors">
          닫기
        </button>
      </motion.div>
    </motion.div>
  );
}
