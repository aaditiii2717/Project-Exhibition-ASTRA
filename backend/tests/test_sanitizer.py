import unittest
from backend.app.gateway.sanitizer import InputGateway


class TestInputGateway(unittest.TestCase):
    def setUp(self):
        self.gateway = InputGateway()

    def test_valid_observation(self):
        data = {
            "timestamp": "2026-09-03T12:00:00Z",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "altitude": 215.0,
            "speed": 12.5,
            "heading": 85.0,
            "satellite_count": 9,
            "fix_quality": 1,
            "hdop": 0.9,
            "pdop": 1.6
        }
        ok, obs, errors = self.gateway.validate_observation_dict(data)
        self.assertTrue(ok)
        self.assertEqual(len(errors), 0)
        self.assertIsNotNone(obs)
        self.assertAlmostEqual(obs.latitude, 28.6139)

    def test_latitude_out_of_bounds(self):
        data = {
            "timestamp": "2026-09-03T12:00:00Z",
            "latitude": 95.0,  # Invalid!
            "longitude": 77.2090
        }
        ok, obs, errors = self.gateway.validate_observation_dict(data)
        self.assertFalse(ok)
        self.assertTrue(any("Latitude out of bounds" in e for e in errors))

    def test_negative_speed_rejection(self):
        data = {
            "timestamp": "2026-09-03T12:00:00Z",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "speed": -5.0  # Impossible!
        }
        ok, obs, errors = self.gateway.validate_observation_dict(data)
        self.assertFalse(ok)
        self.assertTrue(any("Negative ground speed" in e for e in errors))

    def test_sha256_computation(self):
        text = "TEST_GNSS_DATASET_PAYLOAD"
        h = InputGateway.compute_sha256(text)
        self.assertEqual(len(h), 64)
        self.assertEqual(h, InputGateway.compute_sha256(text))

    def test_raw_measurement_length_mismatch_is_rejected(self):
        data = {
            "timestamp": "2026-09-03T12:00:00Z",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "pseudorange": [20200000.0, 20300000.0],
            "doppler": [-1000.0]
        }
        ok, _, errors = self.gateway.validate_observation_dict(data)
        self.assertFalse(ok)
        self.assertTrue(any("identical lengths" in error for error in errors))

    def test_raw_measurement_nan_is_rejected(self):
        data = {
            "timestamp": "2026-09-03T12:00:00Z",
            "latitude": 28.6139,
            "longitude": 77.2090,
            "pseudorange": [float("nan")]
        }
        ok, _, errors = self.gateway.validate_observation_dict(data)
        self.assertFalse(ok)
        self.assertTrue(any("NaN or Infinity" in error for error in errors))


if __name__ == "__main__":
    unittest.main()
