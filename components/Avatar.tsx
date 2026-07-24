/* 프로필 사진 (없으면 이니셜) */
export default function Avatar({ url, name, size = 46 }: { url?: string | null; name?: string | null; size?: number }) {
  if (url)
    return (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: "50%",
          backgroundImage: "url(" + url + ")",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundColor: "var(--chip)",
          flexShrink: 0,
        }}
      />
    );
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        background: "var(--brand)",
        color: "#fff",
        fontWeight: 900,
        fontSize: size * 0.38,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      {(name ?? "?")[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
