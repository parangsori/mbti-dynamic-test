import { useEffect, useState } from 'react';
import { AnimatePresence } from 'framer-motion';
import StartView from './components/StartView.jsx';
import QuestionView from './components/QuestionView.jsx';
import ResultView from './components/ResultView.jsx';
import RecoveryPrompt from './components/RecoveryPrompt.jsx';
import HistoryModal from './components/HistoryModal.jsx';
import VersionModal from './components/VersionModal.jsx';
import AxisGuideModal from './components/AxisGuideModal.jsx';
import { AXIS_GUIDE, CHANGELOG, DEFAULT_USERNAME, QUESTION_TEMPO_COPY } from './lib/constants.js';
import { buildQuestionSession, createEmptyScores, getQuestionTempoMessage } from './lib/questionFlow.js';
import {
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
import { getHistoryComparison, getHistoryEntryNote, getHistoryInsights } from './lib/resultAnalysis.js';

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
  const [currIdx, setCurrIdx] = useState(0);
  const [scores, setScores] = useState(createEmptyScores());
  const [microCopy, setMicroCopy] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [questionDirection, setQuestionDirection] = useState(1);

  useEffect(() => {
    setHistoryData(readHistory());
    const savedSession = readActiveSession();
    if (savedSession && savedSession.questions?.length && savedSession.currIdx < savedSession.questions.length) {
      setRecoverableSession(savedSession);
      setShowRecoveryPrompt(true);
    }
  }, []);

  const openHistoryModal = () => {
    trackEvent('history_open', { step });
    setShowHistory(true);
  };

  const handleRestart = () => {
    trackEvent('restart_click');
    clearActiveSession();
    setStep('start');
  };

  const handleStart = () => {
    const trimmedName = userName.trim();
    writeUserName(trimmedName);
    trackEvent('start_click', { hasName: Boolean(trimmedName) });

    const recentSessions = readRecentSessions();
    const sessionQuestions = buildQuestionSession(recentSessions);
    const thisSession = sessionQuestions.map((question) => question.id);
    writeRecentSessions([thisSession, ...recentSessions].slice(0, 3));

    setQuestions(sessionQuestions);
    setScores(createEmptyScores());
    setCurrIdx(0);
    setMicroCopy('');
    setQuestionDirection(1);
    setStep('question');

    writeActiveSession({
      userName: trimmedName,
      questions: sessionQuestions,
      currIdx: 0,
      scores: createEmptyScores()
    });
  };

  const handleResumeSession = () => {
    if (!recoverableSession) return;
    setUserName(recoverableSession.userName || '');
    setQuestions(recoverableSession.questions || []);
    setCurrIdx(recoverableSession.currIdx || 0);
    setScores(recoverableSession.scores || createEmptyScores());
    setMicroCopy('');
    setQuestionDirection(1);
    setShowRecoveryPrompt(false);
    setStep('question');
    trackEvent('session_resume');
  };

  const dismissRecovery = () => {
    clearActiveSession();
    setRecoverableSession(null);
    setShowRecoveryPrompt(false);
    trackEvent('session_discard');
  };

  const handleAnswer = (option) => {
    if (isTransitioning) return;
    setIsTransitioning(true);

    const currentQuestion = questions[currIdx];
    const weight = currentQuestion?.weight || 1;
    const nextScores = { ...scores, [option.type]: (scores[option.type] || 0) + weight };
    setScores(nextScores);
    setMicroCopy(option.micro);
    setQuestionDirection(1);

    setTimeout(() => {
      setMicroCopy('');
      if (currIdx + 1 >= 12) {
        trackEvent('complete_test');
        clearActiveSession();
        setStep('result');
      } else {
        const nextIdx = currIdx + 1;
        setCurrIdx(nextIdx);
        writeActiveSession({
          userName,
          questions,
          currIdx: nextIdx,
          scores: nextScores
        });
      }
      setIsTransitioning(false);
    }, 800);
  };

  const latestHistoryComparison = getHistoryComparison(historyData[0]?.mbti || '', historyData);
  const latestHistoryInsights = getHistoryInsights(historyData);

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
              hasHistory={historyData.length > 0}
              onOpenHistory={openHistoryModal}
            />
          )}

          {step === 'question' && questions[currIdx] && (
            <QuestionView
              key="question"
              currIdx={currIdx}
              totalQuestions={12}
              question={questions[currIdx]}
              microCopy={microCopy}
              isTransitioning={isTransitioning}
              questionDirection={questionDirection}
              tempoMessage={getQuestionTempoMessage(currIdx, '지금의 결대로 가볍게 골라보세요', QUESTION_TEMPO_COPY)}
              onAnswer={handleAnswer}
            />
          )}

          {step === 'result' && (
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
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showRecoveryPrompt && recoverableSession && step === 'start' && (
            <RecoveryPrompt session={recoverableSession} onResume={handleResumeSession} onDismiss={dismissRecovery} />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showHistory && (
            <HistoryModal
              latestHistoryComparison={latestHistoryComparison}
              latestHistoryInsights={latestHistoryInsights}
              historyData={historyData}
              getHistoryEntryNote={getHistoryEntryNote}
              onClose={() => setShowHistory(false)}
            />
          )}
        </AnimatePresence>

        <AnimatePresence>
          {showVersionModal && <VersionModal changelog={CHANGELOG} onClose={() => setShowVersionModal(false)} />}
        </AnimatePresence>

        <AnimatePresence>
          {axisGuideKey && <AxisGuideModal guide={AXIS_GUIDE[axisGuideKey]} onClose={() => setAxisGuideKey(null)} />}
        </AnimatePresence>

        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-20">
          <button
            onClick={() => {
              trackEvent('version_open');
              setShowVersionModal(true);
            }}
            className="text-[11px] font-bold text-slate-600 hover:text-slate-400 transition-colors bg-black/20 px-3 py-1 rounded-full border border-white/5 backdrop-blur-sm"
          >
            Version {CHANGELOG[0].version}
          </button>
        </div>
      </div>
    </div>
  );
}
