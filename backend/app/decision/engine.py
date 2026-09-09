"""
ASTRA Decision Engine
Maps fused evidence to discrete integrity states (TRUSTED, DEGRADED, SUSPICIOUS, QUARANTINED, INCONCLUSIVE).
Generates operational recommendations and creates the signature "Why Did Trust Change?" diagnostic diff.
ASTRA is a decision-support layer; it provides integrity guarantees to higher-level autopilots without direct vehicle actuation.
"""

from typing import Optional, Dict, Any, List
from ..core.schema import TrustState, TrustResult, WhyTrustChanged, EvidenceItem, CheckStatus


class DecisionEngine:
    def __init__(
        self,
        trusted_threshold: float = 75.0,
        degraded_threshold: float = 50.0,
        suspicious_threshold: float = 25.0,
        inconclusive_confidence_min: float = 35.0
    ):
        # Configurable prototype thresholds
        self.trusted_threshold = trusted_threshold
        self.degraded_threshold = degraded_threshold
        self.suspicious_threshold = suspicious_threshold
        self.inconclusive_confidence_min = inconclusive_confidence_min

        self.previous_result: Optional[TrustResult] = None

    def reset(self):
        self.previous_result = None

    def decide(
        self,
        trust_score: float,
        confidence: float,
        evidence_items: List[EvidenceItem],
        primary_reasons: List[str],
        recommended_action: str,
        ml_score: Optional[float] = None,
        ml_top_features: Optional[Dict[str, float]] = None
    ) -> Tuple[TrustResult, WhyTrustChanged]:
        """
        Calculates the definitive Trust State and computes "Why Did Trust Change?" diff against previous step.
        """
        # 1. State determination
        if confidence < self.inconclusive_confidence_min:
            trust_state = TrustState.INCONCLUSIVE
            recommended_action = "INCONCLUSIVE — Low confidence in telemetry; seek independent ground-truth verification."
        elif trust_score >= self.trusted_threshold:
            trust_state = TrustState.TRUSTED
        elif trust_score >= self.degraded_threshold:
            trust_state = TrustState.DEGRADED
        elif trust_score >= self.suspicious_threshold:
            trust_state = TrustState.SUSPICIOUS
        else:
            trust_state = TrustState.QUARANTINED

        current_result = TrustResult(
            trust_score=trust_score,
            trust_state=trust_state,
            confidence=confidence,
            primary_reasons=primary_reasons,
            recommended_action=recommended_action,
            evidence_matrix=evidence_items,
            ml_score=ml_score,
            ml_top_features=ml_top_features
        )

        # 2. Compute "Why Did Trust Change?" diagnostic diff
        why_changed = self._compute_why_changed(self.previous_result, current_result)

        self.previous_result = current_result
        return current_result, why_changed

    def _compute_why_changed(
        self,
        prev: Optional[TrustResult],
        curr: TrustResult
    ) -> WhyTrustChanged:
        """
        Identifies exact physical and kinematic deviations that caused trust state transition.
        """
        if prev is None:
            return WhyTrustChanged(
                occurred=False,
                current_state=curr.trust_state,
                current_score=curr.trust_score
            )

        # Trigger if state shifted or score changed by more than 15 points
        state_shifted = prev.trust_state != curr.trust_state
        score_jump = abs(prev.trust_score - curr.trust_score) >= 15.0

        if not (state_shifted or score_jump):
            return WhyTrustChanged(occurred=False)

        # Collect triggering evidence differences
        triggering = []
        metrics_diff = {}

        for curr_item in curr.evidence_matrix:
            # Find matching item in previous result
            prev_match = next((p for p in prev.evidence_matrix if p.name == curr_item.name), None)
            if prev_match:
                if prev_match.status != curr_item.status:
                    if curr_item.status in [CheckStatus.FAIL, CheckStatus.WARN]:
                        triggering.append(f"{curr_item.name}: Shifted from {prev_match.status.value} to {curr_item.status.value}")
                        metrics_diff[curr_item.name] = {
                            "from_status": prev_match.status.value,
                            "to_status": curr_item.status.value,
                            "value": curr_item.value,
                            "explanation": curr_item.explanation
                        }

        if curr.ml_score is not None and prev.ml_score is not None:
            if abs(curr.ml_score - prev.ml_score) > 0.2:
                triggering.append(f"ML Anomaly Score shifted from {prev.ml_score:.2f} to {curr.ml_score:.2f}")

        # Formulate conclusion
        if curr.trust_state == TrustState.QUARANTINED:
            conclusion = "Multiple independent physical & motion checks failed simultaneously. Unambiguous navigation corruption or active spoofing detected."
        elif curr.trust_state == TrustState.SUSPICIOUS:
            conclusion = "Kinematic or physical divergence detected between satellite observations and reported motion."
        elif curr.trust_state == TrustState.DEGRADED:
            conclusion = "Signal geometry or tracking quality deteriorated; however, motion remains physically consistent (Bad GNSS != Spoofing)."
        elif curr.trust_state == TrustState.TRUSTED:
            conclusion = "Navigation parameters restored to full physical and geometric consistency."
        else:
            conclusion = "Confidence dropped below operational threshold; evidence is insufficient to guarantee integrity."

        return WhyTrustChanged(
            occurred=True,
            previous_state=prev.trust_state,
            current_state=curr.trust_state,
            previous_score=prev.trust_score,
            current_score=curr.trust_score,
            triggering_evidence=triggering if triggering else curr.primary_reasons,
            key_metrics_diff=metrics_diff,
            conclusion=conclusion,
            recommended_action=curr.recommended_action
        )
