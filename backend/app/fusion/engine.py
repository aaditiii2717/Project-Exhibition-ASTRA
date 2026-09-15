"""
ASTRA Transparent Evidence Fusion Engine
Combines multi-layer engineering checks, advanced GNSS physics, and ML anomaly outputs.
Computes:
1. Trust Score (0–100): "How trustworthy does the navigation appear?"
2. Independent Confidence (0–100%): "How confident is ASTRA in its assessment?"
Initial heuristic weights are clearly marked as requiring empirical calibration.
"""

from typing import List, Tuple, Dict, Optional
from ..core.schema import EvidenceItem, CheckStatus, TrustResult, TrustState


class FusionEngine:
    """
    Transparent evidence fusion engine.
    Applies explainable weighted severity aggregation with explicit penalty dynamics.
    Differentiates Trust from Confidence.
    """

    # Initial heuristic weights (Prototype defaults — explicitly flagged as requiring calibration)
    WEIGHT_LABEL = "Initial heuristic weights — requires validation against ground-truth flight/drive data."

    DEFAULT_WEIGHTS = {
        "Signal & Availability": 1.0,
        "Satellite Consistency": 0.9,
        "Motion Consistency": 1.8,
        "Position Jump Check": 1.9,
        "Time Consistency": 1.1,
        "Data Quality": 0.7,
        "Layer L1 — Doppler–Range Consistency": 1.7,
        "Layer L2 — Position Geometry Residual": 1.8,
        "Layer L3 — Trajectory Smoothness": 1.4,
        "Layer L4 — Relative Geometry": 1.5,
        "ML Anomaly Detector": 1.2,
    }

    def __init__(self, custom_weights: Optional[Dict[str, float]] = None):
        self.weights = dict(self.DEFAULT_WEIGHTS)
        if custom_weights:
            self.weights.update(custom_weights)

    def fuse(
        self,
        evidence_items: List[EvidenceItem],
        ml_score: Optional[float] = None,
        ml_top_features: Optional[Dict[str, float]] = None
    ) -> Tuple[float, float, List[str], str]:
        """
        Fuses all available evidence items into:
        (trust_score_0_to_100, confidence_0_to_100, primary_reasons, recommended_action)
        """
        available_items = [item for item in evidence_items if item.is_available and item.status != CheckStatus.UNAVAILABLE]
        total_checks = len(evidence_items)
        num_available = len(available_items)

        # Edge case: No available checks
        if num_available == 0:
            return 50.0, 10.0, ["Insufficient telemetry to establish trust"], "INCONCLUSIVE — Require manual verification"

        # Trust score = 100 - aggregated weighted penalties
        total_weight = 0.0
        weighted_penalty = 0.0
        critical_failures = []
        warnings = []

        for item in available_items:
            w = self.weights.get(item.name, item.weight)
            total_weight += w

            # Severity [0.0 - 1.0]
            weighted_penalty += (item.severity * w)

            if item.status == CheckStatus.FAIL:
                critical_failures.append(f"{item.name} ({item.explanation})")
            elif item.status == CheckStatus.WARN:
                warnings.append(f"{item.name} ({item.explanation})")

        # Base penalty normalized to 100
        avg_severity_pct = (weighted_penalty / max(0.1, total_weight)) * 100.0
        raw_trust = 100.0 - avg_severity_pct

        # If Signal/Geometry or Satellite tracking is degraded (WARN),
        # cap trust into the DEGRADED operational band [55, 68]
        if any("Signal & Availability" in w for w in warnings):
            raw_trust = min(raw_trust, 65.0)

        if len(warnings) >= 2 and not critical_failures:
            raw_trust = min(raw_trust, 62.0)

        # Non-linear suppression for critical compound physical failures
        # If Motion Consistency or Position Jump or L2 fails critically, trust must drop steeply
        if len(critical_failures) >= 2:
            raw_trust = min(raw_trust, 24.0)  # Forces into QUARANTINED
        elif len(critical_failures) == 1:
            raw_trust = min(raw_trust, 42.0)  # Forces into SUSPICIOUS

        trust_score = round(max(0.0, min(100.0, raw_trust)), 1)

        # Independent confidence (0-100%), combining:
        # - evidence coverage: ratio of available checks vs total checks (40% weight)
        # - evidence consensus: agreement among available indicators (40% weight)
        # - signal geometry quality: absence of total signal blindness (20% weight)

        coverage_ratio = num_available / max(1, total_checks)

        # Consensus: check variance of severities (if all agree on high severity or all agree on low severity -> high consensus)
        severities = [item.severity for item in available_items]
        if len(severities) > 1:
            mean_sev = sum(severities) / len(severities)
            variance = sum((s - mean_sev) ** 2 for s in severities) / len(severities)
            # High variance = conflicting evidence -> lowers confidence
            consensus_score = max(0.2, 1.0 - (variance * 2.5))
        else:
            consensus_score = 0.5

        # Sensor coverage multiplier
        coverage_score = min(1.0, 0.4 + 0.6 * coverage_ratio)

        raw_confidence = (0.45 * coverage_score + 0.40 * consensus_score + 0.15) * 100.0
        # If very few checks (e.g. only 3 out of 11), confidence must be restricted
        if num_available <= 4:
            raw_confidence = min(raw_confidence, 58.0)

        confidence = round(max(5.0, min(99.0, raw_confidence)), 1)

        primary_reasons = []
        if critical_failures:
            primary_reasons.extend(critical_failures[:3])
        elif warnings:
            primary_reasons.extend(warnings[:3])
        else:
            primary_reasons.append("All navigation and physical integrity checks passed within physical tolerances.")

        if trust_score >= 75.0:
            recommended_action = "ACCEPT — Navigation data is consistent and trusted."
        elif trust_score >= 50.0:
            recommended_action = "CONTINUE WITH MONITORING — Navigation is degraded (noise/geometry); maintain safety margins."
        elif trust_score >= 25.0:
            recommended_action = "REQUIRE VERIFICATION — High likelihood of anomaly; cross-verify against dead-reckoning."
        else:
            recommended_action = "QUARANTINE NAVIGATION UPDATE — Discard GNSS fix; isolate receiver; record forensic event."

        return trust_score, confidence, primary_reasons, recommended_action
