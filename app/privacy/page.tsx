import Link from "next/link";

export const metadata = { title: "개인정보처리방침 — 베자뷰" };

function H({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontSize: 15.5, fontWeight: 900, marginTop: 28, marginBottom: 8 }}>{children}</h2>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ fontSize: 13.5, color: "var(--ink2)", lineHeight: 1.85, marginTop: 6 }}>{children}</p>;
}

export default function PrivacyPage() {
  const cell: React.CSSProperties = { border: "1px solid var(--line)", padding: "8px 10px", fontSize: 12, lineHeight: 1.6, verticalAlign: "top" };
  const head: React.CSSProperties = { ...cell, background: "var(--chip)", fontWeight: 900, whiteSpace: "nowrap" };
  return (
    <div className="wrap" style={{ maxWidth: 720, paddingTop: 26, paddingBottom: 80 }}>
      <Link href="/" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>← 홈으로</Link>
      <h1 style={{ fontSize: 24, fontWeight: 900, marginTop: 14 }}>개인정보처리방침</h1>
      <p style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 6 }}>시행일: 2026년 8월 1일</p>

      <P>
        주식회사 더제이엠그룹(이하 &quot;회사&quot;)은 베자뷰 서비스 이용자의 개인정보를 「개인정보 보호법」 등 관련 법령에
        따라 안전하게 처리하며, 다음과 같이 개인정보처리방침을 수립·공개합니다.
      </P>

      <H>1. 수집하는 개인정보 항목 및 목적</H>
      <div style={{ overflowX: "auto", marginTop: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 520 }}>
          <thead>
            <tr>
              <th style={head}>구분</th>
              <th style={head}>항목</th>
              <th style={head}>목적</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cell}>회원가입 (필수)</td>
              <td style={cell}>이메일, 비밀번호(암호화 저장), 닉네임</td>
              <td style={cell}>회원 식별, 서비스 제공, 고지사항 전달</td>
            </tr>
            <tr>
              <td style={cell}>리뷰어 활동 (선택)</td>
              <td style={cell}>블로그·SNS 주소 및 공개된 활동 지표</td>
              <td style={cell}>리뷰어 등급 산정, 캠페인 선정 참고</td>
            </tr>
            <tr>
              <td style={cell}>포인트 출금 시 (필수)</td>
              <td style={cell}>성명, 주민등록번호, 예금주·은행·계좌번호</td>
              <td style={cell}>소득세법에 따른 원천징수(3.3%) 및 지급명세서 제출, 출금 이행</td>
            </tr>
            <tr>
              <td style={cell}>사장님 회원 (필수)</td>
              <td style={cell}>업체명, 주소, 연락처, 사업자 관련 정보</td>
              <td style={cell}>업체 등록, 캠페인 운영, 정산</td>
            </tr>
            <tr>
              <td style={cell}>자동 수집</td>
              <td style={cell}>접속 기록, 기기·브라우저 정보, 푸시 알림 토큰</td>
              <td style={cell}>서비스 안정성 확보, 부정이용 방지, 알림 발송</td>
            </tr>
            <tr>
              <td style={cell}>위치정보 (선택)</td>
              <td style={cell}>단말기 위치(GPS)</td>
              <td style={cell}>내 주변 업체 표시, 거리 계산 — 이용자 단말기에서만 처리되며 회사 서버에 저장하지 않습니다</td>
            </tr>
          </tbody>
        </table>
      </div>
      <P>
        주민등록번호는 소득세법 제145조 등 법령에 근거하여 수집하며, AES-256 방식으로 암호화하여 별도 보관하고 세무신고
        목적 외에는 이용하지 않습니다.
      </P>

      <H>2. 보유 및 이용 기간</H>
      <P>
        개인정보는 회원 탈퇴 시 지체 없이 파기합니다. 다만 관련 법령에 따라 다음 정보는 명시된 기간 동안 보존합니다:
        계약·청약철회·대금결제 및 재화 공급 기록 5년(전자상거래법), 원천징수 관련 기록 5년(국세기본법·소득세법),
        소비자 불만·분쟁 처리 기록 3년(전자상거래법), 접속 기록 3개월(통신비밀보호법).
      </P>

      <H>3. 제3자 제공</H>
      <P>
        회사는 원칙적으로 개인정보를 제3자에게 제공하지 않습니다. 다만 ① 원천징수 이행을 위해 국세청 등 관계기관에
        세무신고 정보를 제출하는 경우, ② 이용자가 사전에 동의한 경우, ③ 법령에 따라 요구되는 경우에는 예외로 합니다.
        캠페인 선정 시 사장님 회원에게는 서비스 운영에 필요한 최소한의 정보(닉네임, 리뷰 채널, 채팅)만 공개됩니다.
      </P>

      <H>4. 처리 위탁 및 국외 이전</H>
      <div style={{ overflowX: "auto", marginTop: 8 }}>
        <table style={{ borderCollapse: "collapse", width: "100%", minWidth: 520 }}>
          <thead>
            <tr>
              <th style={head}>수탁업체</th>
              <th style={head}>국가</th>
              <th style={head}>업무 내용</th>
              <th style={head}>보유 기간</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={cell}>Supabase Inc.</td>
              <td style={cell}>싱가포르</td>
              <td style={cell}>데이터베이스·회원 인증 인프라 운영</td>
              <td style={cell}>회원 탈퇴 또는 위탁계약 종료 시까지</td>
            </tr>
            <tr>
              <td style={cell}>Vercel Inc.</td>
              <td style={cell}>싱가포르·미국</td>
              <td style={cell}>웹 서비스 호스팅</td>
              <td style={cell}>위탁계약 종료 시까지</td>
            </tr>
          </tbody>
        </table>
      </div>
      <P>서비스 특성상 위 업체의 해외 서버에 개인정보가 저장되며, 이용자는 회원가입 시 이에 동의한 것으로 봅니다.</P>

      <H>5. 파기 절차 및 방법</H>
      <P>
        보유 기간이 경과하거나 처리 목적이 달성된 개인정보는 지체 없이 파기합니다. 전자적 파일은 복구할 수 없는 방법으로
        영구 삭제하며, 출력물은 분쇄 또는 소각합니다.
      </P>

      <H>6. 이용자의 권리</H>
      <P>
        이용자는 언제든지 자신의 개인정보에 대한 열람·정정·삭제·처리정지를 요구할 수 있으며, 마이페이지에서 직접
        수정하거나 회원 탈퇴할 수 있습니다. 요청은 고객센터(1666-0464, help@vejaview.com)로도 가능합니다.
      </P>

      <H>7. 안전성 확보 조치</H>
      <P>
        비밀번호 및 주민등록번호 암호화 저장, 데이터베이스 접근 제어(행 수준 보안), 통신 구간 암호화(HTTPS), 관리자 접근
        권한 최소화 등의 조치를 시행하고 있습니다.
      </P>

      <H>8. 쿠키 및 유사 기술</H>
      <P>
        서비스는 로그인 상태 유지를 위해 브라우저 저장소(쿠키·로컬스토리지)를 사용합니다. 이용자는 브라우저 설정을 통해
        저장을 거부할 수 있으나, 이 경우 로그인이 필요한 기능 이용이 제한될 수 있습니다.
      </P>

      <H>9. 개인정보 보호책임자</H>
      <P>
        보호책임자: 이정목 (대표이사) · 연락처: 1666-0464 · 이메일: help@vejaview.com
        <br />
        기타 개인정보 침해 신고·상담은 개인정보침해신고센터(118), 개인정보분쟁조정위원회(1833-6972)에 문의할 수 있습니다.
      </P>

      <H>10. 고지 의무</H>
      <P>이 방침의 내용이 변경되는 경우 시행 7일 전부터 서비스 내 공지사항을 통해 알립니다.</P>

      <div style={{ marginTop: 34, background: "var(--chip)", borderRadius: 14, padding: "14px 16px", fontSize: 12, color: "var(--ink2)", lineHeight: 1.8 }}>
        주식회사 더제이엠그룹 · 대표이사 이정목 · 사업자등록번호 352-87-00902
        <br />
        서울특별시 서초구 방배동 451-24 현성빌딩 3층 · 고객센터 1666-0464 · help@vejaview.com
      </div>
      <div style={{ marginTop: 12, fontSize: 12.5 }}>
        <Link href="/terms" style={{ fontWeight: 800, color: "var(--brand-dark)", textDecoration: "underline" }}>
          이용약관 보기 →
        </Link>
      </div>
    </div>
  );
}
