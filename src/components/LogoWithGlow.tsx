import jsnLogo from "@/assets/jsn-logo.png";

interface LogoWithGlowProps {
  size?: "sm" | "md" | "lg";
  className?: string;
}

const sizeClasses = {
  sm: "w-8 h-8",
  md: "w-10 h-10",
  lg: "w-12 h-12",
};

export function LogoWithGlow({ size = "md", className = "" }: LogoWithGlowProps) {
  return (
    <div
      className={`${sizeClasses[size]} shrink-0 rounded-full overflow-hidden flex items-center justify-center bg-white ring-1 ring-black/10 dark:ring-white/10 shadow-[0_2px_10px_rgba(0,0,0,0.35)] ${className}`}
    >
      <img
        src={jsnLogo}
        alt="Cube Mastery Logo"
        className={`${sizeClasses[size]} rounded-full object-cover`}
        draggable={false}
      />
    </div>
  );
}

export default LogoWithGlow;
