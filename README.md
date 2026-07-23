# 씬짜오PICK (XinchaoPick)

베트남의 모든 체험, 리뷰로 돌려받다.

## 구조 (M1)

- `/` — 홈. 캠페인 목록을 Supabase DB에서 실시간으로 불러옵니다 (연결 전엔 미리보기 데이터)
- `/login` — 이메일 로그인 (매직 링크). 로그인하면 profiles 테이블에 계정 자동 생성
- `/app.html` — 앱 디자인 프로토타입 (46화면)
- `/admin.html` — 관리자 콘솔 목업
- `/doitac.html` — 베트남어 파트너 페이지
- `supabase/schema.sql` — DB 스키마 + 시드 데이터

## 연결 방법

1. Supabase 프로젝트 > SQL Editor > `supabase/schema.sql` 내용 전체 붙여넣고 Run
2. Supabase > Settings > API 에서 Project URL 과 anon public key 복사
3. Vercel > 프로젝트 > Settings > Environment Variables 에 추가:
   - `NEXT_PUBLIC_SUPABASE_URL` = Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` = anon public key
4. Supabase > Authentication > URL Configuration > Site URL 에 배포 주소 입력
5. Vercel > Deployments > 최신 배포 > Redeploy

## 로드맵

M1 로그인+캠페인 목록(현재) → M2 신청·선정·지도 → M3 채팅·자동번역 → M4 미션·검수 → M5 앱 패키징(Capacitor) → M6 출시
