import type { WrappedData } from "./types";

/**
 * Off-screen 1080×1920 node captured by html-to-image for "POBIERZ
 * PODSUMOWANIE" (BRIEF §5.5) — sized for Insta Stories. Kept static (no
 * Motion) so the very first paint is already the final frame to snapshot.
 */
export function ShareCard({ data, forwardedRef }: { data: WrappedData; forwardedRef: React.Ref<HTMLDivElement> }) {
  const topPhotos = data.gallery.slice(0, 6);

  return (
    <div
      ref={forwardedRef}
      style={{
        width: 1080,
        height: 1920,
        background: "linear-gradient(160deg, #05060B 0%, #0B0F1C 55%, #1A2035 100%)",
        color: "#F2F5FF",
        fontFamily: "var(--font-inter), sans-serif",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "120px 80px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: -200,
          left: -150,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,194,75,0.25), transparent 70%)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: -250,
          right: -150,
          width: 700,
          height: 700,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,45,155,0.2), transparent 70%)",
        }}
      />

      <p style={{ fontSize: 34, letterSpacing: 8, color: "#A8B2CC", position: "relative" }}>
        LAST FREE DAY
      </p>
      <h1
        style={{
          fontFamily: "var(--font-anton), sans-serif",
          fontSize: 108,
          lineHeight: 0.95,
          textTransform: "uppercase",
          margin: "24px 0 0",
          textAlign: "center",
          color: "#22E4FF",
          position: "relative",
        }}
      >
        Koniec
        <br />
        wolności
      </h1>
      <p style={{ fontSize: 40, color: "#FFC24B", marginTop: 20, position: "relative" }}>
        Malta · {data.eventDateLabel}
      </p>

      <div
        style={{
          marginTop: 64,
          display: "flex",
          gap: 24,
          fontFamily: "var(--font-anton), sans-serif",
          position: "relative",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 96, color: "#3BF5A0" }}>16/16</div>
          <div style={{ fontSize: 28, color: "#A8B2CC", letterSpacing: 2 }}>WYZWAŃ</div>
        </div>
        <div style={{ width: 2, background: "rgba(255,255,255,0.15)" }} />
        <div style={{ textAlign: "center" }}>
          <div style={{ fontSize: 96, color: "#3BF5A0" }}>2/2</div>
          <div style={{ fontSize: 28, color: "#A8B2CC", letterSpacing: 2 }}>AREN</div>
        </div>
      </div>

      <div
        style={{
          marginTop: 72,
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 16,
          width: "100%",
          position: "relative",
        }}
      >
        {topPhotos.map((p) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={p.tileId + p.createdAt}
            src={p.mediaType === "image" ? p.mediaUrl : undefined}
            alt=""
            style={{
              width: "100%",
              height: 260,
              objectFit: "cover",
              borderRadius: 24,
              border: "2px solid rgba(255,255,255,0.15)",
              background: "#1A2035",
            }}
          />
        ))}
      </div>

      <p
        style={{
          marginTop: "auto",
          fontSize: 30,
          color: "#A8B2CC",
          textAlign: "center",
          position: "relative",
        }}
      >
        {data.groomName || "Pan Młody"} przetrwał ostatni dzień wolności.
      </p>
    </div>
  );
}
