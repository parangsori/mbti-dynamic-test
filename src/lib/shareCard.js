export const SERVICE_URL = 'https://mbti-dynamic-test.vercel.app';
export const SERVICE_NAME = '다이나믹 MBTI';

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
 * - files 지원 환경: 이미지 + 텍스트 + URL 공유
 * - files 미지원 환경 (텔레그램 등): 텍스트 + URL만 공유 시도
 * - 둘 다 안 되면: 파일 저장 fallback
 *
 * 핵심 수정: text에서 URL을 제거하고 url 파라미터에만 넣어 중복 방지
 */
export const shareOrSaveBlob = async ({ blob, filename, title, text }) => {
  const file = typeof File !== 'undefined'
    ? new File([blob], filename, { type: 'image/png' })
    : null;

  // 1차 시도: files(이미지) 포함 공유
  if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({
        title,
        text,
        url: SERVICE_URL,
        files: [file]
      });
      return 'shared';
    } catch (err) {
      if (err.name === 'AbortError') return 'cancelled';
      // files 공유 실패 시 아래 fallback으로
    }
  }

  // 2차 시도: files 없이 텍스트+URL만 공유 (텔레그램 등)
  if (navigator.share) {
    try {
      await navigator.share({
        title,
        text,
        url: SERVICE_URL
      });
      return 'shared';
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
    } catch {
      // fallback to download
    }
  }

  downloadBlob(blob, filename);
  return 'saved';
};

/**
 * 공유 텍스트 생성 (URL은 포함하지 않음 - url 파라미터로 별도 전달)
 */
export const buildShareText = ({ displayName, hook, detail, percent }) => {
  return `${displayName}님의 오늘 결과\n${hook}\n${detail}\n싱크로율 ${percent}%\n\n${SERVICE_NAME}`;
};
