import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Map as MapIcon,
  Crosshair,
  Layers,
  Maximize2,
  Info,
  Navigation,
  Compass,
  AlertTriangle,
  Plane,
  Eye,
  Globe,
  Radio
} from 'lucide-react';

export default function TrustTrajectoryMap({
  steps = [],
  currentStepIndex = 0,
  mode = 'operator',
  onSelectStep
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const polylineLayerGroupRef = useRef(null);
  const markersLayerGroupRef = useRef(null);
  const vehicleMarkerRef = useRef(null);
  const tileLayerRef = useRef(null);

  const [selectedWaypoint, setSelectedWaypoint] = useState(null);
  const [mapType, setMapType] = useState('satellite'); // 'satellite' (DroneSense style) or 'dark'

  const getStateColor = (state) => {
    switch (state) {
      case 'TRUSTED': return '#10b981';
      case 'DEGRADED': return '#eab308';
      case 'SUSPICIOUS': return '#f97316';
      case 'QUARANTINED': return '#ef4444';
      default: return '#64748b';
    }
  };

  // 1. Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [28.6139, 77.2090],
        zoom: 14,
        zoomControl: true,
        attributionControl: false
      });

      // Default to ESRI World Imagery (DroneSense aerial satellite style)
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(map);

      polylineLayerGroupRef.current = L.layerGroup().addTo(map);
      markersLayerGroupRef.current = L.layerGroup().addTo(map);

      mapInstanceRef.current = map;
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Switch Map Tiles (Satellite vs Dark Tactical)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);

    if (mapType === 'satellite') {
      tileLayerRef.current = L.tileLayer(
        'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
        { maxZoom: 19 }
      ).addTo(mapInstanceRef.current);
    } else {
      tileLayerRef.current = L.tileLayer(
        'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
        {
          maxZoom: 19,
          className: 'dark-tiles'
        }
      ).addTo(mapInstanceRef.current);
    }
  }, [mapType]);

  // 3. Render Segments & Vehicle Position
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !polylineLayerGroupRef.current || !markersLayerGroupRef.current) return;

    polylineLayerGroupRef.current.clearLayers();
    markersLayerGroupRef.current.clearLayers();

    if (!steps || steps.length === 0) return;

    const visibleSteps = steps.slice(0, currentStepIndex + 1);
    const latLngs = [];

    // Draw multi-colored path segments
    for (let i = 0; i < visibleSteps.length; i++) {
      const step = visibleSteps[i];
      const obs = step.observation;
      const res = step.result;
      const pt = [obs.latitude, obs.longitude];
      latLngs.push(pt);

      if (i > 0) {
        const prevObs = visibleSteps[i - 1].observation;
        const prevPt = [prevObs.latitude, prevObs.longitude];
        const segColor = getStateColor(res.state);

        // Draw shadow glow path
        L.polyline([prevPt, pt], {
          color: segColor,
          weight: 7,
          opacity: 0.35,
          lineCap: 'round'
        }).addTo(polylineLayerGroupRef.current);

        // Draw core trajectory line
        L.polyline([prevPt, pt], {
          color: segColor,
          weight: 3.5,
          opacity: 0.95,
          lineCap: 'round'
        }).addTo(polylineLayerGroupRef.current);
      }

      // Waypoint Clickable Nodes
      const circleMarker = L.circleMarker(pt, {
        radius: i === currentStepIndex ? 7 : 4,
        fillColor: getStateColor(res.state),
        color: '#ffffff',
        weight: i === currentStepIndex ? 2.5 : 1,
        opacity: 0.9,
        fillOpacity: 0.95
      });

      circleMarker.on('click', () => {
        setSelectedWaypoint({
          index: i,
          step,
          stateColor: getStateColor(res.state)
        });
        if (onSelectStep) onSelectStep(i);
      });

      circleMarker.addTo(markersLayerGroupRef.current);
    }

    // Vehicle Animated Marker (Drone / Autonomous Vehicle)
    if (visibleSteps.length > 0) {
      const activeStep = visibleSteps[visibleSteps.length - 1];
      const curPt = [activeStep.observation.latitude, activeStep.observation.longitude];
      const curColor = getStateColor(activeStep.result.state);

      if (vehicleMarkerRef.current) {
        map.removeLayer(vehicleMarkerRef.current);
      }

      const vehicleIcon = L.divIcon({
        className: 'custom-vehicle-marker',
        html: `
          <div style="position: relative; width: 34px; height: 34px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 32px; height: 32px; border-radius: 50%; background: ${curColor}; opacity: 0.3; animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
            <div style="position: absolute; width: 22px; height: 22px; border-radius: 50%; background: ${curColor}; opacity: 0.6;"></div>
            <div style="position: relative; width: 12px; height: 12px; border-radius: 50%; background: #ffffff; border: 2px solid ${curColor}; box-shadow: 0 0 10px ${curColor};"></div>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17]
      });

      vehicleMarkerRef.current = L.marker(curPt, { icon: vehicleIcon }).addTo(map);

      // Pan to vehicle smoothly
      map.panTo(curPt, { animate: true, duration: 0.4 });
    }
  }, [steps, currentStepIndex]);

  const activeObs = steps[currentStepIndex]?.observation;
  const activeRes = steps[currentStepIndex]?.result;

  return (
    <div className="soc-card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
      {/* Map Header Controls */}
      <div style={{
        padding: '0.75rem 1.25rem',
        background: 'rgba(10, 14, 22, 0.95)',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '0.75rem',
        zIndex: 400,
        position: 'relative'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Plane size={17} color="#38bdf8" />
          <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#fff', letterSpacing: '0.04em' }}>
            AUTONOMOUS FLIGHT SURVEY & TRUST TRAJECTORY
          </span>
          <span className="tag-badge" style={{ background: 'rgba(56, 189, 248, 0.1)', color: '#38bdf8', borderColor: 'rgba(56, 189, 248, 0.3)' }}>
            EPOCH {currentStepIndex + 1}/{steps.length || 25}
          </span>
        </div>

        {/* Map Type Switcher (DroneSense Satellite vs Dark Tactical) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            background: 'var(--bg-base)',
            padding: '2px',
            borderRadius: '6px',
            border: '1px solid var(--border-subtle)'
          }}>
            <button
              onClick={() => setMapType('satellite')}
              style={{
                border: 'none',
                background: mapType === 'satellite' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                color: mapType === 'satellite' ? '#60a5fa' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '0.25rem 0.6rem',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Globe size={12} />
              Satellite Aerial
            </button>
            <button
              onClick={() => setMapType('dark')}
              style={{
                border: 'none',
                background: mapType === 'dark' ? 'rgba(59, 130, 246, 0.25)' : 'transparent',
                color: mapType === 'dark' ? '#60a5fa' : 'var(--text-muted)',
                fontSize: '0.72rem',
                fontWeight: 600,
                padding: '0.25rem 0.6rem',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px'
              }}
            >
              <Layers size={12} />
              Dark Tactical
            </button>
          </div>

          <button
            className="btn btn-secondary"
            onClick={() => {
              if (mapInstanceRef.current && steps.length > 0) {
                const cur = steps[currentStepIndex].observation;
                mapInstanceRef.current.setView([cur.latitude, cur.longitude], 15);
              }
            }}
            style={{ fontSize: '0.72rem', padding: '0.25rem 0.6rem' }}
            title="Recenter Map on Vehicle"
          >
            <Crosshair size={13} />
            <span>Recenter</span>
          </button>
        </div>
      </div>

      {/* Main Map Container with Overlays */}
      <div style={{ position: 'relative', width: '100%', height: '520px' }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* DroneSense Style Top-Left Mission HUD */}
        <div style={{
          position: 'absolute',
          top: '14px',
          left: '14px',
          zIndex: 500,
          background: 'rgba(8, 12, 20, 0.88)',
          border: '1px solid rgba(59, 130, 246, 0.35)',
          borderRadius: '10px',
          padding: '0.85rem 1.15rem',
          backdropFilter: 'blur(12px)',
          boxShadow: '0 10px 30px rgba(0, 0, 0, 0.6)',
          width: '240px'
        }}>
          <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.04em' }}>
            Flight Telemetry HUD
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem', fontSize: '0.75rem' }}>
            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>ALTITUDE</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f8fafc' }}>
                {activeObs ? `${activeObs.altitude.toFixed(1)} m` : '--'}
              </div>
            </div>

            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>GROUND SPEED</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38bdf8' }}>
                {activeObs ? `${activeObs.speed.toFixed(1)} m/s` : '--'}
              </div>
            </div>

            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>HEADING</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f8fafc' }}>
                {activeObs ? `${(activeObs.heading || 45).toFixed(0)}°` : '--'}
              </div>
            </div>

            <div>
              <div style={{ color: '#94a3b8', fontSize: '0.65rem' }}>SATELLITES</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#10b981' }}>
                {activeObs ? `${activeObs.satellite_count} SVs` : '--'}
              </div>
            </div>
          </div>

          {/* Real-time State Badge */}
          <div style={{ marginTop: '0.65rem', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.68rem', color: '#cbd5e1' }}>INTEGRITY:</span>
            <span className="tag-badge" style={{
              background: `${getStateColor(activeRes?.state)}18`,
              borderColor: getStateColor(activeRes?.state),
              color: getStateColor(activeRes?.state),
              fontWeight: 800,
              fontSize: '0.68rem'
            }}>
              {activeRes?.state || 'TRUSTED'}
            </span>
          </div>
        </div>

        {/* Map Legend (Bottom-Left) */}
        <div style={{
          position: 'absolute',
          bottom: '16px',
          left: '14px',
          zIndex: 500,
          background: 'rgba(8, 12, 20, 0.88)',
          border: '1px solid rgba(255, 255, 255, 0.08)',
          borderRadius: '8px',
          padding: '0.5rem 0.85rem',
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.85rem',
          fontSize: '0.72rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981' }} />
            <span style={{ color: '#d1fae5' }}>Trusted</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#eab308' }} />
            <span style={{ color: '#fef08a' }}>Degraded</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f97316' }} />
            <span style={{ color: '#fed7aa' }}>Suspicious</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ color: '#fca5a5' }}>Quarantined</span>
          </div>
        </div>

        {/* Waypoint Inspector Drawer (Right Side) */}
        {selectedWaypoint && (
          <div style={{
            position: 'absolute',
            top: '14px',
            right: '14px',
            bottom: '14px',
            width: '320px',
            background: 'rgba(10, 15, 26, 0.94)',
            border: '1px solid var(--border-strong)',
            borderRadius: '12px',
            padding: '1.25rem',
            backdropFilter: 'blur(16px)',
            zIndex: 600,
            overflowY: 'auto',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Navigation size={16} color="#38bdf8" />
                <span style={{ fontWeight: 800, fontSize: '0.875rem', color: '#fff' }}>
                  WAYPOINT #{selectedWaypoint.index + 1} INSPECTION
                </span>
              </div>
              <button
                onClick={() => setSelectedWaypoint(null)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1rem' }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>INTEGRITY STATUS:</span>
                <span className="tag-badge" style={{ borderColor: selectedWaypoint.stateColor, color: selectedWaypoint.stateColor, fontWeight: 700 }}>
                  {selectedWaypoint.step.result.state}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>TRUST / CONFIDENCE:</span>
                <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#f8fafc' }}>
                  {selectedWaypoint.step.result.trust_score} / {selectedWaypoint.step.result.confidence}%
                </span>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Coordinates & Motion
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.4rem', fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: '#cbd5e1' }}>
                  <div>Lat: {selectedWaypoint.step.observation.latitude.toFixed(5)}°</div>
                  <div>Lon: {selectedWaypoint.step.observation.longitude.toFixed(5)}°</div>
                  <div>Speed: {selectedWaypoint.step.observation.speed.toFixed(1)} m/s</div>
                  <div>Alt: {selectedWaypoint.step.observation.altitude.toFixed(1)} m</div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '0.65rem' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem' }}>
                  Primary Triggering Evidence
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  {selectedWaypoint.step.result.evidence_matrix?.slice(0, 4).map((ev, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#94a3b8' }}>
                      <span>{ev.name}:</span>
                      <span style={{ color: ev.status === 'PASS' ? '#10b981' : ev.status === 'WARN' ? '#eab308' : '#ef4444', fontWeight: 600 }}>
                        {ev.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
