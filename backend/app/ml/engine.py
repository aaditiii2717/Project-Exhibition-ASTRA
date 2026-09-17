"""
ASTRA Hybrid Machine Learning Engine
Implements lightweight ML anomaly detection and scenario classification as an AUXILIARY evidence source.
Extracts multi-domain kinematic, geometry, and residual features with local explainability (top contributing features).
ML does NOT override physical laws; it serves as one more vote in evidence fusion.
"""

import numpy as np
import os
import joblib
from typing import Dict, List, Optional, Tuple
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from ..core.schema import GNSSObservation, EvidenceItem, CheckStatus


class MLEngine:
    """
    Lightweight, explainable ML engine.
    Combines IsolationForest for unsupervised out-of-distribution detection with
    a calibrated Random Forest classifier trained on GNSS threat profiles.
    """

    FEATURE_NAMES = [
        "displacement_m",
        "speed_mps",
        "speed_discrepancy",
        "acceleration_mps2",
        "heading_rate_deg_s",
        "satellite_count",
        "hdop",
        "pdop",
        "c3_residual_rms",
        "l2_residual_rms",
        "l3_accel_deriv",
        "baseline_offset_m",
        "l4_residual_rms",
        "sampling_dt_s",
    ]

    _SHARED_ISO_FOREST = None
    _SHARED_RF_CLASSIFIER = None
    _shared_load_attempted = False

    def __init__(self):
        self.prev_obs: Optional[GNSSObservation] = None
        self.prev_time: Optional[float] = None
        self.baseline_lat_lon: Optional[Tuple[float, float]] = None

        self.is_trained = self._load_approved_model()
        self.iso_forest = self._SHARED_ISO_FOREST
        self.rf_classifier = self._SHARED_RF_CLASSIFIER

    @classmethod
    def _load_approved_model(cls) -> bool:
        """
        Load only a versioned artifact produced by the approved training workflow.
        Cached at the class level: joblib.load() deserializes the whole artifact
        from disk, so every MLEngine() instance reusing the same cached model
        instead of reloading it avoids redundant disk I/O and unpickling under
        high construction rates (e.g. the benchmark evaluator).
        """
        if cls._shared_load_attempted:
            return cls._SHARED_RF_CLASSIFIER is not None
        cls._shared_load_attempted = True

        model_path = os.getenv("ASTRA_MODEL_PATH")
        if not model_path:
            return False
        try:
            artifact = joblib.load(model_path)
            if artifact.get("feature_names") != cls.FEATURE_NAMES:
                return False
            if artifact.get("artifact_version") != 1:
                return False
            cls._SHARED_ISO_FOREST = artifact["isolation_forest"]
            cls._SHARED_RF_CLASSIFIER = artifact["random_forest"]
            return True
        except (OSError, KeyError, ValueError, TypeError, AttributeError):
            return False

    def reset(self):
        self.prev_obs = None
        self.prev_time = None
        self.baseline_lat_lon = None

    @classmethod
    def _initialize_and_train_baseline_models(cls):
        """
        Trains lightweight baseline models on calibrated GNSS physics envelopes.
        Provides instant, deterministic scoring without heavy disk dependencies.
        """
        np.random.seed(42)
        n_samples = 400

        # 1. Normal navigation cluster
        norm_disp = np.random.normal(12.0, 3.0, n_samples)
        norm_spd = norm_disp  # dt=1.0s
        norm_diff = np.random.exponential(0.5, n_samples)
        norm_accel = np.random.exponential(0.8, n_samples)
        norm_hdg = np.random.exponential(2.0, n_samples)
        norm_sats = np.random.randint(8, 14, n_samples)
        norm_hdop = np.random.normal(0.9, 0.2, n_samples).clip(0.6, 2.0)
        norm_pdop = norm_hdop * 1.6
        norm_c3 = np.random.exponential(0.4, n_samples)
        norm_l2 = np.random.exponential(3.0, n_samples)
        norm_l3 = np.random.exponential(1.2, n_samples)
        norm_base = np.linspace(0, 500, n_samples)
        norm_l4 = np.random.exponential(0.5, n_samples)
        norm_dt = np.ones(n_samples)

        X_normal = np.column_stack([
            norm_disp, norm_spd, norm_diff, norm_accel, norm_hdg,
            norm_sats, norm_hdop, norm_pdop, norm_c3, norm_l2,
            norm_l3, norm_base, norm_l4, norm_dt
        ])
        y_normal = np.zeros(n_samples)  # 0 = Nominal

        # 2. Degraded cluster (bad GNSS != spoofing, high DOPs, fewer sats, but physically plausible kinematics)
        deg_disp = np.random.normal(12.0, 5.0, n_samples // 2)
        deg_spd = deg_disp
        deg_diff = np.random.exponential(2.0, n_samples // 2)
        deg_accel = np.random.exponential(2.5, n_samples // 2)
        deg_hdg = np.random.exponential(5.0, n_samples // 2)
        deg_sats = np.random.randint(4, 7, n_samples // 2)
        deg_hdop = np.random.normal(3.5, 0.8, n_samples // 2).clip(2.5, 7.0)
        deg_pdop = deg_hdop * 1.8
        deg_c3 = np.random.exponential(1.5, n_samples // 2)
        deg_l2 = np.random.exponential(15.0, n_samples // 2)
        deg_l3 = np.random.exponential(4.0, n_samples // 2)
        deg_base = np.linspace(0, 500, n_samples // 2)
        deg_l4 = np.random.exponential(2.0, n_samples // 2)
        deg_dt = np.ones(n_samples // 2)

        X_degraded = np.column_stack([
            deg_disp, deg_spd, deg_diff, deg_accel, deg_hdg,
            deg_sats, deg_hdop, deg_pdop, deg_c3, deg_l2,
            deg_l3, deg_base, deg_l4, deg_dt
        ])
        y_degraded = np.ones(n_samples // 2) * 1  # 1 = Degraded

        # 3. Spoofed / Attack cluster (huge jumps, contradictory kinematics, exploding L1/L2 residuals)
        spoof_disp = np.random.uniform(80.0, 3000.0, n_samples // 2)
        spoof_spd = np.random.normal(15.0, 5.0, n_samples // 2)
        spoof_diff = np.abs(spoof_disp - spoof_spd)
        spoof_accel = np.random.uniform(20.0, 150.0, n_samples // 2)
        spoof_hdg = np.random.uniform(40.0, 180.0, n_samples // 2)
        spoof_sats = np.random.randint(8, 16, n_samples // 2)
        spoof_hdop = np.random.normal(0.8, 0.2, n_samples // 2)
        spoof_pdop = spoof_hdop * 1.5
        spoof_c3 = np.random.uniform(8.0, 45.0, n_samples // 2)
        spoof_l2 = np.random.uniform(35.0, 200.0, n_samples // 2)
        spoof_l3 = np.random.uniform(25.0, 80.0, n_samples // 2)
        spoof_base = np.random.uniform(200.0, 5000.0, n_samples // 2)
        spoof_l4 = np.random.uniform(8.0, 35.0, n_samples // 2)
        spoof_dt = np.ones(n_samples // 2)

        X_spoof = np.column_stack([
            spoof_disp, spoof_spd, spoof_diff, spoof_accel, spoof_hdg,
            spoof_sats, spoof_hdop, spoof_pdop, spoof_c3, spoof_l2,
            spoof_l3, spoof_base, spoof_l4, spoof_dt
        ])
        y_spoof = np.ones(n_samples // 2) * 2  # 2 = Spoofed / Malicious

        X = np.vstack([X_normal, X_degraded, X_spoof])
        y = np.concatenate([y_normal, y_degraded, y_spoof])

        # Train Isolation Forest on normal baseline data
        cls._SHARED_ISO_FOREST = IsolationForest(
            n_estimators=50,
            contamination=0.1,
            random_state=42
        )
        cls._SHARED_ISO_FOREST.fit(X_normal)

        # Train Random Forest classifier
        cls._SHARED_RF_CLASSIFIER = RandomForestClassifier(
            n_estimators=40,
            max_depth=6,
            random_state=42
        )
        cls._SHARED_RF_CLASSIFIER.fit(X, y)

    def extract_features(
        self,
        obs: GNSSObservation,
        physics_items: Optional[List[EvidenceItem]] = None
    ) -> Tuple[np.ndarray, Dict[str, float]]:
        """
        Transforms spatial observation and physical checks into normalized ML feature vector.
        """
        if self.baseline_lat_lon is None:
            self.baseline_lat_lon = (obs.latitude, obs.longitude)

        dt = 1.0
        t_sec = self._parse_time(obs.timestamp)
        if self.prev_time is not None:
            dt = max(0.1, min(60.0, t_sec - self.prev_time))

        # Kinematics
        disp = 0.0
        if self.prev_obs is not None:
            disp = self._haversine(
                self.prev_obs.latitude, self.prev_obs.longitude,
                obs.latitude, obs.longitude
            )
        implied_speed = disp / dt
        speed_diff = abs(implied_speed - obs.speed)
        accel = abs(obs.speed - self.prev_obs.speed) / dt if self.prev_obs else 0.0
        hdg_rate = abs(obs.heading - self.prev_obs.heading) / dt if self.prev_obs else 0.0
        if hdg_rate > 180.0:
            hdg_rate = 360.0 - hdg_rate

        base_offset = self._haversine(
            self.baseline_lat_lon[0], self.baseline_lat_lon[1],
            obs.latitude, obs.longitude
        )

        # Physics values (extracted from physical engine if present, else fallback sentinel)
        c3_val = 0.5
        l2_val = 4.0
        l3_val = 1.0
        l4_val = 0.8

        if physics_items:
            for item in physics_items:
                if "L1" in item.name and item.value is not None:
                    c3_val = float(item.value)
                elif "L2" in item.name and item.value is not None:
                    l2_val = float(item.value)
                elif "L3" in item.name and item.value is not None:
                    l3_val = float(item.value)
                elif "L4" in item.name and item.value is not None:
                    l4_val = float(item.value)

        feat_dict = {
            "displacement_m": disp,
            "speed_mps": obs.speed,
            "speed_discrepancy": speed_diff,
            "acceleration_mps2": accel,
            "heading_rate_deg_s": hdg_rate,
            "satellite_count": float(obs.satellite_count),
            "hdop": obs.hdop,
            "pdop": obs.pdop,
            "c3_residual_rms": c3_val,
            "l2_residual_rms": l2_val,
            "l3_accel_deriv": l3_val,
            "baseline_offset_m": base_offset,
            "l4_residual_rms": l4_val,
            "sampling_dt_s": dt,
        }

        feat_vec = np.array([feat_dict[name] for name in self.FEATURE_NAMES])

        self.prev_obs = obs
        self.prev_time = t_sec

        return feat_vec, feat_dict

    def evaluate(
        self,
        obs: GNSSObservation,
        physics_items: Optional[List[EvidenceItem]] = None
    ) -> Tuple[EvidenceItem, float, Dict[str, float]]:
        """
        Runs ML anomaly inference and feature attribution.
        Returns: (EvidenceItem, anomaly_score_0_to_1, top_contributing_features)
        """
        if not self.is_trained:
            return (
                EvidenceItem(
                    name="ML Anomaly Detector",
                    category="ML",
                    value=None,
                    status=CheckStatus.UNAVAILABLE,
                    severity=0.0,
                    explanation="ML models pending calibration.",
                    formula="IsolationForest + RandomForest",
                    threshold="Score <= 0.45",
                    threshold_type="DEMO THRESHOLD",
                    is_available=False,
                    weight=1.0
                ),
                0.0,
                {}
            )

        feat_vec, feat_dict = self.extract_features(obs, physics_items)
        x_in = feat_vec.reshape(1, -1)

        # Isolation Forest anomaly score, normalized to [0.0, 1.0]
        # raw decision_function: positive = inlier, negative = outlier
        raw_iso = self.iso_forest.decision_function(x_in)[0]
        # Map raw [-0.3, 0.2] to [1.0, 0.0]
        iso_anomaly = max(0.0, min(1.0, (0.15 - raw_iso) / 0.35))

        # Random Forest probability of attack (class 2 = spoofed)
        rf_probs = self.rf_classifier.predict_proba(x_in)[0]
        p_spoof = rf_probs[2] if len(rf_probs) > 2 else 0.0

        # Fused ML anomaly score: 60% RF spoof prob + 40% IsoForest
        fused_ml_score = round(float(0.6 * p_spoof + 0.4 * iso_anomaly), 3)

        # Explainability: identify top 3 contributing features
        rf_importances = self.rf_classifier.feature_importances_
        # Feature impact = feature value z-score-like contribution * tree importance
        contributions = {}
        for idx, fname in enumerate(self.FEATURE_NAMES):
            val = feat_vec[idx]
            imp = rf_importances[idx]
            # Simple contribution metric
            contributions[fname] = round(float(abs(val) * imp), 4)

        # Sort top 3
        top_features = dict(sorted(contributions.items(), key=lambda x: x[1], reverse=True)[:3])
        # Keep the approved artifact's legacy feature key internally, but expose the
        # clearer public Layer L1 terminology in operator-facing explanations.
        if "c3_residual_rms" in top_features:
            top_features["l1_doppler_range_residual_rms"] = top_features.pop("c3_residual_rms")

        # Formulate status and explanation
        if fused_ml_score > 0.65:
            status = CheckStatus.FAIL
            severity = min(1.0, fused_ml_score)
            expl = (
                f"ML ANOMALY DETECTED (Score: {fused_ml_score:.2f}, High Threat). "
                f"Top contributing features: {', '.join(top_features.keys())}. "
                f"Kinematic/residual profile strongly diverges from nominal navigation manifold."
            )
        elif fused_ml_score > 0.35:
            status = CheckStatus.WARN
            severity = fused_ml_score
            expl = (
                f"ML ELEVATED ANOMALY (Score: {fused_ml_score:.2f}, Moderate). "
                f"Observation exhibits atypical patterns (Top features: {', '.join(top_features.keys())})."
            )
        else:
            status = CheckStatus.PASS
            severity = 0.0
            expl = (
                f"ML NOMINAL (Score: {fused_ml_score:.2f}). "
                f"Navigation vector conforms to learned nominal trajectory manifold."
            )

        evidence_item = EvidenceItem(
            name="ML Anomaly Detector",
            category="ML",
            value=fused_ml_score,
            status=status,
            severity=severity,
            explanation=expl,
            formula="0.6 · P(Spoof|RF) + 0.4 · OutlierScore(IsoForest)",
            threshold="Score <= 0.35 (Nominal)",
            threshold_type="DEMO THRESHOLD",
            is_available=True,
            weight=1.2
        )

        return evidence_item, fused_ml_score, top_features

    @staticmethod
    def _haversine(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        R = 6371000.0
        dlat = np.radians(lat2 - lat1)
        dlon = np.radians(lon2 - lon1)
        a = (np.sin(dlat / 2.0) ** 2 +
             np.cos(np.radians(lat1)) * np.cos(np.radians(lat2)) * (np.sin(dlon / 2.0) ** 2))
        return float(R * 2.0 * np.arctan2(np.sqrt(a), np.sqrt(1.0 - a)))

    @staticmethod
    def _parse_time(ts: str) -> float:
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
