export const SERVICE_NAME = '오늘의 MBTI';
export const SERVICE_URL = (import.meta.env.VITE_PUBLIC_SERVICE_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://mbti-dynamic-test.vercel.app')).replace(/\/+$/, '');

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
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

/**
 * 공유 또는 저장 로직
 * - files 지원 환경: 이미지 + 텍스트 공유
 * - files 미지원 환경 (텔레그램 등): 텍스트만 공유 + 'no_image' 반환
 * - 둘 다 안 되면: 파일 저장 fallback
 *
 * 핵심: url 파라미터를 사용하지 않고 text에 URL을 직접 포함.
 * 카카오톡은 text + url을 합칠 때 자동으로 줄바꿈을 삽입하므로,
 * url 파라미터를 별도로 전달하면 텍스트 끝에 빈 줄이 생김.
 */
export const shareOrSaveBlob = async ({ blob, filename, title, text }) => {
  const file = typeof File !== 'undefined'
    ? new File([blob], filename, { type: 'image/png' })
    : null;

  // text에 boast + URL 포함, 후행 공백/개행 완전 제거
  const shareText = (text ? `${text.trim()}\n${SERVICE_URL}` : SERVICE_URL).replace(/[\s\n]+$/, '');

  // 텔레그램 환경 감지
  const isTelegram = isTelegramWebView();

  // 1차 시도: files(이미지) 포함 공유
  if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title,
        text: shareText,
        files: [file]
      });
      return 'shared';
    } catch (err) {
      if (err.name === 'AbortError') return 'cancelled';
      // files 공유 실패 시 텍스트만 fallback (텔레그램 등)
      if (navigator.share) {
        try {
          await navigator.share({
            title,
            text: shareText
          });
          return 'no_image';
        } catch (err2) {
          if (err2.name === 'AbortError') return 'cancelled';
        }
      }
    }
  }

  // 2차 시도: files 없이 텍스트만 공유 (files 자체 미지원 환경)
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text: shareText
      });
      // 이미지 없이 텍스트만 공유된 경우 (텔레그램 포함)
      return isTelegram ? 'no_image' : 'shared';
    } catch (err) {
      if (err.name === 'AbortError') return 'cancelled';
      // 공유 자체 실패 시 파일 저장 fallback
    }
  }

  // 3차: 파일 저장
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: 'PNG Image', accept: { 'image/png': ['.png'] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return 'saved';
    } catch (err) {
      if (err?.name === 'AbortError') return 'cancelled';
      // fallback to download
    }
  }

  downloadBlob(blob, filename);
  return 'saved';
};

/**
 * 공유 텍스트 생성 (한 줄 결과 복사용 - URL 포함)
 */
export const buildShareText = ({ displayName, hook, detail, percent }) => {
  return `${displayName}님의 오늘 결과\n${hook}\n${detail}\n싱크로율 ${percent}%\n\n${SERVICE_NAME}`;
};
