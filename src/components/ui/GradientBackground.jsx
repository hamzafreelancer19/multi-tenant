import React from "react";
import { cn } from "../../lib/utils";

/**
 * GradientBackground component provides a radial gradient background.
 * Based on the specified theme: radial-gradient(125% 125% at 50% 10%, #fff 40%, #6366f1 100%)
 */
export default function GradientBackground({ 
  children, 
  className,
}) {
  return (
    <div className={cn("relative w-full overflow-hidden", className)}>
      {/* Radial Gradient Layer */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background: "radial-gradient(125% 125% at 50% 10%, #fff 40%, #6366f1 100%)",
        }}
      />
      
      {/* Content Container */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
