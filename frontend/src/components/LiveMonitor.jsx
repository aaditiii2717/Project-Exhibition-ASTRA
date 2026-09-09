import React from 'react';
import {
  Activity,
  Compass,
  Satellite,
  Gauge,
  Shield,
  Layers,
  TrendingDown,
  Clock
} from 'lucide-react';

export default function LiveMonitor({ observation, result, history = [] }) {
  if (!observation || !result) {
    return (
      <div className="soc-card" style={{ padding: '2rem', textAlign: 'center' }}>
        <div style={{ color: 'var(--text-muted)' }}>Awaiting live navigation stream telemetry...</div>
      </div>
    );
  }

  // Extract time series for sparkline charts
  const timeLabels = history.slice(-20).map(h => h.observation.timestamp.split(':').slice(1).join(':'));
  const trustScores = history.slice(-20).map(h => h.result.trust_score);
  const speeds = history.slice(-20).map(h => h.observation.speed);
  const hdops = history.slice(-20).map(h => h.observation.hdop);

  // SVG Sparkline Helper
  const renderSparkline = (data, minVal = 0, maxVal = 100, strokeColor = '#3b82f6') => {
    if (!data || data.length < 2) return null;
    const width = 240;
    const height = 48;
    const range = maxVal - minVal || 1;

    const points = data.map((val, idx) => {
      const x = (idx / (data.length - 1)) * width;
      const y = height - ((val - minVal) / range) * (height - 8) - 4;
      return `${x},${y}`;
    }).join(' ');

    return (
      <svg width={width} height={height} style={{ overflow: 'visible' }}>
        <polyline
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          points={points}
        />
        {/* Latest point dot */}
        {data.length > 0 && (
          <circle
            cx={width}
            cy={height - ((data[data.length - 1] - minVal) / range) * (height - 8) - 4}
            r="4"
            fill={strokeColor}
          />
        )}
      </svg>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      {/* Current Kinematic & GNSS Telemetry Bar */}
      <div className="soc-card">
        <div className="soc-card-header">
          <div className="soc-card-title">
            <Gauge size={16} color="#3b82f6" />
            <span>Instantaneous GNSS Telemetry Readout</span>
          </div>
          <div className="tag-badge" style={{ color: '#94a3b8' }}>
            <Clock size={11} style={{ display: 'inline', marginRight: '3px' }} />
            {observation.timestamp}
          </div>
        </div>

        <div className="telemetry-grid">
          <div className="telemetry-item">
            <div className="telemetry-label">Latitude</div>
            <div className="telemetry-value" style={{ color: '#38bdf8' }}>{observation.latitude.toFixed(6)}°</div>
          </div>
          <div className="telemetry-item">
            <div className="telemetry-label">Longitude</div>
            <div className="telemetry-value" style={{ color: '#38bdf8' }}>{observation.longitude.toFixed(6)}°</div>
          </div>
          <div className="telemetry-item">
            <div className="telemetry-label">Altitude (MSL)</div>
            <div className="telemetry-value">{observation.altitude.toFixed(1)} m</div>
          </div>
          <div className="telemetry-item">
            <div className="telemetry-label">Ground Speed</div>
            <div className="telemetry-value">{observation.speed.toFixed(1)} m/s</div>
          </div>
          <div className="telemetry-item">
            <div className="telemetry-label">Heading (COG)</div>
            <div className="telemetry-value">{observation.heading.toFixed(0)}°</div>
          </div>
          <div className="telemetry-item">
            <div className="telemetry-label">Satellites Tracked</div>
            <div className="telemetry-value" style={{ color: observation.satellite_count >= 8 ? '#10b981' : '#eab308' }}>
              {observation.satellite_count} SVs
            </div>
          </div>
          <div className="telemetry-item">
            <div className="telemetry-label">Fix Quality</div>
            <div className="telemetry-value">{observation.fix_quality === 1 ? '3D GPS' : observation.fix_quality === 2 ? 'DGPS' : 'None'}</div>
          </div>
          <div className="telemetry-item">
            <div className="telemetry-label">HDOP / PDOP</div>
            <div className="telemetry-value" style={{ color: observation.hdop < 2.0 ? '#10b981' : '#f97316' }}>
              {observation.hdop.toFixed(1)} / {observation.pdop.toFixed(1)}
            </div>
          </div>
        </div>
      </div>

      {/* Scientific Time-Series Charts Panel */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1rem' }}>
        {/* Chart 1: Trust Score Evolution */}
        <div className="soc-card">
          <div className="soc-card-header">
            <div className="soc-card-title">
              <Shield size={15} color="#10b981" />
              <span>Trust Score Over Time</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: '#10b981' }}>
              {result.trust_score.toFixed(0)} / 100
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {renderSparkline(trustScores, 0, 100, result.trust_score >= 75 ? '#10b981' : result.trust_score >= 50 ? '#eab308' : '#ef4444')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              <span>Historical (last 20 epochs)</span>
              <span>Threshold: 75 (Trusted)</span>
            </div>
          </div>
        </div>

        {/* Chart 2: Ground Speed Kinematics */}
        <div className="soc-card">
          <div className="soc-card-header">
            <div className="soc-card-title">
              <Activity size={15} color="#3b82f6" />
              <span>Ground Speed (m/s)</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700 }}>
              {observation.speed.toFixed(1)} m/s
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {renderSparkline(speeds, 0, Math.max(30, ...speeds), '#38bdf8')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              <span>Doppler Speed Envelope</span>
              <span>Vehicle Profile: Automotive</span>
            </div>
          </div>
        </div>

        {/* Chart 3: Geometric Dilution of Precision (HDOP) */}
        <div className="soc-card">
          <div className="soc-card-header">
            <div className="soc-card-title">
              <Satellite size={15} color="#f59e0b" />
              <span>Horizontal Dilution (HDOP)</span>
            </div>
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', fontWeight: 700, color: observation.hdop < 2.0 ? '#10b981' : '#f59e0b' }}>
              {observation.hdop.toFixed(1)}
            </span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ height: '70px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {renderSparkline(hdops, 0, Math.max(6, ...hdops), '#f59e0b')}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
              <span>Geometry Limit: 2.5 (Nominal)</span>
              <span>Urban Multipath Indicator</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
