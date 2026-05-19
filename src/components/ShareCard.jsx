import { useLayoutEffect, useRef, useState } from 'react';
import ShareCardWatermark from './ShareCardWatermark.jsx';
import SyncRateBadge from './SyncRateBadge.jsx';

const SHARE_HOOK_SIZE_STEPS = [
  { fontSize: 60, lineHeight: 1.25 },
  { fontSize: 56, lineHeight: 1.25 },
  { fontSize: 50, lineHeight: 1.28 },
  { fontSize: 46, lineHeight: 1.3 },
  { fontSize: 42, lineHeight: 1.3 },
  { fontSize: 38, lineHeight: 1.35 },
  { fontSize: 34, lineHeight: 1.35 }
];

function AutoFitShareHook({ text }) {
  const textRef = useRef(null);
  const [stepIndex, setStepIndex] = useState(0);

  useLayoutEffect(() => {
    const element = textRef.current;
    if (!element) return undefined;

    let frameId = 0;
    let cancelled = false;

    const fitText = async () => {
      if (typeof document !== 'undefined' && document.fonts?.ready) {
        try {
          await document.fonts.ready;
        } catch {
          // ignore font readiness errors and continue with current layout
        }
      }

      if (cancelled) return;

      let nextStepIndex = 0;

      for (let i = 0; i < SHARE_HOOK_SIZE_STEPS.length; i += 1) {
        const step = SHARE_HOOK_SIZE_STEPS[i];
        element.style.fontSize = `${step.fontSize}px`;
        element.style.lineHeight = `${step.lineHeight}`;

        const computedStyle = window.getComputedStyle(element);
        const lineHeight = parseFloat(computedStyle.lineHeight);
        const lineCount = lineHeight > 0 ? Math.round(element.scrollHeight / lineHeight) : 0;

        nextStepIndex = i;
        if (lineCount <= 2) break;
      }

      if (!cancelled) {
        setStepIndex(nextStepIndex);
      }
    };

    frameId = window.requestAnimationFrame(() => {
      fitText();
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(frameId);
    };
  }, [text]);

  const activeStep = SHARE_HOOK_SIZE_STEPS[stepIndex];

  return (
    <div className="mt-4 flex min-h-[164px] max-w-[540px] flex-col justify-center pt-1 pb-2">
      <p
        ref={textRef}
        className="font-black tracking-[-0.045em] text-white break-keep"
        style={{
          fontSize: `${activeStep.fontSize}px`,
          lineHeight: activeStep.lineHeight
        }}
      >
        {text}
      </p>
    </div>
  );
}

function ShareTimePill({ todayLabel, timeLabel, themeKey }) {
  const timeRingTheme = {
    spark: 'border-amber-200/80 shadow-[0_0_22px_rgba(251,191,36,0.28),inset_0_0_16px_rgba(251,113,133,0.22)]',
    wave: 'border-teal-200/80 shadow-[0_0_22px_rgba(45,212,191,0.3),inset_0_0_16px_rgba(96,165,250,0.22)]',
    neon: 'border-cyan-200/80 shadow-[0_0_22px_rgba(34,211,238,0.32),inset_0_0_16px_rgba(168,85,247,0.24)]',
    steady: 'border-emerald-200/80 shadow-[0_0_22px_rgba(110,231,183,0.28),inset_0_0_16px_rgba(203,213,225,0.18)]',
    'soft-shift': 'border-pink-200/80 shadow-[0_0_22px_rgba(249,168,212,0.28),inset_0_0_16px_rgba(129,140,248,0.22)]',
    citrus: 'border-lime-200/80 shadow-[0_0_22px_rgba(190,242,100,0.26),inset_0_0_16px_rgba(45,212,191,0.2)]',
    afterglow: 'border-rose-200/80 shadow-[0_0_22px_rgba(251,113,133,0.28),inset_0_0_16px_rgba(250,204,21,0.18)]',
    studio: 'border-slate-100/80 shadow-[0_0_22px_rgba(226,232,240,0.2),inset_0_0_16px_rgba(56,189,248,0.2)]'
  };

  return (
    <div className="flex min-h-[70px] min-w-[236px] items-center gap-3.5 rounded-[32px] border border-white/18 bg-slate-950/42 px-5 py-2.5 shadow-[0_18px_36px_rgba(2,6,23,0.32)] backdrop-blur-md">
      <div className={`relative flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full border-[3px] ${timeRingTheme[themeKey] || timeRingTheme.neon}`}>
        <span className="relative h-1.5 w-1.5 rounded-full bg-white"></span>
        <span className="absolute left-1/2 top-[8px] h-[11px] w-[3px] -translate-x-1/2 rounded-full bg-white"></span>
        <span className="absolute left-1/2 top-[18px] h-[3px] w-[10px] rounded-full bg-white"></span>
      </div>
      <div className="flex h-full flex-col justify-center text-left">
        <p className="text-[13px] font-black leading-none tracking-[-0.01em] text-white">{todayLabel}</p>
        <p className="mt-2 text-[20px] font-black leading-none text-white tabular-nums">{timeLabel}</p>
      </div>
    </div>
  );
}

export default function ShareCard({ context, getThemeClasses }) {
  const {
    displayName,
    mbti,
    percent,
    info,
    shareHeadline,
    shareCardCopy,
    shareVibeStamp,
    resolvedImageSrc,
    todayLabel,
    timeLabel,
    precisionBadge,
    presentation,
    recentFlowSummary
  } = context;
  const themeClasses = getThemeClasses(presentation?.themeKey);
  const shareOneLine = info.description || shareCardCopy.boast;
  const shareOneLineClass = shareOneLine.length > 62
    ? 'text-[19px] leading-[1.42]'
    : 'text-[21px] leading-[1.45]';
  return (
    <div className={`relative min-h-[1080px] w-[1080px] overflow-hidden rounded-[64px] border border-white/10 ${themeClasses.shareShell} text-white shadow-[0_40px_120px_rgba(2,6,23,0.7)]`}>
      <div className={`absolute -right-20 top-[-90px] h-80 w-80 rounded-full ${themeClasses.haloBottom} blur-3xl`}></div>
      <div className={`absolute bottom-[-80px] left-[-40px] h-72 w-72 rounded-full ${themeClasses.haloTop} blur-3xl`}></div>
      <div className="absolute left-[70px] top-[132px] h-[460px] w-[460px] rounded-full border border-white/5 bg-white/[0.04]"></div>
      <div className="absolute right-[88px] top-[208px] h-[430px] w-[430px] rounded-[46px] border border-white/10 bg-white/[0.04] rotate-[-6deg]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_24%,transparent_72%,rgba(255,255,255,0.03))]"></div>

      <div className="relative z-10 flex h-full flex-col px-20 pb-20 pt-16">
        <div className="flex items-start justify-between gap-8">
          <div className="max-w-[560px]">
            <p className="text-[24px] font-medium tracking-[-0.02em] text-slate-300">
              <span className="font-extrabold text-white">{displayName}</span>님의 오늘 성향 카드
            </p>
            <p className={`mt-5 text-[54px] font-black tracking-[0.12em] drop-shadow-[0_10px_25px_rgba(15,23,42,0.6)] ${themeClasses.label}`}>
              {mbti}
            </p>
            <p className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-5 py-2 text-[21px] font-semibold text-slate-100">
              {info.nickname}
            </p>
          </div>
          <div className="flex min-w-[236px] flex-col items-end gap-3">
            <SyncRateBadge percent={percent} size="share" themeKey={presentation?.themeKey} className="mr-12" />
            <ShareTimePill todayLabel={todayLabel} timeLabel={timeLabel} themeKey={presentation?.themeKey} />
          </div>
        </div>

        <div className="mt-8 grid flex-1 grid-cols-[1.02fr_0.98fr] gap-8">
          <div className="flex h-full flex-col justify-between">
            <div>
              <div className={`inline-flex items-center gap-3 rounded-full border px-5 py-2.5 text-[17px] font-bold ${themeClasses.chip}`}>
                <span className={`inline-block h-2.5 w-2.5 rounded-full ${themeClasses.dot}`}></span>
                {shareVibeStamp}
              </div>
              <AutoFitShareHook text={shareCardCopy.hook} />
              <p className="mt-4 text-[29px] font-semibold leading-[1.38] text-slate-100 break-keep">{shareCardCopy.detail}</p>
              <p className="mt-3 text-[21px] leading-[1.55] text-slate-300 break-keep">{shareHeadline}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {shareCardCopy.tags.slice(0, 3).map((tag, idx) => (
                <span key={`${tag}-${idx}`} className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-2.5 text-[18px] font-bold text-white shadow-[0_14px_30px_rgba(2,6,23,0.28)]">
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-5 rounded-[34px] border border-white/10 bg-black/25 px-6 py-5 shadow-[0_24px_60px_rgba(2,6,23,0.34)]">
              <p className="text-[14px] font-bold tracking-[0.2em] text-slate-500 uppercase">오늘의 한 줄</p>
              <p className={`mt-3 font-semibold text-slate-100 break-keep ${shareOneLineClass}`}>{shareOneLine}</p>
            </div>

            <div className="mt-auto flex items-center justify-between rounded-[28px] border border-white/10 bg-white/[0.03] px-7 py-5">
              <div className="flex flex-col gap-2">
                <p className="text-[15px] font-semibold text-slate-300">{precisionBadge}</p>
                {recentFlowSummary?.timeline && recentFlowSummary.timeline.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="mr-1 text-[12px] font-bold tracking-widest text-slate-500 uppercase">
                      나의 흐름 <span className="text-[10px] font-medium text-slate-400">({presentation.themeLabel})</span>
                    </span>
                    {recentFlowSummary.timeline.map((item, idx) => (
                      <span
                        key={idx}
                        className={`inline-block h-3.5 w-3.5 rounded-full shadow-sm ${
                          getThemeClasses(item.themeKey).dot
                        } ${idx === recentFlowSummary.timeline.length - 1 ? 'scale-125 ring-2 ring-white/50' : 'opacity-70'}`}
                      />
                    ))}
                  </div>
                )}
              </div>
              <p className="ml-4 whitespace-nowrap text-[15px] font-black tracking-[0.14em] text-white">오늘 무드 카드</p>
            </div>

            {/* M2: Brand watermark + QR code */}
            <ShareCardWatermark size="large" />
          </div>

          <div className="flex flex-col">
            <div className={`relative h-[652px] overflow-hidden rounded-[42px] border ${themeClasses.imageFrame} shadow-[0_24px_80px_rgba(2,6,23,0.5)]`}>
              <div className={`absolute inset-x-10 top-12 h-20 rounded-full ${themeClasses.haloTop} blur-3xl`}></div>
              <div className={`absolute inset-x-12 bottom-28 h-20 rounded-full ${themeClasses.haloBottom} blur-3xl`}></div>
              <div className="absolute inset-0 border border-white/5 rounded-[42px]"></div>

              <div className="relative z-10 grid h-full grid-rows-[58px_388px_144px] px-8 pb-6 pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="inline-flex rounded-full border border-white/10 bg-white/[0.08] px-4 py-1.5 text-[14px] font-black tracking-[0.2em] text-slate-100 uppercase">
                    {mbti}
                  </div>
                  <div className="flex items-center gap-1.5">
                    {presentation?.stateLabel && (
                      <span className="rounded-full border border-white/15 bg-white/10 px-3.5 py-1.5 text-[13px] font-bold text-white shadow-sm backdrop-blur-sm">
                        {presentation.stateLabel}
                      </span>
                    )}
                    <div className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[15px] font-black shadow-[0_12px_24px_rgba(15,23,42,0.28)] ${themeClasses.chip}`}>
                      <span className={`inline-block h-2 w-2 rounded-full ${themeClasses.dot}`}></span>
                      {presentation?.themeLabel || '오늘 무드'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  {resolvedImageSrc && (
                    <div className="flex h-[374px] w-[374px] items-center justify-center rounded-[32px] border border-white/70 bg-white px-7 pb-6 pt-5 shadow-[0_24px_48px_rgba(15,23,42,0.82)]">
                      <img
                        src={resolvedImageSrc}
                        alt={mbti}
                        className="h-full w-full object-contain"
                      />
                    </div>
                  )}
                </div>

                <div className="flex items-start pt-1">
                  <div className="w-full rounded-[28px] border border-white/10 bg-black/35 px-6 py-4 backdrop-blur-sm">
                    <p className="text-[13px] font-bold tracking-[0.22em] text-slate-500 uppercase">오늘의 무드</p>
                    <p className="mt-2 text-[25px] font-black leading-[1.22] text-white break-keep">{info.nickname}</p>
                    <p className="mt-2 text-[17px] font-semibold text-slate-200 break-keep">{shareCardCopy.boast}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
