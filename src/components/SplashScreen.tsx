import { useState, useEffect } from "react";

export function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setFadeOut(true), 2200);
    const t2 = setTimeout(() => setVisible(false), 2600);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#0d0d0d",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Poppins', sans-serif",
        opacity: fadeOut ? 0 : 1,
        transform: fadeOut ? "translateY(-20px)" : "translateY(0)",
        transition: "opacity 0.4s ease, transform 0.4s ease",
      }}
    >
      {/* Logo */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          animation: "splashLogoIn 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards",
        }}
      >
        <svg width={44} height={22} viewBox="0 0 80 40" fill="none" xmlns="http://www.w3.org/2000/svg">
          <polyline
            points="5,38 40,8 75,38"
            stroke="#00D4B4"
            strokeWidth={5}
            strokeLinecap="round"
            strokeLinejoin="round"
            fill="none"
          />
        </svg>
        <div style={{ fontSize: "9vw", maxFontSize: 42, fontWeight: 900, lineHeight: 1, whiteSpace: "nowrap", marginTop: -2 }}>
          <span style={{ color: "#ffffff" }}>JSN</span>
          <span style={{ color: "#00D4B4" }}>-MASTERY</span>
        </div>
      </div>

      {/* Spinner */}
      <div
        style={{
          marginTop: 32,
          width: 28,
          height: 28,
          border: "2.5px solid rgba(0,212,180,0.15)",
          borderTopColor: "#00D4B4",
          borderRadius: "50%",
          animation: "splashSpin 0.8s linear infinite",
          opacity: 0,
          animationDelay: "0s",
        }}
      />

      <style>{`
        @keyframes splashLogoIn {
          0% { transform: scale(0.8); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes splashSpin {
          to { transform: rotate(360deg); }
        }
        .splash-spinner-appear {
          animation: splashSpinnerIn 0.3s ease forwards;
        }
        @keyframes splashSpinnerIn {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
      `}</style>

      {/* Delayed spinner visibility via a second useEffect would be complex inline, 
           so we use CSS animation-delay for the fade-in */}
      <style>{`
        div[style*="borderTopColor: rgb(0, 212, 180)"] {
          animation: splashSpin 0.8s linear infinite, splashSpinnerIn 0.3s ease 0.8s forwards !important;
        }
      `}</style>
    </div>
  );
}
