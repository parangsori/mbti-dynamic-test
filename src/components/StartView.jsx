import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import ProfileInput from './ProfileInput.jsx';
import ServiceCopyright from './ServiceCopyright.jsx';

function HomeScreenTipCard({
  isStandalone,
  canInstallApp,
  onInstallApp,
  onCopyHomeScreenMigration,
  onImportHomeScreenMigration,
  migrationStatus,
  migrationText,
  onDismiss,
  onHideForever
}) {
  const [expanded, setExpanded] = useState(false);
  const handleGuideClick = () => {
    setExpanded((value) => !value);
  };
  const handleCopyBeforeInstall = () => {
    setExpanded(true);
    onCopyHomeScreenMigration();
  };
  const primaryCopy = isStandalone
    ? '새 앱 아이콘은 기록을 복사한 뒤 홈화면 앱을 다시 추가하면 적용돼요.'
    : '홈화면에 추가하기 전에 기록을 복사하면 앱에서도 이어서 사용할 수 있어요.';
  const title = isStandalone ? '새 앱 아이콘으로 바꿀 수 있어요' : '홈화면에 추가하면 더 편해요';
  const guideCopy = isStandalone
    ? '재설치용 기록을 복사한 뒤 홈화면 앱을 삭제하고, 브라우저에서 todaymbti.com을 다시 추가한 다음 기록을 가져오세요.'
    : '기록 복사를 누른 뒤 홈화면에 추가하고, 홈화면 앱에서 기록 가져오기를 누르면 이어집니다.';

  return (
    <div className="app-surface-secondary w-full px-4 py-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-white/15 bg-white/10 p-1">
          <img src="/app-icon-v173-full.png" alt="" className="h-full w-full rounded-lg object-cover" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-[13px] font-black text-white break-keep">{title}</p>
          <p className="mt-1 text-[12px] leading-relaxed text-cyan-50/90 break-keep">
            {primaryCopy}
          </p>
        </div>
      </div>

      {expanded && (
        <div className="mt-3 rounded-2xl border border-white/10 bg-black/20 px-3 py-3">
          <p className="text-[11px] font-black tracking-[0.14em] text-cyan-100 uppercase">추가 방법</p>
          <div className="mt-2 space-y-1.5 text-[12px] leading-relaxed text-slate-200 break-keep">
            {!isStandalone && (
              <>
                <p>iPhone: Safari 공유 버튼을 누른 뒤 홈 화면에 추가를 선택해요.</p>
                <p>Android: Chrome 메뉴에서 앱 설치 또는 홈 화면에 추가를 선택해요.</p>
              </>
            )}
            <p>{guideCopy}</p>
          </div>
          <div className="mt-3">
            {isStandalone ? (
              <div className="grid gap-2">
                <button
                  type="button"
                  onClick={onCopyHomeScreenMigration}
                  className="w-full rounded-2xl border border-cyan-200/20 bg-cyan-300/[0.12] px-3 py-2.5 text-[12px] font-black text-cyan-50 transition hover:bg-cyan-300/[0.18]"
                >
                  재설치용 기록 복사
                </button>
                <button
                  type="button"
                  onClick={onImportHomeScreenMigration}
                  className="w-full rounded-2xl border border-white/10 bg-white/[0.06] px-3 py-2.5 text-[12px] font-black text-slate-100 transition hover:bg-white/[0.1]"
                >
                  복사한 기록 가져오기
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={onCopyHomeScreenMigration}
                className="w-full rounded-2xl border border-cyan-200/20 bg-cyan-300/[0.12] px-3 py-2.5 text-[12px] font-black text-cyan-50 transition hover:bg-cyan-300/[0.18]"
              >
                홈화면용 기록 복사
              </button>
            )}
          </div>
          {migrationStatus && (
            <p className="mt-2 text-center text-[11px] font-bold text-cyan-100/85 break-keep">
              {migrationStatus === 'copied' && (
                isStandalone
                  ? '기록을 복사했어요. 이제 홈화면 앱을 삭제하고 브라우저에서 다시 추가해도 됩니다.'
                  : '기록을 복사했어요. 홈화면 앱에서 기록 가져오기를 눌러주세요.'
              )}
              {migrationStatus === 'imported' && '기록을 가져왔어요. 이제 이어서 사용할 수 있어요.'}
              {migrationStatus === 'no_data' && '아직 복사할 기록이 없어요. 테스트를 완료한 뒤 다시 시도해주세요.'}
              {migrationStatus === 'copy_failed' && '복사에 실패했어요. 브라우저의 클립보드 권한을 확인해주세요.'}
              {migrationStatus === 'manual_copy' && '브라우저에서 자동 복사가 제한됐어요. 아래 내용을 길게 눌러 전체 선택 후 복사해주세요.'}
              {migrationStatus === 'import_failed' && '가져오지 못했어요. 브라우저에서 먼저 기록 복사를 눌러주세요.'}
            </p>
          )}
          {migrationStatus === 'manual_copy' && migrationText && (
            <div className="mt-3 rounded-2xl border border-amber-200/20 bg-amber-300/[0.08] p-3">
              <textarea
                readOnly
                value={migrationText}
                onFocus={(event) => event.currentTarget.select()}
                onClick={(event) => event.currentTarget.select()}
                aria-label="재설치용 기록 백업 문자열"
                className="h-24 w-full resize-none rounded-xl border border-white/10 bg-slate-950/80 p-3 text-[16px] leading-relaxed text-slate-100 outline-none selection:bg-cyan-300/35"
              />
              <p className="mt-2 text-[10px] font-semibold leading-relaxed text-amber-100/80 break-keep">
                개인 기록이 포함되어 있으니 다른 사람에게 보내지 말고, 재설치가 끝날 때까지만 보관해주세요.
              </p>
            </div>
          )}
        </div>
      )}

      {canInstallApp && !isStandalone && !expanded && (
        <button
          type="button"
          onClick={handleCopyBeforeInstall}
          className="mt-3 w-full rounded-2xl border border-cyan-200/20 bg-cyan-300/[0.12] px-3 py-2.5 text-[12px] font-black text-cyan-50 transition hover:bg-cyan-300/[0.18]"
        >
          홈화면용 기록 복사
        </button>
      )}

      <div className="mt-3 grid grid-cols-[minmax(0,1fr)_auto] gap-2">
        <button
          type="button"
          onClick={canInstallApp ? onInstallApp : handleGuideClick}
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
  isStandalone,
  canInstallApp,
  onInstallApp,
  onCopyHomeScreenMigration,
  onImportHomeScreenMigration,
  homeScreenMigrationStatus,
  homeScreenMigrationText,
  onDismissHomeScreenTip,
  onHideHomeScreenTipForever
}) {
  const hasPersonalization = Boolean(userName || birthDate?.year || birthDate?.month || birthDate?.day || gender);
  const [showPersonalization, setShowPersonalization] = useState(hasPersonalization);

  useEffect(() => {
    if (hasPersonalization) setShowPersonalization(true);
  }, [hasPersonalization]);

  return (
    <motion.div
      key="start"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="flex w-full max-w-[23.5rem] flex-col items-center px-5 pb-8 pt-7 sm:px-6"
    >
      <div className="mb-4 flex flex-col items-center">
        <img
          src="/brand-logo-v173-spaced.png"
          alt="오늘의 MBTI 브랜드 로고"
          className="h-36 w-36 object-contain drop-shadow-[0_18px_45px_rgba(34,211,238,0.18)] min-[390px]:h-40 min-[390px]:w-40"
        />
      </div>
      <h1 className="mb-3 text-center text-[2rem] font-black leading-[1.13] text-white min-[390px]:text-[2.18rem]">
        지금 내 결은 어느 쪽이 더 강할까?
      </h1>
      <p className="text-center text-[15px] font-medium leading-relaxed text-slate-300">
        12문항으로 오늘의 무드와 성향 흐름을
        <br />
        가볍고 재밌게 확인해보세요
      </p>

      <button
        type="button"
        onClick={onStart}
        className="app-button-primary mt-7 w-full max-w-[20rem] px-5 py-4 text-[17px]"
      >
        바로 시작하기
      </button>
      <p className="mt-3 text-center text-[12px] font-medium text-slate-400 break-keep">
        입력 없이 바로 시작할 수 있어요
      </p>

      <section className="app-surface-primary mt-6 w-full overflow-hidden">
        <button
          type="button"
          onClick={() => setShowPersonalization((value) => !value)}
          aria-expanded={showPersonalization}
          aria-controls="start-personalization-panel"
          className="flex min-h-16 w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-white/[0.04]"
        >
          <span className="min-w-0">
            <span className="block text-[14px] font-black text-white">내 결과 더 섬세하게 보기</span>
            <span className="mt-1 block text-[11px] font-medium leading-relaxed text-slate-400 break-keep">
              이름·생년월일·성별은 선택이며 원할 때만 입력해요
            </span>
          </span>
          <span className={`shrink-0 text-[18px] text-cyan-200 transition-transform ${showPersonalization ? 'rotate-180' : ''}`} aria-hidden="true">
            ⌄
          </span>
        </button>

        {showPersonalization && (
          <div id="start-personalization-panel" className="border-t border-white/10 px-4 pb-5 pt-4 sm:px-5">
            <label htmlFor="start-user-name" className="mb-2 block text-[11px] font-black tracking-[0.12em] text-slate-400">
              이름
            </label>
            <div className="relative mb-4 rounded-2xl border border-white/10 bg-white/[0.04] px-3">
              <input
                id="start-user-name"
                value={userName}
                onChange={(event) => onChangeUserName(event.target.value)}
                placeholder="비워도 괜찮아요"
                className="min-h-12 w-full bg-transparent px-2 text-[16px] font-bold text-white outline-none placeholder:text-slate-500"
                maxLength="10"
                onKeyDown={(event) => event.key === 'Enter' && onStart()}
              />
            </div>

            <ProfileInput
              birthDate={birthDate}
              gender={gender}
              onChangeBirthDate={onChangeBirthDate}
              onChangeGender={onChangeGender}
              onClearProfile={onClearProfile}
            />
          </div>
        )}
      </section>

      {showHomeScreenTip && (
        <div className="mt-4 w-full">
          <HomeScreenTipCard
            isStandalone={isStandalone}
            canInstallApp={canInstallApp}
            onInstallApp={onInstallApp}
            onCopyHomeScreenMigration={onCopyHomeScreenMigration}
            onImportHomeScreenMigration={onImportHomeScreenMigration}
            migrationStatus={homeScreenMigrationStatus}
            migrationText={homeScreenMigrationText}
            onDismiss={onDismissHomeScreenTip}
            onHideForever={onHideHomeScreenTipForever}
          />
        </div>
      )}

      <div className="mt-5 grid w-full grid-cols-[minmax(0,1fr)_3rem] gap-2">
        <button
          type="button"
          onClick={onOpenHistory}
          className="min-h-12 rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-[13px] font-bold text-slate-300 transition-colors hover:bg-white/[0.08] hover:text-white"
        >
          나의 기록 &amp; 활동 보기
        </button>
        <button
          type="button"
          onClick={onOpenAccessibility}
          className="inline-flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-slate-400 transition-colors hover:bg-white/[0.08] hover:text-white"
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
          className="mt-4 min-h-10 rounded-full border border-white/5 bg-black/20 px-4 py-2 text-[11px] font-bold text-slate-500 transition-colors hover:text-slate-300"
        >
          Version {versionLabel}
        </button>
      )}
      <ServiceCopyright className="mt-4" />
    </motion.div>
  );
}
