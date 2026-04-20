import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { IMAGE_BASE64 } from '../data/mbtiData.js';
import {
  computeResult,
  getAxisNarratives,
  getResultSummary,
  getConsistencyCopy,
  getBoundaryCopy,
  getCompatibilityCopy,
  getEffectiveHistory,
  getHistoryComparison,
  getAxisChangeDetails,
  getHistoryInsights,
  getTrendAnalysis,
  getDisplayName,
  getShareCardCopy,
  getRetestPrompt
} from '../lib/resultAnalysis.js';
import { writeHistory } from '../lib/storage.js';
import { getCanvasBlob, renderShareCardCanvas, shareOrSaveBlob } from '../lib/shareCard.js';

const DETAIL_SECTIONS = [
  { key: 'why', title: '왜 이런 결과가 나왔을까' },
  { key: 'axes', title: '축별로 보면' },
  { key: 'history', title: '이전 결과와 비교하면' }
];

const getTodayLabel = () =>
  new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'short' });

const getTimeLabel = () =>
  new Date().toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false });

const getPrecisionBadge = ({ percent, neutralReviewNote, boundaryAxes }) => {
  if (neutralReviewNote) return '보정 질문으로 한 번 더 확인한 결과';
  if (percent >= 88) return '오늘 답변의 결이 꽤 또렷한 결과';
  if (boundaryAxes.length > 0) return '경계 축이 조금 보여도 흐름은 읽히는 결과';
  return '오늘 컨디션을 가볍게 담은 결과';
};

const getDetailPreview = ({ section, summaryCopy, consistencyCopy, historyComparison, trendAnalysis, historyInsights }) => {
  if (section === 'why') return consistencyCopy || summaryCopy;
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

function ShareCard({ context }) {
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
    precisionBadge
  } = context;

  return (
    <div className="relative h-[1080px] w-[1080px] overflow-hidden rounded-[64px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.22),_transparent_28%),linear-gradient(145deg,#09111f_0%,#111827_42%,#0f172a_100%)] text-white shadow-[0_40px_120px_rgba(2,6,23,0.7)]">
      <div className="absolute -right-20 top-[-90px] h-80 w-80 rounded-full bg-brand/20 blur-3xl"></div>
      <div className="absolute bottom-[-80px] left-[-40px] h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"></div>
      <div className="absolute left-[70px] top-[132px] h-[460px] w-[460px] rounded-full border border-white/5 bg-cyan-300/[0.04]"></div>
      <div className="absolute right-[88px] top-[208px] h-[430px] w-[430px] rounded-[46px] border border-cyan-300/10 bg-cyan-300/[0.04] rotate-[-6deg]"></div>
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_24%,transparent_72%,rgba(255,255,255,0.03))]"></div>

      <div className="relative z-10 flex h-full flex-col px-20 py-20">
        <div className="flex items-start justify-between gap-8">
          <div className="max-w-[560px]">
            <p className="text-[24px] font-medium tracking-[-0.02em] text-slate-300">
              <span className="font-extrabold text-white">{displayName}</span>님의 오늘 성향 카드
            </p>
            <p className="mt-5 text-[54px] font-black tracking-[0.12em] text-white drop-shadow-[0_10px_25px_rgba(15,23,42,0.6)]">{mbti}</p>
            <p className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-5 py-2 text-[21px] font-semibold text-slate-100">
              {info.nickname}
            </p>
          </div>
          <div className="flex flex-col items-end gap-3">
            <div className="rounded-[32px] border border-white/15 bg-white/10 px-7 py-5 text-right shadow-lg shadow-slate-950/30 backdrop-blur-sm">
              <p className="text-[15px] font-semibold tracking-[0.14em] text-slate-200 uppercase">싱크로율</p>
              <p className="mt-1 text-[42px] font-black text-white">{percent}%</p>
            </div>
            <div className="rounded-[28px] border border-white/10 bg-black/20 px-5 py-3 text-right">
              <p className="text-[13px] font-bold tracking-[0.16em] text-slate-300 uppercase">{todayLabel}</p>
              <p className="mt-1 text-[18px] font-black text-white">{timeLabel}</p>
            </div>
          </div>
        </div>

        <div className="mt-9 grid flex-1 grid-cols-[1.02fr_0.98fr] gap-8">
          <div className="flex flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-3 rounded-full border border-cyan-300/20 bg-cyan-400/10 px-5 py-2.5 text-[17px] font-bold text-cyan-100">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_12px_rgba(103,232,249,0.9)]"></span>
                {shareVibeStamp}
              </div>
              <p className="mt-7 text-[68px] font-black leading-[1.04] tracking-[-0.045em] text-white break-keep">{shareCardCopy.hook}</p>
              <p className="mt-6 text-[29px] font-semibold leading-[1.38] text-slate-100 break-keep">{shareCardCopy.detail}</p>
              <p className="mt-4 text-[21px] leading-[1.55] text-slate-300 break-keep">{shareHeadline}</p>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {shareCardCopy.tags.slice(0, 3).map((tag, idx) => (
                <span key={`${tag}-${idx}`} className="rounded-full border border-white/10 bg-white/[0.06] px-5 py-2.5 text-[18px] font-bold text-white shadow-[0_14px_30px_rgba(2,6,23,0.28)]">
                  {tag}
                </span>
              ))}
            </div>

            <div className="mt-7 rounded-[34px] border border-white/10 bg-black/25 px-7 py-6 shadow-[0_24px_60px_rgba(2,6,23,0.34)]">
              <p className="text-[14px] font-bold tracking-[0.2em] text-slate-500 uppercase">Share Note</p>
              <p className="mt-3 text-[23px] font-semibold leading-[1.45] text-slate-100 break-keep">{shareCardCopy.boast}</p>
            </div>

            <div className="mt-auto flex items-center justify-between rounded-[28px] border border-white/10 bg-white/[0.03] px-7 py-5">
              <p className="text-[15px] font-semibold text-slate-300">{precisionBadge}</p>
              <p className="text-[15px] font-black tracking-[0.14em] text-white">Mood Snapshot</p>
            </div>
          </div>

          <div className="flex flex-col">
            <div className="relative flex-1 overflow-hidden rounded-[42px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_42%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.92))] shadow-[0_24px_80px_rgba(2,6,23,0.5)]">
              <div className="absolute left-8 top-8 inline-flex rounded-full border border-white/10 bg-white/[0.08] px-5 py-2 text-[15px] font-black tracking-[0.2em] text-slate-100 uppercase">{mbti}</div>
              <div className="absolute inset-x-10 top-12 h-20 rounded-full bg-cyan-400/15 blur-3xl"></div>
              <div className="absolute inset-x-12 bottom-28 h-20 rounded-full bg-brand/20 blur-3xl"></div>
              <div className="absolute inset-0 border border-white/5 rounded-[42px]"></div>
              {resolvedImageSrc && (
                <img src={resolvedImageSrc} alt={mbti} className="relative z-10 mx-auto mt-20 h-[360px] w-[360px] object-contain drop-shadow-[0_24px_48px_rgba(15,23,42,0.82)]" />
              )}
              <div className="absolute right-7 top-7 flex items-center gap-2 rounded-full border border-brand/30 bg-brand/18 px-5 py-2.5 text-[16px] font-black text-white shadow-[0_12px_24px_rgba(168,85,247,0.28)]">
                <span className="inline-block h-2.5 w-2.5 rounded-full bg-fuchsia-300 shadow-[0_0_10px_rgba(232,121,249,0.95)]"></span>
                지금 이 무드
              </div>
              <div className="absolute inset-x-8 bottom-8 rounded-[30px] border border-white/10 bg-black/35 px-6 py-6 backdrop-blur-sm">
                <p className="text-[14px] font-bold tracking-[0.22em] text-slate-500 uppercase">Share Snapshot</p>
                <p className="mt-3 text-[28px] font-black leading-[1.25] text-white break-keep">{info.nickname}</p>
                <p className="mt-2 text-[18px] font-semibold text-slate-200 break-keep">{shareCardCopy.boast}</p>
              </div>
            </div>
          </div>
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
  trackEvent,
  neutralCount = 0,
  usedFollowup = false
}) {
  const resultRef = useRef(null);
  const shareCardRef = useRef(null);
  const currentEntryRef = useRef(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [saveImageState, setSaveImageState] = useState('idle');
  const [detailOpen, setDetailOpen] = useState({ why: false, axes: false, history: false });

  const { mbti, info, badges, percent, spectrum, boundaryAxes } = computeResult(scores);
  const resolvedImageSrc = info.image ? IMAGE_BASE64[info.image] || info.image : '';

  if (!currentEntryRef.current) {
    const now = new Date();
    currentEntryRef.current = {
      createdAt: now.toISOString(),
      date: now.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' }),
      time: now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit', hour12: false })
    };
  }

  useEffect(() => {
    const newEntry = {
      ...currentEntryRef.current,
      mbti,
      percent,
      axes: spectrum.map((axis) => ({
        pair: `${axis.left}/${axis.right}`,
        left: axis.left,
        right: axis.right,
        dominantType: axis.dominantType,
        intensity: axis.intensity,
        leftScore: axis.leftScore,
        rightScore: axis.rightScore
      }))
    };

    if (historyData[0]?.createdAt === newEntry.createdAt) return;

    const updated = [newEntry, ...historyData].slice(0, 7);
    writeHistory(updated);
    setHistoryData(updated);
  }, [historyData, mbti, percent, setHistoryData, spectrum]);

  const compCopy = getCompatibilityCopy(mbti);
  const axisNarratives = getAxisNarratives(spectrum);
  const summaryCopy = getResultSummary(mbti, spectrum, percent);
  const consistencyCopy = getConsistencyCopy(percent, boundaryAxes);
  const boundaryCopy = getBoundaryCopy(boundaryAxes);
  const effectiveHistory = getEffectiveHistory({
    ...currentEntryRef.current,
    mbti,
    percent,
    axes: spectrum.map((axis) => ({
      pair: `${axis.left}/${axis.right}`,
      left: axis.left,
      right: axis.right,
      dominantType: axis.dominantType,
      intensity: axis.intensity,
      leftScore: axis.leftScore,
      rightScore: axis.rightScore
    }))
  }, historyData);
  const historyComparison = getHistoryComparison(mbti, effectiveHistory);
  const axisChanges = getAxisChangeDetails(mbti, effectiveHistory[1]?.mbti);
  const historyInsights = getHistoryInsights(effectiveHistory);
  const trendAnalysis = getTrendAnalysis(spectrum, effectiveHistory[1]?.axes);
  const displayName = getDisplayName(userName, defaultUserName);
  const retestPrompt = getRetestPrompt(boundaryAxes, historyInsights);
  const { shareMoodLine, shareHeadline, shareCardCopy, shareVibeStamp } = getShareCardCopy(mbti, spectrum, badges, info, percent);
  const neutralReviewNote = neutralCount > 0
    ? usedFollowup
      ? '애매했던 축은 추가 질문으로 다시 확인했어요.'
      : '애매했던 답변은 결과 해석에 참고했어요.'
    : '';
  const strongestAxis = [...axisNarratives].sort((a, b) => b.intensity - a.intensity)[0];
  const topChangeChip = axisChanges[0] ? `${axisChanges[0].pair} ${axisChanges[0].before}→${axisChanges[0].after}` : trendAnalysis?.title || '오늘 흐름이 제일 강했던 축';
  const precisionBadge = getPrecisionBadge({ percent, neutralReviewNote, boundaryAxes });
  const todayLabel = getTodayLabel();
  const timeLabel = getTimeLabel();

  useEffect(() => {
    trackEvent('result_view', { mbti, percent });
  }, [mbti, percent, trackEvent]);

  const handleCopyShare = async () => {
    const shareText = `${displayName}님의 오늘 결과\n${shareMoodLine}\n${summaryCopy}\n싱크로율 ${percent}%`;
    try {
      await navigator.clipboard.writeText(shareText);
      setShareCopied(true);
      trackEvent('share_copy', { mbti });
      setTimeout(() => setShareCopied(false), 1800);
    } catch {
      setShareCopied(false);
    }
  };

  const handleSaveImage = async () => {
    if (!shareCardRef.current) return;
    setSaveImageState('saving');
    try {
      const canvas = await renderShareCardCanvas(shareCardRef.current);
      const blob = await getCanvasBlob(canvas);
      const filename = `today-mbti-${mbti.toLowerCase()}.png`;
      const mode = await shareOrSaveBlob({
        blob,
        filename,
        title: `${displayName}님의 오늘 MBTI 카드`,
        text: shareCardCopy.boast
      });
      setSaveImageState(mode === 'shared' ? 'shared' : 'saved');
      trackEvent(mode === 'shared' ? 'result_image_share' : 'result_image_save', { mbti, mode });
    } catch (error) {
      if (error?.name === 'AbortError') setSaveImageState('idle');
      else setSaveImageState('idle');
    } finally {
      setTimeout(() => setSaveImageState('idle'), 1800);
    }
  };

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
    precisionBadge
  };

  const detailSections = {
    why: (
      <div className="space-y-4">
        <div className="rounded-2xl border border-cyan-300/20 bg-cyan-300/[0.08] px-4 py-4">
          <p className="text-[12px] font-black tracking-[0.18em] text-cyan-100 uppercase">오늘 핵심 해석</p>
          <p className="mt-2 text-[14px] leading-relaxed text-white break-keep">{summaryCopy}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
          <p className="text-[12px] font-black tracking-[0.18em] text-slate-400 uppercase">결과 또렷함</p>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-200 break-keep">{consistencyCopy}</p>
          {neutralReviewNote && <p className="mt-3 text-[12px] leading-relaxed text-cyan-100 break-keep">{neutralReviewNote}</p>}
        </div>
        <div className="rounded-2xl border border-white/10 bg-black/20 px-4 py-4">
          <p className="text-[12px] font-black tracking-[0.18em] text-slate-400 uppercase">핵심 포인트</p>
          <p className="mt-2 text-[13px] leading-relaxed text-slate-200 break-keep">{boundaryCopy}</p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-4 text-center">
          <p className="text-[14px] leading-relaxed text-slate-100 break-keep">{info.description}</p>
          <div className="mt-4 rounded-2xl border border-white/10 bg-black/25 px-4 py-4">
            <p className="text-[11px] font-black tracking-[0.18em] text-brand uppercase">상황극</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-200 break-keep">“{info.scenario}”</p>
          </div>
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
                  <span className={`rounded-full px-3 py-1 text-[11px] font-bold ${item.isBoundary ? 'border border-yellow-300/20 bg-yellow-400/12 text-yellow-100' : 'border border-cyan-300/20 bg-cyan-300/10 text-cyan-100'}`}>
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
          <div className="rounded-2xl border border-green-400/20 bg-green-400/[0.08] px-4 py-4 text-center">
            <p className="text-[11px] font-black tracking-[0.16em] text-green-100 uppercase">잘 통할 가능성</p>
            <p className="mt-2 text-[28px] font-black text-white">{compCopy.good.type}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-green-50/90 break-keep">{compCopy.good.description}</p>
          </div>
          <div className="rounded-2xl border border-rose-400/20 bg-rose-400/[0.08] px-4 py-4 text-center">
            <p className="text-[11px] font-black tracking-[0.16em] text-rose-100 uppercase">오늘은 살짝 부딪힐 수 있음</p>
            <p className="mt-2 text-[28px] font-black text-white">{compCopy.bad.type}</p>
            <p className="mt-1 text-[12px] leading-relaxed text-rose-50/90 break-keep">{compCopy.bad.description}</p>
          </div>
        </div>
      </div>
    )
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-[100dvh] w-full flex-col items-center px-6 pb-20 pt-6 text-white">
      <div aria-hidden="true" className="fixed left-[-99999px] top-0 pointer-events-none select-none">
        <div ref={shareCardRef}>
          <ShareCard context={shareContext} />
        </div>
      </div>

      <div ref={resultRef} className="relative mt-4 w-full max-w-sm overflow-hidden rounded-[2rem] border border-white/10 bg-slate-900/95 p-6 shadow-[0_30px_90px_rgba(2,6,23,0.55)]">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.14),_transparent_32%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.18),_transparent_28%),linear-gradient(180deg,rgba(15,23,42,0.1),rgba(15,23,42,0))]" />
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-full rounded-[1.8rem] border border-white/10 bg-[linear-gradient(145deg,rgba(15,23,42,0.96),rgba(17,24,39,0.88))] p-5 shadow-[0_26px_80px_rgba(2,6,23,0.44)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[15px] font-medium text-slate-300"><span className="font-black text-white">{displayName}</span>님의 오늘 성향 스냅샷</p>
                <div className="mt-4 flex items-end gap-1">
                  {mbti.split('').map((letter, idx) => (
                    <button
                      key={`${letter}-${idx}`}
                      type="button"
                      onClick={() => onOpenAxisGuide(letter)}
                      className="bg-gradient-to-r from-brand via-violet-300 to-cyan-300 bg-clip-text text-[70px] font-black leading-none tracking-[0.14em] text-transparent drop-shadow-[0_14px_30px_rgba(99,102,241,0.22)]"
                    >
                      {letter}
                    </button>
                  ))}
                </div>
                <p className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-[14px] font-bold text-slate-100">{info.nickname}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="rounded-[1.3rem] border border-brand/25 bg-brand/15 px-4 py-3 text-right shadow-[0_14px_28px_rgba(168,85,247,0.22)]">
                  <p className="text-[10px] font-black tracking-[0.2em] text-purple-100 uppercase">싱크로율</p>
                  <p className="mt-1 text-[28px] font-black text-white">{percent}%</p>
                </div>
                <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.1] px-3 py-1.5 text-[10px] font-black text-cyan-100">{precisionBadge}</span>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <span className="rounded-full border border-white/10 bg-white/[0.06] px-3 py-1.5 text-[11px] font-bold text-slate-100">{shareVibeStamp}</span>
              {topChangeChip && <span className="rounded-full border border-amber-300/20 bg-amber-300/[0.12] px-3 py-1.5 text-[11px] font-bold text-amber-100">{topChangeChip}</span>}
              {neutralReviewNote && <span className="rounded-full border border-cyan-300/20 bg-cyan-300/[0.1] px-3 py-1.5 text-[11px] font-bold text-cyan-100">보정 질문 반영</span>}
            </div>
          </div>

          <div className="mt-5 flex w-full flex-col gap-4 rounded-[1.8rem] border border-white/10 bg-[linear-gradient(180deg,rgba(10,16,29,0.94),rgba(15,23,42,0.88))] p-5 shadow-[0_22px_70px_rgba(2,6,23,0.38)]">
            {resolvedImageSrc && (
              <div className="relative flex items-center justify-center overflow-hidden rounded-[1.6rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_45%),linear-gradient(180deg,rgba(15,23,42,0.98),rgba(2,6,23,0.92))] px-3 py-4">
                <div className="absolute inset-x-6 top-3 h-14 rounded-full bg-cyan-400/15 blur-2xl" />
                <div className="absolute inset-x-6 bottom-3 h-16 rounded-full bg-brand/15 blur-2xl" />
                <img src={resolvedImageSrc} alt={mbti} className="relative z-10 h-44 w-44 object-contain drop-shadow-[0_16px_34px_rgba(15,23,42,0.76)]" />
              </div>
            )}

            <div className="rounded-[1.5rem] border border-cyan-300/20 bg-cyan-300/[0.08] px-4 py-4">
              <p className="text-[11px] font-black tracking-[0.2em] text-cyan-100 uppercase">오늘의 핵심 무드</p>
              <p className="mt-2 text-[26px] font-black leading-[1.18] text-white break-keep">{shareMoodLine}</p>
              <p className="mt-3 text-[14px] leading-relaxed text-slate-100 break-keep">{summaryCopy}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-[1.4rem] border border-white/10 bg-white/[0.05] px-4 py-4">
                <p className="text-[10px] font-black tracking-[0.18em] text-slate-400 uppercase">오늘 더 또렷한 축</p>
                <p className="mt-2 text-[22px] font-black text-white">{strongestAxis.pair}</p>
                <p className="mt-1 text-[12px] leading-relaxed text-slate-300 break-keep">{strongestAxis.dominantType} 흐름 {strongestAxis.intensity}%</p>
              </div>
              <div className="rounded-[1.4rem] border border-emerald-300/20 bg-emerald-300/[0.08] px-4 py-4">
                <p className="text-[10px] font-black tracking-[0.18em] text-emerald-100 uppercase">직전 변화</p>
                <p className="mt-2 text-[18px] font-black leading-[1.25] text-white break-keep">{historyComparison?.title || '오늘 결과가 첫 기준점이에요'}</p>
              </div>
            </div>
          </div>

          <div className="mt-5 flex w-full flex-col gap-3">
            <button onClick={handleSaveImage} className="w-full rounded-[1.6rem] border border-cyan-300/20 bg-cyan-300/[0.1] py-4 text-[15px] font-black text-cyan-50 transition hover:bg-cyan-300/[0.14]">
              {saveImageState === 'saving'
                ? '이미지 준비 중...'
                : saveImageState === 'shared'
                  ? '공유 시트 열림'
                  : saveImageState === 'saved'
                    ? '결과 카드 저장 완료'
                    : '결과 카드 공유/저장'}
            </button>
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
        {DETAIL_SECTIONS.map((section) => (
          <DetailSection
            key={section.key}
            title={section.title}
            preview={getDetailPreview({
              section: section.key,
              summaryCopy,
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
    </motion.div>
  );
}
