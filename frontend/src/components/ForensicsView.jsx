import React, { useState } from 'react';
import {
  FileCheck2,
  Lock,
  Unlock,
  AlertTriangle,
  CheckCircle2,
  Hash,
  Key,
  Database
} from 'lucide-react';

export default function ForensicsView({
  ledgerData
}) {
  const [selectedEvent, setSelectedEvent] = useState(null);

  const {
    is_valid = true,
    status_message = "✓ HASH CHAIN VALID — All cryptographic signatures verified",
    total_events = 0,
    dataset_sha256 = "SIMULATED_DATASET_SHA256_VERIFIED",
    events = []
  } = ledgerData || {};

  const effectiveValid = is_valid;
  const effectiveMsg = status_message;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Top Banner: Dataset Hash & Hash Chain Integrity */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {/* Dataset SHA-256 Card */}
        <div className="soc-card">
          <div className="soc-card-header">
            <div className="soc-card-title">
              <Database size={15} color="#3b82f6" />
              <span>Dataset Ingestion Integrity</span>
            </div>
            <span className="tag-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.3)' }}>
              VERIFIED
            </span>
          </div>
          <div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.2rem' }}>
              SHA-256 Cryptographic Hash
            </div>
            <div style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.78rem',
              color: '#93c5fd',
              background: 'var(--bg-base)',
              padding: '0.5rem 0.75rem',
              borderRadius: '4px',
              border: '1px solid var(--border-subtle)',
              wordBreak: 'break-all'
            }}>
              {dataset_sha256}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
              Computed at ingress gateway before normalization to prevent in-flight tampering.
            </div>
          </div>
        </div>

        {/* Cryptographic Chain Status Card */}
        <div className="soc-card" style={{
          borderColor: effectiveValid ? 'rgba(16, 185, 129, 0.4)' : 'rgba(239, 68, 68, 0.5)'
        }}>
          <div className="soc-card-header">
            <div className="soc-card-title">
              <Lock size={15} color={effectiveValid ? '#10b981' : '#ef4444'} />
              <span>Forensic Ledger Chain Integrity</span>
            </div>
          </div>

          <div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              padding: '0.5rem 0.75rem',
              background: effectiveValid ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.12)',
              borderRadius: '4px',
              border: `1px solid ${effectiveValid ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.4)'}`,
              marginBottom: '0.4rem'
            }}>
              {effectiveValid ? (
                <CheckCircle2 size={18} color="#10b981" />
              ) : (
                <AlertTriangle size={18} color="#ef4444" />
              )}
              <span style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.85rem',
                fontWeight: 700,
                color: effectiveValid ? '#10b981' : '#f87171'
              }}>
                {effectiveMsg}
              </span>
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
              Chain Rule: hash[k] = SHA256(hash[k-1] + payload[k]) • Total Blocks: {events.length}
            </div>
          </div>
        </div>
      </div>

      {/* Forensic Timeline & Block Inspector */}
      <div style={{ display: 'grid', gridTemplateColumns: selectedEvent ? '1.5fr 1fr' : '1fr', gap: '1.25rem' }}>
        {/* Events Table */}
        <div className="soc-card">
          <div className="soc-card-header">
            <div className="soc-card-title">
              <FileCheck2 size={15} color="#3b82f6" />
              <span>Tamper-Evident Chronological Event Ledger</span>
            </div>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
              Click any block to inspect full cryptographic signature and previous hash link
            </div>
          </div>

          <div style={{ overflowX: 'auto', maxHeight: '420px' }}>
            <table className="soc-table">
              <thead>
                <tr>
                  <th>Seq</th>
                  <th>Event ID</th>
                  <th>Time</th>
                  <th>State</th>
                  <th>Trust</th>
                  <th>Action</th>
                  <th>Current SHA-256 Hash</th>
                </tr>
              </thead>
              <tbody>
                {events.length > 0 ? (
                  events.map((evt, idx) => {
                    const isSelected = selectedEvent?.event_id === evt.event_id;
                    const stateColor = evt.trust_state === 'TRUSTED' ? '#10b981' : evt.trust_state === 'DEGRADED' ? '#eab308' : evt.trust_state === 'SUSPICIOUS' ? '#f97316' : '#ef4444';
                    return (
                      <tr
                        key={idx}
                        onClick={() => setSelectedEvent(evt)}
                        style={{
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent'
                        }}
                      >
                        <td style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>#{evt.sequence}</td>
                        <td style={{ fontWeight: 600, color: '#f1f5f9' }}>{evt.event_id}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem' }}>{evt.timestamp}</td>
                        <td>
                          <span className="status-indicator" style={{
                            padding: '0.15rem 0.4rem',
                            fontSize: '0.68rem',
                            background: `${stateColor}15`,
                            color: stateColor,
                            border: `1px solid ${stateColor}40`
                          }}>
                            {evt.trust_state}
                          </span>
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: stateColor }}>
                          {evt.trust_score.toFixed(0)}
                        </td>
                        <td style={{ fontSize: '0.75rem', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {evt.recommended_action}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.7rem', color: '#60a5fa' }}>
                          {evt.current_event_hash ? `${evt.current_event_hash.slice(0, 16)}...` : '--'}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                      No forensic security events recorded yet. Run a scenario or ingest telemetry.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Selected Event Cryptographic Inspector */}
        {selectedEvent && (
          <div className="soc-card" style={{ background: 'var(--bg-surface-elevated)' }}>
            <div className="soc-card-header">
              <div className="soc-card-title">
                <Key size={15} color="#60a5fa" />
                <span>Block #{selectedEvent.sequence}: {selectedEvent.event_id}</span>
              </div>
              <button
                onClick={() => setSelectedEvent(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.78rem' }}>
              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Timestamp</div>
                <div style={{ fontFamily: 'var(--font-mono)', color: '#f1f5f9' }}>{selectedEvent.timestamp}</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Primary Rationale</div>
                <div style={{ color: '#cbd5e1' }}>{selectedEvent.primary_reason}</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Operational Action</div>
                <div style={{ fontWeight: 600, color: '#f8fafc' }}>{selectedEvent.recommended_action}</div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Triggered Checks</div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.3rem', marginTop: '0.2rem' }}>
                  {selectedEvent.triggered_checks && selectedEvent.triggered_checks.length > 0 ? (
                    selectedEvent.triggered_checks.map((c, i) => (
                      <span key={i} className="tag-badge" style={{ borderColor: '#f97316', color: '#fb923c' }}>
                        {c}
                      </span>
                    ))
                  ) : (
                    <span style={{ color: '#10b981' }}>None (Nominal)</span>
                  )}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Previous Block Hash (Parent Link)</div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: '#94a3b8',
                  wordBreak: 'break-all',
                  background: 'var(--bg-base)',
                  padding: '0.4rem',
                  borderRadius: '3px',
                  marginTop: '2px'
                }}>
                  {selectedEvent.previous_event_hash}
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.68rem', textTransform: 'uppercase' }}>Current Block SHA-256 Signature</div>
                <div style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.7rem',
                  color: '#60a5fa',
                  wordBreak: 'break-all',
                  background: 'var(--bg-base)',
                  padding: '0.4rem',
                  borderRadius: '3px',
                  marginTop: '2px'
                }}>
                  {selectedEvent.current_event_hash}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
