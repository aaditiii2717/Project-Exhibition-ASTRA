import React from 'react';
import { X, BookOpen, AlertTriangle, ShieldCheck, Compass, Lock, Award } from 'lucide-react';

export default function MethodologyModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 14, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2500,
      padding: '1.5rem'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '720px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        maxHeight: '85vh',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface-elevated)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <BookOpen size={18} color="#60a5fa" />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
              ASTRA METHODOLOGY & ENGINEERING LIMITATIONS
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem', fontSize: '0.825rem', lineHeight: 1.5 }}>
          {/* Methodology */}
          <div>
            <h4 style={{ fontSize: '0.9rem', color: '#38bdf8', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <ShieldCheck size={16} />
              The 8-Stage Navigation Integrity Lifecycle
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.6rem' }}>
              <div style={{ background: 'var(--bg-base)', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <strong>1. Ingress Sanitization:</strong> Schema validation, geodetic bounds [-90, 90], time monotonicity, and input SHA-256 calculation.
              </div>
              <div style={{ background: 'var(--bg-base)', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <strong>2. Normalization:</strong> Mapping heterogeneous NMEA 0183 ($GPGGA, $GPRMC) and CSV telemetry into standard ASTRA schema.
              </div>
              <div style={{ background: 'var(--bg-base)', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <strong>3. Basic Engineering Checks:</strong> Velocity plausibility, haversine displacement vs speed·dt, and GDOP availability.
              </div>
              <div style={{ background: 'var(--bg-base)', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <strong>4. Advanced GNSS Physics:</strong> Layer C3 Doppler cross-rate, Layer L2 WLS geometry residuals, Layer L3 smoothness, and Layer L4 pairwise invariance.
              </div>
              <div style={{ background: 'var(--bg-base)', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <strong>5. Hybrid Machine Learning:</strong> Isolation Forest and Random Forest anomaly scoring with local feature attribution.
              </div>
              <div style={{ background: 'var(--bg-base)', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <strong>6. Evidence Fusion:</strong> Transparent weighted aggregation yielding separate Trust Score (0–100) and Confidence (0–100%).
              </div>
              <div style={{ background: 'var(--bg-base)', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <strong>7. Decision Engine:</strong> Discrete state assignment (TRUSTED, DEGRADED, SUSPICIOUS, QUARANTINED, INCONCLUSIVE) with Why Trust Changed diff.
              </div>
              <div style={{ background: 'var(--bg-base)', padding: '0.6rem 0.8rem', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
                <strong>8. Forensic Cryptography:</strong> Tamper-evident SHA-256 block hash chaining: hash[k] = SHA256(hash[k-1] + payload[k]).
              </div>
            </div>
          </div>

          {/* Scientific Honesty & Limitations */}
          <div>
            <h4 style={{ fontSize: '0.9rem', color: '#f59e0b', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={16} />
              Explicit Engineering Limitations Statement
            </h4>
            <ul style={{ paddingLeft: '1.25rem', color: '#cbd5e1', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
              <li><strong>Standard NMEA Availability:</strong> Standard consumer NMEA streams provide only PVT (Position, Velocity, Time). Layers C3, L2, and L4 gracefully report <code>DATA NOT AVAILABLE</code> rather than fabricating raw measurements.</li>
              <li><strong>Calibrated vs Demo Thresholds:</strong> Current thresholds are labeled <code>DEMO THRESHOLD</code>. Production deployment requires receiver-specific empirical calibration against certified drive/flight datasets.</li>
              <li><strong>Decision Support vs Actuation:</strong> ASTRA is an integrity verification and cybersecurity decision-support layer; it should NOT directly actuate vehicle flight controls without higher-level INS/sensor fusion fallback.</li>
              <li><strong>No Universal Silver Bullet:</strong> Multi-layer defense drastically shrinks the attacker's attack surface, but cannot guarantee detection of mathematically synchronized multi-antenna spoofing without cryptographic GNSS signals (e.g. Galileo OSNMA).</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '0.85rem 1.5rem', background: 'var(--bg-base)', borderTop: '1px solid var(--border-subtle)', display: 'flex', justifyContent: 'flex-end' }}>
          <button className="btn btn-primary" onClick={onClose} style={{ fontSize: '0.78rem' }}>
            Acknowledge & Close
          </button>
        </div>
      </div>
    </div>
  );
}
