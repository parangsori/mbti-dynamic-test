import { capturePostHogEvent } from './posthog.js';
import { buildErrorDiagnostics } from './errorDiagnostics.js';

const LOCAL_ERROR_KEY = 'mbti_error_stats';
const MAX_RECENT_ITEMS = 30;
const MAX_EVENT_TEXT_LENGTH = 120;
const APP_VERSION = typeof __APP_VERSION__ === 'undefined' ? 'unknown' : __APP_VERSION__;

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
const truncateText = (value) => String(value || '').slice(0, MAX_EVENT_TEXT_LENGTH);
const getPageAgeMs = () => {
  if (typeof performance === 'undefined' || typeof performance.now !== 'function') return 0;
  return Math.max(0, Math.round(performance.now()));
};
const isStandaloneDisplay = () => {
  if (!canUseWindow()) return false;
  try {
    return window.navigator?.standalone === true || window.matchMedia?.('(display-mode: standalone)')?.matches === true;
  } catch {
    return false;
  }
};

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

  capturePostHogEvent(name, meta);

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

export const readLocalErrorStats = () => readLocalJson(LOCAL_ERROR_KEY, { counts: {}, recent: [] });

export const captureError = (error, context = {}) => {
  const details = buildErrorDiagnostics({ error, context, appVersion: APP_VERSION });
  const key = details.key;
  const raw = readLocalErrorStats();
  const counts = {
    ...raw.counts,
    [key]: (raw.counts?.[key] || 0) + 1
  };
  const recent = [
    {
      ...details,
      context: {
        source: details.source,
        stage: details.stage,
        reason: details.reason
      },
      at: safeNow()
    },
    ...(raw.recent || [])
  ].slice(0, MAX_RECENT_ITEMS);

  writeLocalJson(LOCAL_ERROR_KEY, { counts, recent });

  capturePostHogEvent('client_error', {
    error_key: truncateText(details.key),
    error_name: truncateText(details.name),
    error_message: details.message,
    error_cause: details.cause,
    error_source: truncateText(details.source),
    error_stage: truncateText(details.stage),
    error_reason: truncateText(details.reason),
    error_resource_type: details.resourceType,
    error_fingerprint: details.fingerprint,
    error_filename: details.filename,
    error_line: details.line,
    error_column: details.column,
    error_stack: details.stack,
    error_component_stack: details.componentStack,
    error_opaque: details.opaque,
    app_version: details.appVersion,
    local_error_count: counts[key] || 1,
    path: canUseWindow() ? window.location.pathname : '',
    online: canUseNavigator() ? navigator.onLine !== false : true,
    connection_type: canUseNavigator() ? navigator.connection?.effectiveType || '' : '',
    visibility_state: typeof document !== 'undefined' ? document.visibilityState || '' : '',
    page_age_ms: getPageAgeMs(),
    standalone_display: isStandaloneDisplay()
  });

  if (canUseWindow()) {
    try {
      if (window.Sentry?.captureException) {
        const sanitizedError = new Error(details.message);
        sanitizedError.name = details.name;
        if (details.stack) sanitizedError.stack = details.stack;
        window.Sentry.captureException(sanitizedError, {
          extra: {
            fingerprint: details.fingerprint,
            source: details.source,
            stage: details.stage,
            filename: details.filename,
            line: details.line,
            column: details.column,
            appVersion: details.appVersion
          }
        });
      }
    } catch {}
  }

  sendPayload(import.meta.env.VITE_ERROR_ENDPOINT, {
    type: 'error',
    at: safeNow(),
    error: details,
    context: {
      path: canUseWindow() ? window.location.pathname : '',
      source: details.source,
      stage: details.stage,
      reason: details.reason
    }
  });
};

let globalHandlersInstalled = false;

export const installGlobalErrorHandlers = () => {
  if (!canUseWindow() || globalHandlersInstalled) return;

  const handleWindowError = (event) => {
    const resourceTarget = event?.target;
    const resourceUrl = resourceTarget && resourceTarget !== window
      ? resourceTarget.currentSrc || resourceTarget.src || resourceTarget.href || ''
      : '';

    if (resourceUrl) {
      captureError(new Error(`Failed to load ${resourceTarget?.tagName || 'resource'}`), {
        key: 'resource_load_error',
        source: 'window.resource_error',
        reason: 'resource_load_failure',
        resourceType: resourceTarget?.tagName || 'resource',
        resourceUrl
      });
      return;
    }

    const isOpaqueScriptError = !event?.error && event?.message === 'Script error.';

    captureError(event?.error || new Error(event?.message || 'window error'), {
      key: isOpaqueScriptError ? 'opaque_script_error' : 'window_error',
      source: 'window.error',
      reason: isOpaqueScriptError ? 'browser_opaque_script_error' : '',
      cause: isOpaqueScriptError ? 'Browser hid the original script error details.' : '',
      opaque: isOpaqueScriptError,
      filename: event?.filename,
      lineno: event?.lineno,
      colno: event?.colno
    });
  };

  const handleUnhandledRejection = (event) => {
    const reason = event?.reason;
    const error = reason instanceof Error
      ? reason
      : new Error(typeof reason === 'string' ? reason : reason?.message || reason?.code || 'unhandled rejection');
    captureError(error, {
      key: 'unhandled_rejection',
      source: 'window.unhandledrejection',
      reason: reason?.code || (reason == null ? 'empty_reason' : typeof reason)
    });
  };

  window.addEventListener('error', handleWindowError, true);
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  globalHandlersInstalled = true;
};
