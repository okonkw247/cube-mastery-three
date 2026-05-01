import { useState, useEffect } from "react";

const LAUNCH_DATE = new Date("2026-09-01T00:00:00Z");

function pad(n: number) {
  return String(n).padStart(2, "0");
}

const CountdownTimer = () => {
  const [time, setTime] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const tick = () => {
      const diff = LAUNCH_DATE.getTime() - Date.now();
      if (diff <= 0) {
        setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
        return;
      }
      setTime({
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

  const units = [
    { label: "Days", value: time.days },
    { label: "Hours", value: time.hours },
    { label: "Min", value: time.minutes },
    { label: "Sec", value: time.seconds },
  ];

  return (
    <div className="flex flex-col items-center gap-3 animate-fade-in" style={{ animationDelay: "0.3s" }}>
      <p className="text-sm font-medium text-muted-foreground tracking-widest uppercase">
        Course Drops In:
      </p>
      <div className="flex items-center gap-2 sm:gap-3">
        {units.map((u, i) => (
          <div key={u.label} className="flex items-center gap-2 sm:gap-3">
            <div className="flex flex-col items-center">
              <span className="text-2xl sm:text-3xl md:text-4xl font-bold font-mono text-primary tabular-nums">
                {pad(u.value)}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground uppercase tracking-wider mt-1">
                {u.label}
              </span>
            </div>
            {i < units.length - 1 && (
              <span className="text-xl sm:text-2xl text-primary/50 font-bold -mt-4">:</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default CountdownTimer;
