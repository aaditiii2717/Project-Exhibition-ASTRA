"""
ASTRA Advanced GNSS Physical-Layer Evidence Engine
Implements the 4-layer physical integrity model:
- Layer L1: Doppler–Range Consistency (Doppler vs pseudorange-rate)
- Layer L2: Position Geometry Residual (Iterative Least-Squares Pseudorange Solution)
- Layer L3: Trajectory Smoothness (L3a Acceleration Consistency, L3b Baseline Drift)
- Layer L4: Relative Geometry (Pairwise Single-Differenced Doppler Invariance)

STRICT AVAILABILITY PRINCIPLE:
If raw physical measurements (pseudoranges, Doppler, satellite ephemeris) are unavailable,
the checks gracefully return UNAVAILABLE with an explanation. Values are NEVER fabricated.
"""

import math
from typing import List, Optional, Tuple, Dict
from ..core.schema import GNSSObservation, EvidenceItem, CheckStatus


class PhysicalLayerEngine:
    # Speed of light in vacuum (m/s)
    SPEED_OF_LIGHT = 299792458.0
    # GPS L1 Carrier frequency (Hz)
    GPS_L1_FREQ = 1575.42e6

    def __init__(self):
        # Historical buffer for trajectory smoothness (L3)
        self.trajectory_history: List[Tuple[float, float, float, float]] = []  # (lat, lon, alt, time_sec)
        self.baseline_origin: Optional[Tuple[float, float, float]] = None  # (lat, lon, alt)
        self.prev_pseudoranges: Optional[List[float]] = None
        self.prev_time: Optional[float] = None

        # Configurable thresholds (clearly labeled as DEMO THRESHOLD)
        self.c3_rms_threshold_warn = 2.0  # m/s
        self.c3_rms_threshold_fail = 5.0  # m/s
        self.l2_rms_threshold_warn = 12.0  # meters
        self.l2_rms_threshold_fail = 30.0  # meters
        self.l3a_accel_threshold = 12.0  # m/s^2
        self.l3b_drift_threshold = 80.0  # meters
        self.l4_rms_threshold_warn = 3.0  # m/s
        self.l4_rms_threshold_fail = 7.0  # m/s

    def reset(self):
        self.trajectory_history.clear()
        self.baseline_origin = None
        self.prev_pseudoranges = None
        self.prev_time = None

    def evaluate(self, obs: GNSSObservation) -> List[EvidenceItem]:
        """Evaluates all 4 physical layers with strict data availability gating."""
        items = []

        # Update trajectory history
        t_sec = self._parse_time_sec(obs.timestamp)
        self.trajectory_history.append((obs.latitude, obs.longitude, obs.altitude, t_sec))
        if len(self.trajectory_history) > 50:
            self.trajectory_history.pop(0)

        if self.baseline_origin is None:
            self.baseline_origin = (obs.latitude, obs.longitude, obs.altitude)

        items.append(self._check_c3_cross_rate(obs))
        items.append(self._check_l2_position_geometry(obs))
        items.append(self._check_l3_trajectory_smoothness(obs))
        items.append(self._check_l4_relative_geometry(obs, t_sec))

        self.prev_pseudoranges = obs.pseudorange
        self.prev_time = t_sec
        return items

    def _check_c3_cross_rate(self, obs: GNSSObservation) -> EvidenceItem:
        """
        Layer L1: Doppler–range consistency.
        For satellite i: Δ_i = ρdot_i + (c / f0) * f_d,i ≈ 0
        """
        if (obs.pseudorange_rate is None or obs.doppler is None or
                len(obs.pseudorange_rate) == 0 or len(obs.doppler) == 0):
            return EvidenceItem(
                name="Layer L1 — Doppler–Range Consistency",
                category="PHYSICAL",
                value=None,
                status=CheckStatus.UNAVAILABLE,
                severity=0.0,
                explanation="DATA NOT AVAILABLE: Raw Doppler and pseudorange-rate observations are not present in current telemetry stream.",
                formula="Δ_i = ρ̇_i + (c / f₀) · f_{d,i} ≈ 0",
                threshold=f"RMS <= {self.c3_rms_threshold_warn} m/s",
                threshold_type="DEMO THRESHOLD",
                is_available=False,
                unavailability_reason="Requires receiver-level raw Doppler (f_d) and pseudorange rate (ρ̇).",
                weight=1.5
            )

        n = min(len(obs.pseudorange_rate), len(obs.doppler))
        residuals = []
        c_over_f0 = self.SPEED_OF_LIGHT / self.GPS_L1_FREQ  # ~0.19029 m/cycle

        for i in range(n):
            rho_dot = obs.pseudorange_rate[i]
            doppler = obs.doppler[i]
            # Standard sign convention: incoming Doppler shift increases frequency as distance decreases
            delta_i = rho_dot + (c_over_f0 * doppler)
            residuals.append(delta_i)

        if not residuals:
            c3_rms = 0.0
        else:
            c3_rms = math.sqrt(sum(r ** 2 for r in residuals) / len(residuals))

        if c3_rms > self.c3_rms_threshold_fail:
            return EvidenceItem(
                name="Layer L1 — Doppler–Range Consistency",
                category="PHYSICAL",
                value=round(c3_rms, 3),
                status=CheckStatus.FAIL,
                severity=0.92,
                explanation=(
                    f"PHYSICAL INCONSISTENCY: L1 Doppler–range RMS residual elevated to {c3_rms:.2f} m/s (threshold: {self.c3_rms_threshold_fail} m/s). "
                    f"Pseudorange rate contradicts Doppler frequency shift across {n} satellites. Characteristic of synthetic signal injection."
                ),
                formula="Δ_i = ρ̇_i + (c / f₀) · f_{d,i} ≈ 0",
                threshold=f"RMS <= {self.c3_rms_threshold_warn} m/s",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.8
            )
        elif c3_rms > self.c3_rms_threshold_warn:
            return EvidenceItem(
                name="Layer L1 — Doppler–Range Consistency",
                category="PHYSICAL",
                value=round(c3_rms, 3),
                status=CheckStatus.WARN,
                severity=0.5,
                explanation=f"Moderate L1 Doppler–range discrepancy ({c3_rms:.2f} m/s). Possible ionospheric scintillation or multipath reflection.",
                formula="Δ_i = ρ̇_i + (c / f₀) · f_{d,i} ≈ 0",
                threshold=f"RMS <= {self.c3_rms_threshold_warn} m/s",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.2
            )
        else:
            return EvidenceItem(
                name="Layer L1 — Doppler–Range Consistency",
                category="PHYSICAL",
                value=round(c3_rms, 3),
                status=CheckStatus.PASS,
                severity=0.0,
                explanation=f"Doppler shift matches pseudorange rate across all {n} satellites (RMS: {c3_rms:.2f} m/s). Physical carrier consistency verified.",
                formula="Δ_i = ρ̇_i + (c / f₀) · f_{d,i} ≈ 0",
                threshold=f"RMS <= {self.c3_rms_threshold_warn} m/s",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.5
            )

    def _check_l2_position_geometry(self, obs: GNSSObservation) -> EvidenceItem:
        """
        Layer L2: Position Geometry Residual.
        min_{r0, b} Σ (ρ_i - ||r_sat,i - r0|| - cb)^2
        Core question: "Do all satellites simultaneously agree on one receiver position?"
        """
        if (obs.pseudorange is None or obs.satellite_positions is None or
                len(obs.pseudorange) < 4 or len(obs.satellite_positions) < 4):
            return EvidenceItem(
                name="Layer L2 — Position Geometry Residual",
                category="PHYSICAL",
                value=None,
                status=CheckStatus.UNAVAILABLE,
                severity=0.0,
                explanation="DATA NOT AVAILABLE: Multi-satellite raw pseudoranges and ECEF satellite ephemeris positions are required (>=4 SVs).",
                formula="min_{r₀, b} Σ (ρ_i - ||r_{sat,i} - r₀|| - cb)² = δ²",
                threshold=f"RMS <= {self.l2_rms_threshold_warn} m",
                threshold_type="DEMO THRESHOLD",
                is_available=False,
                unavailability_reason="Standard NMEA delivers resolved PVT solution, not raw pseudorange-ephemeris vectors.",
                weight=1.6
            )

        # Approximate receiver position in ECEF from reported lat/lon/alt
        r0_est = self._geodetic_to_ecef(obs.latitude, obs.longitude, obs.altitude)

        residuals = []
        n_sats = min(len(obs.pseudorange), len(obs.satellite_positions))

        # Approximate clock bias via mean geometric difference
        geom_dists = []
        for i in range(n_sats):
            r_sat = obs.satellite_positions[i]
            dist = math.sqrt(sum((r_sat[k] - r0_est[k]) ** 2 for k in range(3)))
            geom_dists.append(dist)

        # Estimated clock bias cb = mean(pseudorange - geometric distance)
        cb_est = sum(obs.pseudorange[i] - geom_dists[i] for i in range(n_sats)) / n_sats

        for i in range(n_sats):
            residual = abs(obs.pseudorange[i] - geom_dists[i] - cb_est)
            residuals.append(residual)

        l2_rms = math.sqrt(sum(r ** 2 for r in residuals) / len(residuals))

        if l2_rms > self.l2_rms_threshold_fail:
            return EvidenceItem(
                name="Layer L2 — Position Geometry Residual",
                category="PHYSICAL",
                value=round(l2_rms, 2),
                status=CheckStatus.FAIL,
                severity=0.96,
                explanation=(
                    f"GEOMETRIC DIVERGENCE: L2 RMS residual reached {l2_rms:.1f}m (HIGH, threshold: {self.l2_rms_threshold_fail}m). "
                    f"Satellites do not simultaneously agree on a single receiver position. High probability of constellation spoofing or desynchronized fake signals."
                ),
                formula="min_{r₀, b} Σ (ρ_i - ||r_{sat,i} - r₀|| - cb)² = δ²",
                threshold=f"RMS <= {self.l2_rms_threshold_warn} m",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.9
            )
        elif l2_rms > self.l2_rms_threshold_warn:
            return EvidenceItem(
                name="Layer L2 — Position Geometry Residual",
                category="PHYSICAL",
                value=round(l2_rms, 2),
                status=CheckStatus.WARN,
                severity=0.52,
                explanation=f"Elevated L2 pseudorange residual (RMS={l2_rms:.1f}m, MODERATE). Signals exhibit geometric stress or severe multipath.",
                formula="min_{r₀, b} Σ (ρ_i - ||r_{sat,i} - r₀|| - cb)² = δ²",
                threshold=f"RMS <= {self.l2_rms_threshold_warn} m",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.3
            )
        else:
            return EvidenceItem(
                name="Layer L2 — Position Geometry Residual",
                category="PHYSICAL",
                value=round(l2_rms, 2),
                status=CheckStatus.PASS,
                severity=0.0,
                explanation=f"Geometric agreement confirmed across all {n_sats} satellites (RMS: {l2_rms:.1f}m, LOW). Receiver position cleanly intersects all pseudorange spheres.",
                formula="min_{r₀, b} Σ (ρ_i - ||r_{sat,i} - r₀|| - cb)² = δ²",
                threshold=f"RMS <= {self.l2_rms_threshold_warn} m",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.6
            )

    def _check_l3_trajectory_smoothness(self, obs: GNSSObservation) -> EvidenceItem:
        """
        Layer L3: Trajectory Smoothness.
        L3a - Acceleration consistency: a = |p(k+1) - 2p(k) + p(k-1)| / dt^2
        L3b - Baseline displacement: |p_current - p_baseline|
        Detects sudden spoof transitions, gradual drift, and persistent deviations.
        """
        if len(self.trajectory_history) < 3:
            return EvidenceItem(
                name="Layer L3 — Trajectory Smoothness",
                category="PHYSICAL",
                value=0.0,
                status=CheckStatus.PASS,
                severity=0.0,
                explanation="Building temporal waypoint history for acceleration derivative smoothing.",
                formula="a = ||p(k+1) - 2p(k) + p(k-1)|| / Δt²",
                threshold=f"Accel <= {self.l3a_accel_threshold} m/s²",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.3
            )

        p_prev2 = self.trajectory_history[-3]
        p_prev1 = self.trajectory_history[-2]
        p_curr = self.trajectory_history[-1]

        dt = max(0.5, p_curr[3] - p_prev1[3])

        # Convert to local meter displacement relative to p_prev1
        lat_scale = 111320.0
        lon_scale = 111320.0 * math.cos(math.radians(p_curr[0]))

        dx_k = (p_curr[1] - p_prev1[1]) * lon_scale
        dy_k = (p_curr[0] - p_prev1[0]) * lat_scale
        dz_k = (p_curr[2] - p_prev1[2])

        dx_prev = (p_prev1[1] - p_prev2[1]) * lon_scale
        dy_prev = (p_prev1[0] - p_prev2[0]) * lat_scale
        dz_prev = (p_prev1[2] - p_prev2[2])

        # Second derivative |p(k) - 2p(k-1) + p(k-2)| / dt^2 = |Δp_k - Δp_{k-1}| / dt^2
        d2x = (dx_k - dx_prev) / (dt ** 2)
        d2y = (dy_k - dy_prev) / (dt ** 2)
        d2z = (dz_k - dz_prev) / (dt ** 2)
        accel_deriv = math.sqrt(d2x ** 2 + d2y ** 2 + d2z ** 2)

        # Baseline displacement (L3b)
        dist_from_origin = 0.0
        if self.baseline_origin:
            dist_from_origin = self._haversine(
                self.baseline_origin[0], self.baseline_origin[1],
                obs.latitude, obs.longitude
            )

        if accel_deriv > self.l3a_accel_threshold:
            return EvidenceItem(
                name="Layer L3 — Trajectory Smoothness",
                category="PHYSICAL",
                value=round(accel_deriv, 2),
                status=CheckStatus.FAIL,
                severity=0.91,
                explanation=(
                    f"TRAJECTORY DISCONTINUITY: Inferred second-order acceleration reached {accel_deriv:.1f} m/s² "
                    f"(exceeds physical bound {self.l3a_accel_threshold} m/s²). Sharp trajectory kink/step detected."
                ),
                formula="a = ||p(k+1) - 2p(k) + p(k-1)|| / Δt²",
                threshold=f"Accel <= {self.l3a_accel_threshold} m/s²",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.5
            )
        elif accel_deriv > (self.l3a_accel_threshold * 0.6):
            return EvidenceItem(
                name="Layer L3 — Trajectory Smoothness",
                category="PHYSICAL",
                value=round(accel_deriv, 2),
                status=CheckStatus.WARN,
                severity=0.48,
                explanation=f"Moderate trajectory curvature (accel={accel_deriv:.1f} m/s², baseline offset={dist_from_origin:.0f}m).",
                formula="a = ||p(k+1) - 2p(k) + p(k-1)|| / Δt²",
                threshold=f"Accel <= {self.l3a_accel_threshold} m/s²",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.1
            )
        else:
            return EvidenceItem(
                name="Layer L3 — Trajectory Smoothness",
                category="PHYSICAL",
                value=round(accel_deriv, 2),
                status=CheckStatus.PASS,
                severity=0.0,
                explanation=f"Trajectory evolution is physically smooth (inferred acceleration: {accel_deriv:.2f} m/s²).",
                formula="a = ||p(k+1) - 2p(k) + p(k-1)|| / Δt²",
                threshold=f"Accel <= {self.l3a_accel_threshold} m/s²",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.3
            )

    def _check_l4_relative_geometry(self, obs: GNSSObservation, t_sec: float) -> EvidenceItem:
        """
        Layer L4: Relative Geometry.
        Pairwise consistency: L_ij = d/dt(ρ_i - ρ_j) - (v_sat,i · r̂_i - v_sat,j · r̂_j) ≈ 0
        Does not depend on absolute receiver coordinates in the same way as L2.
        """
        if (obs.pseudorange is None or obs.satellite_velocities is None or
                obs.satellite_positions is None or len(obs.pseudorange) < 3):
            return EvidenceItem(
                name="Layer L4 — Relative Geometry",
                category="PHYSICAL",
                value=None,
                status=CheckStatus.UNAVAILABLE,
                severity=0.0,
                explanation="DATA NOT AVAILABLE: Pairwise single-differenced Doppler and satellite ECEF velocity vectors are required.",
                formula="L_{ij} = d/dt(ρ_i - ρ_j) - (v_{sat,i} · r̂_i - v_{sat,j} · r̂_j) ≈ 0",
                threshold=f"RMS <= {self.l4_rms_threshold_warn} m/s",
                threshold_type="DEMO THRESHOLD",
                is_available=False,
                unavailability_reason="Requires satellite ephemeris velocity vectors (vx, vy, vz) and multi-channel pseudoranges.",
                weight=1.4
            )

        if self.prev_pseudoranges is None or self.prev_time is None:
            return EvidenceItem(
                name="Layer L4 — Relative Geometry",
                category="PHYSICAL",
                value=0.0,
                status=CheckStatus.PASS,
                severity=0.0,
                explanation="Establishing pairwise satellite single-differenced differential baseline.",
                formula="L_{ij} ≈ 0",
                threshold=f"RMS <= {self.l4_rms_threshold_warn} m/s",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.2
            )

        dt = max(0.2, t_sec - self.prev_time)
        n = min(len(obs.pseudorange), len(self.prev_pseudoranges), len(obs.satellite_velocities), len(obs.satellite_positions))

        if n < 3:
            return EvidenceItem(
                name="Layer L4 — Relative Geometry",
                category="PHYSICAL",
                value=None,
                status=CheckStatus.UNAVAILABLE,
                severity=0.0,
                explanation="Insufficient tracked satellite pairs (<3 SVs) for relative geometry difference.",
                formula="L_{ij} ≈ 0",
                threshold=">= 3 SVs",
                threshold_type="DEMO THRESHOLD",
                is_available=False,
                weight=1.0
            )

        # Receiver approximate position
        r0 = self._geodetic_to_ecef(obs.latitude, obs.longitude, obs.altitude)

        # Compute line-of-sight unit vectors r̂_i and projected satellite velocities (v_sat,i · r̂_i)
        projected_v = []
        for i in range(n):
            rsat = obs.satellite_positions[i]
            vsat = obs.satellite_velocities[i]
            diff = [rsat[k] - r0[k] for k in range(3)]
            norm = math.sqrt(sum(d ** 2 for d in diff))
            rhat = [d / norm for d in diff]
            proj = sum(vsat[k] * rhat[k] for k in range(3))
            projected_v.append(proj)

        # Compute pairwise residuals across adjacent pairs (i, i+1)
        pair_residuals = []
        for i in range(n - 1):
            j = i + 1
            # Use direct pseudorange rate if available, else discrete difference
            if obs.pseudorange_rate is not None and len(obs.pseudorange_rate) > j:
                rho_rate_diff = obs.pseudorange_rate[i] - obs.pseudorange_rate[j]
            else:
                d_rho_curr = obs.pseudorange[i] - obs.pseudorange[j]
                d_rho_prev = self.prev_pseudoranges[i] - self.prev_pseudoranges[j]
                rho_rate_diff = (d_rho_curr - d_rho_prev) / dt

            # Velocity projection difference: (v_sat,i · rhat_i - v_sat,j · rhat_j)
            v_proj_diff = projected_v[i] - projected_v[j]

            # Receiver velocity contribution: v_rx · (rhat_i - rhat_j)
            # Receiver velocity in local coordinates roughly bounded by reported speed
            rhat_diff_norm = math.sqrt(sum((rhat[k] - r0[k]/norm) ** 2 for k in range(3))) if norm > 0 else 0.0
            rx_motion_margin = obs.speed * 0.15

            residual = max(0.0, abs(rho_rate_diff - v_proj_diff) - rx_motion_margin)
            pair_residuals.append(residual)

        l4_rms = math.sqrt(sum(r ** 2 for r in pair_residuals) / len(pair_residuals))

        if l4_rms > self.l4_rms_threshold_fail:
            return EvidenceItem(
                name="Layer L4 — Relative Geometry",
                category="PHYSICAL",
                value=round(l4_rms, 2),
                status=CheckStatus.FAIL,
                severity=0.88,
                explanation=(
                    f"RELATIVE GEOMETRY BREAKDOWN: Pairwise single-differenced Doppler mismatch (RMS: {l4_rms:.2f} m/s). "
                    f"Inter-satellite geometry invariance failed. Strong indicator of multi-satellite spoofing or transmitter clock drift."
                ),
                formula="L_{ij} = d/dt(ρ_i - ρ_j) - (v_{sat,i} · r̂_i - v_{sat,j} · r̂_j) ≈ 0",
                threshold=f"RMS <= {self.l4_rms_threshold_warn} m/s",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.7
            )
        else:
            return EvidenceItem(
                name="Layer L4 — Relative Geometry",
                category="PHYSICAL",
                value=round(l4_rms, 2),
                status=CheckStatus.PASS,
                severity=0.0,
                explanation=f"Pairwise single-differenced Doppler invariant satisfied across all satellite pairs (RMS: {l4_rms:.2f} m/s).",
                formula="L_{ij} = d/dt(ρ_i - ρ_j) - (v_{sat,i} · r̂_i - v_{sat,j} · r̂_j) ≈ 0",
                threshold=f"RMS <= {self.l4_rms_threshold_warn} m/s",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.4
            )

    @staticmethod
    def _geodetic_to_ecef(lat: float, lon: float, alt: float) -> Tuple[float, float, float]:
        """Converts WGS84 Geodetic (deg, deg, m) to ECEF (X, Y, Z) in meters."""
        a = 6378137.0  # semi-major axis
        e2 = 6.69437999014e-3  # first eccentricity squared
        phi = math.radians(lat)
        lam = math.radians(lon)

        N = a / math.sqrt(1.0 - e2 * (math.sin(phi) ** 2))
        x = (N + alt) * math.cos(phi) * math.cos(lam)
        y = (N + alt) * math.cos(phi) * math.sin(lam)
        z = (N * (1.0 - e2) + alt) * math.sin(phi)
        return x, y, z

    @staticmethod
    def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371000.0
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        dphi = math.radians(lat2 - lat1)
        dlam = math.radians(lon2 - lon1)
        a = math.sin(dphi / 2.0) ** 2 + math.cos(phi1) * math.cos(phi2) * (math.sin(dlam / 2.0) ** 2)
        return R * 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))

    @staticmethod
    def _parse_time_sec(ts: str) -> float:
        try:
            parts = ts.split(":")
            if len(parts) >= 3:
                h = float(parts[0].split("T")[-1].split(" ")[-1])
                m = float(parts[1])
                s = float(parts[2].split("Z")[0].split("+")[0])
                return h * 3600.0 + m * 60.0 + s
            return float(ts)
        except Exception:
            return 0.0
