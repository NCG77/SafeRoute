"""
Phase 6 — Route confidence score.

Confidence = 0.4×DataCoverage + 0.3×ReportFreshness + 0.3×ModelAgreement
"""
from __future__ import annotations

from typing import Any


def clamp01(x: float) -> float:
    return max(0.0, min(1.0, float(x)))


def route_confidence(
    *,
    data_coverage: float,
    report_freshness: float,
    model_agreement: float,
) -> dict[str, Any]:
    """
    All inputs in [0, 1].
    Returns confidence 0–100 plus a low-data advisory when < 50.
    """
    c = (
        0.4 * clamp01(data_coverage)
        + 0.3 * clamp01(report_freshness)
        + 0.3 * clamp01(model_agreement)
    )
    pct = round(100.0 * c)
    low = pct < 50
    return {
        "confidence": pct,
        "components": {
            "data_coverage": round(100 * clamp01(data_coverage)),
            "report_freshness": round(100 * clamp01(report_freshness)),
            "model_agreement": round(100 * clamp01(model_agreement)),
        },
        "low_confidence": low,
        "advisory": (
            "Limited local data — recommendation based primarily on historical crime patterns."
            if low
            else None
        ),
    }


def estimate_confidence_from_path_stats(stats: dict[str, Any]) -> dict[str, Any]:
    """
    Build confidence inputs from path feature stats produced by explain_route.
    """
    n = max(1, int(stats.get("edge_count") or 1))
    lit = float(stats.get("edges_with_lighting") or 0) / n
    pol = float(stats.get("edges_with_police") or 0) / n
    data_coverage = 0.5 * lit + 0.5 * pol

    # Fresher reports / lower mean police distance → higher freshness proxy
    recent_hazards = float(stats.get("nearby_active_hazards") or 0)
    community_hits = float(stats.get("community_biased_edges") or 0)
    freshness = clamp01(0.35 + 0.15 * min(recent_hazards, 3) + 0.1 * min(community_hits / n, 1.0))
    # If almost no community signal, freshness is medium-low (historical only)
    if community_hits == 0 and recent_hazards == 0:
        freshness = 0.45

    ml = stats.get("mean_ml_safety")
    rule = stats.get("mean_rule_safety")
    if ml is not None and rule is not None:
        agreement = 1.0 - min(1.0, abs(float(ml) - float(rule)) / 40.0)
    else:
        agreement = 0.75  # single-engine path

    return route_confidence(
        data_coverage=data_coverage,
        report_freshness=freshness,
        model_agreement=agreement,
    )
