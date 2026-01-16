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

const innerSizeClasses = {
  sm: "w-6 h-6",
  md: "w-8 h-8",
  lg: "w-10 h-10",
};

export function LogoWithGlow({ size = "md", className = "" }: LogoWithGlowProps) {
  return (
    <div 
      className={`${sizeClasses[size]} rounded-full overflow-hidden flex items-center justify-center bg-background shadow-[0_0_20px_rgba(0,0,0,0.6)] ${className}`}
    >
      <img 
        src={jsnLogo} 
        alt="Cube Mastery Logo" 
        className={`${innerSizeClasses[size]} object-contain`} 
      />
    </div>
  );
}

export default LogoWithGlow;