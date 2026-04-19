import { useState } from 'react';
import { motion } from 'framer-motion';

export default function InternalStatsAuthModal({ onClose, onSubmit }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    const ok = await onSubmit(password);
    if (!ok) {
      setError('비밀번호가 맞지 않습니다.');
      setIsSubmitting(false);
      return;
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.95, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: 16 }}
        className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <p className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">Internal Access</p>
        <h3 className="mt-2 text-xl font-black text-white">내부 운영 데이터 확인</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-400 break-keep">일반 사용자에게는 보이지 않는 내부용 화면입니다. 비밀번호를 입력해야 열립니다.</p>

        <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="비밀번호 입력"
            className="w-full bg-transparent text-white outline-none placeholder:text-slate-500 text-base font-medium"
            autoFocus
            onKeyDown={(event) => {
              if (event.key === 'Enter') handleSubmit();
            }}
          />
        </div>

        {error && <p className="mt-3 text-sm text-rose-300">{error}</p>}

        <div className="mt-6 flex gap-3">
          <button onClick={onClose} className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-bold text-slate-200 hover:bg-white/10 transition-colors">
            취소
          </button>
          <button onClick={handleSubmit} disabled={isSubmitting || !password.trim()} className="flex-1 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 py-3 text-sm font-bold text-cyan-100 hover:bg-cyan-400/15 disabled:opacity-40 transition-colors">
            {isSubmitting ? '확인 중...' : '열기'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
