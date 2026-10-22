const fs = require("fs");
const path = require("path");
const https = require("https");

// Manual data maintenance; this file is never loaded by the public application.
// OSRM returns its recommended fastest mapped car route, not verified site access.
// https://project-osrm.org/docs/v5.24.0/api/#route-service
// Demo: reasonable non-commercial use, <= 1 request/second, no uptime/update guarantee.
// https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server
// Usage: node scripts/precompute-routes.js [--refresh] [--max-age-days=30] [--id=ID]
// A suitable OSRM-compatible provider can be selected with --endpoint=HTTPS_BASE.
const NUKUS = Object.freeze({ lat: 42.4602, lng: 59.6166 });
const CACHE_VERSION = 2;
const APPROACH_THRESHOLD_KM = 0.1;
const REQUEST_INTERVAL_MS = 1100;
const DEFAULT_ENDPOINT = "https://router.project-osrm.org/route/v1/driving";
const rootDir = path.join(__dirname, "..");
const routingDir = path.join(rootDir, "data", "routing");
const geometryDir = path.join(routingDir, "geometry");
const indexPath = path.join(routingDir, "index.json");

function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function writeJSON(file, value) {
  // An interrupted write must not leave half of a JSON document in the public cache.
  const temporary = `${file}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(value, null, 2)}\n`, "utf8");
  fs.renameSync(temporary, file);
}

function readOptions(args) {
  const options = { refresh: false, maxAgeDays: 30, id: null, endpoint: DEFAULT_ENDPOINT };
  for (const arg of args) {
    if (arg === "--refresh") options.refresh = true;
    else if (arg.startsWith("--max-age-days=")) options.maxAgeDays = Number(arg.slice(15));
    else if (arg.startsWith("--id=")) options.id = arg.slice(5);
    else if (arg.startsWith("--endpoint=")) options.endpoint = arg.slice(11);
    else throw new Error(`Unknown option: ${arg}`);
  }
  if (!Number.isFinite(options.maxAgeDays) || options.maxAgeDays <= 0 || options.maxAgeDays > 365) {
    throw new Error("--max-age-days must be greater than 0 and at most 365");
  }
  const endpoint = new URL(options.endpoint);
  if (endpoint.protocol !== "https:" || endpoint.username || endpoint.password || endpoint.search || endpoint.hash ||
      !/\/route\/v1\/driving\/?$/.test(endpoint.pathname)) {
    throw new Error("Endpoint must be an HTTPS /route/v1/driving base without credentials or query parameters");
  }
  options.endpoint = endpoint.href.replace(/\/+$/, "");
  return options;
}

function validCoordinates(coords) {
  return Boolean(coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng) &&
    Math.abs(coords.lat) <= 90 && Math.abs(coords.lng) <= 180);
}

function sameCoordinates(first, second) {
  return validCoordinates(first) && validCoordinates(second) &&
    Math.abs(first.lat - second.lat) < 0.000001 && Math.abs(first.lng - second.lng) < 0.000001;
}

function validGeometry(geometry) {
  return Boolean(geometry && geometry.type === "LineString" && Array.isArray(geometry.coordinates) &&
    geometry.coordinates.length >= 2 && geometry.coordinates.every((point) => Array.isArray(point) &&
      point.length >= 2 && Number.isFinite(point[0]) && Number.isFinite(point[1]) &&
      Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90));
}

function haversine(first, second) {
  const rad = Math.PI / 180;
  const dLat = (second.lat - first.lat) * rad;
  const dLng = (second.lng - first.lng) * rad;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(first.lat * rad) * Math.cos(second.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)));
}

function readPreviousRoad(destination, index) {
  const metadata = index[destination.id];
  if (!metadata || metadata.isStraightLine !== false || !sameCoordinates(metadata.originCoordinates, NUKUS) ||
      !sameCoordinates(metadata.targetCoordinates, destination.coordinates) ||
      !Number.isFinite(metadata.distanceKm) || metadata.distanceKm < 0 ||
      !Number.isFinite(metadata.durationMin) || metadata.durationMin < 0) return null;
  try {
    const geometry = readJSON(path.join(geometryDir, `${destination.id}.json`));
    if (!validGeometry(geometry) || !geometry.routing ||
        !sameCoordinates(geometry.routing.originCoordinates, NUKUS) ||
        !sameCoordinates(geometry.routing.targetCoordinates, destination.coordinates)) return null;
    const first = geometry.coordinates[0];
    const last = geometry.coordinates[geometry.coordinates.length - 1];
    if (!sameCoordinates(metadata.routeStartCoordinates, { lat: first[1], lng: first[0] }) ||
        !sameCoordinates(metadata.routeEndCoordinates, { lat: last[1], lng: last[0] })) return null;
    return { metadata, geometry };
  } catch (_) { return null; }
}

function cacheIsCurrent(previous, destination, options) {
  if (!previous || options.refresh) return false;
  const route = previous.metadata;
  const fetchedAt = Date.parse(route.fetchedAt);
  return route.cacheVersion === CACHE_VERSION && route.coordinateType === destination.coordinateType &&
    route.requiresFourByFour === Boolean(destination.access && destination.access.fourByFour) &&
    route.providerUrl === options.endpoint && route.routeSelection === "provider-recommended-fastest-driving" &&
    Number.isFinite(fetchedAt) && fetchedAt <= Date.now() &&
    Date.now() - fetchedAt < options.maxAgeDays * 86400000;
}

function fetchOSRM(coordinates, endpoint) {
  return new Promise((resolve, reject) => {
    const url = `${endpoint}/${NUKUS.lng},${NUKUS.lat};${coordinates.lng},${coordinates.lat}?overview=full&geometries=geojson&alternatives=false&steps=false&generate_hints=false`;
    let finished = false;
    let timeoutId;
    const finish = (err, result) => {
      if (finished) return;
      finished = true;
      clearTimeout(timeoutId);
      if (err) reject(err); else resolve(result);
    };
    const req = https.get(url, { headers: { "User-Agent": "KarakalpakstanTravel-route-maintenance/3.0" } }, (res) => {
      if (res.statusCode !== 200) {
        res.resume();
        finish(new Error(`OSRM HTTP ${res.statusCode}`));
        return;
      }
      let body = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        body += chunk;
        if (body.length > 10000000) req.destroy(new Error("Route response is too large"));
      });
      res.on("error", (err) => finish(err));
      res.on("end", () => {
        try {
          const data = JSON.parse(body);
          const route = data.routes && data.routes[0];
          if (data.code !== "Ok" || !route || !validGeometry(route.geometry) ||
              !Number.isFinite(route.distance) || route.distance < 0 || !Number.isFinite(route.duration) || route.duration < 0) {
            throw new Error("No usable mapped car route");
          }
          finish(null, { route, dataVersion: typeof data.data_version === "string" ? data.data_version : null });
        } catch (err) { finish(err); }
      });
    });
    timeoutId = setTimeout(() => req.destroy(new Error("OSRM request timed out")), 15000);
    req.on("error", (err) => finish(err));
  });
}

function describeTarget(destination, evidence) {
  return {
    coordinateType: destination.coordinateType === "exact" ? "exact" : "representative",
    coordinateVerificationStatus: evidence ? evidence.status : "not-reviewed",
    targetPointVerified: Boolean(evidence && evidence.pointPublicationVerified === true),
    entranceVerified: Boolean(evidence && evidence.entranceVerified === true),
    // A routing engine and an exact catalog pin do not establish current on-site access.
    accessVerified: false,
    requiresFourByFour: Boolean(destination.access && destination.access.fourByFour),
  };
}

function buildRouteMetadata(destination, route, evidence, options, providerDataVersion, isStraightLine = false) {
  const coords = route.geometry.coordinates;
  const start = { lat: coords[0][1], lng: coords[0][0] };
  const end = { lat: coords[coords.length - 1][1], lng: coords[coords.length - 1][0] };
  const approachDistanceKm = isStraightLine ? 0 : Number(haversine(end, destination.coordinates).toFixed(3));
  const originApproachDistanceKm = isStraightLine ? 0 : Number(haversine(NUKUS, start).toFixed(3));
  const isPartial = !isStraightLine && (approachDistanceKm > APPROACH_THRESHOLD_KM || originApproachDistanceKm > APPROACH_THRESHOLD_KM);
  const target = describeTarget(destination, evidence);
  const fetchedAt = isStraightLine ? null : new Date().toISOString();
  return {
    cacheVersion: CACHE_VERSION,
    distanceKm: isStraightLine ? Number(haversine(NUKUS, destination.coordinates).toFixed(1)) : Number((route.distance / 1000).toFixed(1)),
    roadDistanceKm: isStraightLine ? null : Number((route.distance / 1000).toFixed(1)),
    distanceMeters: isStraightLine ? null : route.distance,
    durationMin: isStraightLine ? null : Math.round(route.duration / 60),
    durationSeconds: isStraightLine ? null : route.duration,
    durationIsEstimate: !isStraightLine,
    expeditionDurationMin: null,
    routeType: isStraightLine ? "straight-line" : "road",
    source: isStraightLine ? "Haversine straight-line" : "OSRM / OpenStreetMap",
    routeSelection: isStraightLine ? null : "provider-recommended-fastest-driving",
    providerUrl: isStraightLine ? null : options.endpoint,
    providerDataVersion: isStraightLine ? null : providerDataVersion,
    fetchedAt,
    expiresAt: fetchedAt ? new Date(Date.parse(fetchedAt) + options.maxAgeDays * 86400000).toISOString() : null,
    isStraightLine,
    approachDistanceKm,
    originApproachDistanceKm,
    isPartial,
    ...target,
    isApproximate: isStraightLine || isPartial || target.coordinateType !== "exact" ||
      Boolean(destination.approximate) || !target.targetPointVerified,
    originCoordinates: { ...NUKUS },
    targetCoordinates: { ...destination.coordinates },
    routeStartCoordinates: start,
    routeEndCoordinates: end,
    geometryPath: `data/routing/geometry/${destination.id}.json`,
  };
}

async function run() {
  const options = readOptions(process.argv.slice(2));
  const destinations = readJSON(path.join(rootDir, "data", "destinations.json"));
  const audit = readJSON(path.join(rootDir, "data", "coordinate-sources.json"));
  const evidence = new Map((audit.records || []).map((record) => [record.destinationId, record]));
  const ids = new Set();
  for (const destination of destinations) {
    if (!/^[a-z0-9-]+$/.test(destination.id) || ids.has(destination.id) || !validCoordinates(destination.coordinates)) {
      throw new Error(`Invalid identity or coordinates: ${destination.id}`);
    }
    ids.add(destination.id);
  }
  if (options.id && !ids.has(options.id)) throw new Error(`Unknown destination: ${options.id}`);
  // A malformed existing index is an error; never replace it with an empty catalog.
  const existing = fs.existsSync(indexPath) ? readJSON(indexPath) : {};
  if (!existing || typeof existing !== "object" || Array.isArray(existing)) throw new Error("Invalid routing index");
  const index = Object.fromEntries(Object.entries(existing).filter(([id]) => ids.has(id)));
  fs.mkdirSync(geometryDir, { recursive: true });
  let refreshed = 0;
  let preserved = 0;
  let fallbacks = 0;
  let attempted = 0;
  for (const destination of destinations) {
    if (options.id && destination.id !== options.id) continue;
    const previous = readPreviousRoad(destination, index);
    if (cacheIsCurrent(previous, destination, options)) continue;
    // Spacing includes failures and the first request of every selected destination.
    if (attempted > 0) await new Promise((resolve) => setTimeout(resolve, REQUEST_INTERVAL_MS));
    attempted += 1;
    let geometry;
    let metadata;
    try {
      const result = await fetchOSRM(destination.coordinates, options.endpoint);
      metadata = buildRouteMetadata(destination, result.route, evidence.get(destination.id), options, result.dataVersion);
      geometry = { ...result.route.geometry, routing: metadata };
      refreshed += 1;
      console.log(`${destination.id}: ${metadata.roadDistanceKm} km mapped road; ${metadata.approachDistanceKm} km unverified approach`);
    } catch (err) {
      const lastRefreshAttemptAt = new Date().toISOString();
      if (previous) {
        // Keep the successful geometry and its real fetch date; failure is not a refresh.
        const target = describeTarget(destination, evidence.get(destination.id));
        metadata = { ...previous.metadata, ...target, lastRefreshAttemptAt, refreshError: err.message };
        metadata.isApproximate = metadata.isPartial || target.coordinateType !== "exact" ||
          Boolean(destination.approximate) || !target.targetPointVerified;
        geometry = { ...previous.geometry, routing: metadata };
        preserved += 1;
        console.warn(`${destination.id}: ${err.message}; preserving the previous mapped road.`);
      } else {
        const route = { geometry: { type: "LineString", coordinates: [
          [NUKUS.lng, NUKUS.lat], [destination.coordinates.lng, destination.coordinates.lat],
        ] } };
        metadata = { ...buildRouteMetadata(destination, route, evidence.get(destination.id), options, null, true),
          lastRefreshAttemptAt, refreshError: err.message, fallbackReason: "road-route-unavailable" };
        geometry = { ...route.geometry, routing: metadata };
        fallbacks += 1;
        console.warn(`${destination.id}: ${err.message}; storing a clearly marked non-drivable straight line.`);
      }
    }
    writeJSON(path.join(geometryDir, `${destination.id}.json`), geometry);
    index[destination.id] = metadata;
    writeJSON(indexPath, index);
  }
  console.log(`${destinations.length} destinations; requested ${attempted}; refreshed ${refreshed}; preserved ${preserved}; straight-line fallbacks ${fallbacks}.`);
  if (preserved || fallbacks) process.exitCode = 1;
}

run().catch((err) => { console.error(err.message); process.exitCode = 1; });
