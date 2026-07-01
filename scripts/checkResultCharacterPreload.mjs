import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { TYPE_CHARACTER_META } from '../server/product/spiritMeta.js';
import { TYPE_CHARACTER_ASSETS } from '../src/data/typeCharacterAssets.js';

const [appSource, moodRingSource] = await Promise.all([
  readFile(new URL('../src/App.jsx', import.meta.url), 'utf8'),
  readFile(new URL('../src/components/TypeCharacterMoodRing.jsx', import.meta.url), 'utf8')
]);

assert.match(
  appSource,
  /preloadImage\(ANALYSIS_CHARACTER_SRC\)/,
  'the analysis character must start loading before the analysis screen mounts'
);
assert.equal(
  appSource.match(/preloadAnalysisCharacter\(\);/g)?.length,
  1,
  'a new server-backed session must preload the analysis character'
);
assert.match(
  appSource,
  /preloadResultAssets\(nextDisplayModel\)/,
  'the server result character must preload as soon as the final result is known'
);
assert.match(
  appSource,
  /preloadResultAssets\(pendingResult\.displayModel\)/,
  'a recovered pending result must preload its result character during app boot'
);
assert.match(
  appSource,
  /Promise\.allSettled\(\[preloadResultView\(\), preloadImage\(characterSrc\)\]\)/,
  'the result view module and character image must preload in parallel during analysis'
);
assert.match(appSource, /width=\{512\}/, 'the analysis character must reserve its intrinsic width');
assert.match(appSource, /height=\{512\}/, 'the analysis character must reserve its intrinsic height');
assert.match(moodRingSource, /decoding="async"/, 'result character decoding must not block rendering');
assert.match(moodRingSource, /fetchPriority="high"/, 'the visible result character must receive high fetch priority');
assert.equal(Object.keys(TYPE_CHARACTER_ASSETS).length, 16, 'all 16 MBTI character assets must remain preloadable');
Object.entries(TYPE_CHARACTER_ASSETS).forEach(([mbti, asset]) => {
  assert.equal(TYPE_CHARACTER_META[mbti]?.asset, asset, `${mbti} metadata must use the shared preload asset path`);
});

console.log('Result character preload checks passed.');
