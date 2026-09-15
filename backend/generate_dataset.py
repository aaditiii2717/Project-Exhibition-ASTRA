import numpy as np
import pandas as pd
import os

def generate_astra_dataset(n_samples=50000, output_path="astra_training_dataset.csv"):
    np.random.seed(42)
    
    # Class split: 50% nominal (0), 25% degraded (1), 25% spoofed (2)
    n_nom = int(n_samples * 0.5)
    n_deg = int(n_samples * 0.25)
    n_spf = n_samples - n_nom - n_deg
    
    print(f"Generating {n_samples} samples...")
    print(f" - Nominal: {n_nom}")
    print(f" - Degraded: {n_deg}")
    print(f" - Spoofed: {n_spf}")

    norm_disp = np.random.normal(12.0, 3.0, n_nom)
    norm_spd = norm_disp  # dt=1.0s
    norm_diff = np.random.exponential(0.5, n_nom)
    norm_accel = np.random.exponential(0.8, n_nom)
    norm_hdg = np.random.exponential(2.0, n_nom)
    norm_sats = np.random.randint(8, 14, n_nom)
    norm_hdop = np.random.normal(0.9, 0.2, n_nom).clip(0.6, 2.0)
    norm_pdop = norm_hdop * 1.6
    norm_c3 = np.random.exponential(0.4, n_nom)
    norm_l2 = np.random.exponential(3.0, n_nom)
    norm_l3 = np.random.exponential(1.2, n_nom)
    norm_base = np.linspace(0, 500, n_nom)
    norm_l4 = np.random.exponential(0.5, n_nom)
    norm_dt = np.ones(n_nom)

    X_normal = np.column_stack([
        norm_disp, norm_spd, norm_diff, norm_accel, norm_hdg,
        norm_sats, norm_hdop, norm_pdop, norm_c3, norm_l2,
        norm_l3, norm_base, norm_l4, norm_dt
    ])
    y_normal = np.zeros(n_nom)  # 0 = Nominal

    # Degraded cluster: urban canyon, bad geometry, high multipath
    deg_disp = np.random.normal(12.0, 5.0, n_deg)
    deg_spd = deg_disp
    deg_diff = np.random.exponential(2.0, n_deg)
    deg_accel = np.random.exponential(2.5, n_deg)
    deg_hdg = np.random.exponential(5.0, n_deg)
    deg_sats = np.random.randint(4, 7, n_deg)
    deg_hdop = np.random.normal(3.5, 0.8, n_deg).clip(2.5, 7.0)
    deg_pdop = deg_hdop * 1.8
    deg_c3 = np.random.exponential(1.5, n_deg)
    deg_l2 = np.random.exponential(15.0, n_deg)
    deg_l3 = np.random.exponential(4.0, n_deg)
    deg_base = np.linspace(0, 500, n_deg)
    deg_l4 = np.random.exponential(2.0, n_deg)
    deg_dt = np.ones(n_deg)

    X_degraded = np.column_stack([
        deg_disp, deg_spd, deg_diff, deg_accel, deg_hdg,
        deg_sats, deg_hdop, deg_pdop, deg_c3, deg_l2,
        deg_l3, deg_base, deg_l4, deg_dt
    ])
    y_degraded = np.ones(n_deg) * 1  # 1 = Degraded

    # Spoofed cluster: large jumps and cross-signal contradictions
    spoof_disp = np.random.uniform(80.0, 3000.0, n_spf)
    spoof_spd = np.random.normal(15.0, 5.0, n_spf)
    spoof_diff = np.abs(spoof_disp - spoof_spd)
    spoof_accel = np.random.uniform(20.0, 150.0, n_spf)
    spoof_hdg = np.random.uniform(40.0, 180.0, n_spf)
    spoof_sats = np.random.randint(8, 16, n_spf)
    spoof_hdop = np.random.normal(0.8, 0.2, n_spf)
    spoof_pdop = spoof_hdop * 1.5
    spoof_c3 = np.random.uniform(8.0, 45.0, n_spf)
    spoof_l2 = np.random.uniform(35.0, 200.0, n_spf)
    spoof_l3 = np.random.uniform(25.0, 80.0, n_spf)
    spoof_base = np.random.uniform(200.0, 5000.0, n_spf)
    spoof_l4 = np.random.uniform(8.0, 35.0, n_spf)
    spoof_dt = np.ones(n_spf)

    X_spoof = np.column_stack([
        spoof_disp, spoof_spd, spoof_diff, spoof_accel, spoof_hdg,
        spoof_sats, spoof_hdop, spoof_pdop, spoof_c3, spoof_l2,
        spoof_l3, spoof_base, spoof_l4, spoof_dt
    ])
    y_spoof = np.ones(n_spf) * 2  # 2 = Spoofed / Malicious

    X = np.vstack([X_normal, X_degraded, X_spoof])
    y = np.concatenate([y_normal, y_degraded, y_spoof])

    columns = [
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

    df = pd.DataFrame(X, columns=columns)
    df['label'] = y.astype(int)
    
    df = df.sample(frac=1, random_state=42).reset_index(drop=True)

    df.to_csv(output_path, index=False)
    print(f"Successfully generated {output_path}")
    print(df['label'].value_counts())

if __name__ == "__main__":
    out_dir = os.path.dirname(os.path.abspath(__file__))
    out_path = os.path.join(out_dir, "data", "astra_training_dataset.csv")
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    generate_astra_dataset(100000, out_path)
