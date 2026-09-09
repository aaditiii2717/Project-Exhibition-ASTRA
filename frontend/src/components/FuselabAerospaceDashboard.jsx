import React from 'react';
import {
  Activity,
  AlertTriangle,
  CircleHelp,
  Clock3,
  FileSearch,
  MapPin,
  Radio,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
} from 'lucide-react';
import TrustTrajectoryMap from './TrustTrajectoryMap';

const STATE_CONFIG = {
  TRUSTED: { color: '#10b981', icon: ShieldCheck },
  DEGRADED: { color: '#eab308', icon: AlertTriangle },
  SUSPICIOUS: { color: '#f97316', icon: ShieldAlert },
  QUARANTINED: { color: '#ef4444', icon: ShieldX },
  INCONCLUSIVE: { color: '#94a3b8', icon: CircleHelp },
};

const shortEvidenceName = (name) => name.replace('Layer ', '').replace(' — ', ': ');

export default function FuselabAerospaceDashboard({
  steps = [],
  currentStepIndex = 0,
  currentResult,
  currentObs,
  streamStatus,
  onSelectStep,
  onNavigateTab,
}) {
  if (!currentResult || !currentObs) {
    return (
      <section className="soc-card" style={{ minHeight: '240px', display: 'grid', placeItems: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
          <Radio size={24} style={{ marginBottom: '0.6rem' }} />
          <div>No verified telemetry is available yet.</div>
        </div>
      </section>
    );
  }

  const state = currentResult.trust_state || 'INCONCLUSIVE';
  const config = STATE_CONFIG[state] || STATE_CONFIG.INCONCLUSIVE;
  const StateIcon = config.icon;
  const evidence = currentResult.evidence_matrix || [];
  const visibleEvidence = evidence.filter((item) => item.status !== 'UNAVAILABLE').slice(0, 6);
  const timeline = steps.map((step, index) => ({
    index,
    score: step.result?.trust_score ?? 0,
    state: step.result?.trust_state ?? 'INCONCLUSIVE',
  }));
  const totalSteps = Math.max(steps.length, 1);

  return (
    <section style={{ display: 'grid', gap: '1rem' }}>
      <div className="soc-card" style={{ borderColor: `${config.color}66`, padding: '1rem 1.25rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
            <div style={{ color: config.color }}><StateIcon size={28} /></div>
            <div>
              <div className="telemetry-label">Current Navigation Decision</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 750, color: '#fff' }}>{currentResult.recommended_action}</div>
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.8rem', marginTop: '0.25rem' }}>
                {currentResult.primary_reasons?.[0] || 'No primary evidence reason was returned.'}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
            <div><div className="telemetry-label">Trust</div><strong style={{ color: config.color, fontFamily: 'var(--font-mono)', fontSize: '1.35rem' }}>{currentResult.trust_score.toFixed(0)}<span style={{ fontSize: '0.75rem' }}>/100</span></strong></div>
            <div><div className="telemetry-label">Confidence</div><strong style={{ fontFamily: 'var(--font-mono)', fontSize: '1.35rem' }}>{currentResult.confidence.toFixed(0)}<span style={{ fontSize: '0.75rem' }}>%</span></strong></div>
            <span className={`status-indicator badge-${state.toLowerCase()}`}>{state}</span>
          </div>
        </div>
      </div>

      <div className="dashboard-grid">
        <div className="soc-card">
          <div className="soc-card-header"><div className="soc-card-title"><Activity size={15} /> Evidence Snapshot</div><button className="icon-button" onClick={() => onNavigateTab?.('evidence')} title="Open evidence matrix"><FileSearch size={15} /></button></div>
          <div style={{ display: 'grid', gap: '0.45rem' }}>
            {visibleEvidence.map((item) => {
              const color = item.status === 'FAIL' ? '#ef4444' : item.status === 'WARN' ? '#eab308' : '#10b981';
              return <div key={item.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '0.75rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.45rem' }}><span style={{ color: 'var(--text-secondary)', fontSize: '0.78rem' }}>{shortEvidenceName(item.name)}</span><strong style={{ color, fontSize: '0.75rem' }}>{item.status}</strong></div>;
            })}
          </div>
          {evidence.some((item) => item.status === 'UNAVAILABLE') && <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.75rem' }}>Unavailable checks are excluded from the decision confidence calculation.</div>}
        </div>

        <div className="soc-card">
          <div className="soc-card-header"><div className="soc-card-title"><Radio size={15} /> Stream Health</div><span style={{ color: streamStatus?.color || '#94a3b8', fontSize: '0.72rem', fontWeight: 700 }}>{streamStatus?.label || 'UNKNOWN'}</span></div>
          <div className="telemetry-grid" style={{ gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
            <Metric label="Source" value={streamStatus?.source || 'UNKNOWN'} />
            <Metric label="Last epoch" value={currentObs.timestamp} icon={Clock3} />
            <Metric label="Satellite count" value={`${currentObs.satellite_count} SV`} />
            <Metric label="HDOP" value={currentObs.hdop.toFixed(1)} />
          </div>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem', marginTop: '0.75rem' }}>{streamStatus?.detail || 'Waiting for a source health update.'}</div>
        </div>
      </div>

      <div className="soc-card">
        <div className="soc-card-header"><div className="soc-card-title"><MapPin size={15} /> Trust Trajectory</div><span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.72rem' }}>Epoch {currentStepIndex + 1} / {totalSteps}</span></div>
        <TrustTrajectoryMap steps={steps} currentStepIndex={currentStepIndex} onSelectStep={onSelectStep} />
        {timeline.length > 1 && <div style={{ height: '56px', marginTop: '0.75rem' }}><svg viewBox="0 0 100 30" preserveAspectRatio="none" width="100%" height="100%"><polyline fill="none" stroke={config.color} strokeWidth="1.4" points={timeline.map((point) => `${(point.index / (timeline.length - 1)) * 100},${30 - point.score * 0.3}`).join(' ')} /></svg></div>}
      </div>
    </section>
  );
}

function Metric({ label, value, icon: Icon }) {
  return <div className="telemetry-item"><div className="telemetry-label">{Icon && <Icon size={11} style={{ marginRight: '0.25rem', verticalAlign: '-2px' }} />}{label}</div><div className="telemetry-value" style={{ fontSize: '0.85rem' }}>{value}</div></div>;
}
