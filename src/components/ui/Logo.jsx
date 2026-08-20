import { Link } from "react-router-dom";
import logoImg from "../../assets/logo-bg.png";

export default function Logo({
  variant = "navbar", // "navbar" | "footer" | "drawer"
  className = "",
  showText = true,
  to = "/",
}) {
  // Preset responsive widths matching exact design specs:
  // Navbar Desktop: 135px–155px (lg:w-[145px] xl:w-[155px])
  // Navbar Tablet: 120px–135px (md:w-[130px])
  // Navbar Mobile: 100px–115px (w-[105px] sm:w-[115px])
  // Footer Desktop: 110px–125px (md:w-[115px] lg:w-[125px])
  // Footer Mobile: 90px–105px (w-[100px] sm:w-[105px])
  const variantClasses = {
    navbar: "w-[105px] sm:w-[115px] md:w-[130px] lg:w-[145px] xl:w-[155px]",
    footer: "w-[100px] sm:w-[105px] md:w-[115px] lg:w-[125px]",
    drawer: "w-[115px] sm:w-[125px]",
  };

  const responsiveWidthClass = variantClasses[variant] || variant;

  const content = (
    <div className="logo-container inline-flex items-center justify-center shrink-0">
      {/* Brand Logo Image with Natural Aspect Ratio */}
      <img
        src={logoImg}
        alt="APEX STORE"
        className={`${responsiveWidthClass} h-auto shrink-0 object-contain filter drop-shadow-[0_0_12px_rgba(220,38,38,0.35)] group-hover:scale-105 transition-transform duration-300 ${className}`}
        onError={(e) => {
          // SVG Icon fallback if image fails to load
          e.currentTarget.style.display = "none";
          const fallbackNode = e.currentTarget.nextElementSibling;
          if (fallbackNode) fallbackNode.style.display = "flex";
        }}
      />

      {/* High-Tech Vector Logo Fallback Component */}
      <div className="hidden items-center gap-2.5 shrink-0">
        <div className="relative w-8 h-8 rounded-xl bg-gradient-to-br from-apex-red via-[#dc2626] to-[#991b1b] flex items-center justify-center shadow-[0_0_20px_rgba(220,38,38,0.5)] border border-white/20">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="w-4 h-4 text-white stroke-current stroke-[2.5]"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 2L2 22h4l6-12 6 12h4L12 2z" />
            <path d="M8 16h8" />
          </svg>
        </div>
        {showText && (
          <div className="flex flex-col text-left leading-none">
            <span className="text-lg font-black uppercase tracking-wider text-white">
              APEX
            </span>
            <span className="text-[9px] font-bold uppercase tracking-[0.3em] text-apex-red mt-0.5">
              STORE
            </span>
          </div>
        )}
      </div>
    </div>
  );

  if (to) {
    return (
      <Link
        to={to}
        className="inline-flex items-center shrink-0 focus:outline-none group"
      >
        {content}
      </Link>
    );
  }

  return content;
}
