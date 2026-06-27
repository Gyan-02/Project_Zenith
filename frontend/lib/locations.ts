export type ObserverLocationPreset = {
  id: string;
  label: string;
  lat: number;
  lon: number;
  elevationM: number;
};

export const OBSERVER_LOCATIONS: ObserverLocationPreset[] = [
  { id: "patna", label: "Patna, India", lat: 25.61, lon: 85.14, elevationM: 53 },
  { id: "new-york", label: "New York, USA", lat: 40.71, lon: -74.01, elevationM: 10 },
  { id: "london", label: "London, UK", lat: 51.51, lon: -0.13, elevationM: 11 },
  { id: "sydney", label: "Sydney, Australia", lat: -33.87, lon: 151.21, elevationM: 58 },
];

export const DEFAULT_OBSERVER_LOCATION: ObserverLocationPreset = OBSERVER_LOCATIONS[0]!;

export function findObserverLocation(id: string): ObserverLocationPreset {
  return OBSERVER_LOCATIONS.find((location) => location.id === id) ?? DEFAULT_OBSERVER_LOCATION;
}
