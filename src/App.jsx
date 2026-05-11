import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
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
  clearProfile,
  clearPendingResult,
  readActiveSession,
  readHistory,
  readPendingResult,
  readProfile,
  readRecentSessions,
  readUserName,
  trackEvent,
  writeActiveSession,
  writePendingResult,
  writeProfile,
  writeRecentSessions,
  writeUserName
} from './lib/storage.js';
import { captureError, installGlobalErrorHandlers } from './lib/observability.js';
import { getHistoryComparison, getHistoryEntryNote, getHistoryInsights } from './lib/resultAnalysis.js';
// Accessibility helpers are loaded inline to avoid dual-import warning
const loadAccessibilitySettings = () => {
  try {
    const fontScale = parseFloat(localStorage.getItem('mbti_font_scale')) || 1;
    const highContrast = localStorage.getItem('mbti_high_contrast') === 'true';
    return { fontScale, highContrast };
  } catch {
    return { fontScale: 1, highContrast: false };
  }
};
const applyAccessibilitySettings = ({ fontScale, highContrast }) => {
  document.documentElement.style.setProperty('--app-font-scale', fontScale);
  document.documentElement.classList.toggle('high-contrast', highContrast);
};
import { getPersonalizedTempoMessage, getAgeGroupFromBirthDate } from './lib/personalization.js';

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
const AccessibilitySettings = lazy(() => import('./components/AccessibilitySettings.jsx'));

const ScreenFallback = (
  <div className="w-full max-w-sm px-6 py-10">
    <div className="rounded-3xl border border-white/10 bg-white/5 px-6 py-10 text-center text-sm font-semibold text-slate-300">
      <p>화면을 준비하고 있어요...</p>
      <button
        type="button"
        onClick={() => window.location.reload()}
        className="mt-5 rounded-2xl border border-cyan-200/20 bg-cyan-300/[0.12] px-4 py-3 text-[13px] font-black text-cyan-50 transition hover:bg-cyan-300/[0.18]"
      >
        결과 다시 불러오기
      </button>
    </div>
  </div>
);

class ResultErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    captureError(error, {
      key: 'result_screen_error',
      stage: 'result_render',
      componentStack: info?.componentStack || ''
    });
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="w-full max-w-sm px-6 py-10">
        <div className="rounded-3xl border border-red-300/20 bg-red-950/30 px-6 py-8 text-center shadow-[0_20px_55px_rgba(127,29,29,0.22)]">
          <p className="text-[12px] font-black tracking-[0.18em] text-red-100 uppercase">결과 화면 오류</p>
          <h2 className="mt-3 text-xl font-black text-white break-keep">결과를 불러오지 못했어요</h2>
          <p className="mt-3 text-[13px] leading-relaxed text-slate-200 break-keep">
            네트워크가 순간적으로 끊겼거나 결과 화면 파일을 새로 받아오지 못했을 수 있어요.
          </p>
          <div className="mt-5 grid gap-2">
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-2xl border border-cyan-200/20 bg-cyan-300/[0.14] px-4 py-3 text-[13px] font-black text-cyan-50 transition hover:bg-cyan-300/[0.2]"
            >
              결과 다시 불러오기
            </button>
            <button
              type="button"
              onClick={this.props.onRestart}
              className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 text-[13px] font-bold text-slate-200 transition hover:bg-white/[0.09]"
            >
              처음으로 돌아가기
            </button>
          </div>
        </div>
      </div>
    );
  }
}

const HOME_SCREEN_TIP_HIDDEN_KEY = 'mbti_home_screen_tip_hidden';

const isStandaloneDisplay = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator?.standalone === true;
};

const readHomeScreenTipHidden = () => {
  try {
    return localStorage.getItem(HOME_SCREEN_TIP_HIDDEN_KEY) === 'true';
  } catch {
    return false;
  }
};

const PULL_REFRESH_START_ZONE = 96;
const PULL_REFRESH_THRESHOLD = 92;
const PULL_REFRESH_MAX = 128;

const isInteractiveTarget = (target) => {
  const tagName = target?.tagName?.toLowerCase();
  return tagName === 'button' || tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target?.isContentEditable;
};

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

  // M3: Profile state (birthDate-based)
  const [birthDate, setBirthDate] = useState(() => readProfile().birthDate || null);
  const [gender, setGender] = useState(() => readProfile().gender || '');
  const ageGroup = getAgeGroupFromBirthDate(birthDate);

  // M1: Accessibility state
  const [showAccessibility, setShowAccessibility] = useState(false);
  const [isStandalone, setIsStandalone] = useState(isStandaloneDisplay);
  const [installPromptEvent, setInstallPromptEvent] = useState(null);
  const [homeScreenTipHidden, setHomeScreenTipHidden] = useState(readHomeScreenTipHidden);
  const [homeScreenTipSessionHidden, setHomeScreenTipSessionHidden] = useState(false);
  const [resultBoundaryKey, setResultBoundaryKey] = useState(0);
  const [pullRefresh, setPullRefresh] = useState({ active: false, distance: 0, refreshing: false });

  useEffect(() => {
    const storedHistory = readHistory();
    const pendingResult = readPendingResult();

    setHistoryData(storedHistory);

    if (pendingResult) {
      setUserName(pendingResult.userName || '');
      setScores(pendingResult.scores || createEmptyScores());
      setQuestionContextSummary(pendingResult.questionContextSummary || null);
      setNeutralQuestionIds(Array.from({ length: pendingResult.neutralCount || 0 }, (_, index) => `pending-neutral-${index}`));
      setFollowupQuestions(Array.from({ length: pendingResult.followupCount || 0 }, (_, index) => ({ id: `pending-followup-${index}` })));
      setRecoverableSession(null);
      setShowRecoveryPrompt(false);
      setResultBoundaryKey((value) => value + 1);
      setStep('result');
      trackEvent('result_recovery_resume', {
        ageSeconds: Math.max(0, Math.round((Date.now() - Date.parse(pendingResult.savedAt || '')) / 1000))
      });
      return;
    }

    const savedSession = readActiveSession();
    if (savedSession && savedSession.questions?.length && savedSession.currIdx < savedSession.questions.length) {
      setRecoverableSession(savedSession);
      setShowRecoveryPrompt(true);
    }
  }, []);

  useEffect(() => {
    installGlobalErrorHandlers();
  }, []);

  // Apply accessibility settings on mount
  useEffect(() => {
    const settings = loadAccessibilitySettings();
    applyAccessibilitySettings(settings);
  }, []);

  useEffect(() => {
    const media = window.matchMedia?.('(display-mode: standalone)');
    const updateStandalone = () => setIsStandalone(isStandaloneDisplay());
    updateStandalone();

    media?.addEventListener?.('change', updateStandalone);
    media?.addListener?.(updateStandalone);

    return () => {
      media?.removeEventListener?.('change', updateStandalone);
      media?.removeListener?.(updateStandalone);
    };
  }, []);

  useEffect(() => {
    if (!isStandalone) return undefined;

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
  }, [isStandalone]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event) => {
      event.preventDefault();
      setInstallPromptEvent(event);
    };

    const handleAppInstalled = () => {
      try {
        localStorage.setItem(HOME_SCREEN_TIP_HIDDEN_KEY, 'true');
      } catch {}
      setHomeScreenTipHidden(true);
      setHomeScreenTipSessionHidden(true);
      setInstallPromptEvent(null);
      trackEvent('home_screen_app_installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  // Profile is stored locally only; analytics below never receives raw birthDate.
  useEffect(() => {
    if (birthDate || gender) {
      writeProfile({ birthDate, ageGroup, gender });
      return;
    }
    clearProfile();
  }, [birthDate, ageGroup, gender]);

  const handleClearProfile = () => {
    setBirthDate(null);
    setGender('');
    clearProfile();
    trackEvent('profile_clear');
  };

  const handleDismissHomeScreenTip = () => {
    setHomeScreenTipSessionHidden(true);
    trackEvent('home_screen_tip_dismiss');
  };

  const handleHideHomeScreenTipForever = () => {
    try {
      localStorage.setItem(HOME_SCREEN_TIP_HIDDEN_KEY, 'true');
    } catch {}
    setHomeScreenTipHidden(true);
    setHomeScreenTipSessionHidden(true);
    trackEvent('home_screen_tip_hide_forever');
  };

  const handleShowHomeScreenTipAgain = () => {
    try {
      localStorage.setItem(HOME_SCREEN_TIP_HIDDEN_KEY, 'false');
    } catch {}
    setHomeScreenTipHidden(false);
    setHomeScreenTipSessionHidden(false);
    trackEvent('home_screen_tip_restore');
  };

  const handleInstallApp = async () => {
    if (!installPromptEvent) return;
    installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;
    setInstallPromptEvent(null);
    trackEvent('home_screen_install_prompt', { outcome: choice?.outcome || '' });
    if (choice?.outcome === 'accepted') {
      try {
        localStorage.setItem(HOME_SCREEN_TIP_HIDDEN_KEY, 'true');
      } catch {}
      setHomeScreenTipHidden(true);
    }
    setHomeScreenTipSessionHidden(true);
  };

  const openHistoryModal = () => {
    trackEvent('history_open', { step });
    setShowHistory(true);
  };

  const handleRestart = () => {
    trackEvent('restart_click');
    clearActiveSession();
    clearPendingResult();
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
    trackEvent('start_click', {
      hasName: Boolean(trimmedName),
      hasProfile: Boolean(ageGroup || gender),
      ageGroup: ageGroup || '',
      hasGender: Boolean(gender)
    });

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
    const ok = window.confirm('이 브라우저에 저장된 이름, 프로필, 기록, 활동 리포트를 모두 지울까요?');
    if (!ok) return;

    clearAllLocalData();
    setUserName('');
    setBirthDate(null);
    setGender('');
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
    writePendingResult({
      scores: finalScores,
      userName,
      questionContextSummary: nextQuestionContextSummary,
      neutralCount: neutralQuestionIds.length,
      followupCount: followupQuestions.length,
      usedFollowup: questionPhase === 'followup' || followupQuestions.length > 0
    });
    trackEvent('complete_test', {
      usedFollowup: questionPhase === 'followup' || followupQuestions.length > 0,
      followupCount: followupQuestions.length,
      neutralCount: neutralQuestionIds.length,
      questionContextTop: nextQuestionContextSummary.topTag
    });
    setScores(finalScores);
    setLastAnswerSnapshot(null);
    transitionLockRef.current = false;
    setResultBoundaryKey((value) => value + 1);
    setStep('result');
  };

  const handleResultReady = () => {
    clearActiveSession();
    clearPendingResult();
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

  // M3: Get personalized tempo message
  const getTempoForCurrentQuestion = () => {
    if (questionPhase === 'followup') {
      return getFollowupTempoMessage(currIdx, followupQuestions.length);
    }
    const defaultMsg = getQuestionTempoMessage(currIdx, '지금의 결대로 가볍게 골라보세요', QUESTION_TEMPO_COPY);
    if (ageGroup) {
      return getPersonalizedTempoMessage(ageGroup, currIdx, defaultMsg);
    }
    return defaultMsg;
  };

  const showHomeScreenTip =
    step === 'start' &&
    (!isStandalone || localStorage.getItem(HOME_SCREEN_TIP_HIDDEN_KEY) === 'false') &&
    !homeScreenTipHidden &&
    !homeScreenTipSessionHidden;

  return (
    <div className={`relative w-full min-h-[100dvh] flex flex-col items-center ${step !== 'result' ? 'justify-center' : 'pt-10'}`}>
      {isStandalone && (pullRefresh.active || pullRefresh.refreshing) && (
        <div
          className="fixed left-1/2 top-3 z-[99998] flex -translate-x-1/2 items-center gap-2 rounded-full border border-cyan-200/20 bg-slate-950/85 px-4 py-2 text-[12px] font-black text-cyan-50 shadow-2xl backdrop-blur-xl transition-transform"
          style={{ transform: `translate(-50%, ${Math.max(0, pullRefresh.distance - 22)}px)` }}
        >
          <span className={`inline-block h-3 w-3 rounded-full border-2 border-cyan-100 border-t-transparent ${pullRefresh.refreshing ? 'animate-spin' : ''}`} />
          {pullRefresh.refreshing ? '새로고침 중' : pullRefresh.distance >= PULL_REFRESH_THRESHOLD ? '놓으면 새로고침' : '아래로 당겨 새로고침'}
        </div>
      )}
      <div className="fixed top-[-10%] left-[-10%] w-96 h-96 bg-purple-900 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-blob pointer-events-none"></div>
      <div className="fixed top-[20%] right-[-10%] w-96 h-96 bg-cyan-900 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-blob pointer-events-none" style={{ animationDelay: '2s' }}></div>
      <div className="fixed bottom-[-20%] left-[20%] w-96 h-96 bg-pink-900 rounded-full mix-blend-screen filter blur-[128px] opacity-40 animate-blob pointer-events-none" style={{ animationDelay: '4s' }}></div>

      <div
        className={`relative z-10 w-full max-w-md min-h-[100dvh] mx-auto flex flex-col items-center ${
          step === 'result' ? '' : 'justify-center'
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
              birthDate={birthDate}
              gender={gender}
              onChangeBirthDate={setBirthDate}
              onChangeGender={setGender}
              onClearProfile={handleClearProfile}
              onOpenAccessibility={() => setShowAccessibility(true)}
              onOpenVersion={openVersionModal}
              versionLabel={CHANGELOG[0].version}
              showHomeScreenTip={showHomeScreenTip}
              canInstallApp={Boolean(installPromptEvent)}
              onInstallApp={handleInstallApp}
              onDismissHomeScreenTip={handleDismissHomeScreenTip}
              onHideHomeScreenTipForever={handleHideHomeScreenTipForever}
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
              tempoMessage={getTempoForCurrentQuestion()}
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
            <ResultErrorBoundary key={`result-boundary-${resultBoundaryKey}`} onRestart={handleRestart}>
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
                  onResultReady={handleResultReady}
                  trackEvent={trackEvent}
                  neutralCount={neutralQuestionIds.length}
                  usedFollowup={followupQuestions.length > 0}
                  questionContextSummary={questionContextSummary}
                  ageGroup={ageGroup}
                  gender={gender}
                />
              </Suspense>
            </ResultErrorBoundary>
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

        <AnimatePresence>
          {showAccessibility && (
            <Suspense fallback={null}>
              <AccessibilitySettings
                isOpen={showAccessibility}
                onClose={() => setShowAccessibility(false)}
                homeScreenTipHidden={homeScreenTipHidden}
                onShowHomeScreenTipAgain={handleShowHomeScreenTipAgain}
              />
            </Suspense>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
