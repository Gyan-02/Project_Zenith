export interface AltAz {
  altDeg: number;
  azDeg: number;
}

export interface EnuDirection {
  east: number;
  north: number;
  up: number;
}

const radians = (degrees: number) => (degrees * Math.PI) / 180;
const degrees = (radiansValue: number) => (radiansValue * 180) / Math.PI;
const normalize = (value: number) => ((value % 360) + 360) % 360;

export function greenwichSiderealDegrees(at: Date): number {
  const julianDate = at.getTime() / 86_400_000 + 2_440_587.5;
  const centuries = (julianDate - 2_451_545) / 36_525;
  return normalize(
    280.46061837
      + 360.98564736629 * (julianDate - 2_451_545)
      + 0.000387933 * centuries * centuries
      - (centuries * centuries * centuries) / 38_710_000,
  );
}

export function raDecToAltAz(
  raDeg: number,
  decDeg: number,
  observer: { lat: number; lon: number },
  at: Date,
): AltAz {
  const hourAngle = radians(normalize(greenwichSiderealDegrees(at) + observer.lon - raDeg));
  const declination = radians(decDeg);
  const latitude = radians(observer.lat);
  const sinAltitude =
    Math.sin(declination) * Math.sin(latitude)
    + Math.cos(declination) * Math.cos(latitude) * Math.cos(hourAngle);
  const altitude = Math.asin(Math.max(-1, Math.min(1, sinAltitude)));
  const azimuth = Math.atan2(
    -Math.sin(hourAngle) * Math.cos(declination),
    Math.sin(declination) * Math.cos(latitude)
      - Math.cos(declination) * Math.sin(latitude) * Math.cos(hourAngle),
  );
  return { altDeg: degrees(altitude), azDeg: normalize(degrees(azimuth)) };
}

export function altAzToEnu(altDeg: number, azDeg: number): EnuDirection {
  const altitude = radians(altDeg);
  const azimuth = radians(azDeg);
  const horizontal = Math.cos(altitude);
  return {
    east: horizontal * Math.sin(azimuth),
    north: horizontal * Math.cos(azimuth),
    up: Math.sin(altitude),
  };
}
