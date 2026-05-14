import { useEffect, useRef } from 'react';
import { toHistoryAxisSnapshot } from '../lib/resultAnalysis.js';
import { getHistoryEntryKey, patchHistoryEntry, writeHistory } from '../lib/storage.js';
import { syncResultEntry } from '../lib/resultSync.js';

export function useResultRecord({
  ageGroup = '',
  currentEntry,
  historyData,
  mbti,
  onResultReady,
  percent,
  presentation,
  questionContextSummary,
  setHistoryData,
  scores,
  spectrum,
  trackEvent
}) {
  const resultReadyRef = useRef(false);
  const syncStartedRef = useRef(new Set());

  const startServerSync = (entry) => {
    const entryKey = getHistoryEntryKey(entry);
    if (!entryKey || entry.serverSyncedAt || syncStartedRef.current.has(entryKey)) return;

    syncStartedRef.current.add(entryKey);

    syncResultEntry({ entry, scores, ageGroup })
      .then((result) => {
        if (result.status === 'skipped') return;

        const syncedAt = new Date().toISOString();
        const patch = result.status === 'synced'
          ? {
              serverId: result.serverId,
              serverSyncStatus: 'synced',
              serverSyncedAt: syncedAt,
              serverSyncFailedAt: null,
              serverSyncError: ''
            }
          : {
              serverSyncStatus: 'failed',
              serverSyncFailedAt: syncedAt,
              serverSyncError: result.reason || 'unknown'
            };

        const updated = patchHistoryEntry(entryKey, patch);
        setHistoryData((current) => {
          const currentHasEntry = current.some((item) => getHistoryEntryKey(item) === entryKey);
          return currentHasEntry ? current.map((item) => (
            getHistoryEntryKey(item) === entryKey ? { ...item, ...patch } : item
          )) : updated;
        });

        trackEvent?.(result.status === 'synced' ? 'result_server_sync_success' : 'result_server_sync_fail', {
          reason: result.reason || ''
        });
      })
      .catch((error) => {
        const updated = patchHistoryEntry(entryKey, {
          serverSyncStatus: 'failed',
          serverSyncFailedAt: new Date().toISOString(),
          serverSyncError: error?.message || 'unknown'
        });

        setHistoryData((current) => {
          const currentHasEntry = current.some((item) => getHistoryEntryKey(item) === entryKey);
          return currentHasEntry ? current.map((item) => (
            getHistoryEntryKey(item) === entryKey
              ? {
                  ...item,
                  serverSyncStatus: 'failed',
                  serverSyncFailedAt: new Date().toISOString(),
                  serverSyncError: error?.message || 'unknown'
                }
              : item
          )) : updated;
        });

        trackEvent?.('result_server_sync_fail', { reason: 'unexpected_error' });
      });
  };

  useEffect(() => {
    const newEntry = {
      ...currentEntry,
      localEntryId: currentEntry.localEntryId || currentEntry.createdAt,
      mbti,
      percent,
      variantKey: presentation.variantKey,
      themeKey: presentation.themeKey,
      questionContextSummary,
      axes: spectrum.map(toHistoryAxisSnapshot)
    };

    if (historyData[0]?.createdAt === newEntry.createdAt) {
      startServerSync(historyData[0]);
      if (!resultReadyRef.current) {
        resultReadyRef.current = true;
        onResultReady?.();
      }
      return;
    }

    const updated = [newEntry, ...historyData].slice(0, 7);
    writeHistory(updated);
    setHistoryData(updated);
    startServerSync(newEntry);
    if (!resultReadyRef.current) {
      resultReadyRef.current = true;
      onResultReady?.();
    }
  }, [
    ageGroup,
    currentEntry,
    historyData,
    mbti,
    onResultReady,
    percent,
    presentation.themeKey,
    presentation.variantKey,
    questionContextSummary,
    scores,
    setHistoryData,
    spectrum,
    trackEvent
  ]);
}
