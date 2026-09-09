import React from 'react';
import {
  X,
  PlaySquare,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  AlertOctagon,
  Lock,
  BarChart3,
  CheckCircle2,
  Sparkles
} from 'lucide-react';

export default function DemoGuideModal({
  isOpen,
  onClose,
  onRunStep,
  currentDemoStep = 1
}) {
  if (!isOpen) return null;

  const demoSteps = [
    {
      step: 1,
      scenarioId: 'normal_nav',
      title: 'STEP 1: Baseline Nominal Navigation',
      expectedState: 'TRUSTED (88/100)',
      color: '#10b981',
      pitchText: '"Judges, we begin with normal vehicle navigation. ASTRA continuously verifies that motion matches Doppler speed and satellite geometry agrees. All 10 checks pass."'
    },
    {
      step: 2,
      scenarioId: 'gnss_degradation',
      title: 'STEP 2: Urban Canyon Degradation',
      expectedState: 'DEGRADED (62/100)',
      color: '#eab308',
      pitchText: '"Now our vehicle enters a high-rise urban canyon. Satellites drop from 11 to 5 and HDOP rises to 4.2. CRITICAL: ASTRA classifies this as DEGRADED, not spoofing. Bad GNSS != Attack!"'
    },
    {
      step: 3,
      scenarioId: 'sudden_spoof',
      title: 'STEP 3: Sudden Spoof Injection',
      expectedState: 'SUSPICIOUS → QUARANTINED',
      color: '#f97316',
      pitchText: '"Here, an attacker injects a 3.8 km position jump. Reported speed says 12 m/s, but implied displacement says 3800 m/s. Motion consistency fails instantly, triggering our signature Why Did Trust Change? diagnostics."'
    },
    {
      step: 4,
      scenarioId: 'physical_inconsistency',
      title: 'STEP 4: Physical-Layer Breakdown',
      expectedState: 'QUARANTINED (10/100)',
      color: '#ef4444',
      pitchText: '"Even if a sophisticated spoofer generates smooth fake coordinates, they cannot fake raw physics. Layer C3 Doppler cross-rate and Layer L2 WLS geometry residuals explode, forcing immediate quarantine."'
    },
    {
      step: 5,
      scenarioId: 'forensics_view',
      title: 'STEP 5: Cryptographic Forensic Memory',
      expectedState: 'HASH CHAIN VERIFIED',
      color: '#38bdf8',
      pitchText: '"Every navigation decision is appended to a tamper-evident SHA-256 hash chain. If an adversary attempts to whitewash logs after an incident, the chain breaks instantly."'
    },
    {
      step: 6,
      scenarioId: 'evaluation_view',
      title: 'STEP 6: Empirical Scientific Benchmark',
      expectedState: 'F1: 100% vs Rules 66%',
      color: '#a855f7',
      pitchText: '"Finally, our benchmark shows measured performance on unseen scenarios: ASTRA achieves 0.0% False Positive Rate while baseline rules fail on stealth drift."'
    }
  ];

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
        maxWidth: '740px',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          padding: '1rem 1.5rem',
          borderBottom: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #1e293b, #0f172a)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <Sparkles size={20} color="#38bdf8" />
            <span style={{ fontWeight: 800, fontSize: '1.05rem', color: '#fff' }}>
              3-MINUTE HACKATHON LIVE DEMO FLOW
            </span>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Steps Grid */}
        <div style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '520px', overflowY: 'auto' }}>
          {demoSteps.map((ds) => {
            const isCurrent = currentDemoStep === ds.step;
            return (
              <div
                key={ds.step}
                style={{
                  background: isCurrent ? 'var(--bg-surface-hover)' : 'var(--bg-surface-elevated)',
                  border: isCurrent ? `2px solid ${ds.color}` : '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  padding: '0.85rem 1.25rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.4rem',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                    <span style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: ds.color,
                      background: 'rgba(0, 0, 0, 0.4)',
                      padding: '0.2rem 0.5rem',
                      borderRadius: '3px'
                    }}>
                      0{ds.step}
                    </span>
                    <strong style={{ fontSize: '0.9rem', color: '#f1f5f9' }}>{ds.title}</strong>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className="tag-badge" style={{ borderColor: `${ds.color}40`, color: ds.color }}>
                      {ds.expectedState}
                    </span>
                    <button
                      className="btn btn-primary"
                      onClick={() => {
                        onRunStep(ds);
                        onClose();
                      }}
                      style={{ fontSize: '0.72rem', padding: '0.25rem 0.75rem' }}
                    >
                      <span>Trigger Step</span>
                      <ArrowRight size={12} />
                    </button>
                  </div>
                </div>

                <p style={{ fontSize: '0.8rem', color: '#94a3b8', fontStyle: 'italic', lineHeight: 1.4 }}>
                  {ds.pitchText}
                </p>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.85rem 1.5rem',
          background: 'var(--bg-base)',
          borderTop: '1px solid var(--border-subtle)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          fontSize: '0.75rem',
          color: 'var(--text-muted)'
        }}>
          <span>Click "Trigger Step" to load scenario, simulate live stream, and show proof to judges.</span>
          <button className="btn btn-secondary" onClick={onClose} style={{ fontSize: '0.75rem' }}>
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
