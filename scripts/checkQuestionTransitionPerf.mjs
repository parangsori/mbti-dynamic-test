import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const [appSource, questionFlowSource, questionViewSource, sessionFlowSource, stylesSource] = await Promise.all([
  readFile(new URL('../src/App.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/lib/questionFlow.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/QuestionView.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/hooks/useSessionFlow.js', import.meta.url), 'utf8'),
  readFile(new URL('../src/styles/index.css', import.meta.url), 'utf8')
]);

const delayMatch = questionFlowSource.match(/QUESTION_TRANSITION_DELAY_MS\s*=\s*(\d+)/);
assert.ok(delayMatch, 'question transition delay must use a shared constant');

const delayMs = Number(delayMatch[1]);
assert.ok(delayMs >= 300 && delayMs <= 450, `question transition delay must stay responsive, received ${delayMs}ms`);

assert.match(appSource, /}, QUESTION_TRANSITION_DELAY_MS\);/, 'server-backed answers must use the shared transition delay');
assert.match(sessionFlowSource, /}, QUESTION_TRANSITION_DELAY_MS\);/, 'local answers must use the shared transition delay');
assert.doesNotMatch(appSource, /key=\{`question-\$\{questionPhase\}-\$\{currIdx\}`\}/, 'question changes must not remount the full QuestionView');
assert.match(appSource, /<QuestionView\s+key="question"/, 'QuestionView must keep a stable outer key during a session');
assert.match(questionViewSource, /<AnimatePresence mode="popLayout">/, 'question card transitions must overlap without duplicating layout space');
assert.match(questionViewSource, /question-progress-shimmer/, 'progress shimmer must use the compositor-friendly class');
assert.match(questionViewSource, /animate=\{\{ scaleX: progress \/ 100 \}\}/, 'progress updates must animate with transform instead of width');
assert.match(appSource, /step === 'question' \? '' : 'animate-blob'/, 'ambient blob motion must pause during the question flow');
assert.match(stylesSource, /@keyframes question-progress-shimmer[\s\S]*translate3d/, 'progress shimmer must animate with transform');

console.log('Question transition performance checks passed.');
