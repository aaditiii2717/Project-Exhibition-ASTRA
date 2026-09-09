import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Activity,
  Cpu,
  Layers,
  Lock,
  Satellite,
  ArrowRight,
  Radar,
  Radio,
  Zap,
  Globe,
  Check,
  Sparkles
} from 'lucide-react';

export default function SystemBootLoader({ userSession, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(16);
  const [isAllComplete, setIsAllComplete] = useState(false);

  const steps = [
    {
      id: 1,
      name: 'GATEWAY',
      sub: 'Ingress Sanitization',
      formula: 'LAT/LON ∈ [-90°, +90°] • SHA-256 Ingestion Hash',
      icon: ShieldCheck,
      color: '#38bdf8',
      log: 'INGRESS: Geodetic bounds & anti-replay hash verified'
    },
    {
      id: 2,
      name: 'KINEMATICS',
      sub: 'Velocity Envelope',
      formula: 'Haversine Δs/Δt ≤ Vmax • 0.12 m/s Dynamics',
      icon: Activity,
      color: '#06b6d4',
      log: 'KINEMATICS: Acceleration & displacement tolerances calibrated'
    },
    {
      id: 3,
      name: 'PHYSICS',
      sub: 'Layer C3 / L2 Solvers',
      formula: 'Δi = ρ̇i + (c/f0)fd,i ≈ 0 • WLS Residual Geometry',
      icon: Satellite,
      color: '#3b82f6',
      log: 'PHYSICS: Layer C3 Doppler cross-rate invariant locked'
    },
    {
      id: 4,
      name: 'AI MANIFOLD',
      sub: 'Hybrid ML Classifier',
      formula: 'Isolation Forest (0.014s) + Random Forest Scoring',
      icon: Cpu,
      color: '#a855f7',
      log: 'ML_ENGINE: Out-of-distribution threat manifold loaded'
    },
    {
      id: 5,
      name: 'FORENSICS',
      sub: 'SHA-256 Ledger',
      formula: 'hash[k] = SHA256(hash[k-1] + event[k]) • Genesis Valid',
      icon: Lock,
      color: '#10b981',
      log: 'FORENSICS: Cryptographic event memory block chain verified'
    },
    {
      id: 6,
      name: 'ESA NAVISP',
      sub: 'ASIL-D Certified',
      formula: 'Bad GNSS ≠ Spoofing • DO-229F Integrity Assured',
      icon: Globe,
      color: '#10b981',
      log: 'ESA_NAVISP: Integrity attestation authorized for SOC clearance'
    }
  ];

  const [logs, setLogs] = useState([steps[0].log]);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev < steps.length - 1) {
          const next = prev + 1;
          setProgress(Math.round(((next + 1) / steps.length) * 100));
          setLogs((l) => [...l, steps[next].log]);
          return next;
        } else {
          clearInterval(interval);
          setIsAllComplete(true);
          setTimeout(() => {
            onComplete();
          }, 1000);
          return prev;
        }
      });
    }, 650);

    return () => clearInterval(interval);
  }, []);

  const activeStepData = steps[currentStep];
  const ActiveIcon = activeStepData.icon;

  return (
    <div style={{
      minHeight: '100vh',
      width: '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'radial-gradient(circle at 50% 30%, #081326 0%, #03060c 60%, #010204 100%)',
      padding: '2rem',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: 'var(--font-sans)'
    }}>
      {/* 1. Holographic Starfield / Space Grid */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(to right, rgba(56, 189, 248, 0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(56, 189, 248, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '40px 40px',
        pointerEvents: 'none'
      }} />

      {/* 2. Main High-Tech Stage Container */}
      <div style={{
        width: '100%',
        maxWidth: '1040px',
        background: 'rgba(7, 11, 20, 0.9)',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '24px',
        boxShadow: '0 30px 90px -20px rgba(0, 0, 0, 0.95), 0 0 60px rgba(56, 189, 248, 0.15)',
        backdropFilter: 'blur(24px)',
        padding: '2.5rem 3rem',
        position: 'relative',
        zIndex: 10
      }}>
        {/* Top Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '2.5rem',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          paddingBottom: '1.25rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '46px',
              height: '46px',
              borderRadius: '12px',
              background: 'radial-gradient(circle at 35% 30%, rgba(56, 189, 248, 0.35), #0a1324)',
              border: '1px solid rgba(56, 189, 248, 0.6)',
              boxShadow: '0 0 25px rgba(56, 189, 248, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={24} color="#38bdf8" />
            </div>

            <div>
              <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ffffff', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>SEQUENTIAL INTEGRITY VERIFICATION PIPELINE</span>
                <span style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  color: isAllComplete ? '#10b981' : '#38bdf8',
                  background: isAllComplete ? 'rgba(16, 185, 129, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                  border: `1px solid ${isAllComplete ? '#10b981' : '#38bdf8'}40`,
                  padding: '0.2rem 0.6rem',
                  borderRadius: '12px'
                }}>
                  {isAllComplete ? 'SYSTEM READY' : `STAGE 0${currentStep + 1} OF 06`}
                </span>
              </div>
              <div style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '3px' }}>
                Operator: <span style={{ color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{userSession?.username || 'engineer.lead@astra.defense'}</span> • Node: <span style={{ color: '#cbd5e1' }}>{userSession?.stationId || 'SOC-DELHI-NODE-04'}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onComplete}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.15)',
              borderRadius: '8px',
              color: '#94a3b8',
              fontSize: '0.75rem',
              fontWeight: 600,
              padding: '0.45rem 0.95rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease'
            }}
            onMouseEnter={(e) => e.currentTarget.style.color = '#fff'}
            onMouseLeave={(e) => e.currentTarget.style.color = '#94a3b8'}
          >
            <span>Skip to Mission Control</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* 3. THE HORIZONTAL PIPELINE ROW (All 6 Stages in a Connected Single Line) */}
        <div style={{ position: 'relative', marginBottom: '3rem', padding: '0 1rem' }}>
          {/* Connecting Data Rail */}
          <div style={{
            position: 'absolute',
            top: '28px',
            left: '4%',
            right: '4%',
            height: '4px',
            background: 'rgba(255, 255, 255, 0.08)',
            borderRadius: '2px',
            zIndex: 1
          }}>
            {/* Animated Laser Progress Surge along the Rail */}
            <div style={{
              height: '100%',
              width: `${(currentStep / (steps.length - 1)) * 100}%`,
              background: 'linear-gradient(90deg, #2563eb, #38bdf8, #10b981)',
              borderRadius: '2px',
              transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
              boxShadow: '0 0 15px rgba(56, 189, 248, 0.8)'
            }} />
          </div>

          {/* 6 Step Nodes in a Single Row */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            position: 'relative',
            zIndex: 2
          }}>
            {steps.map((step, idx) => {
              const isFinished = idx < currentStep || isAllComplete;
              const isCurrent = idx === currentStep && !isAllComplete;
              const isPending = idx > currentStep && !isAllComplete;
              const StepIcon = step.icon;

              return (
                <div
                  key={step.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center',
                    width: '130px',
                    transition: 'all 0.3s ease'
                  }}
                >
                  {/* Glowing Circular Node */}
                  {/* Subtle Circular Node */}
                  <div style={{
                    width: '56px',
                    height: '56px',
                    borderRadius: '50%',
                    background: isFinished
                      ? 'linear-gradient(145deg, #134e38, #0a261b)'
                      : isCurrent
                      ? 'linear-gradient(145deg, #1e293b, #0f172a)'
                      : '#0b111e',
                    border: isFinished
                      ? '2px solid #10b981'
                      : isCurrent
                      ? '2px solid #60a5fa'
                      : '2px solid rgba(255, 255, 255, 0.1)',
                    boxShadow: isFinished
                      ? '0 4px 14px rgba(16, 185, 129, 0.3), inset 0 1px 1px rgba(255, 255, 255, 0.2)'
                      : isCurrent
                      ? '0 4px 16px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.3)'
                      : 'none',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.85rem',
                    transform: isCurrent ? 'scale(1.1)' : 'scale(1)',
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}>
                    {isFinished ? (
                      <Check size={22} color="#ffffff" strokeWidth={2.5} />
                    ) : isCurrent ? (
                      <StepIcon size={22} color="#93c5fd" className="animate-spin-slow" />
                    ) : (
                      <StepIcon size={20} color="#64748b" />
                    )}
                  </div>

                  {/* Stage Name & Subtitle */}
                  <div style={{
                    fontSize: '0.78rem',
                    fontWeight: 800,
                    color: isFinished ? '#ffffff' : isCurrent ? '#f8fafc' : '#64748b',
                    letterSpacing: '0.04em',
                    marginBottom: '2px'
                  }}>
                    0{step.id} {step.name}
                  </div>

                  <div style={{
                    fontSize: '0.68rem',
                    color: isFinished ? '#10b981' : isCurrent ? '#93c5fd' : '#475569',
                    fontWeight: 600
                  }}>
                    {isFinished ? 'PASSED' : isCurrent ? 'CHECKING...' : 'QUEUED'}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 4. ACTIVE STAGE DEEP INSPECTION CARD */}
        <div style={{
          background: 'linear-gradient(180deg, #121620 0%, #0d1017 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '16px',
          padding: '1.5rem 2rem',
          marginBottom: '2rem',
          boxShadow: '0 15px 40px rgba(0, 0, 0, 0.6), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '2rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: '#18202e',
              border: '1px solid rgba(148, 163, 184, 0.3)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}>
              <ActiveIcon size={24} color="#93c5fd" />
            </div>

            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ fontSize: '0.72rem', color: '#93c5fd', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  ACTIVE INSPECTION PROTOCOL
                </span>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 8px #10b981' }} />
              </div>

              <div style={{ fontSize: '1.2rem', fontWeight: 900, color: '#ffffff', marginTop: '2px' }}>
                {activeStepData.sub}
              </div>

              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#93c5fd', marginTop: '4px' }}>
                {activeStepData.formula}
              </div>
            </div>
          </div>

          <div style={{
            background: 'rgba(0, 0, 0, 0.5)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '10px',
            padding: '0.6rem 1rem',
            textAlign: 'right',
            flexShrink: 0
          }}>
            <div style={{ color: '#94a3b8', fontSize: '0.65rem', textTransform: 'uppercase', fontWeight: 700 }}>
              VERIFICATION STATUS
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 900, color: isAllComplete ? '#10b981' : '#38bdf8', fontSize: '1rem' }}>
              {isAllComplete ? 'ALL VERIFIED (100%)' : '0.014s INFERENCE'}
            </div>
          </div>
        </div>

        {/* 5. Cyber Matrix Telemetry Stream */}
        <div style={{
          background: '#04070d',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '12px',
          padding: '0.85rem 1.25rem',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
          color: '#38bdf8',
          boxShadow: 'inset 0 2px 10px rgba(0, 0, 0, 0.8)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.45rem', color: '#64748b', fontSize: '0.68rem', borderBottom: '1px solid rgba(255, 255, 255, 0.05)', paddingBottom: '0.35rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
              LIVE TELEMETRY STREAM
            </span>
            <span>NODE: SOC-DELHI-04 • SHA-256 HASH CHAIN</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '70px', overflowY: 'hidden' }}>
            {logs.slice(-3).map((log, lIdx) => (
              <div key={lIdx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ color: '#10b981', fontWeight: 800 }}>&gt;</span>
                <span style={{ color: lIdx === logs.slice(-3).length - 1 ? '#e2e8f0' : '#64748b' }}>
                  {log}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
