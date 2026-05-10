const REQUIRED_PRODUCTION_ENV = [
  'POSTHOG_PERSONAL_API_KEY',
  'POSTHOG_PROJECT_ID',
  'POSTHOG_API_HOST',
  'CLOUDFLARE_ACCESS_AUD',
  'CLOUDFLARE_ACCESS_JWKS_URL'
];

const OPTIONAL_LOCAL_ENV = [
  'ADMIN_DASHBOARD_TOKEN'
];

const isPlaceholder = (value = '') =>
  /your_|replace_|12345|example|placeholder/i.test(value);

const missing = REQUIRED_PRODUCTION_ENV.filter((key) => !process.env[key]);
const placeholders = REQUIRED_PRODUCTION_ENV.filter((key) => process.env[key] && isPlaceholder(process.env[key]));

if (missing.length > 0 || placeholders.length > 0) {
  console.error('Admin dashboard production env is not ready.');
  if (missing.length > 0) console.error(`Missing: ${missing.join(', ')}`);
  if (placeholders.length > 0) console.error(`Placeholder values: ${placeholders.join(', ')}`);
  process.exit(1);
}

if (process.env.ADMIN_DASHBOARD_TOKEN) {
  console.warn(`Local fallback token is set: ${OPTIONAL_LOCAL_ENV.join(', ')}`);
  console.warn('For production, Cloudflare Access should be the primary gate.');
}

console.log('Admin dashboard production env looks ready.');
