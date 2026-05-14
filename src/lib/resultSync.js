import { ensureAnonymousUser, getSupabaseClient, isSupabaseConfigured } from './supabaseClient.js';

const RESULT_SCHEMA_VERSION = 1;

const safeNumber = (value) => {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const normalizeLocalEntryId = (entry = {}) =>
  entry.localEntryId || entry.createdAt || `${entry.mbti || 'result'}-${entry.date || ''}-${entry.time || ''}`;

const buildResultPayload = ({ entry, scores }) => ({
  local_entry_id: normalizeLocalEntryId(entry),
  mbti_result: entry.mbti || '',
  sync_rate: safeNumber(entry.percent),
  theme_key: entry.themeKey || '',
  variant_key: entry.variantKey || '',
  axes: Array.isArray(entry.axes) ? entry.axes : null,
  scores: scores && typeof scores === 'object' && !Array.isArray(scores) ? scores : null,
  question_context: entry.questionContextSummary && typeof entry.questionContextSummary === 'object'
    ? entry.questionContextSummary
    : null,
  client_created_at: entry.createdAt || new Date().toISOString(),
  schema_version: RESULT_SCHEMA_VERSION,
  source: 'web'
});

const upsertProfile = async ({ client, user, ageGroup }) => {
  const profile = {
    id: user.id,
    is_anonymous: user.is_anonymous !== false,
    age_group: ageGroup || null,
    updated_at: new Date().toISOString()
  };

  const { error } = await client
    .from('profiles')
    .upsert(profile, { onConflict: 'id' });

  if (error) throw error;
};

export const syncResultEntry = async ({ entry, scores, ageGroup = '' }) => {
  if (!isSupabaseConfigured()) {
    return { status: 'skipped', reason: 'not_configured' };
  }

  const client = getSupabaseClient();
  const auth = await ensureAnonymousUser();
  if (!auth.ok) {
    return { status: 'failed', reason: auth.reason, error: auth.error };
  }

  if (ageGroup) {
    await upsertProfile({ client, user: auth.user, ageGroup });
  }

  const payload = {
    ...buildResultPayload({ entry, scores }),
    user_id: auth.user.id,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await client
    .from('test_results')
    .upsert(payload, { onConflict: 'user_id,local_entry_id' })
    .select('id')
    .single();

  if (error) {
    return { status: 'failed', reason: 'result_upsert_error', error };
  }

  return {
    status: 'synced',
    localEntryId: payload.local_entry_id,
    serverId: data?.id || ''
  };
};
