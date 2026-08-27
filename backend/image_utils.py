"""Image processing helpers: normalize uploads to bounded JPEG base64 (raw, no data URI)."""
import base64
import io
from PIL import Image, ImageDraw, ImageFilter
import random
import math


def process_upload(raw_bytes: bytes, max_size: int = 1024, quality: int = 88) -> str:
    """Open any supported image, take first frame if animated, convert RGB, bound size, return raw b64 JPEG."""
    img = Image.open(io.BytesIO(raw_bytes))
    try:
        if getattr(img, "is_animated", False):
            img.seek(0)
    except Exception:
        pass
    img = img.convert("RGB")
    img.thumbnail((max_size, max_size))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality)
    return base64.b64encode(buf.getvalue()).decode()


def make_thumb(b64: str, size: int = 320, quality: int = 80) -> str:
    """Downscale a raw b64 JPEG to a small thumbnail (raw b64)."""
    raw = base64.b64decode(b64)
    img = Image.open(io.BytesIO(raw)).convert("RGB")
    img.thumbnail((size, size))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=quality)
    return base64.b64encode(buf.getvalue()).decode()


# ---------------------------------------------------------------------------
# Synthetic demo part generator (for "Try with sample images").
# Produces a machined metal plate with brushed texture, center hub, 4 corner bolts.
# ---------------------------------------------------------------------------
_W, _H = 620, 620


def _brushed(draw, w, h):
    for y in range(h):
        base = 150 + int(30 * (y / h))
        draw.line([(0, y), (w, y)], fill=(base, base, base + 4))
    for _ in range(2400):
        x0 = random.randint(0, w)
        y0 = random.randint(0, h)
        length = random.randint(10, 55)
        shade = random.randint(-25, 25)
        c = max(0, min(255, 150 + shade))
        draw.line([(x0, y0), (x0 + length, y0)], fill=(c, c, c), width=1)


def _bolt(draw, cx, cy, r=32, present=True):
    if present:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(90, 92, 98), outline=(40, 42, 46), width=3)
        draw.ellipse([cx - r + 9, cy - r + 9, cx + r - 9, cy + r - 9], fill=(60, 62, 68))
        for a in range(6):
            ang = a * math.pi / 3
            x = cx + int((r - 4) * math.cos(ang))
            y = cy + int((r - 4) * math.sin(ang))
            draw.line([(cx, cy), (x, y)], fill=(45, 47, 52), width=2)
    else:
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=(30, 30, 34), outline=(20, 20, 22), width=3)


def generate_part(defect: str = None, seed: int = 0) -> str:
    random.seed(seed)
    img = Image.new("RGB", (_W, _H), (150, 150, 154))
    draw = ImageDraw.Draw(img)
    _brushed(draw, _W, _H)
    cx0, cy0 = _W // 2, _H // 2
    draw.ellipse([cx0 - 78, cy0 - 78, cx0 + 78, cy0 + 78], fill=(110, 112, 118), outline=(50, 52, 56), width=5)
    draw.ellipse([cx0 - 38, cy0 - 38, cx0 + 38, cy0 + 38], fill=(70, 72, 78), outline=(40, 42, 46), width=3)
    positions = [(115, 115), (_W - 115, 115), (115, _H - 115), (_W - 115, _H - 115)]
    missing = defect == "missing_bolt"
    for i, (cx, cy) in enumerate(positions):
        _bolt(draw, cx, cy, present=not (missing and i == 1))
    if defect == "scratch":
        draw.line([(175, 480), (450, 190)], fill=(235, 235, 240), width=5)
        draw.line([(177, 482), (452, 192)], fill=(210, 210, 215), width=2)
    elif defect == "crack":
        pts = [(300, 540), (320, 480), (300, 430), (330, 380), (315, 330)]
        draw.line(pts, fill=(20, 20, 22), width=4, joint="curve")
    elif defect == "dent":
        draw.ellipse([415, 415, 505, 505], fill=(120, 120, 126), outline=(70, 70, 74), width=2)
        draw.ellipse([435, 435, 485, 485], fill=(95, 95, 100))
    elif defect == "corrosion":
        for _ in range(380):
            x = random.randint(410, 540)
            y = random.randint(115, 250)
            rr = random.randint(2, 7)
            draw.ellipse([x, y, x + rr, y + rr], fill=(random.randint(120, 170), random.randint(70, 110), random.randint(30, 60)))
    img = img.filter(ImageFilter.GaussianBlur(0.4))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=88)
    return base64.b64encode(buf.getvalue()).decode()
