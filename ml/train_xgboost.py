"""
Train XGBRegressor on Mumbai road safety features.

Target: continuous safety_score (0–100)
Features: lighting_score, police_dist, crime_score, hospital_dist

  python -m ml.train_xgboost
"""
from __future__ import annotations

import json
import pickle
import time
from pathlib import Path

import numpy as np
import pandas as pd
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.model_selection import train_test_split
from xgboost import XGBRegressor

from .feature_importance import save_feature_importance_plot
from .predict import FEATURE_COLS, MODEL_PATH, TARGET_COL

ML_DIR = Path(__file__).resolve().parent
DATA_CSV = ML_DIR.parent / "data" / "processed" / "road_safety_scores.csv"
METRICS_PATH = ML_DIR / "metrics.json"
RANDOM_STATE = 42
TEST_SIZE = 0.20


def load_xy(csv_path: Path = DATA_CSV) -> tuple[pd.DataFrame, np.ndarray, np.ndarray]:
    if not csv_path.exists():
        raise FileNotFoundError(csv_path)
    df = pd.read_csv(csv_path)
    missing = [c for c in FEATURE_COLS + [TARGET_COL] if c not in df.columns]
    if missing:
        raise ValueError(f"CSV missing columns: {missing}")
    clean = df[FEATURE_COLS + [TARGET_COL]].dropna().copy()
    X = clean[FEATURE_COLS].astype(float).values
    y = clean[TARGET_COL].astype(float).values
    return clean, X, y


def build_model() -> XGBRegressor:
    return XGBRegressor(
        n_estimators=300,
        max_depth=6,
        learning_rate=0.05,
        subsample=0.9,
        colsample_bytree=0.9,
        objective="reg:squarederror",
        random_state=RANDOM_STATE,
        n_jobs=-1,
    )


def evaluate(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    mae = float(mean_absolute_error(y_true, y_pred))
    rmse = float(np.sqrt(mean_squared_error(y_true, y_pred)))
    r2 = float(r2_score(y_true, y_pred))
    return {"mae": round(mae, 4), "rmse": round(rmse, 4), "r2": round(r2, 4)}


def train(
    csv_path: Path = DATA_CSV,
    model_path: Path = MODEL_PATH,
    metrics_path: Path = METRICS_PATH,
) -> dict:
    t0 = time.time()
    clean, X, y = load_xy(csv_path)
    print(f"Rows: {len(clean):,}  features={FEATURE_COLS}", flush=True)

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SIZE, random_state=RANDOM_STATE
    )
    print(
        f"Split: train={len(X_train):,} test={len(X_test):,} "
        f"(test_size={TEST_SIZE}, random_state={RANDOM_STATE})",
        flush=True,
    )

    model = build_model()
    model.fit(X_train, y_train)

    train_pred = model.predict(X_train)
    test_pred = model.predict(X_test)
    # Clamp predictions to score range for metrics that match production use
    test_pred_c = np.clip(test_pred, 0.0, 100.0)

    train_metrics = evaluate(y_train, train_pred)
    test_metrics = evaluate(y_test, test_pred_c)

    importance = {
        name: float(v)
        for name, v in zip(FEATURE_COLS, model.feature_importances_)
    }

    payload = {
        "n_samples": int(len(clean)),
        "n_train": int(len(X_train)),
        "n_test": int(len(X_test)),
        "features": FEATURE_COLS,
        "target": TARGET_COL,
        "model": {
            "type": "XGBRegressor",
            "n_estimators": 300,
            "max_depth": 6,
            "learning_rate": 0.05,
            "random_state": RANDOM_STATE,
        },
        "train": train_metrics,
        "test": test_metrics,
        "feature_importance": importance,
        "trained_s": round(time.time() - t0, 2),
    }

    model_path.parent.mkdir(parents=True, exist_ok=True)
    with model_path.open("wb") as f:
        pickle.dump(
            {"model": model, "features": FEATURE_COLS, "target": TARGET_COL},
            f,
            protocol=pickle.HIGHEST_PROTOCOL,
        )
    with metrics_path.open("w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)

    plot_path = save_feature_importance_plot(importance)
    print(f"Saved model → {model_path}", flush=True)
    print(f"Saved metrics → {metrics_path}", flush=True)
    print(f"Saved importance → {plot_path}", flush=True)
    print(
        f"Test  MAE={test_metrics['mae']:.2f}  "
        f"RMSE={test_metrics['rmse']:.2f}  R²={test_metrics['r2']:.4f}",
        flush=True,
    )
    return payload


def main() -> None:
    train()


if __name__ == "__main__":
    main()
