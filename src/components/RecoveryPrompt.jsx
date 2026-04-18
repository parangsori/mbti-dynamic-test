import { motion } from 'framer-motion';

export default function RecoveryPrompt({ session, onResume, onDismiss }) {
  if (!session) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.94, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 16 }}
        className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl overflow-hidden relative"
      >
        <h3 className="text-xl font-black text-white">이어서 할까요?</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-300 break-keep">
          {session.currIdx + 1}번째 문항까지 진행 중이던 기록이 있어요. 이어서 하면 방금 보던 흐름을 그대로 확인할 수 있어요.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <button onClick={onResume} className="w-full py-4 rounded-2xl bg-gradient-to-r from-brand to-cyan-500 text-white font-bold">
            이어서 하기
          </button>
          <button onClick={onDismiss} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-slate-300 font-bold">
            새로 시작하기
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
