import { useState } from 'react';
import { captureError } from '../lib/observability.js';
import { getCanvasBlob, renderShareCardCanvas, shareOrSaveBlob, buildShareText, SERVICE_URL } from '../lib/shareCard.js';

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
      const mode = await shareOrSaveBlob({
        blob,
        filename,
        title: `${displayName}님의 오늘 MBTI 카드`,
        text: shareCardCopy.boast
      });
      if (mode === 'cancelled') {
        setSaveImageState('idle');
        return;
      }
      setSaveImageState(mode === 'shared' || mode === 'no_image' ? 'shared' : 'saved');
      trackEvent(mode === 'shared' ? 'result_image_share' : 'result_image_save', { mbti, mode });
      if (mode === 'no_image') {
        setShareToast('이미지는 직접 저장 후 첨부해 주세요 (아래 이미지 저장 버튼 사용)');
        setTimeout(() => setShareToast(''), 5000);
      }
    } catch (error) {
      if (error?.name !== 'AbortError') {
        captureError(error, {
          key: 'share_card_save_error',
          stage: 'share_card_save',
          mbti
        });
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
