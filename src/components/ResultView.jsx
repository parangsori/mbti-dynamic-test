import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { IMAGE_BASE64, MBTI_RESULTS } from '../data/mbtiData.js';
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
  getShareCardCopy
} from '../lib/resultAnalysis.js';
import { writeHistory } from '../lib/storage.js';
import { getCanvasBlob, renderShareCardCanvas, shareOrSaveBlob } from '../lib/shareCard.js';

export default function ResultView({
  scores,
  userName,
  historyData,
  setHistoryData,
  defaultUserName,
  openHistoryModal,
  onRestart,
  onOpenAxisGuide,
  trackEvent
}) {
  const resultRef = useRef(null);
  const shareCardRef = useRef(null);
  const [shareCopied, setShareCopied] = useState(false);
  const [saveImageState, setSaveImageState] = useState('idle');

  const { mbti, info, badges, percent, spectrum, boundaryAxes } = computeResult(scores);
  const resolvedImageSrc = info.image
    ? IMAGE_BASE64[info.image] || info.image
    : '';

  useEffect(() => {
    const newEntry = {
      date: new Date().toLocaleDateString('ko-KR', { month: 'short', day: 'numeric', weekday: 'short' }),
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

    if (!historyData.length || historyData[0].mbti !== mbti || historyData[0].date !== newEntry.date) {
      const updated = [newEntry, ...historyData].slice(0, 7);
      writeHistory(updated);
      setHistoryData(updated);
    }
  }, [historyData, mbti, percent, setHistoryData, spectrum]);

  const compCopy = getCompatibilityCopy(mbti);
  const axisNarratives = getAxisNarratives(spectrum);
  const summaryCopy = getResultSummary(mbti, spectrum, percent);
  const consistencyCopy = getConsistencyCopy(percent, boundaryAxes);
  const boundaryCopy = getBoundaryCopy(boundaryAxes);
  const effectiveHistory = getEffectiveHistory(mbti, percent, historyData);
  const historyComparison = getHistoryComparison(mbti, effectiveHistory);
  const axisChanges = getAxisChangeDetails(mbti, effectiveHistory[1]?.mbti);
  const historyInsights = getHistoryInsights(effectiveHistory);
  const trendAnalysis = getTrendAnalysis(spectrum, effectiveHistory[1]?.axes);
  const displayName = getDisplayName(userName, defaultUserName);
  const { shareMoodLine, shareHeadline, shareSummaryShort, shareVibeStamp, shareCardCopy } = getShareCardCopy(mbti, spectrum, badges, info, percent);

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
    } catch (error) {
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
      if (error?.name === 'AbortError') {
        setSaveImageState('idle');
      } else {
        setSaveImageState('idle');
      }
    } finally {
      setTimeout(() => setSaveImageState('idle'), 1800);
    }
  };

  let dynamicTitle = '';
  if (percent >= 90) dynamicTitle = `[순도 ${percent}% 완벽한 ${mbti} 모드]`;
  else if (percent >= 70) dynamicTitle = `[확고한 ${mbti}의 하루]`;
  else dynamicTitle = `[외향과 내향, 이성과 감성이 섞인 ${mbti}]`;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center w-full min-h-[100dvh] p-6 text-white pb-20">
      <div aria-hidden="true" className="fixed left-[-99999px] top-0 pointer-events-none select-none">
        <div
          ref={shareCardRef}
          className="relative w-[1080px] h-[1080px] overflow-hidden rounded-[64px] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.16),_transparent_26%),radial-gradient(circle_at_bottom_left,_rgba(168,85,247,0.22),_transparent_28%),linear-gradient(145deg,#09111f_0%,#111827_42%,#0f172a_100%)] text-white shadow-[0_40px_120px_rgba(2,6,23,0.7)]"
        >
          <div className="absolute -right-20 top-[-90px] h-80 w-80 rounded-full bg-brand/20 blur-3xl"></div>
          <div className="absolute bottom-[-80px] left-[-40px] h-72 w-72 rounded-full bg-cyan-400/15 blur-3xl"></div>
          <div className="absolute left-[70px] top-[132px] h-[460px] w-[460px] rounded-full border border-white/5 bg-cyan-300/[0.04]"></div>
          <div className="absolute right-[88px] top-[208px] h-[430px] w-[430px] rounded-[46px] border border-cyan-300/10 bg-cyan-300/[0.04] rotate-[-6deg]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.05),transparent_24%,transparent_72%,rgba(255,255,255,0.03))]"></div>

          <div className="relative z-10 flex h-full flex-col px-20 py-20">
            <div className="flex items-start justify-between gap-8">
              <div className="max-w-[520px]">
                <p className="text-[24px] font-medium tracking-[-0.02em] text-slate-300">
                  <span className="font-extrabold text-white">{displayName}</span>님의 오늘 성향 카드
                </p>
                <p className="mt-5 text-[54px] font-black tracking-[0.12em] text-white drop-shadow-[0_10px_25px_rgba(15,23,42,0.6)]">{mbti}</p>
                <p className="mt-3 inline-flex rounded-full border border-white/10 bg-white/[0.05] px-5 py-2 text-[21px] font-semibold text-slate-100">
                  {info.nickname}
                </p>
              </div>
              <div className="rounded-[32px] border border-white/15 bg-white/10 px-7 py-5 text-right shadow-lg shadow-slate-950/30 backdrop-blur-sm">
                <p className="text-[15px] font-semibold tracking-[0.14em] text-slate-200 uppercase">싱크로율</p>
                <p className="mt-1 text-[42px] font-black text-white">{percent}%</p>
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
                  <p className="text-[15px] font-semibold text-slate-300">오늘의 흐름을 가볍게 저장해보세요</p>
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
      </div>

      <div ref={resultRef} className="bg-slate-900 p-8 w-full max-w-sm flex flex-col items-center mt-6 rounded-3xl border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-brand/20 blur-3xl rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-cyan-500/20 blur-3xl rounded-full"></div>

        <div className="relative z-10 flex flex-col items-center w-full">
          <h2 className="text-xl font-light text-slate-300 mb-2 mt-2">
            <span className="font-bold text-white">{displayName}</span>님의 오늘 성향 스냅샷
          </h2>

          <div className="relative mb-3 mt-3">
            <div className="flex items-center justify-center gap-1">
              {mbti.split('').map((letter, idx) => (
                <button
                  key={`${letter}-${idx}`}
                  onClick={() => onOpenAxisGuide(letter)}
                  className="text-6xl font-black bg-gradient-to-r from-brand to-cyan-400 bg-clip-text text-transparent tracking-widest drop-shadow-sm hover:scale-105 transition-transform"
                >
                  {letter}
                </button>
              ))}
            </div>
            <div className="absolute -top-4 -right-10 bg-brand text-white px-2.5 py-1 rounded-full text-[11px] font-black shadow-lg shadow-purple-500/30 transform rotate-12 border border-white/20 whitespace-nowrap">
              싱크로율 {percent}%
            </div>
          </div>
          <p className="text-xl font-bold text-center text-slate-100">{info.nickname}</p>
          <p className="text-sm font-bold text-brand bg-brand/10 px-3 py-1 rounded-full mt-3 border border-brand/20 shadow-inner">{dynamicTitle}</p>

          <div className="w-full mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-center">
            <p className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">오늘의 공유 한 줄</p>
            <p className="mt-2 text-[18px] font-black leading-snug text-white break-keep">{shareMoodLine}</p>
            <button
              onClick={handleCopyShare}
              data-html2canvas-ignore="true"
              className="mt-3 inline-flex items-center justify-center rounded-full border border-cyan-400/20 bg-cyan-400/10 px-4 py-2 text-[12px] font-bold text-cyan-100 hover:bg-cyan-400/15 transition-colors"
            >
              {shareCopied ? '복사 완료' : '한 줄 결과 복사'}
            </button>
          </div>

          {resolvedImageSrc && (
            <div className="w-full mt-6 mb-6 flex justify-center">
              <div className="relative w-56 h-56 rounded-[2rem] border border-white/10 bg-[radial-gradient(circle_at_top,_rgba(34,211,238,0.18),_transparent_48%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.92))] shadow-[0_20px_60px_rgba(2,6,23,0.55)] overflow-hidden flex items-center justify-center isolate">
                <div className="absolute inset-x-6 top-4 h-16 rounded-full bg-cyan-400/15 blur-2xl"></div>
                <div className="absolute inset-x-8 bottom-4 h-20 rounded-full bg-brand/15 blur-2xl"></div>
                <div className="absolute inset-0 border border-white/5 rounded-[2rem]"></div>
                <img src={resolvedImageSrc} alt={mbti} className="relative z-10 w-44 h-44 object-contain drop-shadow-[0_14px_30px_rgba(15,23,42,0.75)]" />
              </div>
            </div>
          )}

          <div className="w-full mt-6 mb-5 rounded-2xl border border-cyan-400/20 bg-cyan-400/10 px-5 py-4 text-center">
            <p className="text-[15px] font-semibold leading-relaxed text-cyan-50 break-keep">{summaryCopy}</p>
          </div>

          <div className="w-full mb-6 rounded-2xl border border-white/10 bg-black/25 px-4 py-4 text-center">
            <p className="text-[11px] font-bold tracking-[0.2em] text-slate-400 uppercase">오늘 답변 기준 성향 흐름</p>
            <p className="mt-2 text-2xl font-black text-white">{percent}%</p>
            <p className="mt-2 text-[13px] leading-relaxed text-slate-300 break-keep">{consistencyCopy}</p>
          </div>

          {historyComparison && (
            <div className="w-full mb-6 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-4">
              <p className="text-[11px] font-bold tracking-[0.2em] text-emerald-200 uppercase">직전 결과와 비교</p>
              <p className="mt-2 text-[15px] font-semibold leading-relaxed text-white break-keep">{historyComparison.title}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-emerald-50/90 break-keep">{historyComparison.body}</p>
              {axisChanges.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {axisChanges.map((axis) => (
                    <span key={axis.pair} className="px-3 py-1 rounded-full border border-emerald-300/20 bg-black/20 text-[11px] font-semibold text-emerald-100">
                      {axis.pair} {axis.before}→{axis.after}
                    </span>
                  ))}
                </div>
              )}
              {historyInsights?.stableCount >= 2 && (
                <p className="mt-3 text-[11px] text-emerald-100/80">최근 {historyInsights.stableCount}회 연속 {mbti} 흐름이 이어지고 있어요.</p>
              )}
            </div>
          )}

          {trendAnalysis && (
            <div className="w-full mb-6 rounded-2xl border border-fuchsia-400/20 bg-fuchsia-400/10 px-4 py-4">
              <p className="text-[11px] font-bold tracking-[0.2em] text-fuchsia-200 uppercase">장기 흐름 리포트</p>
              <p className="mt-2 text-[15px] font-semibold leading-relaxed text-white break-keep">{trendAnalysis.title}</p>
              <p className="mt-2 text-[12px] leading-relaxed text-fuchsia-50/90 break-keep">{trendAnalysis.body}</p>
            </div>
          )}

          {historyInsights && (
            <div className="grid w-full grid-cols-2 gap-3 mb-6">
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-[11px] font-bold tracking-[0.15em] text-slate-400 uppercase">요즘 가장 자주 나온 흐름</p>
                <p className="mt-2 text-2xl font-black text-white">{historyInsights.topType?.mbti || mbti}</p>
                <p className="mt-1 text-[11px] text-slate-300 break-keep">최근 {historyInsights.recentCount}회 중 {historyInsights.topType?.count || 1}회</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
                <p className="text-[11px] font-bold tracking-[0.15em] text-slate-400 uppercase">가장 잘 흔들리는 축</p>
                <p className="mt-2 text-lg font-black text-white">{historyInsights.mostVolatile?.pair || '-'}</p>
                <p className="mt-1 text-[11px] text-slate-300 break-keep">
                  {historyInsights.mostVolatile?.flips ? `${historyInsights.mostVolatile.flips}번 바뀌었어요` : '최근엔 거의 그대로였어요'}
                </p>
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-2 justify-center mb-8">
            {badges.map((badge, i) => (
              <span key={`${badge}-${i}`} className="px-3 py-1.5 bg-white/5 border border-white/20 rounded-full text-[13px] font-semibold text-cyan-200">
                #{badge}
              </span>
            ))}
          </div>

          <div className="bg-white/5 rounded-2xl p-5 w-full border border-white/5 backdrop-blur-sm">
            <p className="text-center text-[15px] leading-relaxed mb-4 text-slate-200">{info.description}</p>
            <div className="bg-black/30 rounded-xl p-4 text-[14px] font-medium text-slate-300 text-center leading-snug break-keep relative border border-white/5 pb-5">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-slate-800 text-[10px] text-purple-300 px-3 py-0.5 rounded-full border border-brand/30">상황극</div>
              <span className="text-brand mr-1">"</span>
              {info.scenario}
              <span className="text-brand ml-1">"</span>
            </div>

            <div className="pt-6 border-t border-white/10 mt-6">
              <h3 className="text-[13px] font-black text-slate-400 mb-4 text-center tracking-wider">성향 밸런스 분석</h3>
              <div className="mb-4 rounded-xl border border-white/10 bg-black/20 px-4 py-4">
                <p className="text-[12px] font-semibold text-white text-center">이번 결과에서 읽히는 핵심 포인트</p>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-300 text-center break-keep">{boundaryCopy}</p>
              </div>
              <div className="flex flex-col gap-4 px-1">
                {axisNarratives.map((item, idx) => {
                  const leftRatio = item.leftScore >= item.rightScore ? item.intensity : 100 - item.intensity;
                  const rightRatio = 100 - leftRatio;
                  const isLeftDom = item.leftScore >= item.rightScore;

                  return (
                    <div key={idx} className={`rounded-xl border px-3 py-3 ${item.isBoundary ? 'border-yellow-500/30 bg-yellow-500/5' : 'border-white/5 bg-black/10'}`}>
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div>
                          <button onClick={() => onOpenAxisGuide(item.left)} className="text-[12px] font-black text-white tracking-wide hover:text-cyan-200 transition-colors">
                            {item.pair || `${item.left}/${item.right}`}
                          </button>
                          <p className="mt-1 text-[10px] font-semibold text-slate-400">{item.stateLabel}</p>
                        </div>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${item.isBoundary ? 'border-yellow-400/30 bg-yellow-500/10 text-yellow-200' : 'border-cyan-400/20 bg-cyan-400/10 text-cyan-100'}`}>
                          {item.dominantType} 우세 {item.intensity}%
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[12px] font-bold text-slate-400">
                        <div className="flex flex-col items-center justify-center w-10">
                          <span className={`text-center ${isLeftDom ? 'text-brand text-[16px] drop-shadow-[0_0_8px_rgba(168,85,247,0.8)]' : ''}`}>{item.left}</span>
                          <span className={`text-[9px] -mt-0.5 ${isLeftDom ? 'text-purple-300' : 'text-slate-500'}`}>{item.leftLabel}</span>
                        </div>
                        <div className="flex-1">
                          <div className="h-3 bg-slate-800/80 rounded-full overflow-hidden flex relative shadow-inner">
                            <motion.div initial={{ width: 0 }} animate={{ width: `${leftRatio}%` }} transition={{ duration: 1, delay: 0.1 * idx, type: 'spring' }} className="h-full bg-gradient-to-r from-brand to-purple-400" />
                            <motion.div initial={{ width: 0 }} animate={{ width: `${rightRatio}%` }} transition={{ duration: 1, delay: 0.1 * idx, type: 'spring' }} className="h-full bg-gradient-to-l from-cyan-400 to-cyan-600" />
                          </div>
                        </div>
                        <div className="flex flex-col items-center justify-center w-10">
                          <span className={`text-center ${!isLeftDom ? 'text-cyan-400 text-[16px] drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]' : ''}`}>{item.right}</span>
                          <span className={`text-[9px] -mt-0.5 ${!isLeftDom ? 'text-cyan-200' : 'text-slate-500'}`}>{item.rightLabel}</span>
                        </div>
                      </div>
                      <p className="mt-3 text-[12px] leading-relaxed text-slate-300 break-keep">
                        <span className="font-bold text-white">{item.dominantType} 쪽이 더 강했어요.</span> {item.narrative}
                      </p>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-3 w-full mt-6">
                <div className="flex-1 bg-gradient-to-br from-green-500/10 to-emerald-500/5 border border-green-500/20 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-green-500/10 blur-xl rounded-full"></div>
                  <span className="text-[10px] text-green-300 font-bold mb-1 text-center">{compCopy.good.title}</span>
                  <span className="text-xl font-black text-green-400 mb-0.5">{compCopy.good.type}</span>
                  <span className="text-[9px] text-green-200/80 text-center font-medium leading-tight tracking-tight break-keep">{MBTI_RESULTS[compCopy.good.type]?.nickname}</span>
                  <p className="mt-2 text-[10px] text-center leading-snug text-green-100/80 break-keep">{compCopy.good.description}</p>
                </div>
                <div className="flex-1 bg-gradient-to-br from-red-500/10 to-rose-500/5 border border-red-500/20 rounded-xl p-3 flex flex-col items-center justify-center relative overflow-hidden">
                  <div className="absolute bottom-0 left-0 w-16 h-16 bg-red-500/10 blur-xl rounded-full"></div>
                  <span className="text-[10px] text-red-300 font-bold mb-1 text-center">{compCopy.bad.title}</span>
                  <span className="text-xl font-black text-red-400 mb-0.5">{compCopy.bad.type}</span>
                  <span className="text-[9px] text-red-200/80 text-center font-medium leading-tight tracking-tight break-keep">{MBTI_RESULTS[compCopy.bad.type]?.nickname}</span>
                  <p className="mt-2 text-[10px] text-center leading-snug text-red-100/80 break-keep">{compCopy.bad.description}</p>
                </div>
              </div>

              <div className="mt-6 rounded-xl border border-brand/20 bg-brand/10 px-4 py-4">
                <p className="text-[12px] font-bold text-brand">내일의 나는 또 다를 수 있어요</p>
                <p className="mt-2 text-[12px] leading-relaxed text-slate-300 break-keep">
                  이 결과는 오늘의 기분, 에너지, 관계 맥락이 반영된 스냅샷에 가까워요. 다른 날 다시 해보면 경계 축이나 우세 흐름이 조금씩 다르게 나타날 수 있어요.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 w-full max-w-sm mt-8">
        <button onClick={openHistoryModal} className="w-full py-4 bg-white/5 border border-white/10 rounded-3xl text-slate-200 font-bold hover:bg-white/10 transition-colors flex items-center justify-center gap-2">
          🕒 나의 MBTI 기록 보기
        </button>
        <button onClick={handleSaveImage} className="w-full py-4 bg-cyan-400/10 border border-cyan-400/20 rounded-3xl text-cyan-100 font-bold hover:bg-cyan-400/15 transition-colors flex items-center justify-center gap-2">
          {saveImageState === 'saving'
            ? '이미지 준비 중...'
            : saveImageState === 'shared'
              ? '공유 시트 열림'
              : saveImageState === 'saved'
                ? '결과 카드 저장 완료'
                : '결과 카드 공유/저장'}
        </button>
        <button onClick={onRestart} className="w-full py-4 mt-2 text-slate-400 underline underline-offset-4 decoration-slate-600 font-medium hover:text-slate-200 transition-colors">
          지금 다시 해보기
        </button>
      </div>
    </motion.div>
  );
}
