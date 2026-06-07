const port = 9224;
const targetUrl = 'http://127.0.0.1:5173/';
const screenshotPath = '/tmp/type-character-result-verify.png';
const shareCardScreenshotPath = '/tmp/type-character-share-card-verify.png';
const shareCardHtml2CanvasPath = '/tmp/type-character-share-card-html2canvas-verify.png';

const requestJson = async (url) => {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${response.status} ${response.statusText}: ${url}`);
  return response.json();
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

await fetch(`http://127.0.0.1:${port}/json/new?${encodeURIComponent('about:blank')}`, { method: 'PUT' });
const targets = await requestJson(`http://127.0.0.1:${port}/json`);
const pageTarget = targets.find((target) => target.type === 'page' && target.webSocketDebuggerUrl);
if (!pageTarget) throw new Error('No Chrome page target found');
const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
let messageId = 0;
const pending = new Map();

ws.addEventListener('message', (event) => {
  const message = JSON.parse(event.data);
  if (message.id && pending.has(message.id)) {
    const { resolve, reject } = pending.get(message.id);
    pending.delete(message.id);
    if (message.error) reject(new Error(JSON.stringify(message.error)));
    else resolve(message.result || {});
  }
});

await new Promise((resolve, reject) => {
  ws.addEventListener('open', resolve, { once: true });
  ws.addEventListener('error', reject, { once: true });
});

const send = (method, params = {}) => {
  const id = ++messageId;
  ws.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => pending.set(id, { resolve, reject }));
};

await send('Page.enable');
await send('Runtime.enable');
await send('Emulation.setDeviceMetricsOverride', {
  width: 390,
  height: 1200,
  deviceScaleFactor: 2,
  mobile: true
});

await send('Page.navigate', { url: targetUrl });
await sleep(800);

const pendingResult = {
  userName: '대표님',
  scores: { E: 6, I: 1, S: 1, N: 6, T: 1, F: 6, J: 1, P: 6 },
  questionContextSummary: {
    topTag: 'idea',
    topLabel: '가능성',
    topCount: 4,
    total: 12,
    labels: ['가능성', '감정', '표현']
  },
  neutralCount: 0,
  followupCount: 0,
  savedAt: new Date().toISOString()
};

await send('Runtime.evaluate', {
  expression: `
    localStorage.clear();
    localStorage.setItem('mbti_username', '대표님');
    localStorage.setItem('mbti_pending_result', ${JSON.stringify(JSON.stringify(pendingResult))});
  `
});

await send('Page.navigate', { url: targetUrl });
await sleep(3500);

const textResult = await send('Runtime.evaluate', {
  expression: `document.body.innerText`,
  returnByValue: true
});

const imageResult = await send('Page.captureScreenshot', {
  format: 'png',
  captureBeyondViewport: true
});

await import('node:fs').then((fs) => fs.writeFileSync(screenshotPath, Buffer.from(imageResult.data, 'base64')));

await send('Emulation.setDeviceMetricsOverride', {
  width: 1080,
  height: 1080,
  deviceScaleFactor: 1,
  mobile: false
});

const shareCardResult = await send('Runtime.evaluate', {
  expression: `
    (() => {
      const hiddenRoot = document.querySelector('[aria-hidden="true"]');
      if (!hiddenRoot) return { ok: false, reason: 'hidden share card root not found' };
      hiddenRoot.style.position = 'fixed';
      hiddenRoot.style.left = '0px';
      hiddenRoot.style.top = '0px';
      hiddenRoot.style.zIndex = '999999';
      hiddenRoot.style.pointerEvents = 'none';
      hiddenRoot.style.background = '#020617';
      document.documentElement.style.width = '1080px';
      document.documentElement.style.height = '1080px';
      document.body.style.width = '1080px';
      document.body.style.height = '1080px';
      document.body.style.overflow = 'hidden';
      return {
        ok: true,
        text: hiddenRoot.innerText,
        imageCount: hiddenRoot.querySelectorAll('img').length
      };
    })()
  `,
  returnByValue: true
});

await sleep(900);

const shareCardImageResult = await send('Page.captureScreenshot', {
  format: 'png',
  clip: { x: 0, y: 0, width: 1080, height: 1080, scale: 1 }
});

await import('node:fs').then((fs) => fs.writeFileSync(shareCardScreenshotPath, Buffer.from(shareCardImageResult.data, 'base64')));

const html2CanvasResult = await send('Runtime.evaluate', {
  expression: `
    (async () => {
      const hiddenRoot = document.querySelector('[aria-hidden="true"]');
      const cardRoot = hiddenRoot?.firstElementChild;
      if (!cardRoot) return { ok: false, reason: 'share card root not found' };
      const module = await import('/src/lib/shareCard.js');
      const canvas = await module.renderShareCardCanvas(cardRoot);
      return {
        ok: true,
        dataUrl: canvas.toDataURL('image/png')
      };
    })()
  `,
  awaitPromise: true,
  returnByValue: true
});

const html2CanvasDataUrl = html2CanvasResult.result?.value?.dataUrl || '';
if (html2CanvasDataUrl.startsWith('data:image/png;base64,')) {
  await import('node:fs').then((fs) => {
    fs.writeFileSync(
      shareCardHtml2CanvasPath,
      Buffer.from(html2CanvasDataUrl.replace('data:image/png;base64,', ''), 'base64')
    );
  });
}
ws.close();

const bodyText = textResult.result?.value || '';
const shareCard = shareCardResult.result?.value || {};
const shareCardText = shareCard.text || '';
const checks = {
  hasTypeCharacterLabel: bodyText.includes('오늘의 타입 캐릭터'),
  hasExplainer: bodyText.includes('오늘을 조금 더 나답게 보내는 힌트') && bodyText.includes('작은 동행 캐릭터'),
  hasMoodGuide: bodyText.includes('8가지 오늘의 무드') || bodyText.includes('오늘의 무드'),
  hasForbiddenTerm: /수호 정령|정령|요정|영혼|운명|예언|운세|타로/.test(bodyText),
  hasPopo: bodyText.includes('포포') || bodyText.includes('Popo'),
  shareCardVisible: shareCard.ok === true,
  shareCardHasImage: (shareCard.imageCount || 0) > 0,
  shareCardHasTypeCharacterLabel: shareCardText.includes('오늘의 타입 캐릭터'),
  shareCardHasMirrorCopy: shareCardText.includes('마음을 비추는') && shareCardText.includes('곁에서 힌트를 건네는 타입 캐릭터'),
  shareCardHtml2CanvasVisible: html2CanvasResult.result?.value?.ok === true,
  shareCardHasForbiddenTerm: /수호 정령|정령|요정|영혼|운명|예언|운세|타로/.test(shareCardText)
};

console.log(JSON.stringify({ screenshotPath, shareCardScreenshotPath, shareCardHtml2CanvasPath, checks }, null, 2));
