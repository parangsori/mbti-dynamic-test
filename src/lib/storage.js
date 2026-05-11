import { emitAnalyticsEvent } from './observability.js';

export const STORAGE_KEYS = {
  history: 'mbti_history',
  activeSession: 'mbti_active_session',
  pendingResult: 'mbti_pending_result',
  username: 'mbti_username',
  eventStats: 'mbti_event_stats',
  recentIds: 'mbti_recent_ids',
  errorStats: 'mbti_error_stats',
  profile: 'mbti_user_profile'
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
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
};

export const removeItem = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
};

export const clearAllLocalData = () => {
  Object.values(STORAGE_KEYS).forEach((key) => removeItem(key));
};

const readArrayJson = (key) => {
  const value = readJson(key, []);
  return Array.isArray(value) ? value : [];
};

export const readHistory = () => readArrayJson(STORAGE_KEYS.history);
export const writeHistory = (history) => writeJson(STORAGE_KEYS.history, history);

export const readActiveSession = () => readJson(STORAGE_KEYS.activeSession, null);
export const writeActiveSession = (payload) => writeJson(STORAGE_KEYS.activeSession, {
  ...payload,
  savedAt: new Date().toISOString()
});
export const clearActiveSession = () => removeItem(STORAGE_KEYS.activeSession);

const PENDING_RESULT_MAX_AGE_MS = 30 * 60_000;

export const readPendingResult = () => {
  const value = readJson(STORAGE_KEYS.pendingResult, null);
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

  const savedAt = Date.parse(value.savedAt || '');
  if (!Number.isFinite(savedAt) || Date.now() - savedAt > PENDING_RESULT_MAX_AGE_MS) {
    removeItem(STORAGE_KEYS.pendingResult);
    return null;
  }

  if (!value.scores || typeof value.scores !== 'object' || Array.isArray(value.scores)) return null;
  return value;
};

export const writePendingResult = (payload) => writeJson(STORAGE_KEYS.pendingResult, {
  ...payload,
  savedAt: new Date().toISOString()
});

export const clearPendingResult = () => removeItem(STORAGE_KEYS.pendingResult);

export const readUserName = () => {
  try {
    return localStorage.getItem(STORAGE_KEYS.username) || '';
  } catch {
    return '';
  }
};
export const writeUserName = (name) => {
  try {
    if (name) localStorage.setItem(STORAGE_KEYS.username, name);
    else removeItem(STORAGE_KEYS.username);
    return true;
  } catch {
    return false;
  }
};

const DEFAULT_PROFILE = { birthDate: null, ageGroup: '', gender: '' };

const normalizeBirthDate = (birthDate) => {
  if (!birthDate || typeof birthDate !== 'object') return null;
  const year = Number(birthDate.year);
  const month = birthDate.month === '' ? '' : Number(birthDate.month);
  const day = birthDate.day === '' ? '' : Number(birthDate.day);
  if (!Number.isInteger(year)) return null;
  return {
    year,
    month: Number.isInteger(month) ? month : '',
    day: Number.isInteger(day) ? day : ''
  };
};

const normalizeProfile = (profile) => {
  if (!profile || typeof profile !== 'object' || Array.isArray(profile)) return DEFAULT_PROFILE;
  return {
    birthDate: normalizeBirthDate(profile.birthDate),
    ageGroup: typeof profile.ageGroup === 'string' ? profile.ageGroup : '',
    gender: typeof profile.gender === 'string' ? profile.gender : ''
  };
};

export const readProfile = () => normalizeProfile(readJson(STORAGE_KEYS.profile, DEFAULT_PROFILE));
export const writeProfile = (profile) => writeJson(STORAGE_KEYS.profile, normalizeProfile(profile));
export const clearProfile = () => removeItem(STORAGE_KEYS.profile);

export const readRecentSessions = () => readArrayJson(STORAGE_KEYS.recentIds);
export const writeRecentSessions = (sessions) => writeJson(STORAGE_KEYS.recentIds, sessions);

export const trackEvent = (name, payload = {}) => {
  try {
    const raw = readJson(STORAGE_KEYS.eventStats, { counts: {}, recent: [] });
    const counts = { ...raw.counts, [name]: (raw.counts?.[name] || 0) + 1 };
    const recent = [{ name, at: new Date().toISOString(), payload }, ...(raw.recent || [])].slice(0, 40);
    writeJson(STORAGE_KEYS.eventStats, { counts, recent });
  } catch {
    // local activity logging should never block the core flow
  }

  try {
    emitAnalyticsEvent(name, payload);
  } catch {
    // client analytics should never block the core flow
  }
};
