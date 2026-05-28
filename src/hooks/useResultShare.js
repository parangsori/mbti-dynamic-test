import { useState } from 'react';
import { captureError } from '../lib/observability.js';
import { getCanvasBlob, renderShareCardCanvas, shareOrSaveBlob, buildShareText, SERVICE_URL } from '../lib/shareCard.js';

const EVENT_BY_SHARE_STATUS = {
  file_shared: 'result_image_share',
  picker_saved: 'result_image_save',
  download_started: 'result_image_download_fallback',
  text_shared: 'result_image_text_share',
  failed: 'result_image_save_fail'
};

const STATE_BY_SHARE_STATUS = {
  file_shared: 'shared',
  picker_saved: 'saved',
  download_started: 'download_started',
  text_shared: 'text_shared',
  failed: 'failed'
};

const TOAST_BY_SHARE_STATUS = {
  text_shared: '이미지 공유가 안 되어 텍스트만 공유했어요.',
  download_started: '다운로드를 시작했어요. 다운로드 목록이나 파일 앱을 확인해 주세요.',
  failed: '저장/공유가 완료되지 않았어요. 브라우저에서 다시 시도해 주세요.'
};

const buildShareDiagnostics = (capabilities = {}) => ({
  hasNavigatorShare: Boolean(capabilities.hasNavigatorShare),
  hasCanShare: Boolean(capabilities.hasCanShare),
  canShareFile: Boolean(capabilities.canShareFile),
  hasSaveFilePicker: Boolean(capabilities.hasSaveFilePicker),
  displayMode: capabilities.displayMode || 'unknown',
  isTelegram: Boolean(capabilities.isTelegram)
});

export function useResultShare({
  displayName,
  mbti,
  percent,
  shareCardCopy,
  shareCardRef,
  trackEvent
}) {
  const [shareCopied, setShareCopied] = useState(false);
  const [saveImageState, setSaveImageState] = useState('idle');
  const [shareToast, setShareToast] = useState('');

  const handleCopyShare = async () => {
    const shareText = buildShareText({ displayName, hook: shareCardCopy.hook, detail: shareCardCopy.detail, percent });
    const copyText = `${shareText}\n${SERVICE_URL}`;
    try {
      await navigator.clipboard.writeText(copyText);
      setShareCopied(true);
      trackEvent('share_copy', { mbti });
      setTimeout(() => setShareCopied(false), 1800);
    } catch (error) {
      captureError(error, {
        key: 'share_copy_error',
        stage: 'share_copy',
        mbti
      });
      setShareCopied(false);
    }
  };

  const handleSaveImage = async () => {
    if (saveImageState === 'saving') return;
    if (!shareCardRef.current) return;
    setSaveImageState('saving');
    try {
      const canvas = await renderShareCardCanvas(shareCardRef.current);
      const blob = await getCanvasBlob(canvas);
      const filename = `today-mbti-${mbti.toLowerCase()}.png`;
      const result = await shareOrSaveBlob({
        blob,
        filename,
        title: `${displayName}님의 오늘 MBTI 카드`,
        text: shareCardCopy.boast
      });
      const status = result?.status || 'failed';
      const diagnostics = buildShareDiagnostics(result?.capabilities);
      if (status === 'cancelled') {
        setSaveImageState('idle');
        return;
      }

      setSaveImageState(STATE_BY_SHARE_STATUS[status] || 'failed');
      trackEvent(EVENT_BY_SHARE_STATUS[status] || 'result_image_save_fail', {
        mbti,
        mode: status,
        ...diagnostics
      });

      const toast = TOAST_BY_SHARE_STATUS[status] || '';
      if (toast) {
        setShareToast(toast);
        setTimeout(() => setShareToast(''), 5000);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        captureError(error, {
          key: 'share_card_save_error',
          stage: 'share_card_save',
          mbti
        });
        trackEvent('result_image_save_fail', { mbti, mode: 'exception' });
      }
      setSaveImageState('idle');
    } finally {
      setTimeout(() => setSaveImageState('idle'), 1800);
    }
  };

  return {
    handleCopyShare,
    handleSaveImage,
    saveImageState,
    shareCopied,
    shareToast
  };
}
