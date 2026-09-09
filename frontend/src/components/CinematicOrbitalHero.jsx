import React, { useState, useEffect, useRef } from 'react';
import { Radio, Activity, Satellite, ShieldCheck, Zap, Globe, Crosshair, ArrowRight, ChevronDown } from 'lucide-react';

export default function CinematicOrbitalHero({ onAuthorizeClick }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);

  const [mousePos, setMousePos] = useState({ x: 0.7, y: 0.4 });
  const [telemetry, setTelemetry] = useState({
    freq: '1575.42 MHz (L1/E1)',
    doppler: '+1.42 kHz',
    snr: '49.8 dB-Hz',
    lock: 'CONTINUOUS LOCK',
    svCount: 32
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.clientWidth);
    let height = (canvas.height = canvas.parentElement.clientHeight);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Particle Starfield with deep space 3D motion
    const stars = Array.from({ length: 150 }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 2 + 0.5,
      alpha: Math.random() * 0.8 + 0.2,
      color: Math.random() > 0.8 ? '#93c5fd' : Math.random() > 0.6 ? '#67e8f9' : '#ffffff',
      speed: Math.random() * 0.3 + 0.1
    }));

    // Orbiting Satellites in Deep Constellation
    const orbitNodes = [
      { angle: 0.4, dist: 0.38, speed: 0.003, name: 'NAV-01 (GPS-L1)', color: '#38bdf8' },
      { angle: 2.2, dist: 0.45, speed: 0.002, name: 'GAL-05 (OSNMA)', color: '#10b981' },
      { angle: 4.1, dist: 0.52, speed: 0.0025, name: 'IRN-01 (NavIC)', color: '#f59e0b' },
    ];

    // Expanding Carrier Wave Pulse Rings
    let waveProgress = [0.1, 0.35, 0.6, 0.85];
    let time = 0;

    let targetMouse = { x: width * 0.72, y: height * 0.38 };
    let curMouse = { x: width * 0.72, y: height * 0.38 };

    const handlePointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      targetMouse.x = e.clientX - rect.left;
      targetMouse.y = e.clientY - rect.top;
      setMousePos({
        x: (e.clientX - rect.left) / width,
        y: (e.clientY - rect.top) / height
      });
    };

    window.addEventListener('mousemove', handlePointerMove);

    // Main 60 FPS Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);
      time += 0.02;

      // Mouse smooth lag
      curMouse.x += (targetMouse.x - curMouse.x) * 0.05;
      curMouse.y += (targetMouse.y - curMouse.y) * 0.05;

      // 1. Draw Starfield with Parallax Drift
      stars.forEach((s) => {
        s.y -= s.speed * 0.3;
        if (s.y < 0) s.y = height;

        const twinkle = Math.sin(time * 2 + s.x) * 0.3 + 0.7;
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha * twinkle;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // 2. Cosmic Ambient Aurora Glow in Deep Space
      const auroraGrad = ctx.createRadialGradient(
        width * 0.75,
        height * 0.45,
        50,
        width * 0.75,
        height * 0.45,
        width * 0.55
      );
      auroraGrad.addColorStop(0, 'rgba(56, 189, 248, 0.18)');
      auroraGrad.addColorStop(0.3, 'rgba(37, 99, 235, 0.12)');
      auroraGrad.addColorStop(0.7, 'rgba(15, 23, 42, 0.04)');
      auroraGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = auroraGrad;
      ctx.fillRect(0, 0, width, height);

      // 3. Orbital Flight Planes (Constellation Rings)
      const cx = width * 0.7;
      const cy = height * 0.55;
      const earthRadius = Math.min(width, height) * 0.35;

      [0.9, 1.25, 1.55].forEach((scale, i) => {
        ctx.beginPath();
        ctx.ellipse(cx, cy, earthRadius * scale, earthRadius * scale * 0.38, -0.35, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${0.12 - i * 0.03})`;
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // 4. Background Orbiting Satellites
      orbitNodes.forEach((node) => {
        node.angle += node.speed;
        const orbitR = earthRadius * (1 + node.dist);
        const satX = cx + Math.cos(node.angle) * orbitR;
        const satY = cy + Math.sin(node.angle) * orbitR * 0.38;

        ctx.beginPath();
        ctx.arc(satX, satY, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(satX, satY, 8, 0, Math.PI * 2);
        ctx.fillStyle = `${node.color}35`;
        ctx.fill();

        // Node name tag
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(203, 213, 225, 0.8)';
        ctx.fillText(node.name, satX + 10, satY - 4);

        // Thin signal ray to earth center
        ctx.beginPath();
        ctx.moveTo(satX, satY);
        ctx.lineTo(cx - 40, cy + 40);
        ctx.strokeStyle = `rgba(56, 189, 248, 0.08)`;
        ctx.setLineDash([2, 4]);
        ctx.stroke();
        ctx.setLineDash([]);
      });

      // 5. Holographic Carrier Wavefronts Aligned with Satellite Parabolic Dish in Photo
      // Precise dish antenna coordinates in background render
      const dishOriginX = width * 0.552 + (curMouse.x - width * 0.5) * 0.015;
      const dishOriginY = height * 0.385 + (curMouse.y - height * 0.5) * 0.015;

      // Downward-left target on Earth's curved atmospheric limb
      const earthTargetX = width * 0.36;
      const earthTargetY = height * 0.92;

      const beamAngle = Math.atan2(earthTargetY - dishOriginY, earthTargetX - dishOriginX);
      const totalBeamDist = Math.hypot(earthTargetX - dishOriginX, earthTargetY - dishOriginY);

      // Slower, majestic cinematic wave propagation speed
      waveProgress = waveProgress.map((p) => (p + 0.0022) % 1);

      ctx.save();
      waveProgress.forEach((prog) => {
        const currentDist = prog * totalBeamDist * 1.25;
        // Smooth sine fade-in and fade-out
        const arcAlpha = Math.sin(prog * Math.PI) * 0.75;

        ctx.beginPath();
        const startAngle = beamAngle - Math.PI * 0.32;
        const endAngle = beamAngle + Math.PI * 0.32;
        ctx.arc(dishOriginX, dishOriginY, currentDist, startAngle, endAngle);

        ctx.strokeStyle = `rgba(148, 185, 220, ${arcAlpha * 0.55})`;
        ctx.lineWidth = 1.6;
        ctx.shadowColor = 'rgba(148, 185, 220, 0.4)';
        ctx.shadowBlur = 4;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      ctx.restore();

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handlePointerMove);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        width: '100%',
        minHeight: '88vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '2rem 4rem',
        background: 'radial-gradient(circle at 75% 45%, #0b0f17 0%, #05070c 65%, #020306 100%)'
      }}
    >
      {/* 1. Full-Bleed 60 FPS Canvas Starfield, Orbit Paths & Waves */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 1,
          pointerEvents: 'none'
        }}
      />

      {/* 2. Photorealistic 3D Satellite & Earth Hero Image with Multi-Axis Blurry Fog Fade */}
      <div
        style={{
          position: 'absolute',
          top: '0',
          left: '0',
          width: '100%',
          height: '100%',
          backgroundImage: 'url(/hero_satellite_earth.jpg)',
          backgroundSize: 'cover',
          backgroundPosition: 'right 25% center',
          maskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.05) 20%, rgba(0,0,0,0.6) 45%, black 70%), linear-gradient(to bottom, transparent 0%, black 12%, black 60%, rgba(0,0,0,0.4) 80%, transparent 98%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0%, rgba(0,0,0,0.05) 20%, rgba(0,0,0,0.6) 45%, black 70%), linear-gradient(to bottom, transparent 0%, black 12%, black 60%, rgba(0,0,0,0.4) 80%, transparent 98%)',
          maskComposite: 'intersect',
          WebkitMaskComposite: 'source-in',
          opacity: 0.95,
          zIndex: 2,
          pointerEvents: 'none',
          filter: 'contrast(1.08) brightness(1.04)'
        }}
      />

      {/* Deep Vignette Overlay on Left Side to Guarantee 100% Seamless Text Contrast */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '55%',
          background: 'linear-gradient(to right, #020306 0%, #03060c 60%, transparent 100%)',
          zIndex: 3,
          pointerEvents: 'none'
        }}
      />

      {/* Bottom Fog Fade into Next Section */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '220px',
          background: 'linear-gradient(to top, #020306 0%, rgba(2, 3, 6, 0.85) 45%, rgba(2, 3, 6, 0.25) 75%, transparent 100%)',
          zIndex: 3,
          pointerEvents: 'none'
        }}
      />

      {/* 3. Left Content: Spacious, Bold Aerospace Headline & Mission */}
      <div style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '680px',
        padding: '2.5rem 0 3.5rem 0'
      }}>
        {/* ESA NAVISP Alliance Pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: 'rgba(56, 189, 248, 0.1)',
          border: '1px solid rgba(56, 189, 248, 0.3)',
          padding: '0.45rem 1rem',
          borderRadius: '30px',
          fontSize: '0.78rem',
          color: '#38bdf8',
          fontWeight: 700,
          letterSpacing: '0.05em',
          marginBottom: '2rem',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 0 20px rgba(56, 189, 248, 0.2)'
        }}>
          <Satellite size={15} color="#38bdf8" />
          <span>ESA NAVISP-EL2-332 ALIGNED ARCHITECTURE</span>
        </div>

        {/* Hero Title */}
        <h1 style={{
          fontSize: '4rem',
          fontWeight: 900,
          lineHeight: 1.06,
          letterSpacing: '-0.02em',
          color: '#ffffff',
          margin: '0 0 1.5rem 0',
          textShadow: '0 4px 30px rgba(0, 0, 0, 0.9)'
        }}>
          REDEFINING <span style={{
            background: 'linear-gradient(135deg, #38bdf8 0%, #3b82f6 50%, #a855f7 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>GNSS TRUST</span> FROM SPACE.
        </h1>

        <p style={{
          fontSize: '1.25rem',
          color: '#e2e8f0',
          lineHeight: 1.55,
          marginBottom: '2.25rem',
          textShadow: '0 2px 15px rgba(0, 0, 0, 0.8)'
        }}>
          "Normal navigation asks: <em>Where am I?</em><br />
          <strong style={{ color: '#38bdf8', fontWeight: 800 }}>ASTRA asks: Can I trust where I am?</strong>"
        </p>

        {/* Action Buttons with Matte Aerospace Finish */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', marginBottom: '2.75rem' }}>
          <button
            onClick={onAuthorizeClick}
            style={{
              background: 'linear-gradient(180deg, #1e2638 0%, #151b28 100%)',
              border: '1px solid rgba(148, 163, 184, 0.28)',
              color: '#f8fafc',
              fontSize: '0.98rem',
              fontWeight: 700,
              padding: '0.95rem 2.1rem',
              borderRadius: '12px',
              boxShadow: `
                0 8px 24px -4px rgba(0, 0, 0, 0.65),
                0 2px 6px rgba(0, 0, 0, 0.4),
                inset 0 1px 1px rgba(255, 255, 255, 0.18),
                inset 0 -1px 2px rgba(0, 0, 0, 0.5)
              `,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.65rem',
              transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
              position: 'relative'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = 'linear-gradient(180deg, #242e44 0%, #1a2233 100%)';
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.45)';
              e.currentTarget.style.boxShadow = `
                0 12px 28px -4px rgba(0, 0, 0, 0.75),
                0 4px 10px rgba(0, 0, 0, 0.5),
                inset 0 1px 1px rgba(255, 255, 255, 0.25)
              `;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'linear-gradient(180deg, #1e2638 0%, #151b28 100%)';
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.28)';
              e.currentTarget.style.boxShadow = `
                0 8px 24px -4px rgba(0, 0, 0, 0.65),
                0 2px 6px rgba(0, 0, 0, 0.4),
                inset 0 1px 1px rgba(255, 255, 255, 0.18),
                inset 0 -1px 2px rgba(0, 0, 0, 0.5)
              `;
            }}
          >
            <span style={{ letterSpacing: '0.01em' }}>Sign In</span>
            <ArrowRight size={17} strokeWidth={2.2} color="#93c5fd" />
          </button>

          <a
            href="#features"
            style={{
              background: 'linear-gradient(180deg, #11151e 0%, #0c0f16 100%)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#cbd5e1',
              fontSize: '0.92rem',
              fontWeight: 600,
              padding: '0.95rem 1.95rem',
              borderRadius: '12px',
              textDecoration: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '0.55rem',
              backdropFilter: 'blur(16px)',
              boxShadow: `
                0 6px 20px -4px rgba(0, 0, 0, 0.6),
                inset 0 1px 1px rgba(255, 255, 255, 0.08)
              `,
              transition: 'all 0.22s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)';
              e.currentTarget.style.background = 'linear-gradient(180deg, #161c27 0%, #10141e 100%)';
              e.currentTarget.style.color = '#ffffff';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.2)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.background = 'linear-gradient(180deg, #11151e 0%, #0c0f16 100%)';
              e.currentTarget.style.color = '#cbd5e1';
              e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.1)';
            }}
          >
            <span>Explore Features</span>
            <ChevronDown size={16} color="#38bdf8" />
          </a>
        </div>

        {/* Live Empirical Impact Metrics (Single Clean Horizontal Row) */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1.85rem',
          flexWrap: 'nowrap',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          paddingTop: '1.5rem',
          width: 'fit-content'
        }}>
          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, whiteSpace: 'nowrap', marginBottom: '2px' }}>
              False Positive Rate
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, color: '#10b981', fontSize: '1.25rem', whiteSpace: 'nowrap' }}>
              0.0% Alarms
            </div>
          </div>

          <div style={{ width: '1px', height: '32px', background: 'rgba(255, 255, 255, 0.15)', flexShrink: 0 }} />

          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, whiteSpace: 'nowrap', marginBottom: '2px' }}>
              Spoof Threat Catch Rate
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, color: '#38bdf8', fontSize: '1.25rem', whiteSpace: 'nowrap' }}>
              100% Defense
            </div>
          </div>

          <div style={{ width: '1px', height: '32px', background: 'rgba(255, 255, 255, 0.15)', flexShrink: 0 }} />

          <div>
            <div style={{ color: '#94a3b8', fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 600, whiteSpace: 'nowrap', marginBottom: '2px' }}>
              Decision Latency
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, color: '#f59e0b', fontSize: '1.25rem', whiteSpace: 'nowrap' }}>
              0.014s Real-Time
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
