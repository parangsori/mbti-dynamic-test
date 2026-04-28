import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import todayImage from '../../resources/question-context/today.svg';
import relationshipImage from '../../resources/question-context/relationship.svg';
import dailyImage from '../../resources/question-context/daily.svg';
import situationImage from '../../resources/question-context/situation.svg';
import calibrationImage from '../../resources/question-context/calibration.svg';

const CONTEXT_IMAGES = {
  today: todayImage,
  relationship: relationshipImage,
  daily: dailyImage,
  situation: situationImage,
  calibration: calibrationImage
};

const SWIPE_DISTANCE = 52;
const SWIPE_VELOCITY = 380;
const SWIPE_VIBRATION_PATTERN = [12, 24, 12];

const isTextInputTarget = (target) => {
  if (!target) return false;
  const tagName = target.tagName?.toLowerCase();
  return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable;
};

export default function QuestionView({
  currIdx,
  totalQuestions,
  question,
  questionLabel,
  counterText,
  phaseHint,
  showMiddleOption,
  middleLabel,
  microCopy,
  isTransitioning,
  questionDirection,
  tempoMessage,
  contextVisual,
  canGoBack,
  onAnswer,
  onMiddleAnswer,
  onBack
}) {
  const [activeDragSide, setActiveDragSide] = useState(null);
  const [swipeFeedbackSide, setSwipeFeedbackSide] = useState(null);
  const draggedCardRef = useRef(false);
  const swipeFeedbackTimerRef = useRef(null);
  const firstOption = question.options[0];
  const secondOption = question.options[1];
  const contextKey = contextVisual?.key || 'daily';
  const contextImage = CONTEXT_IMAGES[contextKey] || CONTEXT_IMAGES.daily;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isTransitioning || isTextInputTarget(event.target)) return;
      if (event.key === 'ArrowLeft' && firstOption) {
        event.preventDefault();
        onAnswer(firstOption, 'keyboard_left');
      }
      if (event.key === 'ArrowRight' && secondOption) {
        event.preventDefault();
        onAnswer(secondOption, 'keyboard_right');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [firstOption, isTransitioning, onAnswer, secondOption]);

  useEffect(() => {
    return () => {
      if (swipeFeedbackTimerRef.current) {
        window.clearTimeout(swipeFeedbackTimerRef.current);
      }
    };
  }, []);

  const triggerSwipeFeedback = (side) => {
    setSwipeFeedbackSide(side);

    if (swipeFeedbackTimerRef.current) {
      window.clearTimeout(swipeFeedbackTimerRef.current);
    }
    swipeFeedbackTimerRef.current = window.setTimeout(() => {
      setSwipeFeedbackSide(null);
    }, 260);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(SWIPE_VIBRATION_PATTERN);
    }
  };

  const resolveCardSwipe = (option, side, _, info) => {
    if (isTransitioning) return;

    const x = info.offset.x;
    const y = info.offset.y;
    const isHorizontalIntent = Math.abs(x) > Math.abs(y) * 1.1;
    const hasSwipeDistance = Math.abs(x) >= SWIPE_DISTANCE;
    const hasSwipeVelocity = Math.abs(info.velocity.x) >= SWIPE_VELOCITY;
    const isValidDirection = side === 'left' ? x < 0 : x > 0;

    setActiveDragSide(null);

    if (!isHorizontalIntent || !isValidDirection || (!hasSwipeDistance && !hasSwipeVelocity)) return;

    triggerSwipeFeedback(side);
    onAnswer(option, side === 'left' ? 'swipe_left' : 'swipe_right');
  };

  const updateCardDragHint = (side, _, info) => {
    const x = info.offset.x;
    const y = info.offset.y;
    const isValidDirection = side === 'left' ? x < 0 : x > 0;
    const isHorizontalIntent = Math.abs(x) > Math.abs(y) * 1.1;

    if (Math.abs(x) > 8 || Math.abs(y) > 8) {
      draggedCardRef.current = true;
    }

    if (Math.abs(x) < 24) {
      setActiveDragSide(null);
      return;
    }

    setActiveDragSide(isHorizontalIntent && isValidDirection ? side : null);
  };

  const handleCardClick = (option) => {
    if (draggedCardRef.current) {
      draggedCardRef.current = false;
      return;
    }
    onAnswer(option, 'tap');
  };

  return (
    <motion.div
      key="question"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      className="w-full min-h-[100dvh] flex flex-col max-w-sm pt-8 pb-8 px-5"
    >
      <div className="w-full mb-3">
        <div className="flex justify-between items-end mb-2.5 text-slate-300 font-bold">
          <span className="text-2xl bg-clip-text text-transparent bg-gradient-to-r from-cyan-400 to-brand tracking-widest italic">{questionLabel || `Q${currIdx + 1}`}</span>
          <span className="text-sm font-medium bg-white/10 px-3 py-1 rounded-full">{counterText || `${currIdx + 1} / ${totalQuestions}`}</span>
        </div>
        <div className="h-2.5 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-400 to-brand delay-100 ease-out"
            initial={{ width: `${(currIdx / totalQuestions) * 100}%` }}
            animate={{ width: `${((currIdx + 1) / totalQuestions) * 100}%` }}
            transition={{ duration: 0.5, type: 'spring' }}
          />
        </div>
        <p className="mt-2.5 text-[12px] text-center font-semibold text-cyan-200/90 break-keep">{tempoMessage}</p>
        {phaseHint && <p className="mt-2 text-[11px] text-center text-slate-400 break-keep">{phaseHint}</p>}
      </div>

      <div className="w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={currIdx}
            initial={{ opacity: 0, x: 56 * questionDirection }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -56 * questionDirection }}
            transition={{ duration: 0.35, ease: 'easeOut' }}
            className="w-full"
          >
            <section className="relative overflow-hidden rounded-[1.65rem] border border-white/10 bg-white/[0.06] shadow-[0_22px_60px_rgba(2,6,23,0.32)] backdrop-blur-xl">
              <div className="relative h-28 w-full overflow-hidden">
                <img src={contextImage} alt={contextVisual?.alt || '질문 분위기'} className="h-full w-full object-cover" draggable="false" />
                <div className="absolute inset-0 bg-gradient-to-b from-black/5 via-transparent to-slate-950/72" />
                <span className="absolute left-4 top-4 rounded-full border border-white/15 bg-black/25 px-3 py-1 text-[10px] font-black tracking-[0.14em] text-white/90 backdrop-blur-md">
                  {contextVisual?.label || '일상 선택'}
                </span>
              </div>
              <div className="px-5 py-6">
                <h2 className="text-[21px] font-black text-white leading-snug break-keep text-center">{question.q}</h2>
                <p className="mt-4 text-center text-[11px] font-semibold text-slate-400 break-keep">
                  질문을 읽고 아래 답변 카드를 골라주세요
                </p>
              </div>
            </section>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-8 flex flex-col gap-3 relative w-full">
        <div
          className={`relative overflow-hidden rounded-[2rem] border px-3 py-4 shadow-[0_24px_70px_rgba(2,6,23,0.30)] backdrop-blur-xl touch-pan-y transition-colors ${
            activeDragSide === 'left'
              ? 'border-cyan-300/30 bg-cyan-300/[0.07]'
              : activeDragSide === 'right'
                ? 'border-fuchsia-300/30 bg-fuchsia-300/[0.07]'
                : 'border-white/10 bg-white/[0.035]'
          }`}
          role="group"
          aria-label="답변 카드. 왼쪽 또는 오른쪽으로 드래그해 답할 수 있어요."
        >
          <div className="pointer-events-none absolute inset-y-4 left-3 w-20 rounded-full bg-cyan-300/10 blur-2xl" />
          <div className="pointer-events-none absolute inset-y-4 right-3 w-20 rounded-full bg-fuchsia-300/10 blur-2xl" />
          <div className={`pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 rounded-full border border-cyan-200/20 bg-cyan-300/10 px-3 py-1 text-[10px] font-black text-cyan-50 transition-opacity ${
            activeDragSide === 'left' ? 'opacity-100' : 'opacity-0'
          }`}>
            왼쪽 선택
          </div>
          <div className={`pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 rounded-full border border-fuchsia-200/20 bg-fuchsia-300/10 px-3 py-1 text-[10px] font-black text-fuchsia-50 transition-opacity ${
            activeDragSide === 'right' ? 'opacity-100' : 'opacity-0'
          }`}>
            오른쪽 선택
          </div>
          <div className="relative flex flex-col gap-3.5">
            {question.options.map((option, index) => {
              const side = index === 0 ? 'left' : 'right';
              const isActive = activeDragSide === side;
              const hasSwipeFeedback = swipeFeedbackSide === side;
              const isMuted = activeDragSide && !isActive;
              return (
                <motion.button
                  key={index}
                  drag="x"
                  dragConstraints={{ left: 0, right: 0 }}
                  dragElastic={0.62}
                  dragTransition={{ power: 0.18, timeConstant: 115 }}
                  onDrag={(event, info) => updateCardDragHint(side, event, info)}
                  onDragEnd={(event, info) => resolveCardSwipe(option, side, event, info)}
                  onPointerDown={() => {
                    draggedCardRef.current = false;
                  }}
                  onClick={() => handleCardClick(option)}
                  disabled={isTransitioning}
                  animate={{
                    rotate: hasSwipeFeedback ? (side === 'left' ? -5 : 5) : isActive ? (side === 'left' ? -3.6 : 3.6) : 0,
                    scale: hasSwipeFeedback ? 1.065 : isActive ? 1.04 : 1,
                    x: hasSwipeFeedback ? (side === 'left' ? -22 : 22) : 0
                  }}
                  transition={{ type: 'spring', stiffness: 650, damping: 20 }}
                  className={`relative flex h-[7.25rem] w-[80%] flex-col justify-between overflow-hidden rounded-2xl border px-4 py-3.5 text-center shadow-lg transition-all active:scale-[0.98] ${
                    side === 'left' ? 'self-start' : 'self-end'
                  } ${
                    isActive || hasSwipeFeedback
                      ? side === 'left'
                        ? 'border-cyan-100/90 bg-cyan-300/24 text-white shadow-[0_20px_52px_rgba(34,211,238,0.28)]'
                        : 'border-fuchsia-100/90 bg-fuchsia-300/24 text-white shadow-[0_20px_52px_rgba(217,70,239,0.28)]'
                      : 'border-white/10 bg-slate-900/60 text-white hover:bg-white/10'
                  } ${isTransitioning ? 'opacity-40 scale-95' : isMuted ? 'opacity-70' : 'opacity-100'}`}
                >
                  <span className={`pointer-events-none absolute inset-y-3 ${side === 'left' ? 'left-0 bg-cyan-300/45' : 'right-0 bg-fuchsia-300/45'} w-1 rounded-full`} />
                  <div className={`flex items-center ${side === 'left' ? 'justify-start' : 'justify-end'}`}>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-[0.14em] ${
                      side === 'left' ? 'bg-cyan-300/10 text-cyan-100' : 'bg-fuchsia-300/10 text-fuchsia-100'
                    }`}>
                      {side === 'left' ? '← 왼쪽' : '오른쪽 →'}
                    </span>
                  </div>
                  <span className="mt-2.5 flex flex-1 items-center justify-center text-[15px] font-bold leading-snug break-words">
                    {option.text}
                  </span>
                  <span className={`mt-2.5 text-[10px] font-semibold text-slate-400 ${side === 'left' ? 'text-left' : 'text-right'}`}>
                    {side === 'left' ? '← 밀기' : '밀기 →'}
                  </span>
                </motion.button>
              );
            })}
          </div>
          <p className="relative mt-3 text-center text-[11px] font-semibold text-slate-500 break-keep">
            카드를 좌우로 밀거나 원하는 답변을 눌러도 돼요
          </p>
        </div>

        <div className="mt-2 flex items-center justify-center gap-2">
          {canGoBack && (
            <button
              onClick={onBack}
              disabled={isTransitioning}
              className={`rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[12px] font-bold text-slate-300 transition-all hover:bg-white/10 hover:text-white active:scale-[0.98] ${
                isTransitioning ? 'opacity-40' : 'opacity-100'
              }`}
            >
              이전 문항
            </button>
          )}

          {showMiddleOption && (
            <button
              onClick={() => onMiddleAnswer('middle')}
              disabled={isTransitioning}
              className={`rounded-full border border-white/10 bg-white/5 px-4 py-2 text-[13px] font-semibold text-slate-300 transition-all hover:bg-white/10 hover:text-white active:scale-[0.98] ${
                isTransitioning ? 'opacity-40' : 'opacity-100'
              }`}
            >
              {middleLabel}
            </button>
          )}
        </div>

        <AnimatePresence>
          {microCopy && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ type: 'spring', damping: 12, stiffness: 200 }}
              className="absolute -bottom-16 left-0 w-full text-center z-50 pointer-events-none"
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
