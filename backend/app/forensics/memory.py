"""
ASTRA Forensic Event Memory
Tamper-evident cryptographically chained audit log for security incident investigations.
Every navigation decision and anomaly is chained via SHA-256:
    current_hash = SHA256(previous_hash + canonical_json(event_data))
Provides chain integrity verification and live tamper-testing for hackathon demonstration.
"""

import json
import hashlib
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from ..core.schema import ForensicEvent, TrustState


class ForensicMemory:
    GENESIS_HASH = "0000000000000000000000000000000000000000000000000000000000000000"
    DEFAULT_LEDGER_PATH = Path(__file__).resolve().parents[2] / "data" / "forensic_ledger.jsonl"

    def __init__(self, file_path: str | None = None):
        self.file_path = str(file_path or self.DEFAULT_LEDGER_PATH)
        self.events: List[ForensicEvent] = []
        self.dataset_sha256: Optional[str] = None
        self._counter = 0
        self._load_from_disk()

    def _load_from_disk(self):
        import os
        if not os.path.exists(self.file_path):
            return
        try:
            with open(self.file_path, "r", encoding="utf-8") as f:
                for line in f:
                    if not line.strip():
                        continue
                    data = json.loads(line)
                    if "trust_state" in data:
                        data["trust_state"] = TrustState(data["trust_state"])
                    event = ForensicEvent(**data)
                    self.events.append(event)
                    self._counter = event.sequence
                    self.dataset_sha256 = event.dataset_hash
        except Exception as e:
            print(f"Error loading forensic ledger: {e}")

    def reset(self, dataset_hash: Optional[str] = None):
        import os
        self.events.clear()
        self.dataset_sha256 = dataset_hash
        self._counter = 0
        if os.path.exists(self.file_path):
            try:
                os.remove(self.file_path)
            except OSError:
                pass

    def record_event(
        self,
        timestamp: str,
        trust_score: float,
        trust_state: TrustState,
        confidence: float,
        triggered_checks: List[str],
        primary_reason: str,
        recommended_action: str,
        latitude: float,
        longitude: float
    ) -> ForensicEvent:
        """
        Appends a new security event to the tamper-evident cryptographic hash chain.
        """
        self._counter += 1
        event_id = f"EVT-{self._counter:04d}"

        # Previous hash is from the last event or Genesis
        prev_hash = self.events[-1].current_event_hash if self.events else self.GENESIS_HASH

        # Canonical data representation for hash computation
        data_to_hash = {
            "event_id": event_id,
            "sequence": self._counter,
            "timestamp": timestamp,
            "trust_score": round(trust_score, 1),
            "trust_state": trust_state.value,
            "confidence": round(confidence, 1),
            "triggered_checks": sorted(triggered_checks),
            "primary_reason": primary_reason,
            "recommended_action": recommended_action,
            "latitude": round(latitude, 6),
            "longitude": round(longitude, 6),
            "dataset_hash": self.dataset_sha256 or "NONE"
        }

        canonical_str = json.dumps(data_to_hash, sort_keys=True)
        payload = f"{prev_hash}|{canonical_str}".encode("utf-8")
        current_hash = hashlib.sha256(payload).hexdigest()

        event = ForensicEvent(
            event_id=event_id,
            sequence=self._counter,
            timestamp=timestamp,
            trust_score=trust_score,
            trust_state=trust_state,
            confidence=confidence,
            triggered_checks=triggered_checks,
            primary_reason=primary_reason,
            recommended_action=recommended_action,
            latitude=latitude,
            longitude=longitude,
            previous_event_hash=prev_hash,
            current_event_hash=current_hash,
            dataset_hash=self.dataset_sha256
        )

        self.events.append(event)
        self._append_to_disk(event)
        return event

    def _append_to_disk(self, event: ForensicEvent):
        import os
        # Ensure directory exists
        os.makedirs(os.path.dirname(os.path.abspath(self.file_path)), exist_ok=True)
        try:
            with open(self.file_path, "a", encoding="utf-8") as f:
                data = event.model_dump() if hasattr(event, "model_dump") else event.__dict__
                if "trust_state" in data and hasattr(data["trust_state"], "value"):
                    data["trust_state"] = data["trust_state"].value
                f.write(json.dumps(data) + "\n")
        except Exception as e:
            print(f"Error writing to forensic ledger: {e}")

    def verify_chain(self) -> Tuple[bool, str, Optional[str], Optional[int]]:
        """
        Verifies cryptographic integrity of the entire event chain from Genesis.
        Returns: (is_valid, status_message, tampered_event_id, tampered_sequence)
        """
        if not self.events:
            return True, "✓ HASH CHAIN VALID (Empty ledger)", None, None

        expected_prev = self.GENESIS_HASH
        for idx, event in enumerate(self.events):
            # Check previous hash link
            if event.previous_event_hash != expected_prev:
                return False, f"⚠ HASH CHAIN BROKEN at Event {event.event_id}: previous hash mismatch", event.event_id, idx

            # Recompute event's current hash
            data_to_hash = {
                "event_id": event.event_id,
                "sequence": event.sequence,
                "timestamp": event.timestamp,
                "trust_score": round(event.trust_score, 1),
                "trust_state": event.trust_state.value if hasattr(event.trust_state, 'value') else str(event.trust_state),
                "confidence": round(event.confidence, 1),
                "triggered_checks": sorted(event.triggered_checks),
                "primary_reason": event.primary_reason,
                "recommended_action": event.recommended_action,
                "latitude": round(event.latitude, 6),
                "longitude": round(event.longitude, 6),
                "dataset_hash": event.dataset_hash or "NONE"
            }
            canonical_str = json.dumps(data_to_hash, sort_keys=True)
            payload = f"{event.previous_event_hash}|{canonical_str}".encode("utf-8")
            recomputed_hash = hashlib.sha256(payload).hexdigest()

            if recomputed_hash != event.current_event_hash:
                return False, f"⚠ HASH CHAIN BROKEN at Event {event.event_id}: internal cryptographic payload was modified", event.event_id, idx

            expected_prev = event.current_event_hash

        return True, "✓ HASH CHAIN VALID — All cryptographic block signatures verified", None, None

    def simulate_tampering(self, target_idx: int = 1) -> Dict[str, Any]:
        """
        Demo feature: Intentionally corrupts an event in memory to demonstrate
        tamper detection to judges and operators.
        """
        if not self.events:
            return {"error": "No events available to tamper"}

        idx = min(target_idx, len(self.events) - 1)
        target = self.events[idx]
        original_score = target.trust_score

        # Tamper: secretly alter trust score without recomputing hash chain
        target.trust_score = 99.9
        target.primary_reason = "FORGED: Attempted malicious whitewashing of quarantine log"

        is_valid, msg, bad_id, bad_idx = self.verify_chain()

        return {
            "tampered_event_id": target.event_id,
            "original_score": original_score,
            "forged_score": target.trust_score,
            "chain_valid": is_valid,
            "verification_status": msg
        }
