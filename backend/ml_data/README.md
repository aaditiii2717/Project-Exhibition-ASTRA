# Approved Training Data Contract

Each CSV row represents one independently labeled GNSS epoch. Required columns are every name in `MLEngine.FEATURE_NAMES` plus `label`.

`label` is one of `NOMINAL`, `DEGRADED`, or `SPOOFED`. Dataset releases must include a separate signed manifest documenting source devices, collection consent/authority, reference ground truth, scenario coverage, release owner, and train/evaluation split policy. Do not commit operational telemetry or sensitive location data to this repository.
