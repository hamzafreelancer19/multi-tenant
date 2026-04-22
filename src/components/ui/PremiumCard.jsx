import React from 'react';

/**
 * Reusable Premium Card component with the "Sazzad" Aurora Glassmorphism design.
 * 
 * @param {Object} props
 * @param {React.ReactNode} props.children - The content to display inside the card
 * @param {string} props.className - Additional CSS classes for the card container
 * @param {string} props.auroraColor - The primary color for the animated aurora blob
 * @param {Object} props.style - Inline styles for the card container
 */
const PremiumCard = ({ children, className = "", auroraColor = "#C4A6F7", style = {} }) => (
  <div 
    className={`sazzad-card ${className}`} 
    style={{ ...style, "--aurora-color": auroraColor }}
  >
    <div className="sazzad-aurora"></div>
    <div className="sazzad-bg"></div>
    <div className="sazzad-content">
      {children}
    </div>
  </div>
);

export default PremiumCard;
