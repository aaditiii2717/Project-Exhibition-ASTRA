"""
ASTRA Main FastAPI Application
Exposes REST endpoints for telemetry ingestion, validation, physical-layer analysis,
simulation playback, forensic ledger auditing, and scientific evaluation benchmarks.
"""

from fastapi import FastAPI, HTTPException, Body, Depends
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List, Optional
from pydantic import BaseModel

from .core.schema import GNSSObservation, TrustResult, WhyTrustChanged, ForensicEvent, DatasetIntegrity
from .gateway.sanitizer import InputGateway
from .evidence.basic_checks import BasicEvidenceEngine
from .physics.layers import PhysicalLayerEngine
from .ml.engine import MLEngine
from .fusion.engine import FusionEngine
from .decision.engine import DecisionEngine
from .forensics.memory import ForensicMemory
from .simulation.scenarios import ScenarioGenerator
from .evaluation.benchmark import BenchmarkEvaluator
from .security import require_api_key, require_stream_id, settings
from threading import RLock

app = FastAPI(
    title="ASTRA Navigation Trust & Integrity Layer",
    description="Software-based GNSS navigation integrity and physical consistency verification for autonomous systems.",
    version="1.0.0"
)

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=False,
    allow_methods=["GET", "POST"],
    allow_headers=["Content-Type", "X-ASTRA-API-Key", "X-ASTRA-Stream-ID"],
)

# Singleton stateful pipeline components for continuous streaming
gateway = InputGateway()
basic_engine = BasicEvidenceEngine()
physics_engine = PhysicalLayerEngine()
ml_engine = MLEngine()
fusion_engine = FusionEngine()
decision_engine = DecisionEngine()
forensic_memory = ForensicMemory()


class StreamPipeline:
    """State is deliberately scoped to one authenticated receiver stream."""
    def __init__(self):
        self.gateway = InputGateway()
        self.basic_engine = BasicEvidenceEngine()
        self.physics_engine = PhysicalLayerEngine()
        self.ml_engine = MLEngine()
        self.fusion_engine = FusionEngine()
        self.decision_engine = DecisionEngine()
        self.forensic_memory = forensic_memory
        self.lock = RLock()


stream_pipelines: Dict[str, StreamPipeline] = {}
stream_pipelines_lock = RLock()
MAX_ACTIVE_STREAMS = 1024


def get_stream_pipeline(stream_id: str) -> StreamPipeline:
    with stream_pipelines_lock:
        pipeline = stream_pipelines.get(stream_id)
        if pipeline is None:
            if len(stream_pipelines) >= MAX_ACTIVE_STREAMS:
                raise HTTPException(status_code=503, detail="Active stream capacity reached")
            pipeline = StreamPipeline()
            stream_pipelines[stream_id] = pipeline
        return pipeline


class SingleStepAnalysisResponse(BaseModel):
    observation: GNSSObservation
    result: TrustResult
    why_trust_changed: WhyTrustChanged
    forensic_event: ForensicEvent


@app.get("/")
def read_root():
    return {
        "product": "ASTRA Navigation Trust & Integrity Layer",
        "tagline": "Normal navigation asks: Where am I? ASTRA asks: Can I trust where I am?",
        "status": "OPERATIONAL",
        "version": "1.0.0"
    }


@app.get("/api/health")
def health_check():
    return {
        "status": "OPERATIONAL",
        "gateway": "READY",
        "physics_engine": "READY",
        "ml_models": "APPROVED_ARTIFACT_LOADED" if ml_engine.is_trained else "NOT_LOADED",
        "forensic_chain": "VALID"
    }


@app.post("/api/validate", dependencies=[Depends(require_api_key)])
def validate_single(payload: Dict[str, Any], stream_id: str = Depends(require_stream_id)):
    """Validates raw dictionary via secure input gateway."""
    pipeline = get_stream_pipeline(stream_id)
    with pipeline.lock:
        is_valid, obs, errors = pipeline.gateway.validate_observation_dict(payload)
    if not is_valid:
        return {
            "valid": False,
            "errors": errors,
            "observation": None
        }
    return {
        "valid": True,
        "errors": [],
        "observation": obs.dict()
    }


@app.post("/api/analyze", dependencies=[Depends(require_api_key)])
def analyze_single(payload: Dict[str, Any] = Body(...), stream_id: str = Depends(require_stream_id)):
    """
    Executes full multi-layer ASTRA pipeline on a normalized GNSS observation:
    Gateway -> Basic Checks -> Physical Layers -> ML -> Fusion -> Decision -> Forensic Memory.
    """
    pipeline = get_stream_pipeline(stream_id)
    with pipeline.lock:
        is_valid, obs, errors = pipeline.gateway.validate_observation_dict(payload)
        if not is_valid or obs is None:
            raise HTTPException(status_code=422, detail={"message": "Telemetry rejected by secure input gateway", "errors": errors})

        # 1. Basic Engineering Checks
        basic_items = pipeline.basic_engine.evaluate(obs)

    # 2. Advanced Physical-Layer GNSS Checks (C3, L2, L3, L4 with availability gating)
        physics_items = pipeline.physics_engine.evaluate(obs)

    # 3. Hybrid ML Anomaly Detection & Feature Attribution
        ml_item, ml_score, ml_top_features = pipeline.ml_engine.evaluate(obs, physics_items)

    # Combine all evidence sources
        all_evidence = basic_items + physics_items + [ml_item]

    # 4. Transparent Evidence Fusion
        trust_score, confidence, primary_reasons, recommended_action = pipeline.fusion_engine.fuse(
            all_evidence, ml_score, ml_top_features
        )

    # 5. Decision Engine & "Why Did Trust Change?" Diff
        trust_result, why_changed = pipeline.decision_engine.decide(
            trust_score=trust_score,
            confidence=confidence,
            evidence_items=all_evidence,
            primary_reasons=primary_reasons,
            recommended_action=recommended_action,
            ml_score=ml_score,
            ml_top_features=ml_top_features
        )

    # 6. Append to Tamper-Evident Forensic Memory
        triggered = [e.name for e in all_evidence if e.status in ["WARN", "FAIL"]]
        forensic_evt = pipeline.forensic_memory.record_event(
            timestamp=obs.timestamp,
            trust_score=trust_result.trust_score,
            trust_state=trust_result.trust_state,
            confidence=trust_result.confidence,
            triggered_checks=triggered,
            primary_reason=trust_result.primary_reasons[0] if trust_result.primary_reasons else "Nominal",
            recommended_action=trust_result.recommended_action,
            latitude=obs.latitude,
            longitude=obs.longitude
        )

    return {
        "observation": obs,
        "result": trust_result,
        "why_trust_changed": why_changed,
        "forensic_event": forensic_evt
    }


@app.get("/api/scenarios")
def list_scenarios():
    """Returns available simulation scenarios with metadata."""
    return ScenarioGenerator.get_all_scenarios_meta()


@app.post("/api/simulate/{scenario_id}")
def simulate_scenario(scenario_id: str, steps: int = 25):
    """
    Executes a deterministic simulated threat scenario.
    Returns complete step-by-step trajectory, trust scores, evidence matrices,
    and forensic events for client-side replay and inspection.
    """
    observations = ScenarioGenerator.generate_scenario(scenario_id, num_steps=steps)

    # Fresh pipeline instances for clean scenario execution
    b_eng = BasicEvidenceEngine()
    p_eng = PhysicalLayerEngine()
    m_eng = MLEngine()
    f_eng = FusionEngine()
    d_eng = DecisionEngine()
    f_mem = forensic_memory

    scenario_steps = []
    for obs in observations:
        b_items = b_eng.evaluate(obs)
        p_items = p_eng.evaluate(obs)
        ml_item, ml_score, ml_feats = m_eng.evaluate(obs, p_items)
        all_items = b_items + p_items + [ml_item]

        trust, conf, reasons, action = f_eng.fuse(all_items, ml_score, ml_feats)
        result, why_changed = d_eng.decide(trust, conf, all_items, reasons, action, ml_score, ml_feats)

        triggered = [e.name for e in all_items if e.status in ["WARN", "FAIL"]]
        evt = f_mem.record_event(
            timestamp=obs.timestamp,
            trust_score=result.trust_score,
            trust_state=result.trust_state,
            confidence=result.confidence,
            triggered_checks=triggered,
            primary_reason=result.primary_reasons[0] if result.primary_reasons else "Nominal",
            recommended_action=result.recommended_action,
            latitude=obs.latitude,
            longitude=obs.longitude
        )

        scenario_steps.append({
            "observation": obs.dict(),
            "result": result.dict(),
            "why_trust_changed": why_changed.dict(),
            "forensic_event": evt.dict()
        })

    is_valid, chain_status, _, _ = f_mem.verify_chain()

    return {
        "scenario_id": scenario_id,
        "total_steps": len(scenario_steps),
        "steps": scenario_steps,
        "forensic_chain_valid": is_valid,
        "chain_status_message": chain_status
    }


@app.post("/api/ingest/text")
def ingest_text_dataset(payload: Dict[str, str] = Body(...)):
    """
    Ingests raw CSV or NMEA text content, calculates SHA-256 hash, parses, validates, and runs pipeline.
    """
    content = payload.get("content", "")
    data_type = payload.get("type", "csv").lower()

    if not content.strip():
        raise HTTPException(status_code=400, detail="Empty content provided")

    sha256 = InputGateway.compute_sha256(content)

    if data_type == "nmea":
        lines = content.splitlines()
        raw_rows = []
        for l in lines:
            parsed = InputGateway.parse_nmea_sentence(l)
            if parsed:
                raw_rows.append(parsed)
    else:
        raw_rows, _, errors = InputGateway.parse_csv_content(content)

    # Validate rows
    valid_observations = []
    val_errors = []
    temp_gw = InputGateway()

    for r in raw_rows:
        ok, obs, errs = temp_gw.validate_observation_dict(r)
        if ok and obs:
            valid_observations.append(obs)
        else:
            val_errors.extend(errs)

    # Run pipeline on valid observations
    b_eng = BasicEvidenceEngine()
    p_eng = PhysicalLayerEngine()
    m_eng = MLEngine()
    f_eng = FusionEngine()
    d_eng = DecisionEngine()
    f_mem = forensic_memory
    f_mem.reset(dataset_hash=sha256)

    processed_steps = []
    for obs in valid_observations:
        b_items = b_eng.evaluate(obs)
        p_items = p_eng.evaluate(obs)
        ml_item, ml_score, ml_feats = m_eng.evaluate(obs, p_items)
        all_items = b_items + p_items + [ml_item]

        trust, conf, reasons, action = f_eng.fuse(all_items, ml_score, ml_feats)
        result, why_changed = d_eng.decide(trust, conf, all_items, reasons, action, ml_score, ml_feats)

        triggered = [e.name for e in all_items if e.status in ["WARN", "FAIL"]]
        evt = f_mem.record_event(
            timestamp=obs.timestamp,
            trust_score=result.trust_score,
            trust_state=result.trust_state,
            confidence=result.confidence,
            triggered_checks=triggered,
            primary_reason=result.primary_reasons[0] if result.primary_reasons else "Nominal",
            recommended_action=result.recommended_action,
            latitude=obs.latitude,
            longitude=obs.longitude
        )

        processed_steps.append({
            "observation": obs.dict(),
            "result": result.dict(),
            "why_trust_changed": why_changed.dict(),
            "forensic_event": evt.dict()
        })

    is_chain_valid, chain_msg, _, _ = f_mem.verify_chain()

    return {
        "dataset_integrity": {
            "sha256": sha256,
            "status": "VERIFIED",
            "total_records": len(raw_rows),
            "valid_records": len(valid_observations),
            "rejected_records": len(raw_rows) - len(valid_observations),
            "validation_errors": val_errors[:10]
        },
        "steps": processed_steps,
        "forensic_chain_valid": is_chain_valid,
        "chain_status_message": chain_msg
    }


@app.get("/api/forensics")
def get_forensic_ledger():
    """Returns current in-memory cryptographic event chain and verification status."""
    is_valid, msg, bad_id, bad_seq = forensic_memory.verify_chain()
    return {
        "is_valid": is_valid,
        "status_message": msg,
        "tampered_event_id": bad_id,
        "total_events": len(forensic_memory.events),
        "dataset_sha256": forensic_memory.dataset_sha256 or "SIMULATED_DATASET_VERIFIED",
        "events": [e.dict() for e in forensic_memory.events]
    }


@app.post("/api/forensics/tamper-test", dependencies=[Depends(require_api_key)])
def tamper_test():
    """
    Deliberately corrupts an event in memory to demonstrate cryptographic tamper detection.
    """
    if settings.is_production:
        raise HTTPException(status_code=404, detail="Not found")
    res = forensic_memory.simulate_tampering(target_idx=1)
    return res


@app.post("/api/forensics/reset", dependencies=[Depends(require_api_key)])
def reset_forensics():
    if settings.is_production:
        raise HTTPException(status_code=404, detail="Not found")
    forensic_memory.reset()
    return {"status": "RESET"}


@app.get("/api/evaluation")
def get_evaluation_benchmark():
    """Runs scientific evaluation and returns comparative metrics across models."""
    return BenchmarkEvaluator.run_full_benchmark()
