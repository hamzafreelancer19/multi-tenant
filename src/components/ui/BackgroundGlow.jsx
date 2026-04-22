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
    <div className={cn("relative w-full overflow-hidden min-h-[500px] flex items-center justify-center py-20 px-5 sm:px-10", className)}>
      
      {/* Container for Glows - ensuring they fill the parent */}
      <div className="absolute inset-0 z-0">
        
        {/* Soft Yellow Glow (Original Prompt Specs) */}
        {(variant === "yellow" || variant === "both") && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(circle at center, #FFF991 0%, transparent 70%)`,
              opacity: 0.6,
              mixBlendMode: "multiply",
            }}
          />
        )}

        {/* Purple Glow Right (Original Prompt Specs) */}
        {(variant === "purple" || variant === "both") && (
          <div
            className="absolute inset-x-0 inset-y-0 pointer-events-none"
            style={{
              background: "#ffffff",
              backgroundImage: `radial-gradient(circle at top right, rgba(173, 109, 244, 0.5), transparent 70%)`,
              filter: "blur(120px)", // Increased blur for premium feel
              backgroundRepeat: "no-repeat",
              opacity: 0.8,
            }}
          />
        )}
        
        {/* Subtle glass layer to unify the effects */}
        <div className="absolute inset-0 pointer-events-none bg-white/20 backdrop-blur-[2px]"></div>
      </div>

      {/* Content Container - Ensure it stays on top */}
      <div className="relative z-10 w-full max-w-[1280px] mx-auto">
        {children}
      </div>
    </div>
  );
}
