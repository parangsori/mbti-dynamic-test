import { useLayoutEffect, useRef, useState } from 'react';
import ShareCardWatermark from './ShareCardWatermark.jsx';
import SyncRateBadge from './SyncRateBadge.jsx';
import TypeCharacterMoodRing from './TypeCharacterMoodRing.jsx';

const SHARE_HOOK_SIZE_STEPS = [
  { fontSize: 36, lineHeight: 1.22 },
  { fontSize: 34, lineHeight: 1.24 },
  { fontSize: 32, lineHeight: 1.26 },
  { fontSize: 30, lineHeight: 1.3 },
  { fontSize: 28, lineHeight: 1.32 },
  { fontSize: 26, lineHeight: 1.34 },
  { fontSize: 24, lineHeight: 1.36 }
];

const CELESTIAL_SHARE_SHELL = 'bg-[radial-gradient(circle_at_78%_18%,rgba(34,211,238,0.18),transparent_25%),radial-gradient(circle_at_12%_82%,rgba(45,212,191,0.12),transparent_27%),linear-gradient(145deg,#080C1E_0%,#0e1224_52%,#07111f_100%)]';

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
    <div className="mt-3 flex min-h-[88px] max-w-[520px] flex-col justify-center pt-1 pb-1">
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
    <div className="flex min-h-[76px] min-w-[250px] items-center gap-4 rounded-[34px] border border-white/18 bg-slate-950/42 px-6 py-2.5 shadow-[0_18px_36px_rgba(2,6,23,0.32)] backdrop-blur-md">
      <div className={`relative flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-full border-[3px] ${timeRingTheme[themeKey] || timeRingTheme.neon}`}>
        <span className="relative h-1.5 w-1.5 rounded-full bg-white"></span>
        <span className="absolute left-1/2 top-[9px] h-[12px] w-[3px] -translate-x-1/2 rounded-full bg-white"></span>
        <span className="absolute left-1/2 top-[20px] h-[3px] w-[11px] rounded-full bg-white"></span>
      </div>
      <div className="grid min-h-[44px] content-center text-left">
        <p className="text-[13px] font-black leading-none tracking-[-0.01em] text-white">{todayLabel}</p>
        <p className="mt-1.5 text-[21px] font-black leading-none text-white tabular-nums">{timeLabel}</p>
      </div>
    </div>
  );
}

function hasKoreanBatchim(text = '') {
  const lastHangul = [...text].reverse().find((char) => /[가-힣]/.test(char));
  if (!lastHangul) return false;
  const code = lastHangul.charCodeAt(0) - 0xac00;
  return code >= 0 && code <= 11171 && code % 28 !== 0;
}

export default function ShareCard({ context, getThemeClasses }) {
  const {
    displayName,
    mbti,
    percent,
    info,
    spirit,
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
  const shareOneLine = spirit?.line || info.description || shareCardCopy.boast;
  const characterName = spirit?.displayName || spirit?.name || info.nickname || mbti;
  const characterRole = spirit?.role || shareCardCopy.boast;
  const characterReason = spirit?.why || shareHeadline;
  const subjectName = spirit?.displayName || spirit?.name || characterName;
  const characterSubject = `${subjectName}${hasKoreanBatchim(subjectName) ? '은' : '는'}`;
  const characterWorldCopy = `${characterSubject} 지금 마음에 가장 또렷한 성향을 비춰주고, 하루를 조금 더 나답게 보내도록 곁에서 힌트를 건네는 타입 캐릭터예요.`;
  const shareOneLineClass = shareOneLine.length > 64
    ? 'text-[20px] leading-[1.42]'
    : 'text-[22px] leading-[1.4]';

  return (
    <div className={`relative h-[1080px] w-[1080px] overflow-hidden rounded-[64px] border border-white/10 ${CELESTIAL_SHARE_SHELL} text-white shadow-[0_40px_120px_rgba(2,6,23,0.7)]`}>
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-200/35 to-transparent"></div>
      <div className="absolute inset-y-0 right-[34%] w-px bg-gradient-to-b from-transparent via-white/10 to-transparent"></div>
      <div className="absolute left-[78px] top-[116px] h-[620px] w-[620px] rounded-full border border-white/[0.055]"></div>
      <div className="absolute right-[72px] top-[164px] h-[560px] w-[560px] rounded-full border border-cyan-100/10"></div>
      <div className="absolute right-[118px] top-[230px] h-[280px] w-[520px] rotate-[-16deg] rounded-full border border-white/10"></div>
      <div className="absolute right-[84px] top-[224px] h-[420px] w-[420px] rotate-[14deg] rounded-full border border-white/10"></div>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_24%,transparent_72%,rgba(255,255,255,0.03))]"></div>

      <div className="relative z-10 flex h-full flex-col px-[72px] pb-[66px] pt-[54px]">
        <div className="flex items-start justify-between gap-8">
          <div className="min-w-0">
            <p className="text-[22px] font-semibold tracking-[-0.02em] text-slate-300">
              <span className="font-black text-white">{displayName}</span>님의 오늘 성향 카드
            </p>
            <p className="mt-2 text-[18px] font-semibold leading-[1.5] text-slate-300 break-keep">
              지금 마음을 비춰보니 가장 또렷한 성향은
              <span className="font-black text-white"> {mbti}</span>예요.
            </p>
          </div>
          <ShareTimePill todayLabel={todayLabel} timeLabel={timeLabel} themeKey={presentation?.themeKey} />
        </div>

        <div className="mt-5 grid min-h-0 flex-1 grid-cols-[0.96fr_1.04fr] gap-9">
          <div className="flex h-full flex-col">
            <div className="flex items-start justify-between gap-6">
              <div>
                <p className={`text-[72px] font-black leading-none tracking-[0.09em] drop-shadow-[0_14px_32px_rgba(15,23,42,0.65)] ${themeClasses.label}`}>
                  {mbti}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <span className={`inline-flex min-h-[38px] items-center justify-center gap-2 rounded-full border px-4 py-1.5 text-[15px] font-black leading-none ${themeClasses.chip}`}>
                    <span className={`inline-block h-2.5 w-2.5 rounded-full ${themeClasses.dot}`}></span>
                    {presentation?.themeLabel || '오늘 무드'}
                  </span>
                  {presentation?.stateLabel && (
                    <span className="inline-flex min-h-[38px] items-center justify-center rounded-full border border-white/12 bg-white/[0.06] px-4 py-1.5 text-[15px] font-bold leading-none text-white">
                      {presentation.stateLabel}
                    </span>
                  )}
                </div>
              </div>
              <SyncRateBadge percent={percent} size="share" themeKey={presentation?.themeKey} />
            </div>

            <AutoFitShareHook text={shareCardCopy.hook} />

            <div className="mt-4 rounded-[28px] border border-cyan-100/15 bg-cyan-100/[0.07] px-6 py-4 shadow-[0_24px_70px_rgba(2,6,23,0.32)]">
              <p className="text-[14px] font-black tracking-[0.22em] text-cyan-100/70 uppercase">오늘을 보내는 힌트</p>
              <p className={`mt-3 font-semibold text-slate-50 break-keep ${shareOneLineClass}`}>{shareOneLine}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-3">
              {shareCardCopy.tags.slice(0, 3).map((tag, idx) => (
                <span key={`${tag}-${idx}`} className="inline-flex min-h-[42px] items-center justify-center rounded-full border border-white/10 bg-white/[0.06] px-5 py-1.5 text-[16px] font-bold leading-none text-white shadow-[0_14px_30px_rgba(2,6,23,0.28)]">
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-4 rounded-[28px] border border-white/10 bg-white/[0.04] px-6 py-4">
              <p className="text-[13px] font-black tracking-[0.18em] text-slate-500 uppercase">나를 닮은 한 줄</p>
              <p className="mt-2 text-[17px] font-bold leading-[1.4] text-slate-100 break-keep">{info.description}</p>
            </div>

            <div className="mt-4 rounded-[28px] border border-white/10 bg-black/22 px-6 py-4">
              <p className="text-[15px] font-semibold leading-[1.48] text-slate-300 break-keep">{precisionBadge}</p>
              {recentFlowSummary?.timeline && recentFlowSummary.timeline.length > 0 && (
                <div className="mt-4 flex items-center gap-2">
                  <span className="mr-2 text-[12px] font-bold tracking-widest text-slate-500 uppercase">나의 흐름</span>
                  {recentFlowSummary.timeline.map((item, idx) => (
                    <span
                      key={idx}
                      className={`inline-block h-3.5 w-3.5 rounded-full shadow-sm ${
                        getThemeClasses(item.themeKey).dot
                      } ${idx === recentFlowSummary.timeline.length - 1 ? 'scale-125 ring-2 ring-white/50' : 'opacity-70'}`}
                    />
                  ))}
                  <span className="ml-2 text-[13px] font-bold text-slate-400">{presentation?.themeLabel || '오늘 무드'}</span>
                </div>
              )}
            </div>

            <ShareCardWatermark size="large" />
          </div>

          <div className="flex h-full flex-col justify-start">
            <div className="relative flex h-[830px] min-h-0 flex-col px-5 pt-3">
              <div>
                <p className="text-[13px] font-black tracking-[0.24em] text-slate-400 uppercase">마음을 비추는</p>
                <div className="mt-1 flex items-center justify-between gap-5">
                  <p className="min-w-0 text-[25px] font-black leading-[1.2] text-white">오늘의 타입 캐릭터</p>
                  <div className={`flex min-h-[46px] max-w-[245px] items-center justify-center gap-2 rounded-full border px-5 py-1.5 text-[14px] font-black leading-tight shadow-[0_12px_24px_rgba(15,23,42,0.28)] ${themeClasses.chip}`}>
                    <span className={`inline-block h-2 w-2 rounded-full ${themeClasses.dot}`}></span>
                    {shareVibeStamp}
                  </div>
                </div>
              </div>

              <div className="relative mt-6 flex h-[366px] items-center justify-center">
                <TypeCharacterMoodRing
                  imageSrc={resolvedImageSrc}
                  alt={`${mbti} ${characterName} 타입 캐릭터`}
                  themeClasses={themeClasses}
                  themeKey={presentation?.themeKey}
                  showGlow={false}
                  softInner={false}
                  size="share"
                />
              </div>

              <div className="mt-auto rounded-[30px] border border-white/10 bg-black/38 px-7 py-6 shadow-[0_22px_70px_rgba(2,6,23,0.38)] backdrop-blur-sm">
                <p className={`text-[18px] font-black tracking-[0.2em] ${themeClasses.label}`}>{mbti}</p>
                <p className="mt-2 text-[31px] font-black leading-[1.12] text-white break-keep">{characterName}</p>
                <p className="mt-3 text-[18px] font-bold leading-[1.32] text-slate-100 break-keep">{characterRole}</p>
                <p className="mt-3 text-[15px] font-semibold leading-[1.48] text-slate-300 break-keep">
                  {characterReason}
                </p>
                <p className="mt-3 border-t border-white/10 pt-3 text-[14px] font-semibold leading-[1.5] text-cyan-50/90 break-keep">
                  {characterWorldCopy}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
