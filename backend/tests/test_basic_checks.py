import unittest
from backend.app.evidence.basic_checks import BasicEvidenceEngine
from backend.app.core.schema import GNSSObservation, CheckStatus


class TestBasicChecks(unittest.TestCase):
    def setUp(self):
        self.engine = BasicEvidenceEngine()

    def test_nominal_motion(self):
        obs1 = GNSSObservation(
            timestamp="12:00:00",
            latitude=28.6139,
            longitude=77.2090,
            speed=12.0
        )
        obs2 = GNSSObservation(
            timestamp="12:00:01",
            latitude=28.6140,  # ~11 meters displacement
            longitude=77.2090,
            speed=12.0
        )
        self.engine.evaluate(obs1)
        evidence = self.engine.evaluate(obs2)
        motion_check = next(e for e in evidence if e.name == "Motion Consistency")
        self.assertEqual(motion_check.status, CheckStatus.PASS)

    def test_sudden_position_jump(self):
        obs1 = GNSSObservation(
            timestamp="12:00:00",
            latitude=28.6139,
            longitude=77.2090,
            speed=12.0
        )
        obs2 = GNSSObservation(
            timestamp="12:00:01",
            latitude=28.6500,  # ~4 km jump!
            longitude=77.2090,
            speed=12.0
        )
        self.engine.evaluate(obs1)
        evidence = self.engine.evaluate(obs2)
        jump_check = next(e for e in evidence if e.name == "Position Jump Check")
        self.assertEqual(jump_check.status, CheckStatus.FAIL)
        self.assertGreater(jump_check.severity, 0.9)

    def test_degraded_gnss_not_spoofing(self):
        # High HDOP and fewer satellites should flag WARN (Degraded), NOT FAIL (Attack)
        obs = GNSSObservation(
            timestamp="12:00:00",
            latitude=28.6139,
            longitude=77.2090,
            satellite_count=5,
            hdop=3.8,
            pdop=5.2,
            fix_quality=1
        )
        evidence = self.engine.evaluate(obs)
        sig_check = next(e for e in evidence if e.name == "Signal & Availability")
        self.assertEqual(sig_check.status, CheckStatus.WARN)
        self.assertIn("Degraded satellite geometry", sig_check.explanation)


if __name__ == "__main__":
    unittest.main()
