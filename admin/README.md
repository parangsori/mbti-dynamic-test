# 오늘의 MBTI 운영 대시보드

PostHog 데이터를 모바일에서 빠르게 읽기 위한 별도 관리자 앱입니다. 메인 서비스 번들에 관리자 코드를 섞지 않고, 별도 Vercel 프로젝트 또는 별도 서브도메인으로 배포하는 것을 전제로 합니다.

## 보안 구조

- Cloudflare Access가 관리자 도메인을 1차로 보호합니다.
- 서버리스 API는 `CF-Access-Jwt-Assertion`을 검증합니다.
- PostHog 개인 API 키는 서버 환경변수에만 둡니다.
- 프론트에는 사용자별 이벤트 원문이나 PostHog 키를 노출하지 않고, 집계 숫자만 표시합니다.
- Cloudflare Access 설정이 없을 때만 로컬 개발용 `ADMIN_DASHBOARD_TOKEN` fallback을 사용할 수 있습니다.

## 환경변수

Vercel admin 프로젝트에 아래 값을 등록합니다.

```env
POSTHOG_PERSONAL_API_KEY=phx_your_posthog_personal_api_key
POSTHOG_PROJECT_ID=12345
POSTHOG_API_HOST=https://us.posthog.com
CLOUDFLARE_ACCESS_AUD=your_cloudflare_access_audience_tag
CLOUDFLARE_ACCESS_JWKS_URL=https://your-team.cloudflareaccess.com/cdn-cgi/access/certs
```

로컬 fallback 테스트가 필요할 때만 아래를 추가합니다.

```env
ADMIN_DASHBOARD_TOKEN=replace_with_a_long_random_local_token
```

## 배포 메모

1. Vercel에서 새 프로젝트를 만들고 Root Directory를 `admin`으로 지정합니다.
2. 관리자 전용 도메인 `admin.beatblue.net`을 연결합니다.
3. Cloudflare Zero Trust에서 `admin.beatblue.net`을 Access application으로 등록합니다.
4. 허용 이메일 또는 IdP 정책을 설정하고 2FA가 켜진 계정만 접근하도록 운영합니다.
5. PostHog 개인 API 키는 `query:read`에 필요한 최소 권한으로 생성합니다.

배포 체크리스트는 [DEPLOYMENT_CHECKLIST.md](./DEPLOYMENT_CHECKLIST.md)를 기준으로 확인합니다.

## 로컬 확인

```bash
npm install
npm run dev
```

로컬에서 Vercel API 라우트까지 같이 확인하려면 Vercel CLI 기반 dev 서버를 사용하는 편이 정확합니다.

Production 환경변수 준비 여부는 아래 명령으로 확인할 수 있습니다.

```bash
npm run verify:env
```
