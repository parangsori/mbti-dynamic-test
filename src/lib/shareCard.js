export const SERVICE_NAME = '오늘의 MBTI';
export const SERVICE_URL = (import.meta.env.VITE_PUBLIC_SERVICE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://todaymbti.com')).replace(/\/+$/, '');

/**
 * 텔레그램 인앱 브라우저 감지
 */
export const isTelegramWebView = () => {
  const ua = navigator.userAgent || '';
  return /telegram/i.test(ua) || /TelegramBot/i.test(ua) || typeof window.TelegramWebviewProxy !== 'undefined';
};

export const isAndroidDevice = () => {
  if (typeof navigator === 'undefined') return false;
  return /android/i.test(navigator.userAgent || '');
};

export const renderShareCardCanvas = async (target) => {
  if (!target) throw new Error('공유 카드 대상이 없습니다.');
  const { default: html2canvas } = await import('html2canvas');

  // scrollHeight를 사용하여 하단 잘림 방지
  const captureHeight = Math.max(target.offsetHeight, target.scrollHeight);

  return html2canvas(target, {
    backgroundColor: '#111827',
    scale: 2,
    useCORS: true,
    width: target.offsetWidth,
    height: captureHeight,
    windowWidth: target.offsetWidth,
    windowHeight: captureHeight
  });
};

export const getCanvasBlob = (canvas) =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('이미지 블롭 생성 실패'));
    }, 'image/png');
  });

export const downloadBlob = (blob, filename) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

export const getShareCapabilities = (file = null) => {
  const hasNavigatorShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';
  const hasCanShare = typeof navigator !== 'undefined' && typeof navigator.canShare === 'function';
  const shareFilePayload = file ? { files: [file] } : null;
  const shareFileWithLinkPayload = file ? { files: [file], url: SERVICE_URL } : null;
  const canShareFile = (() => {
    if (!file || !hasNavigatorShare || !hasCanShare) return false;
    try {
      return navigator.canShare(shareFilePayload);
    } catch {
      return false;
    }
  })();
  const canShareFileWithLink = (() => {
    if (!file || !hasNavigatorShare || !hasCanShare) return false;
    try {
      return navigator.canShare(shareFileWithLinkPayload);
    } catch {
      return false;
    }
  })();
  const hasSaveFilePicker = typeof window !== 'undefined' && typeof window.showSaveFilePicker === 'function';
  const displayMode = (() => {
    if (typeof window === 'undefined') return 'unknown';
    if (window.navigator?.standalone === true) return 'ios_standalone';
    if (window.matchMedia?.('(display-mode: standalone)').matches) return 'standalone';
    if (window.matchMedia?.('(display-mode: minimal-ui)').matches) return 'minimal-ui';
    return 'browser';
  })();

  return {
    hasNavigatorShare,
    hasCanShare,
    canShareFile,
    canShareFileWithLink,
    hasSaveFilePicker,
    displayMode,
    isTelegram: isTelegramWebView(),
    isAndroid: isAndroidDevice()
  };
};

export const shareBlobWithLink = async ({ blob, filename, title, text }) => {
  const file = blob && typeof File !== 'undefined'
    ? new File([blob], filename, { type: 'image/png' })
    : null;
  const capabilities = getShareCapabilities(file);
  const linkShareText = text ? text.trim().replace(/[\s\n]+$/, '') : SERVICE_NAME;

  if (!file || !capabilities.hasNavigatorShare || !capabilities.canShareFileWithLink) {
    return { status: 'share_unavailable', capabilities };
  }

  try {
    await navigator.share({
      title,
      text: linkShareText,
      url: SERVICE_URL,
      files: [file]
    });
    return { status: 'file_link_shared', capabilities };
  } catch (err) {
    if (err.name === 'AbortError') return { status: 'cancelled', capabilities };
    return { status: 'failed', capabilities };
  }
};

export const saveBlobImageOnly = async ({ blob, filename }) => {
  const capabilities = getShareCapabilities();

  if (capabilities.hasSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'PNG Image', accept: { 'image/png': ['.png'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return { status: 'picker_saved', capabilities };
    } catch (err) {
      if (err?.name === 'AbortError') return { status: 'cancelled', capabilities };
      // fallback to download
    }
  }

  try {
    downloadBlob(blob, filename);
    return { status: 'download_started', capabilities };
  } catch {
    return { status: 'failed', capabilities };
  }
};

/**
 * 공유 텍스트 생성 (한 줄 결과 복사용 - URL 포함)
 */
export const buildShareText = ({ displayName, hook, detail, percent }) => {
  return `${displayName}님의 오늘 결과\n${hook}\n${detail}\n싱크로율 ${percent}%\n\n${SERVICE_NAME}`;
};
