/**
 * GYA-30 – Public barrel for the shared API client foundation.
 *
 * Import from here in all new frontend helpers:
 *   import { apiGetJson, ApiError, buildQuery, getApiBaseUrl } from "../api";
 */

export { getApiBaseUrl } from "./baseUrl";
export { buildQuery } from "./query";
export type { QueryParams, QueryValue } from "./query";
export { apiGetJson, ApiError } from "./http";
