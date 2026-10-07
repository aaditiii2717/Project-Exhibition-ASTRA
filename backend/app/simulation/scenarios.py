"""
ASTRA Scenario Simulation Engine
Generates deterministic, high-fidelity synthetic GNSS trajectories across 6 distinct threat profiles:
1. Normal Navigation (Nominal highway/urban drive, continuous TRUSTED)
2. GNSS Degradation (Urban canyon, satellite loss, high HDOP -> DEGRADED, proves Bad GNSS != Spoofing)
3. Sudden Spoof (Instantaneous coordinate jump -> SUSPICIOUS / QUARANTINED)
4. Gradual Drift (Stealthy ramp offset caught by baseline L3b and ML)
5. Replay / Meaconing (Frozen timestamps, stale Doppler shifts)
6. Physical-Layer Inconsistency (L1 and L2 residual explosion on raw channels)
All generated data is clearly flagged as SIMULATED.
"""

import math
import numpy as np
from typing import List, Dict, Any, Optional
from ..core.schema import GNSSObservation


class ScenarioGenerator:
    """Produces deterministic simulated time-series datasets."""

    BASE_LAT = 28.6139  # New Delhi reference origin
    BASE_LON = 77.2090
    BASE_ALT = 215.0

    @classmethod
    def get_all_scenarios_meta(cls) -> List[Dict[str, Any]]:
        return [
            {
                "id": "normal_nav",
                "name": "1. Normal Navigation",
                "category": "GENUINE",
                "description": "Nominal vehicle trajectory under clear sky conditions. All kinematic and physical layers agree.",
                "expected_state": "TRUSTED (85–92)",
                "key_takeaway": "Baseline demonstration of healthy, trusted navigation."
            },
            {
                "id": "gnss_degradation",
                "name": "2. GNSS Degradation (Urban Canyon)",
                "category": "GENUINE DEGRADED",
                "description": "Vehicle enters dense urban canyon. Satellites drop from 11 to 5, HDOP rises to 4.2. Kinematics remain physically valid.",
                "expected_state": "DEGRADED (55–65)",
                "key_takeaway": "CRITICAL PROOF: Bad GNSS != Spoofing. ASTRA flags degraded precision without false alarm."
            },
            {
                "id": "sudden_spoof",
                "name": "3. Sudden Spoof (Coordinate Jump)",
                "category": "ATTACK / SPOOF",
                "description": "Attacker transmits fake PVT solution resulting in a 3.8 km instantaneous coordinate hop while reporting 12 m/s.",
                "expected_state": "SUSPICIOUS → QUARANTINED",
                "key_takeaway": "Motion consistency and Position Jump instantly catch blatant spatial discontinuities."
            },
            {
                "id": "gradual_drift",
                "name": "4. Gradual Drift (Stealth Spoof)",
                "category": "ATTACK / SPOOF",
                "description": "Subtle ramp offset (0.25 m/s² acceleration bias) designed to evade simple jump detectors.",
                "expected_state": "TRUSTED → DEGRADED → SUSPICIOUS",
                "key_takeaway": "Caught by Layer L3b baseline displacement accumulation and ML manifold boundary."
            },
            {
                "id": "replay_meaconing",
                "name": "5. Replay / Meaconing Attack",
                "category": "ATTACK / REPLAY",
                "description": "Attacker captures and replays legitimate GNSS signals: frozen timestamps, stale Doppler shifts, and static pseudoranges.",
                "expected_state": "QUARANTINED",
                "key_takeaway": "Time consistency and cross-rate layers expose replayed telemetry."
            },
            {
                "id": "physical_inconsistency",
                "name": "6. Physical-Layer Inconsistency",
                "category": "PHYSICAL INCONSISTENCY",
                "description": "Raw pseudorange rates disagree with carrier Doppler shifts (L1 RMS > 18 m/s) and WLS position diverges (L2 RMS > 85 m).",
                "expected_state": "QUARANTINED (8–15)",
                "key_takeaway": "Advanced L1/L2/L4 physics expose synthetic multi-satellite RF generation."
            },
        ]

    @classmethod
    def generate_scenario(
        cls,
        scenario_id: str,
        num_steps: int = 30,
        rng: Optional[np.random.Generator] = None,
        attack_scale: float = 1.0,
    ) -> List[GNSSObservation]:
        """
        Generates a sequence of GNSSObservations. With rng=None (the default used
        by the live simulation/playback endpoints), output is fully deterministic.
        Passing an rng enables sensor-noise jitter and randomized attack severity
        (via attack_scale), used by BenchmarkEvaluator so scored trials aren't a
        tautological replay of the exact fixtures the physics thresholds were
        tuned against.
        """
        if scenario_id == "normal_nav":
            return cls._gen_normal(num_steps, rng=rng)
        elif scenario_id == "gnss_degradation":
            return cls._gen_degraded(num_steps, rng=rng, attack_scale=attack_scale)
        elif scenario_id == "sudden_spoof":
            return cls._gen_sudden_spoof(num_steps, rng=rng, attack_scale=attack_scale)
        elif scenario_id == "gradual_drift":
            return cls._gen_gradual_drift(num_steps, rng=rng, attack_scale=attack_scale)
        elif scenario_id == "replay_meaconing":
            return cls._gen_replay(num_steps, rng=rng, attack_scale=attack_scale)
        elif scenario_id == "physical_inconsistency":
            return cls._gen_physical_inconsistency(num_steps, rng=rng, attack_scale=attack_scale)
        else:
            return cls._gen_normal(num_steps, rng=rng)

    @classmethod
    def _gen_normal(cls, n: int, rng: Optional[np.random.Generator] = None) -> List[GNSSObservation]:
        obs_list = []
        lat = cls.BASE_LAT
        lon = cls.BASE_LON
        speed = 12.0  # m/s (~43 km/h)
        heading = 65.0  # degrees NE

        # Base satellite positions in ECEF (~20,000 km altitude)
        sat_pos = [
            [1.5e7, 1.2e7, 1.8e7],
            [-1.4e7, 1.6e7, 1.7e7],
            [1.2e7, -1.5e7, 1.9e7],
            [-1.6e7, -1.2e7, 1.6e7],
        ]
        sat_vel = [
            [1200.0, -1800.0, 900.0],
            [-1100.0, 1700.0, -950.0],
            [1300.0, -1400.0, 1100.0],
            [-1500.0, 1200.0, -800.0],
        ]

        c_light = 299792458.0
        c_over_f0 = c_light / 1575.42e6
        clock_bias_m = 1250.0  # Constant receiver clock bias

        for i in range(n):
            # Advance lat/lon naturally at 12 m/s
            step_speed = speed
            if rng is not None:
                # Realistic receiver-noise jitter, well inside rule/physics tolerances,
                # so benchmark trials vary run-to-run instead of replaying identical fixtures.
                step_speed = max(0.0, speed + rng.normal(0.0, 0.2))
            dist_m = step_speed * 1.0
            dlat = (dist_m * math.cos(math.radians(heading))) / 111320.0
            dlon = (dist_m * math.sin(math.radians(heading))) / (111320.0 * math.cos(math.radians(lat)))
            lat += dlat
            lon += dlon
            if rng is not None:
                lat += rng.normal(0.0, 0.8) / 111320.0
                lon += rng.normal(0.0, 0.8) / (111320.0 * math.cos(math.radians(lat)))
            alt = cls.BASE_ALT + (i * 0.1)

            # Exact ECEF receiver coordinates
            a = 6378137.0
            e2 = 6.69437999014e-3
            phi = math.radians(lat)
            lam = math.radians(lon)
            N = a / math.sqrt(1.0 - e2 * (math.sin(phi) ** 2))
            rx = (N + alt) * math.cos(phi) * math.cos(lam)
            ry = (N + alt) * math.cos(phi) * math.sin(lam)
            rz = (N * (1.0 - e2) + alt) * math.sin(phi)
            r0 = [rx, ry, rz]

            # Advance satellites in orbit
            curr_sat_pos = []
            pseudoranges = []
            rho_rates = []
            dopplers = []

            for s_idx in range(4):
                sp = [sat_pos[s_idx][k] + sat_vel[s_idx][k] * i for k in range(3)]
                curr_sat_pos.append(sp)
                geom_dist = math.sqrt(sum((sp[k] - r0[k]) ** 2 for k in range(3)))

                # Add nominal 1m pseudorange noise
                noise_m = math.sin(i * 0.7 + s_idx) * 0.8
                pseudorange = geom_dist + clock_bias_m + noise_m
                pseudoranges.append(pseudorange)

                # Line of sight unit vector rhat
                rhat = [(sp[k] - r0[k]) / geom_dist for k in range(3)]
                # Relative line of sight velocity
                v_los = sum(sat_vel[s_idx][k] * rhat[k] for k in range(3))
                rho_rates.append(v_los)
                # Doppler shift fd = -rho_dot / (c/f0)
                dopplers.append(-v_los / c_over_f0)

            obs = GNSSObservation(
                timestamp=f"12:00:{i:02d}",
                latitude=round(lat, 6),
                longitude=round(lon, 6),
                altitude=round(alt, 2),
                speed=step_speed,
                heading=heading,
                satellite_count=10,
                fix_quality=1,
                hdop=0.9,
                vdop=1.3,
                pdop=1.6,
                satellites=[1, 4, 11, 14],
                pseudorange=pseudoranges,
                pseudorange_rate=rho_rates,
                doppler=dopplers,
                cn0=[42.0, 44.5, 41.2, 43.8],
                satellite_positions=curr_sat_pos,
                satellite_velocities=sat_vel,
            )
            obs_list.append(obs)
        return obs_list

    @classmethod
    def _gen_degraded(
        cls, n: int, rng: Optional[np.random.Generator] = None, attack_scale: float = 1.0
    ) -> List[GNSSObservation]:
        """Degraded GNSS: Drops satellite count and inflates HDOP without malicious jump."""
        obs_list = cls._gen_normal(n, rng=rng)
        for i in range(10, n):
            # Enters urban canyon at step 10
            obs_list[i].satellite_count = 5
            obs_list[i].hdop = 4.2 * attack_scale
            obs_list[i].vdop = 5.8 * attack_scale
            obs_list[i].pdop = 7.1 * attack_scale
            # Add realistic multipath noise ramp (1.5m jitter)
            jitter_m = math.sin((i - 10) * 0.4) * 2.0 * attack_scale
            dlat = jitter_m / 111320.0
            obs_list[i].latitude += dlat
            # Reduce CN0 (signal attenuation under tall glass facades)
            obs_list[i].cn0 = [29.5, 30.1, 28.4, 29.0]
        return obs_list

    @classmethod
    def _gen_sudden_spoof(
        cls, n: int, rng: Optional[np.random.Generator] = None, attack_scale: float = 1.0
    ) -> List[GNSSObservation]:
        """Sudden spoof: Step 12 hops away instantly (nominally ~3.8 km, scaled by attack_scale)."""
        obs_list = cls._gen_normal(n, rng=rng)
        for i in range(12, n):
            # Sudden offset to North-East, scaled so benchmark trials can probe
            # near the motion-consistency threshold rather than always being an
            # unmissably large jump.
            obs_list[i].latitude += 0.034 * attack_scale
            obs_list[i].longitude += 0.025 * attack_scale
            # Reported speed remains ~12 m/s (creating a discrepancy with displacement)
            obs_list[i].speed = 12.0
        return obs_list

    @classmethod
    def _gen_gradual_drift(
        cls, n: int, rng: Optional[np.random.Generator] = None, attack_scale: float = 1.0
    ) -> List[GNSSObservation]:
        """Gradual drift: Stealth ramp acceleration bias from step 8 onward."""
        obs_list = cls._gen_normal(n, rng=rng)
        accumulated_drift_m = 0.0
        for i in range(8, n):
            drift_step = (i - 7) * 2.5 * attack_scale  # quadratic ramp
            accumulated_drift_m += drift_step
            dlat = accumulated_drift_m / 111320.0
            obs_list[i].latitude += dlat
        return obs_list

    @classmethod
    def _gen_replay(
        cls, n: int, rng: Optional[np.random.Generator] = None, attack_scale: float = 1.0
    ) -> List[GNSSObservation]:
        """Replay attack: Frozen timestamps and repeating positions at step 10."""
        obs_list = cls._gen_normal(n, rng=rng)
        frozen_lat = obs_list[9].latitude
        frozen_lon = obs_list[9].longitude
        frozen_ts = obs_list[9].timestamp
        for i in range(10, n):
            obs_list[i].latitude = frozen_lat
            obs_list[i].longitude = frozen_lon
            obs_list[i].speed = 15.0  # claiming high speed while position is completely frozen
            obs_list[i].timestamp = frozen_ts  # Replay of identical timestamp!
        return obs_list

    @classmethod
    def _gen_physical_inconsistency(
        cls, n: int, rng: Optional[np.random.Generator] = None, attack_scale: float = 1.0
    ) -> List[GNSSObservation]:
        """Physical inconsistency: L1 and L2 residuals explode starting step 8."""
        obs_list = cls._gen_normal(n, rng=rng)
        for i in range(8, n):
            # Desynchronize Doppler and pseudorange rates, scaled by attack_scale
            # (L1 Doppler-range residual = rho_dot + (c/f0)*fd != 0)
            obs_list[i].pseudorange_rate = [v * attack_scale for v in [180.0, -140.0, 210.0, -190.0]]
            # Force Doppler to mismatch, scaled by attack_scale
            obs_list[i].doppler = [v * attack_scale for v in [-500.0, 400.0, -600.0, 550.0]]
            # Pseudoranges diverging from geometric satellite positions
            obs_list[i].pseudorange = [
                p + 450.0 * attack_scale * (k + 1) for k, p in enumerate(obs_list[i].pseudorange)
            ]
        return obs_list
