import posthog from 'posthog-js';

let posthogReady = false;

const canUseBrowser = () => typeof window !== 'undefined';

export const initPostHog = () => {
  if (!canUseBrowser() || posthogReady) return;

  const apiKey = import.meta.env.VITE_POSTHOG_KEY;

  if (!apiKey) return;

  posthog.init(apiKey, {
    api_host: import.meta.env.VITE_POSTHOG_HOST || 'https://us.i.posthog.com',
    defaults: '2026-01-30',
    person_profiles: 'identified_only',
    autocapture: false,
    autocapture_opt_out: true,
    capture_pageview: true,
    capture_pageleave: true
  });

  posthogReady = true;
};

export const capturePostHogEvent = (name, payload = {}) => {
  if (!posthogReady) return;
  posthog.capture(name, payload);
};
