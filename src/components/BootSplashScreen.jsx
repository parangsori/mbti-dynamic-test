import { motion } from 'framer-motion';

export default function BootSplashScreen() {
  return (
    <motion.div
      key="boot-splash"
      initial={{ opacity: 1 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0, scale: 1.05 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950"
    >
      <img
        src="/splash-screen.png"
        alt="Today MBTI Splash"
        className="w-full h-full object-cover"
      />
    </motion.div>
  );
}
