import unittest
from backend.app.forensics.memory import ForensicMemory
from backend.app.core.schema import TrustState


class TestForensicMemory(unittest.TestCase):
    def setUp(self):
        import tempfile
        import os
        self.test_dir = tempfile.TemporaryDirectory()
        self.test_file = os.path.join(self.test_dir.name, "test_ledger.jsonl")
        self.mem = ForensicMemory(file_path=self.test_file)

    def tearDown(self):
        self.test_dir.cleanup()

    def test_chain_integrity_valid(self):
        self.mem.record_event(
            timestamp="12:00:00",
            trust_score=90.0,
            trust_state=TrustState.TRUSTED,
            confidence=95.0,
            triggered_checks=[],
            primary_reason="Nominal",
            recommended_action="ACCEPT",
            latitude=28.6139,
            longitude=77.2090
        )
        self.mem.record_event(
            timestamp="12:00:01",
            trust_score=60.0,
            trust_state=TrustState.DEGRADED,
            confidence=85.0,
            triggered_checks=["Signal & Availability"],
            primary_reason="High HDOP",
            recommended_action="CONTINUE WITH MONITORING",
            latitude=28.6140,
            longitude=77.2090
        )
        is_valid, msg, bad_id, _ = self.mem.verify_chain()
        self.assertTrue(is_valid)
        self.assertIn("HASH CHAIN VALID", msg)

    def test_tamper_detection(self):
        self.mem.record_event(
            timestamp="12:00:00",
            trust_score=90.0,
            trust_state=TrustState.TRUSTED,
            confidence=95.0,
            triggered_checks=[],
            primary_reason="Nominal",
            recommended_action="ACCEPT",
            latitude=28.6139,
            longitude=77.2090
        )
        self.mem.record_event(
            timestamp="12:00:01",
            trust_score=20.0,
            trust_state=TrustState.QUARANTINED,
            confidence=95.0,
            triggered_checks=["Motion Consistency"],
            primary_reason="Displacement jump",
            recommended_action="QUARANTINE",
            latitude=28.6500,
            longitude=77.2090
        )
        # Tamper with the event
        res = self.mem.simulate_tampering(target_idx=1)
        self.assertFalse(res["chain_valid"])
        self.assertIn("HASH CHAIN BROKEN", res["verification_status"])


if __name__ == "__main__":
    unittest.main()
