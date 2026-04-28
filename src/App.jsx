import { Suspense, lazy, useEffect, useRef, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import StartView from './components/StartView.jsx';
import QuestionView from './components/QuestionView.jsx';
import { AXIS_GUIDE, CHANGELOG, DEFAULT_USERNAME, QUESTION_TEMPO_COPY } from './lib/constants.js';
import {
  buildFollowupQuestions,
  buildQuestionSession,
  createEmptyNeutralSignals,
  createEmptyScores,
  formatMicroCopy,
  getFollowupTempoMessage,
  getQuestionContextVisual,
  getQuestionTempoMessage,
  summarizeQuestionContext
} from './lib/questionFlow.js';
import { summarizeActivityReport } from './lib/activityReport.js';
import {
  clearAllLocalData,
  clearActiveSession,
  readActiveSession,
  readHistory,
  readRecentSessions,
  readUserName,
  trackEvent,
  writeActiveSession,
  writeRecentSessions,
  writeUserName
} from './lib/storage.js';
import { installGlobalErrorHandlers } from './lib/observability.js';
import { getHistoryComparison, getHistoryEntryNote, getHistoryInsights } from './lib/resultAnalysis.js';

const retryImport = (loader, retries = 1) =>
  loader().catch((error) => {
    if (retries <= 0) throw error;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        retryImport(loader, retries - 1).then(resolve).catch(reject);
      }, 450);
    });
  });

const lazyWithRetry = (loader, retries = 1) => lazy(() => retryImport(loader, retries));

const ResultView = lazyWithRetry(() => import('./components/ResultView.jsx'));
const RecoveryPrompt = lazy(() => import('./components/RecoveryPrompt.jsx'));
const HistoryModal = lazy(() => import('./components/HistoryModal.jsx'));
const VersionModal = lazy(() => import('./components/VersionModal.jsx'));
const AxisGuideModal = lazy(() => import('./components/AxisGuideModal.jsx'));

const ScreenFallback = (
  <div className="w-full max-w-sm px-6 py-10">
    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm font-semibold text-slate-300">
      화면을 준비하고 있어요...
    </div>
  </div>
);

export default function App() {
  const [step, setStep] = useState('start');
  const [userName, setUserName] = useState(readUserName());
  const [showHistory, setShowHistory] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [showRecoveryPrompt, setShowRecoveryPrompt] = useState(false);
  const [recoverableSession, setRecoverableSession] = useState(null);
  const [axisGuideKey, setAxisGuideKey] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [followupQuestions, setFollowupQuestions] = useState([]);
  const [currIdx, setCurrIdx] = useState(0);
  const [scores, setScores] = useState(createEmptyScores());
  const [microCopy, setMicroCopy] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [questionDirection, setQuestionDirection] = useState(1);
  const [questionPhase, setQuestionPhase] = useState('base');
  const [recentSessionsSnapshot, setRecentSessionsSnapshot] = useState([]);
  const [sessionQuestionIds, setSessionQuestionIds] = useState([]);
  const [neutralSignals, setNeutralSignals] = useState(createEmptyNeutralSignals());
  const [neutralQuestionIds, setNeutralQuestionIds] = useState([]);
  const [questionContextSummary, setQuestionContextSummary] = useState(null);
  const [lastAnswerSnapshot, setLastAnswerSnapshot] = useState(null);
  const transitionLockRef = useRef(false);

  useEffect(() => {
    setHistoryData(readHistory());
    const savedSession = readActiveSession();
    if (savedSession && savedSession.questions?.length && savedSession.currIdx < savedSession.questions.length) {
      setRecoverableSession(savedSession);
      setShowRecoveryPrompt(true);
    }
  }, []);

  useEffect(() => {
    installGlobalErrorHandlers();
  }, []);

  const openHistoryModal = () => {
    trackEvent('history_open', { step });
    setShowHistory(true);
  };

  const handleRestart = () => {
    trackEvent('restart_click');
    clearActiveSession();
    setFollowupQuestions([]);
    setQuestionPhase('base');
    setSessionQuestionIds([]);
    setNeutralSignals(createEmptyNeutralSignals());
    setNeutralQuestionIds([]);
    setQuestionContextSummary(null);
    setLastAnswerSnapshot(null);
    transitionLockRef.current = false;
    setStep('start');
  };

  const handleStart = () => {
    const trimmedName = userName.trim();
    writeUserName(trimmedName);
    trackEvent('start_click', { hasName: Boolean(trimmedName) });

    const recentSessions = readRecentSessions();
    const sessionQuestions = buildQuestionSession(recentSessions);
    const thisSession = sessionQuestions.map((question) => question.id);

    setQuestions(sessionQuestions);
    setFollowupQuestions([]);
    setScores(createEmptyScores());
    setCurrIdx(0);
    setMicroCopy('');
    setQuestionDirection(1);
    setQuestionPhase('base');
    setRecentSessionsSnapshot(recentSessions);
    setSessionQuestionIds(thisSession);
    setNeutralSignals(createEmptyNeutralSignals());
    setNeutralQuestionIds([]);
    setQuestionContextSummary(null);
    setLastAnswerSnapshot(null);
    transitionLockRef.current = false;
    setStep('question');

    writeActiveSession({
      userName: trimmedName,
      questions: sessionQuestions,
      followupQuestions: [],
      currIdx: 0,
      scores: createEmptyScores(),
      questionPhase: 'base',
      recentSessions: recentSessions,
      sessionQuestionIds: thisSession,
      neutralSignals: createEmptyNeutralSignals(),
      neutralQuestionIds: []
    });
  };

  const handleResumeSession = () => {
    if (!recoverableSession) return;
    setUserName(recoverableSession.userName || '');
    setQuestions(recoverableSession.questions || []);
    setFollowupQuestions(recoverableSession.followupQuestions || []);
    setCurrIdx(recoverableSession.currIdx || 0);
    setScores(recoverableSession.scores || createEmptyScores());
    setMicroCopy('');
    setQuestionDirection(1);
    setQuestionPhase(recoverableSession.questionPhase || 'base');
    setRecentSessionsSnapshot(recoverableSession.recentSessions || []);
    setSessionQuestionIds(recoverableSession.sessionQuestionIds || []);
    setNeutralSignals(recoverableSession.neutralSignals || createEmptyNeutralSignals());
    setNeutralQuestionIds(recoverableSession.neutralQuestionIds || []);
    setQuestionContextSummary(null);
    setLastAnswerSnapshot(null);
    transitionLockRef.current = false;
    setShowRecoveryPrompt(false);
    setStep('question');
    trackEvent('session_resume');
  };

  const dismissRecovery = () => {
    clearActiveSession();
    setRecoverableSession(null);
    setShowRecoveryPrompt(false);
    setLastAnswerSnapshot(null);
    transitionLockRef.current = false;
    trackEvent('session_discard');
  };

  const latestHistoryComparison = getHistoryComparison(historyData[0]?.mbti || '', historyData);
  const latestHistoryInsights = getHistoryInsights(historyData);
  const activitySummary = summarizeActivityReport({
    historyData,
    historyInsights: latestHistoryInsights,
    historyComparison: latestHistoryComparison
  });
  const hasActivityReport = historyData.length > 0 || activitySummary.starts > 0 || activitySummary.saveOrShare > 0;

  const openVersionModal = () => {
    trackEvent('version_open');
    setShowVersionModal(true);
  };

  const handleClearLocalData = () => {
    const ok = window.confirm('이 브라우저에 저장된 이름, 기록, 활동 리포트를 모두 지울까요?');
    if (!ok) return;

    clearAllLocalData();
    setUserName('');
    setHistoryData([]);
    setRecoverableSession(null);
    setShowRecoveryPrompt(false);
    setShowHistory(false);
    setLastAnswerSnapshot(null);
    transitionLockRef.current = false;
  };

  const finishSession = (finalScores, finalSessionIds = sessionQuestionIds) => {
    const nextQuestionContextSummary = summarizeQuestionContext(questions, followupQuestions);
    setQuestionContextSummary(nextQuestionContextSummary);
    writeRecentSessions([finalSessionIds, ...recentSessionsSnapshot].slice(0, 6));
    trackEvent('complete_test', {
      usedFollowup: questionPhase === 'followup' || followupQuestions.length > 0,
      followupCount: followupQuestions.length,
      neutralCount: neutralQuestionIds.length,
      questionContextTop: nextQuestionContextSummary.topTag
    });
    clearActiveSession();
    setScores(finalScores);
    setLastAnswerSnapshot(null);
    transitionLockRef.current = false;
    setStep('result');
  };

  const activeQuestions = questionPhase === 'followup' ? followupQuestions : questions;
  const activeQuestion = activeQuestions[currIdx];
  const activeQuestionContextVisual = activeQuestion ? getQuestionContextVisual(activeQuestion) : null;
  const followupHasNeutralReview = questionPhase === 'followup' && followupQuestions.some((item) => (item.trigger?.neutralCount || 0) > 0);
  const questionPhaseHint =
    questionPhase === 'followup'
      ? followupHasNeutralReview
        ? '방금 애매했던 부분을 조금 더 또렷하게 볼게요'
        : '경계에 있는 축을 한 번 더 확인하고 있어요'
      : activeQuestion?.allowMiddle
        ? '둘 중 하나가 딱 안 잡히면 보조 버튼으로 넘어갈 수 있어요'
        : '';

  const createQuestionSnapshot = () => ({
    userName,
    questions,
    followupQuestions,
    currIdx,
    scores,
    questionPhase,
    recentSessions: recentSessionsSnapshot,
    sessionQuestionIds,
    neutralSignals,
    neutralQuestionIds,
    questionContextSummary
  });

  const writeSessionFromSnapshot = (snapshot) => {
    writeActiveSession({
      userName: snapshot.userName || '',
      questions: snapshot.questions || [],
      followupQuestions: snapshot.followupQuestions || [],
      currIdx: snapshot.currIdx || 0,
      scores: snapshot.scores || createEmptyScores(),
      questionPhase: snapshot.questionPhase || 'base',
      recentSessions: snapshot.recentSessions || [],
      sessionQuestionIds: snapshot.sessionQuestionIds || [],
      neutralSignals: snapshot.neutralSignals || createEmptyNeutralSignals(),
      neutralQuestionIds: snapshot.neutralQuestionIds || []
    });
  };

  const getAnswerDirection = (method) => (method?.includes('left') ? -1 : 1);

  const trackQuestionAnswer = (method) => {
    trackEvent('question_answer', {
      method,
      phase: questionPhase,
      questionId: activeQuestion?.id || '',
      axis: activeQuestion?._axis || '',
      index: currIdx + 1
    });
  };

  const advanceWithResponse = ({
    nextScores,
    nextNeutralSignals = neutralSignals,
    nextNeutralQuestionIds = neutralQuestionIds,
    microText = '',
    direction = 1
  }) => {
    setScores(nextScores);
    setNeutralSignals(nextNeutralSignals);
    setNeutralQuestionIds(nextNeutralQuestionIds);
    setMicroCopy(formatMicroCopy(microText));
    setQuestionDirection(direction);

    setTimeout(() => {
      setMicroCopy('');

      if (questionPhase === 'base') {
        if (currIdx + 1 >= 12) {
          const nextFollowupQuestions = buildFollowupQuestions(
            nextScores,
            recentSessionsSnapshot,
            sessionQuestionIds,
            nextNeutralSignals
          );

          if (nextFollowupQuestions.length > 0) {
            const nextSessionIds = [...sessionQuestionIds, ...nextFollowupQuestions.map((item) => item.id)];
            trackEvent('followup_start', {
              count: nextFollowupQuestions.length,
              neutralCount: nextNeutralQuestionIds.length
            });
            setFollowupQuestions(nextFollowupQuestions);
            setQuestionPhase('followup');
            setCurrIdx(0);
            setSessionQuestionIds(nextSessionIds);
            writeActiveSession({
              userName,
              questions,
              followupQuestions: nextFollowupQuestions,
              currIdx: 0,
              scores: nextScores,
              questionPhase: 'followup',
              recentSessions: recentSessionsSnapshot,
              sessionQuestionIds: nextSessionIds,
              neutralSignals: nextNeutralSignals,
              neutralQuestionIds: nextNeutralQuestionIds
            });
          } else {
            finishSession(nextScores);
          }
        } else {
          const nextIdx = currIdx + 1;
          if (nextIdx === 3) trackEvent('question_reach_3');
          if (nextIdx === 6) trackEvent('question_reach_6');
          if (nextIdx === 9) trackEvent('question_reach_9');
          setCurrIdx(nextIdx);
          writeActiveSession({
            userName,
            questions,
            followupQuestions,
            currIdx: nextIdx,
            scores: nextScores,
            questionPhase,
            recentSessions: recentSessionsSnapshot,
            sessionQuestionIds,
            neutralSignals: nextNeutralSignals,
            neutralQuestionIds: nextNeutralQuestionIds
          });
        }
      } else if (currIdx + 1 >= followupQuestions.length) {
        finishSession(nextScores);
      } else {
        const nextIdx = currIdx + 1;
        setCurrIdx(nextIdx);
        writeActiveSession({
          userName,
          questions,
          followupQuestions,
          currIdx: nextIdx,
          scores: nextScores,
          questionPhase,
          recentSessions: recentSessionsSnapshot,
          sessionQuestionIds,
          neutralSignals: nextNeutralSignals,
          neutralQuestionIds: nextNeutralQuestionIds
        });
      }

      transitionLockRef.current = false;
      setIsTransitioning(false);
    }, 800);
  };

  const handleQuestionAnswer = (option, method = 'tap') => {
    if (isTransitioning || transitionLockRef.current) return;
    transitionLockRef.current = true;
    setLastAnswerSnapshot(createQuestionSnapshot());
    setIsTransitioning(true);
    trackQuestionAnswer(method);

    const weight = activeQuestion?.weight || 1;
    const nextScores = { ...scores, [option.type]: (scores[option.type] || 0) + weight };
    advanceWithResponse({
      nextScores,
      microText: option.micro,
      direction: getAnswerDirection(method)
    });
  };

  const handleMiddleAnswer = (method = 'middle') => {
    if (isTransitioning || transitionLockRef.current) return;
    transitionLockRef.current = true;
    setLastAnswerSnapshot(createQuestionSnapshot());
    setIsTransitioning(true);
    trackQuestionAnswer(method);

    const axisCode = activeQuestion?._axis;
    const nextNeutralSignals = axisCode
      ? { ...neutralSignals, [axisCode]: (neutralSignals[axisCode] || 0) + 1 }
      : neutralSignals;
    const nextNeutralQuestionIds = activeQuestion?.id
      ? [...neutralQuestionIds, activeQuestion.id]
      : neutralQuestionIds;

    advanceWithResponse({
      nextScores: scores,
      nextNeutralSignals,
      nextNeutralQuestionIds,
      microText: '이 축은 한 번 더 볼게요'
    });
  };

  const handleQuestionBack = () => {
    if (!lastAnswerSnapshot || isTransitioning || transitionLockRef.current) return;

    const snapshot = lastAnswerSnapshot;
    transitionLockRef.current = false;
    setUserName(snapshot.userName || '');
    setQuestions(snapshot.questions || []);
    setFollowupQuestions(snapshot.followupQuestions || []);
    setCurrIdx(snapshot.currIdx || 0);
    setScores(snapshot.scores || createEmptyScores());
    setQuestionPhase(snapshot.questionPhase || 'base');
    setRecentSessionsSnapshot(snapshot.recentSessions || []);
    setSessionQuestionIds(snapshot.sessionQuestionIds || []);
    setNeutralSignals(snapshot.neutralSignals || createEmptyNeutralSignals());
    setNeutralQuestionIds(snapshot.neutralQuestionIds || []);
    setQuestionContextSummary(snapshot.questionContextSummary || null);
    setMicroCopy('');
    setQuestionDirection(-1);
    setStep('question');
    setLastAnswerSnapshot(null);
    writeSessionFromSnapshot(snapshot);

    const restoredQuestions = snapshot.questionPhase === 'followup'
      ? snapshot.followupQuestions || []
      : snapshot.questions || [];
    const restoredQuestion = restoredQuestions[snapshot.currIdx || 0];
    trackEvent('question_back', {
      phase: snapshot.questionPhase || 'base',
      questionId: restoredQuestion?.id || '',
      axis: restoredQuestion?._axis || '',
      index: (snapshot.currIdx || 0) + 1
    });
  };

  return (
    <div className={`relative w-full min-h-[100dvh] flex flex-col items-center ${step !== 'result' ? 'justify-center' : 'pt-10'}`}>
      <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-purple-900 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-blob pointer-events-none"></div>
      <div className="fixed top-[20%] right-[-10%] w-96 h-96 bg-cyan-900 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-blob pointer-events-none" style={{ animationDelay: '2s' }}></div>
      <div className="fixed bottom-[-20%] left-[20%] w-96 h-96 bg-pink-900 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-blob pointer-events-none" style={{ animationDelay: '4s' }}></div>

      <div
        className={`relative z-10 w-full max-w-md min-h-[100dvh] mx-auto flex flex-col items-center ${
          step === 'result' ? 'pt-4' : 'justify-center'
        }`}
      >
        <AnimatePresence mode="wait">
          {step === 'start' && (
            <StartView
              key="start"
              userName={userName}
              onChangeUserName={setUserName}
              onStart={handleStart}
              hasHistory={hasActivityReport}
              onOpenHistory={openHistoryModal}
            />
          )}

          {step === 'question' && activeQuestion && (
            <QuestionView
              key={`question-${questionPhase}-${currIdx}`}
              currIdx={currIdx}
              totalQuestions={questionPhase === 'followup' ? followupQuestions.length : 12}
              question={activeQuestion}
              microCopy={microCopy}
              isTransitioning={isTransitioning}
              questionDirection={questionDirection}
              tempoMessage={
                questionPhase === 'followup'
                  ? getFollowupTempoMessage(currIdx, followupQuestions.length)
                  : getQuestionTempoMessage(currIdx, '지금의 결대로 가볍게 골라보세요', QUESTION_TEMPO_COPY)
              }
              phaseHint={questionPhaseHint}
              questionLabel={questionPhase === 'followup' ? `보정 ${currIdx + 1}` : undefined}
              counterText={
                questionPhase === 'followup'
                  ? `보정 질문 ${currIdx + 1} / ${followupQuestions.length}`
                  : undefined
              }
              showMiddleOption={questionPhase === 'base' && Boolean(activeQuestion.allowMiddle)}
              middleLabel="둘 다 비슷해요"
              contextVisual={activeQuestionContextVisual}
              canGoBack={Boolean(lastAnswerSnapshot)}
              onAnswer={handleQuestionAnswer}
              onMiddleAnswer={handleMiddleAnswer}
              onBack={handleQuestionBack}
            />
          )}

          {step === 'result' && (
            <Suspense fallback={ScreenFallback}>
              <ResultView
                key="result"
                scores={scores}
                userName={userName}
                historyData={historyData}
                setHistoryData={setHistoryData}
                defaultUserName={DEFAULT_USERNAME}
                openHistoryModal={openHistoryModal}
                onRestart={handleRestart}
                onOpenAxisGuide={setAxisGuideKey}
                trackEvent={trackEvent}
                neutralCount={neutralQuestionIds.length}
                usedFollowup={followupQuestions.length > 0}
                questionContextSummary={questionContextSummary}
              />
            </Suspense>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showRecoveryPrompt && recoverableSession && step === 'start' && (
            <Suspense fallback={null}>
              <RecoveryPrompt session={recoverableSession} onResume={handleResumeSession} onDismiss={dismissRecovery} />
            </Suspense>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showHistory && (
            <Suspense fallback={null}>
              <HistoryModal
                activitySummary={activitySummary}
                latestHistoryComparison={latestHistoryComparison}
                latestHistoryInsights={latestHistoryInsights}
                historyData={historyData}
                getHistoryEntryNote={getHistoryEntryNote}
                onClose={() => setShowHistory(false)}
                onClearData={handleClearLocalData}
              />
            </Suspense>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showVersionModal && (
            <Suspense fallback={null}>
              <VersionModal changelog={CHANGELOG} onClose={() => setShowVersionModal(false)} />
            </Suspense>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {axisGuideKey && (
            <Suspense fallback={null}>
              <AxisGuideModal guide={AXIS_GUIDE[axisGuideKey]} onClose={() => setAxisGuideKey(null)} />
            </Suspense>
          )}
        </AnimatePresence>

        {step !== 'question' && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={openVersionModal}
              className="text-[11px] font-bold text-slate-600 hover:text-slate-400 transition-colors bg-black/20 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm"
            >
              Version {CHANGELOG[0].version}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
