import { Component, lazy, Suspense, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import StartView from './components/StartView.jsx';
import QuestionView from './components/QuestionView.jsx';
import PullToRefreshIndicator from './components/PullToRefreshIndicator.jsx';
import { AXIS_GUIDE, CHANGELOG, DEFAULT_USERNAME } from './lib/constants.js';
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
  createHomeScreenMigrationText,
  importHomeScreenMigrationText,
  trackEvent,
  writePendingResult,
  writeProfile,
  writeRecentSessions,
  writeUserName
} from './lib/storage.js';
import { captureError, installGlobalErrorHandlers } from './lib/observability.js';
import { getHistoryComparison, getHistoryEntryNote, getHistoryInsights } from './lib/historyAnalysis.js';
import { useSessionFlow } from './hooks/useSessionFlow.js';
import {
  completeServerSession,
  startServerSession
} from './lib/serverSession.js';
import { validateServerDisplayModel } from './lib/serverDisplayModel.js';
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
const readMockPremiumFlag = () => {
  if (!import.meta.env.DEV) return false;
  try {
    return localStorage.getItem('mbti_mock_premium') === 'true';
  } catch {
    return false;
  }
};
import { getAgeGroupFromBirthDate } from './lib/profileAge.js';

const retryImport = (loader, retries = 1) =>
  loader().catch((error) => {
    if (retries <= 0) throw error;
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        retryImport(loader, retries - 1).then(resolve).catch(reject);
      }, 450);
    });
  });

let resultViewPreloadPromise = null;
const imagePreloadPromises = new Map();

const loadResultViewModule = () => {
  if (!resultViewPreloadPromise) {
    resultViewPreloadPromise = retryImport(() => import('./components/ResultView.jsx'), 3).catch((error) => {
      resultViewPreloadPromise = null;
      throw error;
    });
  }

  return resultViewPreloadPromise;
};

const preloadResultView = () => loadResultViewModule();

const preloadImage = (src) => {
  if (!src || typeof Image === 'undefined') return Promise.resolve();
  if (imagePreloadPromises.has(src)) return imagePreloadPromises.get(src);

  const preloadPromise = new Promise((resolve, reject) => {
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => {
      if (typeof image.decode !== 'function') {
        resolve();
        return;
      }

      image.decode().catch(() => undefined).finally(resolve);
    };
    image.onerror = () => reject(new Error(`image_preload_failed:${src}`));
    image.src = src;
  }).catch((error) => {
    imagePreloadPromises.delete(src);
    throw error;
  });

  imagePreloadPromises.set(src, preloadPromise);
  return preloadPromise;
};

const ResultView = lazy(loadResultViewModule);
const HistoryModal = lazy(() => import('./components/HistoryModal.jsx'));
const VersionModal = lazy(() => import('./components/VersionModal.jsx'));
const AxisGuideModal = lazy(() => import('./components/AxisGuideModal.jsx'));
const AccessibilitySettings = lazy(() => import('./components/AccessibilitySettings.jsx'));
import BootSplashScreen from './components/BootSplashScreen.jsx';

const ANALYSIS_DURATION_MS = 2800;
const ANALYSIS_CHARACTER_SRC = '/brand-character-v173.png';
const SERVER_MIDDLE_OPTION_ID = 'middle';
const QUESTION_TRANSITION_DELAY_MS = 420;
const ANALYSIS_STEPS = [
  '답변 흐름 확인 중',
  '성향 축 정리 중',
  '오늘의 결과 준비 중'
];
const ANALYSIS_GUIDE = '브랜드 안내자가 결과 화면으로 넘어가기 전 흐름을 정돈하는 중이에요';

const preloadAnalysisCharacter = () => preloadImage(ANALYSIS_CHARACTER_SRC).catch((error) => {
  captureError(error, {
    key: 'analysis_character_preload_error',
    stage: 'analysis_character_preload'
  });
});

const getResultCharacterSrc = (displayModel = null) => displayModel?.spirit?.asset || '';

const preloadResultAssets = async (displayModel = null) => {
  const characterSrc = getResultCharacterSrc(displayModel);
  const results = await Promise.allSettled([preloadResultView(), preloadImage(characterSrc)]);
  const failure = results.find((result) => result.status === 'rejected');
  if (failure) throw failure.reason;
};

const scoresFromServerResult = (result = {}) => {
  const nextScores = {};
  (result.spectrum || []).forEach((axis) => {
    if (axis.left) nextScores[axis.left] = Number(axis.leftScore) || 0;
    if (axis.right) nextScores[axis.right] = Number(axis.rightScore) || 0;
  });
  return nextScores;
};

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

function AnalysisView() {
  return (
    <motion.div
      key="analysis"
      initial={{ opacity: 0, y: 18, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -18, scale: 0.98 }}
      transition={{ duration: 0.32, ease: 'easeOut' }}
      className="w-full max-w-sm px-6 py-10"
    >
      <div className="relative overflow-hidden rounded-[2rem] border border-white/[0.12] bg-slate-950/74 px-5 py-8 text-center shadow-[0_26px_80px_rgba(15,23,42,0.46)] backdrop-blur-2xl">
        <div className="absolute left-1/2 top-[-104px] h-48 w-48 -translate-x-1/2 rounded-full bg-cyan-400/18 blur-3xl" />
        <div className="absolute bottom-[-112px] right-[-76px] h-56 w-56 rounded-full bg-fuchsia-400/14 blur-3xl" />
        <div className="absolute inset-x-6 top-6 h-px bg-gradient-to-r from-transparent via-white/18 to-transparent" />

        <div className="relative mx-auto h-24 w-24">
          <div className="absolute inset-2 rounded-full bg-cyan-300/16 blur-2xl" aria-hidden="true" />
          <img
            src={ANALYSIS_CHARACTER_SRC}
            alt="오늘의 MBTI 안내 캐릭터"
            width={512}
            height={512}
            decoding="async"
            fetchPriority="high"
            className="relative h-full w-full rounded-full object-contain"
          />
        </div>

        <p className="relative mt-5 text-[11px] font-black uppercase tracking-[0.18em] text-cyan-100/80">결과 준비</p>
        <h2 className="relative mt-3 text-[23px] font-black leading-tight text-white break-keep">
          방금 고른 선택들로 지금의 성향을 정리하고 있어요
        </h2>
        <p className="relative mt-3 text-[13px] font-semibold leading-relaxed text-slate-300 break-keep">
          {ANALYSIS_GUIDE}
        </p>

        <div className="relative mt-7">
          <div className="h-3 overflow-hidden rounded-full border border-white/10 bg-white/[0.06]" aria-label="결과 준비 진행 중">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-300 via-brand to-pink-300 shadow-[0_0_24px_rgba(34,211,238,0.45)]"
              initial={{ width: '6%' }}
              animate={{ width: '100%' }}
              transition={{ duration: ANALYSIS_DURATION_MS / 1000, ease: 'easeInOut' }}
            />
          </div>
          <div className="mt-5 grid grid-cols-1 gap-2 text-left">
            {ANALYSIS_STEPS.map((label, index) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-3 py-2.5 text-[11px] font-black text-slate-200 break-keep"
              >
                <span
                  className={`h-2 w-2 shrink-0 rounded-full ${
                    index === ANALYSIS_STEPS.length - 1 ? 'bg-pink-200/90' : 'bg-cyan-200/90'
                  }`}
                  aria-hidden="true"
                />
                {label}
              </div>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

const HOME_SCREEN_TIP_HIDDEN_KEY = 'mbti_home_screen_tip_hidden_icon_refresh_v1';

const isStandaloneDisplay = () => {
  if (typeof window === 'undefined') return false;
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator?.standalone === true;
};

const getSessionApiEventMeta = () => {
  const standaloneDisplay = isStandaloneDisplay();
  return {
    standalone_display: standaloneDisplay,
    display_mode: standaloneDisplay ? 'standalone' : 'browser'
  };
};

const isAppleMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  const userAgent = window.navigator?.userAgent || '';
  const platform = window.navigator?.platform || '';
  return /iPad|iPhone|iPod/i.test(userAgent) || (platform === 'MacIntel' && window.navigator?.maxTouchPoints > 1);
};

const shouldShowBootSplash = () => !isStandaloneDisplay() || isAppleMobileDevice();

const getStartErrorMessage = (error) => {
  if (error?.name === 'AbortError') {
    return '문항 준비가 평소보다 오래 걸리고 있어요. 연결을 확인한 뒤 다시 시도해주세요.';
  }
  if (error?.message === 'invalid_server_session_start' || error?.message === 'disabled') {
    return '지금은 문항을 준비할 수 없어요. 잠시 후 다시 시도해주세요.';
  }
  return '연결이 잠시 끊겼어요. 다시 시도하면 이어서 시작할 수 있어요.';
};

const sanitizeRecentSessions = (sessions) => (Array.isArray(sessions) ? sessions : []).slice(0, 12).map((session) => ({
  ids: Array.isArray(session?.ids) ? session.ids.slice(0, 24).map(String) : [],
  ageGroup: typeof session?.ageGroup === 'string' ? session.ageGroup : '',
  savedAt: typeof session?.savedAt === 'string' ? session.savedAt : ''
}));

const readHomeScreenTipHidden = () => {
  try {
    return localStorage.getItem(HOME_SCREEN_TIP_HIDDEN_KEY) === 'true';
  } catch {
    return false;
  }
};

const copyTextToClipboard = async (text) => {
  if (!text) return false;

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall back below for Safari/iOS contexts that block the async clipboard API.
    }
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.left = '-1000px';
    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();
    textarea.setSelectionRange(0, textarea.value.length);
    const copied = document.execCommand('copy');
    document.body.removeChild(textarea);
    return copied;
  } catch {
    return false;
  }
};

export default function App() {
  const [step, setStep] = useState('start');
  const [userName, setUserName] = useState(readUserName());
  const [showHistory, setShowHistory] = useState(false);
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [axisGuideKey, setAxisGuideKey] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [isPremiumUser] = useState(readMockPremiumFlag);
  const {
    questions,
    setQuestions,
    followupQuestions,
    setFollowupQuestions,
    currIdx,
    setCurrIdx,
    scores,
    setScores,
    microCopy,
    setMicroCopy,
    isTransitioning,
    setIsTransitioning,
    questionDirection,
    setQuestionDirection,
    questionPhase,
    setQuestionPhase,
    recentSessionsSnapshot,
    setRecentSessionsSnapshot,
    sessionQuestionIds,
    setSessionQuestionIds,
    questionContextSummary,
    setQuestionContextSummary,
    lastAnswerSnapshot,
    setLastAnswerSnapshot,
    transitionLockRef,
    activeQuestion
  } = useSessionFlow();
  const [serverSessionActive, setServerSessionActive] = useState(false);
  const [serverSessionToken, setServerSessionToken] = useState('');
  const [serverSessionAnswers, setServerSessionAnswers] = useState([]);
  const [serverResultDisplayModel, setServerResultDisplayModel] = useState(null);
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [startError, setStartError] = useState('');
  const [neutralCount, setNeutralCount] = useState(0);
  const [usedFollowup, setUsedFollowup] = useState(false);

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
  const [homeScreenMigrationStatus, setHomeScreenMigrationStatus] = useState('');
  const [homeScreenMigrationText, setHomeScreenMigrationText] = useState('');
  const [resultBoundaryKey, setResultBoundaryKey] = useState(0);
  const [isBooting, setIsBooting] = useState(shouldShowBootSplash);

  useEffect(() => {
    if (!shouldShowBootSplash()) return undefined;

    const timer = setTimeout(() => {
      setIsBooting(false);
    }, 1600);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const storedHistory = readHistory();
    const pendingResult = readPendingResult();

    setHistoryData(storedHistory);

    if (pendingResult) {
      try {
        validateServerDisplayModel(pendingResult.displayModel);
      } catch (error) {
        clearPendingResult();
        captureError(error, {
          key: 'legacy_pending_result_incompatible',
          stage: 'result_recovery'
        });
        trackEvent('result_recovery_incompatible', { reason: error?.message || 'invalid_display_model' });
        if (readActiveSession()) {
          clearActiveSession();
          trackEvent('session_recovery_incompatible');
        }
        setStartError('이전 결과는 새 보안 방식과 호환되지 않아 정리했어요. 기록과 프로필은 그대로예요.');
        return;
      }

      preloadResultAssets(pendingResult.displayModel).catch((error) => {
        captureError(error, {
          key: 'result_screen_preload_error',
          stage: 'result_recovery_preload'
        });
      });
      setUserName(pendingResult.userName || '');
      setScores(scoresFromServerResult(pendingResult.displayModel));
      setQuestionContextSummary(pendingResult.displayModel.questionContextSummary || null);
      setServerResultDisplayModel(pendingResult.displayModel);
      setNeutralCount(Number(pendingResult.displayModel.neutralCount) || 0);
      setUsedFollowup(Boolean(pendingResult.displayModel.usedFollowup));
      setResultBoundaryKey((value) => value + 1);
      setStep('result');
      trackEvent('result_recovery_resume', {
        ageSeconds: Math.max(0, Math.round((Date.now() - Date.parse(pendingResult.savedAt || '')) / 1000))
      });
      return;
    }

    const savedSession = readActiveSession();
    if (savedSession) {
      clearActiveSession();
      setStartError('진행 중이던 이전 검사는 새 보안 방식과 호환되지 않아 다시 시작해야 해요.');
      trackEvent('session_recovery_incompatible');
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
    if (!isStandaloneDisplay()) return;
    trackEvent('home_screen_standalone_open', {
      mode: window.navigator?.standalone === true ? 'ios_standalone' : 'standalone',
      host: window.location.host
    });
  }, []);

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

  const handleCopyHomeScreenMigration = async () => {
    const text = createHomeScreenMigrationText();
    if (!text) {
      setHomeScreenMigrationStatus('no_data');
      trackEvent('home_screen_migration_copy', { status: 'failed', reason: 'empty_payload' });
      return;
    }

    const copied = await copyTextToClipboard(text);
    if (copied) {
      setHomeScreenMigrationText('');
      setHomeScreenMigrationStatus('copied');
      trackEvent('home_screen_migration_copy', { status: 'copied' });
      return;
    }

    setHomeScreenMigrationText(text);
    setHomeScreenMigrationStatus('manual_copy');
    trackEvent('home_screen_migration_copy', { status: 'manual_copy', reason: 'copy_blocked' });
  };

  const handleImportHomeScreenMigration = async () => {
    let text = '';

    if (navigator.clipboard?.readText) {
      try {
        text = await navigator.clipboard.readText();
      } catch {
        text = '';
      }
    }

    if (!text) {
      text = window.prompt('브라우저에서 복사한 기록을 여기에 붙여넣어 주세요.') || '';
    }

    if (!text) {
      setHomeScreenMigrationStatus('import_failed');
      trackEvent('home_screen_migration_import', { status: 'failed', reason: 'empty_clipboard' });
      return;
    }

    try {
      const imported = importHomeScreenMigrationText(text);
      setHomeScreenMigrationStatus(imported ? 'imported' : 'import_failed');
      trackEvent('home_screen_migration_import', { status: imported ? 'imported' : 'failed' });
      if (imported) {
        setUserName(readUserName());
        setBirthDate(readProfile().birthDate || null);
        setGender(readProfile().gender || '');
        setHistoryData(readHistory());
      }
    } catch {
      setHomeScreenMigrationStatus('import_failed');
      trackEvent('home_screen_migration_import', { status: 'failed', reason: 'read_error' });
    }
  };

  const openHistoryModal = () => {
    trackEvent('history_open', { step });
    setShowHistory(true);
  };

  const handleRestart = () => {
    trackEvent('restart_click');
    clearActiveSession();
    clearPendingResult();
    setServerResultDisplayModel(null);
    setFollowupQuestions([]);
    setQuestionPhase('base');
    setSessionQuestionIds([]);
    setNeutralCount(0);
    setUsedFollowup(false);
    setQuestionContextSummary(null);
    setLastAnswerSnapshot(null);
    setServerSessionActive(false);
    setServerSessionToken('');
    setServerSessionAnswers([]);
    setIsStartingSession(false);
    setStartError('');
    transitionLockRef.current = false;
    setStep('start');
  };

  const startServerBackedSession = async ({ trimmedName, recentSessions, startedAt }) => {
    const session = await startServerSession({ recentSessions, ageGroup, gender });
    if (!session?.sessionToken || !Array.isArray(session.questions) || !session.questions.length) {
      throw new Error('invalid_server_session_start');
    }

    const thisSession = session.questions.map((question) => question.id);

    setServerSessionActive(true);
    setServerSessionToken(session.sessionToken);
    setServerSessionAnswers([]);
    setServerResultDisplayModel(null);
    setQuestions(session.questions);
    setFollowupQuestions([]);
    setScores({});
    setCurrIdx(0);
    setMicroCopy('');
    setQuestionDirection(1);
    setQuestionPhase('base');
    setRecentSessionsSnapshot(recentSessions);
    setSessionQuestionIds(thisSession);
    setNeutralCount(0);
    setUsedFollowup(false);
    setQuestionContextSummary(null);
    setLastAnswerSnapshot(null);
    transitionLockRef.current = false;
    setStep('question');
    preloadAnalysisCharacter();
    trackEvent('session_api_start_ok', {
      ...getSessionApiEventMeta(),
      durationMs: Math.round(performance.now() - startedAt),
      questionCount: session.questions.length
    });
  };

  const handleStart = async () => {
    if (isStartingSession) return;
    const startedAt = performance.now();
    const isRetry = Boolean(startError);
    setIsStartingSession(true);
    setStartError('');

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }

    try {
      const trimmedName = userName.trim();
      writeUserName(trimmedName);
      trackEvent('start_click', {
        hasName: Boolean(trimmedName),
        hasProfile: Boolean(ageGroup || gender),
        ageGroup: ageGroup || '',
        hasGender: Boolean(gender)
      });
      if (isRetry) trackEvent('session_api_retry', { stage: 'start' });

      const recentSessions = sanitizeRecentSessions(readRecentSessions());
      writeRecentSessions(recentSessions);

      await startServerBackedSession({ trimmedName, recentSessions, startedAt });
    } catch (error) {
      captureError(error, {
        key: 'session_api_start_error',
        stage: 'session_start'
      });
      trackEvent('session_api_error', {
        ...getSessionApiEventMeta(),
        stage: 'start',
        durationMs: Math.round(performance.now() - startedAt),
        reason: error?.message || 'unknown'
      });
      setStartError(getStartErrorMessage(error));
    } finally {
      setIsStartingSession(false);
    }
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
    setShowHistory(false);
    setLastAnswerSnapshot(null);
    transitionLockRef.current = false;
  };

  const finishServerSession = (serverResult, meta = {}) => {
    const nextDisplayModel = validateServerDisplayModel(serverResult.displayModel);
    const finalScores = scoresFromServerResult(nextDisplayModel);
    const nextQuestionContextSummary = nextDisplayModel.questionContextSummary || null;
    const sessionSnapshot = serverResult.recentSessionSnapshot;

    setQuestionContextSummary(nextQuestionContextSummary);
    if (sessionSnapshot?.ids?.length) {
      writeRecentSessions([sessionSnapshot, ...recentSessionsSnapshot].slice(0, 12));
    }
    writePendingResult({
      userName,
      displayModel: nextDisplayModel
    });
    trackEvent('complete_test', {
      usedFollowup: Boolean(serverResult.usedFollowup),
      followupCount: Number(serverResult.followupCount) || 0,
      neutralCount: serverResult.neutralCount || 0,
      questionContextTop: nextQuestionContextSummary?.topTag || ''
    });
    trackEvent('session_api_complete_ok', {
      ...getSessionApiEventMeta(),
      ...meta,
      status: 'complete',
      usedFollowup: Boolean(serverResult.usedFollowup)
    });
    setScores(finalScores);
    setNeutralCount(Number(serverResult.neutralCount) || 0);
    setUsedFollowup(Boolean(serverResult.usedFollowup));
    setServerResultDisplayModel(nextDisplayModel);
    setServerSessionActive(false);
    setServerSessionToken('');
    setServerSessionAnswers([]);
    setLastAnswerSnapshot(null);
    transitionLockRef.current = false;
    setResultBoundaryKey((value) => value + 1);
    trackEvent('analysis_view', {
      questionContextTop: nextQuestionContextSummary?.topTag || ''
    });
    preloadResultAssets(nextDisplayModel).catch((error) => {
      captureError(error, {
        key: 'result_screen_preload_error',
        stage: 'result_preload'
      });
    });
    setStep('analysis');
  };

  const restoreServerQuestionSnapshot = (snapshot, { microText = '', trackBack = false } = {}) => {
    if (!snapshot?.serverSession) return false;

    setUserName(snapshot.userName || '');
    setQuestions(snapshot.questions || []);
    setFollowupQuestions(snapshot.followupQuestions || []);
    setCurrIdx(snapshot.currIdx || 0);
    setQuestionPhase(snapshot.questionPhase || 'base');
    setRecentSessionsSnapshot(snapshot.recentSessions || []);
    setSessionQuestionIds(snapshot.sessionQuestionIds || []);
    setQuestionContextSummary(snapshot.questionContextSummary || null);
    setNeutralCount(Number(snapshot.neutralCount) || 0);
    setUsedFollowup(Boolean(snapshot.usedFollowup));
    setServerSessionActive(Boolean(snapshot.serverSessionActive));
    setServerSessionToken(snapshot.serverSessionToken || '');
    setServerSessionAnswers(snapshot.serverSessionAnswers || []);
    setMicroCopy(microText);
    setQuestionDirection(-1);
    setStep('question');
    setLastAnswerSnapshot(null);
    transitionLockRef.current = false;

    if (trackBack) {
      const restoredQuestions = snapshot.questionPhase === 'followup'
        ? snapshot.followupQuestions || []
        : snapshot.questions || [];
      const restoredQuestion = restoredQuestions[snapshot.currIdx || 0];
      trackEvent('question_back', {
        phase: snapshot.questionPhase || 'base',
        questionId: restoredQuestion?.id || '',
        index: (snapshot.currIdx || 0) + 1,
        mode: 'server_session'
      });
    }

    return true;
  };

  const completeServerPhase = async ({ answers, recoverySnapshot }) => {
    const startedAt = performance.now();
    const phase = questionPhase;

    try {
      const response = await completeServerSession({
        sessionToken: serverSessionToken,
        answers,
        historyData,
        userName,
        defaultUserName: DEFAULT_USERNAME
      });

      if (response.status === 'needs_followup') {
        const responseQuestions = response.questions || [];
        const nextSessionIds = [...sessionQuestionIds, ...responseQuestions.map((question) => question.id)];
        setServerSessionToken(response.sessionToken || '');
        setServerSessionAnswers([]);
        setFollowupQuestions(responseQuestions);
        setQuestionPhase('followup');
        setUsedFollowup(true);
        setCurrIdx(0);
        setSessionQuestionIds(nextSessionIds);
        trackEvent('followup_start', {
          count: responseQuestions.length,
          neutralCount
        });
        trackEvent('session_api_complete_ok', {
          ...getSessionApiEventMeta(),
          status: 'needs_followup',
          phase,
          durationMs: Math.round(performance.now() - startedAt),
          followupCount: responseQuestions.length
        });
        return;
      }

      if (response.status === 'complete' && response.result) {
        finishServerSession(response.result, {
          phase,
          durationMs: Math.round(performance.now() - startedAt)
        });
        return;
      }

      throw new Error('invalid_server_session_complete');
    } catch (error) {
      captureError(error, {
        key: 'session_api_complete_error',
        stage: 'session_complete'
      });
      trackEvent('session_api_error', {
        ...getSessionApiEventMeta(),
        stage: 'complete',
        phase,
        durationMs: Math.round(performance.now() - startedAt),
        reason: error?.message || 'unknown'
      });
      restoreServerQuestionSnapshot(recoverySnapshot, {
        microText: '연결이 잠시 끊겼어요. 마지막 답변을 다시 골라주세요'
      });
    }
  };

  const createServerQuestionSnapshot = () => ({
    serverSession: true,
    userName,
    questions,
    followupQuestions,
    currIdx,
    questionPhase,
    recentSessions: recentSessionsSnapshot,
    sessionQuestionIds,
    neutralCount,
    usedFollowup,
    questionContextSummary,
    serverSessionActive,
    serverSessionToken,
    serverSessionAnswers
  });

  const handleServerQuestionBack = () => {
    if (!lastAnswerSnapshot?.serverSession || isTransitioning || transitionLockRef.current) return;
    restoreServerQuestionSnapshot(lastAnswerSnapshot, { trackBack: true });
  };

  const handleServerAnswer = (optionId, method = 'tap') => {
    if (!serverSessionActive || isTransitioning || transitionLockRef.current) return;
    transitionLockRef.current = true;
    setIsTransitioning(true);
    const recoverySnapshot = createServerQuestionSnapshot();
    setLastAnswerSnapshot(recoverySnapshot);
    setMicroCopy('');
    setQuestionDirection(method?.includes('left') ? -1 : 1);
    trackEvent('question_answer', {
      method,
      phase: questionPhase,
      questionId: activeQuestion?.id || '',
      axis: '',
      index: currIdx + 1
    });

    const selectedOption = activeQuestion?.options?.find((option) => option.id === optionId);
    const microText = optionId === SERVER_MIDDLE_OPTION_ID
      ? activeQuestion?.ui?.middleMicroCopy || '이 부분은 서버에서 한 번 더 확인할게요'
      : selectedOption?.micro || '';
    const nextAnswers = [
      ...serverSessionAnswers,
      {
        questionId: activeQuestion.id,
        optionId
      }
    ];

    setServerSessionAnswers(nextAnswers);
    if (optionId === SERVER_MIDDLE_OPTION_ID) setNeutralCount((value) => value + 1);
    setMicroCopy(microText);

    setTimeout(() => {
      setMicroCopy('');
      const activeTotal = questionPhase === 'followup' ? followupQuestions.length : questions.length;
      if (currIdx + 1 >= activeTotal) {
        completeServerPhase({
          answers: nextAnswers,
          recoverySnapshot
        }).finally(() => {
          transitionLockRef.current = false;
          setIsTransitioning(false);
        });
        return;
      }

      const nextIdx = currIdx + 1;
      if (questionPhase === 'base') {
        if (nextIdx === 3) trackEvent('question_reach_3');
        if (nextIdx === 6) trackEvent('question_reach_6');
        if (nextIdx === 9) trackEvent('question_reach_9');
      }
      setCurrIdx(nextIdx);
      transitionLockRef.current = false;
      setIsTransitioning(false);
    }, QUESTION_TRANSITION_DELAY_MS);
  };

  useEffect(() => {
    if (step !== 'analysis') return undefined;

    const timer = window.setTimeout(() => {
      trackEvent('analysis_complete');
      setStep('result');
    }, ANALYSIS_DURATION_MS);

    return () => window.clearTimeout(timer);
  }, [step]);

  const handleResultReady = () => {
    clearActiveSession();
    clearPendingResult();
  };

  const activeQuestionContextVisual = activeQuestion?.ui?.contextVisual || null;
  const activeQuestionTotal = questionPhase === 'followup' ? followupQuestions.length : questions.length;
  const isWaitingForServerPhase = serverSessionActive
    && isTransitioning
    && activeQuestionTotal > 0
    && currIdx + 1 >= activeQuestionTotal;
  const serverTransitionMessage = isWaitingForServerPhase
    ? questionPhase === 'followup'
      ? '결과를 준비하고 있어요'
      : '다음 흐름을 확인하고 있어요'
    : '';
  const questionPhaseHint = activeQuestion?.ui?.phaseHint || '';

  const showHomeScreenTip =
    step === 'start' &&
    !homeScreenTipHidden &&
    !homeScreenTipSessionHidden;
  const ambientBlobMotionClass = step === 'question' ? '' : 'animate-blob';

  return (
    <div className={`relative w-full min-h-[100dvh] flex flex-col items-center ${step !== 'result' ? 'justify-center' : 'pt-10'}`}>
      <PullToRefreshIndicator enabled={isStandalone} />
      <div className={`fixed top-[-10%] left-[-10%] w-96 h-96 bg-purple-900 rounded-full mix-blend-screen filter blur-[128px] opacity-40 pointer-events-none ${ambientBlobMotionClass}`}></div>
      <div className={`fixed top-[20%] right-[-10%] w-96 h-96 bg-cyan-900 rounded-full mix-blend-screen filter blur-[128px] opacity-40 pointer-events-none ${ambientBlobMotionClass}`} style={{ animationDelay: '2s' }}></div>
      <div className={`fixed bottom-[-20%] left-[20%] w-96 h-96 bg-pink-900 rounded-full mix-blend-screen filter blur-[128px] opacity-40 pointer-events-none ${ambientBlobMotionClass}`} style={{ animationDelay: '4s' }}></div>

      <div
        className={`relative z-10 w-full max-w-md min-h-[100dvh] mx-auto flex flex-col items-center ${
          step === 'result' ? '' : 'justify-center'
        }`}
      >
        <AnimatePresence mode="wait">
          {isBooting && <BootSplashScreen key="boot-splash" />}
          {!isBooting && step === 'start' && (
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
              isStandalone={isStandalone}
              canInstallApp={Boolean(installPromptEvent)}
              onInstallApp={handleInstallApp}
              onCopyHomeScreenMigration={handleCopyHomeScreenMigration}
              onImportHomeScreenMigration={handleImportHomeScreenMigration}
              homeScreenMigrationStatus={homeScreenMigrationStatus}
              homeScreenMigrationText={homeScreenMigrationText}
              onDismissHomeScreenTip={handleDismissHomeScreenTip}
              onHideHomeScreenTipForever={handleHideHomeScreenTipForever}
              isStarting={isStartingSession}
              startError={startError}
            />
          )}

          {!isBooting && step === 'question' && activeQuestion && (
            <QuestionView
              key={`question-${questionPhase}-${currIdx}`}
              currIdx={currIdx}
              totalQuestions={questionPhase === 'followup' ? followupQuestions.length : 12}
              question={activeQuestion}
              microCopy={microCopy}
              isTransitioning={isTransitioning}
              transitionMessage={serverTransitionMessage}
              questionDirection={questionDirection}
              tempoMessage={activeQuestion.ui?.tempoMessage || ''}
              phaseHint={questionPhaseHint}
              phase={questionPhase}
              questionLabel={questionPhase === 'followup' ? `보정 ${currIdx + 1}` : undefined}
              counterText={
                questionPhase === 'followup'
                  ? `보정 질문 ${currIdx + 1} / ${followupQuestions.length}`
                  : undefined
              }
              showMiddleOption={questionPhase === 'base' && Boolean(activeQuestion.allowMiddle)}
              middleLabel="둘 다 비슷해요"
              contextVisual={activeQuestionContextVisual}
              canGoBack={Boolean(lastAnswerSnapshot?.serverSession)}
              onAnswer={(option, method) => handleServerAnswer(option.id, method)}
              onMiddleAnswer={(method) => handleServerAnswer(SERVER_MIDDLE_OPTION_ID, method)}
              onBack={handleServerQuestionBack}
            />
          )}

          {step === 'analysis' && <AnalysisView key="analysis" />}

          {step === 'result' && (
            <ResultErrorBoundary key={`result-boundary-${resultBoundaryKey}`} onRestart={handleRestart}>
              <Suspense fallback={ScreenFallback}>
                <ResultView
                  key="result"
                  scores={scores}
                  historyData={historyData}
                  setHistoryData={setHistoryData}
                  openHistoryModal={openHistoryModal}
                  onRestart={handleRestart}
                  onOpenAxisGuide={setAxisGuideKey}
                  onResultReady={handleResultReady}
                  trackEvent={trackEvent}
                  serverDisplayModel={serverResultDisplayModel}
                  ageGroup={ageGroup}
                  gender={gender}
                />
              </Suspense>
            </ResultErrorBoundary>
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
                isPremiumUser={isPremiumUser}
                getHistoryEntryNote={getHistoryEntryNote}
                trackEvent={trackEvent}
                onStartTest={() => {
                  setShowHistory(false);
                  handleStart();
                }}
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
