import { motion } from 'framer-motion';

export default function VersionModal({ changelog, onClose }) {
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
        <h3 className="text-xl font-black text-white mb-6">업데이트 내역</h3>
        <div className="flex flex-col gap-4 max-h-[60vh] overflow-y-auto pr-2">
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
        <button onClick={onClose} className="w-full py-4 mt-8 bg-white/10 border border-white/10 rounded-2xl text-slate-200 font-bold hover:bg-white/20 transition-colors">
          확인
        </button>
      </motion.div>
    </motion.div>
  );
}
