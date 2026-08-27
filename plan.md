# Development Plan — Self‑Calibrating Assembly‑Line Anomaly Detector (Vision‑powered)

## 1. Objectives
- Build an end-to-end MVP web app for industrial visual inspection that learns **“normal” from good images only**, then flags anomalies on test images.
- Use **Gemini vision** (`gemini-3.1-pro-preview`) via `emergentintegrations` + `EMERGENT_LLM_KEY` for **real inference** (no mocks).
- Deliver **structured anomaly JSON** (verdict + confidence + localized regions + uncertainty) and render **overlay annotations** in the UI.
- Provide **dashboard + inspection history + root-cause clustering** to turn detections into process insights.

## 2. Implementation Steps

### Phase 1 — Core POC (Isolation) ✅ must pass before app
**User stories (POC)**
1. As a QA engineer, I can provide one or more good reference images and get a baseline “normal profile” summary.
2. As a QA engineer, I can submit a test image and receive a PASS/FAIL/UNCERTAIN verdict.
3. As a QA engineer, I receive a numeric anomaly/confidence score (0–1) for the test image.
4. As a QA engineer, I receive localized anomaly regions with normalized bounding boxes.
5. As a QA engineer, I receive an uncertainty note when the model isn’t confident.

**Steps**
1. **Web search (best practice)**: review prompt patterns for reliable JSON + bounding boxes with Gemini vision; choose a strict schema + retry/repair strategy.
2. Create `/app/backend/poc_anomaly_gemini.py`:
   - Load 1–3 “good” images (base64) → call Gemini to synthesize a **baseline profile** (structured).
   - Submit a defective test image + baseline → request **STRICT JSON** response.
   - Parse + validate against a JSON schema (pydantic):
     - `verdict` in {PASS, FAIL, UNCERTAIN}
     - `confidence` float 0–1
     - `regions[]` each with `bbox` (x,y,w,h normalized 0–1), `severity` 0–1, `defect_type`, `description`, `region_confidence` 0–1
     - `uncertainty_note` string
3. Add **robustness**: 2-pass strategy if invalid JSON ("return only JSON" repair prompt); hard-fail if still invalid.
4. Source POC images:
   - Prefer real sample industrial good vs defect images (or generate simple synthetic “part” images with visible defects, but ensure non-uniform and realistic features).
5. Run POC until schema-valid output is stable; only then proceed.

**Deliverable**: POC script prints validated JSON + saves an annotated preview image (optional) with boxes for visual verification.

---

### Phase 2 — V1 App Development (MVP, no auth)
**User stories (V1)**
1. As a QA engineer, I can create a product line and upload multiple good images to calibrate a baseline.
2. As a QA engineer, I can upload a test image and get verdict + confidence in seconds.
3. As a QA engineer, I can see anomaly regions overlaid on the image with severity color coding.
4. As a QA engineer, I can browse inspection history and open any inspection for full details.
5. As a plant manager, I can view a dashboard with pass rate, defect distribution, and a drift warning.

**Backend (FastAPI + Mongo)**
1. Data model (Mongo):
   - `product_lines`: name, created_at, baseline_profile (json), baseline_images (base64 thumbs), baseline_updated_at
   - `inspections`: product_line_id, test_image (base64 thumb), analysis_json, verdict, confidence, created_at
2. API endpoints:
   - `POST /api/product-lines` create
   - `GET /api/product-lines` list
   - `POST /api/product-lines/{id}/baseline-images` upload good images → regenerate baseline via Gemini
   - `POST /api/product-lines/{id}/inspect` upload test image → run analysis via Gemini → store inspection
   - `GET /api/product-lines/{id}/inspections` list
   - `GET /api/inspections/{inspection_id}` detail
   - `GET /api/product-lines/{id}/dashboard` aggregated stats
3. Vision service module:
   - `baseline_from_good_images()` and `inspect_against_baseline()` using `LlmChat.with_model("gemini", "gemini-3.1-pro-preview")`
   - Strict schema prompting, JSON parsing, repair attempt.
4. Image handling:
   - Accept PNG/JPEG/WEBP; convert/resize to bounded dimensions; store base64.

**Frontend (React + shadcn/ui + tailwind + recharts)**
1. Screens:
   - Product lines list + create
   - Product line detail: baseline status, upload good images, “inspect” uploader
   - Inspection result: annotated image canvas overlay + regions table + uncertainty note
   - History list with thumbnails + filters (verdict)
   - Dashboard: pass/fail, defect types, confidence trend, drift indicator
2. Annotation overlay:
   - Render image on canvas, draw normalized bboxes; color by severity; tooltip/side panel synced.

**End of Phase 2:** run testing agent for 1 full E2E pass (create line → calibrate → inspect → history → dashboard).

---

### Phase 3 — Production hardening + Root-cause insights
**User stories (Phase 3)**
1. As a process engineer, I can see clusters of recurring defect types for a product line.
2. As a process engineer, I can see recurring defect locations (heat by quadrant) across time.
3. As a plant manager, I can see drift warnings when anomaly rate or uncertainty rises.
4. As a QA engineer, I can recalibrate by adding more good samples and tracking baseline versions.
5. As a QA engineer, I can export an inspection report (JSON/CSV) for audits.

**Steps**
1. Root-cause insights service:
   - Cluster by `defect_type` and bbox centroid buckets; compute top recurring patterns.
   - Generate “hint text” (rules-based) + optional Gemini summarization.
2. Drift detection:
   - Rolling windows over verdict rate + confidence distribution + uncertainty frequency.
3. Baseline versioning:
   - Store baseline versions; inspections reference baseline_version_id.
4. Reliability:
   - Timeouts, retries, request ids; store raw model response for debugging.
5. Testing agent: full regression pass.

---

### Phase 4 — Optional enhancements (only if requested)
**Candidates**: multi-view inspection, role-based access, edge deployment packaging, webhook/CSV integrations, active-learning workflow.

## 3. Next Actions
- [DONE] Phase 1 POC passed (Gemini schema-valid JSON, bboxes, PASS/FAIL correct).
- [DONE] Phase 2 built + tested end-to-end at 100% (backend 17/17, frontend 12/12).
- Phase 3 (future, on request): baseline versioning history UI, export report (CSV/JSON), multi-view, acoustic/vibration mode.

## 4. Success Criteria
- POC: Gemini returns **schema-valid JSON** with normalized bboxes and confidence on real images (with repair pass only rarely needed).
- V1: User can calibrate → inspect → see overlays → history persists → dashboard renders correctly.
- Insights: recurring defect clusters + drift indicator match inspection history trends.
- Stability: no broken states on invalid images; clear error UX; consistent end-to-end flow verified by testing agent.
