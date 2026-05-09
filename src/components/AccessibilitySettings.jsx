import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const FONT_SIZE_OPTIONS = [
  { key: 'default', label: '기본', scale: 1, px: 16 },
  { key: 'large', label: '크게', scale: 1.25, px: 20 },
  { key: 'xlarge', label: '더 크게', scale: 1.5, px: 24 }
];

const STORAGE_KEY_FONT = 'mbti_font_scale';
const STORAGE_KEY_CONTRAST = 'mbti_high_contrast';

export const loadAccessibilitySettings = () => {
  try {
    const fontScale = parseFloat(localStorage.getItem(STORAGE_KEY_FONT)) || 1;
    const highContrast = localStorage.getItem(STORAGE_KEY_CONTRAST) === 'true';
    return { fontScale, highContrast };
  } catch {
    return { fontScale: 1, highContrast: false };
  }
};

export const applyAccessibilitySettings = ({ fontScale, highContrast }) => {
  document.documentElement.style.setProperty('--app-font-scale', fontScale);
  document.documentElement.classList.toggle('high-contrast', highContrast);
};

export default function AccessibilitySettings({
  isOpen,
  onClose,
  homeScreenTipHidden,
  onShowHomeScreenTipAgain
}) {
  const [fontScale, setFontScale] = useState(() => {
    try {
      return parseFloat(localStorage.getItem(STORAGE_KEY_FONT)) || 1;
    } catch {
      return 1;
    }
  });
  const [highContrast, setHighContrast] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY_CONTRAST) === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    applyAccessibilitySettings({ fontScale, highContrast });
    try {
      localStorage.setItem(STORAGE_KEY_FONT, String(fontScale));
      localStorage.setItem(STORAGE_KEY_CONTRAST, String(highContrast));
    } catch {
      // ignore
    }
  }, [fontScale, highContrast]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[99999] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={onClose} />
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative z-10 w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-2xl"
          >
            <h3 className="text-center text-[18px] font-black text-white">접근성 설정</h3>
            <p className="mt-2 text-center text-[13px] text-slate-400">
              편하게 사용할 수 있도록 글자 크기와 대비를 조정할 수 있어요
            </p>

            <div className="mt-6">
              <p className="text-[13px] font-bold text-slate-300 mb-3">글자 크기</p>
              <div className="flex gap-2">
                {FONT_SIZE_OPTIONS.map((option) => (
                  <button
                    key={option.key}
                    onClick={() => setFontScale(option.scale)}
                    className={`flex-1 rounded-2xl border px-3 py-3 text-center transition-all ${
                      fontScale === option.scale
                        ? 'border-cyan-300/40 bg-cyan-300/[0.12] text-cyan-100'
                        : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                    }`}
                  >
                    <span className="block font-black" style={{ fontSize: `${option.px}px` }}>가</span>
                    <p className="mt-1 text-[11px] font-bold text-slate-400">{option.label} ({option.px}px)</p>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-[11px] text-slate-500 text-center">
                현재: {Math.round(fontScale * 16)}px 기준
              </p>
            </div>

            <div className="mt-5">
              <p className="text-[13px] font-bold text-slate-300 mb-3">고대비 모드</p>
              <button
                onClick={() => setHighContrast(!highContrast)}
                className={`w-full rounded-2xl border px-4 py-3 text-left text-[13px] font-bold transition-all ${
                  highContrast
                    ? 'border-cyan-300/40 bg-cyan-300/[0.12] text-cyan-100'
                    : 'border-white/10 bg-white/[0.04] text-slate-300 hover:bg-white/[0.08]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{highContrast ? '고대비 모드 켜짐' : '고대비 모드 꺼짐'}</span>
                  <div className={`w-10 h-5 rounded-full transition-colors ${highContrast ? 'bg-cyan-400' : 'bg-slate-600'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-md transition-transform mt-0.5 ${highContrast ? 'ml-[22px]' : 'ml-0.5'}`} />
                  </div>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">텍스트와 배경의 색상 대비를 높여 가독성을 개선합니다</p>
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
              <p className="text-[13px] font-bold text-slate-300">홈화면 추가 안내</p>
              <p className="mt-1 text-[11px] leading-relaxed text-slate-400">
                안내를 다시 보이게 하면 시작 화면에서 홈화면 추가 방법을 확인할 수 있어요.
              </p>
              <button
                type="button"
                onClick={onShowHomeScreenTipAgain}
                className="mt-3 w-full rounded-2xl border border-cyan-300/25 bg-cyan-300/[0.1] px-4 py-3 text-[13px] font-black text-cyan-100 transition hover:bg-cyan-300/[0.16]"
              >
                {homeScreenTipHidden ? '안내 다시 보기' : '시작 화면에서 안내 보기'}
              </button>
            </div>

            <button
              onClick={onClose}
              className="mt-6 w-full rounded-2xl bg-white/10 py-3 text-[14px] font-bold text-white transition hover:bg-white/15"
            >
              닫기
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
