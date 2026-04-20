export const renderShareCardCanvas = async (target) => {
  if (!target) throw new Error('공유 카드 대상이 없습니다.');
  const { default: html2canvas } = await import('html2canvas');
  return html2canvas(target, {
    backgroundColor: '#111827',
    scale: 2,
    useCORS: true,
    width: target.offsetWidth,
    height: target.offsetHeight
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

export const shareOrSaveBlob = async ({ blob, filename, title, text }) => {
  const file = typeof File !== 'undefined'
    ? new File([blob], filename, { type: 'image/png' })
    : null;

  if (file && navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
    await navigator.share({ title, text, files: [file] });
    return 'shared';
  }

  if (window.showSaveFilePicker) {
    const handle = await window.showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: 'PNG Image', accept: { 'image/png': ['.png'] } }]
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
    return 'saved';
  }

  downloadBlob(blob, filename);
  return 'saved';
};
