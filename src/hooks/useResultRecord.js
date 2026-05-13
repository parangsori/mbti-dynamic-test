import { useEffect, useRef } from 'react';
import { toHistoryAxisSnapshot } from '../lib/resultAnalysis.js';
import { writeHistory } from '../lib/storage.js';

export function useResultRecord({
  currentEntry,
  historyData,
  mbti,
  onResultReady,
  percent,
  presentation,
  questionContextSummary,
  setHistoryData,
  spectrum
}) {
  const resultReadyRef = useRef(false);

  useEffect(() => {
    const newEntry = {
      ...currentEntry,
      mbti,
      percent,
      variantKey: presentation.variantKey,
      themeKey: presentation.themeKey,
      questionContextSummary,
      axes: spectrum.map(toHistoryAxisSnapshot)
    };

    if (historyData[0]?.createdAt === newEntry.createdAt) {
      if (!resultReadyRef.current) {
        resultReadyRef.current = true;
        onResultReady?.();
      }
      return;
    }

    const updated = [newEntry, ...historyData].slice(0, 7);
    writeHistory(updated);
    setHistoryData(updated);
    if (!resultReadyRef.current) {
      resultReadyRef.current = true;
      onResultReady?.();
    }
  }, [
    currentEntry,
    historyData,
    mbti,
    onResultReady,
    percent,
    presentation.themeKey,
    presentation.variantKey,
    questionContextSummary,
    setHistoryData,
    spectrum
  ]);
}
