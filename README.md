# LineSight QA — Self-Calibrating Assembly-Line Anomaly Detector

An industrial **visual quality-inspection** web app. It learns what a *good* part looks like from a few reference images (self-calibration), then inspects new parts to detect defects, **localize them with bounding-box overlays**, report a confidence/uncertainty score, and surface **root-cause insights** and **process-drift** warnings.

Vision inference is powered by a cloud model (**Google Gemini `gemini-3.1-pro-preview`**) instead of a trained CNN, because model training isn't feasible in this environment. The API contract is model-agnostic, so a real trained CNN/PatchCore microservice can be dropped in later without changing the app.

---

## Table of Contents
1. [Key Features](#key-features)
2. [How It Works](#how-it-works)
3. [Tech Stack](#tech-stack)
4. [Project Structure](#project-structure)
5. [Environment Variables](#environment-variables)
6. [Running the App](#running-the-app)
7. [API Reference](#api-reference)
8. [Data Model](#data-model-mongodb)
9. [Frontend Pages](#frontend-pages)
10. [Clearing the Database](#clearing-the-database)
11. [Swapping in a Real Trained Model](#swapping-in-a-real-trained-model)
12. [Notes & Limitations](#notes--limitations)

---

## Key Features
- **Self-calibration** — teach a product line its "normal" baseline from GOOD images only (no defect labels needed).
- **Anomaly inspection** — PASS / FAIL / UNCERTAIN verdict + confidence gauge on any test image.
- **Localized overlays** — anomalies drawn as color-coded (severity) bounding boxes on the image, with a synced regions table.
- **Dashboard** — fleet KPIs, verdict distribution, recent inspections feed.
- **Insights** — root-cause clustering of recurring defect types & locations, confidence/anomaly trend charts, a 3x3 defect-location heat grid, and **drift detection** (rising anomaly rate -> Watch / High).
- **Inspection history** — filterable per line, with drill-down detail.
- **Baseline versioning** — every calibration is saved as a restorable version; one-click rollback from a timeline "Versions" tab.
- **Built-in demo parts** — synthetic sample images (good + scratch/missing-bolt/dent/corrosion) to try the flow instantly, no uploads needed.
- **Light / dark "control-room" theme.**

---

## How It Works
1. **Create a Product Line** for a manufactured part.
2. **Calibrate** — upload several good reference images (or click *Use demo sample parts*). Gemini synthesizes a structured "normal profile" (geometry, components, texture, color, landmarks). This is stored as **baseline version 1**.
3. **Inspect** — upload a test image. Gemini compares it against the baseline and returns strict JSON: verdict, confidence, anomaly score, and a list of anomaly regions (normalized bounding boxes + severity + defect type + description + uncertainty note).
4. **Review** — the result page renders the image with overlays, a confidence gauge, and a regions table.
5. **Analyze** — the Insights tab aggregates history into defect clusters, trends, drift status, and root-cause hints.
6. **Version & roll back** — recalibrate anytime to create a new baseline version; restore any previous version in one click.

---

## Tech Stack
| Layer | Technology |
|------|------------|
| Frontend | React, React Router, Tailwind CSS, shadcn/ui, Recharts, lucide-react, framer-motion, sonner |
| Backend | FastAPI (Python), Motor (async MongoDB), Pillow |
| Database | MongoDB |
| Vision AI | Google Gemini `gemini-3.1-pro-preview` via `emergentintegrations` + `EMERGENT_LLM_KEY` |

---

## Project Structure
```
/app
|-- backend/
|   |-- server.py            # FastAPI app + all /api routes
|   |-- vision_service.py    # Gemini calibration + inspection (the swappable inference layer)
|   |-- image_utils.py       # image normalization + synthetic demo-part generator
|   |-- insights.py          # dashboard aggregation, drift detection, root-cause clustering
|   |-- requirements.txt
|   `-- .env                 # MONGO_URL, DB_NAME, CORS_ORIGINS, EMERGENT_LLM_KEY
`-- frontend/
    |-- src/
    |   |-- App.js           # router, theme, app shell
    |   |-- index.css        # design tokens (light/dark), fonts
    |   |-- lib/api.js       # axios client + helpers
    |   |-- components/
    |   |   |-- AppShell.js
    |   |   |-- StatusBadge.js
    |   |   |-- DriftBadge.js
    |   |   |-- ConfidenceGauge.js
    |   |   |-- AnnotationCanvas.js
    |   |   |-- UploadDropzone.js
    |   |   `-- EmptyState.js
    |   `-- pages/
    |       |-- Dashboard.js
    |       |-- ProductLines.js
    |       |-- LineDetail.js       # tabs: Calibration / Inspect / Versions / History / Insights
    |       `-- InspectionResult.js
    `-- .env                 # REACT_APP_BACKEND_URL
```

---

## Environment Variables
**Backend (`/app/backend/.env`):**
```
MONGO_URL="mongodb://localhost:27017"
DB_NAME="test_database"
CORS_ORIGINS="*"
EMERGENT_LLM_KEY="sk-emergent-..."   # universal key for Gemini/OpenAI/Anthropic
```

**Frontend (`/app/frontend/.env`):**
```
REACT_APP_BACKEND_URL="https://<your-host>"   # all API calls use this + /api prefix
```
> Do not hardcode URLs or DB names — always read from env. All backend routes are prefixed with `/api`.

---

## Running the App
Services are managed by **supervisor** (hot-reload enabled).
```bash
# restart after dependency or .env changes
sudo supervisorctl restart backend
sudo supervisorctl restart frontend

# logs
tail -n 100 /var/log/supervisor/backend.*.log
tail -n 100 /var/log/supervisor/frontend.*.log
```
Backend binds to `0.0.0.0:8001`; frontend runs on port `3000`. Ingress routes `/api/*` -> backend, everything else -> frontend.

---

## API Reference
Base path: `${REACT_APP_BACKEND_URL}/api`

| Method | Endpoint | Purpose |
|-------|----------|---------|
| GET | `/` | Health + active model name |
| GET | `/samples` | Synthetic demo images (good[] + defects[]) |
| GET | `/overview` | Fleet-wide dashboard stats |
| POST | `/product-lines` | Create a line `{name, description}` |
| GET | `/product-lines` | List lines |
| GET | `/product-lines/{id}` | Get one line |
| DELETE | `/product-lines/{id}` | Delete line + its inspections + versions |
| POST | `/product-lines/{id}/calibrate` | Multipart `files` -> build baseline (new version) |
| POST | `/product-lines/{id}/inspect` | Multipart `file` -> run inspection (persisted) |
| GET | `/product-lines/{id}/inspections?verdict=` | List inspection history |
| GET | `/inspections/{id}` | Full inspection (with image + line name) |
| DELETE | `/inspections/{id}` | Delete an inspection |
| GET | `/product-lines/{id}/dashboard` | Totals, pass rate, trend, defect distribution, drift |
| GET | `/product-lines/{id}/insights` | Defect clusters, location distribution, root-cause hints |
| GET | `/product-lines/{id}/baseline-versions` | List baseline versions (+ active flag) |
| POST | `/product-lines/{id}/baseline-versions/{version}/activate` | Roll back to a version |

### Inspection response shape
```json
{
  "verdict": "PASS | FAIL | UNCERTAIN",
  "confidence": 0.0,
  "anomaly_score": 0.0,
  "summary": "...",
  "regions": [
    {
      "bbox": [0.1, 0.2, 0.3, 0.4],
      "severity": 0.0,
      "defect_type": "scratch",
      "description": "...",
      "region_confidence": 0.0
    }
  ],
  "uncertainty_note": "..."
}
```
`bbox` = `[x, y, w, h]`, normalized 0-1 with top-left origin.

---

## Data Model (MongoDB)
- **product_lines** — `id, name, description, cover, created_at, baseline_profile, baseline_images[], baseline_updated_at, baseline_version (active), inspection_count`
- **inspections** — `id, product_line_id, verdict, confidence, anomaly_score, summary, regions[], uncertainty_note, image, thumb, baseline_version, created_at`
- **baseline_versions** — `id, product_line_id, version, profile, images[], sample_count, created_at`

Images are stored as base64 JPEG (bounded/resized) directly in MongoDB.

---

## Frontend Pages
- **/** — Dashboard (fleet overview)
- **/lines** — Product Lines list + create
- **/lines/:id** — Line detail with tabs: **Calibration / Inspect / Versions / History / Insights**
- **/inspections/:id** — Annotated inspection result (canvas overlay + regions + gauge)

---

## Clearing the Database
```bash
cd /app/backend && python - <<'PY'
import os
from pymongo import MongoClient
from dotenv import dotenv_values
env = dotenv_values("/app/backend/.env")
c = MongoClient(env["MONGO_URL"]); db = c[env["DB_NAME"]]
for col in ["product_lines", "inspections", "baseline_versions"]:
    print(col, db[col].delete_many({}).deleted_count)
c.close()
PY
```

---

## Swapping in a Real Trained Model
All anomaly reasoning lives in **`backend/vision_service.py`** (`build_baseline()` + `inspect_image()`). The rest of the app only depends on the JSON contract above. To use a real CNN/PatchCore:
1. Host the model as a separate microservice (e.g. FastAPI + PyTorch on a GPU box, or Triton/TorchServe).
2. In `vision_service.py`, replace the Gemini calls with HTTP calls to that service.
3. Return the same JSON shape (`verdict`, `confidence`, `regions[]`, ...).

No frontend or database changes required — true drop-in replacement.

---

## Notes & Limitations
- **Vision model, not a trained CNN.** Gemini performs the anomaly reasoning (approved trade-off given the environment). It's a legitimate production pattern and a reference implementation of the inspection API.
- **Latency.** Calibration and inspection each take ~10-30s (cloud model call). Non-vision endpoints are fast.
- **Cost.** Gemini calls consume Emergent LLM key credits; you can swap in your own provider key anytime.
- **Demo images** are synthetic (clearly labelled) and meant for trying the flow — use your own part images for real use.

---

_Built on the Emergent platform (FastAPI + React + MongoDB)._
