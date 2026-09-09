"""Reproducible training for an approved ASTRA ML artifact.

Input data must be a labeled CSV exported from controlled data governance storage.
Do not use operational telemetry as training data without a reviewed dataset release.
"""

import argparse
import csv
import hashlib
from pathlib import Path

import joblib
import numpy as np
from sklearn.ensemble import IsolationForest, RandomForestClassifier

from .engine import MLEngine


VALID_LABELS = {"NOMINAL": 0, "DEGRADED": 1, "SPOOFED": 2}


def train(dataset_path: Path, output_path: Path) -> dict:
    raw_bytes = dataset_path.read_bytes()
    with dataset_path.open(newline="", encoding="utf-8") as source:
        rows = list(csv.DictReader(source))
    required = set(MLEngine.FEATURE_NAMES) | {"label"}
    if not rows or not required.issubset(rows[0]):
        missing = sorted(required - set(rows[0] if rows else []))
        raise ValueError(f"Dataset must include required columns; missing: {missing}")

    labels = []
    vectors = []
    for row_number, row in enumerate(rows, start=2):
        label = row["label"].strip().upper()
        if label not in VALID_LABELS:
            raise ValueError(f"Row {row_number}: invalid label '{label}'")
        try:
            vector = [float(row[name]) for name in MLEngine.FEATURE_NAMES]
        except (TypeError, ValueError) as exc:
            raise ValueError(f"Row {row_number}: invalid feature value") from exc
        if not np.isfinite(vector).all():
            raise ValueError(f"Row {row_number}: features must be finite")
        labels.append(VALID_LABELS[label])
        vectors.append(vector)

    X = np.asarray(vectors, dtype=float)
    y = np.asarray(labels, dtype=int)
    if len(X) < 500 or len(set(y)) != 3 or sum(y == 0) < 100:
        raise ValueError("Training requires at least 500 rows, all three labels, and 100 nominal examples")

    iso_forest = IsolationForest(n_estimators=200, contamination=0.05, random_state=42).fit(X[y == 0])
    random_forest = RandomForestClassifier(n_estimators=300, max_depth=10, random_state=42, class_weight="balanced").fit(X, y)
    artifact = {
        "artifact_version": 1,
        "feature_names": MLEngine.FEATURE_NAMES,
        "isolation_forest": iso_forest,
        "random_forest": random_forest,
        "training_metadata": {"dataset_sha256": hashlib.sha256(raw_bytes).hexdigest(), "record_count": len(X), "label_counts": {name: int(sum(y == value)) for name, value in VALID_LABELS.items()}},
    }
    output_path.parent.mkdir(parents=True, exist_ok=True)
    joblib.dump(artifact, output_path)
    return artifact["training_metadata"]


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train a versioned ASTRA ML model artifact")
    parser.add_argument("dataset", type=Path)
    parser.add_argument("output", type=Path)
    args = parser.parse_args()
    print(train(args.dataset, args.output))
