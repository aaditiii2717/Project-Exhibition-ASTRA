import unittest
from backend.app.physics.layers import PhysicalLayerEngine
from backend.app.core.schema import GNSSObservation, CheckStatus


class TestPhysicalLayers(unittest.TestCase):
    def setUp(self):
        self.engine = PhysicalLayerEngine()

    def test_l1_doppler_range_consistent(self):
        c_over_f0 = 299792458.0 / 1575.42e6
        rho_rates = [-200.0, 150.0]
        # In consistent conditions, Doppler = -rho_dot / (c/f0)
        dopplers = [-r / c_over_f0 for r in rho_rates]

        obs = GNSSObservation(
            timestamp="12:00:00",
            latitude=28.6139,
            longitude=77.2090,
            pseudorange_rate=rho_rates,
            doppler=dopplers
        )
        evidence = self.engine.evaluate(obs)
        l1_check = next(e for e in evidence if "L1" in e.name)
        self.assertEqual(l1_check.status, CheckStatus.PASS)
        self.assertLess(l1_check.value, 0.5)

    def test_l1_doppler_range_inconsistent(self):
        # Desynchronized Doppler and pseudorange rates
        obs = GNSSObservation(
            timestamp="12:00:00",
            latitude=28.6139,
            longitude=77.2090,
            pseudorange_rate=[200.0, -150.0],
            doppler=[1000.0, -900.0]  # Severe mismatch!
        )
        evidence = self.engine.evaluate(obs)
        l1_check = next(e for e in evidence if "L1" in e.name)
        self.assertEqual(l1_check.status, CheckStatus.FAIL)
        self.assertGreater(l1_check.value, 5.0)

    def test_physical_layers_unavailable_when_raw_missing(self):
        # Standard PVT without raw measurements
        obs = GNSSObservation(
            timestamp="12:00:00",
            latitude=28.6139,
            longitude=77.2090,
            altitude=215.0
        )
        evidence = self.engine.evaluate(obs)
        l1_check = next(e for e in evidence if "L1" in e.name)
        l2_check = next(e for e in evidence if "L2" in e.name)
        l4_check = next(e for e in evidence if "L4" in e.name)

        self.assertEqual(l1_check.status, CheckStatus.UNAVAILABLE)
        self.assertFalse(l1_check.is_available)
        self.assertIn("DATA NOT AVAILABLE", l1_check.explanation)

        self.assertEqual(l2_check.status, CheckStatus.UNAVAILABLE)
        self.assertEqual(l4_check.status, CheckStatus.UNAVAILABLE)


if __name__ == "__main__":
    unittest.main()
