export const SERVICE_NAME = '오늘의 MBTI';
export const SERVICE_URL = (import.meta.env.VITE_PUBLIC_SERVICE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://todaymbti.com')).replace(/\/+$/, '');

/**
 * 텔레그램 인앱 브라우저 감지
 */
export const isTelegramWebView = () => {
  const ua = navigator.userAgent || '';
  return /telegram/i.test(ua) || /TelegramBot/i.test(ua) || typeof window.TelegramWebviewProxy !== 'undefined';
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
  const canShareFile = (() => {
    if (!file || !hasNavigatorShare || !hasCanShare) return false;
    try {
      return navigator.canShare({ files: [file] });
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
    hasSaveFilePicker,
    displayMode,
    isTelegram: isTelegramWebView()
  };
};

/**
 * 공유 또는 저장 로직
 * - files 지원 환경: 이미지 + 텍스트 공유
 * - files 미지원 환경: 텍스트 공유, 저장 선택기, 다운로드 fallback 순으로 시도
 * - 자동 다운로드는 실제 저장 완료를 확인할 수 없으므로 download_started로만 반환
 *
 * 핵심: url 파라미터를 사용하지 않고 text에 URL을 직접 포함.
 * 카카오톡은 text + url을 합칠 때 자동으로 줄바꿈을 삽입하므로,
 * url 파라미터를 별도로 전달하면 텍스트 끝에 빈 줄이 생김.
 */
export const shareOrSaveBlob = async ({ blob, filename, title, text }) => {
  const file = typeof File !== 'undefined'
    ? new File([blob], filename, { type: 'image/png' })
    : null;
  const capabilities = getShareCapabilities(file);

  // text에 boast + URL 포함, 후행 공백/개행 완전 제거
  const shareText = (text ? `${text.trim()}\n${SERVICE_URL}` : SERVICE_URL).replace(/[\s\n]+$/, '');

  // 1차 시도: files(이미지) 포함 공유
  if (file && capabilities.canShareFile) {
    try {
      await navigator.share({
        title,
        text: shareText,
        files: [file]
      });
      return { status: 'file_shared', capabilities };
    } catch (err) {
      if (err.name === 'AbortError') return { status: 'cancelled', capabilities };
    }
  }

  // 2차 시도: files 없이 텍스트만 공유 (files 자체 미지원 환경)
  if (capabilities.hasNavigatorShare) {
    try {
      await navigator.share({
        title,
        text: shareText
      });
      return { status: 'text_shared', capabilities };
    } catch (err) {
      if (err.name === 'AbortError') return { status: 'cancelled', capabilities };
      // 공유 자체 실패 시 파일 저장 fallback
    }
  }

  // 3차: 파일 저장
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
