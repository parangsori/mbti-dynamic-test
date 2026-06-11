const MAX_MESSAGE_LENGTH = 300;
const MAX_STACK_LENGTH = 900;
const MAX_STACK_LINES = 6;
const MAX_FILENAME_LENGTH = 180;

const stripUrlDetails = (value) =>
  value.replace(/\bhttps?:\/\/[^\s)"']+/gi, (rawUrl) => {
    try {
      const url = new URL(rawUrl);
      return `${url.hostname}${url.pathname}`;
    } catch {
      return '<url>';
    }
  });

export const sanitizeDiagnosticText = (value, maxLength = MAX_MESSAGE_LENGTH) => {
  if (!value) return '';

  return stripUrlDetails(String(value))
    .replace(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi, '<email>')
    .replace(/\bBearer\s+[A-Za-z0-9._~+/=-]+\b/gi, 'Bearer <token>')
    .replace(/\beyJ[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\.[A-Za-z0-9_-]{12,}\b/g, '<token>')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, '<id>')
    .replace(/\b(?:\d[ -]?){10,13}\b/g, '<phone>')
    .replace(/\b(?:19|20)\d{2}[./-](?:0?[1-9]|1[0-2])[./-](?:0?[1-9]|[12]\d|3[01])\b/g, '<date>')
    .replace(/\b(?=[A-Za-z0-9]{24,}\b)(?=[A-Za-z0-9]*\d)[A-Za-z0-9]+\b/g, '<token>')
    .replace(/\b[0-9a-f]{24,}\b/gi, '<token>')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength);
};

export const sanitizeErrorFilename = (value) => {
  if (!value) return '';

  try {
    const url = new URL(String(value), 'https://local.invalid');
    if (url.protocol === 'blob:' || url.protocol === 'data:') return `<${url.protocol.slice(0, -1)}>`;
    const host = url.hostname === 'local.invalid' ? '' : url.hostname;
    return `${host}${url.pathname}`.slice(0, MAX_FILENAME_LENGTH);
  } catch {
    return sanitizeDiagnosticText(value, MAX_FILENAME_LENGTH);
  }
};

export const sanitizeErrorStack = (value) => {
  if (!value) return '';

  return String(value)
    .split('\n')
    .slice(0, MAX_STACK_LINES)
    .map((line) => sanitizeDiagnosticText(line, 220))
    .filter(Boolean)
    .join('\n')
    .slice(0, MAX_STACK_LENGTH);
};

const hashText = (value) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
};

export const buildErrorDiagnostics = ({ error, context = {}, appVersion = 'unknown' }) => {
  const name = sanitizeDiagnosticText(error?.name || 'Error', 80) || 'Error';
  const message = sanitizeDiagnosticText(error?.message || String(error || 'Unknown error'));
  const cause = sanitizeDiagnosticText(error?.cause?.message || error?.cause || '', 180);
  const filename = sanitizeErrorFilename(context.filename || context.resourceUrl || '');
  const stack = sanitizeErrorStack(error?.stack || '');
  const componentStack = sanitizeErrorStack(context.componentStack || '');
  const key = sanitizeDiagnosticText(context.key || name || 'Error', 120) || 'Error';
  const source = sanitizeDiagnosticText(context.source || context.stage || 'app', 120) || 'app';
  const stage = sanitizeDiagnosticText(context.stage || '', 120);
  const reason = sanitizeDiagnosticText(context.reason || '', 120);
  const resourceType = sanitizeDiagnosticText(context.resourceType || '', 40);
  const line = Number.isFinite(Number(context.lineno)) ? Number(context.lineno) : 0;
  const column = Number.isFinite(Number(context.colno)) ? Number(context.colno) : 0;
  const fingerprintSource = [
    key,
    name,
    message,
    cause,
    source,
    filename,
    line,
    stack.split('\n')[1] || componentStack.split('\n')[0] || ''
  ].join('|');

  return {
    key,
    name,
    message,
    cause,
    source,
    stage,
    reason,
    resourceType,
    filename,
    line,
    column,
    stack,
    componentStack,
    fingerprint: `err_${hashText(fingerprintSource)}`,
    appVersion: sanitizeDiagnosticText(appVersion, 40) || 'unknown'
  };
};
