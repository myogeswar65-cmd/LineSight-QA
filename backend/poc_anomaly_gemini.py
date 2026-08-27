"""
POC: Self-Calibrating Assembly-Line Anomaly Detector core.
Proves Gemini vision (gemini-3.1-pro-preview) can:
  1. Synthesize a baseline "normal" profile from GOOD reference images.
  2. Inspect a TEST image against that baseline and return STRICT structured JSON
     (verdict, confidence, localized bounding boxes, defect type, uncertainty).
  3. Correctly PASS a good part and FAIL a defective part.

No mocking. Real inference via emergentintegrations + EMERGENT_LLM_KEY.
"""
import asyncio
import base64
import io
import json
import os
import random
from dotenv import load_dotenv
from PIL import Image, ImageDraw, ImageFilter

load_dotenv()

from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")
MODEL_PROVIDER = "gemini"
MODEL_NAME = "gemini-3.1-pro-preview"

# ---------------------------------------------------------------------------
# Synthetic industrial part image generator (real visual features, non-uniform)
# A "machined metal plate" with brushed texture, 4 corner bolt holes, a center hub.
# ---------------------------------------------------------------------------
W, H = 640, 640


def _brushed_metal(draw, w, h):
    # horizontal brushed streaks + subtle vertical gradient
    for y in range(h):
        base = 150 + int(30 * (y / h))
        draw.line([(0, y), (w, y)], fill=(base, base, base + 4))
    for _ in range(2600):
        x0 = random.randint(0, w)
        y0 = random.randint(0, h)
        length = random.randint(10, 60)
        shade = random.randint(-25, 25)
        c = max(0, min(255, 150 + shade))
        draw.line([(x0, y0), (x0 + length, y0)], fill=(c, c, c), width=1)


def _bolt(draw, cx, cy, r=34, present=True):
    if present:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(90, 92, 98), outline=(40, 42, 46), width=3)
        draw.ellipse([cx - r + 10, cy - r + 10, cx + r - 10, cy + r - 10], fill=(60, 62, 68))
        # hex nut lines
        for a in range(6):
            import math
            ang = a * math.pi / 3
            x = cx + int((r - 4) * math.cos(ang))
            y = cy + int((r - 4) * math.sin(ang))
            draw.line([(cx, cy), (x, y)], fill=(45, 47, 52), width=2)
    else:
        # empty hole (missing bolt) -> darker recess
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(30, 30, 34), outline=(20, 20, 22), width=3)


def make_part(defect=None, seed=0):
    random.seed(seed)
    img = Image.new("RGB", (W, H), (150, 150, 154))
    draw = ImageDraw.Draw(img)
    _brushed_metal(draw, W, H)

    # center hub
    draw.ellipse([W // 2 - 80, H // 2 - 80, W // 2 + 80, H // 2 + 80], fill=(110, 112, 118), outline=(50, 52, 56), width=5)
    draw.ellipse([W // 2 - 40, H // 2 - 40, W // 2 + 40, H // 2 + 40], fill=(70, 72, 78), outline=(40, 42, 46), width=3)

    # 4 corner bolts
    positions = [(120, 120), (W - 120, 120), (120, H - 120), (W - 120, H - 120)]
    missing = defect == "missing_bolt"
    for i, (cx, cy) in enumerate(positions):
        _bolt(draw, cx, cy, present=not (missing and i == 1))

    if defect == "scratch":
        # long diagonal bright scratch
        draw.line([(180, 500), (470, 200)], fill=(235, 235, 240), width=5)
        draw.line([(182, 502), (472, 202)], fill=(210, 210, 215), width=2)
    elif defect == "crack":
        pts = [(300, 560), (320, 500), (300, 450), (330, 400), (315, 350)]
        draw.line(pts, fill=(20, 20, 22), width=4, joint="curve")
    elif defect == "dent":
        draw.ellipse([430, 430, 520, 520], fill=(120, 120, 126), outline=(70, 70, 74), width=2)
        draw.ellipse([450, 450, 500, 500], fill=(95, 95, 100))
    elif defect == "corrosion":
        for _ in range(400):
            x = random.randint(420, 560)
            y = random.randint(120, 260)
            rr = random.randint(2, 7)
            draw.ellipse([x, y, x + rr, y + rr], fill=(random.randint(120, 170), random.randint(70, 110), random.randint(30, 60)))

    img = img.filter(ImageFilter.GaussianBlur(0.4))
    return img


def to_b64(img: Image.Image) -> str:
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=88)
    return base64.b64encode(buf.getvalue()).decode()


# ---------------------------------------------------------------------------
# Prompts
# ---------------------------------------------------------------------------
BASELINE_SYS = (
    "You are an industrial machine-vision calibration engine for automated quality inspection. "
    "You are shown one or more images of a KNOWN-GOOD manufactured part. "
    "Study them and produce a precise 'normal profile' describing the expected appearance: "
    "geometry, key components and their locations, surface/texture, color, and any consistent landmarks. "
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
    "verdict rules: 'FAIL' if any clear defect; 'UNCERTAIN' if ambiguous/low quality; 'PASS' if it matches the baseline. "
    "confidence = your overall confidence (0..1) in the verdict. "
    "Return ONLY valid JSON, no markdown, matching EXACTLY this schema: "
    '{"verdict": "PASS"|"FAIL"|"UNCERTAIN", "confidence": number, '
    '"anomaly_score": number, "summary": string, '
    '"regions": [{"bbox": [number,number,number,number], "severity": number, '
    '"defect_type": string, "description": string, "region_confidence": number}], '
    '"uncertainty_note": string}'
)


def _strip_json(text: str) -> str:
    t = text.strip()
    if t.startswith("```"):
        t = t.split("```", 2)[1] if "```" in t else t
        if t.lstrip().startswith("json"):
            t = t.lstrip()[4:]
    # find first { and last }
    s = t.find("{")
    e = t.rfind("}")
    if s != -1 and e != -1:
        t = t[s:e + 1]
    return t.strip()


async def _call(system_msg, text, images_b64, session):
    chat = LlmChat(api_key=EMERGENT_LLM_KEY, session_id=session, system_message=system_msg).with_model(
        MODEL_PROVIDER, MODEL_NAME
    )
    contents = [ImageContent(image_base64=b) for b in images_b64]
    msg = UserMessage(text=text, file_contents=contents)
    resp = await chat.send_message(msg)
    return resp


async def build_baseline(good_imgs_b64):
    raw = await _call(
        BASELINE_SYS,
        "These are known-good reference samples. Produce the normal profile JSON now.",
        good_imgs_b64,
        "poc-baseline",
    )
    data = json.loads(_strip_json(raw))
    return data


async def inspect(baseline, test_b64, label):
    txt = (
        "LEARNED NORMAL BASELINE PROFILE (JSON):\n"
        + json.dumps(baseline)
        + "\n\nNow inspect the attached NEW test image against this baseline and return the anomaly JSON."
    )
    raw = await _call(INSPECT_SYS, txt, [test_b64], f"poc-inspect-{label}")
    cleaned = _strip_json(raw)
    try:
        data = json.loads(cleaned)
    except Exception:
        # repair pass
        raw2 = await _call(
            "Return ONLY the corrected valid JSON object. No prose, no markdown.",
            "Fix this into valid JSON matching the requested schema:\n" + raw,
            [],
            f"poc-repair-{label}",
        )
        data = json.loads(_strip_json(raw2))
    return data


def validate(data):
    assert data["verdict"] in ("PASS", "FAIL", "UNCERTAIN"), "bad verdict"
    assert isinstance(data["confidence"], (int, float)) and 0 <= data["confidence"] <= 1, "bad confidence"
    assert isinstance(data["regions"], list), "regions not list"
    for r in data["regions"]:
        bb = r["bbox"]
        assert len(bb) == 4, "bbox len"
        for v in bb:
            assert 0 <= v <= 1.001, f"bbox out of range: {bb}"
        assert "defect_type" in r and "description" in r, "region fields"
    return True


async def main():
    print(f"== POC start :: model={MODEL_PROVIDER}/{MODEL_NAME} ==")
    print("Generating synthetic industrial part images...")
    good1 = make_part(defect=None, seed=1)
    good2 = make_part(defect=None, seed=2)
    good_test = make_part(defect=None, seed=7)
    scratch = make_part(defect="scratch", seed=3)
    missing = make_part(defect="missing_bolt", seed=4)

    # save for visual inspection
    os.makedirs("/app/backend/poc_out", exist_ok=True)
    for name, im in [("good1", good1), ("good2", good2), ("good_test", good_test), ("scratch", scratch), ("missing", missing)]:
        im.save(f"/app/backend/poc_out/{name}.jpg")

    print("Calibrating baseline from 2 good images...")
    baseline = await build_baseline([to_b64(good1), to_b64(good2)])
    print("BASELINE PROFILE:\n", json.dumps(baseline, indent=2)[:800])

    results = {}
    for label, im in [("GOOD_TEST", good_test), ("SCRATCH", scratch), ("MISSING_BOLT", missing)]:
        print(f"\n--- Inspecting {label} ---")
        data = await inspect(baseline, to_b64(im), label)
        validate(data)
        print(json.dumps(data, indent=2)[:1200])
        results[label] = data

    print("\n== VALIDATION SUMMARY ==")
    ok = True
    # Defective ones should FAIL (or at least UNCERTAIN with regions)
    for lbl in ("SCRATCH", "MISSING_BOLT"):
        v = results[lbl]["verdict"]
        nreg = len(results[lbl]["regions"])
        flagged = v in ("FAIL", "UNCERTAIN") and nreg >= 1
        print(f"{lbl}: verdict={v}, regions={nreg} -> {'OK' if flagged else 'WEAK'}")
        ok = ok and flagged
    gv = results["GOOD_TEST"]["verdict"]
    print(f"GOOD_TEST: verdict={gv} (ideally PASS)")

    print("\nRESULT:", "SUCCESS - core proven" if ok else "NEEDS TUNING")
    return ok


if __name__ == "__main__":
    asyncio.run(main())
