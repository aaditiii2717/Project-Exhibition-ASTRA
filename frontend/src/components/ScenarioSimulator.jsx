import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  RotateCcw,
  UploadCloud,
  FileText,
  Sliders,
  AlertCircle,
  Radio,
  CheckCircle2,
  Clock
} from 'lucide-react';

export default function ScenarioSimulator({
  scenarios = [],
  selectedScenarioId,
  onSelectScenario,
  isPlaying,
  onTogglePlay,
  onStepForward,
  onReset,
  speed,
  onSpeedChange,
  currentStepIndex,
  totalSteps,
  onUploadDataset,
  uploadStatus
}) {
  const [showUpload, setShowUpload] = useState(false);
  const [uploadContent, setUploadContent] = useState('');
  const [uploadType, setUploadType] = useState('csv');

  const speeds = [1, 2, 5, 10];

  const handleUploadSubmit = (e) => {
    e.preventDefault();
    if (!uploadContent.trim()) return;
    onUploadDataset(uploadContent, uploadType);
    setShowUpload(false);
  };

  const currentScen = scenarios.find(s => s.id === selectedScenarioId);

  return (
    <div className="soc-card" style={{ background: 'var(--bg-surface-elevated)' }}>
      {/* Simulation Controls Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem',
        paddingBottom: '0.75rem',
        borderBottom: '1px solid var(--border-subtle)'
      }}>
        {/* Scenario Selection */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <Radio size={15} color="#3b82f6" />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
              Threat Scenario:
            </span>
          </div>

          <select
            value={selectedScenarioId}
            onChange={(e) => onSelectScenario(e.target.value)}
            style={{
              background: 'var(--bg-base)',
              color: '#f8fafc',
              border: '1px solid var(--border-strong)',
              borderRadius: 'var(--radius-sm)',
              padding: '0.35rem 0.75rem',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            {scenarios.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name}
              </option>
            ))}
          </select>

          <button
            className="btn btn-secondary"
            onClick={() => setShowUpload(!showUpload)}
            style={{ fontSize: '0.72rem', padding: '0.3rem 0.6rem' }}
          >
            <UploadCloud size={13} />
            <span>Upload CSV / NMEA</span>
          </button>
        </div>

        {/* Playback Controls & Speed */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'var(--bg-base)', padding: '2px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
            <button
              className="btn btn-secondary"
              onClick={onReset}
              style={{ padding: '0.3rem 0.5rem', border: 'none' }}
              title="Reset to Step 0"
            >
              <RotateCcw size={13} />
            </button>
            <button
              className={`btn ${isPlaying ? 'btn-danger' : 'btn-primary'}`}
              onClick={onTogglePlay}
              style={{ padding: '0.3rem 0.85rem' }}
            >
              {isPlaying ? <Pause size={13} /> : <Play size={13} />}
              <span style={{ fontSize: '0.75rem' }}>{isPlaying ? 'Pause' : 'Play Stream'}</span>
            </button>
            <button
              className="btn btn-secondary"
              onClick={onStepForward}
              style={{ padding: '0.3rem 0.5rem', border: 'none' }}
              disabled={isPlaying}
              title="Step Forward Single Epoch"
            >
              <SkipForward size={13} />
            </button>
          </div>

          {/* Speed Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'var(--bg-base)', padding: '2px', borderRadius: '4px', border: '1px solid var(--border-subtle)' }}>
            {speeds.map((s) => (
              <button
                key={s}
                onClick={() => onSpeedChange(s)}
                style={{
                  border: 'none',
                  background: speed === s ? 'var(--bg-surface-elevated)' : 'transparent',
                  color: speed === s ? '#60a5fa' : 'var(--text-muted)',
                  fontSize: '0.7rem',
                  fontWeight: 600,
                  padding: '0.2rem 0.45rem',
                  borderRadius: '3px',
                  cursor: 'pointer'
                }}
              >
                {s}x
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Progress Slider */}
      <div style={{ paddingTop: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '70px' }}>
          Epoch {currentStepIndex + 1}/{totalSteps || 25}
        </span>
        <div style={{ flex: 1, position: 'relative', height: '6px', background: 'var(--bg-base)', borderRadius: '3px', overflow: 'hidden' }}>
          <div
            style={{
              width: `${((currentStepIndex + 1) / (totalSteps || 25)) * 100}%`,
              height: '100%',
              background: 'linear-gradient(90deg, #3b82f6, #10b981)',
              transition: 'width 0.15s ease'
            }}
          />
        </div>
        <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontStyle: 'italic' }}>
          {currentScen ? currentScen.key_takeaway : 'Interactive Simulation Stream'}
        </span>
      </div>

      {/* Custom Dataset Upload Drawer */}
      {showUpload && (
        <form onSubmit={handleUploadSubmit} style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
            <div style={{ fontSize: '0.78rem', fontWeight: 600, color: '#f8fafc' }}>
              Upload Custom GNSS Dataset (Computes SHA-256 Hash Automatically)
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <input
                  type="radio"
                  name="type"
                  checked={uploadType === 'csv'}
                  onChange={() => setUploadType('csv')}
                  style={{ marginRight: '4px' }}
                />
                CSV (lat, lon, speed, hdop)
              </label>
              <label style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                <input
                  type="radio"
                  name="type"
                  checked={uploadType === 'nmea'}
                  onChange={() => setUploadType('nmea')}
                  style={{ marginRight: '4px' }}
                />
                NMEA ($GPGGA, $GPRMC)
              </label>
            </div>
          </div>

          <textarea
            rows={5}
            value={uploadContent}
            onChange={(e) => setUploadContent(e.target.value)}
            placeholder={
              uploadType === 'csv'
                ? "timestamp,latitude,longitude,altitude,speed,satellite_count,hdop\n12:00:00,28.6139,77.2090,215.0,12.0,9,0.9\n12:00:01,28.6140,77.2091,215.0,12.0,9,0.9"
                : "$GPGGA,120000.00,2836.834,N,07712.540,E,1,08,0.9,215.0,M,0.0,M,,*47\n$GPRMC,120000.00,A,2836.834,N,07712.540,E,23.3,65.0,030926,,,A*7A"
            }
            style={{
              width: '100%',
              background: 'var(--bg-base)',
              color: '#93c5fd',
              fontFamily: 'var(--font-mono)',
              fontSize: '0.75rem',
              padding: '0.6rem',
              borderRadius: '4px',
              border: '1px solid var(--border-strong)',
              resize: 'vertical'
            }}
          />

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem', marginTop: '0.5rem' }}>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setShowUpload(false)}
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.75rem' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              style={{ fontSize: '0.75rem', padding: '0.3rem 0.85rem' }}
            >
              Validate & Ingest Stream
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
