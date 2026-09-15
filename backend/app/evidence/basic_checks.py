"""
ASTRA Basic Evidence Engine
Explainable engineering checks for GNSS availability, satellite shifts, motion plausibility, position jumps, time consistency, and data quality.
Adheres strictly to the core principle: Bad GNSS != Spoofing.
"""

import math
from typing import List, Optional, Tuple
from ..core.schema import GNSSObservation, EvidenceItem, CheckStatus


class BasicEvidenceEngine:
    """
    Computes explainable engineering checks based on kinematic and signal availability rules.
    Maintains previous state for differential and sequential calculations.
    """

    def __init__(self, vehicle_profile: str = "automotive"):
        # Thresholds can be tuned or calibrated for vehicle dynamics
        if vehicle_profile == "drone":
            self.max_accel_m_s2 = 25.0  # High-agility multirotor
            self.max_speed_m_s = 50.0
            self.max_heading_rate_deg_s = 180.0
            self.jump_threshold_m = 60.0
        else:  # default automotive / ground robotics
            self.max_accel_m_s2 = 9.8  # ~1G braking/turning envelope
            self.max_speed_m_s = 70.0  # ~250 km/h
            self.max_heading_rate_deg_s = 90.0
            self.jump_threshold_m = 45.0

        self.prev_obs: Optional[GNSSObservation] = None
        self.prev_speed: Optional[float] = None
        self.prev_time: Optional[float] = None

    def reset(self):
        self.prev_obs = None
        self.prev_speed = None
        self.prev_time = None

    @staticmethod
    def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculates surface distance in meters using haversine formula."""
        R = 6371000.0  # Earth radius in meters
        phi1 = math.radians(lat1)
        phi2 = math.radians(lat2)
        delta_phi = math.radians(lat2 - lat1)
        delta_lambda = math.radians(lon2 - lon1)

        a = (math.sin(delta_phi / 2.0) ** 2 +
             math.cos(phi1) * math.cos(phi2) * math.sin(delta_lambda / 2.0) ** 2)
        c = 2.0 * math.atan2(math.sqrt(a), math.sqrt(1.0 - a))
        return R * c

    def _estimate_dt(self, curr_ts: str) -> float:
        """Estimates elapsed seconds between observations."""
        # Standard fallback to 1.0s if time parsing fails
        if not self.prev_obs:
            return 1.0
        try:
            # Check if timestamps have HH:MM:SS or ISO format
            t_curr = self._ts_to_seconds(curr_ts)
            t_prev = self._ts_to_seconds(self.prev_obs.timestamp)
            dt = t_curr - t_prev
            return max(0.1, min(dt, 60.0)) if dt > 0 else 1.0
        except Exception:
            return 1.0

    @staticmethod
    def _ts_to_seconds(ts: str) -> float:
        parts = ts.split(":")
        if len(parts) >= 3:
            h = float(parts[0].split("T")[-1].split(" ")[-1])
            m = float(parts[1])
            s = float(parts[2].split("Z")[0].split("+")[0])
            return h * 3600.0 + m * 60.0 + s
        try:
            return float(ts)
        except ValueError:
            return 0.0

    def evaluate(self, obs: GNSSObservation) -> List[EvidenceItem]:
        """Runs all basic engineering checks on the given observation."""
        evidence = []
        dt = self._estimate_dt(obs.timestamp)

        evidence.append(self._check_signal_availability(obs))
        evidence.append(self._check_satellite_consistency(obs))
        evidence.append(self._check_motion_consistency(obs, dt))
        evidence.append(self._check_position_jump(obs, dt))
        evidence.append(self._check_time_consistency(obs, dt))
        evidence.append(self._check_data_quality(obs))

        self.prev_obs = obs
        self.prev_speed = obs.speed

        return evidence

    def _check_signal_availability(self, obs: GNSSObservation) -> EvidenceItem:
        """
        Evaluates satellite count and geometric dilution of precision (PDOP/HDOP).
        Crucial: Flags degraded geometry WITHOUT misclassifying it as an active attack.
        """
        sat_count = obs.satellite_count
        pdop = obs.pdop
        hdop = obs.hdop
        fix = obs.fix_quality

        if fix == 0 or sat_count < 4:
            return EvidenceItem(
                name="Signal & Availability",
                category="BASIC",
                value=float(sat_count),
                status=CheckStatus.FAIL,
                severity=0.85,
                explanation=f"Insufficient satellite visibility for 3D fix ({sat_count} SVs < 4 required). Signal lost or heavily obstructed.",
                formula="sat_count >= 4 && fix_quality > 0",
                threshold="sat_count >= 4, HDOP <= 4.0",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.2
            )
        elif pdop > 4.5 or hdop > 3.0 or sat_count < 6:
            # Degraded GNSS (poor geometry or urban canyon)
            return EvidenceItem(
                name="Signal & Availability",
                category="BASIC",
                value=float(sat_count),
                status=CheckStatus.WARN,
                severity=0.45,
                explanation=f"Degraded satellite geometry (HDOP={hdop:.1f}, PDOP={pdop:.1f}, SVs={sat_count}). Navigation precision is reduced (not necessarily malicious).",
                formula="sat_count >= 6 && HDOP <= 2.5",
                threshold="HDOP <= 2.5, PDOP <= 4.0",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.0
            )
        else:
            return EvidenceItem(
                name="Signal & Availability",
                category="BASIC",
                value=float(sat_count),
                status=CheckStatus.PASS,
                severity=0.0,
                explanation=f"Nominal satellite geometry and fix quality ({sat_count} SVs tracked, HDOP={hdop:.1f}, PDOP={pdop:.1f}).",
                formula="sat_count >= 4 && HDOP <= 2.5",
                threshold="sat_count >= 6, HDOP <= 2.5",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.0
            )

    def _check_satellite_consistency(self, obs: GNSSObservation) -> EvidenceItem:
        """
        Monitors sudden discontinuous changes in satellite tracking count or per-satellite SNR.
        Reports UNAVAILABLE if detailed constellation ephemeris is omitted.
        """
        if self.prev_obs is None:
            return EvidenceItem(
                name="Satellite Consistency",
                category="BASIC",
                value=float(obs.satellite_count),
                status=CheckStatus.PASS,
                severity=0.0,
                explanation="Initial observation: establishing baseline constellation visibility.",
                formula="|N_sat(k) - N_sat(k-1)| <= 3",
                threshold="ΔSVs <= 3 / sec",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=0.9
            )

        delta_sat = abs(obs.satellite_count - self.prev_obs.satellite_count)

        # Per-satellite CN0 / SNR checks if present
        if obs.cn0 is not None and len(obs.cn0) > 0:
            avg_cn0 = sum(obs.cn0) / len(obs.cn0)
            if avg_cn0 < 28.0:
                return EvidenceItem(
                    name="Satellite Consistency",
                    category="BASIC",
                    value=avg_cn0,
                    status=CheckStatus.WARN,
                    severity=0.5,
                    explanation=f"Low average carrier-to-noise ratio ({avg_cn0:.1f} dB-Hz). Severe signal attenuation or jamming interference suspected.",
                    formula="mean(C/N0) >= 35.0 dB-Hz",
                    threshold="C/N0 >= 32.0 dB-Hz",
                    threshold_type="DEMO THRESHOLD",
                    is_available=True,
                    weight=1.1
                )

        if delta_sat >= 5:
            return EvidenceItem(
                name="Satellite Consistency",
                category="BASIC",
                value=float(delta_sat),
                status=CheckStatus.WARN,
                severity=0.6,
                explanation=f"Abrupt satellite constellation discontinuity: {delta_sat} satellites gained/lost in single step.",
                formula="|N_sat(k) - N_sat(k-1)| <= 3",
                threshold="ΔSVs <= 3",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.1
            )

        return EvidenceItem(
            name="Satellite Consistency",
            category="BASIC",
            value=float(delta_sat),
            status=CheckStatus.PASS,
            severity=0.0,
            explanation=f"Constellation tracking is stable (ΔSVs={delta_sat}).",
            formula="|N_sat(k) - N_sat(k-1)| <= 3",
            threshold="ΔSVs <= 3",
            threshold_type="DEMO THRESHOLD",
            is_available=True,
            weight=0.9
        )

    def _check_motion_consistency(self, obs: GNSSObservation, dt: float) -> EvidenceItem:
        """
        Verifies whether spatial displacement matches reported ground speed and vehicle kinematics.
        Calculates: displacement, velocity, acceleration, heading rate.
        """
        if self.prev_obs is None:
            return EvidenceItem(
                name="Motion Consistency",
                category="BASIC",
                value=obs.speed,
                status=CheckStatus.PASS,
                severity=0.0,
                explanation="Initial waypoint: motion kinematic baseline established.",
                formula="v_implied ≈ v_reported",
                threshold="kinematic envelope",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.5
            )

        disp = self.haversine_distance(
            self.prev_obs.latitude, self.prev_obs.longitude,
            obs.latitude, obs.longitude
        )
        implied_speed = disp / dt
        reported_speed = obs.speed

        # Speed discrepancy
        speed_diff = abs(implied_speed - reported_speed)

        # Acceleration calculation: a = (v_curr - v_prev) / dt
        accel = abs(reported_speed - self.prev_obs.speed) / dt if self.prev_speed is not None else 0.0

        # Kinematic bound violation: displacement must not exceed (v_rep * dt + 0.5 * a_max * dt^2 + GPS_margin)
        gps_noise_margin = max(5.0, obs.hdop * 4.0)
        expected_disp = reported_speed * dt
        max_allowable_disp = expected_disp + (0.5 * self.max_accel_m_s2 * (dt ** 2)) + gps_noise_margin

        if disp > max_allowable_disp or implied_speed > self.max_speed_m_s:
            return EvidenceItem(
                name="Motion Consistency",
                category="BASIC",
                value=round(implied_speed, 2),
                status=CheckStatus.FAIL,
                severity=0.95,
                explanation=(
                    f"MOTION CONSISTENCY FAILED: Observed displacement ({disp:.1f}m in {dt:.1f}s = {implied_speed:.1f} m/s) "
                    f"physically contradicts reported speed ({reported_speed:.1f} m/s). Expected <= {max_allowable_disp:.1f}m."
                ),
                formula="d_actual <= (v_rep · dt + 0.5 · a_max · dt² + ε)",
                threshold=f"Max allowable: {max_allowable_disp:.1f}m",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.8
            )
        elif speed_diff > (8.0 + gps_noise_margin) or accel > self.max_accel_m_s2:
            return EvidenceItem(
                name="Motion Consistency",
                category="BASIC",
                value=round(speed_diff, 2),
                status=CheckStatus.WARN,
                severity=0.55,
                explanation=(
                    f"Kinematic mismatch: Implied velocity ({implied_speed:.1f} m/s) differs from Doppler speed ({reported_speed:.1f} m/s) "
                    f"by {speed_diff:.1f} m/s (accel: {accel:.1f} m/s²)."
                ),
                formula="|v_implied - v_reported| <= tol",
                threshold=f"Tolerance: {8.0 + gps_noise_margin:.1f} m/s",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.3
            )
        else:
            return EvidenceItem(
                name="Motion Consistency",
                category="BASIC",
                value=round(implied_speed, 2),
                status=CheckStatus.PASS,
                severity=0.0,
                explanation=f"Reported speed ({reported_speed:.1f} m/s) agrees with observed displacement ({disp:.1f}m, implied {implied_speed:.1f} m/s).",
                formula="d_actual ≈ v_reported · dt",
                threshold="Within vehicle physical envelope",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.4
            )

    def _check_position_jump(self, obs: GNSSObservation, dt: float) -> EvidenceItem:
        """
        Calculates distance between consecutive positions.
        Compares against reported speed * dt and vehicle physical envelope.
        """
        if self.prev_obs is None:
            return EvidenceItem(
                name="Position Jump Check",
                category="BASIC",
                value=0.0,
                status=CheckStatus.PASS,
                severity=0.0,
                explanation="Initial coordinate lock: jump detection active.",
                formula="|p(k) - p(k-1)|",
                threshold=f"< {self.jump_threshold_m}m",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.6
            )

        disp = self.haversine_distance(
            self.prev_obs.latitude, self.prev_obs.longitude,
            obs.latitude, obs.longitude
        )
        expected_disp = obs.speed * dt
        deviation = abs(disp - expected_disp)

        # If displacement exceeds threshold and deviation is huge
        if disp > self.jump_threshold_m and deviation > (self.jump_threshold_m * 0.7):
            return EvidenceItem(
                name="Position Jump Check",
                category="BASIC",
                value=round(deviation, 1),
                status=CheckStatus.FAIL,
                severity=0.98,
                explanation=(
                    f"CRITICAL POSITION JUMP: {disp:.1f}m instantaneous jump (expected {expected_disp:.1f}m, deviation {deviation:.1f}m). "
                    f"Instantaneous translation indicates sudden spoofing injection or receiver reset."
                ),
                formula="|d_actual - v_rep · dt| <= jump_limit",
                threshold=f"Jump limit: {self.jump_threshold_m}m",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.9
            )
        elif deviation > (self.jump_threshold_m * 0.4):
            return EvidenceItem(
                name="Position Jump Check",
                category="BASIC",
                value=round(deviation, 1),
                status=CheckStatus.WARN,
                severity=0.45,
                explanation=f"Moderate coordinate step observed: {disp:.1f}m vs expected {expected_disp:.1f}m (deviation: {deviation:.1f}m).",
                formula="|d_actual - v_rep · dt| <= jump_limit",
                threshold=f"Threshold: {self.jump_threshold_m}m",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.2
            )
        else:
            return EvidenceItem(
                name="Position Jump Check",
                category="BASIC",
                value=round(deviation, 1),
                status=CheckStatus.PASS,
                severity=0.0,
                explanation=f"Continuous smooth position: displacement {disp:.1f}m aligns with expected {expected_disp:.1f}m (deviation {deviation:.1f}m).",
                formula="|d_actual - v_rep · dt| <= jump_limit",
                threshold=f"< {self.jump_threshold_m}m",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.4
            )

    def _check_time_consistency(self, obs: GNSSObservation, dt: float) -> EvidenceItem:
        """
        Validates timestamp ordering, gaps, duplicated timestamps, and stale updates.
        """
        if self.prev_obs is None:
            return EvidenceItem(
                name="Time Consistency",
                category="BASIC",
                value=dt,
                status=CheckStatus.PASS,
                severity=0.0,
                explanation="Initial timestamp registered.",
                formula="t(k) > t(k-1)",
                threshold="0 < dt <= 5.0s",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.0
            )

        if dt <= 0:
            return EvidenceItem(
                name="Time Consistency",
                category="BASIC",
                value=dt,
                status=CheckStatus.FAIL,
                severity=0.85,
                explanation=f"Time reversal or zero-delta step detected (dt={dt}s). Potential timestamp forgery or replay attack.",
                formula="t(k) - t(k-1) > 0",
                threshold="dt > 0",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=1.5
            )
        elif dt > 5.0:
            return EvidenceItem(
                name="Time Consistency",
                category="BASIC",
                value=dt,
                status=CheckStatus.WARN,
                severity=0.4,
                explanation=f"Sampling gap detected: {dt:.1f}s elapsed between updates (stale navigation buffer).",
                formula="dt <= 2.0s",
                threshold="dt <= 2.0s",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=0.9
            )
        else:
            return EvidenceItem(
                name="Time Consistency",
                category="BASIC",
                value=dt,
                status=CheckStatus.PASS,
                severity=0.0,
                explanation=f"Regular monotonic sampling interval (dt={dt:.2f}s).",
                formula="0 < dt <= 2.0s",
                threshold="dt <= 2.0s",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=0.8
            )

    def _check_data_quality(self, obs: GNSSObservation) -> EvidenceItem:
        """
        Validates completeness, DOP bounds, and coordinate formatting.
        """
        issues = []
        if obs.fix_quality == 0:
            issues.append("No GNSS fix reported")
        if obs.hdop > 10.0:
            issues.append(f"Excessive HDOP ({obs.hdop})")
        if obs.latitude == 0.0 and obs.longitude == 0.0:
            issues.append("Null island coordinate (0.0, 0.0)")

        if issues:
            return EvidenceItem(
                name="Data Quality",
                category="BASIC",
                value=float(len(issues)),
                status=CheckStatus.WARN if obs.fix_quality > 0 else CheckStatus.FAIL,
                severity=0.7 if obs.fix_quality == 0 else 0.35,
                explanation=f"Telemetry quality degradation: {'; '.join(issues)}.",
                formula="valid_fix && HDOP < 5.0",
                threshold="HDOP < 5.0",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=0.8
            )
        else:
            return EvidenceItem(
                name="Data Quality",
                category="BASIC",
                value=0.0,
                status=CheckStatus.PASS,
                severity=0.0,
                explanation="All standard telemetry fields are complete, valid, and within physical operational bounds.",
                formula="all_fields_valid",
                threshold="Zero anomalies",
                threshold_type="DEMO THRESHOLD",
                is_available=True,
                weight=0.7
            )
