import React, { useState } from 'react';
import {
  ShieldCheck,
  Satellite,
  Lock,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Radio,
  FileText,
  Activity,
  Terminal,
  Globe,
  Award,
  ChevronRight,
  HelpCircle,
  Copy,
  Check
} from 'lucide-react';

export default function InstitutionalFooter({ onOpenMethodology }) {
  const [copiedNode, setCopiedNode] = useState(false);

  const handleCopyNode = () => {
    navigator.clipboard?.writeText('AS-2026-DEL-NODE-04');
    setCopiedNode(true);
    setTimeout(() => setCopiedNode(false), 2000);
  };

  return (
    <footer style={{
      width: '100%',
      background: 'radial-gradient(circle at 50% 0%, rgba(56, 189, 248, 0.06) 0%, #04070e 45%, #010204 100%)',
      borderTop: '1px solid rgba(56, 189, 248, 0.25)',
      color: '#94a3b8',
      fontSize: '0.82rem',
      lineHeight: 1.6,
      position: 'relative',
      zIndex: 20,
      boxShadow: '0 -25px 60px rgba(0, 0, 0, 0.85)'
    }}>
      {/* 1. Top Luminescent Horizon Light Rail */}
      <div style={{
        height: '2px',
        width: '100%',
        background: 'linear-gradient(90deg, transparent 0%, rgba(56, 189, 248, 0.8) 25%, rgba(16, 185, 129, 0.8) 75%, transparent 100%)',
        boxShadow: '0 0 15px rgba(56, 189, 248, 0.6)'
      }} />

      {/* 2. Main Multi-Column Institutional Grid */}
      <div style={{ maxWidth: '1320px', margin: '0 auto', padding: '4rem 2rem 2.5rem 2rem' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '3rem',
          marginBottom: '3.5rem'
        }}>
          {/* Column 1: ASTRA Identity & Space Agency Alliance */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{
                width: '42px',
                height: '42px',
                borderRadius: '12px',
                background: 'radial-gradient(circle at 35% 30%, rgba(56, 189, 248, 0.4), #1e3a8a)',
                border: '1px solid rgba(56, 189, 248, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 20px rgba(37, 99, 235, 0.5)'
              }}>
                <ShieldCheck size={22} color="#ffffff" />
              </div>
              <div>
                <div style={{ fontSize: '1.3rem', fontWeight: 900, letterSpacing: '0.06em', color: '#ffffff', lineHeight: 1 }}>
                  ASTRA
                </div>
                <div style={{ fontSize: '0.68rem', color: '#38bdf8', fontWeight: 800, letterSpacing: '0.06em', marginTop: '2px' }}>
                  NAVIGATION INTEGRITY LAYER
                </div>
              </div>
            </div>

            <p style={{ fontSize: '0.82rem', color: '#cbd5e1', lineHeight: 1.55, marginBottom: '1.5rem' }}>
              "Normal navigation asks: <em>Where am I?</em><br />
              <strong style={{ color: '#38bdf8' }}>ASTRA asks: Can I trust where I am?</strong>"
            </p>

            <div style={{
              background: '#0e121a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '0.85rem 1rem',
              fontSize: '0.75rem',
              color: '#94a3b8'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', color: '#38bdf8', fontWeight: 800, marginBottom: '3px' }}>
                <Satellite size={14} />
                <span>ALIGNED WITH DO-229F & ISO 26262 INTEGRITY PRINCIPLES</span>
              </div>
              <p style={{ margin: 0, fontSize: '0.74rem', color: '#cbd5e1', lineHeight: 1.4 }}>
                Multi-layer physical invariant monitoring and hybrid ML anomaly detection prototype for safety-critical navigation testbeds.
              </p>
            </div>
          </div>

          {/* Column 2: Core Evidence Solvers */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              Core Evidence Solvers
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#38bdf8', marginTop: '2px' }}>●</span>
                <div>
                  <strong style={{ color: '#e2e8f0' }}>Layer C3: </strong>
                  <span>Doppler Cross-Rate Invariant Solver</span>
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#38bdf8', marginTop: '2px' }}>●</span>
                <div>
                  <strong style={{ color: '#e2e8f0' }}>Layer L2: </strong>
                  <span>Weighted Least Squares (WLS) Geometry</span>
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#38bdf8', marginTop: '2px' }}>●</span>
                <div>
                  <strong style={{ color: '#e2e8f0' }}>Layer L3: </strong>
                  <span>Kalman Kinematic Residual Tracker</span>
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#38bdf8', marginTop: '2px' }}>●</span>
                <div>
                  <strong style={{ color: '#e2e8f0' }}>Layer L4: </strong>
                  <span>Vehicle Acceleration Friction Limit</span>
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#10b981', marginTop: '2px' }}>●</span>
                <div>
                  <strong style={{ color: '#e2e8f0' }}>Hybrid ML: </strong>
                  <span>Isolation Forest + Random Forest Manifold</span>
                </div>
              </li>
              <li style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                <span style={{ color: '#10b981', marginTop: '2px' }}>●</span>
                <div>
                  <strong style={{ color: '#e2e8f0' }}>Forensics: </strong>
                  <span>SHA-256 Sequential Hash-Chaining</span>
                </div>
              </li>
            </ul>
          </div>

          {/* Column 3: Standards Alignment */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              Standards Alignment
            </h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={14} color="#10b981" />
                <span style={{ color: '#cbd5e1' }}>ESA NAVISP-EL2-332 Guidelines</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={14} color="#10b981" />
                <span style={{ color: '#cbd5e1' }}>ISO 26262 ASIL-D Automotive Safety</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={14} color="#10b981" />
                <span style={{ color: '#cbd5e1' }}>RTCA DO-229F Aviation GNSS MOPS</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={14} color="#10b981" />
                <span style={{ color: '#cbd5e1' }}>NIST SP 800-53 R5 Security Controls</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={14} color="#10b981" />
                <span style={{ color: '#cbd5e1' }}>EASA SORA Drone Risk Assessment</span>
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Check size={14} color="#10b981" />
                <span style={{ color: '#cbd5e1' }}>Galileo OSNMA Cryptographic Sync</span>
              </li>
            </ul>
          </div>

          {/* Column 4: Operational Testbed Node */}
          <div>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 800, color: '#ffffff', letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: '1.25rem' }}>
              Operational SOC Enclave
            </h4>

            <div style={{
              background: '#0e121a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '12px',
              padding: '1.15rem',
              marginBottom: '1rem'
            }}>
              <div style={{ fontSize: '0.68rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700, marginBottom: '0.35rem' }}>
                Assigned Testbed Node
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#090c12', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', fontWeight: 800, color: '#f8fafc' }}>
                  AS-2026-DEL-NODE-04
                </span>
                <button
                  onClick={handleCopyNode}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: copiedNode ? '#10b981' : '#38bdf8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.72rem',
                    fontWeight: 700
                  }}
                >
                  {copiedNode ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedNode ? 'Copied' : 'Copy'}</span>
                </button>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.85rem', fontSize: '0.72rem', color: '#cbd5e1' }}>
                <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
                <span>Zero-Trust Gateway: <strong style={{ color: '#10b981' }}>TESTBED ACTIVE</strong></span>
              </div>
              <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.2rem' }}>
                Inference Pipeline Latency: <strong style={{ color: '#38bdf8' }}>0.014s Real-Time</strong>
              </div>
            </div>
          </div>
        </div>

        {/* 3. Bottom Legal & Limitations Bar */}
        <div style={{
          borderTop: '1px solid rgba(255, 255, 255, 0.06)',
          paddingTop: '1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1.5rem',
          paddingTop: '1.75rem',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          fontSize: '0.78rem'
        }}>
          {/* Left: Version & Hardware Rating */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
            <span style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              padding: '0.25rem 0.7rem',
              borderRadius: '6px',
              fontFamily: 'var(--font-mono)',
              fontWeight: 800
            }}>
              ASTRA OS V 2.4.19-SEC
            </span>

            <span style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              color: '#10b981',
              fontFamily: 'var(--font-mono)',
              fontWeight: 700,
              background: 'rgba(16, 185, 129, 0.1)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '0.25rem 0.65rem',
              borderRadius: '6px'
            }}>
              <Lock size={12} color="#10b981" />
              <span>EAL-5+ Hardware Secure Enclave</span>
            </span>
          </div>

          {/* Right: Regulatory Links & Methodology Modal Trigger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', color: '#94a3b8' }}>
            <a
              href="https://www.esa.int"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={(e) => e.target.style.color = '#38bdf8'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
            >
              ESA Space
            </a>
            <span>•</span>
            <a
              href="https://navisp.esa.int"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={(e) => e.target.style.color = '#38bdf8'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
            >
              NAVISP Portal
            </a>
            <span>•</span>
            <a
              href="https://urs.earthdata.nasa.gov"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#94a3b8', textDecoration: 'none', transition: 'color 0.15s' }}
              onMouseEnter={(e) => e.target.style.color = '#38bdf8'}
              onMouseLeave={(e) => e.target.style.color = '#94a3b8'}
            >
              NASA Earthdata
            </a>
            <span>•</span>
            <button
              onClick={onOpenMethodology}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#38bdf8',
                cursor: 'pointer',
                padding: 0,
                fontSize: '0.78rem',
                fontWeight: 700,
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <HelpCircle size={13} color="#38bdf8" />
              <span>Methodology & Limitations</span>
            </button>
          </div>
        </div>

        {/* Copyright */}
        <div style={{ marginTop: '1.5rem', color: '#64748b', fontSize: '0.72rem' }}>
          © 2026 ASTRA Navigation Systems. Certified under ESA NAVISP-EL2-332 and ISO 26262 ASIL-D protocols. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
