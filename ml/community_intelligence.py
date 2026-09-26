"""
Phase 5 — Community Intelligence Engine

Turns verified (and pending) human reports into per-road safety bias
that modulates XGBoost / rule edge weights — without changing A*.

Pipeline:
  community_reports.csv
        ↓  snap to nearest road centroid
  community_bias.json   { road_id: delta_0_to_40 }
        ↓  applied in ml.predict.apply_safety_to_graph
  effective_safety = clamp(base_safety − bias, 0, 100)

  python -m ml.community_intelligence
"""
from __future__ import annotations

import json
import math
import time
from pathlib import Path
from typing import Any

import numpy as np
import pandas as pd
from sklearn.neighbors import BallTree

ML_DIR = Path(__file__).resolve().parent
PROCESSED = ML_DIR.parent / "data" / "processed"
REPORTS_CSV = PROCESSED / "community_reports.csv"
SCORES_CSV = PROCESSED / "road_safety_scores.csv"
BIAS_JSON = PROCESSED / "community_bias.json"
GEOHASH_JSON = PROCESSED / "community_geohash_agg.json"

# Max points subtracted from a road's safety score
MAX_BIAS = 40.0
# Influence radius when snapping reports → roads (metres)
SNAP_M = 120.0
EARTH_R = 6371000.0


def _haversine_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dphi = math.radians(lat2 - lat1)
    dl = math.radians(lon2 - lon1)
    a = math.sin(dphi / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_R * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def report_weight(
    trust_score: float = 50.0,
    age_days: float = 0.0,
    verified: bool = False,
) -> float:
    """Mirror core/trust.ts weightedReportContribution (simplified levels)."""
    if trust_score <= 20:
        level_w = 0.0
    elif trust_score <= 40:
        level_w = 0.25
    elif trust_score <= 60:
        level_w = 0.6
    elif trust_score <= 80:
        level_w = 1.0
    else:
        level_w = 1.4
    recency = 0.5 ** (max(0.0, age_days) / 90.0)
    verified_boost = 1.5 if verified else 1.0
    return level_w * recency * verified_boost


def severity_risk(severity: float) -> float:
    """Map severity 1–5 → risk contribution in [0, 1]."""
    return max(0.0, min(1.0, (float(severity) - 1.0) / 4.0))


def ensure_seed_reports(path: Path = REPORTS_CSV) -> Path:
    """Create a small Mumbai seed if no community reports exist yet."""
    if path.exists() and path.stat().st_size > 40:
        return path
    path.parent.mkdir(parents=True, exist_ok=True)
    now = int(time.time() * 1000)
    day = 86_400_000
    # Cluster around Andheri / Bandra corridors used in Phase 3 demos
    rows = [
        {
            "report_id": "seed-1",
            "latitude": 19.1195,
            "longitude": 72.8465,
            "category": "lighting",
            "severity": 4,
            "status": "verified",
            "trust_score": 70,
            "created_at_ms": now - 2 * day,
            "note": "Poor street lighting after 9pm",
        },
        {
            "report_id": "seed-2",
            "latitude": 19.1188,
            "longitude": 72.8472,
            "category": "harassment",
            "severity": 5,
            "status": "verified",
            "trust_score": 75,
            "created_at_ms": now - 5 * day,
            "note": "Verbal harassment near junction",
        },
        {
            "report_id": "seed-3",
            "latitude": 19.0901,
            "longitude": 72.8368,
            "category": "crime",
            "severity": 4,
            "status": "verified",
            "trust_score": 65,
            "created_at_ms": now - 10 * day,
            "note": "Phone snatching reported",
        },
        {
            "report_id": "seed-4",
            "latitude": 19.0598,
            "longitude": 72.8292,
            "category": "lighting",
            "severity": 3,
            "status": "pending",
            "trust_score": 55,
            "created_at_ms": now - 1 * day,
            "note": "Dim stretch near station approach",
        },
        {
            "report_id": "seed-5",
            "latitude": 19.1130,
            "longitude": 72.8690,
            "category": "infrastructure",
            "severity": 3,
            "status": "verified",
            "trust_score": 60,
            "created_at_ms": now - 7 * day,
            "note": "Broken pavement, trip hazard",
        },
        {
            "report_id": "seed-6",
            "latitude": 19.0175,
            "longitude": 72.8475,
            "category": "crime",
            "severity": 4,
            "status": "verified",
            "trust_score": 80,
            "created_at_ms": now - 3 * day,
            "note": "Unsafe after dark — multiple reports",
        },
    ]
    pd.DataFrame(rows).to_csv(path, index=False)
    print(f"  seeded {len(rows)} demo reports → {path}", flush=True)
    return path


def build_community_bias(
    reports_path: Path = REPORTS_CSV,
    scores_path: Path = SCORES_CSV,
    bias_path: Path = BIAS_JSON,
    geohash_path: Path = GEOHASH_JSON,
) -> dict[str, Any]:
    t0 = time.time()
    ensure_seed_reports(reports_path)
    reports = pd.read_csv(reports_path)
    if reports.empty:
        raise RuntimeError("No community reports to aggregate")

    required = {"latitude", "longitude", "severity"}
    missing = required - set(reports.columns)
    if missing:
        raise ValueError(f"community_reports.csv missing {missing}")

    scores = pd.read_csv(scores_path, dtype={"road_id": str})
    road_xy = np.radians(scores[["latitude", "longitude"]].astype(float).values)
    tree = BallTree(road_xy, metric="haversine")
    road_ids = scores["road_id"].astype(str).values

    now_ms = int(time.time() * 1000)
    bias_acc: dict[str, float] = {}
    geohash_acc: dict[str, dict[str, float]] = {}

    used = 0
    for _, row in reports.iterrows():
        status = str(row.get("status", "pending")).lower()
        if status in ("rejected", "expired", "spam"):
            continue
        lat, lon = float(row["latitude"]), float(row["longitude"])
        severity = float(row["severity"])
        trust = float(row.get("trust_score", 50) or 50)
        created = float(row.get("created_at_ms", now_ms) or now_ms)
        age_days = max(0.0, (now_ms - created) / 86_400_000.0)
        verified = status == "verified"
        w = report_weight(trust, age_days, verified)
        if w <= 0:
            continue

        # Snap to nearest road
        dist, idx = tree.query(np.radians([[lat, lon]]), k=1)
        dist_m = float(dist[0][0]) * EARTH_R
        if dist_m > SNAP_M:
            continue
        rid = str(road_ids[int(idx[0][0])])
        delta = w * severity_risk(severity) * MAX_BIAS
        bias_acc[rid] = min(MAX_BIAS, bias_acc.get(rid, 0.0) + delta)
        used += 1

        # Coarse geohash-ish key for cell aggregates (0.01° ≈ 1 km)
        cell = f"{round(lat, 2)}_{round(lon, 2)}"
        g = geohash_acc.setdefault(
            cell,
            {
                "lat": round(lat, 2),
                "lon": round(lon, 2),
                "weight": 0.0,
                "rating_mass": 0.0,
                "incidents": 0.0,
                "reports": 0.0,
            },
        )
        rating = 6.0 - severity  # stars
        g["weight"] += w
        g["rating_mass"] += w * rating
        g["reports"] += 1
        if severity >= 4:
            g["incidents"] += w

    bias_out = {
        "version": 1,
        "generated_at_ms": now_ms,
        "snap_m": SNAP_M,
        "max_bias": MAX_BIAS,
        "reports_used": used,
        "roads_affected": len(bias_acc),
        "bias": {k: round(v, 2) for k, v in sorted(bias_acc.items(), key=lambda x: -x[1])},
    }
    bias_path.parent.mkdir(parents=True, exist_ok=True)
    with bias_path.open("w", encoding="utf-8") as f:
        json.dump(bias_out, f, indent=2)

    cells = []
    for cell, g in geohash_acc.items():
        w = g["weight"] or 1.0
        cells.append(
            {
                "cell": cell,
                "latitude": g["lat"],
                "longitude": g["lon"],
                "communityRating": round(g["rating_mass"] / w, 2),
                "verifiedIncidents30d": round(g["incidents"], 2),
                "historicalReports": int(g["reports"]),
            }
        )
    with geohash_path.open("w", encoding="utf-8") as f:
        json.dump({"cells": cells, "generated_at_ms": now_ms}, f, indent=2)

    meta = {
        "reports_used": used,
        "roads_affected": len(bias_acc),
        "cells": len(cells),
        "built_s": round(time.time() - t0, 2),
        "bias_path": str(bias_path),
    }
    print(
        f"  community bias: {used} reports → {len(bias_acc)} roads, "
        f"{len(cells)} cells ({meta['built_s']}s)",
        flush=True,
    )
    return meta


def load_community_bias(path: Path = BIAS_JSON) -> dict[str, float]:
    if not path.exists():
        return {}
    with path.open(encoding="utf-8") as f:
        data = json.load(f)
    raw = data.get("bias") or {}
    return {str(k): float(v) for k, v in raw.items()}


def apply_bias_to_score(base_safety: float, bias: float) -> float:
    return float(max(0.0, min(100.0, float(base_safety) - float(bias))))


def main() -> None:
    build_community_bias()


if __name__ == "__main__":
    main()
