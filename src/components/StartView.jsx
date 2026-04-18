import { motion } from 'framer-motion';

export default function StartView({
  userName,
  onChangeUserName,
  onStart,
  hasHistory,
  onOpenHistory
}) {
  return (
    <motion.div
      key="start"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-sm flex flex-col items-center px-6 py-10"
    >
      <div className="w-24 h-24 mb-6 rounded-3xl bg-gradient-to-br from-brand to-cyan-400 rotate-12 flex items-center justify-center shadow-2xl shadow-brand/40">
        <span className="text-4xl text-white font-black -rotate-12">MBTI</span>
      </div>
      <h1 className="text-4xl font-extrabold mb-3 text-center text-white tracking-tight">지금 내 결은 어느 쪽이 더 강할까?</h1>
      <p className="text-slate-300 mb-10 text-center font-medium leading-relaxed">
        12문항으로 오늘의 무드와 성향 흐름을
        <br />
        가볍고 재밌게 확인해보세요
      </p>

      <div className="w-full bg-white/5 p-2 rounded-3xl mb-8 backdrop-blur-xl border border-white/10 relative shadow-inner">
        <input
          value={userName}
          onChange={(event) => onChangeUserName(event.target.value)}
          placeholder="이름은 선택이에요 (비워도 바로 시작)"
          className="w-full bg-transparent text-white placeholder-slate-400 text-center text-xl py-4 outline-none font-bold"
          maxLength="10"
          onKeyPress={(event) => event.key === 'Enter' && onStart()}
        />
        <div className="absolute inset-x-8 bottom-3 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
      </div>

      <button
        onClick={onStart}
        className="w-full py-5 rounded-3xl font-black text-xl transition-all duration-300 bg-gradient-to-r from-brand to-cyan-500 text-white shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:scale-[1.02] active:scale-[0.98]"
      >
        바로 시작하기
      </button>

      <p className="mt-4 text-[12px] text-slate-400 text-center break-keep">이름 없이도 1초 안에 시작할 수 있어요</p>

      {hasHistory && (
        <button onClick={onOpenHistory} className="mt-6 text-sm text-slate-400 underline underline-offset-4 hover:text-white transition-colors">
          🕒 나의 이전 기록 보기
        </button>
      )}
    </motion.div>
  );
}
