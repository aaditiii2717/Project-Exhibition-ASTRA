import React, { useState, useEffect, useRef } from 'react';
import Navbar from './components/Navbar';
import HeroStatus from './components/HeroStatus';
import WhyTrustChangedModal from './components/WhyTrustChangedModal';
import LiveMonitor from './components/LiveMonitor';
import EvidenceMatrix from './components/EvidenceMatrix';
import ForensicsView from './components/ForensicsView';
import EvaluationView from './components/EvaluationView';
import ScenarioSimulator from './components/ScenarioSimulator';
import MethodologyModal from './components/MethodologyModal';
import FuselabAerospaceDashboard from './components/FuselabAerospaceDashboard';
import InstitutionalFooter from './components/InstitutionalFooter';
import LoginPage from './components/LoginPage';

const API_BASE = 'http://localhost:8000';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userSession, setUserSession] = useState({
    username: 'engineer.lead@astra.defense',
    role: 'chief_engineer',
    stationId: 'SOC-DELHI-NODE-04'
  });

  const [currentTab, setCurrentTab] = useState('overview');
  const [mode, setMode] = useState('operator');
  const [dataSource, setDataSource] = useState('SIMULATED');
  const [systemStatus, setSystemStatus] = useState('OPERATIONAL');
  const [streamStatus, setStreamStatus] = useState({ label: 'CONNECTING', color: '#eab308', source: 'SIMULATION', detail: 'Verifying analysis service.' });

  // Scenarios & Playback State
  const [scenarios, setScenarios] = useState([
    { id: 'normal_nav', name: '1. Normal Navigation', key_takeaway: 'Nominal baseline trajectory' },
    { id: 'gnss_degradation', name: '2. GNSS Degradation (Urban Canyon)', key_takeaway: 'Bad GNSS != Spoofing (DEGRADED)' },
    { id: 'sudden_spoof', name: '3. Sudden Spoof (Coordinate Jump)', key_takeaway: 'Instant motion failure & position jump' },
    { id: 'gradual_drift', name: '4. Gradual Drift (Stealth Spoof)', key_takeaway: 'Caught by L3b baseline & ML' },
    { id: 'replay_meaconing', name: '5. Replay / Meaconing Attack', key_takeaway: 'Time reversal & Doppler freeze' },
    { id: 'physical_inconsistency', name: '6. Physical-Layer Inconsistency', key_takeaway: 'C3/L2/L4 residual explosion' },
  ]);
  const [selectedScenarioId, setSelectedScenarioId] = useState('normal_nav');
  const [scenarioSteps, setScenarioSteps] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  // Forensic Ledger & Evaluation Data
  const [ledgerData, setLedgerData] = useState(null);
  const [benchmarkData, setBenchmarkData] = useState(null);

  // Modals
  const [whyModalData, setWhyModalData] = useState(null);
  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  const playbackTimerRef = useRef(null);

  // 1. Initial Load: Fetch Scenarios & Benchmark
  useEffect(() => {
    fetchScenarios();
    fetchBenchmark();
    loadScenario('normal_nav');
    checkServiceHealth();
    const healthTimer = setInterval(checkServiceHealth, 15000);
    return () => clearInterval(healthTimer);
  }, []);

  const checkServiceHealth = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/health`);
      if (!res.ok) throw new Error('Health check failed');
      const data = await res.json();
      setSystemStatus(data.status || 'OPERATIONAL');
      setStreamStatus((previous) => ({ ...previous, label: 'CONNECTED', color: '#10b981', detail: 'Analysis service is reachable. Source data remains explicitly labeled.' }));
    } catch {
      setSystemStatus('OFFLINE');
      setStreamStatus((previous) => ({ ...previous, label: 'OFFLINE', color: '#ef4444', detail: 'Analysis service is unavailable. No new telemetry is being evaluated.' }));
    }
  };

  const fetchScenarios = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/scenarios`);
      if (res.ok) {
        const data = await res.json();
        setScenarios(data);
      }
    } catch (e) {
      console.warn('Backend offline, using client scenarios');
    }
  };

  const fetchBenchmark = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/evaluation`);
      if (res.ok) {
        const data = await res.json();
        setBenchmarkData(data);
      }
    } catch (e) {
      console.warn('Backend evaluation benchmark pending');
    }
  };

  // 2. Load and simulate scenario
  const loadScenario = async (scenarioId) => {
    setIsPlaying(false);
    setSelectedScenarioId(scenarioId);
    setCurrentStepIndex(0);

    try {
      const res = await fetch(`${API_BASE}/api/simulate/${scenarioId}?steps=25`, {
        method: 'POST'
      });
      if (res.ok) {
        const data = await res.json();
        setScenarioSteps(data.steps);
        setDataSource('SIMULATION');
        setStreamStatus({ label: 'SIMULATION', color: '#60a5fa', source: 'SIMULATION', detail: `Deterministic scenario replay: ${scenarioId}.` });
        setLedgerData({ is_valid: data.forensic_chain_valid, status_message: data.chain_status_message, total_events: data.steps.length, dataset_sha256: 'SIMULATED_DATASET', events: data.steps.map((step) => step.forensic_event) });
        return;
      }
    } catch (e) {
      console.warn('Backend offline, generating fallback deterministic data');
    }
  };

  // 3. Playback timer
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(100, 1000 / speed);
      playbackTimerRef.current = setInterval(() => {
        setCurrentStepIndex((prev) => {
          if (prev >= scenarioSteps.length - 1) {
            setIsPlaying(false);
            return prev;
          }
          const nextIndex = prev + 1;
          const nextStep = scenarioSteps[nextIndex];
          if (nextStep && nextStep.why_trust_changed && nextStep.why_trust_changed.occurred) {
            setWhyModalData(nextStep.why_trust_changed);
          }
          return nextIndex;
        });
      }, intervalMs);
    } else {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    }

    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlaying, speed, scenarioSteps]);

  // Current active step
  const currentStep = scenarioSteps[currentStepIndex] || null;
  const currentObs = currentStep ? currentStep.observation : null;
  const currentResult = currentStep ? currentStep.result : null;

  // Handlers
  const handleTogglePlay = () => setIsPlaying(!isPlaying);

  const handleStepForward = () => {
    if (currentStepIndex < scenarioSteps.length - 1) {
      const nextIndex = currentStepIndex + 1;
      setCurrentStepIndex(nextIndex);
      const nextStep = scenarioSteps[nextIndex];
      if (nextStep && nextStep.why_trust_changed && nextStep.why_trust_changed.occurred) {
        setWhyModalData(nextStep.why_trust_changed);
      }
    }
  };

  const handleReset = () => {
    setIsPlaying(false);
    setCurrentStepIndex(0);
  };

  const handleSelectScenario = (id) => {
    loadScenario(id);
  };

  const handleUploadDataset = async (content, type) => {
    try {
      setDataSource('UPLOADED DATA');
      const res = await fetch(`${API_BASE}/api/ingest/text`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, type })
      });
      if (res.ok) {
        const data = await res.json();
        setScenarioSteps(data.steps);
        setCurrentStepIndex(0);
        setLedgerData({ is_valid: data.forensic_chain_valid, status_message: data.chain_status_message, total_events: data.steps.length, dataset_sha256: data.dataset_integrity?.sha256, events: data.steps.map((step) => step.forensic_event) });
        setStreamStatus({ label: 'REPLAY', color: '#60a5fa', source: 'UPLOADED DATA', detail: `${data.dataset_integrity?.valid_records || 0} validated records processed; ${data.dataset_integrity?.rejected_records || 0} rejected.` });
        setCurrentTab('overview');
      }
    } catch (e) {
      alert('Ingestion error: Ensure backend is running.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <LoginPage 
        onLogin={(session) => {
          setUserSession(session);
          setIsAuthenticated(true);
        }}
      />
    );
  }

  return (
    <div className="soc-container">
      {/* Top Mission Control Bar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        mode={mode}
        setMode={setMode}
        dataSource={dataSource}
        systemStatus={systemStatus}
        userSession={userSession}
        onLogout={handleLogout}
        onLaunchDemo={null}
      />

      {/* Main Content Area */}
      <main style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem', flex: 1 }}>
        {/* Hero Trust Status */}
        {currentResult && (
          <HeroStatus
            result={currentResult}
            onWhyChangedClick={() => setWhyModalData(currentStep?.why_trust_changed)}
            hasWhyChanged={currentStep?.why_trust_changed?.occurred}
          />
        )}

        {/* Dynamic Tab Views */}
        {currentTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <FuselabAerospaceDashboard
              steps={scenarioSteps}
              currentStepIndex={currentStepIndex}
              currentResult={currentResult}
              currentObs={currentObs}
              mode={mode}
              streamStatus={streamStatus}
              onSelectStep={(idx) => setCurrentStepIndex(idx)}
              onNavigateTab={(tab) => setCurrentTab(tab)}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
              <LiveMonitor
                observation={currentObs}
                result={currentResult}
                history={scenarioSteps.slice(0, currentStepIndex + 1)}
              />
              <EvidenceMatrix
                evidenceItems={currentResult?.evidence_matrix || []}
                mode={mode}
              />
            </div>
          </div>
        )}

        {/* Evidence Matrix Tab */}
        {currentTab === 'evidence' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <EvidenceMatrix
              evidenceItems={currentResult?.evidence_matrix || []}
              mode={mode}
            />
          </div>
        )}

        {/* Forensics Ledger Tab */}
        {currentTab === 'forensics' && (
          <ForensicsView
            ledgerData={ledgerData}
          />
        )}

        {/* Evaluation Benchmarks Tab */}
        {currentTab === 'evaluation' && (
          <EvaluationView benchmarkData={benchmarkData} />
        )}
      </main>

      {/* Institutional Legal & Safety Standards Footer */}
      <InstitutionalFooter onOpenMethodology={() => setIsMethodologyOpen(true)} />

      {/* Persistent Bottom Simulation Control Bar */}
      <footer style={{
        position: 'sticky',
        bottom: 0,
        zIndex: 900,
        background: 'var(--bg-surface)',
        borderTop: '1px solid var(--border-subtle)',
        padding: '0.65rem 1.5rem',
        boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.5)'
      }}>
        <ScenarioSimulator
          scenarios={scenarios}
          selectedScenarioId={selectedScenarioId}
          onSelectScenario={handleSelectScenario}
          isPlaying={isPlaying}
          onTogglePlay={handleTogglePlay}
          onStepForward={handleStepForward}
          onReset={handleReset}
          speed={speed}
          onSpeedChange={setSpeed}
          currentStepIndex={currentStepIndex}
          totalSteps={scenarioSteps.length}
          onUploadDataset={handleUploadDataset}
        />
      </footer>

      {/* Signature Modals */}
      <WhyTrustChangedModal
        whyData={whyModalData}
        onClose={() => setWhyModalData(null)}
      />

      <MethodologyModal
        isOpen={isMethodologyOpen}
        onClose={() => setIsMethodologyOpen(false)}
      />
    </div>
  );
}
