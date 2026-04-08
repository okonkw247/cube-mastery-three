import { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Home, LayoutDashboard, Users, Trophy, UserCircle } from "lucide-react";

const tabs = [
  { icon: Home, label: "Home", path: "/" },
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: Users, label: "Community", path: "/community" },
  { icon: Trophy, label: "Leaderboard", path: "/leaderboard" },
  { icon: UserCircle, label: "Profile", path: "/profile" },
];

export function BottomNav() {
  const [isPWA, setIsPWA] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const mq = window.matchMedia("(display-mode: standalone)");
    setIsPWA(mq.matches || (navigator as any).standalone === true);
    const handler = (e: MediaQueryListEvent) => setIsPWA(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  if (!isPWA) return null;

  return (
    <>
      {/* Spacer */}
      <div style={{ height: 64 }} />
      <nav
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 500,
          background: "#111111",
          borderTop: "1px solid #222222",
          height: 64,
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-around",
          fontFamily: "'Poppins', sans-serif",
        }}
      >
        {tabs.map((tab) => {
          const active = location.pathname === tab.path;
          const color = active ? "#00D4B4" : "#666666";
          return (
            <button
              key={tab.path}
              onClick={() => navigate(tab.path)}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 2,
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "6px 12px",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <tab.icon size={22} color={color} strokeWidth={active ? 2.2 : 1.8} />
              <span style={{ fontSize: 10, color, fontWeight: active ? 600 : 400 }}>{tab.label}</span>
            </button>
          );
        })}
      </nav>
    </>
  );
}
