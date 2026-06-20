import { completeServerSession } from '../../server/session/engine.js';

const CLIENT_ERROR_REASONS = new Set([
  'invalid_token',
  'invalid_session',
  'expired_session',
  'invalid_answers',
  'incomplete_answers',
  'unknown_question',
  'unknown_option'
]);

const sendJson = (res, status, payload) => {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Cache-Control', 'private, no-store');
  res.end(JSON.stringify(payload));
};

const readBody = async (req) => {
  if (req.method !== 'POST') throw new Error('method_not_allowed');
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
};

export default async function handler(req, res) {
  try {
    const body = await readBody(req);
    const result = completeServerSession({
      sessionToken: body.sessionToken,
      answers: body.answers,
      historyData: body.historyData,
      userName: body.userName,
      defaultUserName: body.defaultUserName
    });
    sendJson(res, 200, result);
  } catch (error) {
    if (error.message === 'method_not_allowed') {
      sendJson(res, 405, { error: 'method_not_allowed' });
      return;
    }
    if (CLIENT_ERROR_REASONS.has(error.message)) {
      sendJson(res, 400, { error: error.message });
      return;
    }
    sendJson(res, 500, { error: 'session_complete_failed' });
  }
}
