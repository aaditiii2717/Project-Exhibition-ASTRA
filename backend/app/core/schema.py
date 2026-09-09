"""
ASTRA Core Data Schemas
Standardized data contracts for GNSS telemetry, physical measurements, evidence, decisions, and forensics.
"""

from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field
from enum import Enum


class TrustState(str, Enum):
    TRUSTED = "TRUSTED"
    DEGRADED = "DEGRADED"
    SUSPICIOUS = "SUSPICIOUS"
    QUARANTINED = "QUARANTINED"
    INCONCLUSIVE = "INCONCLUSIVE"


class CheckStatus(str, Enum):
    PASS = "PASS"
    WARN = "WARN"
    FAIL = "FAIL"
    UNAVAILABLE = "UNAVAILABLE"


class DataSourceType(str, Enum):
    LIVE = "LIVE"
    REPLAY = "REPLAY"
    SIMULATED = "SIMULATED"
    UPLOADED = "UPLOADED DATA"


class GNSSObservation(BaseModel):
    """Normalized GNSS observation adhering to standard ASTRA schema."""
    timestamp: str = Field(..., description="ISO 8601 or UTC timestamp")
    latitude: float = Field(..., ge=-90.0, le=90.0, description="Latitude in degrees")
    longitude: float = Field(..., ge=-180.0, le=180.0, description="Longitude in degrees")
    altitude: float = Field(default=0.0, description="Altitude in meters (WGS84 / MSL)")
    speed: float = Field(default=0.0, ge=0.0, description="Ground speed in m/s")
    heading: float = Field(default=0.0, ge=0.0, le=360.0, description="Course over ground in degrees")
    satellite_count: int = Field(default=0, ge=0, description="Number of tracked satellites")
    fix_quality: int = Field(default=1, ge=0, le=8, description="GNSS fix quality (0=invalid, 1=GPS, 2=DGPS, etc.)")
    hdop: float = Field(default=1.0, ge=0.0, description="Horizontal Dilution of Precision")
    vdop: float = Field(default=1.5, ge=0.0, description="Vertical Dilution of Precision")
    pdop: float = Field(default=1.8, ge=0.0, description="Positional Dilution of Precision")

    # Optional Advanced Raw GNSS Physical Layer measurements
    # Strictly NOT fabricated if absent
    satellites: Optional[List[int]] = Field(default=None, description="List of satellite PRNs")
    pseudorange: Optional[List[float]] = Field(default=None, description="Pseudoranges per satellite (meters)")
    pseudorange_rate: Optional[List[float]] = Field(default=None, description="Pseudorange rate per satellite (m/s)")
    doppler: Optional[List[float]] = Field(default=None, description="Doppler frequency shift (Hz)")
    cn0: Optional[List[float]] = Field(default=None, description="Carrier-to-Noise density ratio (dB-Hz)")
    satellite_positions: Optional[List[List[float]]] = Field(default=None, description="Satellite ECEF coordinates [x, y, z] in meters")
    satellite_velocities: Optional[List[List[float]]] = Field(default=None, description="Satellite ECEF velocities [vx, vy, vz] in m/s")
    carrier_phase: Optional[List[float]] = Field(default=None, description="Carrier phase measurements in cycles")


class EvidenceItem(BaseModel):
    """Standardized output from each engineering, physical-layer, or ML check."""
    name: str
    category: str  # "BASIC", "PHYSICAL", "ML"
    value: Optional[float] = None
    status: CheckStatus
    severity: float = Field(default=0.0, ge=0.0, le=1.0, description="0=benign, 1=critical anomaly")
    explanation: str
    formula: Optional[str] = None
    threshold: Optional[str] = None
    threshold_type: str = "DEMO THRESHOLD"  # "DEMO THRESHOLD" vs "VALIDATED THRESHOLD"
    is_available: bool = True
    unavailability_reason: Optional[str] = None
    weight: float = 1.0


class TrustResult(BaseModel):
    """Fused trust and confidence assessment."""
    trust_score: float = Field(..., ge=0.0, le=100.0)
    trust_state: TrustState
    confidence: float = Field(..., ge=0.0, le=100.0)
    primary_reasons: List[str]
    recommended_action: str
    evidence_matrix: List[EvidenceItem]
    ml_score: Optional[float] = None
    ml_top_features: Optional[Dict[str, float]] = None


class WhyTrustChanged(BaseModel):
    """Detailed diagnostic diff when trust state changes."""
    occurred: bool = False
    previous_state: Optional[TrustState] = None
    current_state: Optional[TrustState] = None
    previous_score: Optional[float] = None
    current_score: Optional[float] = None
    triggering_evidence: List[str] = []
    key_metrics_diff: Dict[str, Any] = {}
    conclusion: str = ""
    recommended_action: str = ""


class ForensicEvent(BaseModel):
    """Cryptographically chained forensic log entry."""
    event_id: str
    sequence: int
    timestamp: str
    trust_score: float
    trust_state: TrustState
    confidence: float
    triggered_checks: List[str]
    primary_reason: str
    recommended_action: str
    latitude: float
    longitude: float
    previous_event_hash: str
    current_event_hash: str
    dataset_hash: Optional[str] = None


class DatasetIntegrity(BaseModel):
    sha256: str
    status: str  # "VERIFIED", "MODIFIED", "UNKNOWN"
    total_records: int
    valid_records: int
    rejected_records: int
    validation_errors: List[str]
