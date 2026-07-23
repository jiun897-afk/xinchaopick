import Link from "next/link";
import Logo from "../../components/Logo";

export const metadata = {
  title: "베자뷰 사장님 입점 안내 — 0원으로 한국인 손님 모으기",
};

export default function PartnerPage() {
  return (
    <>
      <header className="site">
        <div className="wrap hbar">
          <Logo />
          <div className="hcta" style={{ gap: 14 }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--ink3)" }}>
              <b style={{ color: "var(--ink)" }}>한국어</b> ·{" "}
              <a href="/doitac.html" style={{ textDecoration: "underline" }}>
                Tiếng Việt
              </a>
            </span>
            <a className="btn pri" href="#contact">
              무료 입점 문의
            </a>
          </div>
        </div>
      </header>

      <div className="hero">
        <div className="wrap">
          <div className="launch">100% 무료 — 입점비·월비용·수수료 없음</div>
          <h1>
            다낭의 우리 가게,
            <br />
            <em>한국인 손님</em>으로 채워보세요
          </h1>
          <div className="sub">
            베자뷰는 가게와 한국인 리뷰어를 연결해요. 리뷰어가 직접 방문해 체험하고
            <br />
            네이버 블로그·유튜브·인스타그램에 진짜 후기를 올립니다 — 한국 손님들이 여행 전에 검색하는 바로 그곳에요.
          </div>
          <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
            <a className="btn pri" style={{ padding: "13px 24px", fontSize: 15 }} href="#contact">
              입점 문의하기 — 0원
            </a>
            <a className="btn ghost" style={{ padding: "12px 22px", fontSize: 15 }} href="#how">
              어떻게 진행되나요?
            </a>
          </div>
        </div>
      </div>

      <section className="list" id="how" style={{ paddingBottom: 30 }}>
        <div className="wrap">
          <div className="shead">
            <div>
              <div className="stitle">진행 방법</div>
              <div className="ssub">등록부터 리뷰 발행까지, 전부 앱에서</div>
            </div>
          </div>
          <div className="grid">
            {[
              { n: "1", t: "캠페인 등록 (10분, 셀프)", d: "제공할 체험(식사·시술·투어 등)과 한도, 모집 인원, 가능 날짜를 직접 정해서 올려요. 조건은 전부 사장님이 결정합니다." },
              { n: "2", t: "리뷰어 선정", d: "한국인 리뷰어들이 신청하면, 채널과 활동 이력을 보고 사장님이 직접 고르세요. 노쇼 이력이 있는 리뷰어는 자동으로 걸러집니다." },
              { n: "3", t: "방문 → 리뷰 발행", d: "선정된 리뷰어가 방문해 체험하고(GPS 인증), 7일 안에 리뷰를 발행해 링크를 제출해요. 미제출 시 자동 제재라 이행률이 높아요." },
            ].map((s) => (
              <div key={s.n} style={{ border: "1px solid var(--line)", borderRadius: 18, padding: 24 }}>
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    background: "var(--brand)",
                    color: "#fff",
                    fontWeight: 900,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  {s.n}
                </div>
                <div style={{ fontSize: 16.5, fontWeight: 800, margin: "14px 0 7px" }}>{s.t}</div>
                <p style={{ fontSize: 13.5, color: "var(--ink2)", lineHeight: 1.65 }}>{s.d}</p>
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 16,
              background: "var(--brand-bg)",
              borderRadius: 16,
              padding: "16px 20px",
              fontSize: 13.5,
              color: "var(--brand-dark)",
              fontWeight: 700,
              lineHeight: 1.6,
            }}
          >
            만족한 손님들은 구글맵에도 자연스럽게 리뷰를 남겨요 — 진짜 방문한 손님의 자발적 리뷰라서 가게
            프로필이 안전하고 오래갑니다.
          </div>
        </div>
      </section>

      <section id="contact" style={{ padding: "30px 0 80px" }}>
        <div className="wrap">
          <div
            style={{
              background: "linear-gradient(135deg,#2A2118,#3A2A1C)",
              borderRadius: 24,
              padding: "40px 36px",
              color: "#fff",
            }}
          >
            <h2 style={{ fontSize: 25, fontWeight: 900, lineHeight: 1.4 }}>
              지금 입점 문의하세요 — <em style={{ fontStyle: "normal", color: "#FFB27A" }}>다낭 전 업종 무료</em>
            </h2>
            <p style={{ fontSize: 14, color: "#D8CFC4", marginTop: 10, lineHeight: 1.7 }}>
              식당·스파·네일·카페·투어·숙소·스냅 모두 가능해요. 문의 주시면 등록 방법을 한국어로 안내해드립니다.
            </p>
            <div style={{ display: "flex", gap: 22, marginTop: 22, flexWrap: "wrap", fontSize: 14.5, fontWeight: 800 }}>
              <span>전화 1666-0464 (평일 10–18시)</span>
              <span>카카오톡 채널 @베자뷰</span>
              <span>help@bejaview.com</span>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
