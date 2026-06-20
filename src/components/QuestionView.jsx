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
const TOUCH_GUARD_INTENT_PX = 10;

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
  transitionMessage,
  questionDirection,
  tempoMessage,
  contextVisual,
  phase = 'base',
  canGoBack,
  onAnswer,
  onMiddleAnswer,
  onBack
}) {
  const [activeDragSide, setActiveDragSide] = useState(null);
  const [swipeFeedbackSide, setSwipeFeedbackSide] = useState(null);
  const [flyOutSide, setFlyOutSide] = useState(null);
  const [showWiggle, setShowWiggle] = useState(false);
  const [answerFlash, setAnswerFlash] = useState(null);
  const answerStageRef = useRef(null);
  const draggedCardRef = useRef(false);
  const swipeFeedbackTimerRef = useRef(null);
  const touchStartRef = useRef(null);

  useEffect(() => {
    if (currIdx === 0 && !isTransitioning) {
      const timer = setTimeout(() => {
        setShowWiggle(true);
        setTimeout(() => setShowWiggle(false), 800);
      }, 600);
      return () => clearTimeout(timer);
    }
  }, [currIdx, isTransitioning]);
  const firstOption = question.options[0];
  const secondOption = question.options[1];
  const contextKey = contextVisual?.key || 'daily';
  const contextImage = CONTEXT_IMAGES[contextKey] || CONTEXT_IMAGES.daily;
  const isFollowupPhase = phase === 'followup';
  const isFirstQuestion = currIdx === 0;

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (isTransitioning || isTextInputTarget(event.target)) return;
      if (event.key === 'ArrowLeft' && firstOption) {
        event.preventDefault();
        setFlyOutSide('left');
        onAnswer(firstOption, 'keyboard_left');
      }
      if (event.key === 'ArrowRight' && secondOption) {
        event.preventDefault();
        setFlyOutSide('right');
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

  useEffect(() => {
    const answerStage = answerStageRef.current;
    if (!answerStage) return undefined;

    const handleTouchStart = (event) => {
      if (event.touches?.length !== 1) {
        touchStartRef.current = null;
        return;
      }

      const touch = event.touches?.[0];
      if (!touch) return;
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY
      };
    };

    const handleTouchMove = (event) => {
      if (event.touches?.length !== 1) {
        touchStartRef.current = null;
        return;
      }

      const start = touchStartRef.current;
      const touch = event.touches?.[0];
      if (!start || !touch) return;

      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const isHorizontalIntent = Math.abs(dx) > TOUCH_GUARD_INTENT_PX && Math.abs(dx) > Math.abs(dy) * 1.1;

      if (isHorizontalIntent && event.cancelable) {
        event.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      touchStartRef.current = null;
    };

    answerStage.addEventListener('touchstart', handleTouchStart, { passive: true });
    answerStage.addEventListener('touchmove', handleTouchMove, { passive: false });
    answerStage.addEventListener('touchend', handleTouchEnd);
    answerStage.addEventListener('touchcancel', handleTouchEnd);

    return () => {
      answerStage.removeEventListener('touchstart', handleTouchStart);
      answerStage.removeEventListener('touchmove', handleTouchMove);
      answerStage.removeEventListener('touchend', handleTouchEnd);
      answerStage.removeEventListener('touchcancel', handleTouchEnd);
    };
  }, []);

  const triggerSwipeFeedback = (side) => {
    setSwipeFeedbackSide(side);
    setAnswerFlash(side);

    if (swipeFeedbackTimerRef.current) {
      window.clearTimeout(swipeFeedbackTimerRef.current);
    }
    swipeFeedbackTimerRef.current = window.setTimeout(() => {
      setSwipeFeedbackSide(null);
      setAnswerFlash(null);
    }, 260);

    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate(SWIPE_VIBRATION_PATTERN);
    }
  };

  const resolveCardSwipe = (option, side, _, info) => {
    if (isTransitioning) return;

    const x = info.offset.x;
    const y = info.offset.y;
    const isHorizontalIntent = Math.abs(x) > Math.abs(y) * 0.8;
    const hasSwipeDistance = Math.abs(x) >= SWIPE_DISTANCE;
    const hasSwipeVelocity = Math.abs(info.velocity.x) >= SWIPE_VELOCITY;
    const isValidDirection = side === 'left' ? x < 0 : x > 0;

    setActiveDragSide(null);

    if (!isHorizontalIntent || !isValidDirection || (!hasSwipeDistance && !hasSwipeVelocity)) return;

    triggerSwipeFeedback(side);
    setFlyOutSide(side);
    onAnswer(option, side === 'left' ? 'swipe_left' : 'swipe_right');
  };

  const updateCardDragHint = (side, _, info) => {
    const x = info.offset.x;
    const y = info.offset.y;
    const isValidDirection = side === 'left' ? x < 0 : x > 0;
    const isHorizontalIntent = Math.abs(x) > Math.abs(y) * 0.8;

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
    const side = option === firstOption ? 'left' : 'right';
    triggerSwipeFeedback(side);
    setFlyOutSide(side);
    onAnswer(option, 'tap');
  };

  const progress = ((currIdx + 1) / totalQuestions) * 100;
  const progressPrev = (currIdx / totalQuestions) * 100;
  const answerHelpText = isFirstQuestion
    ? '카드를 좌우로 밀거나 원하는 답변을 눌러도 돼요'
    : '답변을 누르거나 카드 방향으로 가볍게 밀어주세요';

  return (
    <motion.div
      key="question"
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
      aria-busy={isTransitioning}
      className="w-full min-h-[100dvh] flex flex-col max-w-[23.5rem] pt-6 pb-8 px-5"
    >
      <div className="w-full mb-3 rounded-[1.45rem] border border-white/10 bg-white/[0.045] px-4 py-3 shadow-[0_18px_48px_rgba(2,6,23,0.24)] backdrop-blur-xl">
        <div className="flex items-center justify-between gap-3 text-slate-300 font-semibold">
          <div className="min-w-0">
            <span className={`inline-flex rounded-full border px-3 py-1 text-[11px] font-black tracking-[0.12em] ${
              isFollowupPhase
                ? 'border-fuchsia-200/25 bg-fuchsia-300/10 text-fuchsia-100'
                : 'border-cyan-200/25 bg-cyan-300/10 text-cyan-100'
            }`}>
              {questionLabel || `Q${currIdx + 1}`}
            </span>
          </div>
          <span className="shrink-0 rounded-full bg-slate-950/30 px-3 py-1 text-[12px] font-bold text-slate-200">
            {counterText || `${currIdx + 1} / ${totalQuestions}`}
          </span>
        </div>

        <div className="relative mt-3">
          <div className="h-2 w-full bg-slate-950/50 rounded-full overflow-hidden border border-white/5">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 via-brand to-pink-400 relative"
              initial={{ width: `${progressPrev}%` }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] bg-[length:200%_100%]" />
            </motion.div>
          </div>

          <div className="flex justify-between mt-2 px-0.5" aria-hidden="true">
            {Array.from({ length: totalQuestions }, (_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-300 ${
                  i < currIdx + 1
                    ? 'w-3 bg-cyan-300 shadow-[0_0_4px_rgba(34,211,238,0.55)]'
                    : i === currIdx + 1
                      ? 'w-2 bg-slate-500'
                      : 'w-1.5 bg-slate-700'
                } ${i === currIdx ? 'dot-pop' : ''}`}
              />
            ))}
          </div>
        </div>

        <p className="mt-2.5 text-[12px] text-center font-semibold text-cyan-100/90 break-keep">{tempoMessage}</p>
        {phaseHint && <p className="mt-1.5 text-[11px] text-center text-slate-400 break-keep">{phaseHint}</p>}
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
            <section className="question-card-shell relative overflow-hidden rounded-[1.65rem] border border-white/10 bg-slate-950/[0.58] shadow-[0_22px_60px_rgba(2,6,23,0.34)] backdrop-blur-xl">
              <div className="relative h-20 w-full overflow-hidden">
                <img src={contextImage} alt={contextVisual?.alt || '질문 분위기'} className="h-full w-full object-cover opacity-[0.82] saturate-[0.92]" draggable="false" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-300/16 via-brand/10 to-fuchsia-300/18 mix-blend-screen" />
                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/12 via-slate-950/26 to-slate-950/82" />
                <span className="absolute left-4 top-3 rounded-full border border-white/15 bg-slate-950/34 px-3 py-1 text-[10px] font-black tracking-[0.14em] text-white/90 backdrop-blur-md">
                  {contextVisual?.label || '일상 선택'}
                </span>
              </div>
              <div className="px-5 py-5">
                <h2 className="text-[21px] font-extrabold text-white leading-snug break-keep text-center">{question.q}</h2>
                <p className="mt-3 text-center text-[11px] font-semibold text-slate-400 break-keep">
                  가장 가까운 쪽을 골라주세요
                </p>
              </div>
            </section>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="mt-5 flex flex-col gap-3 relative w-full">
        <div
          ref={answerStageRef}
          className={`relative overflow-hidden rounded-[2rem] border px-3 py-3.5 shadow-[0_24px_70px_rgba(2,6,23,0.30)] backdrop-blur-xl [touch-action:pan-y_pinch-zoom] transition-colors ${
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
              const isFlyingOut = flyOutSide === side;
              const isOtherFlyingOut = flyOutSide && flyOutSide !== side;
              const hasFlash = answerFlash === side;

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
                    rotate: isFlyingOut ? (side === 'left' ? -12 : 12) : hasSwipeFeedback ? (side === 'left' ? -5 : 5) : isActive ? (side === 'left' ? -3.6 : 3.6) : 0,
                    scale: isFlyingOut ? 0.9 : isOtherFlyingOut ? 0.95 : hasSwipeFeedback ? 1.065 : isActive ? 1.04 : isTransitioning ? 0.95 : 1,
                    x: isFlyingOut ? (side === 'left' ? -350 : 350) : hasSwipeFeedback ? (side === 'left' ? -22 : 22) : (showWiggle && !activeDragSide) ? (side === 'left' ? [-5, 5, -5, 0] : [5, -5, 5, 0]) : 0,
                    opacity: isFlyingOut ? 0 : isOtherFlyingOut ? 0.3 : isTransitioning ? 0.4 : isMuted ? 0.7 : 1
                  }}
                  transition={{ type: 'spring', stiffness: 650, damping: 20 }}
                  aria-label={`${side === 'left' ? '왼쪽 답변' : '오른쪽 답변'}: ${option.text}`}
                  className={`relative flex min-h-[6.25rem] w-[82%] flex-col justify-center overflow-hidden rounded-2xl border px-4 py-4 text-center shadow-lg transition-colors active:scale-[0.98] ${
                    side === 'left' ? 'self-start' : 'self-end'
                  } ${
                    isActive || hasSwipeFeedback
                      ? side === 'left'
                        ? 'border-cyan-100/90 bg-cyan-300/[0.14] text-cyan-50 shadow-[0_0_24px_rgba(34,211,238,0.2)]'
                        : 'border-fuchsia-100/90 bg-fuchsia-300/[0.14] text-fuchsia-50 shadow-[0_0_24px_rgba(232,121,249,0.2)]'
                      : 'border-white/10 bg-slate-900/60 text-white hover:bg-white/10'
                  } ${hasFlash ? 'answer-selected' : ''}`}
                >
                  {hasFlash && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0.6 }}
                      animate={{ scale: 2.5, opacity: 0 }}
                      transition={{ duration: 0.4 }}
                      className={`absolute inset-0 rounded-2xl ${side === 'left' ? 'bg-cyan-400/20' : 'bg-fuchsia-400/20'}`}
                    />
                  )}
                  <span className={`pointer-events-none absolute inset-y-3 ${side === 'left' ? 'left-0 bg-cyan-300/45' : 'right-0 bg-fuchsia-300/45'} w-1 rounded-full`} />
                  <div className={`mb-2 flex items-center ${side === 'left' ? 'justify-start' : 'justify-end'}`}>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-black tracking-[0.14em] ${
                      side === 'left' ? 'bg-cyan-300/10 text-cyan-100' : 'bg-fuchsia-300/10 text-fuchsia-100'
                    }`}>
                      {side === 'left' ? 'A 선택' : 'B 선택'}
                    </span>
                  </div>
                  <span className="flex flex-1 items-center justify-center text-[15px] font-semibold leading-snug break-words">
                    {option.text}
                  </span>
                </motion.button>
              );
            })}
          </div>
          <p className="relative mt-3 text-center text-[11px] font-semibold text-slate-500 break-keep" role={transitionMessage && isTransitioning ? 'status' : undefined}>
            {transitionMessage && isTransitioning ? transitionMessage : answerHelpText}
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
              className="absolute top-[52%] left-0 w-full text-center z-[100] pointer-events-none -translate-y-1/2"
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
