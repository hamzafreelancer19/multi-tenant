import React from "react";
import { cn } from "../../lib/utils";

/**
 * BackgroundGlow component provides premium radial gradient effects.
 * Optimized for high-end SaaS section backgrounds.
 */
export default function BackgroundGlow({
  children,
  className,
  variant = "both" // "yellow", "purple", "both"
}) {
  return (
    <div
      className={cn("relative w-full overflow-hidden min-h-[500px] flex items-center justify-center py-20 px-5 sm:px-10", className)}
      style={{
        background: "linear-gradient(145deg, #fffaf7 0%, #ffffff 48%, #fff5ef 100%)",
      }}
    >

      {/* Soft, brand-colored glows without washing out the form */}
      <div className="absolute inset-0 z-0">
        {(variant === "yellow" || variant === "both") && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle at 12% 18%, rgba(255, 140, 66, 0.18) 0%, rgba(255, 140, 66, 0.06) 28%, transparent 55%)",
            }}
          />
        )}

        {(variant === "purple" || variant === "both") && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: "radial-gradient(circle at 88% 82%, rgba(241, 90, 36, 0.14) 0%, rgba(241, 90, 36, 0.04) 30%, transparent 58%)",
            }}
          />
        )}

        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: "linear-gradient(rgba(241, 90, 36, 0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(241, 90, 36, 0.025) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
            maskImage: "linear-gradient(to bottom, rgba(0,0,0,0.55), transparent 75%)",
          }}
        />
      </div>

      <div className="relative z-10 w-full max-w-[1280px] mx-auto">
        {children}
      </div>
    </div>
  );
}
