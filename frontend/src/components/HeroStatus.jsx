import React from 'react';
import {
  ShieldCheck,
  AlertTriangle,
  ShieldAlert,
  ShieldX,
  HelpCircle,
  TrendingUp,
  Award,
  ChevronRight,
  Info
} from 'lucide-react';

export default function HeroStatus({ result, onWhyChangedClick, hasWhyChanged }) {
  if (!result) {
    return (
      <div className="soc-card" style={{ textAlign: 'center', padding: '2.5rem' }}>
        <div style={{ color: 'var(--text-muted)' }}>Awaiting GNSS Navigation Telemetry Stream...</div>
      </div>
    );
  }

  const { trust_score, trust_state, confidence, primary_reasons, recommended_action } = result;

  const stateConfig = {
    TRUSTED: {
      color: 'var(--state-trusted)',
      bgClass: 'trusted',
      badgeClass: 'badge-trusted',
      icon: ShieldCheck,
      desc: 'Navigation observations conform to vehicle kinematics, satellite geometry, and physical carrier invariants.'
    },
    DEGRADED: {
      color: 'var(--state-degraded)',
      bgClass: 'degraded',
      badgeClass: 'badge-degraded',
      icon: AlertTriangle,
      desc: 'Satellite geometry or tracking quality is attenuated. Navigation is noisy, but physically consistent (Bad GNSS != Spoofing).'
    },
    SUSPICIOUS: {
      color: 'var(--state-suspicious)',
      bgClass: 'suspicious',
      badgeClass: 'badge-suspicious',
      icon: ShieldAlert,
      desc: 'Kinematic divergence detected. Observed displacement contradicts Doppler speed or satellite geometry.'
    },
    QUARANTINED: {
      color: 'var(--state-quarantined)',
      bgClass: 'quarantined',
      badgeClass: 'badge-quarantined',
      icon: ShieldX,
      desc: 'Severe multi-layer physical breakdown or spatial discontinuity. Navigation fix is untrusted.'
    },
    INCONCLUSIVE: {
      color: 'var(--state-inconclusive)',
      bgClass: 'inconclusive',
      badgeClass: 'badge-inconclusive',
      icon: HelpCircle,
      desc: 'Confidence is below decision threshold (<35%). Insufficient raw evidence to guarantee integrity.'
    }
  };

  const current = stateConfig[trust_state] || stateConfig.INCONCLUSIVE;
  const StateIcon = current.icon;

  return (
    <div className={`hero-status-box ${current.bgClass}`}>
      {/* Left: State Badge & Core Decision */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '12px',
          background: 'rgba(0, 0, 0, 0.4)',
          border: `2px solid ${current.color}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: `0 0 24px ${current.color}33`
        }}>
          <StateIcon size={38} color={current.color} />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <span className={`status-indicator ${current.badgeClass}`} style={{ fontSize: '0.9rem', padding: '0.3rem 0.8rem' }}>
              <span className={`status-dot ${current.bgClass}`}></span>
              {trust_state}
            </span>

            {hasWhyChanged && (
              <button
                onClick={onWhyChangedClick}
                className="btn btn-secondary"
                style={{
                  fontSize: '0.75rem',
                  padding: '0.2rem 0.6rem',
                  background: 'rgba(59, 130, 246, 0.15)',
                  borderColor: '#3b82f6',
                  color: '#93c5fd'
                }}
              >
                <Info size={13} />
                <span>Why Did Trust Change?</span>
              </button>
            )}
          </div>

          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.02em', color: '#fff', marginBottom: '0.25rem' }}>
            {recommended_action}
          </h2>
          <p style={{ fontSize: '0.825rem', color: 'var(--text-secondary)', maxWidth: '640px' }}>
            {primary_reasons && primary_reasons.length > 0 ? primary_reasons[0] : current.desc}
          </p>
        </div>
      </div>

      {/* Right: Quantified Trust Score vs Independent Confidence */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
        {/* Trust Score Gauge */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
            Trust Score
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.2rem' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '2.4rem',
              fontWeight: 800,
              color: current.color
            }}>
              {trust_score.toFixed(0)}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>/100</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Physical Plausibility
          </div>
        </div>

        <div style={{ width: '1px', height: '55px', background: 'var(--border-strong)' }}></div>

        {/* Independent Confidence Gauge */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 600, letterSpacing: '0.05em' }}>
            Confidence
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'center', gap: '0.2rem' }}>
            <span style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '2.4rem',
              fontWeight: 800,
              color: confidence >= 70 ? '#38bdf8' : '#f59e0b'
            }}>
              {confidence.toFixed(0)}
            </span>
            <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>%</span>
          </div>
          <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            Evidence Consensus
          </div>
        </div>
      </div>
    </div>
  );
}
