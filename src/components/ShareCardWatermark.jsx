import { QRCodeSVG } from 'qrcode.react';
import { SERVICE_NAME, SERVICE_URL } from '../lib/shareCard.js';

/**
 * 공유 카드 하단에 삽입되는 브랜드 워터마크 + QR 코드
 * ShareCard 내부에서 사용
 */
export default function ShareCardWatermark({ size = 'large' }) {
  const isLarge = size === 'large';

  return (
    <div className={`flex items-center justify-between w-full ${isLarge ? 'mt-6 px-2' : 'mt-3 px-1'}`}>
      <div className="flex items-center gap-3">
        <div className={`overflow-hidden rounded-xl border border-white/15 bg-white/10 p-1 shadow-[0_12px_28px_rgba(15,23,42,0.28)] ${isLarge ? 'h-10 w-10' : 'h-7 w-7'}`}>
          <img src="/service-icon-1024.png" alt="오늘의 MBTI" className="h-full w-full rounded-[0.55rem] object-cover" />
        </div>
        <div>
          <p className={`font-black text-white ${isLarge ? 'text-[16px]' : 'text-[11px]'}`}>{SERVICE_NAME}</p>
          <p className={`text-slate-400 ${isLarge ? 'text-[13px]' : 'text-[9px]'}`}>{SERVICE_URL.replace('https://', '')}</p>
        </div>
      </div>
      <div className={`rounded-xl bg-white p-1.5 ${isLarge ? 'w-[72px] h-[72px]' : 'w-[48px] h-[48px]'}`}>
        <QRCodeSVG
          value={SERVICE_URL}
          size={isLarge ? 60 : 36}
          bgColor="#ffffff"
          fgColor="#0f172a"
          level="M"
        />
      </div>
    </div>
  );
}
