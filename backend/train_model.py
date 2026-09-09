import pandas as pd
import numpy as np
import joblib
import os
from sklearn.ensemble import IsolationForest, RandomForestClassifier
from sklearn.metrics import classification_report, confusion_matrix, accuracy_score

FEATURE_NAMES = [
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

def train_astra_model(data_path="data/astra_training_dataset.csv", output_path="models/astra_v1_model.joblib"):
    print("Loading dataset from:", data_path)
    df = pd.read_csv(data_path)
    
    X = df[FEATURE_NAMES].values
    y = df['label'].values
    
    # Isolation Forest: Train ONLY on nominal data (label 0)
    print("Training Isolation Forest on Nominal Data...")
    nominal_mask = (y == 0)
    X_nominal = X[nominal_mask]
    
    iso_forest = IsolationForest(n_estimators=50, contamination=0.1, random_state=42)
    iso_forest.fit(X_nominal)
    print("Isolation Forest trained successfully.")
    
    # Random Forest: Train on all data
    print("Training Random Forest Classifier on all scenarios...")
    rf_classifier = RandomForestClassifier(n_estimators=40, max_depth=6, random_state=42)
    rf_classifier.fit(X, y)
    print("Random Forest trained successfully.")
    
    # Evaluate Random Forest
    y_pred = rf_classifier.predict(X)
    print("\n--- Training Evaluation ---")
    print("Accuracy:", accuracy_score(y, y_pred))
    print("\nConfusion Matrix:")
    print(confusion_matrix(y, y_pred))
    print("\nClassification Report:")
    print(classification_report(y, y_pred, target_names=["Nominal (0)", "Degraded (1)", "Spoofed (2)"]))
    
    # Save the model
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    
    artifact = {
        "isolation_forest": iso_forest,
        "random_forest": rf_classifier,
        "feature_names": FEATURE_NAMES,
        "artifact_version": 1
    }
    
    joblib.dump(artifact, output_path)
    print(f"\nModel successfully saved to {output_path}")

if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.abspath(__file__))
    data_file = os.path.join(base_dir, "data", "astra_training_dataset.csv")
    model_file = os.path.join(base_dir, "models", "astra_v1_model.joblib")
    
    train_astra_model(data_file, model_file)
