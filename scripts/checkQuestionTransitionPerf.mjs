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
assert.match(appSource, /key=\{`question-\$\{questionPhase\}-\$\{currIdx\}`\}/, 'question changes must preserve the main branch remount boundary');
assert.match(questionViewSource, /<AnimatePresence mode="wait">/, 'question card transitions must preserve the main branch motion sequence');
assert.match(questionViewSource, /question-progress-shimmer/, 'progress shimmer must use the compositor-friendly class');
assert.match(questionViewSource, /animate=\{\{ scaleX: progress \/ 100 \}\}/, 'progress updates must animate with transform instead of width');
assert.match(
  questionViewSource,
  /const completedQuestions = Math\.min\(currIdx \+ \(isTransitioning \? 1 : 0\), totalQuestions\);[\s\S]*const progress = \(completedQuestions \/ totalQuestions\) \* 100;/,
  'progress must count completed answers, not the unanswered current question'
);
assert.match(questionViewSource, /transition=\{\{ duration: 0\.24, ease: 'easeOut' \}\}/, 'progress must use a monotonic tween instead of a bouncing spring');
assert.match(
  questionViewSource,
  /handleCardClick[\s\S]*?triggerSwipeFeedback\(side\);[\s\S]*?setFlyOutSide\(side\);[\s\S]*?onAnswer\(option, 'tap'\)/,
  'tap answers must preserve the main branch directional confirmation motion'
);
assert.match(
  questionViewSource,
  /event\.key === 'ArrowLeft'[\s\S]*?setFlyOutSide\('left'\)[\s\S]*?event\.key === 'ArrowRight'[\s\S]*?setFlyOutSide\('right'\)/,
  'keyboard answers must preserve the main branch directional confirmation motion'
);
assert.match(
  questionViewSource,
  /resolveCardSwipe[\s\S]*?triggerSwipeFeedback\(side\);[\s\S]*?setFlyOutSide\(side\);/,
  'a confirmed swipe must retain its directional flyout feedback'
);
assert.match(
  questionViewSource,
  /currIdx === 0[\s\S]*?setShowWiggle\(true\)/,
  'the first-question swipe onboarding wiggle must remain isolated to Q1'
);
assert.match(
  questionViewSource,
  /key=\{currIdx\}[\s\S]{0,220}initial=\{\{ opacity: 0, x: 56 \* questionDirection \}\}[\s\S]*?exit=\{\{ opacity: 0, x: -56 \* questionDirection \}\}/,
  'question changes must preserve the main branch directional slide'
);
assert.match(questionViewSource, /h-3 w-3/, 'progress markers must use fixed-width slots');
assert.doesNotMatch(questionViewSource, /transition-all duration-300/, 'progress markers must not animate layout width');
assert.doesNotMatch(questionViewSource, /dot-pop/, 'progress markers must not run an overshooting pop animation');
assert.match(appSource, /step === 'question' \? '' : 'animate-blob'/, 'ambient blob motion must pause during the question flow');
assert.match(stylesSource, /@keyframes question-progress-shimmer[\s\S]*translate3d/, 'progress shimmer must animate with transform');

console.log('Question transition performance checks passed.');
