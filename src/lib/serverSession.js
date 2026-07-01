import { createInFlightRequestDeduper } from './inFlightRequest.js';

const SERVER_SESSION_ENABLED = import.meta.env?.VITE_SERVER_SESSION_ENABLED !== 'false';
const REQUEST_TIMEOUT_MS = 4500;
const dedupeStartRequest = createInFlightRequestDeduper();

const postJson = async (path, payload) => {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(path, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload),
      signal: controller.signal
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      throw new Error(data?.error || `request_failed_${response.status}`);
    }
    return data;
  } finally {
    window.clearTimeout(timer);
  }
};

export const startServerSession = ({ recentSessions, ageGroup, gender } = {}) => {
  if (!SERVER_SESSION_ENABLED) {
    return Promise.resolve({ status: 'disabled' });
  }
  const payload = { recentSessions, ageGroup, gender };
  return dedupeStartRequest(JSON.stringify(payload), () => postJson('/api/session/start', payload));
};

export const completeServerSession = ({
  sessionToken,
  answers,
  historyData,
  userName,
  defaultUserName
} = {}) => {
  if (!SERVER_SESSION_ENABLED) {
    return Promise.resolve({ status: 'disabled' });
  }
  return postJson('/api/session/complete', {
    sessionToken,
    answers,
    historyData,
    userName,
    defaultUserName
  });
};
