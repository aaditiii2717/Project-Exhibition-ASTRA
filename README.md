# ASTRA Trust Layer

> **Normal navigation asks: Where am I? ASTRA asks: Can I trust where I am?**

ASTRA is a software-based GNSS navigation integrity and physical consistency verification platform for autonomous systems. It combines a cinematic product landing page, a Mission Control interface, and a FastAPI trust-analysis backend.

---

## Project Structure

```text
backend/
  app/
    core/          Data schemas (GNSSObservation, TrustResult, ForensicEvent …)
    gateway/       Secure input gateway — CSV / NMEA parsing, sanitization, SHA-256 hashing
    evidence/      Basic engineering checks (position jump, kinematics, time consistency)
    physics/       4-layer physical integrity engine (L1 Doppler, L2 WLS, L3 Trajectory, L4 Geometry)
    ml/            ML anomaly detection engine (scikit-learn)
    fusion/        Weighted evidence fusion → Trust Score + Confidence
    decision/      Trust state machine + WhyTrustChanged diagnostics
    forensics/     Cryptographic tamper-evident forensic ledger
    simulation/    Deterministic threat scenario generator
    evaluation/    Scientific benchmark evaluator
  data/            Runtime data (users.json — gitignored, see users.json.example)
  models/          Trained model artifacts (gitignored, tracked via Git LFS)
  ml_data/         Training data contract (see ml_data/README.md)
  tests/           Pytest unit tests
  train_model.py   Full pipeline model trainer
  requirements.txt Python dependencies

frontend/
  index.html            Cinematic landing page
  main.html             Mission Control interface
  login.html            Operator authentication
  terms.html            Terms of use
  script.js             Landing page logic
  support.js            Mission Control utilities
  auth-guard.js         Client-side auth guard
  landing-motion.js     Scroll-driven animation controller
  styles.css            Shared base styles
  tokens.css            Design tokens
  landing-redesign.css  Landing layout system
  landing-refined.css   Landing refinements + capsule components
  landing-instrument.css Instrument / data panel styles
  landing-motion.css    Motion layer styles
  mission-control.css   Mission Control styles
  refined-theme.css     Theme overrides
  src/                  Three.js shader source (build with npm run build:threeui)
  assets/               Brand, fonts, vendor, visuals (brand PNGs tracked via Git LFS)
  frames/               Scroll-driven frame sequence — 1,320 JPEGs (Git LFS)
  frames-4k/            4K frame sequence (Git LFS)
  threeui.bundle.js     Built Three.js bundle (committed as compiled artifact)

samples/
  astra-telemetry-demo.csv      Full-featured demo telemetry
  gradual_drift_detected.csv    Stealth spoof detection sample
  gradual_drift_near_threshold.csv  Edge-case sample near trust boundary
```

---

## Quick Start

### Prerequisites
- Python 3.11+
- Node.js 18+ (only needed to rebuild the Three.js bundle)

### 1 — Install Python dependencies

```powershell
python -m venv .venv
.\.venv\Scripts\pip install -r backend\requirements.txt
```

### 2 — Configure environment

```powershell
Copy-Item backend\.env.example backend\.env
# Edit backend\.env and set ASTRA_API_KEY, ASTRA_LEDGER_SIGNING_KEY, ASTRA_MODEL_PATH
```

### 3 — Set up users

```powershell
Copy-Item backend\app\data\users.json.example backend\app\data\users.json
# Edit users.json and replace placeholder hashes with real ones
```

### 4 — Run the server

```powershell
$env:ASTRA_MODEL_PATH = "$PWD\backend\models\astra_v1_model.joblib"
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

Open:
- **Landing page** → http://127.0.0.1:8000/
- **Mission Control** → http://127.0.0.1:8000/main.html
- **API docs** → http://127.0.0.1:8000/docs

> `ASTRA_MODEL_PATH` must point at a trained model artifact or the ML evidence layer stays inactive (`ml_models: NOT_LOADED` at `/api/health`).

---

## Train the ML Model

```powershell
# Generate synthetic training data
.\.venv\Scripts\python.exe backend\generate_dataset.py

# Train the full pipeline model
.\.venv\Scripts\python.exe backend\train_model.py
```

---

## Run Tests

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests\ -v
```

---

## Frontend Shader Build

Only needed if you modify files in `frontend/src/`:

```powershell
cd frontend
npm install
npm run build:threeui
```

---

## Git LFS

The frame sequences (~188 MB of JPEGs) and brand PNGs are managed via Git LFS. Enable it once before your first commit:

```powershell
git lfs install
```

---

## Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System and ML model status |
| `POST` | `/api/analyze` | Full trust pipeline on a single GNSS observation |
| `POST` | `/api/validate` | Input gateway validation only |
| `GET` | `/api/scenarios` | List available simulation scenarios |
| `POST` | `/api/simulate/{id}` | Run a deterministic threat scenario |
| `POST` | `/api/ingest/text` | Ingest CSV or NMEA text dataset |
| `GET` | `/api/forensics` | Cryptographic forensic ledger |
| `GET` | `/api/evaluation` | Scientific benchmark results |

---

## Architecture

```
CSV / NMEA / Live telemetry
        │
        ▼
  ┌─────────────┐
  │ Input Gateway│  SHA-256 hash, schema validation, NaN/Inf rejection,
  │  (sanitizer) │  duplicate detection, monotonic time check
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │Basic Evidence│  Position jump, kinematic coherence, satellite count,
  │   Engine     │  signal quality, time consistency
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │ Physics Layer│  L1 Doppler–Range, L2 WLS Pseudorange, L3 Trajectory
  │   Engine     │  Smoothness, L4 Relative Geometry, HPL/VPL bounds
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │  ML Engine  │  Scikit-learn anomaly detector on 15+ physical features
  └──────┬──────┘
         │
         ▼
  ┌─────────────┐
  │Fusion Engine │  Weighted severity aggregation → Trust Score (0–100)
  └──────┬──────┘       + independent Confidence (0–100%)
         │
         ▼
  ┌─────────────┐
  │Decision Engine│ Trust state machine: TRUSTED / DEGRADED /
  └──────┬──────┘  SUSPICIOUS / QUARANTINED + recommended action
         │
         ▼
  ┌─────────────┐
  │Forensic Memory│ Cryptographic SHA-256 chain — tamper-evident audit log
  └─────────────┘
```

---

## Disclaimer

ASTRA is an academic prototype for demonstrating receiver-side navigation integrity. It is **not certified for safety-critical navigation or operational decision-making**.
