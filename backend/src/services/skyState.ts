import type { SkyObject, SkyState, ViewerContext } from "../contracts.js";
import { CelestrakProvider, type SatelliteResult } from "../providers/celestrak/index.js";
import { IssProvider } from "../providers/iss/index.js";
import { getPlanets as getHorizonsPlanets } from "../providers/nasa-horizons/index.js";
import { getBrightStars } from "../sky-state/brightStars.js";
import { withSampledSatellitePath } from "../sky-state/satellitePaths.js";

export type PlanetProvider = (
  location: ViewerContext["location"],
  at: Date,
) => Promise<SkyObject[]>;
export type SatelliteProvider = (
  location: ViewerContext["location"],
  at: Date,
) => Promise<SatelliteResult>;
export type LiveIssProvider = (
  location: ViewerContext["location"],
  at: Date,
) => Promise<SkyObject>;

export interface SkyStateDependencies {
  getPlanets: PlanetProvider;
  getSatellites: SatelliteProvider;
  getIss: LiveIssProvider;
  now?: () => Date;
}

const DEMO_PLANETS: SkyObject[] = [
  {
    id: "saturn",
    kind: "planet",
    name: "Saturn",
    position: { ra: 2.1, dec: 12.4, altDeg: 28.4, azDeg: 118.7, distanceKm: 1_340_000_000 },
    metadata: { visible: true, source: "demo fixture fallback", dataMode: "demo-fixture" },
  },
  {
    id: "jupiter",
    kind: "planet",
    name: "Jupiter",
    position: { ra: 7.8, dec: 22.1, altDeg: 37.2, azDeg: 142.1, distanceKm: 790_000_000 },
    metadata: { visible: true, source: "demo fixture fallback", dataMode: "demo-fixture" },
  },
];

const DEMO_MOON: SkyObject = {
  id: "moon",
  kind: "moon",
  name: "Moon",
  position: { ra: 14.2, dec: -8.1, altDeg: 51.6, azDeg: 207.5, distanceKm: 384_400 },
  metadata: { visible: true, source: "demo fixture lunar placeholder", dataMode: "demo-fixture" },
};

const celestrak = new CelestrakProvider({ timeoutMs: 2_500 });
const iss = new IssProvider();

function readPositiveInteger(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function normalizeDegrees(value: number): number {
  return ((value % 360) + 360) % 360;
}

function normalizeSkyObjectPosition(object: SkyObject): SkyObject {
  return {
    ...object,
    position: {
      ...object.position,
      ...(object.position.azDeg !== undefined ? { azDeg: normalizeDegrees(object.position.azDeg) } : {}),
    },
  };
}

const SATELLITE_PATH_LIMIT = readPositiveInteger(process.env.SATELLITE_PATH_LIMIT, 12);

const defaultDependencies: SkyStateDependencies = {
  getPlanets: async (location, at) => {
    const planets = await getHorizonsPlanets(location, at.toISOString(), { timeoutMs: 2_500 });
    if (planets.length) {
      return planets.map((planet) => normalizeSkyObjectPosition({
        id: planet.id,
        kind: planet.kind,
        name: planet.name,
        position: planet.position,
        metadata: {
          source: planet.source,
          dataMode: "live-provider",
          provider: "NASA Horizons",
          observedAt: planet.observedAt,
          staleEphemeris: "_stale" in planet,
        },
      }));
    }
    return process.env.ZENITH_DEMO_MODE === "true" ? DEMO_PLANETS : [];
  },
  getSatellites: (location, at) =>
    celestrak.getSatellites(location, at, {
      limit: Number(process.env.SATELLITE_LIMIT ?? 6_000),
    }),
  getIss: (location, at) => iss.getIss(location, at),
};

export function createSkyStateService(dependencies: SkyStateDependencies = defaultDependencies) {
  return async function composeSkyState(
    context: Pick<ViewerContext, "location" | "timeIso">,
  ): Promise<SkyState> {
    const at = new Date(context.timeIso);
    const [planetsResult, satellitesResult, issResult] = await Promise.allSettled([
      dependencies.getPlanets(context.location, at),
      dependencies.getSatellites(context.location, at),
      dependencies.getIss(context.location, at),
    ]);

    const planets = planetsResult.status === "fulfilled" ? planetsResult.value : [];
    const satellites = satellitesResult.status === "fulfilled"
      ? satellitesResult.value.objects.map((object, index) => {
          const enrichedObject = {
            ...object,
            metadata: {
              ...object.metadata,
              dataMode: satellitesResult.value.stale ? "stale-cache" : "live-provider",
              provider: "CelesTrak TLE + satellite.js SGP4",
            },
          };
          if ((object.position.altDeg ?? -90) < -6 || index >= SATELLITE_PATH_LIMIT) return enrichedObject;
          return withSampledSatellitePath(enrichedObject, context.location, at);
        })
      : [];
    const issSource = issResult.status === "fulfilled"
      ? String(issResult.value.metadata?.source ?? "ISS provider")
      : undefined;
    const issObject: SkyObject | null = issResult.status === "fulfilled"
      ? withSampledSatellitePath({
          ...issResult.value,
          metadata: {
            ...issResult.value.metadata,
            dataMode: issResult.value.metadata?.fallback ? "provider-fallback" : "live-provider",
            provider: issSource,
          },
        }, context.location, at, { minAltitudeDeg: -12 })
      : null;
    const stars = getBrightStars();
    const fetchedAt = (dependencies.now?.() ?? new Date()).toISOString();
    const provenance = [
      ...(planets.length ? [{ source: String(planets[0]?.metadata?.source ?? "planet provider"), fetchedAt }] : []),
      { source: "Hipparcos/IAU named bright-star static subset", fetchedAt },
      ...(satellitesResult.status === "fulfilled"
        ? [{
            source: satellitesResult.value.stale ? "CelesTrak stale TLE cache" : "CelesTrak active TLE catalog",
            fetchedAt: satellitesResult.value.fetchedAt,
          }]
        : []),
      ...(issSource ? [{ source: issSource, fetchedAt }] : []),
    ];

    return {
      location: context.location,
      timestampUtc: at.toISOString(),
      planets,
      stars,
      satellites,
      iss: issObject,
      moon: DEMO_MOON,
      constellations: [],
      meteorShowers: [],
      provenance,
    };
  };
}

export const getSkyState = createSkyStateService();
