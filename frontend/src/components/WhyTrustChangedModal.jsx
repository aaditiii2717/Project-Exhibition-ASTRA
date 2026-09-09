import React from 'react';
import { X, ArrowRight, AlertOctagon, ShieldCheck, Activity, Layers, CheckCircle2 } from 'lucide-react';

export default function WhyTrustChangedModal({ whyData, onClose }) {
  if (!whyData || !whyData.occurred) return null;

  const {
    previous_state,
    current_state,
    previous_score,
    current_score,
    triggering_evidence = [],
    conclusion,
    recommended_action,
    key_metrics_diff = {}
  } = whyData;

  const stateColors = {
    TRUSTED: '#10b981',
    DEGRADED: '#eab308',
    SUSPICIOUS: '#f97316',
    QUARANTINED: '#ef4444',
    INCONCLUSIVE: '#94a3b8'
  };

  const prevCol = stateColors[previous_state] || '#94a3b8';
  const currCol = stateColors[current_state] || '#94a3b8';

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(5, 8, 14, 0.85)',
      backdropFilter: 'blur(6px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000,
      padding: '1.5rem'
    }}>
      <div style={{
        background: 'var(--bg-surface)',
        border: '1px solid var(--border-strong)',
        borderRadius: 'var(--radius-lg)',
        width: '100%',
        maxWidth: '680px',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)',
        overflow: 'hidden'
      }}>
        {/* Modal Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'var(--bg-surface-elevated)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <AlertOctagon size={20} color={currCol} />
            <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '0.04em', color: '#fff' }}>
              DIAGNOSTIC EVENT: WHY DID TRUST CHANGE?
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: '0.2rem'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {/* State Transition Diff Banner */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'var(--bg-base)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            padding: '1rem 1.5rem'
          }}>
            {/* Previous State */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Previous State
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: prevCol }}>
                {previous_state}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Score: {previous_score ? previous_score.toFixed(0) : '--'}
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', color: 'var(--text-muted)' }}>
              <ArrowRight size={24} color="#60a5fa" />
              <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Shift</span>
            </div>

            {/* Current State */}
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                Current State
              </div>
              <div style={{ fontSize: '1.1rem', fontWeight: 800, color: currCol }}>
                {current_state}
              </div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Score: {current_score ? current_score.toFixed(0) : '--'}
              </div>
            </div>
          </div>

          {/* Triggering Evidence */}
          <div>
            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
              Triggering Physical & Kinematic Evidence
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {triggering_evidence.length > 0 ? (
                triggering_evidence.map((ev, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-subtle)',
                      borderLeft: `3px solid ${currCol}`,
                      borderRadius: 'var(--radius-sm)',
                      padding: '0.6rem 0.85rem',
                      fontSize: '0.825rem',
                      color: 'var(--text-primary)',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.5rem'
                    }}
                  >
                    <Activity size={15} color={currCol} style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{ev}</span>
                  </div>
                ))
              ) : (
                <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>No specific failure flags recorded.</div>
              )}
            </div>
          </div>

          {/* Scientific Conclusion */}
          <div style={{
            background: 'rgba(59, 130, 246, 0.08)',
            border: '1px solid rgba(59, 130, 246, 0.25)',
            borderRadius: 'var(--radius-sm)',
            padding: '0.85rem 1rem'
          }}>
            <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', fontWeight: 700, color: '#60a5fa', marginBottom: '0.25rem' }}>
              Integrity Conclusion
            </div>
            <div style={{ fontSize: '0.85rem', color: '#e2e8f0', lineHeight: 1.4 }}>
              {conclusion}
            </div>
          </div>

          {/* Recommended Action */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Recommended Operational Action
              </div>
              <div style={{ fontSize: '0.95rem', fontWeight: 700, color: currCol }}>
                {recommended_action}
              </div>
            </div>

            <button
              className="btn btn-primary"
              onClick={onClose}
              style={{ fontSize: '0.8rem', padding: '0.45rem 1rem' }}
            >
              Acknowledge
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
