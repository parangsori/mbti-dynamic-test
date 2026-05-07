import { motion } from 'framer-motion';

const AGE_GROUPS = [
  { key: '10s', label: '10대', emoji: '🎒' },
  { key: '20s', label: '20대', emoji: '🎓' },
  { key: '30s', label: '30대', emoji: '💼' },
  { key: '40s', label: '40대+', emoji: '🏡' }
];

const GENDER_OPTIONS = [
  { key: 'male', label: '남성' },
  { key: 'female', label: '여성' },
  { key: 'other', label: '기타/선택안함' }
];

export default function ProfileInput({ ageGroup, gender, onChangeAgeGroup, onChangeGender }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="w-full mt-4"
    >
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
        <p className="text-[13px] font-bold text-slate-300 mb-3 text-center">
          더 맞춤형 결과를 위해 알려주세요 <span className="text-slate-500">(선택)</span>
        </p>

        <div className="mb-4">
          <p className="text-[11px] font-bold text-slate-400 mb-2 tracking-wider uppercase">연령대</p>
          <div className="grid grid-cols-4 gap-2">
            {AGE_GROUPS.map((group) => (
              <button
                key={group.key}
                onClick={() => onChangeAgeGroup(ageGroup === group.key ? '' : group.key)}
                className={`rounded-2xl border px-2 py-2.5 text-center transition-all active:scale-[0.96] ${
                  ageGroup === group.key
                    ? 'border-brand/40 bg-brand/[0.12] text-purple-100 shadow-[0_0_12px_rgba(168,85,247,0.15)]'
                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
                }`}
              >
                <span className="text-[16px]">{group.emoji}</span>
                <p className="mt-0.5 text-[11px] font-bold">{group.label}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold text-slate-400 mb-2 tracking-wider uppercase">성별</p>
          <div className="grid grid-cols-3 gap-2">
            {GENDER_OPTIONS.map((option) => (
              <button
                key={option.key}
                onClick={() => onChangeGender(gender === option.key ? '' : option.key)}
                className={`rounded-2xl border px-2 py-2.5 text-center text-[12px] font-bold transition-all active:scale-[0.96] ${
                  gender === option.key
                    ? 'border-cyan-300/40 bg-cyan-300/[0.12] text-cyan-100'
                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.06]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
