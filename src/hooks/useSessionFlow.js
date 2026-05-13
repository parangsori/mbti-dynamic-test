import { useRef, useState } from 'react';
import {
  buildFollowupQuestions,
  createEmptyNeutralSignals,
  createEmptyScores,
  formatMicroCopy
} from '../lib/questionFlow.js';
import { writeActiveSession } from '../lib/storage.js';

export function useSessionFlow() {
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

  const activeQuestions = questionPhase === 'followup' ? followupQuestions : questions;
  const activeQuestion = activeQuestions[currIdx];

  const createQuestionSnapshot = ({ userName }) => ({
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

  const writeCurrentSession = ({
    userName,
    nextQuestions = questions,
    nextFollowupQuestions = followupQuestions,
    nextCurrIdx = currIdx,
    nextScores = scores,
    nextQuestionPhase = questionPhase,
    nextRecentSessions = recentSessionsSnapshot,
    nextSessionQuestionIds = sessionQuestionIds,
    nextNeutralSignals = neutralSignals,
    nextNeutralQuestionIds = neutralQuestionIds
  }) => {
    writeActiveSession({
      userName,
      questions: nextQuestions,
      followupQuestions: nextFollowupQuestions,
      currIdx: nextCurrIdx,
      scores: nextScores,
      questionPhase: nextQuestionPhase,
      recentSessions: nextRecentSessions,
      sessionQuestionIds: nextSessionQuestionIds,
      neutralSignals: nextNeutralSignals,
      neutralQuestionIds: nextNeutralQuestionIds
    });
  };

  const getAnswerDirection = (method) => (method?.includes('left') ? -1 : 1);

  const releaseTransition = () => {
    transitionLockRef.current = false;
    setIsTransitioning(false);
  };

  const trackQuestionAnswer = (method, trackEvent) => {
    trackEvent?.('question_answer', {
      method,
      phase: questionPhase,
      questionId: activeQuestion?.id || '',
      axis: activeQuestion?._axis || '',
      index: currIdx + 1
    });
  };

  const advanceWithResponse = ({
    userName,
    nextScores,
    nextNeutralSignals = neutralSignals,
    nextNeutralQuestionIds = neutralQuestionIds,
    microText = '',
    direction = 1,
    trackEvent,
    onFinishSession
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
            trackEvent?.('followup_start', {
              count: nextFollowupQuestions.length,
              neutralCount: nextNeutralQuestionIds.length
            });
            setFollowupQuestions(nextFollowupQuestions);
            setQuestionPhase('followup');
            setCurrIdx(0);
            setSessionQuestionIds(nextSessionIds);
            writeCurrentSession({
              userName,
              nextFollowupQuestions,
              nextCurrIdx: 0,
              nextScores,
              nextQuestionPhase: 'followup',
              nextSessionQuestionIds: nextSessionIds,
              nextNeutralSignals,
              nextNeutralQuestionIds
            });
          } else {
            onFinishSession?.(nextScores);
          }
        } else {
          const nextIdx = currIdx + 1;
          if (nextIdx === 3) trackEvent?.('question_reach_3');
          if (nextIdx === 6) trackEvent?.('question_reach_6');
          if (nextIdx === 9) trackEvent?.('question_reach_9');
          setCurrIdx(nextIdx);
          writeCurrentSession({
            userName,
            nextCurrIdx: nextIdx,
            nextScores,
            nextNeutralSignals,
            nextNeutralQuestionIds
          });
        }
      } else if (currIdx + 1 >= followupQuestions.length) {
        onFinishSession?.(nextScores);
      } else {
        const nextIdx = currIdx + 1;
        setCurrIdx(nextIdx);
        writeCurrentSession({
          userName,
          nextCurrIdx: nextIdx,
          nextScores,
          nextNeutralSignals,
          nextNeutralQuestionIds
        });
      }

      releaseTransition();
    }, 800);
  };

  const handleQuestionAnswer = (option, method = 'tap', { userName, trackEvent, onFinishSession } = {}) => {
    if (isTransitioning || transitionLockRef.current) return;
    transitionLockRef.current = true;
    setLastAnswerSnapshot(createQuestionSnapshot({ userName }));
    setIsTransitioning(true);
    trackQuestionAnswer(method, trackEvent);

    const weight = activeQuestion?.weight || 1;
    const nextScores = { ...scores, [option.type]: (scores[option.type] || 0) + weight };
    advanceWithResponse({
      userName,
      nextScores,
      microText: option.micro,
      direction: getAnswerDirection(method),
      trackEvent,
      onFinishSession
    });
  };

  const handleMiddleAnswer = (method = 'middle', { userName, trackEvent, onFinishSession } = {}) => {
    if (isTransitioning || transitionLockRef.current) return;
    transitionLockRef.current = true;
    setLastAnswerSnapshot(createQuestionSnapshot({ userName }));
    setIsTransitioning(true);
    trackQuestionAnswer(method, trackEvent);

    const axisCode = activeQuestion?._axis;
    const nextNeutralSignals = axisCode
      ? { ...neutralSignals, [axisCode]: (neutralSignals[axisCode] || 0) + 1 }
      : neutralSignals;
    const nextNeutralQuestionIds = activeQuestion?.id
      ? [...neutralQuestionIds, activeQuestion.id]
      : neutralQuestionIds;

    advanceWithResponse({
      userName,
      nextScores: scores,
      nextNeutralSignals,
      nextNeutralQuestionIds,
      microText: '이 축은 한 번 더 볼게요',
      trackEvent,
      onFinishSession
    });
  };

  const handleQuestionBack = ({ setUserName, setStep, trackEvent } = {}) => {
    if (!lastAnswerSnapshot || isTransitioning || transitionLockRef.current) return;

    const snapshot = lastAnswerSnapshot;
    transitionLockRef.current = false;
    setUserName?.(snapshot.userName || '');
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
    setStep?.('question');
    setLastAnswerSnapshot(null);
    writeSessionFromSnapshot(snapshot);

    const restoredQuestions = snapshot.questionPhase === 'followup'
      ? snapshot.followupQuestions || []
      : snapshot.questions || [];
    const restoredQuestion = restoredQuestions[snapshot.currIdx || 0];
    trackEvent?.('question_back', {
      phase: snapshot.questionPhase || 'base',
      questionId: restoredQuestion?.id || '',
      axis: restoredQuestion?._axis || '',
      index: (snapshot.currIdx || 0) + 1
    });
  };

  return {
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
    neutralSignals,
    setNeutralSignals,
    neutralQuestionIds,
    setNeutralQuestionIds,
    questionContextSummary,
    setQuestionContextSummary,
    lastAnswerSnapshot,
    setLastAnswerSnapshot,
    transitionLockRef,
    activeQuestion,
    handleQuestionAnswer,
    handleMiddleAnswer,
    handleQuestionBack
  };
}
