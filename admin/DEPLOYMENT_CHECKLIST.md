# Admin Dashboard Deployment Checklist

이 체크리스트는 실제 배포 전에 한 번씩 확인하는 운영용 문서입니다. 민감값은 이 문서나 Git에 기록하지 않습니다.

## 1. Vercel 별도 프로젝트

- 새 Vercel 프로젝트를 생성한다.
- GitHub 저장소는 동일하게 연결하되 Root Directory를 `admin`으로 지정한다.
- Framework preset은 Vite로 둔다.
- Build command는 `npm run build`, Output directory는 `dist`를 사용한다.
- 운영 도메인은 메인 서비스와 분리된 `admin.beatblue.net`으로 연결한다.

## 2. Cloudflare Access

- `beatblue.net`을 Cloudflare DNS에 연결한다.
- `admin.beatblue.net` 레코드를 Vercel admin 프로젝트로 연결한다.
- Cloudflare Zero Trust에서 Self-hosted application을 만든다.
- Application domain은 `admin.beatblue.net`으로 지정한다.
- 허용 정책은 운영자 이메일 또는 신뢰 가능한 IdP 그룹만 허용한다.
- 운영자 계정은 IdP 2FA를 켠 상태로만 사용한다.
- Access application의 Audience tag를 `CLOUDFLARE_ACCESS_AUD`로 등록한다.
- Team domain의 JWKS URL을 `CLOUDFLARE_ACCESS_JWKS_URL`로 등록한다.

## 3. Vercel 환경변수

메인 사용자 서비스 프로젝트의 Production 환경에는 이벤트 수집용 값을 등록한다.

- `VITE_POSTHOG_KEY`: PostHog `phc_` Project token
- `VITE_POSTHOG_HOST`: `https://e.beatblue.net`
- `SESSION_MONITORING_SALT`: 시작 요청 관찰 식별자를 만드는 길고 무작위인 서버 전용 값

`SESSION_MONITORING_SALT`에는 `VITE_` prefix를 붙이지 않는다. 값을 추가하거나 교체한 뒤에는 메인 사용자 서비스 프로젝트를 redeploy한다. 이 메인 앱 환경변수만 바뀐 경우 admin 프로젝트 redeploy는 필요하지 않으며, admin 코드가 함께 바뀐 배포에서만 admin 프로젝트도 redeploy한다.

Admin 프로젝트의 Production 환경에는 조회용 서버 값을 등록한다.

- `POSTHOG_PERSONAL_API_KEY`
- `POSTHOG_PROJECT_ID`
- `POSTHOG_API_HOST`
- `CLOUDFLARE_ACCESS_AUD`
- `CLOUDFLARE_ACCESS_JWKS_URL`

주의:

- PostHog personal key는 `VITE_` prefix를 붙이지 않는다.
- `SESSION_MONITORING_SALT`의 실제 값은 로컬 파일, 문서, 채팅, 커밋에 남기지 않는다.
- `phx_` Personal API Key는 admin 서버 전용이며, 메인 사용자 서비스의 `VITE_POSTHOG_KEY`에 넣지 않는다.
- `phc_` Project token은 메인 사용자 서비스의 브라우저 SDK 전용이다.
- `ADMIN_DASHBOARD_TOKEN`은 로컬 fallback용이다. production의 기본 인증 수단으로 쓰지 않는다.
- PostHog personal key는 최소 권한으로 생성한다.

## 4. 배포 전 검증

```bash
npm --prefix admin run build
node admin/scripts/verify-env.mjs
```

서버 환경변수는 Vercel에 있으므로, 실제 production 검증은 Vercel env가 적용된 build/deployment에서 확인한다.

시작 요청 관찰 배포 시에는 메인 사용자 서비스 deployment에서 `SESSION_MONITORING_SALT`가 적용됐는지 확인한다. admin 코드를 변경한 경우에만 별도 admin build/redeploy를 진행한다.

## 5. 배포 후 검증

- Cloudflare Access 로그인 없이 admin 도메인 접근이 차단되는지 확인한다.
- 허용된 운영자 계정으로 접근 가능한지 확인한다.
- 모바일 화면에서 KPI 카드, 퍼널, 공유/설치 지표가 넘치지 않는지 확인한다.
- `/api/admin/metrics?range=7d`가 Cloudflare Access 뒤에서만 정상 응답하는지 확인한다.
- 응답에 사용자별 이벤트 원문, distinct id, 이름, 생년월일이 없는지 확인한다.
- PostHog Installation Health가 6/6 passed인지 확인한다.
- 메인 사용자 서비스 테스트 1회 후 admin 대시보드 수치가 갱신되는지 확인한다.

## 6. 이상 징후 대응

- 401 또는 403: Cloudflare Access 정책, Audience tag, JWKS URL을 확인한다.
- 503: PostHog key/project/env 설정을 확인한다.
- 지표가 0으로만 보임: PostHog project id와 이벤트 수집 project가 같은지 확인한다.
- 메인 서비스 테스트가 admin에 반영되지 않음: 메인 서비스 `VITE_POSTHOG_KEY`가 `phc_` Project token인지, `VITE_POSTHOG_HOST`가 `https://e.beatblue.net`인지, admin `POSTHOG_PERSONAL_API_KEY`가 서버 전용 `phx_` 키인지 확인한다.
- 호출이 느림: 조회 기간을 줄이거나 대시보드 쿼리 수를 줄인다.
