import { useState } from 'react';
import { motion } from 'framer-motion';
import ProfileInput from './ProfileInput.jsx';

function HomeScreenTipCard({
  canInstallApp,
  onInstallApp,
  onDismiss,
  onHideForever
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="mb-5 w-full rounded-[1.4rem] border border-cyan-300/20 bg-cyan-300/[0.08] px-4 py-4 shadow-[0_18px_45px_rgba(8,47,73,0.22)]">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/10 p-1">
          <img src="/service-icon.svg" alt="" className="h-full w-full rounded-lg object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-white break-keep">홈화면에 추가하면 더 편해요</p>
          <p className="mt-1 text-[12px] leading-relaxed text-cyan-50/90 break-keep">
            오늘의 MBTI를 앱처럼 바로 열고, 오늘의 성향 흐름을 빠르게 확인할 수 있어요.
          </p>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
          <p className="text-[11px] font-black tracking-[0.14em] text-cyan-100 uppercase">추가 방법</p>
          <div className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-slate-200 break-keep">
            <p>iPhone: Safari 공유 버튼을 누른 뒤 홈 화면에 추가를 선택해요.</p>
            <p>Android: Chrome 메뉴에서 앱 설치 또는 홈 화면에 추가를 선택해요.</p>
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <button
          type="button"
          onClick={canInstallApp ? onInstallApp : () => setExpanded((value) => !value)}
          className="rounded-2xl border border-cyan-200/20 bg-cyan-300/[0.14] px-3 py-2.5 text-[12px] font-black text-cyan-50 transition hover:bg-cyan-300/[0.2]"
        >
          {canInstallApp ? '앱처럼 추가하기' : expanded ? '방법 접기' : '추가 방법 보기'}
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="rounded-2xl border border-white/10 bg-white/[0.05] px-3 py-2.5 text-[12px] font-bold text-slate-200 transition hover:bg-white/[0.09]"
        >
          닫기
        </button>
      </div>
      <button
        type="button"
        onClick={onHideForever}
        className="mt-2 w-full rounded-2xl px-3 py-2 text-[11px] font-bold text-slate-400 transition hover:bg-white/[0.05] hover:text-slate-200"
      >
        다시 보지 않기
      </button>
    </div>
  );
}

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
  versionLabel,
  showHomeScreenTip,
  canInstallApp,
  onInstallApp,
  onDismissHomeScreenTip,
  onHideHomeScreenTipForever
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
      {showHomeScreenTip && (
        <HomeScreenTipCard
          canInstallApp={canInstallApp}
          onInstallApp={onInstallApp}
          onDismiss={onDismissHomeScreenTip}
          onHideForever={onHideHomeScreenTipForever}
        />
      )}
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
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
          aria-label="설정 열기"
          title="설정"
        >
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className="h-[18px] w-[18px]"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9.7 3.4 10.4 2h3.2l.7 1.4 1.9.8 1.5-.5 2.2 2.2-.5 1.5.8 1.9 1.4.7v3.2l-1.4.7-.8 1.9.5 1.5-2.2 2.2-1.5-.5-1.9.8-.7 1.4h-3.2l-.7-1.4-1.9-.8-1.5.5-2.2-2.2.5-1.5-.8-1.9-1.4-.7V10l1.4-.7.8-1.9-.5-1.5 2.2-2.2 1.5.5 1.9-.8Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
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
