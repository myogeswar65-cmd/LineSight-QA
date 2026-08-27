"""Gemini vision service for self-calibrating anomaly detection (real inference)."""
import json
import logging
import os
import uuid

from dotenv import load_dotenv

load_dotenv()

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

logger = logging.getLogger(__name__)

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
PROVIDER = "gemini"
MODEL = "gemini-3.1-pro-preview"

BASELINE_SYS = (
    "You are an industrial machine-vision calibration engine for automated quality inspection. "
    "You are shown one or more images of a KNOWN-GOOD manufactured part. "
    "Study them and produce a precise 'normal profile' describing the expected appearance: "
    "geometry, key components and their locations, surface/texture, color, and consistent landmarks. "
    "This profile will later be used to detect deviations (defects) on new samples of the SAME part. "
    "Return ONLY valid JSON, no markdown, matching exactly: "
    '{"part_summary": string, "expected_components": [string], "surface_texture": string, '
    '"color_profile": string, "landmarks": [string], "notes": string}'
)

INSPECT_SYS = (
    "You are an industrial machine-vision anomaly-inspection engine. You are given (A) a learned NORMAL "
    "baseline profile of a known-good part (as JSON text) and (B) a NEW test image of the same part type. "
    "Compare the test image against the baseline and detect ANY anomalies/defects (scratches, cracks, dents, "
    "missing components, corrosion, contamination, misalignment, discoloration). "
    "Use a normalized coordinate system where the top-left of the image is (0,0) and bottom-right is (1,1). "
    "For every anomaly, give a bounding box bbox=[x,y,w,h] with all values between 0 and 1. "
    "verdict rules: 'FAIL' if any clear defect; 'UNCERTAIN' if ambiguous or low image quality; "
    "'PASS' if it matches the baseline with no defects. "
    "confidence = your overall confidence (0..1) in the verdict. "
    "anomaly_score = overall severity of deviation from normal (0..1, 0 = perfect match). "
    "defect_type should be a short lowercase category like 'scratch', 'crack', 'dent', 'missing component', "
    "'corrosion', 'contamination', 'misalignment', 'discoloration'. "
    "Return ONLY valid JSON, no markdown, matching EXACTLY this schema: "
    '{"verdict": "PASS"|"FAIL"|"UNCERTAIN", "confidence": number, '
    '"anomaly_score": number, "summary": string, '
    '"regions": [{"bbox": [number,number,number,number], "severity": number, '
    '"defect_type": string, "description": string, "region_confidence": number}], '
    '"uncertainty_note": string}'
)


def _strip_json(text: str) -> str:
    t = (text or "").strip()
    if t.startswith("```"):
        parts = t.split("```")
        if len(parts) >= 2:
            t = parts[1]
        if t.lstrip().lower().startswith("json"):
            t = t.lstrip()[4:]
    s = t.find("{")
    e = t.rfind("}")
    if s != -1 and e != -1:
        t = t[s:e + 1]
    return t.strip()


async def _call(system_msg: str, text: str, images_b64):
    if not EMERGENT_LLM_KEY:
        raise RuntimeError("EMERGENT_LLM_KEY is not configured")
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=str(uuid.uuid4()),
        system_message=system_msg,
    ).with_model(PROVIDER, MODEL)
    contents = [ImageContent(image_base64=b) for b in (images_b64 or [])]
    msg = UserMessage(text=text, file_contents=contents)
    return await chat.send_message(msg)


async def build_baseline(good_b64_list):
    raw = await _call(
        BASELINE_SYS,
        "These are known-good reference samples of the same part. Produce the normal profile JSON now.",
        good_b64_list,
    )
    try:
        return json.loads(_strip_json(raw))
    except Exception as e:
        logger.warning("baseline json parse failed: %s", e)
        raw2 = await _call(
            "Return ONLY the corrected valid JSON object. No prose, no markdown.",
            "Fix this into valid JSON with keys part_summary, expected_components, surface_texture, "
            "color_profile, landmarks, notes:\n" + (raw or ""),
            [],
        )
        return json.loads(_strip_json(raw2))


def _sanitize(data: dict) -> dict:
    verdict = str(data.get("verdict", "UNCERTAIN")).upper()
    if verdict not in ("PASS", "FAIL", "UNCERTAIN"):
        verdict = "UNCERTAIN"

    def _num(v, lo=0.0, hi=1.0, default=0.0):
        try:
            f = float(v)
        except Exception:
            return default
        return max(lo, min(hi, f))

    regions = []
    for r in (data.get("regions") or []):
        bb = r.get("bbox") or [0, 0, 0, 0]
        if not isinstance(bb, list) or len(bb) != 4:
            continue
        bb = [_num(x) for x in bb]
        regions.append({
            "bbox": bb,
            "severity": _num(r.get("severity"), default=0.5),
            "defect_type": str(r.get("defect_type", "anomaly")).lower().strip() or "anomaly",
            "description": str(r.get("description", "")).strip(),
            "region_confidence": _num(r.get("region_confidence"), default=0.5),
        })
    return {
        "verdict": verdict,
        "confidence": _num(data.get("confidence"), default=0.5),
        "anomaly_score": _num(data.get("anomaly_score"), default=(0.0 if verdict == "PASS" else 0.5)),
        "summary": str(data.get("summary", "")).strip(),
        "regions": regions,
        "uncertainty_note": str(data.get("uncertainty_note", "")).strip(),
    }


async def inspect_image(baseline: dict, test_b64: str) -> dict:
    text = (
        "LEARNED NORMAL BASELINE PROFILE (JSON):\n"
        + json.dumps(baseline)
        + "\n\nNow inspect the attached NEW test image against this baseline and return the anomaly JSON."
    )
    raw = await _call(INSPECT_SYS, text, [test_b64])
    cleaned = _strip_json(raw)
    try:
        data = json.loads(cleaned)
    except Exception:
        raw2 = await _call(
            "Return ONLY the corrected valid JSON object. No prose, no markdown.",
            "Fix this into valid JSON matching the inspection schema (verdict, confidence, anomaly_score, "
            "summary, regions[], uncertainty_note):\n" + (raw or ""),
            [],
        )
        data = json.loads(_strip_json(raw2))
    return _sanitize(data)
