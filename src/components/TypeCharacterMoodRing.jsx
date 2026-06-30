import { useId } from 'react';

const SIZE_CONFIG = {
  result: {
    frame: 'h-[10.1rem] w-[10.1rem] min-[390px]:h-[11.4rem] min-[390px]:w-[11.4rem]',
    image: 'h-[88%] w-[88%]',
    ring: 'inset-[4%]',
    ringInner: 'inset-[13%]',
    glow: 'inset-[6%]',
    dot: 'h-2.5 w-2.5'
  },
  share: {
    frame: 'h-[352px] w-[352px]',
    image: 'h-[86%] w-[86%]',
    ring: 'inset-[6%]',
    ringInner: 'inset-[13%]',
    glow: 'inset-[7%]',
    dot: 'h-3 w-3'
  }
};

const RING_THEME = {
  spark: {
    primary: '#fcd34d',
    secondary: '#fb7185',
    soft: 'rgba(252,211,77,0.22)'
  },
  wave: {
    primary: '#5eead4',
    secondary: '#60a5fa',
    soft: 'rgba(94,234,212,0.22)'
  },
  neon: {
    primary: '#67e8f9',
    secondary: '#c084fc',
    soft: 'rgba(103,232,249,0.22)'
  },
  steady: {
    primary: '#6ee7b7',
    secondary: '#cbd5e1',
    soft: 'rgba(110,231,183,0.22)'
  },
  'soft-shift': {
    primary: '#f9a8d4',
    secondary: '#a5b4fc',
    soft: 'rgba(249,168,212,0.22)'
  },
  citrus: {
    primary: '#bef264',
    secondary: '#5eead4',
    soft: 'rgba(190,242,100,0.22)'
  },
  afterglow: {
    primary: '#fda4af',
    secondary: '#fde68a',
    soft: 'rgba(253,164,175,0.22)'
  },
  studio: {
    primary: '#e2e8f0',
    secondary: '#7dd3fc',
    soft: 'rgba(226,232,240,0.2)'
  }
};

function hexToRgba(hex, alpha) {
  const normalized = hex.replace('#', '');
  const value = normalized.length === 3
    ? normalized.split('').map((char) => `${char}${char}`).join('')
    : normalized;
  const numeric = Number.parseInt(value, 16);
  const r = (numeric >> 16) & 255;
  const g = (numeric >> 8) & 255;
  const b = numeric & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

const RING_LAYER_STYLE = {
  backfaceVisibility: 'hidden',
  WebkitBackfaceVisibility: 'hidden',
  contain: 'paint',
  transformOrigin: '50% 50%',
  WebkitTransformOrigin: '50% 50%'
};

const ANIMATED_RING_STYLE = {
  ...RING_LAYER_STYLE,
  willChange: 'transform'
};

export default function TypeCharacterMoodRing({
  imageSrc,
  alt,
  themeClasses,
  themeKey = 'neon',
  size = 'result',
  showGlow = true,
  softInner = true
}) {
  const config = SIZE_CONFIG[size] || SIZE_CONFIG.result;
  const ringTheme = RING_THEME[themeKey] || RING_THEME.neon;
  const exportSafeRing = size === 'share' && !showGlow;
  const idPrefix = useId().replace(/[^a-zA-Z0-9_-]/g, '');
  const gradientId = `type-character-ring-${themeKey}-${size}-${idPrefix}`;
  const highlightGradientId = `type-character-ring-highlight-${themeKey}-${size}-${idPrefix}`;

  return (
    <div className={`relative flex shrink-0 items-center justify-center ${config.frame}`}>
      {showGlow && <div className={`absolute ${config.glow} animate-[pulse_3.2s_ease-in-out_infinite] rounded-full ${themeClasses.haloTop} blur-2xl`} />}
      {exportSafeRing ? (
        <>
          <div
            className={`absolute ${config.ring} rounded-full`}
            style={{
              background: [
                `radial-gradient(circle at 48% 46%, ${hexToRgba(ringTheme.primary, 0.12)} 0%, ${hexToRgba(ringTheme.primary, 0.18)} 55%, ${hexToRgba(ringTheme.primary, 0.1)} 100%)`,
                `linear-gradient(135deg, ${hexToRgba(ringTheme.primary, 0.36)} 0%, ${hexToRgba(ringTheme.secondary, 0.22)} 44%, ${hexToRgba(ringTheme.primary, 0.42)} 74%, ${hexToRgba(ringTheme.secondary, 0.16)} 100%)`
              ].join(', '),
              boxShadow: `0 0 38px ${hexToRgba(ringTheme.primary, 0.16)}`
            }}
          />
          <div
            className={`absolute ${config.ringInner} rounded-full`}
            style={{
              background: `radial-gradient(circle, ${hexToRgba(ringTheme.primary, 0.1)} 0%, rgba(10,16,34,0.8) 48%, rgba(9,15,31,0.92) 100%)`
            }}
          />
          <div
            className={`absolute ${config.ring} rounded-full border-[8px]`}
            style={{
              borderColor: hexToRgba(ringTheme.primary, 0.42),
              boxShadow: `0 0 26px ${hexToRgba(ringTheme.primary, 0.14)}, inset 0 0 18px ${hexToRgba(ringTheme.primary, 0.12)}`
            }}
          />
          <div
            className={`absolute ${config.ringInner} rounded-full border-[5px]`}
            style={{
              borderColor: hexToRgba(ringTheme.primary, 0.2)
            }}
          />
        </>
      ) : (
        <svg
          className="absolute inset-[4%] animate-[spin_18s_linear_infinite] overflow-visible"
          viewBox="0 0 100 100"
          aria-hidden="true"
          style={{
            ...ANIMATED_RING_STYLE,
            filter: `drop-shadow(0 0 18px ${ringTheme.soft})`
          }}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={ringTheme.primary} />
              <stop offset="58%" stopColor={ringTheme.secondary} />
              <stop offset="100%" stopColor={ringTheme.primary} />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="7"
            strokeLinecap="round"
            opacity="0.94"
          />
          <circle
            cx="50"
            cy="50"
            r="34"
            fill="none"
            stroke={ringTheme.primary}
            strokeWidth="3"
            strokeLinecap="round"
            opacity="0.36"
          />
        </svg>
      )}
      {!exportSafeRing && (
        <svg
          className="absolute inset-[4%] animate-[spin_7.8s_linear_infinite] overflow-visible"
          viewBox="0 0 100 100"
          aria-hidden="true"
          style={ANIMATED_RING_STYLE}
        >
          <defs>
            <linearGradient id={highlightGradientId} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor={ringTheme.secondary} stopOpacity="0.18" />
              <stop offset="38%" stopColor={ringTheme.primary} stopOpacity="0.94" />
              <stop offset="72%" stopColor={ringTheme.secondary} stopOpacity="0.52" />
              <stop offset="100%" stopColor={ringTheme.primary} stopOpacity="0.2" />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={`url(#${highlightGradientId})`}
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray="20 244"
            transform="rotate(-92 50 50)"
            opacity="0.88"
            style={{ filter: `drop-shadow(0 0 8px ${ringTheme.primary}) drop-shadow(0 0 16px ${ringTheme.soft})` }}
          />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={ringTheme.secondary}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray="8 256"
            transform="rotate(-68 50 50)"
            opacity="0.28"
          />
        </svg>
      )}
      {!exportSafeRing && (
        <div
          className="absolute inset-[13%] animate-[pulse_3.4s_ease-in-out_infinite] rounded-full border"
          style={{
            borderColor: ringTheme.primary,
            boxShadow: softInner
              ? `0 0 26px ${ringTheme.soft}, inset 0 0 24px ${ringTheme.soft}`
              : undefined
          }}
        />
      )}
      {!exportSafeRing && (
        <span
          className={`absolute right-[18%] top-[20%] rounded-full ${config.dot}`}
          style={{
            backgroundColor: ringTheme.primary,
            boxShadow: `0 0 18px ${ringTheme.primary}`
          }}
        />
      )}
      {imageSrc && (
        <img
          src={imageSrc}
          alt={alt}
          width={512}
          height={512}
          decoding="async"
          fetchPriority="high"
          className={`relative z-10 object-contain drop-shadow-[0_24px_42px_rgba(0,0,0,0.58)] ${config.image}`}
        />
      )}
    </div>
  );
}
