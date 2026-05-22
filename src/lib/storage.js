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

const LEGACY_PUBLIC_HOST = 'mbti-dynamic-test.vercel.app';
const PUBLIC_SERVICE_ORIGIN = 'https://todaymbti.com';
const MIGRATION_HASH_PREFIX = '#migrate=';
const MIGRATION_META_KEY = 'mbti_domain_migration';
const EXTRA_LOCAL_KEYS = [
  'mbti_font_scale',
  'mbti_high_contrast',
  'mbti_home_screen_tip_hidden'
];

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

export const getHistoryEntryKey = (entry = {}) => entry.localEntryId || entry.createdAt || '';

export const patchHistoryEntry = (entryKey, patch) => {
  if (!entryKey) return readHistory();

  const history = readHistory();
  let changed = false;
  const updated = history.map((item) => {
    if (getHistoryEntryKey(item) !== entryKey) return item;
    changed = true;
    return { ...item, ...patch };
  });

  if (changed) writeHistory(updated);
  return updated;
};

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

const canUseBrowserStorage = () => {
  try {
    return typeof window !== 'undefined' && Boolean(window.localStorage);
  } catch {
    return false;
  }
};

const encodeMigrationPayload = (payload) => {
  const json = JSON.stringify(payload);
  const bytes = new TextEncoder().encode(json);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const decodeMigrationPayload = (value) => {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return JSON.parse(new TextDecoder().decode(bytes));
};

const readRawLocalValue = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeRawLocalValue = (key, value) => {
  if (typeof value !== 'string') return false;
  try {
    localStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
};

const collectDomainMigrationPayload = () => {
  const values = {};
  [...Object.values(STORAGE_KEYS), ...EXTRA_LOCAL_KEYS].forEach((key) => {
    const value = readRawLocalValue(key);
    if (value !== null) values[key] = value;
  });

  return {
    version: 1,
    sourceHost: window.location.host,
    exportedAt: new Date().toISOString(),
    values
  };
};

const mergeHistoryForMigration = (incomingRaw) => {
  const incoming = (() => {
    try {
      const parsed = JSON.parse(incomingRaw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();
  if (!incoming.length) return false;

  const existing = readHistory();
  const seen = new Set();
  const merged = [...existing, ...incoming].filter((entry) => {
    const key = getHistoryEntryKey(entry);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 7);

  return writeHistory(merged);
};

const mergeRecentSessionsForMigration = (incomingRaw) => {
  const incoming = (() => {
    try {
      const parsed = JSON.parse(incomingRaw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  })();
  if (!incoming.length) return false;

  const existing = readRecentSessions();
  const seen = new Set();
  const merged = [...existing, ...incoming].filter((session) => {
    const key = session?.sessionId || session?.savedAt || JSON.stringify(session);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  }).slice(0, 8);

  return writeRecentSessions(merged);
};

const importDomainMigrationPayload = (payload) => {
  if (!payload?.values || typeof payload.values !== 'object') return false;

  let imported = false;
  Object.entries(payload.values).forEach(([key, value]) => {
    if (key === STORAGE_KEYS.history) {
      imported = mergeHistoryForMigration(value) || imported;
      return;
    }

    if (key === STORAGE_KEYS.recentIds) {
      imported = mergeRecentSessionsForMigration(value) || imported;
      return;
    }

    const shouldPreserveExisting = [
      STORAGE_KEYS.username,
      STORAGE_KEYS.profile,
      STORAGE_KEYS.activeSession,
      STORAGE_KEYS.pendingResult,
      'mbti_font_scale',
      'mbti_high_contrast'
    ].includes(key);

    if (shouldPreserveExisting && readRawLocalValue(key) !== null) return;
    imported = writeRawLocalValue(key, value) || imported;
  });

  writeJson(MIGRATION_META_KEY, {
    importedAt: new Date().toISOString(),
    sourceHost: payload.sourceHost || LEGACY_PUBLIC_HOST,
    exportedAt: payload.exportedAt || ''
  });

  return imported;
};

export const handlePublicDomainMigration = () => {
  if (!canUseBrowserStorage()) return false;

  const { host, pathname, search, hash } = window.location;

  if (host === LEGACY_PUBLIC_HOST) {
    const payload = collectDomainMigrationPayload();
    const target = new URL(`${pathname}${search}`, PUBLIC_SERVICE_ORIGIN);
    if (Object.keys(payload.values).length) {
      target.hash = `${MIGRATION_HASH_PREFIX.slice(1)}${encodeMigrationPayload(payload)}`;
    }
    window.location.replace(target.toString());
    return true;
  }

  if (host !== new URL(PUBLIC_SERVICE_ORIGIN).host || !hash.startsWith(MIGRATION_HASH_PREFIX)) {
    return false;
  }

  try {
    const payload = decodeMigrationPayload(hash.slice(MIGRATION_HASH_PREFIX.length));
    importDomainMigrationPayload(payload);
  } catch {
    // A malformed migration hash should not block the app from loading.
  }

  window.history.replaceState(null, '', `${pathname}${search}`);
  return false;
};

export const prepareHomeScreenMigrationUrl = () => {
  if (!canUseBrowserStorage()) return false;

  const { host, pathname, search, hash } = window.location;
  if (host !== new URL(PUBLIC_SERVICE_ORIGIN).host || hash.startsWith(MIGRATION_HASH_PREFIX)) return false;

  const payload = collectDomainMigrationPayload();
  if (!Object.keys(payload.values).length) return false;

  const nextHash = `${MIGRATION_HASH_PREFIX.slice(1)}${encodeMigrationPayload(payload)}`;
  window.history.replaceState(null, '', `${pathname}${search}#${nextHash}`);
  return true;
};
