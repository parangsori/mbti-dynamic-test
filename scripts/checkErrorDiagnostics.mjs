import assert from 'node:assert/strict';
import {
  buildErrorDiagnostics,
  sanitizeDiagnosticText,
  sanitizeErrorFilename,
  sanitizeErrorStack
} from '../src/lib/errorDiagnostics.js';

const sensitiveText = [
  'user@example.com',
  'Bearer secret-token-value-that-should-not-leak',
  '550e8400-e29b-41d4-a716-446655440000',
  'https://todaymbti.com/result?token=private-value',
  '1990-01-02'
].join(' ');
const sanitized = sanitizeDiagnosticText(sensitiveText);

assert.equal(sanitized.includes('user@example.com'), false);
assert.equal(sanitized.includes('secret-token-value'), false);
assert.equal(sanitized.includes('550e8400'), false);
assert.equal(sanitized.includes('?token='), false);
assert.equal(sanitized.includes('1990-01-02'), false);
assert.match(sanitized, /todaymbti\.com\/result/);

assert.equal(
  sanitizeErrorFilename('https://todaymbti.com/assets/build/ResultView.js?token=secret#hash'),
  'todaymbti.com/assets/build/ResultView.js'
);

const stack = sanitizeErrorStack(
  'Error: failed for user@example.com\n' +
  '    at run (https://todaymbti.com/assets/build/app.js?token=secret:10:20)\n' +
  '    at next (https://todaymbti.com/assets/build/vendor.js:30:40)'
);
assert.equal(stack.includes('user@example.com'), false);
assert.equal(stack.includes('?token='), false);
assert.match(stack, /app\.js/);

const createDynamicImportDiagnostics = (cacheKey) => buildErrorDiagnostics({
  error: new Error(`Failed to fetch dynamically imported module: https://todaymbti.com/assets/build/ResultView.js?cache=${cacheKey}`),
  context: {
    key: 'window_error',
    source: 'window.error',
    filename: 'https://todaymbti.com/assets/build/app.js',
    lineno: 10,
    colno: 20,
    componentStack: '\n    at ResultView (https://todaymbti.com/assets/build/ResultView.js:1:2)'
  },
  appVersion: '1.7.3'
});
const first = createDynamicImportDiagnostics(1);
const second = createDynamicImportDiagnostics(2);

assert.equal(first.fingerprint, second.fingerprint);
assert.equal(first.filename, 'todaymbti.com/assets/build/app.js');
assert.equal(first.line, 10);
assert.equal(first.column, 20);
assert.equal(first.appVersion, '1.7.3');
assert.match(first.componentStack, /ResultView/);

const opaqueScriptError = buildErrorDiagnostics({
  error: new Error('Script error.'),
  context: {
    key: 'opaque_script_error',
    source: 'window.error',
    reason: 'browser_opaque_script_error',
    cause: 'Browser hid the original script error details.',
    opaque: true,
    filename: '',
    lineno: 0,
    colno: 0
  },
  appVersion: '1.7.10'
});

assert.equal(opaqueScriptError.key, 'opaque_script_error');
assert.equal(opaqueScriptError.message, 'Script error.');
assert.equal(opaqueScriptError.cause, 'Browser hid the original script error details.');
assert.equal(opaqueScriptError.reason, 'browser_opaque_script_error');
assert.equal(opaqueScriptError.opaque, true);
assert.equal(opaqueScriptError.stack, '');
assert.equal(opaqueScriptError.line, 0);
assert.equal(opaqueScriptError.column, 0);
assert.equal(opaqueScriptError.appVersion, '1.7.10');

console.log('Error diagnostics checks passed.');
