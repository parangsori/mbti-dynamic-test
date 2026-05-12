import { useEffect, useState } from 'react';

const PULL_REFRESH_START_ZONE = 96;
const PULL_REFRESH_THRESHOLD = 92;
const PULL_REFRESH_MAX = 128;

const isInteractiveTarget = (target) => {
  const tagName = target?.tagName?.toLowerCase();
  return tagName === 'button' || tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target?.isContentEditable;
};

export default function PullToRefreshIndicator({ enabled }) {
  const [pullRefresh, setPullRefresh] = useState({ active: false, distance: 0, refreshing: false });

  useEffect(() => {
    if (!enabled) {
      setPullRefresh({ active: false, distance: 0, refreshing: false });
      return undefined;
    }

    let startY = 0;
    let startX = 0;
    let pulling = false;

    const resetPull = () => setPullRefresh({ active: false, distance: 0, refreshing: false });

    const handleTouchStart = (event) => {
      const touch = event.touches?.[0];
      if (!touch || isInteractiveTarget(event.target) || window.scrollY > 0 || touch.clientY > PULL_REFRESH_START_ZONE) {
        pulling = false;
        return;
      }

      startY = touch.clientY;
      startX = touch.clientX;
      pulling = true;
    };

    const handleTouchMove = (event) => {
      if (!pulling) return;
      const touch = event.touches?.[0];
      if (!touch) return;

      const deltaY = touch.clientY - startY;
      const deltaX = Math.abs(touch.clientX - startX);
      if (deltaY <= 0 || deltaX > deltaY * 0.8 || window.scrollY > 0) {
        resetPull();
        pulling = false;
        return;
      }

      const distance = Math.min(PULL_REFRESH_MAX, Math.round(deltaY * 0.55));
      if (distance > 8) {
        event.preventDefault();
        setPullRefresh({ active: true, distance, refreshing: false });
      }
    };

    const handleTouchEnd = () => {
      if (!pulling) return;
      pulling = false;

      setPullRefresh((current) => {
        if (current.distance >= PULL_REFRESH_THRESHOLD) {
          window.setTimeout(() => window.location.reload(), 120);
          return { active: true, distance: PULL_REFRESH_THRESHOLD, refreshing: true };
        }
        return { active: false, distance: 0, refreshing: false };
      });
    };

    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });
    window.addEventListener('touchcancel', resetPull, { passive: true });

    return () => {
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
      window.removeEventListener('touchcancel', resetPull);
    };
  }, [enabled]);

  if (!enabled || (!pullRefresh.active && !pullRefresh.refreshing)) return null;

  return (
    <div
      className="fixed left-1/2 top-3 z-[99998] flex -translate-x-1/2 items-center gap-2 rounded-full border border-cyan-200/20 bg-slate-950/85 px-4 py-2 text-[12px] font-black text-cyan-50 shadow-2xl backdrop-blur-xl transition-transform"
      style={{ transform: `translate(-50%, ${Math.max(0, pullRefresh.distance - 22)}px)` }}
    >
      <span className={`inline-block h-3 w-3 rounded-full border-2 border-cyan-100 border-t-transparent ${pullRefresh.refreshing ? 'animate-spin' : ''}`} />
      {pullRefresh.refreshing ? '새로고침 중' : pullRefresh.distance >= PULL_REFRESH_THRESHOLD ? '놓으면 새로고침' : '아래로 당겨 새로고침'}
    </div>
  );
}
