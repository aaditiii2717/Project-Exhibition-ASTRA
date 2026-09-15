# ASTRA Trust Layer

ASTRA combines a cinematic product landing page, a Mission Control interface, and a FastAPI trust-analysis backend.

## Project structure

```text
frontend/   Landing page, Mission Control, shaders, fonts, and frame assets
backend/    FastAPI service, trust engines, simulations, models, and tests
samples/    Import-ready telemetry examples
```

## Run locally

From the repository root:

```powershell
$env:ASTRA_MODEL_PATH = "$PWD\backend\models\astra_v1_model.joblib"
.\.venv\Scripts\python.exe -m uvicorn backend.app.main:app --host 127.0.0.1 --port 8000
```

`ASTRA_MODEL_PATH` must point at the trained model artifact or the ML evidence
layer stays inactive (`ml_models: NOT_LOADED` at `/api/health`).

Open:

- Landing page: `http://127.0.0.1:8000/`
- Mission Control: `http://127.0.0.1:8000/main.html`
- API documentation: `http://127.0.0.1:8000/docs`

The frontend and API are intentionally served by the same FastAPI process, so
Mission Control can use live local analysis without a separate web server.

## Preparing a GitHub push

The Python environment, JavaScript dependencies, logs, caches, secrets, and
runtime forensic ledger are excluded by `.gitignore`. Install dependencies on a
new machine instead of committing generated environments.

The two frame sequences contain 1,320 JPEGs (about 188 MB). They are required by
the landing experience and are already assigned to Git LFS in `.gitattributes`.
Before the first commit, enable Git LFS once:

```powershell
git lfs install
```

## Frontend shader build

From `frontend/`:

```powershell
npm run build:threeui
```
