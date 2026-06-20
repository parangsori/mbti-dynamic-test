import { useEffect, useMemo, useState } from 'react';

const SESSION_TOKEN_KEY = 'today_mbti_admin_token';
const RANGES = [
  { key: '1d', label: '오늘' },
  { key: '7d', label: '7일' },
  { key: '30d', label: '30일' }
];
const DASHBOARD_TIME_ZONE = 'Asia/Seoul';
const DASHBOARD_TIME_ZONE_LABEL = '한국 시간(KST)';

const formatNumber = (value) => new Intl.NumberFormat('ko-KR').format(Number(value) || 0);

const formatDuration = (value) => {
  const ms = Number(value) || 0;
  if (!ms) return '0ms';
  if (ms >= 1000) return `${(ms / 1000).toFixed(ms >= 10_000 ? 0 : 1)}초`;
  return `${formatNumber(ms)}ms`;
};

const formatTime = (iso) => {
  if (!iso) return '';
  const formatted = new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: DASHBOARD_TIME_ZONE
  }).format(new Date(iso));
  return `${formatted} KST`;
};

const getStoredToken = () => {
  try {
    return sessionStorage.getItem(SESSION_TOKEN_KEY) || '';
  } catch {
    return '';
  }
};

const storeToken = (token) => {
  try {
    if (token) sessionStorage.setItem(SESSION_TOKEN_KEY, token);
    else sessionStorage.removeItem(SESSION_TOKEN_KEY);
  } catch {}
};

function MetricCard({ label, value, caption, tone = 'default' }) {
  return (
    <section className={`metric-card metric-card-${tone}`}>
      <p>{label}</p>
      <strong>{value}</strong>
      {caption && <span>{caption}</span>}
    </section>
  );
}

function Funnel({ items = [] }) {
  const maxCount = Math.max(...items.map((item) => item.count || 0), 1);

  return (
    <section className="panel">
      <div className="panel-title">
        <div>
          <p>성장 퍼널</p>
          <h2>방문자가 핵심 행동까지 이어지는지</h2>
        </div>
      </div>

      <div className="funnel-list">
        {items.map((item) => {
          const width = Math.max(8, Math.round(((item.count || 0) / maxCount) * 100));
          return (
            <div className="funnel-row" key={item.key}>
              <div className="funnel-meta">
                <span>{item.label}</span>
                <strong>{formatNumber(item.count)}</strong>
              </div>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${width}%` }} />
              </div>
              <p>{item.caption || `${item.rateFromPrevious}% 이전 단계 대비`}</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function InsightList({ eyebrow, title, items = [], getPrimary, getSecondary, emptyText }) {
  return (
    <section className="panel compact">
      <div className="panel-title">
        <div>
          <p>{eyebrow}</p>
          <h2>{title}</h2>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="empty-text">{emptyText}</p>
      ) : (
        <div className="insight-list">
          {items.map((item, index) => (
            <div className="insight-row" key={`${getPrimary(item)}-${index}`}>
              <div>
                <strong>{getPrimary(item)}</strong>
                <span>{getSecondary(item)}</span>
              </div>
              <em>{formatNumber(item.total)}</em>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function ErrorDiagnostics({ items = [] }) {
  return (
    <section className="panel error-panel">
      <div className="panel-title">
        <div>
          <p>오류 진단</p>
          <h2>패치에 필요한 발생 정보</h2>
        </div>
      </div>

      {items.length === 0 ? (
        <p className="empty-text">수집된 클라이언트 오류 이벤트가 없습니다.</p>
      ) : (
        <div className="error-list">
          {items.map((item, index) => {
            const location = item.filename
              ? `${item.filename}${item.line ? `:${item.line}${item.column ? `:${item.column}` : ''}` : ''}`
              : item.path;
            return (
              <article className="error-item" key={`${item.fingerprint}-${index}`}>
                <div className="error-heading">
                  <div>
                    <strong>{item.errorKey}</strong>
                    <span>{item.errorName} · {item.source}</span>
                  </div>
                  <em>{formatNumber(item.total)}건 · {formatNumber(item.actors)}명</em>
                </div>
                <p className="error-message">{item.message}</p>
                {item.cause && <p className="error-cause">원인: {item.cause}</p>}
                <dl className="error-meta">
                  <div><dt>위치</dt><dd>{location || '알 수 없음'}</dd></div>
                  {item.resourceType && <div><dt>리소스</dt><dd>{item.resourceType}</dd></div>}
                  <div><dt>환경</dt><dd>{item.deviceType} · {item.browser} · {item.os}</dd></div>
                  <div><dt>상태</dt><dd>{item.online} · {item.connectionType} · {item.visibilityState}</dd></div>
                  <div><dt>버전</dt><dd>{item.appVersion}</dd></div>
                  <div><dt>최근</dt><dd>{formatTime(item.lastSeen) || '알 수 없음'}</dd></div>
                  <div><dt>지문</dt><dd>{item.fingerprint}</dd></div>
                </dl>
                {item.stack && <pre>{item.stack}</pre>}
                {item.componentStack && <pre>{item.componentStack}</pre>}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

function SessionPerformance({ data }) {
  const summary = data?.summary || {};
  const items = data?.items || [];

  return (
    <section className="panel">
      <div className="panel-title">
        <div>
          <p>서버 세션 성능</p>
          <h2>시작/보정/결과 전환 지연</h2>
        </div>
      </div>

      <dl className="stat-list stat-list-grid">
        <div><dt>시작 평균</dt><dd>{formatDuration(summary.startAvgMs)}</dd></div>
        <div><dt>시작 p95</dt><dd>{formatDuration(summary.startP95Ms)}</dd></div>
        <div><dt>완료 평균</dt><dd>{formatDuration(summary.completeAvgMs)}</dd></div>
        <div><dt>완료 p95</dt><dd>{formatDuration(summary.completeP95Ms)}</dd></div>
        <div><dt>시작 느림</dt><dd>{formatNumber(summary.slowStarts)}</dd></div>
        <div><dt>완료 느림</dt><dd>{formatNumber(summary.slowCompletes)}</dd></div>
        <div><dt>Fallback</dt><dd>{formatNumber(summary.fallbacks)}</dd></div>
        <div><dt>오류</dt><dd>{formatNumber(summary.errors)}</dd></div>
      </dl>

      {items.length === 0 ? (
        <p className="empty-text">아직 서버 세션 성능 이벤트가 없습니다.</p>
      ) : (
        <div className="insight-list">
          {items.slice(0, 8).map((item, index) => {
            const label = item.event === 'session_api_start_ok'
              ? '시작'
              : item.status === 'needs_followup'
                ? '보정 전환'
                : item.event === 'session_api_complete_ok'
                  ? '결과 전환'
                  : item.event === 'session_api_fallback'
                    ? 'Fallback'
                    : '오류';
            const mode = item.displayMode === 'standalone' ? 'PWA' : '브라우저';

            return (
              <div className="insight-row" key={`${item.event}-${item.status}-${item.browser}-${item.os}-${index}`}>
                <div>
                  <strong>{label} · {mode}</strong>
                  <span>{item.deviceType} · {item.browser} · {item.os} · {formatNumber(item.actors)}명</span>
                </div>
                <em>{formatDuration(item.p95Ms || item.avgMs)}</em>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}

function DailyPulse({ daily = [] }) {
  const totalsByDay = daily.reduce((acc, item) => {
    if (!acc[item.day]) acc[item.day] = { day: item.day, pageview: 0, start: 0, complete: 0, share: 0 };
    if (item.event === '$pageview') acc[item.day].pageview += item.count;
    if (item.event === 'start_click') acc[item.day].start += item.count;
    if (item.event === 'complete_test') acc[item.day].complete += item.count;
    if (['share_copy', 'result_image_share', 'result_image_save', 'result_image_text_share'].includes(item.event)) acc[item.day].share += item.count;
    return acc;
  }, {});
  const rows = Object.values(totalsByDay).slice(-7);
  const max = Math.max(...rows.map((item) => item.pageview), 1);

  return (
    <section className="panel">
      <div className="panel-title">
        <div>
          <p>최근 흐름</p>
          <h2>일별 방문과 완료</h2>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="empty-text">아직 표시할 일별 데이터가 없습니다.</p>
      ) : (
        <div className="daily-list">
          {rows.map((item) => (
            <div className="daily-row" key={item.day}>
              <span>{item.day.slice(5)}</span>
              <div className="daily-bar-track">
                <div className="daily-bar-fill" style={{ width: `${Math.max(6, Math.round((item.pageview / max) * 100))}%` }} />
              </div>
              <strong>{formatNumber(item.complete)} 완료</strong>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function TokenFallback({ tokenInput, setTokenInput, onSave }) {
  return (
    <section className="auth-panel">
      <p className="eyebrow">Local fallback</p>
      <h2>Cloudflare Access 뒤에서는 이 입력이 보통 필요 없습니다.</h2>
      <p>
        로컬 개발 또는 비상 접근용 토큰이 설정된 경우에만 사용하세요. 토큰은 이 탭의 sessionStorage에만 저장됩니다.
      </p>
      <div className="token-form">
        <input
          autoComplete="off"
          inputMode="text"
          placeholder="관리자 토큰"
          type="password"
          value={tokenInput}
          onChange={(event) => setTokenInput(event.target.value)}
        />
        <button type="button" onClick={onSave}>적용</button>
      </div>
    </section>
  );
}

export default function App() {
  const [range, setRange] = useState('1d');
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [tokenInput, setTokenInput] = useState(getStoredToken);
  const [tokenVersion, setTokenVersion] = useState(0);
  const [refreshVersion, setRefreshVersion] = useState(0);

  const summary = metrics?.summary || {};
  const lastUpdated = useMemo(() => formatTime(metrics?.generatedAt), [metrics?.generatedAt]);
  const isRefreshing = status === 'loading' && Boolean(metrics);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setStatus('loading');
      setError('');

      const token = getStoredToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        const response = await fetch(`/api/admin/metrics?range=${range}&refresh=${Date.now()}`, {
          cache: 'no-store',
          headers,
          signal: controller.signal
        });
        const body = await response.json().catch(() => ({}));

        if (!response.ok) {
          const message = body?.error || 'metrics_load_failed';
          throw new Error(message);
        }

        setMetrics(body);
        setStatus('ready');
      } catch (loadError) {
        if (controller.signal.aborted) return;
        setStatus('error');
        setError(loadError.message || 'metrics_load_failed');
      }
    };

    load();

    return () => controller.abort();
  }, [range, tokenVersion, refreshVersion]);

  useEffect(() => {
    const refreshTimer = window.setInterval(() => {
      setRefreshVersion((value) => value + 1);
    }, 60_000);

    return () => window.clearInterval(refreshTimer);
  }, []);

  const refreshMetrics = () => {
    setRefreshVersion((value) => value + 1);
  };

  const applyToken = () => {
    storeToken(tokenInput.trim());
    setTokenVersion((value) => value + 1);
  };

  const clearToken = () => {
    setTokenInput('');
    storeToken('');
    setTokenVersion((value) => value + 1);
  };

  const isAccessError = ['access_required', 'access_denied', 'token_required', 'token_denied', 'admin_auth_not_configured'].includes(error);

  return (
    <main className="shell">
      <header className="hero">
        <p className="eyebrow">오늘의 MBTI 운영</p>
        <h1>모바일 대시보드</h1>
        <p>PostHog 원천 데이터를 {DASHBOARD_TIME_ZONE_LABEL} 기준 운영 숫자로 요약합니다.</p>
        <div className="refresh-row">
          <span>PostHog 반영은 보통 약간 지연될 수 있습니다.</span>
          <button type="button" onClick={refreshMetrics} disabled={isRefreshing}>
            {isRefreshing ? '갱신 중' : '새로고침'}
          </button>
        </div>
        <div className="range-tabs" aria-label="조회 기간">
          {RANGES.map((item) => (
            <button
              className={range === item.key ? 'active' : ''}
              key={item.key}
              type="button"
              onClick={() => setRange(item.key)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {status === 'loading' && !metrics && (
        <section className="state-card">
          <strong>지표를 불러오는 중입니다.</strong>
          <p>PostHog 집계 쿼리를 확인하고 있어요.</p>
        </section>
      )}

      {status === 'error' && (
        <section className="state-card state-error">
          <strong>대시보드를 불러오지 못했습니다.</strong>
          <p>{isAccessError ? 'Cloudflare Access 인증 또는 관리자 토큰 설정을 확인해주세요.' : 'PostHog 설정이나 네트워크 상태를 확인해주세요.'}</p>
          <code>{error}</code>
        </section>
      )}

      {isAccessError && (
        <TokenFallback tokenInput={tokenInput} setTokenInput={setTokenInput} onSave={applyToken} />
      )}

      {getStoredToken() && (
        <button className="text-button" type="button" onClick={clearToken}>
          이 탭의 fallback 토큰 지우기
        </button>
      )}

      {metrics && (
        <>
          <section className="summary-grid">
            <MetricCard label="방문자" value={formatNumber(summary.visitors)} caption={`${formatNumber(summary.pageviews)} 페이지뷰`} />
            <MetricCard label="시작률" value={`${summary.visitors ? Math.round((summary.startActors / summary.visitors) * 100) : 0}%`} caption={`${formatNumber(summary.starts)}회 시작`} tone="blue" />
            <MetricCard label="완료율" value={`${summary.completionRate || 0}%`} caption={`${formatNumber(summary.completions)}회 완료`} tone="green" />
            <MetricCard label="공유율" value={`${summary.shareRate || 0}%`} caption={`${formatNumber(summary.shares)}회 공유/저장`} tone="pink" />
            <MetricCard label="홈화면 실행" value={formatNumber(summary.standaloneOpens)} caption={`${formatNumber(summary.standaloneActors)}명 기준`} tone="blue" />
            <MetricCard label="오류" value={formatNumber(summary.clientErrors)} caption={`${formatNumber(summary.clientErrorActors)}명 영향`} tone={summary.clientErrors ? 'red' : 'green'} />
          </section>

          <Funnel items={metrics.funnel} />

          <section className="split-grid">
            <section className="panel compact">
              <div className="panel-title">
                <div>
                  <p>공유 행동</p>
                  <h2>결과 확산 신호</h2>
                </div>
              </div>
              <dl className="stat-list">
                <div><dt>텍스트 복사</dt><dd>{formatNumber(metrics.sharing?.copies)}</dd></div>
                <div><dt>이미지 공유</dt><dd>{formatNumber(metrics.sharing?.imageShares)}</dd></div>
                <div><dt>이미지 저장</dt><dd>{formatNumber(metrics.sharing?.imageSaves)}</dd></div>
                <div><dt>텍스트만 공유</dt><dd>{formatNumber(metrics.sharing?.textShares)}</dd></div>
                <div><dt>다운로드 fallback</dt><dd>{formatNumber(metrics.sharing?.downloadFallbacks)}</dd></div>
                <div><dt>저장/공유 실패</dt><dd>{formatNumber(metrics.sharing?.imageSaveFailures)}</dd></div>
              </dl>
            </section>

            <section className="panel compact">
              <div className="panel-title">
                <div>
                  <p>홈화면</p>
                  <h2>재방문 기반</h2>
                </div>
              </div>
              <dl className="stat-list">
                <div><dt>설치 안내</dt><dd>{formatNumber(metrics.install?.prompts)}</dd></div>
                <div><dt>설치 완료</dt><dd>{formatNumber(metrics.install?.accepted)}</dd></div>
                <div><dt>수락률</dt><dd>{metrics.install?.rate || 0}%</dd></div>
                <div><dt>홈화면 실행</dt><dd>{formatNumber(metrics.install?.standaloneOpens)}</dd></div>
                <div><dt>실행자</dt><dd>{formatNumber(metrics.install?.standaloneActors)}</dd></div>
              </dl>
            </section>
          </section>

          <section className="split-grid">
            <InsightList
              eyebrow="위치"
              title="어디서 들어오는지"
              items={metrics.acquisition?.locations || []}
              emptyText="아직 위치 집계 데이터가 없습니다."
              getPrimary={(item) => item.city && item.city !== '알 수 없음' ? `${item.city}, ${item.country}` : item.country}
              getSecondary={(item) => `${formatNumber(item.actors)}명 기준`}
            />
            <InsightList
              eyebrow="기기"
              title="어떤 환경에서 쓰는지"
              items={metrics.acquisition?.devices || []}
              emptyText="아직 기기 집계 데이터가 없습니다."
              getPrimary={(item) => item.deviceType}
              getSecondary={(item) => `${item.browser} · ${item.os} · ${formatNumber(item.actors)}명`}
            />
          </section>

          <section className="split-grid">
            <InsightList
              eyebrow="유입"
              title="어디서 발견되는지"
              items={metrics.acquisition?.referrers || []}
              emptyText="아직 유입 출처 데이터가 없습니다."
              getPrimary={(item) => item.source}
              getSecondary={(item) => `${formatNumber(item.actors)}명 기준`}
            />
          </section>

          <ErrorDiagnostics items={metrics.errors?.items || []} />

          <section className="panel compact">
            <div className="panel-title">
              <div>
                <p>결과 백업</p>
                <h2>Supabase 동기화 상태</h2>
              </div>
            </div>
            <dl className="stat-list stat-list-grid">
              <div><dt>성공</dt><dd>{formatNumber(metrics.sync?.success)}</dd></div>
              <div><dt>실패</dt><dd>{formatNumber(metrics.sync?.failures)}</dd></div>
              <div><dt>미설정/스킵</dt><dd>{formatNumber(metrics.sync?.skipped)}</dd></div>
              <div><dt>성공률</dt><dd>{metrics.sync?.successRate || 0}%</dd></div>
            </dl>
          </section>

          <SessionPerformance data={metrics.sessionPerformance} />

          <DailyPulse daily={metrics.daily} />

          <section className="panel">
            <div className="panel-title">
              <div>
                <p>운영 메모</p>
                <h2>지금 볼 포인트</h2>
              </div>
            </div>
            <div className="note-list">
              {(metrics.notes || []).map((note) => (
                <p key={note}>{note}</p>
              ))}
            </div>
          </section>

          <footer className="footer">
            <p>마지막 갱신: {lastUpdated}</p>
            <p>조회 기간과 일별 흐름은 {DASHBOARD_TIME_ZONE_LABEL} 달력일 기준입니다.</p>
            <p>화면은 60초마다 자동으로 다시 조회됩니다.</p>
            <p>비식별 오류 진단 정보만 표시하며 사용자별 원문 데이터는 노출하지 않습니다.</p>
          </footer>
        </>
      )}
    </main>
  );
}
