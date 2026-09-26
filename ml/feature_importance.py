"""
Feature-importance chart for the SafeRoute XGBoost model.

  python -m ml.feature_importance
"""
from __future__ import annotations

import json
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402

from .predict import FEATURE_COLS, MODEL_PATH, load_model

ML_DIR = Path(__file__).resolve().parent
METRICS_PATH = ML_DIR / "metrics.json"
PLOT_PATH = ML_DIR / "feature_importance.png"


def save_feature_importance_plot(
    importance: dict[str, float],
    out_path: Path = PLOT_PATH,
) -> Path:
    names = list(importance.keys())
    values = [float(importance[n]) for n in names]
    # Sort ascending for horizontal bar chart (top = most important)
    order = sorted(range(len(values)), key=lambda i: values[i])
    names = [names[i] for i in order]
    values = [values[i] for i in order]

    fig, ax = plt.subplots(figsize=(8, 4.5), dpi=140)
    colors = ["#94A3B8", "#3B82F6", "#10B981", "#F59E0B"]
    bar_colors = [colors[i % len(colors)] for i in range(len(names))]
    ax.barh(names, values, color=bar_colors, height=0.55)
    ax.set_xlabel("Gain / importance")
    ax.set_title("SafeRoute XGBoost — Feature Importance")
    ax.set_xlim(0, max(values) * 1.15 if values else 1)
    for i, v in enumerate(values):
        ax.text(v + max(values, default=1) * 0.02, i, f"{v:.3f}", va="center", fontsize=9)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)
    fig.tight_layout()
    out_path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(out_path, bbox_inches="tight")
    plt.close(fig)
    return out_path


def from_model(model_path: Path = MODEL_PATH) -> dict[str, float]:
    if METRICS_PATH.exists():
        with METRICS_PATH.open(encoding="utf-8") as f:
            data = json.load(f)
        if data.get("feature_importance"):
            return {k: float(v) for k, v in data["feature_importance"].items()}

    bundle = load_model(model_path)
    model = bundle["model"]
    features = list(bundle.get("features") or FEATURE_COLS)
    return {name: float(v) for name, v in zip(features, model.feature_importances_)}


def main() -> None:
    importance = from_model()
    path = save_feature_importance_plot(importance)
    print("Feature importance:")
    for k, v in sorted(importance.items(), key=lambda kv: -kv[1]):
        print(f"  {k:16} {v:.4f}")
    print(f"Plot → {path}")


if __name__ == "__main__":
    main()
