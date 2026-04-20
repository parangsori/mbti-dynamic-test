export const STORAGE_KEYS = {
  history: 'mbti_history',
  activeSession: 'mbti_active_session',
  username: 'mbti_username',
  eventStats: 'mbti_event_stats',
  recentIds: 'mbti_recent_ids'
};

export const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (error) {
    return fallback;
  }
};

export const writeJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const removeItem = (key) => {
  localStorage.removeItem(key);
};

export const clearAllLocalData = () => {
  Object.values(STORAGE_KEYS).forEach((key) => removeItem(key));
};

export const readHistory = () => readJson(STORAGE_KEYS.history, []);
export const writeHistory = (history) => writeJson(STORAGE_KEYS.history, history);

export const readActiveSession = () => readJson(STORAGE_KEYS.activeSession, null);
export const writeActiveSession = (payload) => writeJson(STORAGE_KEYS.activeSession, {
  ...payload,
  savedAt: new Date().toISOString()
});
export const clearActiveSession = () => removeItem(STORAGE_KEYS.activeSession);

export const readUserName = () => localStorage.getItem(STORAGE_KEYS.username) || '';
export const writeUserName = (name) => {
  if (name) localStorage.setItem(STORAGE_KEYS.username, name);
  else removeItem(STORAGE_KEYS.username);
};

export const readRecentSessions = () => readJson(STORAGE_KEYS.recentIds, []);
export const writeRecentSessions = (sessions) => writeJson(STORAGE_KEYS.recentIds, sessions);

export const trackEvent = (name, payload = {}) => {
  const raw = readJson(STORAGE_KEYS.eventStats, { counts: {}, recent: [] });
  const counts = { ...raw.counts, [name]: (raw.counts?.[name] || 0) + 1 };
  const recent = [{ name, at: new Date().toISOString(), payload }, ...(raw.recent || [])].slice(0, 40);
  writeJson(STORAGE_KEYS.eventStats, { counts, recent });
};
