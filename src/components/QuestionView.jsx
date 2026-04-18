import { AnimatePresence, motion } from 'framer-motion';

export default function QuestionView({
  currIdx,
  totalQuestions,
  question,
  microCopy,
  isTransitioning,
  questionDirection,
  tempoMessage,
  onAnswer
}) {
  return (
    <motion.div
      key="question"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full min-h-[100dvh] flex flex-col max-w-sm pt-12 pb-10 px-6"
    >
      <div className="w-full mb-10">
        <div className="flex justify-between items-end mb-3 text-slate-300 font-bold">
          <span className="text-2xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-brand tracking-widest italic">Q{currIdx + 1}</span>
          <span className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full">{currIdx + 1} / {totalQuestions}</span>
        </div>
        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 to-brand delay-100 ease-out"
            initial={{ width: `${(currIdx / totalQuestions) * 100}%` }}
            animate={{ width: `${((currIdx + 1) / totalQuestions) * 100}%` }}
            transition={{ duration: 0.5, type: 'spring' }}
          />
        </div>
        <p className="mt-3 text-[12px] text-center font-semibold text-cyan-200/90 break-keep">{tempoMessage}</p>
      </div>

      <div className="flex-[0.8] flex flex-col justify-center mb-8">
        <AnimatePresence mode="wait">
          <motion.div
            key={currIdx}
            initial={{ opacity: 0, x: 56 * questionDirection }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -56 * questionDirection }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full"
          >
            <h2 className="text-[26px] font-bold text-white leading-snug break-keep text-center">{question.q}</h2>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="flex flex-col gap-4 relative w-full">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => onAnswer(option)}
            disabled={isTransitioning}
            className={`w-full p-6 rounded-3xl bg-white/5 border border-white/10 text-white font-medium text-[16px] hover:bg-white/10 active:bg-white/20 active:scale-[0.98] transition-all text-center break-keep shadow-lg ${isTransitioning ? 'opacity-40 scale-95' : 'opacity-100'}`}
          >
            {option.text}
          </button>
        ))}

        <AnimatePresence>
          {microCopy && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="absolute -bottom-20 left-0 w-full text-center z-50 pointer-events-none"
            >
              <span className="inline-block px-5 py-3 bg-gradient-to-r from-pink-500 to-brand rounded-full text-white text-[15px] font-bold shadow-xl shadow-brand/40 whitespace-nowrap">
                {microCopy}
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
