# NASA Horizons Planetary Provider (GYA-16)

Fetches topocentric planetary ephemeris for Mercury, Venus, Mars, Jupiter,
Saturn, Uranus, and Neptune from the [NASA JPL Horizons API](https://ssd.jpl.nasa.gov/horizons/).

## Files

| File | Purpose |
|------|---------|
| `horizons.types.ts` | Provider-owned types: `PlanetEphemeris`, `ObserverLocation`, `HorizonsProviderError` |
| `horizons.client.ts` | HTTP client — builds the Horizons URL, applies timeout, maps HTTP/abort errors |
| `horizons.parser.ts` | Parses the `$$SOE`…`$$EOE` block from the Horizons ASCII result string |
| `horizons.cache.ts` | 24-hour in-memory cache with in-flight deduplication and stale fallback |
| `index.ts` | Public entry point — `getPlanets`, `getSinglePlanet`, re-exports |
| `__tests__/` | Vitest unit tests — parser, cache, client/integration |

## Usage (GYA-36 aggregator)

```ts
import { getPlanets } from "./providers/nasa-horizons/index.js";

const planets = await getPlanets(
  { lat: 25.61, lon: 85.14, elevationM: 53 }, // Patna, India
  "2026-06-25T00:00:00.000Z",
);
// → PlanetEphemeris[] (or tagged with _stale: true on fallback)
```

## Response shape

```ts
type PlanetEphemeris = {
  id: string;               // e.g. "mars"
  kind: "planet";
  name: string;             // e.g. "Mars"
  position: {
    ra: number;             // Right ascension, decimal degrees (J2000 ICRF)
    dec: number;            // Declination, decimal degrees
    altDeg?: number;        // Apparent altitude above horizon
    azDeg?: number;         // Azimuth (East of North)
    distanceKm?: number;    // Observer-to-planet distance in km
  };
  observedAt: string;       // ISO-8601 UTC
  source: "NASA Horizons";
};
```

## Error categories

`HorizonsProviderError.kind`:

| Kind | Trigger |
|------|---------|
| `timeout` | Request did not complete within `timeoutMs` (default 15 s) |
| `upstream_http` | Non-200 HTTP status or network-level error |
| `parse` | Missing `$$SOE`/`$$EOE`, empty block, or non-finite RA/DEC |

## Caching behaviour

- Entries cached for **24 hours** per `(planetId, observer bucket, UTC hour)`.
- Observer coordinates are rounded to 2 decimal places (≈ 1.1 km) for the cache key.
- Two simultaneous requests for the same key share **one in-flight Promise** — only one HTTP call is made.
- If a fetch fails and a stale entry exists, the stale entry is returned tagged `_stale: true`; coordinates are never invented.

## API parameters used

| Param | Value | Purpose |
|-------|-------|---------|
| `EPHEM_TYPE` | `OBSERVER` | Topocentric observer table |
| `CENTER` | `coord@399` | Earth-relative with custom site coordinates |
| `QUANTITIES` | `1,4,20` | RA/DEC, alt/az, range |
| `ANG_FORMAT` | `DEG` | Decimal degrees for RA |
| `RANGE_UNITS` | `KM` | Distance directly in km |
| `STEP_SIZE` | `1 m` | One output row |
