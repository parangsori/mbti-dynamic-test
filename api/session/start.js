import { createServerSession } from '../../server/session/engine.js';

const MAX_BODY_BYTES = 16 * 1024;
const VALID_AGE_GROUPS = new Set(['', 'child', 'teen', '20s', '30s', '40s', '50s']);

const sendJson = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.end(JSON.stringify(payload));
};

const createRequestError = (message, statusCode = 400) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const isPlainObject = (value) =>
  Boolean(value) && typeof value === 'object' && !Array.isArray(value);

const readBody = async (req) => {
  if (req.method !== 'POST') throw new Error('method_not_allowed');
  const contentLength = Number(req.headers?.['content-length'] || 0);
  if (contentLength > MAX_BODY_BYTES) {
    throw createRequestError('request_too_large');
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      throw createRequestError('request_too_large');
    }
    chunks.push(chunk);
  }
  const raw = Buffer.concat(chunks).toString('utf8');
  if (!raw) return {};
  try {
    const body = JSON.parse(raw);
    if (!isPlainObject(body)) throw createRequestError('invalid_request_body');
    return body;
  } catch (error) {
    if (error.statusCode) throw error;
    throw createRequestError('invalid_json');
  }
};

const sanitizeRecentSessions = (value) => {
  if (value === undefined) return undefined;
  if (!Array.isArray(value)) throw createRequestError('invalid_recent_sessions');
  return value.slice(0, 12).map((session) => {
    if (!isPlainObject(session)) throw createRequestError('invalid_recent_sessions');
    return session;
  });
};

const sanitizeAgeGroup = (value) => {
  if (value === undefined || value === null) return '';
  if (typeof value !== 'string') throw createRequestError('invalid_age_group');
  const ageGroup = value.trim();
  if (!VALID_AGE_GROUPS.has(ageGroup)) throw createRequestError('invalid_age_group');
  return ageGroup;
};

export default async function handler(req, res) {
  try {
    const body = await readBody(req);
    const session = createServerSession({
      recentSessions: sanitizeRecentSessions(body.recentSessions),
      ageGroup: sanitizeAgeGroup(body.ageGroup)
    });
    sendJson(res, 200, session);
  } catch (error) {
    if (error.message === 'method_not_allowed') {
      sendJson(res, 405, { error: 'method_not_allowed' });
      return;
    }

    if (error.statusCode === 400) {
      sendJson(res, 400, { error: error.message });
      return;
    }

    sendJson(res, 500, { error: 'session_start_failed' });
  }
}
