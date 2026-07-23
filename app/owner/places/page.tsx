"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSupabase } from "../../../lib/supabase";
import { PLACE_CATS, PLACE_AREAS, PLACE_DEFAULT_IMG } from "../../../lib/placeCats";
import { useLang, LangToggle, mkT } from "../../../lib/i18n";
import MapPicker from "../../../components/MapPicker";
import PhotoUploader from "../../../components/PhotoUploader";


const VI: Record<string, string> = {
  "← 사장님 센터": "← Trung tâm đối tác",
  "내 업체 관리": "Quản lý cửa hàng",
  "업체를 등록하면 업체 목록에 노출되고, 캠페인도 열 수 있어요 (여러 개 등록 가능)": "Đăng ký cửa hàng để hiển thị trong danh mục và mở chiến dịch (được nhiều cửa hàng)",
  "+ 업체 등록": "+ Đăng ký cửa hàng",
  "로그인 후 이용할 수 있어요.": "Vui lòng đăng nhập để sử dụng.",
  "로그인하기": "Đăng nhập",
  "업체 수정": "Sửa cửa hàng",
  "새 업체 등록": "Đăng ký cửa hàng mới",
  "업체 이름": "Tên cửa hàng",
  "가게 사진 (최대 10장, 첫 장이 대표)": "Ảnh cửa hàng (tối đa 10, ảnh đầu là ảnh đại diện)",
  "사진 추가": "Thêm ảnh",
  "대표": "Đại diện",
  "예: 허벌 스파 다낭": "VD: Herbal Spa Đà Nẵng",
  "업종": "Ngành",
  "세부 업종": "Ngành chi tiết",
  "선택 안 함": "Không chọn",
  "지역": "Khu vực",
  "전화번호 (선택)": "Số điện thoại (tùy chọn)",
  "주소": "Địa chỉ",
  "구글맵 링크 (지도에서 보기 버튼에 사용)": "Link Google Maps (cho nút xem bản đồ)",
  "구글맵에서 가게 검색 → 공유 → 링크 복사해서 붙여넣으면 돼요": "Tìm trên Google Maps → Chia sẻ → Sao chép link rồi dán vào",
  "소개 (선택)": "Giới thiệu (tùy chọn)",
  "위치 찾기": "Tìm vị trí",
  "찾는 중…": "Đang tìm…",
  "주소를 먼저 입력해주세요.": "Vui lòng nhập địa chỉ trước.",
  "주소를 입력하고 위치 찾기를 누르면 지도에 핀이 자동으로 찍혀요": "Nhập địa chỉ rồi bấm Tìm vị trí — ghim sẽ tự động hiển thị trên bản đồ",
  "위치를 찾았어요! 아래 지도에서 확인해주세요.": "Đã tìm thấy! Kiểm tra trên bản đồ bên dưới.",
  "주소를 찾지 못했어요. 베트남어/영문 도로명 주소로 다시 시도해보세요.": "Không tìm thấy địa chỉ. Thử lại với địa chỉ tiếng Việt/tiếng Anh.",
  "위치 검색에 실패했어요. 잠시 후 다시 시도해주세요.": "Tìm vị trí thất bại. Vui lòng thử lại sau.",
  "위치 확인 (확대해서 볼 수 있어요)": "Xác nhận vị trí (có thể phóng to)",
  "가게 소개, 대표 메뉴, 한국어 가능 여부 등": "Giới thiệu, món/dịch vụ tiêu biểu, có nói tiếng Hàn không…",
  "업체 이름을 입력해주세요.": "Vui lòng nhập tên cửa hàng.",
  "로그인이 필요해요.": "Cần đăng nhập.",
  "저장 실패: ": "Lưu thất bại: ",
  "저장 중…": "Đang lưu…",
  "수정 저장": "Lưu chỉnh sửa",
  "업체 등록하기": "Đăng ký cửa hàng",
  "닫기": "Đóng",
  "아직 등록한 업체가 없어요": "Chưa có cửa hàng nào",
  "업체를 등록해야 캠페인을 열 수 있어요.": "Cần đăng ký cửa hàng để mở chiến dịch.",
  "보기": "Xem",
  "수정": "Sửa",
  "음식점": "Nhà hàng",
  "카페·디저트": "Cà phê·Tráng miệng",
  "마사지·스파": "Massage·Spa",
  "병원·의료": "Bệnh viện·Y tế",
  "투어·액티비티": "Tour·Hoạt động",
  "숙소": "Lưu trú",
  "기타": "Khác",
  "한국 음식점": "Món Hàn",
  "로컬 음식점": "Món địa phương",
  "일식·중식": "Món Nhật·Trung",
  "양식·이탈리안": "Món Âu·Ý",
  "해산물": "Hải sản",
  "바비큐·고기": "BBQ·Thịt nướng",
  "카페": "Cà phê",
  "베이커리": "Tiệm bánh",
  "디저트": "Tráng miệng",
  "마사지": "Massage",
  "스파": "Spa",
  "네일": "Nail",
  "헤어·뷰티": "Tóc·Làm đẹp",
  "병원": "Bệnh viện",
  "치과": "Nha khoa",
  "피부과": "Da liễu",
  "약국": "Nhà thuốc",
  "투어": "Tour",
  "액티비티": "Hoạt động",
  "골프": "Golf",
  "스냅사진": "Chụp ảnh",
  "호텔": "Khách sạn",
  "풀빌라": "Pool villa",
  "아파트": "Căn hộ",
  "다낭": "Đà Nẵng",
  "호이안": "Hội An",
  "나트랑": "Nha Trang",
  "푸꾸옥": "Phú Quốc",
  "호치민": "TP.HCM",
  "하노이": "Hà Nội",
};

type Place = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  area: string;
  address: string;
  maps_url: string;
  phone: string;
  description: string;
  image_url: string | null;
  lat: number | null;
  lng: number | null;
  photos: string[] | null;
};

const inp: React.CSSProperties = {
  width: "100%",
  border: "1.5px solid var(--line)",
  borderRadius: 12,
  padding: "12px 14px",
  fontSize: 14,
  fontFamily: "inherit",
  outline: "none",
  background: "#fff",
};
const lbl: React.CSSProperties = { display: "block", fontSize: 12.5, fontWeight: 800, margin: "14px 0 6px" };

const EMPTY = { name: "", category: "음식점", subcategory: "", area: "다낭", address: "", maps_url: "", phone: "", description: "", lat: null as number | null, lng: null as number | null, photos: [] as string[] };

export default function OwnerPlacesPage() {
  const supabase = getSupabase();
  const [lang, setLang] = useLang();
  const t = mkT(lang, VI);
  const [guest, setGuest] = useState(false);
  const [list, setList] = useState<Place[] | null>(null);
  const [form, setForm] = useState<typeof EMPTY & { id?: string }>(EMPTY);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [geoBusy, setGeoBusy] = useState(false);
  const [geoMsg, setGeoMsg] = useState<{ ok: boolean; text: string } | null>(null);

  async function geocode() {
    setGeoMsg(null);
    if (!form.address.trim()) return setGeoMsg({ ok: false, text: t("주소를 먼저 입력해주세요.") });
    setGeoBusy(true);
    const cityMap: Record<string, string> = { "다낭": "Da Nang", "호이안": "Hoi An", "나트랑": "Nha Trang", "푸꾸옥": "Phu Quoc", "호치민": "Ho Chi Minh City", "하노이": "Ha Noi" };
    const q = form.address.trim() + ", " + (cityMap[form.area] ?? "") + ", Vietnam";
    try {
      const r = await fetch("https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" + encodeURIComponent(q), {
        headers: { "Accept-Language": "en" },
      });
      const d = await r.json();
      if (Array.isArray(d) && d[0]) {
        const la = parseFloat(d[0].lat);
        const ln = parseFloat(d[0].lon);
        setForm((f) => ({ ...f, lat: la, lng: ln }));
        setGeoMsg({ ok: true, text: t("위치를 찾았어요! 아래 지도에서 확인해주세요.") });
      } else {
        setGeoMsg({ ok: false, text: t("주소를 찾지 못했어요. 베트남어/영문 도로명 주소로 다시 시도해보세요.") });
      }
    } catch {
      setGeoMsg({ ok: false, text: t("위치 검색에 실패했어요. 잠시 후 다시 시도해주세요.") });
    }
    setGeoBusy(false);
  }

  async function load() {
    if (!supabase) return;
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setGuest(true);
      return;
    }
    const { data } = await supabase.from("places").select("*").eq("owner_id", session.user.id).order("created_at", { ascending: false });
    setList((data as Place[]) ?? []);
  }

  useEffect(() => {
    if (!supabase) {
      setGuest(true);
      return;
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [supabase]);

  function set<K extends keyof typeof EMPTY>(k: K, v: string) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function save() {
    if (!supabase) return;
    setMsg("");
    if (!form.name.trim()) return setMsg(t("업체 이름을 입력해주세요."));
    setBusy(true);
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) {
      setBusy(false);
      return setMsg(t("로그인이 필요해요."));
    }
    const vals = {
      name: form.name.trim(),
      category: form.category,
      subcategory: form.subcategory,
      area: form.area,
      address: form.address.trim(),
      maps_url: form.maps_url.trim(),
      phone: form.phone.trim(),
      description: form.description.trim(),
      image_url: form.photos[0] ?? PLACE_DEFAULT_IMG[form.category] ?? PLACE_DEFAULT_IMG["기타"],
      photos: form.photos,
      lat: form.lat,
      lng: form.lng,
    };
    const { error } = form.id
      ? await supabase.from("places").update(vals).eq("id", form.id)
      : await supabase.from("places").insert({ ...vals, owner_id: session.user.id });
    setBusy(false);
    if (error) return setMsg(t("저장 실패: ") + error.message);
    setForm(EMPTY);
    setOpen(false);
    load();
  }

  return (
    <div className="wrap" style={{ maxWidth: 640, paddingTop: 24, paddingBottom: 90 }}>
      <Link href="/owner" style={{ fontSize: 13, fontWeight: 800, color: "var(--ink3)" }}>
        {t("← 사장님 센터")}
      </Link>
      <span style={{ float: "right", marginTop: 2 }}><LangToggle lang={lang} setLang={setLang} /></span>
      <div style={{ display: "flex", alignItems: "center", marginTop: 10, flexWrap: "wrap", rowGap: 12 }}>
        <div style={{ flex: "1 1 240px", minWidth: 0 }}>
          <h1 style={{ fontSize: 22, fontWeight: 900 }}>{t("내 업체 관리")}</h1>
          <div style={{ fontSize: 12.5, color: "var(--ink3)", marginTop: 3 }}>
            {t("업체를 등록하면 업체 목록에 노출되고, 캠페인도 열 수 있어요 (여러 개 등록 가능)")}
          </div>
        </div>
        <button
          className="btn pri"
          style={{ marginLeft: "auto", padding: "10px 16px", fontSize: 13, flexShrink: 0 }}
          onClick={() => {
            setForm(EMPTY);
            setOpen(true);
          }}
        >
          {t("+ 업체 등록")}
        </button>
      </div>

      {guest && (
        <div style={{ marginTop: 20 }}>
          <div style={{ background: "var(--chip)", borderRadius: 12, padding: "14px 16px", fontSize: 14 }}>{t("로그인 후 이용할 수 있어요.")}</div>
          <Link className="btn pri" style={{ marginTop: 14, padding: "13px 26px" }} href="/login">
            {t("로그인하기")}
          </Link>
        </div>
      )}

      {open && (
        <div style={{ border: "2px solid var(--brand)", borderRadius: 16, padding: "16px 18px", marginTop: 16 }}>
          <div style={{ fontSize: 15, fontWeight: 900 }}>{form.id ? t("업체 수정") : t("새 업체 등록")}</div>

          <label style={lbl}>{t("가게 사진 (최대 10장, 첫 장이 대표)")}</label>
          <PhotoUploader
            photos={form.photos}
            onChange={(urls) => setForm((f) => ({ ...f, photos: urls }))}
            addLabel={t("사진 추가")}
            mainLabel={t("대표")}
          />

          <label style={lbl}>{t("업체 이름")}</label>
          <input style={inp} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={t("예: 허벌 스파 다낭")} />

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>{t("업종")}</label>
              <select
                style={inp}
                value={form.category}
                onChange={(e) => {
                  set("category", e.target.value);
                  set("subcategory", "");
                }}
              >
                {Object.keys(PLACE_CATS).map((c) => (
                  <option key={c} value={c}>{t(c)}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>{t("세부 업종")}</label>
              <select style={inp} value={form.subcategory} onChange={(e) => set("subcategory", e.target.value)}>
                <option value="">{t("선택 안 함")}</option>
                {(PLACE_CATS[form.category] ?? []).map((s) => (
                  <option key={s} value={s}>{t(s)}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", gap: 10 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>{t("지역")}</label>
              <select style={inp} value={form.area} onChange={(e) => set("area", e.target.value)}>
                {PLACE_AREAS.map((a) => (
                  <option key={a} value={a}>{t(a)}</option>
                ))}
              </select>
            </div>
            <div style={{ flex: 1.4 }}>
              <label style={lbl}>{t("전화번호 (선택)")}</label>
              <input style={inp} value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+84..." />
            </div>
          </div>

          <label style={lbl}>{t("주소")}</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input style={{ ...inp, flex: 1, minWidth: 0 }} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="예: 123 Võ Nguyên Giáp, Mỹ Khê" />
            <button className="btn pri" style={{ padding: "0 14px", fontSize: 12.5, flexShrink: 0 }} onClick={geocode} disabled={geoBusy}>
              {geoBusy ? t("찾는 중…") : t("위치 찾기")}
            </button>
          </div>
          <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 4 }}>{t("주소를 입력하고 위치 찾기를 누르면 지도에 핀이 자동으로 찍혀요")}</div>
          {geoMsg && <div style={{ marginTop: 6, fontSize: 12, fontWeight: 800, color: geoMsg.ok ? "#1FA45B" : "#C0392B" }}>{geoMsg.text}</div>}

          <label style={lbl}>{t("구글맵 링크 (지도에서 보기 버튼에 사용)")}</label>
          <input style={inp} value={form.maps_url} onChange={(e) => set("maps_url", e.target.value)} placeholder="https://maps.app.goo.gl/..." />
          <div style={{ fontSize: 11, color: "var(--ink3)", marginTop: 4 }}>
            {t("구글맵에서 가게 검색 → 공유 → 링크 복사해서 붙여넣으면 돼요")}
          </div>

          {form.lat != null && (
            <>
              <label style={lbl}>{t("위치 확인 (확대해서 볼 수 있어요)")}</label>
              <MapPicker lat={form.lat} lng={form.lng} />
            </>
          )}

          <label style={lbl}>{t("소개 (선택)")}</label>
          <textarea
            style={{ ...inp, minHeight: 70, resize: "vertical" }}
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
            placeholder={t("가게 소개, 대표 메뉴, 한국어 가능 여부 등")}
          />

          {msg && <div style={{ marginTop: 10, fontSize: 13, fontWeight: 700, color: "#C0392B" }}>{msg}</div>}

          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            <button className="btn pri" style={{ flex: 1, padding: "13px 0", fontSize: 14.5 }} onClick={save} disabled={busy}>
              {busy ? t("저장 중…") : form.id ? t("수정 저장") : t("업체 등록하기")}
            </button>
            <button className="btn ghost" style={{ padding: "13px 18px", fontSize: 14 }} onClick={() => setOpen(false)}>
              {t("닫기")}
            </button>
          </div>
        </div>
      )}

      {!guest && list !== null && list.length === 0 && !open && (
        <div style={{ marginTop: 26, textAlign: "center", padding: "30px 0" }}>
          <div style={{ fontSize: 15.5, fontWeight: 800 }}>{t("아직 등록한 업체가 없어요")}</div>
          <p style={{ fontSize: 13, color: "var(--ink2)", marginTop: 6 }}>{t("업체를 등록해야 캠페인을 열 수 있어요.")}</p>
        </div>
      )}

      {!guest &&
        (list ?? []).map((p) => (
          <div key={p.id} style={{ display: "flex", gap: 12, alignItems: "center", border: "1px solid var(--line)", borderRadius: 16, padding: "14px 16px", marginTop: 12 }}>
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 12,
                backgroundColor: "var(--chip)",
                backgroundImage: p.image_url ? "url(" + p.image_url + ")" : undefined,
                backgroundSize: "cover",
                backgroundPosition: "center",
                flexShrink: 0,
              }}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 14.5, fontWeight: 800 }}>{p.name}</div>
              <div style={{ fontSize: 11.5, color: "var(--ink3)", marginTop: 2 }}>
                {t(p.category)}
                {p.subcategory ? " · " + t(p.subcategory) : ""} · {t(p.area)}
              </div>
            </div>
            <Link href={"/place?id=" + p.id} style={{ fontSize: 12, fontWeight: 800, color: "var(--brand-dark)", textDecoration: "underline", flexShrink: 0 }}>
              {t("보기")}
            </Link>
            <button
              className="btn ghost"
              style={{ padding: "8px 13px", fontSize: 12, flexShrink: 0 }}
              onClick={() => {
                setForm({ ...p, subcategory: p.subcategory ?? "", maps_url: p.maps_url ?? "", phone: p.phone ?? "", description: p.description ?? "", address: p.address ?? "", photos: p.photos ?? [] });
                setOpen(true);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
            >
              {t("수정")}
            </button>
          </div>
        ))}
    </div>
  );
}
