import { useEffect, useMemo, useState } from 'react';

const SESSION_TOKEN_KEY = 'today_mbti_admin_token';
const RANGES = [
  { key: '1d', label: '오늘' },
  { key: '7d', label: '7일' },
  { key: '30d', label: '30일' }
];

const formatNumber = (value) => new Intl.NumberFormat('ko-KR').format(Number(value) || 0);

const formatTime = (iso) => {
  if (!iso) return '';
  return new Intl.DateTimeFormat('ko-KR', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(iso));
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
          <h2>어디까지 이어지는지</h2>
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
              <p>{item.rateFromPrevious}% 이전 단계 대비</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function DailyPulse({ daily = [] }) {
  const totalsByDay = daily.reduce((acc, item) => {
    if (!acc[item.day]) acc[item.day] = { day: item.day, pageview: 0, start: 0, complete: 0, share: 0 };
    if (item.event === '$pageview') acc[item.day].pageview += item.count;
    if (item.event === 'start_click') acc[item.day].start += item.count;
    if (item.event === 'complete_test') acc[item.day].complete += item.count;
    if (['share_copy', 'result_image_share', 'result_image_save'].includes(item.event)) acc[item.day].share += item.count;
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
  const [range, setRange] = useState('7d');
  const [metrics, setMetrics] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [tokenInput, setTokenInput] = useState(getStoredToken);
  const [tokenVersion, setTokenVersion] = useState(0);

  const summary = metrics?.summary || {};
  const lastUpdated = useMemo(() => formatTime(metrics?.generatedAt), [metrics?.generatedAt]);

  useEffect(() => {
    const controller = new AbortController();

    const load = async () => {
      setStatus('loading');
      setError('');

      const token = getStoredToken();
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      try {
        const response = await fetch(`/api/admin/metrics?range=${range}`, {
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
  }, [range, tokenVersion]);

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
        <p>PostHog 원천 데이터를 운영 판단용 숫자로만 요약합니다.</p>
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
            <MetricCard label="방문" value={formatNumber(summary.pageviews)} caption={`${formatNumber(summary.visitors)}명 기준`} />
            <MetricCard label="시작" value={formatNumber(summary.starts)} caption="테스트 시작" tone="blue" />
            <MetricCard label="완료율" value={`${summary.completionRate || 0}%`} caption={`${formatNumber(summary.completions)}회 완료`} tone="green" />
            <MetricCard label="공유율" value={`${summary.shareRate || 0}%`} caption={`${formatNumber(summary.shares)}회 공유/저장`} tone="pink" />
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
              </dl>
            </section>
          </section>

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
            <p>집계 숫자만 표시하며 사용자별 원문 로그는 노출하지 않습니다.</p>
          </footer>
        </>
      )}
    </main>
  );
}
