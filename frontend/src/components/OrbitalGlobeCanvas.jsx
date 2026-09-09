import React, { useRef, useEffect, useState } from 'react';

export default function OrbitalGlobeCanvas({ className = '', style = {} }) {
  const canvasRef = useRef(null);
  const [telemetry, setTelemetry] = useState({
    freq: '1575.42 MHz',
    snr: '49.2 dB-Hz',
    doppler: '+1.42 kHz',
    lock: 'LOCKED'
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;

    let width = (canvas.width = canvas.parentElement.clientWidth || 600);
    let height = (canvas.height = canvas.parentElement.clientHeight || 560);

    const handleResize = () => {
      if (!canvas || !canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = canvas.parentElement.clientHeight;
    };

    window.addEventListener('resize', handleResize);

    // Mouse parallax tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetTiltX = 0.2;
    let targetTiltY = -0.1;
    let currentTiltX = 0.2;
    let currentTiltY = -0.1;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) / width - 0.5;
      const y = (e.clientY - rect.top) / height - 0.5;
      targetTiltX = 0.2 + y * 0.25;
      targetTiltY = -0.1 + x * 0.35;
    };

    window.addEventListener('mousemove', handleMouseMove);

    // Stars with colors
    const stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      size: Math.random() * 1.8 + 0.4,
      alpha: Math.random() * 0.8 + 0.2,
      color: Math.random() > 0.8 ? '#93c5fd' : Math.random() > 0.6 ? '#67e8f9' : '#ffffff',
      twinkleSpeed: Math.random() * 0.03 + 0.01
    }));

    // Radio Wavefront Pulses (Expanding Arcs from Satellite Dish)
    let waveRings = [0.1, 0.35, 0.6, 0.85];

    // Background Orbiting Satellite Nodes
    const bgSatellites = [
      { angle: 0.2, dist: 1.45, speed: 0.003, name: 'NAV-02 (GPS-L2)', color: '#38bdf8' },
      { angle: 2.1, dist: 1.55, speed: 0.0025, name: 'GAL-05 (OSNMA)', color: '#10b981' },
      { angle: 4.3, dist: 1.65, speed: 0.0035, name: 'IRN-01 (NavIC)', color: '#f59e0b' },
    ];

    let rotation = 0;
    let clickRipple = null;

    const handleClick = (e) => {
      const rect = canvas.getBoundingClientRect();
      clickRipple = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        r: 5,
        alpha: 1
      };
    };

    canvas.addEventListener('click', handleClick);

    // Main Render Loop
    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Smooth tilt interpolation
      currentTiltX += (targetTiltX - currentTiltX) * 0.06;
      currentTiltY += (targetTiltY - currentTiltY) * 0.06;

      rotation += 0.0035;

      // Planet Center Position (Slightly left and lower, leaving room for hero satellite)
      const cx = width * 0.42;
      const cy = height * 0.58;
      const globeRadius = Math.min(width, height) * 0.34;

      // 1. Nebula Space Dust Gradient
      const nebulaGrad = ctx.createRadialGradient(width * 0.7, height * 0.25, 10, width * 0.7, height * 0.25, width * 0.7);
      nebulaGrad.addColorStop(0, 'rgba(30, 58, 138, 0.25)');
      nebulaGrad.addColorStop(0.4, 'rgba(14, 116, 144, 0.1)');
      nebulaGrad.addColorStop(0.8, 'rgba(15, 23, 42, 0.04)');
      nebulaGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = nebulaGrad;
      ctx.fillRect(0, 0, width, height);

      // 2. Starfield
      stars.forEach(s => {
        const sx = (s.x + 1) * 0.5 * width;
        const sy = (s.y + 1) * 0.5 * height;
        const twinkle = Math.sin(Date.now() * 0.002 * s.twinkleSpeed + s.x * 20) * 0.35 + 0.65;
        ctx.fillStyle = s.color;
        ctx.globalAlpha = s.alpha * twinkle;
        ctx.beginPath();
        ctx.arc(sx, sy, s.size, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;

      // 3. Earth Dramatic Multi-Layer Atmospheric Corona Glow
      const coronaGrad = ctx.createRadialGradient(cx, cy, globeRadius * 0.85, cx, cy, globeRadius * 1.55);
      coronaGrad.addColorStop(0, 'rgba(56, 189, 248, 0.35)');
      coronaGrad.addColorStop(0.3, 'rgba(37, 99, 235, 0.22)');
      coronaGrad.addColorStop(0.65, 'rgba(14, 116, 144, 0.08)');
      coronaGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = coronaGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, globeRadius * 1.55, 0, Math.PI * 2);
      ctx.fill();

      // 4. Planet Body: Photorealistic Day/Night Blue Marble Shading
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, globeRadius, 0, Math.PI * 2);
      ctx.clip();

      // Sunlit side gradient (Light coming from top-right satellite direction)
      const sunlitX = cx + globeRadius * 0.45;
      const sunlitY = cy - globeRadius * 0.45;
      const earthBodyGrad = ctx.createRadialGradient(
        sunlitX,
        sunlitY,
        globeRadius * 0.05,
        cx,
        cy,
        globeRadius
      );
      earthBodyGrad.addColorStop(0, '#38bdf8'); // Bright oceanic reflection
      earthBodyGrad.addColorStop(0.2, '#1d4ed8'); // Deep vibrant sapphire blue
      earthBodyGrad.addColorStop(0.5, '#0f2b5c'); // Deep ocean navy
      earthBodyGrad.addColorStop(0.8, '#071329'); // Terminator line (nightfall)
      earthBodyGrad.addColorStop(1, '#020611'); // Dark side of Earth
      ctx.fillStyle = earthBodyGrad;
      ctx.fillRect(cx - globeRadius, cy - globeRadius, globeRadius * 2, globeRadius * 2);

      // Continents & Landmasses Silhouettes (Glowing Cyan & Emerald Terrain)
      const continentPaths = [
        // Eurasia & India shape
        [[20, 10], [50, 25], [85, 30], [95, 10], [70, -10], [50, -5], [30, -15], [20, 10]],
        // Africa shape
        [[-10, -5], [10, -20], [25, -45], [10, -55], [-5, -35], [-15, -15], [-10, -5]],
        // Americas outline
        [[-75, 45], [-60, 55], [-45, 35], [-55, 15], [-70, -10], [-60, -35], [-50, -55], [-70, -35], [-85, 15], [-75, 45]]
      ];

      continentPaths.forEach((poly, pIdx) => {
        ctx.beginPath();
        const baseOffset = pIdx * 1.5 + rotation;
        poly.forEach((coord, cIdx) => {
          const lambda = (coord[0] * Math.PI) / 180 + baseOffset;
          const phi = (coord[1] * Math.PI) / 180;

          const ringR = globeRadius * Math.cos(phi);
          const y3d = -globeRadius * Math.sin(phi);
          const x3d = ringR * Math.cos(lambda);
          const z3d = ringR * Math.sin(lambda);

          // 3D rotation with tilt
          const cosTx = Math.cos(currentTiltX);
          const sinTx = Math.sin(currentTiltX);
          const cosTy = Math.cos(currentTiltY);
          const sinTy = Math.sin(currentTiltY);

          const yRot = y3d * cosTx - z3d * sinTx;
          const zRot = y3d * sinTx + z3d * cosTx;
          const xRot = x3d * cosTy + zRot * sinTy;
          const finalZ = -x3d * sinTy + zRot * cosTy;

          if (finalZ > -globeRadius * 0.1) {
            const px = cx + xRot;
            const py = cy + yRot;
            if (cIdx === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
        });
        ctx.closePath();
        ctx.fillStyle = 'rgba(16, 185, 129, 0.22)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 1.2;
        ctx.stroke();
      });

      // 3D Geodetic Latitude & Longitude Coordinate Wireframe Grid
      [-50, -25, 0, 25, 50].forEach(lat => {
        const phi = (lat * Math.PI) / 180;
        const ringR = globeRadius * Math.cos(phi);
        const y3d = -globeRadius * Math.sin(phi);

        ctx.beginPath();
        ctx.strokeStyle = lat === 0 ? 'rgba(56, 189, 248, 0.5)' : 'rgba(59, 130, 246, 0.18)';
        ctx.lineWidth = lat === 0 ? 1.5 : 0.8;

        for (let a = 0; a <= Math.PI * 2; a += 0.12) {
          const x3d = ringR * Math.cos(a + rotation);
          const z3d = ringR * Math.sin(a + rotation);

          const cosTx = Math.cos(currentTiltX);
          const sinTx = Math.sin(currentTiltX);
          const cosTy = Math.cos(currentTiltY);
          const sinTy = Math.sin(currentTiltY);

          const yRot = y3d * cosTx - z3d * sinTx;
          const zRot = y3d * sinTx + z3d * cosTx;
          const xRot = x3d * cosTy + zRot * sinTy;
          const finalZ = -x3d * sinTy + zRot * cosTy;

          if (finalZ > -globeRadius * 0.1) {
            const px = cx + xRot;
            const py = cy + yRot;
            if (a === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
        }
        ctx.stroke();
      });

      // City Lights & Navigation Tracking Node on Earth
      const nodeLat = (28.6 * Math.PI) / 180;
      const nodeLon = (77.2 * Math.PI) / 180 + rotation;
      const nodeR = globeRadius * Math.cos(nodeLat);
      const nY = -globeRadius * Math.sin(nodeLat);
      const nX = nodeR * Math.cos(nodeLon);
      const nZ = nodeR * Math.sin(nodeLon);

      const cosTx = Math.cos(currentTiltX);
      const sinTx = Math.sin(currentTiltX);
      const cosTy = Math.cos(currentTiltY);
      const sinTy = Math.sin(currentTiltY);

      const nyRot = nY * cosTx - nZ * sinTx;
      const nzRot = nY * sinTx + nZ * cosTx;
      const nxRot = nX * cosTy + nzRot * sinTy;
      const nfinalZ = -nX * sinTy + nzRot * cosTy;

      let groundTargetX = cx + nxRot;
      let groundTargetY = cy + nyRot;

      if (nfinalZ > 0) {
        // Ground Node Pulse
        ctx.beginPath();
        ctx.arc(groundTargetX, groundTargetY, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(groundTargetX, groundTargetY, 12, 0, Math.PI * 2);
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillStyle = '#6ee7b7';
        ctx.fillText('SOC GROUND NODE', groundTargetX + 10, groundTargetY - 4);
      } else {
        // Fallback target when rotated to night side
        groundTargetX = cx + globeRadius * 0.3;
        groundTargetY = cy - globeRadius * 0.15;
      }

      // Specular Sun Rim Glint on Atmospheric Horizon
      const rimGrad = ctx.createLinearGradient(sunlitX - 40, sunlitY - 40, sunlitX + 60, sunlitY + 60);
      rimGrad.addColorStop(0, 'rgba(255, 255, 255, 0.85)');
      rimGrad.addColorStop(0.3, 'rgba(56, 189, 248, 0.6)');
      rimGrad.addColorStop(0.7, 'rgba(37, 99, 235, 0.15)');
      rimGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = rimGrad;
      ctx.beginPath();
      ctx.arc(sunlitX, sunlitY, globeRadius * 0.45, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore(); // End planet clip

      // 5. Background Orbiting GNSS Satellites in Constellation
      bgSatellites.forEach(bs => {
        bs.angle += bs.speed;
        const sx = cx + Math.cos(bs.angle) * globeRadius * bs.dist;
        const sy = cy + Math.sin(bs.angle) * globeRadius * bs.dist * 0.55;

        // Satellite Glow & Dot
        ctx.beginPath();
        ctx.arc(sx, sy, 3, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(sx, sy, 8, 0, Math.PI * 2);
        ctx.fillStyle = `${bs.color}40`;
        ctx.fill();

        // Label
        ctx.font = '8px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(203, 213, 225, 0.75)';
        ctx.fillText(bs.name, sx + 8, sy - 3);

        // Thin orbital trajectory arc
        ctx.beginPath();
        ctx.ellipse(cx, cy, globeRadius * bs.dist, globeRadius * bs.dist * 0.55, 0.3, 0, Math.PI * 2);
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.1)';
        ctx.lineWidth = 1;
        ctx.stroke();
      });

      // 6. FOREGROUND HERO SATELLITE (Detailed 3D Spacecraft in Upper Right)
      // Positioned like in the reference image (top-right facing towards Earth)
      const satX = width * 0.76 + currentTiltY * 40;
      const satY = height * 0.28 + currentTiltX * 35;
      const satAngle = Math.atan2(groundTargetY - satY, groundTargetX - satX);

      ctx.save();
      ctx.translate(satX, satY);
      ctx.rotate(satAngle + Math.PI * 0.25); // Angled with dish pointed at Earth

      // --- Satellite Body: Hexagonal / Cylindrical Metallic Bus ---
      const bodyGrad = ctx.createLinearGradient(-18, -12, 18, 12);
      bodyGrad.addColorStop(0, '#f8fafc');
      bodyGrad.addColorStop(0.3, '#cbd5e1');
      bodyGrad.addColorStop(0.7, '#64748b');
      bodyGrad.addColorStop(1, '#1e293b');

      ctx.fillStyle = bodyGrad;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.roundRect(-14, -18, 28, 36, 4);
      ctx.fill();
      ctx.stroke();

      // Gold Thermal Insulation Foil Bands
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(-12, -8, 24, 6);
      ctx.fillStyle = '#fbbf24';
      ctx.fillRect(-12, 4, 24, 6);

      // --- Solar Array Wings (Extending Left and Right) ---
      // Left Solar Panel
      ctx.save();
      ctx.translate(-14, 0);
      const wingGrad = ctx.createLinearGradient(-50, 0, 0, 0);
      wingGrad.addColorStop(0, '#1e3a8a');
      wingGrad.addColorStop(0.5, '#2563eb');
      wingGrad.addColorStop(1, '#3b82f6');
      ctx.fillStyle = wingGrad;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(-52, -14, 48, 28, 2);
      ctx.fill();
      ctx.stroke();

      // Photovoltaic Grid lines on Left Wing
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 0.8;
      [-38, -26, -14].forEach(gx => {
        ctx.beginPath();
        ctx.moveTo(gx, -14);
        ctx.lineTo(gx, 14);
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(-52, 0);
      ctx.lineTo(-4, 0);
      ctx.stroke();
      ctx.restore();

      // Right Solar Panel
      ctx.save();
      ctx.translate(14, 0);
      ctx.fillStyle = wingGrad;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.roundRect(4, -14, 48, 28, 2);
      ctx.fill();
      ctx.stroke();

      // Photovoltaic Grid lines on Right Wing
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 0.8;
      [16, 28, 40].forEach(gx => {
        ctx.beginPath();
        ctx.moveTo(gx, -14);
        ctx.lineTo(gx, 14);
        ctx.stroke();
      });
      ctx.beginPath();
      ctx.moveTo(4, 0);
      ctx.lineTo(52, 0);
      ctx.stroke();
      ctx.restore();

      // --- High-Gain Parabolic Dish Antenna (Facing Earth) ---
      ctx.beginPath();
      ctx.ellipse(0, 22, 16, 8, 0, 0, Math.PI);
      const dishGrad = ctx.createLinearGradient(-16, 22, 16, 30);
      dishGrad.addColorStop(0, '#ffffff');
      dishGrad.addColorStop(0.5, '#94a3b8');
      dishGrad.addColorStop(1, '#334155');
      ctx.fillStyle = dishGrad;
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 1.5;
      ctx.fill();
      ctx.stroke();

      // Antenna Feed Horn & Strut
      ctx.beginPath();
      ctx.moveTo(0, 22);
      ctx.lineTo(0, 32);
      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Transponder LED indicator
      ctx.beginPath();
      ctx.arc(0, 32, 2.5, 0, Math.PI * 2);
      ctx.fillStyle = '#10b981';
      ctx.shadowColor = '#10b981';
      ctx.shadowBlur = 10;
      ctx.fill();
      ctx.shadowBlur = 0;

      ctx.restore(); // End hero satellite transform

      // 7. EXPANDING CONCENTRIC RADIO-FREQUENCY WAVE ARCS (Like in the NASA reference image!)
      // Waves radiate from the satellite antenna dish directly towards Earth
      const dishEmitX = satX + Math.cos(satAngle) * 35;
      const dishEmitY = satY + Math.sin(satAngle) * 35;

      const totalDist = Math.hypot(groundTargetX - dishEmitX, groundTargetY - dishEmitY);

      // Advance wave pulse rings
      waveRings = waveRings.map(r => (r + 0.008) % 1);

      ctx.save();
      waveRings.forEach(prog => {
        const currentDist = prog * totalDist * 1.1;
        const arcCenterDist = currentDist;
        const arcCenterX = dishEmitX + Math.cos(satAngle) * arcCenterDist;
        const arcCenterY = dishEmitY + Math.sin(satAngle) * arcCenterDist;

        // Radius of expanding arc wavefront
        const arcRadius = currentDist * 0.42;
        const arcAlpha = Math.sin(prog * Math.PI) * 0.85;

        ctx.beginPath();
        // Draw arc perpendicular to beam
        const startAngle = satAngle - Math.PI * 0.38;
        const endAngle = satAngle + Math.PI * 0.38;
        ctx.arc(dishEmitX, dishEmitY, currentDist, startAngle, endAngle);

        ctx.strokeStyle = `rgba(56, 189, 248, ${arcAlpha})`;
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#38bdf8';
        ctx.shadowBlur = 12;
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // Central Carrier Wave Guidance Ray
      ctx.beginPath();
      ctx.moveTo(dishEmitX, dishEmitY);
      ctx.lineTo(groundTargetX, groundTargetY);
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.3)';
      ctx.lineWidth = 1;
      ctx.setLineDash([4, 6]);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.restore();

      // 8. Click Shockwave Ripple
      if (clickRipple) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(clickRipple.x, clickRipple.y, clickRipple.r, 0, Math.PI * 2);
        ctx.strokeStyle = `rgba(56, 189, 248, ${clickRipple.alpha})`;
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();

        clickRipple.r += 4;
        clickRipple.alpha -= 0.025;
        if (clickRipple.alpha <= 0) clickRipple = null;
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('click', handleClick);
    };
  }, []);

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '480px',
        position: 'relative',
        overflow: 'hidden',
        cursor: 'crosshair',
        ...style
      }}
      title="Click canvas to emit carrier frequency pulse"
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />

      {/* Floating Cinematic HUD Badge: Real-Time Carrier Telemetry */}
      <div style={{
        position: 'absolute',
        top: '16px',
        left: '16px',
        background: 'rgba(6, 10, 18, 0.85)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '10px',
        padding: '0.65rem 0.95rem',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 12px 30px rgba(0, 0, 0, 0.7)',
        fontSize: '0.72rem',
        pointerEvents: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <strong style={{ color: '#fff', letterSpacing: '0.04em' }}>CARRIER WAVE PROPAGATION</strong>
        </div>
        <div style={{ fontFamily: 'var(--font-mono)', color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700 }}>
          {telemetry.freq} • {telemetry.doppler}
        </div>
        <div style={{ fontSize: '0.65rem', color: '#94a3b8', marginTop: '2px' }}>
          Carrier C/N0: <strong style={{ color: '#10b981' }}>{telemetry.snr}</strong> • {telemetry.lock}
        </div>
      </div>
    </div>
  );
}
