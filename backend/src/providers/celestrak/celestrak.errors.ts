export class CelestrakUpstreamError extends Error {
  override name = "CelestrakUpstreamError";
}

export class TleParseError extends Error {
  override name = "TleParseError";
}

export class Sgp4PropagationError extends Error {
  override name = "Sgp4PropagationError";
}
