import { useRef, useState } from 'react';
import { createEmptyNeutralSignals, createEmptyScores } from '../lib/questionFlow.js';
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
    createQuestionSnapshot,
    writeSessionFromSnapshot
  };
}
