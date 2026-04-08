import { useState, useEffect } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(() => {
    const isPWA = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    return isPWA;
  });
  const [phase, setPhase] = useState<1 | 2>(1);
  const [showSpinner, setShowSpinner] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!visible) return;
    const t1 = setTimeout(() => setPhase(2), 1600);
    const t2 = setTimeout(() => setShowSpinner(true), 2100);
    const t3 = setTimeout(() => setFadeOut(true), 2300);
    const t4 = setTimeout(() => setVisible(false), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, []);

  if (!visible) return null;

  const chevronSvg = (size: number, stroke: number) => (
    <svg width={size} height={size * 0.5} viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline
        points="5,38 40,8 75,38"
        stroke="#00D4B4"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0d0d0d",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Poppins', sans-serif",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.3s ease",
      }}
    >
      {/* Phase 1: Icon card */}
      {phase === 1 && (
        <div
          style={{
            width: 180,
            height: 180,
            background: "#ffffff",
            borderRadius: 40,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 2,
            animation: "splashPop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards",
          }}
        >
          {chevronSvg(60, 6)}
          <span style={{ fontSize: 58, fontWeight: 900, color: "#111111", lineHeight: 1, marginTop: -4 }}>
            JSN
          </span>
        </div>
      )}

      {/* Phase 2: Wordmark */}
      {phase === 2 && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            animation: "splashFadeIn 0.5s ease forwards",
            opacity: 0,
          }}
        >
          {chevronSvg(44, 5)}
          <div style={{ fontSize: "10.5vw", fontWeight: 900, lineHeight: 1, whiteSpace: "nowrap", marginTop: -4 }}>
            <span style={{ color: "#ffffff" }}>JSN</span>
            <span style={{ color: "#00D4B4" }}>-MASTERY</span>
          </div>
        </div>
      )}

      {/* Spinner */}
      {showSpinner && (
        <div
          style={{
            position: "fixed",
            bottom: 52,
            left: "50%",
            transform: "translateX(-50%)",
            width: 32,
            height: 32,
            border: "2.5px solid rgba(0,212,180,0.2)",
            borderTopColor: "#00D4B4",
            borderRadius: "50%",
            animation: "splashSpin 0.8s linear infinite",
          }}
        />
      )}

      <style>{`
        @keyframes splashPop {
          0% { transform: scale(0.3); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes splashFadeIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes splashSpin {
          to { transform: translateX(-50%) rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
