import { createServerSession } from '../../server/session/engine.js';

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
    const session = createServerSession({
      recentSessions: body.recentSessions,
      ageGroup: body.ageGroup
    });
    sendJson(res, 200, session);
  } catch (error) {
    const reason = error.message === 'method_not_allowed' ? 'method_not_allowed' : 'session_start_failed';
    sendJson(res, reason === 'method_not_allowed' ? 405 : 500, { error: reason });
  }
}
