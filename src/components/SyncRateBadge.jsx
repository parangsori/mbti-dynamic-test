const SIZE_PRESETS = {
  share: {
    shell: 'h-[136px] w-[136px]',
    innerInset: 'inset-[19px]',
    stroke: 6.5,
    contentOffset: '-translate-y-[2px]',
    inner: 'shadow-[inset_0_0_28px_rgba(15,23,42,0.92),0_16px_34px_rgba(15,23,42,0.34)]',
    label: 'text-[13px]',
    value: 'text-[31px]'
  },
  result: {
    shell: 'h-[5.1rem] w-[5.1rem] min-[390px]:h-[5.7rem] min-[390px]:w-[5.7rem]',
    innerInset: 'inset-[0.78rem] min-[390px]:inset-[0.88rem]',
    stroke: 8,
    contentOffset: '',
    inner: 'shadow-[inset_0_0_22px_rgba(15,23,42,0.92),0_12px_26px_rgba(15,23,42,0.32)]',
    label: 'text-[9px] min-[390px]:text-[10px]',
    value: 'text-[22px] min-[390px]:text-[25px]'
  }
};

const RING_THEMES = {
  spark: { glow: '#fbbf24', fill: '#fbbf24', inner: '#fb7185' },
  wave: { glow: '#60a5fa', fill: '#60a5fa', inner: '#2dd4bf' },
  neon: { glow: '#67e8f9', fill: '#67e8f9', inner: '#a78bfa' },
  steady: { glow: '#6ee7b7', fill: '#6ee7b7', inner: '#cbd5e1' },
  'soft-shift': { glow: '#f9a8d4', fill: '#f9a8d4', inner: '#818cf8' },
  citrus: { glow: '#bef264', fill: '#bef264', inner: '#2dd4bf' },
  afterglow: { glow: '#fb7185', fill: '#fb7185', inner: '#facc15' },
  studio: { glow: '#38bdf8', fill: '#38bdf8', inner: '#e2e8f0' }
};

export default function SyncRateBadge({ percent, size = 'result', themeKey = 'neon', className = '' }) {
  const preset = SIZE_PRESETS[size] || SIZE_PRESETS.result;
  const clampedPercent = Math.max(0, Math.min(100, Number(percent) || 0));
  const theme = RING_THEMES[themeKey] || RING_THEMES.neon;
  const radius = 43;
  const circumference = 2 * Math.PI * radius;
  const progressLength = circumference * (clampedPercent / 100);
  const remainingLength = circumference - progressLength;
  const ringGlow = size === 'share' ? 18 : 18;
  const percentTextClass = percent >= 100
    ? size === 'share' ? 'text-[28px]' : 'text-[19px] min-[390px]:text-[22px]'
    : preset.value;

  return (
    <div
      className={`relative shrink-0 rounded-full ${preset.shell} ${className}`}
      aria-label={`싱크로율 ${percent}%`}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          boxShadow: `0 0 ${ringGlow}px ${theme.glow}4d`
        }}
      >
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" aria-hidden="true">
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={size === 'share' ? 'rgba(148,163,184,0.28)' : 'rgba(148,163,184,0.32)'}
            strokeWidth={preset.stroke}
          />
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="none"
            stroke={theme.fill}
            strokeWidth={preset.stroke}
            strokeLinecap="round"
            strokeDasharray={`${progressLength} ${remainingLength}`}
            strokeDashoffset="0"
            transform="rotate(-90 50 50)"
          />
        </svg>
        <div
          className={`absolute ${preset.innerInset} flex flex-col items-center justify-center rounded-full border border-white/10 bg-slate-950/84 text-center backdrop-blur-md ${preset.inner}`}
          style={{
            background: `radial-gradient(circle at 42% 35%, ${theme.inner}38, rgba(15,23,42,0.92) 46%, rgba(2,6,23,0.96) 100%)`
          }}
        >
          <div className={`flex flex-col items-center justify-center ${preset.contentOffset}`}>
            <span className={`font-black leading-none tracking-[-0.02em] text-slate-200 ${preset.label}`}>싱크로율</span>
            <span className={`mt-1 font-black leading-none text-white tabular-nums drop-shadow-[0_8px_20px_rgba(15,23,42,0.7)] ${percentTextClass}`}>
              {percent}%
            </span>
          </div>
        </div>
      </div>
      <div className="absolute inset-[7%] rounded-full border border-white/10" aria-hidden="true"></div>
    </div>
  );
}
