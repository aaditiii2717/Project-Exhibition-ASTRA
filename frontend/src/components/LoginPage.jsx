import React, { useState } from 'react';
import {
  ShieldCheck,
  Lock,
  User,
  Key,
  Radio,
  ArrowRight,
  Sparkles,
  Fingerprint,
  CheckCircle2,
  Terminal,
  Satellite,
  Shield,
  Activity,
  Award,
  Globe,
  Radar,
  ExternalLink,
  Layers,
  Cpu,
  FileCheck2,
  HelpCircle,
  Plane,
  ChevronDown
} from 'lucide-react';
import CinematicOrbitalHero from './CinematicOrbitalHero';
import InstitutionalFooter from './InstitutionalFooter';
import FeatureEmblem from './FeatureEmblem';

export default function LoginPage({ onLogin, onDirectLaunch }) {
  const [role, setRole] = useState('chief_engineer');
  const [username, setUsername] = useState('engineer.lead@astra.defense');
  const [password, setPassword] = useState('••••••••••••');
  const [stationId, setStationId] = useState('SOC-DELHI-NODE-04');
  const [activeFeature, setActiveFeature] = useState(0);

  const roles = [
    {
      id: 'chief_engineer',
      name: 'Lead GNSS & Navigation Engineer',
      email: 'engineer.lead@astra.defense',
      access: 'Level 4 Clearance • Full Physics & Model Attribution',
      badge: 'FLIGHT DYNAMICS'
    },
    {
      id: 'soc_analyst',
      name: 'Cybersecurity SOC Incident Responder',
      email: 'security.analyst@astra.defense',
      access: 'Level 3 Clearance • Forensic Ledger & Quarantine Audit',
      badge: 'SOC CYBER'
    },
    {
      id: 'autonomous_operator',
      name: 'Autonomous Fleet Operations Dispatch',
      email: 'fleet.dispatch@astra.defense',
      access: 'Level 2 Clearance • Operator State Monitoring',
      badge: 'DISPATCH'
    }
  ];

  const biplyFeatures = [
    {
      id: 1,
      type: 'physics',
      title: 'Carrier Physical Invariants',
      subtitle: 'Layer C3 & L2 WLS Solvers',
      desc: 'Enforces Doppler cross-rate consistency Δi = ρ̇i + (c/f0)fd,i ≈ 0. Rejects synthetic RF spoofers that cannot replicate multi-satellite geometric intersections.',
      color: '#38bdf8',
      stat: '0.12 m/s RMS',
      tag: 'GEODETIC PHYSICS'
    },
    {
      id: 2,
      type: 'availability',
      title: 'Bad GNSS != Spoofing',
      subtitle: 'Zero False Positive Guarantee',
      desc: 'Differentiates degraded multipath signals in tall urban canyons from malicious attacks. Keeps autonomous drones and robotaxis moving instead of false-alarming.',
      color: '#10b981',
      stat: '0.0% False Alarms',
      tag: 'AVAILABILITY ASSURANCE'
    },
    {
      id: 3,
      type: 'ml',
      title: 'Hybrid ML Threat Manifold',
      subtitle: 'Isolation Forest + Random Forest',
      desc: 'Dual out-of-distribution anomaly scoring with local feature attribution. Catches stealth gradual drift (0.25 m/s² creep) invisible to naive kinematic thresholding.',
      color: '#a855f7',
      stat: '100% Detection Rate',
      tag: 'AI ANOMALY ENGINE'
    },
    {
      id: 4,
      type: 'forensics',
      title: 'Cryptographic Event Memory',
      subtitle: 'Tamper-Evident SHA-256 Ledger',
      desc: 'Every navigation state update and quarantine alert is chained into a sequential block ledger: hash[k] = SHA256(hash[k-1] + event[k]). Instant detection if logs are altered.',
      color: '#3b82f6',
      stat: 'SHA-256 Chained',
      tag: 'INCIDENT FORENSICS'
    },
    {
      id: 5,
      type: 'dronesense',
      title: 'DroneSense Flight Telemetry',
      subtitle: 'Aerial Satellite Orthophoto Map',
      desc: 'Real-time ESRI satellite imagery with state-colored trust path segments, 3D geofence corridor monitoring, and live altitude/speed/heading telemetry HUD.',
      color: '#f59e0b',
      stat: '60 FPS Live Stream',
      tag: 'AERIAL MISSION HUD'
    },
    {
      id: 6,
      type: 'explainability',
      title: 'Transparent Decision Explainability',
      subtitle: 'Signature "Why Trust Changed?" Diff',
      desc: 'Replaces black-box uncertainty with diagnostic evidence diffs showing previous vs current state, primary triggering detectors, and exact physical discrepancies.',
      color: '#ec4899',
      stat: '0.014s Latency',
      tag: 'SAFETY COMPLIANCE'
    }
  ];

  const handleRoleSelect = (r) => {
    setRole(r.id);
    setUsername(r.email);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin({
      role,
      username,
      stationId
    });
  };

  const scrollToLogin = () => {
    document.getElementById('auth-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: '#04060b',
      color: '#f8fafc',
      fontFamily: 'var(--font-sans)',
      position: 'relative',
      overflowX: 'hidden'
    }}>
      {/* Dynamic Animated Grid Background */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundImage: `
          linear-gradient(to right, rgba(59, 130, 246, 0.03) 1px, transparent 1px),
          linear-gradient(to bottom, rgba(59, 130, 246, 0.03) 1px, transparent 1px)
        `,
        backgroundSize: '48px 48px',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Atmospheric Glowing Orbs */}
      <div style={{
        position: 'fixed',
        top: '5%',
        left: '20%',
        width: '600px',
        height: '600px',
        background: 'radial-gradient(circle, rgba(37, 99, 235, 0.14) 0%, transparent 70%)',
        filter: 'blur(100px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />
      <div style={{
        position: 'fixed',
        bottom: '10%',
        right: '15%',
        width: '550px',
        height: '550px',
        background: 'radial-gradient(circle, rgba(239, 68, 68, 0.09) 0%, transparent 70%)',
        filter: 'blur(110px)',
        pointerEvents: 'none',
        zIndex: 0
      }} />

      {/* Top Floating Glass Navigation Header */}
      <header style={{
        position: 'sticky',
        top: 0,
        zIndex: 100,
        backdropFilter: 'blur(16px)',
        background: 'rgba(5, 8, 14, 0.85)',
        borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
        padding: '0.85rem 2.5rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            width: '36px',
            height: '36px',
            borderRadius: '10px',
            background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 0 16px rgba(59, 130, 246, 0.5)'
          }}>
            <ShieldCheck size={20} color="#fff" />
          </div>
          <div>
            <div style={{ fontSize: '1.25rem', fontWeight: 900, letterSpacing: '0.08em', color: '#fff', lineHeight: 1 }}>
              ASTRA
            </div>
            <div style={{ fontSize: '0.65rem', color: '#60a5fa', fontWeight: 600, letterSpacing: '0.05em' }}>
              INTEGRITY LAYER
            </div>
          </div>
        </div>


        {/* Action Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button
            onClick={scrollToLogin}
            style={{
              background: 'linear-gradient(180deg, #1c2333 0%, #141924 100%)',
              color: '#f8fafc',
              fontSize: '0.8rem',
              fontWeight: 700,
              padding: '0.55rem 1.25rem',
              borderRadius: '8px',
              border: '1px solid rgba(148, 163, 184, 0.25)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5), inset 0 1px 1px rgba(255, 255, 255, 0.12)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(180deg, #222b3d 0%, #181f2c 100%)';
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(180deg, #1c2333 0%, #141924 100%)';
              e.currentTarget.style.borderColor = 'rgba(148, 163, 184, 0.25)';
            }}
          >
            <Lock size={13} color="#93c5fd" />
            <span>Sign In</span>
          </button>
        </div>
      </header>

      {/* Full-Bleed Cinematic Aerospace Hero */}
      <section id="overview" style={{ position: 'relative', width: '100%', overflow: 'hidden' }}>
        <CinematicOrbitalHero onAuthorizeClick={scrollToLogin} />
      </section>

      {/* Section 2: The Biply 3D Feature Grid */}
      <section id="features" style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '1320px',
        margin: '0 auto',
        padding: '5rem 2rem'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'rgba(59, 130, 246, 0.1)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            padding: '0.3rem 0.8rem',
            borderRadius: '20px',
            fontSize: '0.72rem',
            color: '#60a5fa',
            fontWeight: 700,
            letterSpacing: '0.06em',
            marginBottom: '1rem'
          }}>
            <Layers size={13} />
            <span>ENGINEERED ARCHITECTURE & EVIDENCE SOLVERS</span>
          </div>

          <h2 style={{ fontSize: '2.6rem', fontWeight: 900, color: '#fff', letterSpacing: '-0.01em', margin: '0 0 1rem 0' }}>
            ELIMINATING BLIND SPOTS IN AUTONOMOUS NAVIGATION.
          </h2>
          <p style={{ fontSize: '1rem', color: '#94a3b8', maxWidth: '640px', margin: '0 auto', lineHeight: 1.5 }}>
            Each layer solves one fundamental real-world vulnerability — from crude jumps to stealth multi-variable drift and synthetic satellite simulation.
          </p>
        </div>

        {/* 6-Card Dribbble/Biply Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
          gap: '2rem'
        }}>
          {biplyFeatures.map((feat) => {
            return (
              <div
                key={feat.id}
                style={{
                  background: `radial-gradient(circle at 18% 18%, ${feat.color}14 0%, #0c1220 55%, #060911 100%)`,
                  border: '1px solid rgba(255, 255, 255, 0.08)',
                  borderRadius: '24px',
                  padding: '2.25rem 2rem',
                  backdropFilter: 'blur(20px)',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  boxShadow: '0 20px 45px -15px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.1)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-6px)';
                  e.currentTarget.style.borderColor = `${feat.color}85`;
                  e.currentTarget.style.boxShadow = `0 25px 60px -10px ${feat.color}35, inset 0 1px 2px ${feat.color}50`;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                  e.currentTarget.style.boxShadow = '0 20px 45px -15px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.1)';
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
                    {/* 3D Beveled Specular Emblem */}
                    <FeatureEmblem type={feat.type} color={feat.color} />

                    <span style={{
                      fontSize: '0.68rem',
                      fontWeight: 700,
                      color: feat.color,
                      background: 'rgba(0, 0, 0, 0.65)',
                      padding: '0.35rem 0.75rem',
                      borderRadius: '6px',
                      border: `1px solid ${feat.color}45`,
                      letterSpacing: '0.04em',
                      boxShadow: `0 2px 10px ${feat.color}20`
                    }}>
                      {feat.tag}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.35rem', letterSpacing: '0.04em' }}>
                    {feat.subtitle}
                  </div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#ffffff', marginBottom: '0.75rem', letterSpacing: '-0.01em' }}>
                    {feat.title}
                  </h3>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.6 }}>
                    {feat.desc}
                  </p>
                </div>

                <div style={{
                  marginTop: '2rem',
                  paddingTop: '1.1rem',
                  borderTop: '1px solid rgba(255, 255, 255, 0.06)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>BENCHMARK PROOF:</span>
                  <span style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    color: feat.color,
                    fontSize: '0.85rem',
                    background: `${feat.color}15`,
                    padding: '0.2rem 0.55rem',
                    borderRadius: '4px',
                    border: `1px solid ${feat.color}30`
                  }}>
                    {feat.stat}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Section 3: Operator Station Clearance & Authentication (Premium Aerospace Enclave) */}
      <section id="auth-section" style={{
        position: 'relative',
        zIndex: 10,
        maxWidth: '1060px',
        margin: '0 auto',
        padding: '3.5rem 2rem 6rem 2rem'
      }}>
        <div style={{
          background: 'linear-gradient(180deg, #121620 0%, #0d1017 100%)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '20px',
          padding: '3rem',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 25px 60px -12px rgba(0, 0, 0, 0.8), inset 0 1px 1px rgba(255, 255, 255, 0.08)',
          display: 'grid',
          gridTemplateColumns: '1.15fr 1fr',
          gap: '3rem'
        }}>
          {/* Left: Role Profiles */}
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              color: '#94a3b8',
              fontSize: '0.72rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              marginBottom: '0.75rem',
              background: 'rgba(255, 255, 255, 0.04)',
              padding: '0.3rem 0.75rem',
              borderRadius: '20px',
              border: '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <Lock size={13} color="#94a3b8" />
              <span>Zero-Trust Operator Access</span>
            </div>

            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#ffffff', letterSpacing: '-0.01em', marginBottom: '0.6rem' }}>
              Station Clearance
            </h2>
            <p style={{ fontSize: '0.88rem', color: '#94a3b8', lineHeight: 1.55, marginBottom: '1.75rem' }}>
              Select an authorized clearance profile to initialize real-time multi-layer integrity monitoring.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {roles.map((r) => {
                const isSelected = role === r.id;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoleSelect(r)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '1rem 1.15rem',
                      borderRadius: '12px',
                      background: isSelected ? '#18202e' : '#0e121a',
                      border: isSelected ? '1px solid rgba(148, 163, 184, 0.35)' : '1px solid rgba(255, 255, 255, 0.05)',
                      borderLeft: isSelected ? '4px solid #60a5fa' : '1px solid rgba(255, 255, 255, 0.05)',
                      boxShadow: isSelected ? '0 4px 14px rgba(0, 0, 0, 0.4)' : 'none',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '0.9rem', fontWeight: 800, color: isSelected ? '#ffffff' : '#cbd5e1' }}>
                        {r.name}
                      </div>
                      <div style={{ fontSize: '0.74rem', color: isSelected ? '#93c5fd' : '#64748b', marginTop: '3px' }}>
                        {r.access}
                      </div>
                    </div>
                    <span style={{
                      fontSize: '0.68rem',
                      fontFamily: 'var(--font-mono)',
                      fontWeight: 800,
                      padding: '0.25rem 0.6rem',
                      borderRadius: '4px',
                      background: isSelected ? 'rgba(59, 130, 246, 0.15)' : 'rgba(255, 255, 255, 0.04)',
                      border: isSelected ? '1px solid rgba(59, 130, 246, 0.35)' : '1px solid rgba(255, 255, 255, 0.08)',
                      color: isSelected ? '#93c5fd' : '#94a3b8'
                    }}>
                      {r.badge}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right: Credentials Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  Operator Station Clearance ID
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <User size={15} color="#94a3b8" />
                  </div>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: '#0b0e14',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem 0.85rem 3rem',
                      color: '#ffffff',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxShadow: 'inset 0 2px 5px rgba(0, 0, 0, 0.6)'
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.72rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
                  Cryptographic Passkey Attestation
                </label>
                <div style={{ position: 'relative' }}>
                  <div style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '28px',
                    height: '28px',
                    borderRadius: '6px',
                    background: 'rgba(255, 255, 255, 0.05)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    <Key size={15} color="#94a3b8" />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    style={{
                      width: '100%',
                      background: '#0b0e14',
                      border: '1px solid rgba(255, 255, 255, 0.1)',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem 0.85rem 3rem',
                      color: '#ffffff',
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.85rem',
                      outline: 'none',
                      boxShadow: 'inset 0 2px 5px rgba(0, 0, 0, 0.6)'
                    }}
                  />
                </div>
              </div>

              {/* Hardware Security Node Indicators */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '0.75rem',
                background: '#0b0e14',
                border: '1px solid rgba(255, 255, 255, 0.07)',
                padding: '0.65rem 0.9rem',
                borderRadius: '8px'
              }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#cbd5e1' }}>
                  <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px #10b981' }} />
                  Node: <strong style={{ color: '#fff', fontFamily: 'var(--font-mono)' }}>SOC-DELHI-04</strong>
                </span>
                <span style={{
                  color: '#94a3b8',
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                  background: 'rgba(255, 255, 255, 0.05)',
                  padding: '0.2rem 0.5rem',
                  borderRadius: '4px',
                  border: '1px solid rgba(255, 255, 255, 0.1)'
                }}>
                  EAL-5+ ENCLAVE
                </span>
              </div>
            </div>

            <button
              type="submit"
              style={{
                marginTop: '1.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.65rem',
                padding: '0.95rem 1.5rem',
                borderRadius: '12px',
                background: 'linear-gradient(180deg, #1e2638 0%, #151b28 100%)',
                color: '#f8fafc',
                fontWeight: 700,
                fontSize: '0.95rem',
                border: '1px solid rgba(148, 163, 184, 0.28)',
                cursor: 'pointer',
                boxShadow: `
                  0 8px 24px -4px rgba(0, 0, 0, 0.65),
                  0 2px 6px rgba(0, 0, 0, 0.4),
                  inset 0 1px 1px rgba(255, 255, 255, 0.18),
                  inset 0 -1px 2px rgba(0, 0, 0, 0.5)
                `,
                transition: 'all 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
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
              <span>Sign In & Verify Enclave</span>
              <ArrowRight size={17} strokeWidth={2.2} color="#93c5fd" />
            </button>
          </form>
        </div>
      </section>

      {/* Multi-Column NASA/ESA Institutional Footer */}
      <InstitutionalFooter />
    </div>
  );
}
