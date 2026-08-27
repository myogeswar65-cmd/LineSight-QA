"""Aggregation for dashboard stats, drift detection, and root-cause insights."""
from collections import Counter


GRID_LABELS = [
    ["top-left", "top-center", "top-right"],
    ["middle-left", "center", "middle-right"],
    ["bottom-left", "bottom-center", "bottom-right"],
]


def _cell(bbox):
    x, y, w, h = bbox
    cx = min(max(x + w / 2, 0), 0.999)
    cy = min(max(y + h / 2, 0), 0.999)
    col = int(cx * 3)
    row = int(cy * 3)
    return GRID_LABELS[row][col]


def build_dashboard(inspections):
    total = len(inspections)
    passed = sum(1 for i in inspections if i["verdict"] == "PASS")
    failed = sum(1 for i in inspections if i["verdict"] == "FAIL")
    uncertain = sum(1 for i in inspections if i["verdict"] == "UNCERTAIN")

    # confidence + anomaly trend (chronological)
    trend = []
    for idx, i in enumerate(inspections):
        trend.append({
            "index": idx + 1,
            "created_at": i["created_at"],
            "confidence": round(i.get("confidence", 0) * 100, 1),
            "anomaly": round(i.get("anomaly_score", 0) * 100, 1),
            "verdict": i["verdict"],
        })

    # defect type distribution
    type_counter = Counter()
    for i in inspections:
        for r in i.get("regions", []):
            type_counter[r.get("defect_type", "anomaly")] += 1
    defect_distribution = [
        {"type": t, "count": c} for t, c in type_counter.most_common(10)
    ]

    drift = _drift(inspections)

    return {
        "total": total,
        "pass": passed,
        "fail": failed,
        "uncertain": uncertain,
        "pass_rate": round(passed / total * 100, 1) if total else 0,
        "fail_rate": round(failed / total * 100, 1) if total else 0,
        "avg_confidence": round(sum(i.get("confidence", 0) for i in inspections) / total * 100, 1) if total else 0,
        "trend": trend,
        "defect_distribution": defect_distribution,
        "drift": drift,
    }


def _drift(inspections):
    """Compare recent window fail-rate vs earlier window to flag distribution drift."""
    n = len(inspections)
    if n < 6:
        return {
            "state": "stable",
            "label": "Insufficient data",
            "detail": f"Need at least 6 inspections to assess drift ({n} so far).",
            "recent_fail_rate": 0,
            "prev_fail_rate": 0,
            "delta": 0,
        }
    half = n // 2
    prev = inspections[:half]
    recent = inspections[half:]

    def frate(group):
        bad = sum(1 for i in group if i["verdict"] in ("FAIL", "UNCERTAIN"))
        return bad / len(group) if group else 0

    prev_r = frate(prev)
    recent_r = frate(recent)
    delta = recent_r - prev_r

    if delta >= 0.35 or (recent_r >= 0.6 and delta >= 0.2):
        state, label = "high", "Drift: High"
        detail = "Anomaly rate is rising sharply — the production process may have shifted. Investigate immediately."
    elif delta >= 0.15:
        state, label = "watch", "Drift: Watch"
        detail = "Anomaly rate is trending upward. Monitor closely and consider recalibrating the baseline."
    else:
        state, label = "stable", "Drift: Stable"
        detail = "Anomaly rate is stable relative to earlier inspections."

    return {
        "state": state,
        "label": label,
        "detail": detail,
        "recent_fail_rate": round(recent_r * 100, 1),
        "prev_fail_rate": round(prev_r * 100, 1),
        "delta": round(delta * 100, 1),
    }


def build_insights(inspections):
    type_counter = Counter()
    loc_counter = Counter()
    type_loc = {}  # defect_type -> Counter of locations
    severity_by_type = {}

    for i in inspections:
        for r in i.get("regions", []):
            t = r.get("defect_type", "anomaly")
            loc = _cell(r.get("bbox", [0, 0, 0, 0]))
            type_counter[t] += 1
            loc_counter[loc] += 1
            type_loc.setdefault(t, Counter())[loc] += 1
            severity_by_type.setdefault(t, []).append(r.get("severity", 0))

    clusters = []
    for t, c in type_counter.most_common(8):
        locs = type_loc.get(t, Counter())
        top_loc, top_loc_c = (locs.most_common(1)[0] if locs else ("unknown", 0))
        sev = severity_by_type.get(t, [0])
        avg_sev = round(sum(sev) / len(sev) * 100) if sev else 0
        clusters.append({
            "defect_type": t,
            "count": c,
            "top_location": top_loc,
            "top_location_count": top_loc_c,
            "avg_severity": avg_sev,
        })

    hints = _hints(type_counter, loc_counter, type_loc, len(inspections))

    return {
        "total_defects": sum(type_counter.values()),
        "clusters": clusters,
        "location_distribution": [{"location": l, "count": c} for l, c in loc_counter.most_common(9)],
        "hints": hints,
    }


def _hints(type_counter, loc_counter, type_loc, n_inspections):
    hints = []
    if not type_counter:
        return hints
    # recurring defect type
    top_type, top_c = type_counter.most_common(1)[0]
    if top_c >= 2:
        locs = type_loc.get(top_type, Counter())
        loc_txt = ""
        if locs:
            tl, tlc = locs.most_common(1)[0]
            if tlc >= 2:
                loc_txt = f" concentrated in the {tl} region"
        hints.append({
            "severity": "high" if top_c >= 4 else "medium",
            "title": f"Recurring {top_type} defects",
            "text": f"'{top_type}' has appeared {top_c} times{loc_txt}. This points to a systematic cause "
                    f"(tooling wear, fixture misalignment, or material issue) rather than random variation.",
        })
    # recurring location across types
    if loc_counter:
        tl, tlc = loc_counter.most_common(1)[0]
        if tlc >= 3:
            hints.append({
                "severity": "medium",
                "title": f"Defects cluster in {tl}",
                "text": f"{tlc} defects localize to the {tl} region of the part. Inspect the corresponding "
                        f"station, fixture, or handling step for that area.",
            })
    if not hints:
        hints.append({
            "severity": "low",
            "title": "No systematic pattern yet",
            "text": "Detected defects are varied with no strong recurring type or location. Keep inspecting to build a clearer picture.",
        })
    return hints
