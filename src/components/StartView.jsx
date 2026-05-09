import { motion } from 'framer-motion';
import ProfileInput from './ProfileInput.jsx';

export default function StartView({
  userName,
  onChangeUserName,
  onStart,
  onOpenHistory,
  birthDate,
  gender,
  onChangeBirthDate,
  onChangeGender,
  onClearProfile,
  onOpenAccessibility,
  onOpenVersion,
  versionLabel
}) {
  return (
    <motion.div
      key="start"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="w-full max-w-sm flex flex-col items-center px-6 py-10"
    >
      <div className="mb-6 flex flex-col items-center gap-3">
        <div className="flex h-20 w-20 items-center justify-center overflow-hidden rounded-[1.35rem] border border-white/15 bg-white/10 p-1.5 shadow-[0_20px_55px_rgba(99,102,241,0.3)]">
          <img src="/service-icon.svg" alt="오늘의 MBTI 서비스 아이콘" className="h-full w-full rounded-[1rem] object-cover" />
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-1.5 text-[12px] font-black tracking-[0.18em] text-cyan-100 uppercase">
          오늘의 MBTI
        </span>
      </div>
      <h1 className="text-4xl font-extrabold mb-3 text-center text-white tracking-tight">지금 내 결은 어느 쪽이 더 강할까?</h1>
      <p className="text-slate-300 mb-10 text-center font-medium leading-relaxed">
        12문항으로 오늘의 무드와 성향 흐름을
        <br />
        가볍고 재밌게 확인해보세요
      </p>
      <div className="w-full bg-white/5 p-2 rounded-3xl mb-4 backdrop-blur-xl border border-white/10 relative shadow-inner">
        <input
          value={userName}
          onChange={(event) => onChangeUserName(event.target.value)}
          placeholder="이름은 선택이에요 (비워도 바로 시작)"
          className="w-full bg-transparent text-white placeholder-slate-400 text-center text-xl py-4 outline-none font-bold"
          maxLength="10"
          onKeyPress={(event) => event.key === 'Enter' && onStart()}
          aria-label="이름 입력"
        />
        <div className="absolute inset-x-8 bottom-3 h-[2px] bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50"></div>
      </div>

      {/* M3: Profile Input (생년월일 + 성별) */}
      <ProfileInput
        birthDate={birthDate}
        gender={gender}
        onChangeBirthDate={onChangeBirthDate}
        onChangeGender={onChangeGender}
        onClearProfile={onClearProfile}
      />

      <button
        onClick={onStart}
        className="w-full mt-6 py-5 rounded-3xl font-black text-xl transition-all duration-300 bg-gradient-to-r from-brand to-cyan-500 text-white shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:scale-[1.02] active:scale-[0.98]"
      >
        바로 시작하기
      </button>
      <p className="mt-4 text-[12px] text-slate-400 text-center break-keep">이름과 프로필 없이도 바로 시작할 수 있어요</p>

      <div className="mt-6 flex items-center gap-4">
        <button onClick={onOpenHistory} className="text-sm text-slate-400 underline underline-offset-4 hover:text-white transition-colors">
          🕒 나의 기록 &amp; 활동 보기
        </button>
        <button
          onClick={onOpenAccessibility}
          className="text-sm text-slate-500 hover:text-white transition-colors rounded-full border border-white/10 px-3 py-1"
          aria-label="접근성 설정"
        >
          Aa
        </button>
      </div>

      {versionLabel && (
        <button
          type="button"
          onClick={onOpenVersion}
          className="mt-5 rounded-full border border-white/5 bg-black/20 px-3 py-1 text-[11px] font-bold text-slate-600 transition-colors hover:text-slate-400"
        >
          Version {versionLabel}
        </button>
      )}
    </motion.div>
  );
}
