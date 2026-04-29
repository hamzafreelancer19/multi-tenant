import React from "react";
import "./GlobalBackground.css";

/**
 * GlobalBackground component provides a premium glassmorphism 
 * and animated aurora effect for the entire application.
 */
export default function GlobalBackground() {
  return (
    <div className="global-bg-container">
      {/* Animated Aurora Glows */}
      <div className="global-aurora aurora-1" />
      <div className="global-aurora aurora-2" />
      <div className="global-aurora aurora-3" />
      
      {/* Glass Layer */}
      <div className="global-glass-overlay" />
      
      {/* Fixed Noise/Grain for texture (optional premium touch) */}
      <div className="global-noise" />
    </div>
  );
}
