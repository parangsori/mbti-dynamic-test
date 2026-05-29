import { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { IMAGE_BASE64 } from '../data/mbtiData.js';
import {
  buildResultViewModel,
  PRESENTATION_THEMES
} from '../lib/resultAnalysis.js';
import ShareCard from './ShareCard.jsx';
import SyncRateBadge from './SyncRateBadge.jsx';
import ServiceCopyright from './ServiceCopyright.jsx';
import { getPersonalizedResultContext } from '../lib/personalization.js';
import { useResultRecord } from '../hooks/useResultRecord.js';
import { useResultShare } from '../hooks/useResultShare.js';

const DETAIL_SECTIONS = [
  { key: 'why', title: '왜 이런 결과가 나왔을까' },
  { key: 'axes', title: '축별로 보면' },
  { key: 'history', title: '이전 결과와 비교하면' }
];

const getTodayLabel = () =>
  new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

const getTimeLabel = () =>
  new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });

const getPrecisionBadge = ({ percent, neutralReviewNote, boundaryAxes }) => {
  if (neutralReviewNote) return '보정 질문으로 한 번 더 확인한 결과';
  if (percent >= 88) return '오늘 답변의 결이 꽤 또렷한 결과';
  if (boundaryAxes.length > 0) return '경계 축이 조금 보여도 흐름은 읽히는 결과';
  return '오늘 컨디션을 가볍게 담은 결과';
};

const RESULT_THEME_CLASSES = {
  spark: {
    shell: 'bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.18),_transparent_31%),radial-gradient(circle_at_bottom_left,_rgba(236,72,153,0.16),_transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.1),rgba(15,23,42,0))]',
    shareShell: 'bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.22),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(236,72,153,0.2),_transparent_28%),linear-gradient(145deg,#111827_0%,#1f1b2e_48%,#0f172a_100%)]',
    haloTop: 'bg-amber-300/20',
    haloBottom: 'bg-pink-400/[0.18]',
    imageFrame: 'border-amber-300/20 bg-[radial-gradient(circle_at_top,_rgba(251,191,36,0.2),_transparent_44%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.92))]',
    panel: 'border-amber-300/20 bg-amber-300/[0.08]',
    label: 'text-amber-100',
    chip: 'border-amber-300/20 bg-amber-300/[0.12] text-amber-100',
    dot: 'bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.9)]',
    letterGradient: 'bg-gradient-to-r from-amber-200 via-pink-200 to-rose-200'
  },
  wave: {
    shell: 'bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.16),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.18),_transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.1),rgba(15,23,42,0))]',
    shareShell: 'bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.2),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(59,130,246,0.22),_transparent_28%),linear-gradient(145deg,#061621_0%,#123044_48%,#0f172a_100%)]',
    haloTop: 'bg-teal-300/[0.18]',
    haloBottom: 'bg-blue-400/[0.18]',
    imageFrame: 'border-teal-300/20 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.2),_transparent_44%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.92))]',
    panel: 'border-teal-300/20 bg-teal-300/[0.08]',
    label: 'text-teal-100',
    chip: 'border-teal-300/20 bg-teal-300/[0.12] text-teal-100',
    dot: 'bg-teal-300 shadow-[0_0_12px_rgba(94,234,212,0.9)]',
    letterGradient: 'bg-gradient-to-r from-teal-200 via-cyan-200 to-blue-200'
  },
  neon: {
    shell: 'bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.2),_transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.1),rgba(15,23,42,0))]',
    shareShell: 'bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.2),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.24),_transparent_28%),linear-gradient(145deg,#09111f_0%,#111827_42%,#0f172a_100%)]',
    haloTop: 'bg-cyan-400/[0.18]',
    haloBottom: 'bg-brand/[0.18]',
    imageFrame: 'border-cyan-300/20 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_45%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.92))]',
    panel: 'border-cyan-300/20 bg-cyan-300/[0.08]',
    label: 'text-cyan-100',
    chip: 'border-cyan-300/20 bg-cyan-300/[0.12] text-cyan-100',
    dot: 'bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]',
    letterGradient: 'bg-gradient-to-r from-cyan-300 via-violet-200 to-fuchsia-200'
  },
  steady: {
    shell: 'bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.14),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(148,163,184,0.16),_transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.1),rgba(15,23,42,0))]',
    shareShell: 'bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.18),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(148,163,184,0.18),_transparent_28%),linear-gradient(145deg,#071814_0%,#16251f_48%,#0f172a_100%)]',
    haloTop: 'bg-emerald-300/[0.16]',
    haloBottom: 'bg-slate-300/[0.12]',
    imageFrame: 'border-emerald-300/20 bg-[radial-gradient(circle_at_top,_rgba(52,211,153,0.18),_transparent_44%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.92))]',
    panel: 'border-emerald-300/20 bg-emerald-300/[0.08]',
    label: 'text-emerald-100',
    chip: 'border-emerald-300/20 bg-emerald-300/[0.12] text-emerald-100',
    dot: 'bg-emerald-300 shadow-[0_0_12px_rgba(110,231,183,0.9)]',
    letterGradient: 'bg-gradient-to-r from-emerald-200 via-slate-100 to-teal-200'
  },
  'soft-shift': {
    shell: 'bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.15),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(129,140,248,0.18),_transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.1),rgba(15,23,42,0))]',
    shareShell: 'bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.2),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(129,140,248,0.22),_transparent_28%),linear-gradient(145deg,#171124_0%,#20233c_48%,#0f172a_100%)]',
    haloTop: 'bg-pink-300/[0.16]',
    haloBottom: 'bg-indigo-300/[0.18]',
    imageFrame: 'border-pink-300/20 bg-[radial-gradient(circle_at_top,_rgba(244,114,182,0.18),_transparent_44%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.92))]',
    panel: 'border-pink-300/20 bg-pink-300/[0.08]',
    label: 'text-pink-100',
    chip: 'border-pink-300/20 bg-pink-300/[0.12] text-pink-100',
    dot: 'bg-pink-300 shadow-[0_0_12px_rgba(249,168,212,0.9)]',
    letterGradient: 'bg-gradient-to-r from-pink-200 via-indigo-200 to-sky-200'
  },
  citrus: {
    shell: 'bg-[radial-gradient(circle_at_top,_rgba(190,242,100,0.15),_transparent_31%),radial-gradient(circle_at_bottom_left,_rgba(45,212,191,0.16),_transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0))]',
    shareShell: 'bg-[radial-gradient(circle_at_top_left,_rgba(190,242,100,0.24),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(20,184,166,0.2),_transparent_32%),linear-gradient(145deg,#07150f_0%,#10261f_52%,#0f172a_100%)]',
    haloTop: 'bg-lime-300/[0.18]',
    haloBottom: 'bg-teal-300/[0.16]',
    imageFrame: 'border-lime-300/20 bg-[radial-gradient(circle_at_top,_rgba(190,242,100,0.18),_transparent_44%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.92))]',
    panel: 'border-lime-300/20 bg-lime-300/[0.08]',
    label: 'text-lime-100',
    chip: 'border-lime-300/20 bg-lime-300/[0.12] text-lime-100',
    dot: 'bg-lime-300 shadow-[0_0_12px_rgba(190,242,100,0.9)]',
    letterGradient: 'bg-gradient-to-r from-lime-200 via-emerald-100 to-cyan-200'
  },
  afterglow: {
    shell: 'bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.15),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(250,204,21,0.13),_transparent_29%),linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0))]',
    shareShell: 'bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.23),_transparent_29%),radial-gradient(circle_at_bottom_left,_rgba(250,204,21,0.18),_transparent_30%),linear-gradient(145deg,#1f1022_0%,#29172a_50%,#101827_100%)]',
    haloTop: 'bg-rose-300/[0.18]',
    haloBottom: 'bg-yellow-300/[0.14]',
    imageFrame: 'border-rose-300/20 bg-[radial-gradient(circle_at_top,_rgba(251,113,133,0.18),_transparent_44%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.92))]',
    panel: 'border-rose-300/20 bg-rose-300/[0.08]',
    label: 'text-rose-100',
    chip: 'border-rose-300/20 bg-rose-300/[0.12] text-rose-100',
    dot: 'bg-rose-300 shadow-[0_0_12px_rgba(253,164,175,0.9)]',
    letterGradient: 'bg-gradient-to-r from-rose-200 via-yellow-100 to-sky-200'
  },
  studio: {
    shell: 'bg-[radial-gradient(circle_at_top,_rgba(226,232,240,0.12),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.15),_transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.08),rgba(15,23,42,0))]',
    shareShell: 'bg-[radial-gradient(circle_at_top_right,_rgba(226,232,240,0.16),_transparent_30%),radial-gradient(circle_at_bottom_left,_rgba(56,189,248,0.18),_transparent_31%),linear-gradient(145deg,#05080f_0%,#111827_52%,#07111f_100%)]',
    haloTop: 'bg-slate-200/[0.14]',
    haloBottom: 'bg-sky-300/[0.16]',
    imageFrame: 'border-slate-200/20 bg-[radial-gradient(circle_at_top,_rgba(226,232,240,0.14),_transparent_44%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.92))]',
    panel: 'border-slate-200/20 bg-slate-200/[0.07]',
    label: 'text-slate-100',
    chip: 'border-slate-200/20 bg-slate-200/[0.1] text-slate-100',
    dot: 'bg-slate-100 shadow-[0_0_12px_rgba(226,232,240,0.85)]',
    letterGradient: 'bg-gradient-to-r from-white via-sky-100 to-slate-300'
  }
};

const getThemeClasses = (themeKey) => RESULT_THEME_CLASSES[themeKey] || RESULT_THEME_CLASSES.neon;

const getDetailPreview = ({ section, summaryCopy, todayDifferenceCopy, consistencyCopy, historyComparison, trendAnalysis, historyInsights }) => {
  if (section === 'why') return todayDifferenceCopy || consistencyCopy || summaryCopy;
  if (section === 'axes') return trendAnalysis?.title || '축별 밸런스와 우세 흐름을 자세히 볼 수 있어요.';
  if (section === 'history') {
    return (historyComparison?.title || historyInsights?.recentCount)
      ? '최근 기록과 활동 흐름을 한 번에 볼 수 있어요.'
      : '최근 기록이 쌓이면 비교 흐름도 같이 볼 수 있어요.';
  }
  return '';
};

function DetailSection({ title, preview, open, onToggle, children }) {
  return (
    <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.04] shadow-[0_22px_55px_rgba(2,6,23,0.24)]">
      <button
        type="button"
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <div className="min-w-0 flex-1">
          <p className="text-[14px] font-black text-white">{title}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-400 break-keep">{preview}</p>
        </div>
        <span className="shrink-0 whitespace-nowrap rounded-full border border-white/10 bg-black/20 px-4 py-2 text-[11px] font-bold text-slate-300">
          {open ? '접기' : '펼치기'}
        </span>
      </button>
      {open && <div className="border-t border-white/10 px-5 py-5">{children}</div>}
    </div>
  );
}

function MiniResultCard({ title, value, description, tone = 'green' }) {
  const toneClasses = tone === 'rose'
    ? 'border-rose-400/20 bg-rose-400/[0.08] text-rose-50/90'
    : 'border-green-400/20 bg-green-400/[0.08] text-green-50/90';
  const titleClass = tone === 'rose' ? 'text-rose-100' : 'text-green-100';

  return (
    <div className={`grid min-h-[184px] grid-rows-[44px_56px_minmax(58px,1fr)] rounded-2xl border px-4 py-4 text-center ${toneClasses}`}>
      <p className={`flex items-center justify-center text-[11px] font-black leading-[1.35] tracking-[0.16em] uppercase break-keep ${titleClass}`}>
        {title}
      </p>
      <p className="flex items-center justify-center text-[28px] font-black leading-none text-white">{value}</p>
      <p className="flex items-start justify-center text-[12px] leading-relaxed break-keep">{description}</p>
    </div>
  );
}

function MoodPointCard({ presentation, todayDifferenceCopy, themeClasses }) {
  return (
    <div className={`mt-4 w-full rounded-[1.45rem] border px-4 py-4 ${themeClasses.panel}`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`text-[11px] font-black tracking-[0.18em] uppercase ${themeClasses.label}`}>오늘만의 포인트</p>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black ${themeClasses.chip}`}>
          {presentation.stateLabel}
        </span>
      </div>
      <p className="mt-3 text-[18px] font-black leading-[1.22] text-white break-keep">{presentation.hook}</p>
      <p className="mt-2 text-[12px] leading-relaxed text-slate-100 break-keep">{presentation.detail}</p>
      {todayDifferenceCopy && <p className="mt-2 text-[12px] leading-relaxed text-slate-200 break-keep">{todayDifferenceCopy}</p>}
    </div>
  );
}

function ResultEssenceCard({ info, summaryCopy, todayDifferenceCopy, consistencyCopy, boundaryCopy, neutralReviewNote, questionContextInsight, themeClasses }) {
  const insightRows = [
    summaryCopy,
    todayDifferenceCopy,
    consistencyCopy,
    neutralReviewNote || questionContextInsight || boundaryCopy
  ].filter(Boolean).slice(0, 3);

  return (
    <div className="space-y-3">
      <div className={`rounded-[1.45rem] border px-4 py-4 ${themeClasses.panel}`}>
        <p className={`text-[11px] font-black tracking-[0.18em] uppercase ${themeClasses.label}`}>나를 닮은 한 줄</p>
        <p className="mt-3 text-[15px] font-semibold leading-relaxed text-white break-keep">{info.description}</p>
      </div>

      <div className="rounded-[1.45rem] border border-cyan-300/20 bg-cyan-300/[0.08] px-4 py-4">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[11px] font-black tracking-[0.18em] text-cyan-100 uppercase">핵심 요약</p>
          <span className="shrink-0 rounded-full border border-cyan-200/20 bg-black/20 px-3 py-1 text-[10px] font-black text-cyan-100">바로 읽기</span>
        </div>
        <div className="mt-3 space-y-2.5">
          {insightRows.map((row, idx) => (
            <div key={`${row}-${idx}`} className="grid grid-cols-[0.55rem_minmax(0,1fr)] gap-2">
              <span className={`mt-[0.45rem] h-2 w-2 rounded-full ${idx === 0 ? 'bg-cyan-200' : idx === 1 ? 'bg-emerald-200' : 'bg-amber-200'}`} />
              <p className="text-[13px] leading-relaxed text-slate-100 break-keep">{row}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function DailyInsightCard({ dailyAction, relationshipHint, recoveryHint, tomorrowCheckPoint, themeClasses }) {
  const hints = [
    { label: '지금 해볼 한 가지', value: dailyAction, tone: 'text-amber-100' },
    { label: '사람들과의 거리', value: relationshipHint, tone: 'text-pink-100' },
    { label: '쉬는 방식', value: recoveryHint, tone: 'text-emerald-100' },
    { label: '다음에 비교할 점', value: tomorrowCheckPoint, tone: 'text-cyan-100' }
  ].filter((item) => item.value);

  return (
    <div className="rounded-[1.45rem] border border-amber-300/20 bg-amber-300/[0.07] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-black tracking-[0.18em] text-amber-100 uppercase">나를 위한 작은 한마디</p>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-200 break-keep">오늘 답변에서 보인 생활 리듬을 쉽게 풀어봤어요.</p>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black ${themeClasses.chip}`}>Daily</span>
      </div>
      <div className="mt-4 divide-y divide-white/10">
        {hints.map((hint) => (
          <div key={hint.label} className="py-3 first:pt-0 last:pb-0">
            <p className={`text-[11px] font-black tracking-[0.12em] uppercase ${hint.tone}`}>{hint.label}</p>
            <p className="mt-1.5 text-[13px] leading-relaxed text-slate-100 break-keep">{hint.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function AxisCoordinateCard({ axisNarratives, themeClasses }) {
  return (
    <div className="rounded-[1.45rem] border border-white/10 bg-white/[0.04] px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-black tracking-[0.18em] text-slate-400 uppercase">나의 성향 좌표</p>
          <p className="mt-1 text-[13px] leading-relaxed text-slate-300 break-keep">오늘 답변이 어느 쪽으로 기울었는지 한눈에 볼 수 있어요.</p>
        </div>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black ${themeClasses.chip}`}>4축</span>
      </div>
      <div className="mt-4 space-y-3.5">
        {axisNarratives.map((axis) => (
          <AxisCoordinateBar key={axis.pair} axis={axis} />
        ))}
      </div>
    </div>
  );
}

function AxisCoordinateBar({ axis }) {
  const isLeftDom = axis.leftScore >= axis.rightScore;
  const leftRatio = isLeftDom ? axis.intensity : 100 - axis.intensity;
  const rightRatio = 100 - leftRatio;
  const markerPosition = isLeftDom ? leftRatio : 100 - rightRatio;

  return (
    <div className={`rounded-[1rem] border px-3 py-3 ${axis.isBoundary ? 'border-amber-300/20 bg-amber-300/[0.07]' : 'border-white/10 bg-black/20'}`}>
      <div className="mb-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[12px] font-black text-white">{axis.pair}</span>
          {axis.isBoundary && <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.12] px-2 py-0.5 text-[9px] font-black text-amber-100">경계</span>}
        </div>
        <span className="text-[11px] font-black text-slate-200">{axis.dominantType} {axis.intensity}%</span>
      </div>
      <div className="grid grid-cols-[2.1rem_minmax(0,1fr)_2.1rem] items-center gap-2">
        <div className={`text-center text-[12px] font-black ${isLeftDom ? 'text-brand' : 'text-slate-500'}`}>{axis.left}</div>
        <div className="relative h-3 overflow-hidden rounded-full bg-slate-800/80">
          <motion.div initial={{ width: 0 }} animate={{ width: `${leftRatio}%` }} transition={{ duration: 0.75 }} className="absolute left-0 top-0 h-full bg-gradient-to-r from-brand to-purple-400" />
          <motion.div initial={{ width: 0 }} animate={{ width: `${rightRatio}%` }} transition={{ duration: 0.75 }} className="absolute right-0 top-0 h-full bg-gradient-to-l from-cyan-300 to-cyan-600" />
          <motion.span
            initial={{ left: '50%' }}
            animate={{ left: `${markerPosition}%` }}
            transition={{ duration: 0.75 }}
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-slate-950 shadow-[0_0_16px_rgba(255,255,255,0.28)]"
          />
        </div>
        <div className={`text-center text-[12px] font-black ${!isLeftDom ? 'text-cyan-300' : 'text-slate-500'}`}>{axis.right}</div>
      </div>
      <p className="mt-2 text-[11px] leading-relaxed text-slate-400 break-keep">{axis.stateLabel}</p>
    </div>
  );
}

function ChangeSnapshotCard({ historyComparison, axisChanges, strongestAxis, trendAnalysis, themeClasses }) {
  const stableText = axisChanges.length > 0 ? `${axisChanges.length}개 축 변화` : '직전 흐름과 같은 결';
  const changedText = axisChanges[0] ? `${axisChanges[0].pair} ${axisChanges[0].before}에서 ${axisChanges[0].after}` : trendAnalysis?.title || '오늘 결과가 첫 기준점이에요';

  return (
    <div className="rounded-[1.45rem] border border-emerald-300/20 bg-emerald-300/[0.08] px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-[11px] font-black tracking-[0.18em] text-emerald-100 uppercase">직전 대비 변화</p>
        <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black ${themeClasses.chip}`}>{strongestAxis.dominantType} {strongestAxis.intensity}%</span>
      </div>
      <p className="mt-3 text-[15px] font-black leading-snug text-white break-keep">{historyComparison?.title || '오늘 결과가 첫 기준점이에요'}</p>
      <div className="mt-3 grid gap-2 min-[390px]:grid-cols-2">
        <div className="rounded-[1rem] border border-white/10 bg-black/20 px-3 py-3">
          <p className="text-[10px] font-black tracking-[0.14em] text-emerald-100 uppercase">변화 메모</p>
          <p className="mt-1 text-[12px] leading-relaxed text-white break-keep">{changedText}</p>
        </div>
        <div className="rounded-[1rem] border border-white/10 bg-black/20 px-3 py-3">
          <p className="text-[10px] font-black tracking-[0.14em] text-slate-400 uppercase">유지/강점</p>
          <p className="mt-1 text-[12px] leading-relaxed text-slate-100 break-keep">{stableText} · {strongestAxis.pair} 강세</p>
        </div>
      </div>
    </div>
  );
}

export default function ResultView({
  scores,
  userName,
  historyData,
  setHistoryData,
  defaultUserName,
  openHistoryModal,
  onRestart,
  onOpenAxisGuide,
  onResultReady,
  trackEvent,
  neutralCount = 0,
  usedFollowup = false,
  questionContextSummary = null,
  ageGroup = '',
  gender = ''
}) {
  const resultRef = useRef(null);
  const shareCardRef = useRef(null);
  const currentEntryRef = useRef(null);
  const [detailOpen, setDetailOpen] = useState({ why: false, axes: false, history: false });
  const [showMoodLegend, setShowMoodLegend] = useState(false);

  if (!currentEntryRef.current) {
    const now = new Date();
    currentEntryRef.current = {
      createdAt: now.toISOString(),
      date: now.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' }),
      time: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  }

  const {
    mbti,
    info,
    badges,
    percent,
    spectrum,
    boundaryAxes,
    axisNarratives,
    strongestAxis,
    summaryCopy,
    todayDifferenceCopy,
    consistencyCopy,
    boundaryCopy,
    compCopy,
    effectiveHistory,
    historyComparison,
    axisChanges,
    historyInsights,
    trendAnalysis,
    displayName,
    retestPrompt,
    recentFlowSummary,
    revisitInsight,
    presentation,
    shareMoodLine,
    shareHeadline,
    shareCardCopy,
    shareVibeStamp,
    dailyAction,
    relationshipHint,
    recoveryHint,
    tomorrowCheckPoint,
    neutralReviewNote,
    questionContextInsight,
    topChangeChip
  } = useMemo(() => buildResultViewModel({
    scores,
    historyData,
    currentEntry: currentEntryRef.current,
    userName,
    defaultUserName,
    ageGroup,
    neutralCount,
    usedFollowup,
    questionContextSummary
  }), [ageGroup, defaultUserName, historyData, neutralCount, questionContextSummary, scores, usedFollowup, userName]);

  const resolvedImageSrc = info.image ? IMAGE_BASE64[info.image] || info.image : '';
  const themeClasses = getThemeClasses(presentation.themeKey);
  const precisionBadge = getPrecisionBadge({ percent, neutralReviewNote, boundaryAxes });
  const todayLabel = getTodayLabel();
  const timeLabel = getTimeLabel();

  useResultRecord({
    ageGroup,
    currentEntry: currentEntryRef.current,
    historyData,
    mbti,
    onResultReady,
    percent,
    presentation,
    questionContextSummary,
    setHistoryData,
    scores,
    spectrum,
    trackEvent
  });

  useEffect(() => {
    trackEvent('result_view', { mbti, percent, questionContextTop: questionContextSummary?.topTag || '' });
  }, [mbti, percent, questionContextSummary, trackEvent]);

  const {
    handleCopyShare,
    handleSaveImageOnly,
    handleShareImageLink,
    shareActionState,
    shareCopied,
    shareToast
  } = useResultShare({
    displayName,
    mbti,
    percent,
    shareCardCopy,
    shareCardRef,
    trackEvent
  });
  const [showShareOptions, setShowShareOptions] = useState(false);
  const isShareBusy = shareActionState !== 'idle';

  const shareContext = {
    displayName,
    mbti,
    percent,
    info,
    shareHeadline,
    shareMoodLine,
    shareCardCopy,
    shareVibeStamp,
    resolvedImageSrc,
    todayLabel,
    timeLabel,
    precisionBadge,
    presentation,
    recentFlowSummary
  };

  const personalizedContext = ageGroup ? getPersonalizedResultContext(ageGroup, gender, mbti, percent) : null;

  const detailSections = {
    why: (
      <div className="space-y-4">
        {personalizedContext && (
          <div className="rounded-2xl border border-brand/20 bg-brand/[0.08] px-4 py-4">
            <p className="text-[12px] font-black tracking-[0.18em] text-purple-100 uppercase">맞춤형 해석</p>
            <p className="mt-2 text-[14px] leading-relaxed text-white break-keep">{personalizedContext.intro}</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-200 break-keep">{personalizedContext.advice}</p>
          </div>
        )}
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08] px-4 py-4">
          <p className="text-[12px] font-black tracking-[0.18em] text-cyan-100 uppercase">오늘 핵심 해석</p>
          <p className="mt-2 text-[14px] leading-relaxed text-white break-keep">{summaryCopy}</p>
          {todayDifferenceCopy && <p className="mt-2 text-[13px] leading-relaxed text-cyan-50/90 break-keep">{todayDifferenceCopy}</p>}
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
          <p className="text-[12px] font-black tracking-[0.18em] text-slate-400 uppercase">결과 또렷함</p>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-200 break-keep">{consistencyCopy}</p>
          {neutralReviewNote && <p className="mt-3 text-[12px] leading-relaxed text-cyan-100 break-keep">{neutralReviewNote}</p>}
          {questionContextInsight && <p className="mt-3 text-[12px] leading-relaxed text-cyan-100 break-keep">{questionContextInsight}</p>}
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
          <p className="text-[12px] font-black tracking-[0.18em] text-slate-400 uppercase">핵심 포인트</p>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-200 break-keep">{boundaryCopy}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-center">
          <p className="text-[11px] font-black tracking-[0.18em] text-brand uppercase">생활 장면</p>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-200 break-keep">“{info.scenario}”</p>
        </div>
      </div>
    ),
    axes: (
      <div className="space-y-4">
        {trendAnalysis && (
          <div className="rounded-2xl border border-fuchsia-300/20 bg-fuchsia-300/[0.08] px-4 py-4">
            <p className="text-[12px] font-black tracking-[0.18em] text-fuchsia-100 uppercase">장기 흐름 리포트</p>
            <p className="mt-2 text-[14px] font-semibold text-white break-keep">{trendAnalysis.title}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-fuchsia-50/90 break-keep">{trendAnalysis.body}</p>
          </div>
        )}
        <div className="space-y-3">
          {axisNarratives.map((item) => {
            const leftRatio = item.leftScore >= item.rightScore ? item.intensity : 100 - item.intensity;
            const rightRatio = 100 - leftRatio;
            const isLeftDom = item.leftScore >= item.rightScore;

            return (
              <div key={item.pair} className={`rounded-2xl border px-4 py-4 ${item.isBoundary ? 'border-yellow-400/25 bg-yellow-400/[0.06]' : 'border-white/10 bg-white/[0.03]'}`}>
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <button onClick={() => onOpenAxisGuide(item.left)} className="text-[13px] font-black tracking-[0.18em] text-white hover:text-cyan-200 transition-colors">
                      {item.pair}
                    </button>
                    <p className="mt-1 text-[11px] text-slate-400">{item.stateLabel}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${item.isBoundary ? 'border border-yellow-300/20 bg-yellow-400/[0.12] text-yellow-100' : 'border border-cyan-300/20 bg-cyan-300/[0.1] text-cyan-100'}`}>
                    {item.dominantType} 우세 {item.intensity}%
                  </span>
                </div>
                <div className="flex items-center gap-3 text-[12px] font-bold text-slate-400">
                  <div className="w-10 text-center">
                    <div className={`${isLeftDom ? 'text-brand text-[18px]' : 'text-slate-400'} font-black`}>{item.left}</div>
                    <div className="text-[10px]">{item.leftLabel}</div>
                  </div>
                  <div className="flex-1">
                    <div className="flex h-3 overflow-hidden rounded-full bg-slate-800/80 shadow-inner">
                      <motion.div initial={{ width: 0 }} animate={{ width: `${leftRatio}%` }} transition={{ duration: 0.8 }} className="h-full bg-gradient-to-r from-brand to-purple-400" />
                      <motion.div initial={{ width: 0 }} animate={{ width: `${rightRatio}%` }} transition={{ duration: 0.8 }} className="h-full bg-gradient-to-l from-cyan-400 to-cyan-600" />
                    </div>
                  </div>
                  <div className="w-10 text-center">
                    <div className={`${!isLeftDom ? 'text-cyan-300 text-[18px]' : 'text-slate-400'} font-black`}>{item.right}</div>
                    <div className="text-[10px]">{item.rightLabel}</div>
                  </div>
                </div>
                <p className="mt-3 text-[13px] leading-relaxed text-slate-200 break-keep"><span className="font-bold text-white">{item.dominantType} 쪽이 더 강했어요.</span> {item.narrative}</p>
              </div>
            );
          })}
        </div>
      </div>
    ),
    history: (
      <div className="space-y-4">
        {historyComparison && (
          <div className="rounded-2xl border border-emerald-300/20 bg-emerald-300/[0.08] px-4 py-4">
            <p className="text-[12px] font-black tracking-[0.18em] text-emerald-100 uppercase">직전 결과와 비교</p>
            <p className="mt-2 text-[14px] font-semibold text-white break-keep">{historyComparison.title}</p>
            <p className="mt-2 text-[12px] leading-relaxed text-emerald-50/90 break-keep">{historyComparison.body}</p>
            {axisChanges.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {axisChanges.map((axis) => (
                  <span key={axis.pair} className="rounded-full border border-emerald-300/20 bg-black/20 px-3 py-1 text-[11px] font-semibold text-emerald-100">{axis.pair} {axis.before}→{axis.after}</span>
                ))}
              </div>
            )}
          </div>
        )}
        {historyInsights && (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
              <p className="text-[11px] font-black tracking-[0.16em] text-slate-400 uppercase">요즘 가장 자주 나온 흐름</p>
              <p className="mt-2 text-[26px] font-black text-white">{historyInsights.topType?.mbti || mbti}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-300 break-keep">요즘은 이 흐름이 자주 보여요. 다음 결과가 유지될지 보기 좋아요.</p>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4">
              <p className="text-[11px] font-black tracking-[0.16em] text-slate-400 uppercase">가장 잘 흔들리는 축</p>
              <p className="mt-2 text-[22px] font-black text-white">{historyInsights.mostVolatile?.pair || '-'}</p>
              <p className="mt-1 text-[12px] leading-relaxed text-slate-300 break-keep">{historyInsights.mostVolatile?.flips ? '다시 하면 이 축부터 달라질 가능성이 커요.' : '최근에는 거의 같은 결이 이어졌어요.'}</p>
            </div>
          </div>
        )}
        <div className="grid grid-cols-2 gap-3">
          <MiniResultCard
            title={compCopy.good.title}
            value={compCopy.good.type}
            description={compCopy.good.description}
          />
          <MiniResultCard
            title={compCopy.bad.title}
            value={compCopy.bad.type}
            description={compCopy.bad.description}
            tone="rose"
          />
        </div>
      </div>
    )
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-[100dvh] w-full max-w-full flex-col items-center overflow-x-hidden px-4 pb-20 pt-2 text-white sm:px-6 sm:pt-4">
      <div aria-hidden="true" className="fixed left-[-99999px] top-0 pointer-events-none select-none">
        <div ref={shareCardRef}>
          <ShareCard context={shareContext} getThemeClasses={getThemeClasses} />
        </div>
      </div>

      <div ref={resultRef} className="relative mt-2 w-full max-w-[26.25rem] overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/95 p-4 shadow-[0_30px_90px_rgba(2,6,23,0.55)] sm:p-6">
        <div className={`absolute inset-0 ${themeClasses.shell}`} />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-full min-w-0 rounded-[1.8rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(17,24,39,0.88))] p-4 shadow-[0_26px_80px_rgba(2,6,23,0.44)] sm:p-5">
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_auto] items-start gap-2 min-[390px]:gap-3">
              <div className="min-w-0">
                <p className="text-[15px] font-medium text-slate-300"><span className="font-black text-white">{displayName}</span>님의 오늘 성향 스냅샷</p>
                <div className="mt-4 flex max-w-full items-end gap-1 overflow-hidden">
                  {mbti.split('').map((letter, idx) => (
                    <button
                      key={`${letter}-${idx}`}
                      type="button"
                      onClick={() => onOpenAxisGuide(letter)}
                      style={{ fontSize: 'clamp(31px, calc((100vw - 9rem) / 5.7), 60px)' }}
                      className={`${themeClasses.letterGradient} min-w-0 bg-clip-text font-black leading-none tracking-[0.04em] text-transparent drop-shadow-[0_14px_30px_rgba(99,102,241,0.22)] min-[390px]:tracking-[0.08em]`}
                    >
                      {letter}
                    </button>
                  ))}
                </div>
                <p className="mt-3 inline-flex max-w-full rounded-full border border-white/10 bg-white/[0.05] px-3 py-2 text-[13px] font-bold text-slate-100 min-[390px]:px-4 min-[390px]:text-[14px]">{info.nickname}</p>
              </div>
              <div className="flex w-[5.55rem] shrink-0 flex-col items-end gap-2 min-[390px]:w-[6.1rem]">
                <SyncRateBadge percent={percent} size="result" themeKey={presentation?.themeKey} />
                <span className="w-full rounded-full border border-cyan-300/20 bg-cyan-300/[0.1] px-2 py-1.5 text-center text-[9px] font-black leading-snug text-cyan-100 break-keep min-[390px]:text-[10px]">{precisionBadge}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className={`rounded-full border px-3 py-1.5 text-[11px] font-bold ${themeClasses.chip}`}>{shareVibeStamp}</span>
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold text-slate-100">{presentation.themeLabel}</span>
              {topChangeChip && <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.12] px-3 py-1.5 text-[11px] font-bold text-amber-100">{topChangeChip}</span>}
              {neutralReviewNote && <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.1] px-3 py-1.5 text-[11px] font-bold text-cyan-100">보정 질문 반영</span>}
            </div>

            {recentFlowSummary?.timeline && recentFlowSummary.timeline.length > 0 && (
              <div className="mt-5 w-full rounded-[1.45rem] border border-white/10 bg-black/20 px-4 py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <p className="text-[11px] font-black tracking-[0.15em] text-slate-400 uppercase">최근 나의 성향 흐름</p>
                    <button onClick={() => setShowMoodLegend(true)} className="flex h-5 w-5 items-center justify-center rounded-full border border-white/10 bg-white/5 text-[10px] text-slate-400 transition hover:bg-white/10 hover:text-white">
                      ?
                    </button>
                  </div>
                  <button onClick={() => setShowMoodLegend(true)} className="flex items-center gap-2 rounded-full px-2 py-1 transition hover:bg-white/5">
                    {recentFlowSummary.timeline.map((item, idx) => (
                      <span
                        key={idx}
                        className={`inline-block h-2.5 w-2.5 rounded-full ${
                          getThemeClasses(item.themeKey).dot
                        } ${idx === recentFlowSummary.timeline.length - 1 ? 'scale-125 ring-[1.5px] ring-white/60' : 'opacity-60'}`}
                      />
                    ))}
                  </button>
                </div>
              </div>
            )}

            <MoodPointCard
              presentation={presentation}
              todayDifferenceCopy={todayDifferenceCopy}
              themeClasses={themeClasses}
            />
          </div>

          <div className="mt-5 flex w-full flex-col gap-4 rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,29,0.94),rgba(15,23,42,0.88))] p-5 shadow-[0_22px_70px_rgba(2,6,23,0.38)]">
            {resolvedImageSrc && (
              <div className={`relative flex items-center justify-center overflow-hidden rounded-[1.6rem] border px-3 py-4 ${themeClasses.imageFrame}`}>
                <div className={`absolute inset-x-6 top-3 h-14 rounded-full ${themeClasses.haloTop} blur-2xl`} />
                <div className={`absolute inset-x-6 bottom-3 h-16 rounded-full ${themeClasses.haloBottom} blur-2xl`} />
                <img src={resolvedImageSrc} alt={mbti} className="relative z-10 h-44 w-44 object-contain drop-shadow-[0_16px_34px_rgba(15,23,42,0.76)]" />
              </div>
            )}

            <div className={`rounded-[1.5rem] border px-4 py-4 ${themeClasses.panel}`}>
              <div className="flex items-center justify-between gap-3">
                <p className={`text-[11px] font-black tracking-[0.2em] uppercase ${themeClasses.label}`}>오늘의 무드 테마</p>
                <span className={`rounded-full border px-3 py-1 text-[10px] font-black ${themeClasses.chip}`}>{presentation.themeShortLabel}</span>
              </div>
              <p className="mt-2 text-[25px] font-black leading-[1.18] text-white break-keep">{presentation.themeLabel}</p>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-100 break-keep">{shareCardCopy.boast}</p>
            </div>

            <ResultEssenceCard
              info={info}
              summaryCopy={summaryCopy}
              todayDifferenceCopy={todayDifferenceCopy}
              consistencyCopy={consistencyCopy}
              boundaryCopy={boundaryCopy}
              neutralReviewNote={neutralReviewNote}
              questionContextInsight={questionContextInsight}
              themeClasses={themeClasses}
            />

            <DailyInsightCard
              dailyAction={dailyAction}
              relationshipHint={relationshipHint}
              recoveryHint={recoveryHint}
              tomorrowCheckPoint={tomorrowCheckPoint}
              themeClasses={themeClasses}
            />

            <AxisCoordinateCard axisNarratives={axisNarratives} themeClasses={themeClasses} />

            <ChangeSnapshotCard
              historyComparison={historyComparison}
              axisChanges={axisChanges}
              strongestAxis={strongestAxis}
              trendAnalysis={trendAnalysis}
              themeClasses={themeClasses}
            />
          </div>

          {/* 공유 안내 토스트 (텔레그램 등 이미지 공유 불가 환경) */}
          {shareToast && (
            <div className="mt-3 flex items-start gap-2 rounded-2xl border border-amber-400/30 bg-amber-400/[0.08] px-4 py-3">
              <span className="mt-0.5 text-[16px]">📎</span>
              <p className="text-[13px] font-bold leading-relaxed text-amber-200 break-keep">{shareToast}</p>
            </div>
          )}

          <div className="mt-5 flex w-full flex-col gap-3">
            <button
              onClick={() => setShowShareOptions((open) => !open)}
              disabled={isShareBusy}
              className={`w-full rounded-[1.6rem] border border-cyan-300/20 bg-cyan-300/[0.1] py-4 text-[15px] font-black text-cyan-50 transition hover:bg-cyan-300/[0.14] ${
                isShareBusy ? 'cursor-wait opacity-70' : ''
              }`}
            >
              {shareActionState === 'sharing'
                ? '공유 준비 중...'
                : shareActionState === 'saving'
                ? '이미지 준비 중...'
                : shareActionState === 'shared'
                  ? '이미지+링크 공유 완료'
                : shareActionState === 'saved'
                  ? '이미지 저장 완료'
                : shareActionState === 'unavailable'
                  ? '공유 지원 안 됨'
                : shareActionState === 'failed'
                  ? '다시 시도해 주세요'
                : showShareOptions
                  ? '저장/공유 옵션 닫기'
                  : '결과 카드 저장/공유'}
            </button>
            {showShareOptions && !isShareBusy && (
              <div className="grid grid-cols-2 gap-3 rounded-[1.4rem] border border-white/10 bg-black/20 p-2">
                <button
                  onClick={() => {
                    setShowShareOptions(false);
                    handleShareImageLink();
                  }}
                  className="rounded-[1.2rem] border border-cyan-300/20 bg-cyan-300/[0.12] px-3 py-3 text-[13px] font-black text-cyan-50 transition hover:bg-cyan-300/[0.18]"
                >
                  이미지+링크 공유
                </button>
                <button
                  onClick={() => {
                    setShowShareOptions(false);
                    handleSaveImageOnly();
                  }}
                  className="rounded-[1.2rem] border border-white/10 bg-white/[0.06] px-3 py-3 text-[13px] font-black text-slate-100 transition hover:bg-white/[0.1]"
                >
                  이미지 저장
                </button>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button onClick={handleCopyShare} className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] px-4 py-3 text-[13px] font-bold text-slate-100 transition hover:bg-white/[0.08]">
                {shareCopied ? '한 줄 복사 완료' : '한 줄 결과 복사'}
              </button>
              <button onClick={openHistoryModal} className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] px-4 py-3 text-[13px] font-bold text-slate-100 transition hover:bg-white/[0.08]">
                나의 기록 & 활동 보기
              </button>
            </div>
            <button onClick={onRestart} className="rounded-[1.4rem] border border-white/10 bg-black/20 px-4 py-3 text-[13px] font-bold text-slate-300 transition hover:bg-white/[0.06] hover:text-white">
              지금 다시 해보기
            </button>
            <p className="px-1 text-center text-[12px] leading-relaxed text-slate-400 break-keep">{retestPrompt}</p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex w-full max-w-sm flex-col gap-4">
        <div className="rounded-[1.8rem] border border-white/10 bg-slate-900/85 p-5 shadow-[0_22px_60px_rgba(2,6,23,0.28)]">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] font-black tracking-[0.2em] text-slate-400 uppercase">반복 사용 포인트</p>
              <p className="mt-2 text-[18px] font-black text-white break-keep">최근 흐름에서 뭐가 달라졌는지 바로 보이게</p>
            </div>
            <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black ${themeClasses.chip}`}>
              {recentFlowSummary.chips.length}회 흐름
            </span>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {recentFlowSummary.chips.map((type, idx) => (
              <span
                key={`${type}-${idx}`}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-black ${idx === 0 ? themeClasses.chip : 'border-white/10 bg-white/[0.05] text-slate-200'}`}
              >
                {idx === 0 ? `이번 ${type}` : `${idx + 1}전 ${type}`}
              </span>
            ))}
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.04] px-4 py-4">
              <p className="text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase">최근 흐름 메모</p>
              <p className="mt-2 text-[13px] leading-relaxed text-slate-100 break-keep">{recentFlowSummary.note}</p>
            </div>
            <div className="rounded-[1.4rem] border border-cyan-300/20 bg-cyan-300/[0.08] px-4 py-4">
              <p className="text-[10px] font-black tracking-[0.18em] text-cyan-100 uppercase">다음 테스트에서 보기 좋은 포인트</p>
              <p className="mt-2 text-[13px] leading-relaxed text-white break-keep">{revisitInsight}</p>
            </div>
          </div>
        </div>

        {DETAIL_SECTIONS.map((section) => (
          <DetailSection
            key={section.key}
            title={section.title}
            preview={getDetailPreview({
              section: section.key,
              summaryCopy,
              todayDifferenceCopy,
              consistencyCopy,
              historyComparison,
              trendAnalysis,
              historyInsights
            })}
            open={detailOpen[section.key]}
            onToggle={() => setDetailOpen((prev) => ({ ...prev, [section.key]: !prev[section.key] }))}
          >
            {detailSections[section.key]}
          </DetailSection>
        ))}
      </div>

      <ServiceCopyright className="mt-8 pb-8" />

      {showMoodLegend && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0 }}>
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={() => setShowMoodLegend(false)} />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <h3 className="text-center text-[18px] font-black text-white">무드 테마 범례</h3>
            <p className="mt-2 text-center text-[13px] leading-relaxed text-slate-300 break-keep">
              결과에 표시되는 색상 점은 그날의 <strong>성향 축 강도와 흐름</strong>에 따라 부여받은 고유한 테마를 의미합니다. 같은 MBTI라도 날마다 다른 무드가 나타날 수 있습니다.
            </p>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {PRESENTATION_THEMES.map((theme) => {
                const tClasses = getThemeClasses(theme.key);
                return (
                  <div key={theme.key} className={`flex items-center gap-3 rounded-2xl border px-3 py-3 ${tClasses.panel}`}>
                    <span className={`inline-block h-3 w-3 shrink-0 rounded-full ${tClasses.dot}`}></span>
                    <div className="min-w-0 flex-1">
                      <p className={`text-[12px] font-black tracking-wide ${tClasses.label}`}>{theme.label}</p>
                    </div>
                  </div>
                );
              })}
            </div>
            <button onClick={() => setShowMoodLegend(false)} className="mt-6 w-full rounded-2xl bg-white/10 py-3 text-[14px] font-bold text-white transition hover:bg-white/15">
              닫기
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}
