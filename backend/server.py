from fastapi import FastAPI, APIRouter, HTTPException, UploadFile, File
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel
from typing import List, Optional
import uuid
from datetime import datetime, timezone

import image_utils
import vision_service
import insights as insights_mod

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="LineSight QA")
api_router = APIRouter(prefix="/api")
logger = logging.getLogger(__name__)


# ------------------------------- helpers -----------------------------------
def now_iso():
    return datetime.now(timezone.utc).isoformat()


def line_public(doc: dict) -> dict:
    return {
        "id": doc["id"],
        "name": doc["name"],
        "description": doc.get("description", ""),
        "cover": doc.get("cover", ""),
        "created_at": doc["created_at"],
        "calibrated": bool(doc.get("baseline_profile")),
        "baseline_profile": doc.get("baseline_profile"),
        "baseline_images": doc.get("baseline_images", []),
        "baseline_updated_at": doc.get("baseline_updated_at"),
        "baseline_version": doc.get("baseline_version", 0),
        "inspection_count": doc.get("inspection_count", 0),
    }


def inspection_public(doc: dict, include_image: bool = True) -> dict:
    out = {
        "id": doc["id"],
        "product_line_id": doc["product_line_id"],
        "verdict": doc["verdict"],
        "confidence": doc["confidence"],
        "anomaly_score": doc.get("anomaly_score", 0),
        "summary": doc.get("summary", ""),
        "regions": doc.get("regions", []),
        "uncertainty_note": doc.get("uncertainty_note", ""),
        "thumb": doc.get("thumb", ""),
        "created_at": doc["created_at"],
        "baseline_version": doc.get("baseline_version", 0),
    }
    if include_image:
        out["image"] = doc.get("image", "")
    return out


# ------------------------------- models ------------------------------------
class ProductLineCreate(BaseModel):
    name: str
    description: Optional[str] = ""
    cover: Optional[str] = ""


# ------------------------------- routes ------------------------------------
@api_router.get("/")
async def root():
    return {"message": "LineSight QA API", "model": vision_service.MODEL}


@api_router.get("/samples")
async def get_samples():
    """Synthetic demo part images for quick trials (clearly labelled demo data)."""
    good = [image_utils.generate_part(None, seed=s) for s in (11, 12, 13)]
    defects = [
        {"type": "scratch", "image": image_utils.generate_part("scratch", seed=21)},
        {"type": "missing_bolt", "image": image_utils.generate_part("missing_bolt", seed=22)},
        {"type": "dent", "image": image_utils.generate_part("dent", seed=23)},
        {"type": "corrosion", "image": image_utils.generate_part("corrosion", seed=24)},
        {"type": "good", "image": image_utils.generate_part(None, seed=25)},
    ]
    return {"good": good, "defects": defects}


@api_router.post("/product-lines")
async def create_line(payload: ProductLineCreate):
    doc = {
        "id": str(uuid.uuid4()),
        "name": payload.name.strip() or "Untitled Line",
        "description": (payload.description or "").strip(),
        "cover": payload.cover or "",
        "created_at": now_iso(),
        "baseline_profile": None,
        "baseline_images": [],
        "baseline_updated_at": None,
        "baseline_version": 0,
        "inspection_count": 0,
    }
    await db.product_lines.insert_one(dict(doc))
    return line_public(doc)


@api_router.get("/product-lines")
async def list_lines():
    docs = await db.product_lines.find({}, {"_id": 0}).sort("created_at", -1).to_list(500)
    return [line_public(d) for d in docs]


@api_router.get("/product-lines/{line_id}")
async def get_line(line_id: str):
    doc = await db.product_lines.find_one({"id": line_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Product line not found")
    return line_public(doc)


@api_router.delete("/product-lines/{line_id}")
async def delete_line(line_id: str):
    res = await db.product_lines.delete_one({"id": line_id})
    if res.deleted_count == 0:
        raise HTTPException(404, "Product line not found")
    await db.inspections.delete_many({"product_line_id": line_id})
    await db.baseline_versions.delete_many({"product_line_id": line_id})
    return {"ok": True}


@api_router.post("/product-lines/{line_id}/calibrate")
async def calibrate(line_id: str, files: List[UploadFile] = File(...)):
    doc = await db.product_lines.find_one({"id": line_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Product line not found")
    if not files:
        raise HTTPException(400, "Upload at least one good reference image")

    b64_full, thumbs = [], []
    for f in files:
        raw = await f.read()
        if not raw:
            continue
        try:
            full = image_utils.process_upload(raw)
        except Exception as e:
            raise HTTPException(400, f"Could not read image '{f.filename}': {e}")
        b64_full.append(full)
        thumbs.append(image_utils.make_thumb(full))

    if not b64_full:
        raise HTTPException(400, "No valid images provided")

    try:
        profile = await vision_service.build_baseline(b64_full[:5])
    except Exception as e:
        logger.exception("baseline build failed")
        raise HTTPException(502, f"Calibration failed: {e}")

    # New version number = max existing + 1 (so rollback then recalibrate never collides)
    existing = await db.baseline_versions.find({"product_line_id": line_id}, {"_id": 0, "version": 1}).to_list(1000)
    max_v = max([v["version"] for v in existing], default=doc.get("baseline_version", 0))
    version = max_v + 1
    ts = now_iso()

    version_doc = {
        "id": str(uuid.uuid4()),
        "product_line_id": line_id,
        "version": version,
        "profile": profile,
        "images": thumbs[:8],
        "sample_count": len(b64_full),
        "created_at": ts,
    }
    await db.baseline_versions.insert_one(dict(version_doc))

    update = {
        "baseline_profile": profile,
        "baseline_images": thumbs[:8],
        "baseline_updated_at": ts,
        "baseline_version": version,
    }
    if not doc.get("cover") and thumbs:
        update["cover"] = thumbs[0]
    await db.product_lines.update_one({"id": line_id}, {"$set": update})
    merged = {**doc, **update}
    return line_public(merged)


async def _backfill_versions(line: dict):
    """Older lines calibrated before versioning: create a v-record from current baseline."""
    if not line.get("baseline_profile"):
        return
    count = await db.baseline_versions.count_documents({"product_line_id": line["id"]})
    if count > 0:
        return
    v = line.get("baseline_version", 1) or 1
    await db.baseline_versions.insert_one({
        "id": str(uuid.uuid4()),
        "product_line_id": line["id"],
        "version": v,
        "profile": line.get("baseline_profile"),
        "images": line.get("baseline_images", []),
        "sample_count": len(line.get("baseline_images", []) or []),
        "created_at": line.get("baseline_updated_at") or line.get("created_at"),
    })


@api_router.get("/product-lines/{line_id}/baseline-versions")
async def list_baseline_versions(line_id: str):
    line = await db.product_lines.find_one({"id": line_id}, {"_id": 0})
    if not line:
        raise HTTPException(404, "Product line not found")
    await _backfill_versions(line)
    versions = await db.baseline_versions.find({"product_line_id": line_id}, {"_id": 0}).sort("version", -1).to_list(1000)
    active = line.get("baseline_version", 0)
    out = []
    for v in versions:
        used = await db.inspections.count_documents({"product_line_id": line_id, "baseline_version": v["version"]})
        prof = v.get("profile") or {}
        out.append({
            "id": v["id"],
            "version": v["version"],
            "created_at": v["created_at"],
            "images": v.get("images", []),
            "sample_count": v.get("sample_count", 0),
            "part_summary": prof.get("part_summary", ""),
            "component_count": len(prof.get("expected_components", []) or []),
            "inspections_used": used,
            "active": v["version"] == active,
        })
    return {"active_version": active, "versions": out}


@api_router.post("/product-lines/{line_id}/baseline-versions/{version}/activate")
async def activate_baseline_version(line_id: str, version: int):
    line = await db.product_lines.find_one({"id": line_id}, {"_id": 0})
    if not line:
        raise HTTPException(404, "Product line not found")
    v = await db.baseline_versions.find_one({"product_line_id": line_id, "version": version}, {"_id": 0})
    if not v:
        raise HTTPException(404, "Baseline version not found")
    update = {
        "baseline_profile": v.get("profile"),
        "baseline_images": v.get("images", []),
        "baseline_version": version,
        "baseline_updated_at": now_iso(),
    }
    await db.product_lines.update_one({"id": line_id}, {"$set": update})
    return line_public({**line, **update})


@api_router.post("/product-lines/{line_id}/inspect")
async def inspect(line_id: str, file: UploadFile = File(...)):
    doc = await db.product_lines.find_one({"id": line_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Product line not found")
    if not doc.get("baseline_profile"):
        raise HTTPException(400, "This line is not calibrated yet. Upload good reference images first.")

    raw = await file.read()
    if not raw:
        raise HTTPException(400, "Empty file")
    try:
        full = image_utils.process_upload(raw)
    except Exception as e:
        raise HTTPException(400, f"Could not read image: {e}")

    try:
        analysis = await vision_service.inspect_image(doc["baseline_profile"], full)
    except Exception as e:
        logger.exception("inspection failed")
        raise HTTPException(502, f"Inspection failed: {e}")

    thumb = image_utils.make_thumb(full)
    insp = {
        "id": str(uuid.uuid4()),
        "product_line_id": line_id,
        "verdict": analysis["verdict"],
        "confidence": analysis["confidence"],
        "anomaly_score": analysis["anomaly_score"],
        "summary": analysis["summary"],
        "regions": analysis["regions"],
        "uncertainty_note": analysis["uncertainty_note"],
        "image": full,
        "thumb": thumb,
        "baseline_version": doc.get("baseline_version", 0),
        "created_at": now_iso(),
    }
    await db.inspections.insert_one(dict(insp))
    await db.product_lines.update_one({"id": line_id}, {"$inc": {"inspection_count": 1}})
    return inspection_public(insp, include_image=True)


@api_router.get("/product-lines/{line_id}/inspections")
async def list_inspections(line_id: str, verdict: Optional[str] = None, limit: int = 200):
    q = {"product_line_id": line_id}
    if verdict and verdict.upper() in ("PASS", "FAIL", "UNCERTAIN"):
        q["verdict"] = verdict.upper()
    docs = await db.inspections.find(q, {"_id": 0, "image": 0}).sort("created_at", -1).to_list(limit)
    return [inspection_public(d, include_image=False) for d in docs]


@api_router.get("/inspections/{inspection_id}")
async def get_inspection(inspection_id: str):
    doc = await db.inspections.find_one({"id": inspection_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Inspection not found")
    line = await db.product_lines.find_one({"id": doc["product_line_id"]}, {"_id": 0})
    out = inspection_public(doc, include_image=True)
    out["line_name"] = line["name"] if line else "Unknown line"
    return out


@api_router.delete("/inspections/{inspection_id}")
async def delete_inspection(inspection_id: str):
    doc = await db.inspections.find_one({"id": inspection_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Inspection not found")
    await db.inspections.delete_one({"id": inspection_id})
    await db.product_lines.update_one({"id": doc["product_line_id"]}, {"$inc": {"inspection_count": -1}})
    return {"ok": True}


@api_router.get("/product-lines/{line_id}/dashboard")
async def line_dashboard(line_id: str):
    doc = await db.product_lines.find_one({"id": line_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Product line not found")
    docs = await db.inspections.find({"product_line_id": line_id}, {"_id": 0, "image": 0}).sort("created_at", 1).to_list(1000)
    return insights_mod.build_dashboard(docs)


@api_router.get("/product-lines/{line_id}/insights")
async def line_insights(line_id: str):
    doc = await db.product_lines.find_one({"id": line_id}, {"_id": 0})
    if not doc:
        raise HTTPException(404, "Product line not found")
    docs = await db.inspections.find({"product_line_id": line_id}, {"_id": 0, "image": 0}).sort("created_at", 1).to_list(1000)
    return insights_mod.build_insights(docs)


@api_router.get("/overview")
async def overview():
    lines = await db.product_lines.find({}, {"_id": 0}).to_list(500)
    all_insp = await db.inspections.find({}, {"_id": 0, "image": 0}).sort("created_at", -1).to_list(2000)
    total = len(all_insp)
    passed = sum(1 for i in all_insp if i["verdict"] == "PASS")
    failed = sum(1 for i in all_insp if i["verdict"] == "FAIL")
    uncertain = sum(1 for i in all_insp if i["verdict"] == "UNCERTAIN")
    recent = [inspection_public(i, include_image=False) for i in all_insp[:8]]
    line_map = {l["id"]: l["name"] for l in lines}
    for r in recent:
        r["line_name"] = line_map.get(r["product_line_id"], "Unknown line")
    return {
        "lines_count": len(lines),
        "calibrated_count": sum(1 for l in lines if l.get("baseline_profile")),
        "total_inspections": total,
        "pass": passed,
        "fail": failed,
        "uncertain": uncertain,
        "pass_rate": round(passed / total * 100, 1) if total else 0,
        "recent": recent,
    }


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
