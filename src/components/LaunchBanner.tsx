import { useState, useEffect } from "react";
import { Flame } from "lucide-react";

// Launch ends 21 days from March 10, 2026
const LAUNCH_END = new Date("2026-03-31T23:59:59Z");

function pad(n: number) {
  return String(n).padStart(2, "0");
}

export function LaunchBanner() {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });
  const [expired, setExpired] = useState(false);

  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const diff = LAUNCH_END.getTime() - now.getTime();
      if (diff <= 0) {
        setExpired(true);
        return;
      }
      setTimeLeft({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  if (expired) return null;

  return (
    <div className="w-full bg-[hsl(var(--primary))] text-primary-foreground py-2 px-4 text-center text-xs sm:text-sm z-[60] relative">
      <div className="container mx-auto flex flex-wrap items-center justify-center gap-2 sm:gap-3">
        <Flame className="w-4 h-4 shrink-0" />
        <span className="font-medium">
          Launch Price — Use code <span className="font-bold">EARLYBIRD</span> at checkout and get the course for $19.99 instead of $24.99
        </span>
        <div className="flex items-center gap-1 font-mono font-bold text-xs">
          <span className="bg-primary-foreground/20 rounded px-1.5 py-0.5">{pad(timeLeft.days)}d</span>
          <span>:</span>
          <span className="bg-primary-foreground/20 rounded px-1.5 py-0.5">{pad(timeLeft.hours)}h</span>
          <span>:</span>
          <span className="bg-primary-foreground/20 rounded px-1.5 py-0.5">{pad(timeLeft.minutes)}m</span>
          <span>:</span>
          <span className="bg-primary-foreground/20 rounded px-1.5 py-0.5">{pad(timeLeft.seconds)}s</span>
        </div>
      </div>
    </div>
  );
}
