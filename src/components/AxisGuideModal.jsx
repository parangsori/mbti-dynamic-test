import { motion } from 'framer-motion';

export default function AxisGuideModal({ guide, onClose }) {
  if (!guide) return null;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-sm shadow-2xl overflow-hidden relative"
        onClick={(event) => event.stopPropagation()}
      >
        <h3 className="text-xl font-black text-white">{guide.title}</h3>
        <p className="mt-3 text-sm leading-relaxed text-slate-300 break-keep">{guide.body}</p>
        <button onClick={onClose} className="w-full py-4 mt-6 bg-white/10 border border-white/10 rounded-2xl text-slate-200 font-bold hover:bg-white/20 transition-colors">
          확인
        </button>
      </motion.div>
    </motion.div>
  );
}
