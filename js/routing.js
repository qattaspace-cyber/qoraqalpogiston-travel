// Static Nukus routes and opt-in GPS routing. Road coverage never implies access to the pin.
const NUKUS_COORDS = Object.freeze({ lat: 42.4602, lng: 59.6166 });
const ROUTING_CACHE_VERSION = 2;
const ROUTE_APPROACH_THRESHOLD_KM = 0.1;
const ROUTE_CACHE_MAX_AGE_MS = 30 * 86400000;
let userLocation = null;
let precomputedRoutingIndex = {};
let routingSettings = Object.freeze({ liveRoutingEnabled: false, endpoint: null });
let pendingLocationRequest = null;
const liveRouteRequests = new Map();
const liveRouteCache = new Map();
const routeGeometryRequests = new Map();
let nextLiveRouteStart = 0;

// Space optional provider requests. The public site never calls the demo by default.
// https://github.com/Project-OSRM/osrm-backend/wiki/Demo-server
function reserveLiveRouteSlot() {
  const now = Date.now();
  const delay = Math.max(0, nextLiveRouteStart - now);
  nextLiveRouteStart = now + delay + 1100;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

// Endpoint is the configured provider's HTTPS /route/v1/driving base, without coordinates.
// The public site uses its static Nukus cache and external navigation unless explicitly enabled.
function configureRouting(settings = {}) {
  if (!settings || typeof settings !== "object") settings = {};
  let endpoint = null;
  if (typeof settings.endpoint === "string" && settings.endpoint.trim()) {
    try {
      const url = new URL(settings.endpoint.trim());
      if (url.protocol === "https:" && !url.username && !url.password && !url.search && !url.hash &&
        /\/route\/v1\/driving\/?$/.test(url.pathname)) {
        endpoint = url.href.replace(/\/+$/, "");
      }
    } catch (_) { /* An invalid provider URL leaves live routing disabled. */ }
  }
  routingSettings = Object.freeze({ liveRoutingEnabled: settings.liveRoutingEnabled === true && Boolean(endpoint), endpoint });
  liveRouteCache.clear();
  return routingSettings;
}

function emitNavigationStatus(key, level = "info", params = {}) {
  window.dispatchEvent(new CustomEvent("navigation-status", { detail: { key, level, params } }));
}

function isValidRouteCoordinates(coords) {
  return Boolean(coords && Number.isFinite(coords.lat) && Number.isFinite(coords.lng) &&
    Math.abs(coords.lat) <= 90 && Math.abs(coords.lng) <= 180);
}

function sameRouteCoordinates(first, second) {
  return isValidRouteCoordinates(first) && isValidRouteCoordinates(second) &&
    Math.abs(first.lat - second.lat) < 0.000001 && Math.abs(first.lng - second.lng) < 0.000001;
}

function isValidRouteGeometry(geometry) {
  return Boolean(geometry && geometry.type === "LineString" &&
    Array.isArray(geometry.coordinates) && geometry.coordinates.length >= 2 &&
    geometry.coordinates.every((point) => Array.isArray(point) && point.length >= 2 &&
      Number.isFinite(point[0]) && Number.isFinite(point[1]) &&
      Math.abs(point[0]) <= 180 && Math.abs(point[1]) <= 90));
}

function isRouteCacheStale(route) {
  const fetchedAt = Date.parse(route && route.fetchedAt);
  const expiresAt = Date.parse(route && route.expiresAt);
  const now = Date.now();
  return !Number.isFinite(fetchedAt) || fetchedAt > now ||
    now >= (Number.isFinite(expiresAt) ? expiresAt : fetchedAt + ROUTE_CACHE_MAX_AGE_MS);
}

async function initRoutingCache() {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 7000);
  try {
    const res = await fetch("data/routing/index.json", { signal: controller.signal, cache: "no-cache" });
    if (!res.ok) throw new Error(`Routing cache HTTP ${res.status}`);
    const index = await res.json();
    if (!index || typeof index !== "object" || Array.isArray(index)) throw new Error("Invalid routing index");
    precomputedRoutingIndex = index;
    routeGeometryRequests.clear();
  } catch (err) {
    // Keep a previously loaded successful index if a manual reload fails.
    console.warn("Routing cache unavailable:", err.message);
    emitNavigationStatus("routingCacheUnavailable", "warning");
  } finally {
    clearTimeout(timeoutId);
  }
}

// Called only after a visitor presses a location button. GPS stays in this page's memory.
function requestUserLocation() {
  if (pendingLocationRequest) return pendingLocationRequest;
  if (!window.isSecureContext) {
    emitNavigationStatus("gpsInsecure", "warning");
    return Promise.resolve(null);
  }
  if (!navigator.geolocation) {
    emitNavigationStatus("gpsUnavailable", "warning");
    return Promise.resolve(null);
  }
  pendingLocationRequest = new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition((pos) => {
      const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      if (!isValidRouteCoordinates(coords)) {
        emitNavigationStatus("gpsFailure", "warning");
        resolve(null);
        return;
      }
      userLocation = { ...coords, accuracyMeters: pos.coords.accuracy };
      window.dispatchEvent(new CustomEvent("user-location-ready", { detail: userLocation }));
      resolve(userLocation);
    }, (err) => {
      const key = err.code === 1 ? "gpsDenied" : err.code === 3 ? "gpsTimeout" : "gpsFailure";
      emitNavigationStatus(key, "warning");
      resolve(null);
    }, { timeout: 10000, maximumAge: 60000, enableHighAccuracy: true });
  }).catch(() => {
    emitNavigationStatus("gpsFailure", "warning");
    return null;
  }).finally(() => { pendingLocationRequest = null; });
  return pendingLocationRequest;
}

function initUserLocation() {
  return requestUserLocation();
}

function isValidCachedRoute(route, destination) {
  return Boolean(route && route.cacheVersion === ROUTING_CACHE_VERSION &&
    sameRouteCoordinates(route.originCoordinates, NUKUS_COORDS) &&
    sameRouteCoordinates(route.targetCoordinates, destination.coordinates) &&
    route.coordinateType === destination.coordinateType &&
    route.requiresFourByFour === Boolean(destination.access && destination.access.fourByFour) &&
    Number.isFinite(route.distanceKm) && route.distanceKm >= 0 &&
    Number.isFinite(route.approachDistanceKm) && route.approachDistanceKm >= 0 &&
    Number.isFinite(route.originApproachDistanceKm) && route.originApproachDistanceKm >= 0 &&
    typeof route.isPartial === "boolean" &&
    typeof route.isStraightLine === "boolean" &&
    (route.isStraightLine || (route.roadDistanceKm === route.distanceKm &&
      Number.isFinite(route.durationMin) && route.durationMin >= 0)) &&
    isValidRouteCoordinates(route.routeStartCoordinates) && isValidRouteCoordinates(route.routeEndCoordinates));
}

async function getDestinationRouting(destination) {
  if (!destination || !isValidRouteCoordinates(destination.coordinates)) {
    emitNavigationStatus("routeUnavailable", "warning");
    return { nukus: null, user: null };
  }
  const cached = precomputedRoutingIndex[destination.id];
  const origin = userLocation ? { ...userLocation } : null;
  const [nukus, user] = await Promise.all([
    isValidCachedRoute(cached, destination) && !cached.isStraightLine ?
      Promise.resolve({ ...cached, cacheStale: isRouteCacheStale(cached) }) :
      fetchLiveOSRMRoute(NUKUS_COORDS, destination.coordinates, destination),
    origin ? fetchLiveOSRMRoute(origin, destination.coordinates, destination) : Promise.resolve(null)
  ]);
  return { nukus, user };
}

function describeRoute(route, fromCoords, toCoords, destination, isStraightLine = false, provider = {}) {
  const geometry = route.geometry;
  const endpoint = geometry.coordinates[geometry.coordinates.length - 1];
  const routeEndCoordinates = { lat: endpoint[1], lng: endpoint[0] };
  const firstPoint = geometry.coordinates[0];
  const routeStartCoordinates = { lat: firstPoint[1], lng: firstPoint[0] };
  const approachDistanceKm = isStraightLine ? 0 : Number(calculateHaversine(
    routeEndCoordinates.lat, routeEndCoordinates.lng, toCoords.lat, toCoords.lng).toFixed(3));
  const originApproachDistanceKm = isStraightLine ? 0 : Number(calculateHaversine(
    fromCoords.lat, fromCoords.lng, routeStartCoordinates.lat, routeStartCoordinates.lng).toFixed(3));
  const isPartial = !isStraightLine && (approachDistanceKm > ROUTE_APPROACH_THRESHOLD_KM ||
    originApproachDistanceKm > ROUTE_APPROACH_THRESHOLD_KM);
  const coordinateType = destination.coordinateType === "exact" ? "exact" : "representative";
  const verification = destination.coordinateVerification || {};
  const fetchedAt = isStraightLine ? null : new Date().toISOString();
  const metadata = {
    cacheVersion: ROUTING_CACHE_VERSION,
    distanceKm: isStraightLine ? route.distanceKm : Number((route.distance / 1000).toFixed(1)),
    roadDistanceKm: isStraightLine ? null : Number((route.distance / 1000).toFixed(1)),
    distanceMeters: isStraightLine ? null : route.distance,
    durationMin: isStraightLine ? null : Math.round(route.duration / 60),
    durationSeconds: isStraightLine ? null : route.duration,
    durationIsEstimate: !isStraightLine,
    expeditionDurationMin: null,
    requiresFourByFour: Boolean(destination.access && destination.access.fourByFour),
    routeType: isStraightLine ? "straight-line" : "road",
    source: isStraightLine ? "Haversine straight-line" : "OSRM / OpenStreetMap",
    routeSelection: isStraightLine ? null : "provider-recommended-fastest-driving",
    providerUrl: isStraightLine ? null : provider.endpoint || null,
    providerDataVersion: isStraightLine ? null : provider.dataVersion || null,
    fetchedAt,
    expiresAt: fetchedAt ? new Date(Date.parse(fetchedAt) + 300000).toISOString() : null,
    cacheStale: false,
    isStraightLine,
    approachDistanceKm,
    originApproachDistanceKm,
    isPartial,
    coordinateType,
    coordinateVerificationStatus: verification.status || "not-reviewed",
    targetPointVerified: verification.pointPublicationVerified === true,
    entranceVerified: verification.entranceVerified === true,
    accessVerified: false,
    isApproximate: isStraightLine || isPartial || coordinateType !== "exact" || Boolean(destination.approximate) ||
      verification.pointPublicationVerified !== true,
    originCoordinates: { lat: fromCoords.lat, lng: fromCoords.lng },
    targetCoordinates: { lat: toCoords.lat, lng: toCoords.lng },
    routeStartCoordinates,
    routeEndCoordinates
  };
  return { ...metadata, geometry: { ...geometry, routing: metadata } };
}

function buildStraightLineRoute(fromCoords, toCoords, destination, reason) {
  const geometry = { type: "LineString", coordinates: [[fromCoords.lng, fromCoords.lat], [toCoords.lng, toCoords.lat]] };
  const route = describeRoute({ geometry, distanceKm: Number(calculateHaversine(
    fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng).toFixed(1)) }, fromCoords, toCoords, destination, true);
  return { ...route, fallbackReason: reason };
}

async function fetchLiveOSRMRoute(fromCoords, toCoords, destination) {
  if (!routingSettings.liveRoutingEnabled || !routingSettings.endpoint) {
    return buildStraightLineRoute(fromCoords, toCoords, destination, "provider-not-configured");
  }
  const endpoint = routingSettings.endpoint;
  const cacheKey = [destination.id, fromCoords.lat, fromCoords.lng, toCoords.lat, toCoords.lng,
    destination.coordinateType, Boolean(destination.access && destination.access.fourByFour), endpoint].join(":");
  const cached = liveRouteCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.route;
  if (liveRouteRequests.has(cacheKey)) return liveRouteRequests.get(cacheKey);
  const request = (async () => {
    await reserveLiveRouteSlot();
    if (!routingSettings.liveRoutingEnabled || routingSettings.endpoint !== endpoint) {
      return buildStraightLineRoute(fromCoords, toCoords, destination, "provider-not-configured");
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);
    try {
      if (navigator.onLine === false) throw new Error("Offline");
      // OSRM uses longitude,latitude. Its road may stop far from the requested point.
      const url = `${endpoint}/${fromCoords.lng},${fromCoords.lat};${toCoords.lng},${toCoords.lat}?overview=full&geometries=geojson&alternatives=false&steps=false&generate_hints=false`;
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
      const data = await res.json();
      const route = data.routes && data.routes[0];
      if (data.code !== "Ok" || !route || !Number.isFinite(route.distance) || route.distance < 0 ||
        !Number.isFinite(route.duration) || route.duration < 0 || !isValidRouteGeometry(route.geometry)) {
        throw new Error("No usable road route");
      }
      return describeRoute(route, fromCoords, toCoords, destination, false, {
        endpoint,
        dataVersion: typeof data.data_version === "string" ? data.data_version : null,
      });
    } catch (err) {
      console.warn("Road route unavailable:", err.message);
      if (cached && !cached.route.isStraightLine) {
        return { ...cached.route, cacheStale: true, refreshError: err.message };
      }
      return buildStraightLineRoute(fromCoords, toCoords, destination, navigator.onLine === false ? "offline" : "road-route-unavailable");
    } finally {
      clearTimeout(timeoutId);
    }
  })();
  liveRouteRequests.set(cacheKey, request);
  try {
    const route = await request;
    if (liveRouteCache.size >= 64) liveRouteCache.delete(liveRouteCache.keys().next().value);
    liveRouteCache.set(cacheKey, { route, expiresAt: Date.now() + (route.isStraightLine || route.cacheStale ? 15000 : 300000) });
    return route;
  } finally {
    liveRouteRequests.delete(cacheKey);
  }
}

async function getRouteGeometry(destId, fallbackGeometry) {
  // Live geometry takes priority over an older static route for the same id.
  if (isValidRouteGeometry(fallbackGeometry)) return fallbackGeometry;
  if (!routeGeometryRequests.has(destId)) {
    const request = (async () => {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 7000);
      try {
        const res = await fetch(`data/routing/geometry/${encodeURIComponent(destId)}.json`, { signal: controller.signal, cache: "no-cache" });
        if (!res.ok) throw new Error(`Geometry HTTP ${res.status}`);
        const geometry = await res.json();
        const route = precomputedRoutingIndex[destId];
        const last = isValidRouteGeometry(geometry) ? geometry.coordinates[geometry.coordinates.length - 1] : null;
        const first = last ? geometry.coordinates[0] : null;
        if (!last || !route || !geometry.routing || geometry.routing.cacheVersion !== ROUTING_CACHE_VERSION ||
          geometry.routing.isStraightLine !== route.isStraightLine ||
          geometry.routing.roadDistanceKm !== route.roadDistanceKm ||
          geometry.routing.fetchedAt !== route.fetchedAt ||
          !sameRouteCoordinates(geometry.routing.originCoordinates, route.originCoordinates) ||
          !sameRouteCoordinates(geometry.routing.targetCoordinates, route.targetCoordinates) ||
          !sameRouteCoordinates({ lat: first[1], lng: first[0] }, route.routeStartCoordinates) ||
          !sameRouteCoordinates({ lat: last[1], lng: last[0] }, route.routeEndCoordinates)) {
          throw new Error("Invalid or outdated route geometry");
        }
        return geometry;
      } catch (err) {
        console.warn("Route geometry unavailable:", err.message);
        return null;
      } finally {
        clearTimeout(timeoutId);
      }
    })();
    routeGeometryRequests.set(destId, request);
    request.then((geometry) => { if (!geometry) routeGeometryRequests.delete(destId); });
  }
  return routeGeometryRequests.get(destId);
}

// Coordinate links: use supplied GPS coordinates or the static route's Nukus origin.
// The external map provider determines road availability and navigation support.
// https://developers.google.com/maps/documentation/urls/get-started
// https://yandex.ru/dev/yandex-apps-launch-maps/doc/ru/concepts/yandexmaps-web
function buildNavigationLinks(destination, origin) {
  if (!destination || !isValidRouteCoordinates(destination.coordinates)) return { google: null, yandex: null };
  const target = `${destination.coordinates.lat},${destination.coordinates.lng}`;
  const startCoordinates = isValidRouteCoordinates(origin) ? origin : NUKUS_COORDS;
  const start = `${startCoordinates.lat},${startCoordinates.lng}`;
  const google = new URL("https://www.google.com/maps/dir/");
  google.search = new URLSearchParams({ api: "1", origin: start, destination: target, travelmode: "driving", dir_action: "navigate" });
  const yandex = new URL("https://yandex.ru/maps/");
  yandex.search = new URLSearchParams({ mode: "routes", rtext: `${start}~${target}`, rtt: "auto" });
  return { google: google.href, yandex: yandex.href };
}

function calculateHaversine(lat1, lon1, lat2, lon2) {
  const toRadians = Math.PI / 180;
  const dLat = (lat2 - lat1) * toRadians;
  const dLon = (lon2 - lon1) * toRadians;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * toRadians) * Math.cos(lat2 * toRadians) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(Math.min(1, a)), Math.sqrt(Math.max(0, 1 - a)));
}

function formatRouteTime(minutes, lang = "uz") {
  if (!Number.isFinite(minutes) || minutes <= 0) return "";
  const totalMinutes = Math.round(minutes);
  const hrs = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const hrLabels = { uz: "soat", kaa: "saat", ru: "ч.", en: "hrs" };
  const minLabels = { uz: "daqiqa", kaa: "minut", ru: "мин", en: "min" };
  const hrUnit = hrLabels[lang] || hrLabels.uz;
  const minUnit = minLabels[lang] || minLabels.uz;
  return hrs > 0 ? `${hrs} ${hrUnit}${mins ? ` ${mins} ${minUnit}` : ""}` : `${totalMinutes} ${minUnit}`;
}
