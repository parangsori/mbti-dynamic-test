import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

const GENDER_OPTIONS = [
  { key: 'male', label: '남성' },
  { key: 'female', label: '여성' },
  { key: 'other', label: '기타/선택안함' }
];

const currentYear = new Date().getFullYear();
const YEARS = Array.from({ length: 80 }, (_, i) => currentYear - i);
const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

function getDaysInMonth(year, month) {
  if (!year || !month) return 31;
  return new Date(year, month, 0).getDate();
}

export default function ProfileInput({ birthDate, gender, onChangeBirthDate, onChangeGender, onClearProfile }) {
  const [year, setYear] = useState(birthDate?.year || '');
  const [month, setMonth] = useState(birthDate?.month || '');
  const [day, setDay] = useState(birthDate?.day || '');

  const days = useMemo(() => {
    const maxDay = getDaysInMonth(year, month);
    return Array.from({ length: maxDay }, (_, i) => i + 1);
  }, [year, month]);

  const handleYearChange = (val) => {
    const y = val ? parseInt(val) : '';
    setYear(y);
    const newDate = y && month && day ? { year: y, month, day } : y && month ? { year: y, month, day: '' } : y ? { year: y, month: '', day: '' } : null;
    onChangeBirthDate(newDate);
  };

  const handleMonthChange = (val) => {
    const m = val ? parseInt(val) : '';
    setMonth(m);
    // 일 수 재계산 시 day가 범위 초과하면 리셋
    if (m && year && day) {
      const maxDay = getDaysInMonth(year, m);
      const adjustedDay = day > maxDay ? '' : day;
      setDay(adjustedDay);
      onChangeBirthDate(adjustedDay ? { year, month: m, day: adjustedDay } : { year, month: m, day: '' });
    } else {
      onChangeBirthDate(year ? { year, month: m, day: '' } : null);
    }
  };

  const handleDayChange = (val) => {
    const d = val ? parseInt(val) : '';
    setDay(d);
    if (year && month && d) {
      onChangeBirthDate({ year, month, day: d });
    } else {
      onChangeBirthDate(year && month ? { year, month, day: '' } : year ? { year, month: '', day: '' } : null);
    }
  };

  const hasProfile = Boolean(year || month || day || gender);

  const handleClearProfile = () => {
    setYear('');
    setMonth('');
    setDay('');
    onChangeBirthDate(null);
    onChangeGender('');
    onClearProfile?.();
  };

  const selectBaseClass = "w-full appearance-none rounded-xl border bg-slate-800/60 px-3 py-2.5 text-[13px] font-bold text-white outline-none transition-all focus:ring-2 focus:ring-cyan-400/30";
  const selectActiveClass = "border-cyan-300/30 bg-cyan-900/20";
  const selectIdleClass = "border-white/10 hover:border-white/20";

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="w-full mt-4"
    >
      <div className="rounded-3xl border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5">
        <p className="text-[13px] font-bold text-slate-300 mb-2 text-center">
          입력하시면 오늘 흐름에 더 섬세하게 반영됩니다 <span className="text-slate-500">(선택)</span>
        </p>
        <p className="mb-4 text-center text-[11px] font-medium leading-relaxed text-slate-500 break-keep">
          입력하지 않아도 바로 시작할 수 있어요.
        </p>

        <div className="mb-4">
          <p className="text-[11px] font-bold text-slate-400 mb-2 tracking-wider uppercase">생년월일</p>
          <div className="grid grid-cols-3 gap-2">
            <div className="relative">
              <select
                value={year}
                onChange={(e) => handleYearChange(e.target.value)}
                className={`${selectBaseClass} ${year ? selectActiveClass : selectIdleClass}`}
              >
                <option value="">년</option>
                {YEARS.map((y) => (
                  <option key={y} value={y}>{y}년</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <select
                value={month}
                onChange={(e) => handleMonthChange(e.target.value)}
                className={`${selectBaseClass} ${month ? selectActiveClass : selectIdleClass}`}
                disabled={!year}
              >
                <option value="">월</option>
                {MONTHS.map((m) => (
                  <option key={m} value={m}>{m}월</option>
                ))}
              </select>
            </div>
            <div className="relative">
              <select
                value={day}
                onChange={(e) => handleDayChange(e.target.value)}
                className={`${selectBaseClass} ${day ? selectActiveClass : selectIdleClass}`}
                disabled={!year || !month}
              >
                <option value="">일</option>
                {days.map((d) => (
                  <option key={d} value={d}>{d}일</option>
                ))}
              </select>
            </div>
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

        {hasProfile && (
          <button
            type="button"
            onClick={handleClearProfile}
            className="mt-4 w-full rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-[12px] font-bold text-slate-400 transition-colors hover:bg-white/[0.06] hover:text-white"
          >
            프로필 정보 비우기
          </button>
        )}
      </div>
    </motion.div>
  );
}
