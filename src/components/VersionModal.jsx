import { useEffect } from 'react';
import { motion } from 'framer-motion';

export default function VersionModal({ changelog, onClose }) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="version-modal-title"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="relative flex max-h-[calc(100dvh-2rem)] w-full max-w-sm flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 shadow-2xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="absolute top-[-50px] right-[-50px] w-32 h-32 bg-brand/30 blur-3xl rounded-full"></div>
        <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/10 bg-slate-900/95 px-5 py-4 backdrop-blur-sm">
          <h3 id="version-modal-title" className="text-xl font-black text-white">업데이트 내역</h3>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[24px] font-light leading-none text-slate-200 transition-colors hover:bg-white/10"
            aria-label="업데이트 내역 닫기"
          >
            ×
          </button>
        </div>
        <div className="flex min-h-0 flex-col gap-4 overflow-y-auto px-5 py-5 overscroll-contain">
          {changelog.map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
              <div className="flex items-center justify-between">
                <p className="text-base font-black text-white">{item.version}</p>
                <span className="text-xs text-slate-400">{item.date}</span>
              </div>
              <ul className="mt-3 flex flex-col gap-2">
                {item.updates.map((update, updateIndex) => (
                  <li key={updateIndex} className="text-sm text-slate-400 leading-relaxed flex items-start gap-2">
                    <span className="text-brand shrink-0">•</span>
                    {update}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}
