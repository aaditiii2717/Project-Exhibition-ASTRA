"""
Trains the "ML-Only" benchmark baseline: a classifier restricted to raw kinematic
and DOP features, with no access to the physical-layer residual invariants
(L1-L4) that PhysicalLayerEngine computes. This gives BenchmarkEvaluator a
genuine ML-without-physics comparison point, instead of feeding the full hybrid
model constant sentinel values for the physics features it never actually sees.
"""
import os
import pandas as pd
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score
import joblib

PHYSICS_FEATURES = {"c3_residual_rms", "l2_residual_rms", "l3_accel_deriv", "l4_residual_rms"}

ALL_FEATURE_NAMES = [
    "displacement_m",
    "speed_mps",
    "speed_discrepancy",
    "acceleration_mps2",
    "heading_rate_deg_s",
    "satellite_count",
    "hdop",
    "pdop",
    "c3_residual_rms",
    "l2_residual_rms",
    "l3_accel_deriv",
    "baseline_offset_m",
    "l4_residual_rms",
    "sampling_dt_s",
]

KINEMATIC_FEATURE_NAMES = [f for f in ALL_FEATURE_NAMES if f not in PHYSICS_FEATURES]


def train_ml_only_baseline(data_path="data/astra_training_dataset.csv", output_path="models/astra_ml_only_baseline.joblib"):
    print("Loading dataset from:", data_path)
    df = pd.read_csv(data_path)

    X = df[KINEMATIC_FEATURE_NAMES].values
    y = df["label"].values

    print("Training Isolation Forest on Nominal Data (kinematics only)...")
    nominal_mask = (y == 0)
    iso_forest = IsolationForest(n_estimators=50, contamination=0.1, random_state=42)
    iso_forest.fit(X[nominal_mask])

    print("Training Random Forest Classifier on all scenarios (kinematics only)...")
    rf_classifier = RandomForestClassifier(n_estimators=40, max_depth=6, random_state=42)
    rf_classifier.fit(X, y)

    y_pred = rf_classifier.predict(X)
    print("\n--- ML-Only Baseline Training Evaluation ---")
    print("Accuracy:", accuracy_score(y, y_pred))
    print("\nConfusion Matrix:")
    print(confusion_matrix(y, y_pred))
    print("\nClassification Report:")
    print(classification_report(y, y_pred, target_names=["Nominal (0)", "Degraded (1)", "Spoofed (2)"]))

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    artifact = {
        "isolation_forest": iso_forest,
        "random_forest": rf_classifier,
        "feature_names": KINEMATIC_FEATURE_NAMES,
        "artifact_version": 1,
    }
    joblib.dump(artifact, output_path)
    print(f"\nML-only baseline saved to {output_path}")


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_file = os.path.join(base_dir, "data", "astra_training_dataset.csv")
    model_file = os.path.join(base_dir, "models", "astra_ml_only_baseline.joblib")
    train_ml_only_baseline(data_file, model_file)
