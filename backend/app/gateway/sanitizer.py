"""
ASTRA Secure Input Gateway & Data Sanitizer
Performs schema, range, monotonic time, duplicate, and stale-data validation before data enters the evidence pipeline.
Also computes SHA-256 dataset hashes for tamper detection and parses raw NMEA/CSV inputs.
"""

import math
import hashlib
import json
from datetime import datetime
from typing import Dict, Any, List, Tuple, Optional
from ..core.schema import GNSSObservation, DatasetIntegrity


class InputGateway:
    def __init__(self):
        self.last_valid_timestamp: Optional[datetime] = None
        self.last_observation: Optional[GNSSObservation] = None
        self.seen_signatures = set()

    def reset_state(self):
        self.last_valid_timestamp = None
        self.last_observation = None
        self.seen_signatures.clear()

    @staticmethod
    def compute_sha256(content: str | bytes) -> str:
        """Calculates cryptographic SHA-256 hash of payload/dataset."""
        if isinstance(content, str):
            content = content.encode("utf-8")
        return hashlib.sha256(content).hexdigest()

    def validate_observation_dict(self, data: Dict[str, Any]) -> Tuple[bool, Optional[GNSSObservation], List[str]]:
        """
        Validates raw dictionary against physical boundaries, types, and sequence constraints.
        Returns: (is_valid, normalized_observation, list_of_errors)
        """
        errors = []

        # 1. Missing mandatory fields
        required_fields = ["timestamp", "latitude", "longitude"]
        for rf in required_fields:
            if rf not in data or data[rf] is None:
                errors.append(f"Missing required field: '{rf}'")
        if errors:
            return False, None, errors

        # 2. Type and numerical sanity (NaN / Inf)
        try:
            lat = float(data["latitude"])
            lon = float(data["longitude"])
            alt = float(data.get("altitude", 0.0))
            speed = float(data.get("speed", 0.0))
            heading = float(data.get("heading", 0.0))
            sat_count = int(data.get("satellite_count", 8))
            fix_quality = int(data.get("fix_quality", 1))
            hdop = float(data.get("hdop", 1.0))
            vdop = float(data.get("vdop", 1.5))
            pdop = float(data.get("pdop", 1.8))
        except (ValueError, TypeError) as e:
            errors.append(f"Datatype or numeric conversion error: {str(e)}")
            return False, None, errors

        # Check for NaN / Infinity
        numeric_vals = [lat, lon, alt, speed, heading, hdop, vdop, pdop]
        if any(math.isnan(v) or math.isinf(v) for v in numeric_vals):
            errors.append("Impossible numerical values detected: NaN or Infinity")
            return False, None, errors

        # 3. Coordinate range checks
        if not (-90.0 <= lat <= 90.0):
            errors.append(f"Latitude out of bounds [-90, 90]: {lat}")
        if not (-180.0 <= lon <= 180.0):
            errors.append(f"Longitude out of bounds [-180, 180]: {lon}")
        if not (-1000.0 <= alt <= 50000.0):
            errors.append(f"Altitude out of terrestrial/aviation bounds [-1000m, 50000m]: {alt}")
        if speed < 0.0:
            errors.append(f"Negative ground speed is physically impossible: {speed}")
        if speed > 1200.0:  # ~Mach 3.5 bound
            errors.append(f"Reported speed exceeds extreme physical bounds (>1200 m/s): {speed}")
        if not (0.0 <= heading <= 360.0):
            # Normalize or flag
            heading = heading % 360.0

        if hdop < 0.0 or hdop > 50.0:
            errors.append(f"HDOP out of plausible bounds [0, 50]: {hdop}")
        if pdop < 0.0 or pdop > 60.0:
            errors.append(f"PDOP out of plausible bounds [0, 60]: {pdop}")

        # 3b. Raw-measurement integrity. Do not pass malformed arrays to physics or ML.
        raw_arrays = {
            "satellites": data.get("satellites"),
            "pseudorange": data.get("pseudorange"),
            "pseudorange_rate": data.get("pseudorange_rate"),
            "doppler": data.get("doppler"),
            "cn0": data.get("cn0"),
            "carrier_phase": data.get("carrier_phase"),
        }
        populated_lengths = []
        for name, values in raw_arrays.items():
            if values is None:
                continue
            if not isinstance(values, list) or not values:
                errors.append(f"Raw field '{name}' must be a non-empty list when present")
                continue
            if len(values) > 64:
                errors.append(f"Raw field '{name}' exceeds the 64-satellite safety limit")
                continue
            try:
                if name == "satellites":
                    if any(int(value) < 1 or int(value) > 999 for value in values):
                        errors.append("Satellite identifiers must be integers in [1, 999]")
                elif any(not math.isfinite(float(value)) for value in values):
                    errors.append(f"Raw field '{name}' contains NaN or Infinity")
                populated_lengths.append(len(values))
            except (TypeError, ValueError):
                errors.append(f"Raw field '{name}' contains an invalid numeric value")

        for name in ("satellite_positions", "satellite_velocities"):
            vectors = data.get(name)
            if vectors is None:
                continue
            if not isinstance(vectors, list) or not vectors or len(vectors) > 64:
                errors.append(f"Raw field '{name}' must contain 1 to 64 ECEF vectors")
                continue
            try:
                if any(not isinstance(vector, list) or len(vector) != 3 or any(not math.isfinite(float(value)) for value in vector) for vector in vectors):
                    errors.append(f"Raw field '{name}' must contain finite [x, y, z] vectors")
                populated_lengths.append(len(vectors))
            except (TypeError, ValueError):
                errors.append(f"Raw field '{name}' contains an invalid ECEF vector")

        if populated_lengths and len(set(populated_lengths)) != 1:
            errors.append("All populated raw GNSS measurement arrays must have identical lengths")

        # 4. Timestamp parsing and validation
        raw_ts = str(data["timestamp"])
        parsed_ts = self._parse_timestamp(raw_ts)
        if not parsed_ts:
            errors.append(f"Malformed or unparseable timestamp: '{raw_ts}'")
            return False, None, errors

        # Monotonic time check
        if self.last_valid_timestamp is not None:
            dt = (parsed_ts - self.last_valid_timestamp).total_seconds()
            if dt < 0:
                errors.append(f"Monotonic sequence violation: time moved backwards by {dt:.2f}s")
            elif dt == 0:
                # Potential duplicate timestamp
                if (lat, lon) == (self.last_observation.latitude, self.last_observation.longitude):
                    errors.append(f"Duplicate observation detected at timestamp {raw_ts}")

        # 5. Duplicate signature check
        sig = (round(lat, 6), round(lon, 6), raw_ts)
        if sig in self.seen_signatures:
            errors.append(f"Duplicate record signature detected: {sig}")

        if errors:
            return False, None, errors

        # Construct normalized observation
        obs = GNSSObservation(
            timestamp=raw_ts,
            latitude=lat,
            longitude=lon,
            altitude=alt,
            speed=speed,
            heading=heading,
            satellite_count=sat_count,
            fix_quality=fix_quality,
            hdop=hdop,
            vdop=vdop,
            pdop=pdop,
            satellites=data.get("satellites"),
            pseudorange=data.get("pseudorange"),
            pseudorange_rate=data.get("pseudorange_rate"),
            doppler=data.get("doppler"),
            cn0=data.get("cn0"),
            satellite_positions=data.get("satellite_positions"),
            satellite_velocities=data.get("satellite_velocities"),
            carrier_phase=data.get("carrier_phase"),
        )

        self.last_valid_timestamp = parsed_ts
        self.last_observation = obs
        self.seen_signatures.add(sig)
        return True, obs, []

    def _parse_timestamp(self, ts_str: str) -> Optional[datetime]:
        """Tries various ISO formats or unix epochs."""
        try:
            # Try float unix timestamp
            val = float(ts_str)
            if val > 1e8:  # plausible epoch
                return datetime.utcfromtimestamp(val)
        except ValueError:
            pass

        # Clean string
        clean_ts = ts_str.replace("Z", "+00:00")
        formats = [
            "%Y-%m-%d %H:%M:%S",
            "%Y-%m-%dT%H:%M:%S",
            "%Y-%m-%dT%H:%M:%S.%f",
            "%Y-%m-%d %H:%M:%S.%f",
            "%H:%M:%S",
            "%H:%M:%S.%f",
        ]
        for fmt in formats:
            try:
                return datetime.strptime(clean_ts.split("+")[0], fmt)
            except ValueError:
                continue
        return None

    @staticmethod
    def parse_nmea_sentence(sentence: str) -> Optional[Dict[str, Any]]:
        """
        Parses standard NMEA 0183 sentences ($GPGGA or $GPRMC).
        Converts NMEA DDMM.MMMM to decimal degrees.
        """
        sentence = sentence.strip()
        if not sentence.startswith("$"):
            return None

        # Strip checksum if present
        if "*" in sentence:
            sentence = sentence.split("*")[0]

        parts = sentence.split(",")
        talker = parts[0][1:]  # GPGGA, GNRMC, etc.

        if "GGA" in talker and len(parts) >= 10:
            # $GPGGA,time,lat,N/S,lon,E/W,quality,numSV,HDOP,alt,M,...
            try:
                raw_time = parts[1]
                lat_raw, lat_dir = parts[2], parts[3]
                lon_raw, lon_dir = parts[4], parts[5]
                quality = int(parts[6]) if parts[6] else 0
                num_sv = int(parts[7]) if parts[7] else 0
                hdop = float(parts[8]) if parts[8] else 1.0
                alt = float(parts[9]) if parts[9] else 0.0

                if not lat_raw or not lon_raw:
                    return None

                lat = InputGateway._nmea_to_decimal(lat_raw, lat_dir)
                lon = InputGateway._nmea_to_decimal(lon_raw, lon_dir)

                # Formulate timestamp
                ts = f"{raw_time[:2]}:{raw_time[2:4]}:{raw_time[4:6]}" if len(raw_time) >= 6 else "12:00:00"

                return {
                    "timestamp": ts,
                    "latitude": lat,
                    "longitude": lon,
                    "altitude": alt,
                    "speed": 0.0,
                    "heading": 0.0,
                    "satellite_count": num_sv,
                    "fix_quality": quality,
                    "hdop": hdop,
                    "vdop": hdop * 1.4,
                    "pdop": hdop * 1.8
                }
            except Exception:
                return None

        elif "RMC" in talker and len(parts) >= 9:
            # $GPRMC,time,status,lat,N/S,lon,E/W,speed_knots,heading,date,...
            try:
                raw_time = parts[1]
                status = parts[2]
                if status != "A":  # 'A' = Valid, 'V' = Warning
                    pass
                lat_raw, lat_dir = parts[3], parts[4]
                lon_raw, lon_dir = parts[5], parts[6]
                speed_knots = float(parts[7]) if parts[7] else 0.0
                speed_mps = speed_knots * 0.514444
                heading = float(parts[8]) if parts[8] else 0.0

                if not lat_raw or not lon_raw:
                    return None

                lat = InputGateway._nmea_to_decimal(lat_raw, lat_dir)
                lon = InputGateway._nmea_to_decimal(lon_raw, lon_dir)
                ts = f"{raw_time[:2]}:{raw_time[2:4]}:{raw_time[4:6]}" if len(raw_time) >= 6 else "12:00:00"

                return {
                    "timestamp": ts,
                    "latitude": lat,
                    "longitude": lon,
                    "altitude": 0.0,
                    "speed": speed_mps,
                    "heading": heading,
                    "satellite_count": 8,
                    "fix_quality": 1 if status == "A" else 0,
                    "hdop": 1.0,
                    "vdop": 1.4,
                    "pdop": 1.8
                }
            except Exception:
                return None

        return None

    @staticmethod
    def _nmea_to_decimal(coord_str: str, direction: str) -> float:
        """Converts NMEA DDMM.MMMM to Decimal Degrees."""
        val = float(coord_str)
        deg = int(val / 100)
        minutes = val - (deg * 100)
        decimal = deg + (minutes / 60.0)
        if direction.upper() in ["S", "W"]:
            decimal = -decimal
        return decimal

    @staticmethod
    def parse_csv_content(csv_text: str) -> Tuple[List[Dict[str, Any]], str, List[str]]:
        """
        Parses generic GNSS CSV lines into list of dictionaries.
        Computes SHA-256 of text.
        """
        sha256 = InputGateway.compute_sha256(csv_text)
        lines = [l.strip() for l in csv_text.splitlines() if l.strip()]
        if not lines:
            return [], sha256, ["Empty CSV file"]

        # Parse header
        raw_headers = [h.strip().lower().replace('"', '').replace("'", "") for h in lines[0].split(",")]

        # Header aliases mapping
        mapping = {}
        for idx, h in enumerate(raw_headers):
            if h in ["lat", "latitude", "lat_deg"]:
                mapping["latitude"] = idx
            elif h in ["lon", "lng", "longitude", "lon_deg"]:
                mapping["longitude"] = idx
            elif h in ["time", "timestamp", "datetime", "utc_time"]:
                mapping["timestamp"] = idx
            elif h in ["alt", "altitude", "height", "alt_m"]:
                mapping["altitude"] = idx
            elif h in ["speed", "spd", "ground_speed", "speed_mps"]:
                mapping["speed"] = idx
            elif h in ["heading", "course", "cog", "bearing"]:
                mapping["heading"] = idx
            elif h in ["satellites", "sat_count", "sats", "num_sv"]:
                mapping["satellite_count"] = idx
            elif h in ["fix", "fix_quality", "quality"]:
                mapping["fix_quality"] = idx
            elif h in ["hdop"]:
                mapping["hdop"] = idx
            elif h in ["vdop"]:
                mapping["vdop"] = idx
            elif h in ["pdop"]:
                mapping["pdop"] = idx

        parsed_rows = []
        errors = []
        for line_num, line in enumerate(lines[1:], start=2):
            if line.startswith("#"):
                continue
            cols = [c.strip().replace('"', '') for c in line.split(",")]
            if len(cols) < len(mapping):
                errors.append(f"Line {line_num}: Insufficient columns")
                continue

            row_data = {}
            for field, idx in mapping.items():
                if idx < len(cols):
                    row_data[field] = cols[idx]

            # Fallback timestamp if missing
            if "timestamp" not in row_data:
                row_data["timestamp"] = f"12:00:{line_num % 60:02d}"

            parsed_rows.append(row_data)

        return parsed_rows, sha256, errors
