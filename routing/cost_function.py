"""
Traversal cost for SafeRoute A*.

Cost = Distance × (1 + α × (1 − Safety/100))

α controls how strongly unsafe roads are penalized.
"""
from __future__ import annotations

from typing import Literal

RouteMode = Literal["safest", "balanced", "fastest"]

# Phase 3 alphas
MODE_ALPHA: dict[RouteMode, float] = {
    "safest": 2.0,
    "balanced": 1.0,
    "fastest": 0.0,
}

WALK_SPEED_M_PER_MIN = 83.333  # 5 km/h


def clamp_safety(safety: float) -> float:
    return max(0.0, min(100.0, float(safety)))


def edge_cost(length_m: float, safety: float, alpha: float) -> float:
    """
    Cost = Distance × (1 + α × (1 − Safety/100))

    When α = 0, cost == distance (fastest / Google-like).
    When α = 2, a safety-25 road costs 2.5× its length.
    """
    if length_m <= 0:
        return 0.0
    risk = 1.0 - clamp_safety(safety) / 100.0
    return float(length_m) * (1.0 + float(alpha) * risk)


def mode_alpha(mode: RouteMode | str) -> float:
    key = str(mode).lower()
    if key not in MODE_ALPHA:
        raise ValueError(f"Unknown mode {mode!r}; expected safest|balanced|fastest")
    return MODE_ALPHA[key]  # type: ignore[index]


def eta_minutes(distance_m: float) -> float:
    return float(distance_m) / WALK_SPEED_M_PER_MIN
