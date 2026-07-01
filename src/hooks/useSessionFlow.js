import { useRef, useState } from 'react';

export function useSessionFlow() {
  const [questions, setQuestions] = useState([]);
  const [followupQuestions, setFollowupQuestions] = useState([]);
  const [currIdx, setCurrIdx] = useState(0);
  const [scores, setScores] = useState({});
  const [microCopy, setMicroCopy] = useState('');
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [questionDirection, setQuestionDirection] = useState(1);
  const [questionPhase, setQuestionPhase] = useState('base');
  const [recentSessionsSnapshot, setRecentSessionsSnapshot] = useState([]);
  const [sessionQuestionIds, setSessionQuestionIds] = useState([]);
  const [questionContextSummary, setQuestionContextSummary] = useState(null);
  const [lastAnswerSnapshot, setLastAnswerSnapshot] = useState(null);
  const transitionLockRef = useRef(false);

  const activeQuestions = questionPhase === 'followup' ? followupQuestions : questions;
  const activeQuestion = activeQuestions[currIdx];

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
    questionContextSummary,
    setQuestionContextSummary,
    lastAnswerSnapshot,
    setLastAnswerSnapshot,
    transitionLockRef,
    activeQuestion
  };
}
