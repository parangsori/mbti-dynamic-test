import { QRCodeSVG } from 'qrcode.react';

const SERVICE_URL = 'https://mbti-dynamic-test.vercel.app';
const SERVICE_NAME = '다이나믹 MBTI';

/**
 * 공유 카드 하단에 삽입되는 브랜드 워터마크 + QR 코드
 * ShareCard 내부에서 사용
 */
export default function ShareCardWatermark({ size = 'large' }) {
  const isLarge = size === 'large';

  return (
    <div className={`flex items-center justify-between w-full ${isLarge ? 'mt-6 px-2' : 'mt-3 px-1'}`}>
      <div className="flex items-center gap-3">
        <div className={`rounded-xl bg-gradient-to-br from-brand to-cyan-400 flex items-center justify-center ${isLarge ? 'w-10 h-10' : 'w-7 h-7'}`}>
          <span className={`text-white font-black ${isLarge ? 'text-[11px]' : 'text-[8px]'}`}>MBTI</span>
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
