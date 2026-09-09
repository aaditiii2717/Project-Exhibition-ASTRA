import React from 'react';
import {
  ShieldCheck,
  Radio,
  Map,
  Layers,
  FileCheck2,
  BarChart3,
  PlaySquare,
  Eye,
  Terminal,
  Activity,
  LogOut,
  User,
  Satellite
} from 'lucide-react';

export default function Navbar({
  currentTab,
  setCurrentTab,
  mode,
  setMode,
  dataSource,
  systemStatus = "OPERATIONAL",
  userSession,
  onLogout,
  onLaunchDemo
}) {
  // Role-Based Access Control configuration
  // Role-Based Access Control configuration
  const role = userSession?.role || 'chief_engineer';
  const isLevel4 = role === 'chief_engineer';
  const isLevel3 = role === 'soc_analyst';
  const isLevel2 = role === 'autonomous_operator';

  // Strictly filter tabs so only permitted tabs are shown in Navbar
  const primaryTabs = [
    { id: 'overview', label: 'Mission Control', icon: ShieldCheck, minLevel: 2 },
    ...(!isLevel2 ? [{ id: 'evidence', label: 'Evidence Matrix', icon: Layers, minLevel: 3 }] : []),
    ...(!isLevel2 ? [{ id: 'forensics', label: 'Forensic Memory', icon: FileCheck2, minLevel: 3 }] : []),
    ...(isLevel4 ? [{ id: 'evaluation', label: 'Evaluation & Benchmarks', icon: BarChart3, minLevel: 4 }] : []),
  ];

  const getRoleBadge = () => {
    if (isLevel4) return { label: 'LVL 4 • CHIEF ENGINEER', color: '#38bdf8', bg: 'rgba(56, 189, 248, 0.12)' };
    if (isLevel3) return { label: 'LVL 3 • SOC CYBER AUDITOR', color: '#a855f7', bg: 'rgba(168, 85, 247, 0.12)' };
    return { label: 'LVL 2 • FLEET DISPATCH', color: '#10b981', bg: 'rgba(16, 185, 129, 0.12)' };
  };

  const badgeInfo = getRoleBadge();

  return (
    <header className="soc-header">
      {/* Left: Brand Identity & Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        <div style={{
          background: 'linear-gradient(135deg, #1e3a8a, #2563eb)',
          width: '32px',
          height: '32px',
          borderRadius: '6px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 12px rgba(37, 99, 235, 0.35)'
        }}>
          <ShieldCheck size={18} color="#fff" />
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span style={{ fontSize: '1.05rem', fontWeight: 800, letterSpacing: '0.06em', color: '#fff' }}>ASTRA</span>
            <span className="tag-badge" style={{ borderColor: 'rgba(59, 130, 246, 0.4)', color: '#60a5fa', fontSize: '0.62rem', padding: '0.1rem 0.35rem' }}>
              INTEGRITY LAYER
            </span>
          </div>
        </div>

        {/* Status Indicators */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', borderLeft: '1px solid var(--border-subtle)', paddingLeft: '0.75rem', marginLeft: '0.25rem' }}>
          <span className="tag-badge" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', borderColor: 'rgba(16, 185, 129, 0.25)' }}>
            <span className="status-dot trusted" style={{ width: '4px', height: '4px', marginRight: '3px' }}></span>
            {systemStatus}
          </span>
          <span className="tag-badge" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#93c5fd', borderColor: 'rgba(59, 130, 246, 0.25)' }}>
            {dataSource}
          </span>
        </div>
      </div>

      {/* Center: Streamlined Primary Navigation with Role Access */}
      <nav className="soc-nav-tabs">
        {primaryTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`soc-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentTab(tab.id)}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right: User Session & Clearance Level Badge */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
        {/* Dynamic Clearance Level Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: badgeInfo.bg,
          border: `1px solid ${badgeInfo.color}40`,
          borderRadius: 'var(--radius-sm)',
          padding: '0.25rem 0.6rem',
          fontSize: '0.68rem',
          fontWeight: 800,
          color: badgeInfo.color,
          fontFamily: 'var(--font-mono)'
        }}>
          <User size={11} color={badgeInfo.color} />
          <span>{badgeInfo.label}</span>
        </div>

        {onLaunchDemo && <button
          className="btn"
          onClick={onLaunchDemo}
          style={{
            background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(30, 58, 138, 0.3))',
            border: '1px solid rgba(59, 130, 246, 0.4)',
            color: '#38bdf8',
            fontSize: '0.72rem',
            padding: '0.3rem 0.65rem'
          }}
          title="3-Minute Live Demo Walkthrough for Judges"
        >
          <PlaySquare size={12} color="#38bdf8" />
          <span>Demo Flow</span>
        </button>}

        {/* Compact Mode Switcher */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          background: 'var(--bg-base)',
          border: '1px solid var(--border-subtle)',
          borderRadius: 'var(--radius-sm)',
          padding: '2px'
        }}>
          <button
            onClick={() => setMode('operator')}
            style={{
              border: 'none',
              background: mode === 'operator' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: mode === 'operator' ? '#f8fafc' : 'var(--text-muted)',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.2rem 0.5rem',
              borderRadius: '3px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <Eye size={11} />
            Operator
          </button>
          <button
            onClick={() => setMode('forensic')}
            style={{
              border: 'none',
              background: mode === 'forensic' ? 'var(--bg-surface-elevated)' : 'transparent',
              color: mode === 'forensic' ? '#60a5fa' : 'var(--text-muted)',
              fontSize: '0.7rem',
              fontWeight: 600,
              padding: '0.2rem 0.5rem',
              borderRadius: '3px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}
          >
            <Terminal size={11} />
            Engineer
          </button>
        </div>

        {/* Log Out Button */}
        {onLogout && (
          <button
            onClick={onLogout}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '4px',
              color: 'var(--text-muted)',
              padding: '0.3rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center'
            }}
            title="Lock Station / Log Out"
          >
            <LogOut size={13} />
          </button>
        )}
      </div>
    </header>
  );
}
