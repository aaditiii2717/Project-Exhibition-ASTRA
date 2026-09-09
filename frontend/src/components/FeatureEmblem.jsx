import React from 'react';

export default function FeatureEmblem({ type, color = '#38bdf8' }) {
  // Common 3D Beveled Container Styles
  const containerStyle = {
    width: '68px',
    height: '68px',
    borderRadius: '18px',
    background: `radial-gradient(circle at 35% 30%, ${color}35 0%, #0a101d 85%, #05080f 100%)`,
    border: `1px solid ${color}80`,
    boxShadow: `
      0 12px 32px -4px ${color}55,
      0 4px 12px rgba(0, 0, 0, 0.8),
      inset 0 1.5px 2px rgba(255, 255, 255, 0.45),
      inset 0 -3px 8px rgba(0, 0, 0, 0.9)
    `,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
    flexShrink: 0
  };

  // Specular top light reflex
  const reflexStyle = {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '40%',
    background: 'linear-gradient(180deg, rgba(255, 255, 255, 0.25) 0%, transparent 100%)',
    borderRadius: '18px 18px 0 0',
    pointerEvents: 'none'
  };

  const renderIconSvg = () => {
    switch (type) {
      case 'physics':
        // Stylized Orbital Satellite with Carrier Beam
        return (
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none" style={{ filter: `drop-shadow(0 2px 8px ${color})` }}>
            <circle cx="16" cy="16" r="13" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.6" />
            <path d="M7 25L25 7" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <rect x="18" y="4" width="8" height="6" rx="1.5" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
            <rect x="6" y="22" width="8" height="6" rx="1.5" fill={color} fillOpacity="0.3" stroke={color} strokeWidth="1.5" />
            <circle cx="16" cy="16" r="4.5" fill="#ffffff" stroke={color} strokeWidth="2" />
            <circle cx="16" cy="16" r="2" fill={color} />
          </svg>
        );

      case 'availability':
        // 3D Beveled Multi-Layer Shield
        return (
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none" style={{ filter: `drop-shadow(0 2px 8px ${color})` }}>
            <path d="M16 3L26 7.5V15.5C26 21.8 21.7 27.5 16 29C10.3 27.5 6 21.8 6 15.5V7.5L16 3Z"
              fill={`url(#grad-shield)`} stroke={color} strokeWidth="1.75" />
            <path d="M16 7L22 9.8V15C22 19.2 19.4 23 16 24.2C12.6 23 10 19.2 10 15V9.8L16 7Z"
              fill={color} fillOpacity="0.25" stroke="#ffffff" strokeWidth="1" />
            <path d="M13 15.5L15.2 17.8L19.5 13.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            <defs>
              <linearGradient id="grad-shield" x1="16" y1="3" x2="16" y2="29" gradientUnits="userSpaceOnUse">
                <stop stopColor={color} stopOpacity="0.4" />
                <stop offset="1" stopColor={color} stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>
        );

      case 'ml':
        // Cyber Neural Microprocessor Core
        return (
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none" style={{ filter: `drop-shadow(0 2px 8px ${color})` }}>
            <rect x="7" y="7" width="18" height="18" rx="4" fill="#090d16" stroke={color} strokeWidth="1.8" />
            <rect x="11" y="11" width="10" height="10" rx="2" fill={color} fillOpacity="0.3" stroke="#ffffff" strokeWidth="1" />
            <circle cx="16" cy="16" r="2.5" fill="#ffffff" />
            {/* Pins */}
            <path d="M12 4V7 M16 4V7 M20 4V7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M12 25V28 M16 25V28 M20 25V28" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M4 12H7 M4 16H7 M4 20H7" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M25 12H28 M25 16H28 M25 20H28" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        );

      case 'forensics':
        // Cryptographic Vault Hash-Chain
        return (
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none" style={{ filter: `drop-shadow(0 2px 8px ${color})` }}>
            <rect x="7" y="13" width="18" height="15" rx="3" fill="#090d16" stroke={color} strokeWidth="1.8" />
            <path d="M11 13V9C11 6.2 13.2 4 16 4C18.8 4 21 6.2 21 9V13" stroke={color} strokeWidth="2" strokeLinecap="round" />
            <circle cx="16" cy="19.5" r="2.5" fill="#ffffff" />
            <path d="M16 22V24.5" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
            {/* Specular link */}
            <path d="M13 7C14 5.5 15.5 5 16 5" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" opacity="0.8" />
          </svg>
        );

      case 'dronesense':
        // Supersonic Autonomous Drone Vector with Geofence
        return (
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none" style={{ filter: `drop-shadow(0 2px 8px ${color})` }}>
            {/* Hex Geofence */}
            <path d="M16 4L26 10V22L16 28L6 22V10L16 4Z" stroke={color} strokeWidth="1.2" strokeDasharray="3 2" opacity="0.6" />
            {/* Plane / Drone */}
            <path d="M16 8L20 18L16 16L12 18L16 8Z" fill={color} fillOpacity="0.3" stroke="#ffffff" strokeWidth="1.75" strokeLinejoin="round" />
            <circle cx="16" cy="16" r="1.5" fill="#ffffff" />
            {/* Pulse */}
            <circle cx="16" cy="16" r="9" stroke={color} strokeWidth="1" opacity="0.4" />
          </svg>
        );

      case 'explainability':
        // Diagnostic Hologram Document with Verified Seal
        return (
          <svg width="34" height="34" viewBox="0 0 32 32" fill="none" style={{ filter: `drop-shadow(0 2px 8px ${color})` }}>
            <rect x="7" y="5" width="18" height="22" rx="3" fill="#090d16" stroke={color} strokeWidth="1.8" />
            <path d="M11 10H21" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" />
            <path d="M11 14H18" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            <path d="M11 18H16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
            {/* Verified Badge */}
            <circle cx="21" cy="22" r="5.5" fill={color} />
            <path d="M19 22L20.5 23.5L23.5 20.5" stroke="#ffffff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        );

      default:
        return null;
    }
  };

  return (
    <div style={containerStyle}>
      <div style={reflexStyle} />
      {renderIconSvg()}
    </div>
  );
}
