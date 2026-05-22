import { QRCodeSVG } from 'qrcode.react';
import { SERVICE_NAME, SERVICE_URL } from '../lib/shareCard.js';

/**
 * 공유 카드 하단에 삽입되는 브랜드 워터마크 + QR 코드
 * ShareCard 내부에서 사용
 */
export default function ShareCardWatermark({ size = 'large' }) {
  const isLarge = size === 'large';

  return (
    <div className={`flex items-center justify-between w-full ${isLarge ? 'mt-5 px-2' : 'mt-3 px-1'}`}>
      <div className={`flex min-w-0 items-center ${isLarge ? 'gap-4' : 'gap-3'}`}>
        <div className={`shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-white/10 p-1.5 shadow-[0_14px_30px_rgba(15,23,42,0.3)] ${isLarge ? 'h-[52px] w-[52px]' : 'h-8 w-8'}`}>
          <img src="/service-icon-1024.png" alt="오늘의 MBTI" className="h-full w-full rounded-xl object-cover" />
        </div>
        <div className="min-w-0">
          <p className={`font-black leading-none text-white ${isLarge ? 'text-[24px]' : 'text-[12px]'}`}>{SERVICE_NAME}</p>
          <p className={`mt-2 font-semibold leading-none text-slate-300 ${isLarge ? 'text-[17px]' : 'text-[10px]'}`}>{SERVICE_URL.replace('https://', '')}</p>
        </div>
      </div>
      <div className={`shrink-0 rounded-2xl bg-white p-1.5 shadow-[0_14px_30px_rgba(15,23,42,0.28)] ${isLarge ? 'h-[72px] w-[72px]' : 'h-[48px] w-[48px]'}`}>
        <QRCodeSVG
          value={SERVICE_URL}
          size={isLarge ? 60 : 32}
          bgColor="#ffffff"
          fgColor="#0f172a"
          level="M"
        />
      </div>
    </div>
  );
}
