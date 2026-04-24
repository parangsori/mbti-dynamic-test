const LOCAL_ERROR_KEY = 'mbti_error_stats';
const MAX_RECENT_ITEMS = 30;

const safeNow = () => new Date().toISOString();

const readLocalJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocalJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore storage quota or private mode failures
  }
};

const canUseNavigator = () => typeof navigator !== 'undefined';
const canUseWindow = () => typeof window !== 'undefined';

const sendPayload = (endpoint, payload) => {
  if (!endpoint || !canUseNavigator()) return;

  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(endpoint, new Blob([body], { type: 'application/json' }));
      return;
    }
  } catch {
    // fall through to fetch
  }

  try {
    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true
    }).catch(() => {});
  } catch {
    // ignore transport errors in client analytics
  }
};

const getPayloadMeta = (payload = {}) => ({
  path: canUseWindow() ? window.location.pathname : '',
  href: canUseWindow() ? window.location.href : '',
  ...payload
});

export const emitAnalyticsEvent = (name, payload = {}) => {
  const meta = getPayloadMeta(payload);
  const endpoint = import.meta.env.VITE_ANALYTICS_ENDPOINT;

  if (canUseWindow()) {
    try {
      if (typeof window.plausible === 'function') {
        window.plausible(name, { props: meta });
      }
    } catch {}

    try {
      if (window.umami?.track) {
        window.umami.track(name, meta);
      }
    } catch {}

    try {
      if (typeof window.gtag === 'function') {
        window.gtag('event', name, meta);
      }
    } catch {}
  }

  sendPayload(endpoint, {
    type: 'analytics',
    name,
    at: safeNow(),
    payload: meta
  });
};

const serializeError = (error) => {
  if (!error) {
    return {
      name: 'UnknownError',
      message: 'Unknown error'
    };
  }

  return {
    name: error.name || 'Error',
    message: error.message || String(error),
    stack: error.stack || ''
  };
};

export const readLocalErrorStats = () => readLocalJson(LOCAL_ERROR_KEY, { counts: {}, recent: [] });

export const captureError = (error, context = {}) => {
  const details = serializeError(error);
  const key = context.key || details.name || 'Error';
  const raw = readLocalErrorStats();
  const counts = {
    ...raw.counts,
    [key]: (raw.counts?.[key] || 0) + 1
  };
  const recent = [
    {
      ...details,
      context,
      at: safeNow()
    },
    ...(raw.recent || [])
  ].slice(0, MAX_RECENT_ITEMS);

  writeLocalJson(LOCAL_ERROR_KEY, { counts, recent });

  if (canUseWindow()) {
    try {
      if (window.Sentry?.captureException) {
        window.Sentry.captureException(error || new Error(details.message), { extra: context });
      }
    } catch {}
  }

  sendPayload(import.meta.env.VITE_ERROR_ENDPOINT, {
    type: 'error',
    at: safeNow(),
    error: details,
    context: getPayloadMeta(context)
  });
};

let globalHandlersInstalled = false;

export const installGlobalErrorHandlers = () => {
  if (!canUseWindow() || globalHandlersInstalled) return;

  const handleWindowError = (event) => {
    captureError(event?.error || new Error(event?.message || 'window error'), {
      key: 'window_error',
      source: 'window.error',
      filename: event?.filename,
      lineno: event?.lineno,
      colno: event?.colno
    });
  };

  const handleUnhandledRejection = (event) => {
    const reason = event?.reason;
    const error = reason instanceof Error ? reason : new Error(typeof reason === 'string' ? reason : 'unhandled rejection');
    captureError(error, {
      key: 'unhandled_rejection',
      source: 'window.unhandledrejection'
    });
  };

  window.addEventListener('error', handleWindowError);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  globalHandlersInstalled = true;
};
