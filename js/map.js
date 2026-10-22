// Leaflet markers, credited basemaps, and road segments with unverified approaches.
let mapInstance = null;
let markersGroup = null;
let routeLineGroup = null;
let activeMarkerId = null;
let currentMapItems = [];
let baseLayerControl = null;
let mapBaseLayers = {};
let userLocationMarker = null;
let routingAttribution = null;

const CATEGORY_COLORS = {
  historical: { bg: "#D97706", icon: "🏛️" },
  nature: { bg: "#2E7D32", icon: "⛰️" },
  ecological: { bg: "#2E7D32", icon: "🌿" },
  cultural: { bg: "#C96F56", icon: "🏰" },
  pilgrimage: { bg: "#7C3AED", icon: "🕌" },
  museums: { bg: "#0EA5E9", icon: "🎨" },
  ethno: { bg: "#D97706", icon: "🛖" },
  crafts: { bg: "#64748B", icon: "🧵" },
};

function mapText(key, fallback) {
  const value = typeof t === "function" ? t(key) : key;
  return value === key ? fallback : value;
}

function watchMapTiles(layer, labelKey) {
  let failedTiles = 0;
  let notified = false;
  layer.on("tileerror", () => {
    failedTiles += 1;
    if (failedTiles >= 3 && !notified && mapInstance.hasLayer(layer)) {
      notified = true;
      emitNavigationStatus("mapTilesError", "warning", {
        layer: mapText(labelKey, labelKey),
      });
    }
  });
  layer.on("tileload", () => {
    failedTiles = 0;
    notified = false;
  });
  return layer;
}

function updateMapLayerControl() {
  if (!mapInstance) return;
  if (baseLayerControl) mapInstance.removeControl(baseLayerControl);
  baseLayerControl = L.control
    .layers(
      {
        [mapText("mapStreet", "Ko‘chalar")]: mapBaseLayers.street,
        [mapText("mapSatellite", "Sun’iy yo‘ldosh")]: mapBaseLayers.satellite,
        [mapText("mapRelief", "Relyef")]: mapBaseLayers.relief,
      },
      null,
      { position: "topleft", collapsed: true },
    )
    .addTo(mapInstance);
  const toggle = baseLayerControl.getContainer().querySelector(".leaflet-control-layers-toggle");
  if (toggle) {
    const label = mapText("mapLayers", "Xarita qatlamlari");
    toggle.title = label;
    toggle.setAttribute("aria-label", label);
  }
}

function updateRoutingAttribution() {
  if (!mapInstance) return;
  if (routingAttribution) mapInstance.attributionControl.removeAttribution(routingAttribution);
  routingAttribution =
    '<a href="https://project-osrm.org/">OSRM</a> / &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' +
    ` · <a href="https://www.openstreetmap.org/fixthemap">${mapText("mapFixMap", "Xaritani tuzatish")}</a>`;
  mapInstance.attributionControl.addAttribution(routingAttribution);
}

function initMapEngine() {
  if (!document.getElementById("map-container") || mapInstance) return;
  if (typeof L === "undefined") {
    emitNavigationStatus("mapTilesError", "warning");
    return;
  }
  mapInstance = L.map("map-container", {
    center: [42.8, 59.8],
    zoom: 7,
    zoomControl: false,
    attributionControl: true,
  });
  // Public tiles: ordinary on-screen browsing only; do not prefetch or disable HTTP caching.
  // https://operations.osmfoundation.org/policies/tiles/
  mapBaseLayers.street = watchMapTiles(
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    }),
    "mapStreet",
  );
  // Attribution and native zoom limits come from these Esri service metadata endpoints.
  // https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer?f=pjson
  // https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer?f=pjson
  mapBaseLayers.satellite = watchMapTiles(
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 19,
        attribution:
          'Source: <a href="https://goto.arcgisonline.com/maps/World_Imagery">Esri</a>, Vantor, Earthstar Geographics, GIS User Community',
      },
    ),
    "mapSatellite",
  );
  mapBaseLayers.relief = watchMapTiles(
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}",
      {
        maxNativeZoom: 13,
        maxZoom: 19,
        attribution:
          '&copy; <a href="https://goto.arcgisonline.com/maps/World_Shaded_Relief">Esri</a>; elevation: USGS, SRTM, GTOPO30',
      },
    ),
    "mapRelief",
  );
  mapBaseLayers.street.addTo(mapInstance);
  updateMapLayerControl();
  updateRoutingAttribution();
  markersGroup = L.layerGroup().addTo(mapInstance);
  routeLineGroup = L.featureGroup().addTo(mapInstance);
  addNukusCapitalMarker();

  const zoomIn = document.getElementById("btn-map-zoom-in");
  const zoomOut = document.getElementById("btn-map-zoom-out");
  const locBtn = document.getElementById("btn-map-location");
  if (zoomIn) zoomIn.addEventListener("click", () => mapInstance.zoomIn());
  if (zoomOut) zoomOut.addEventListener("click", () => mapInstance.zoomOut());
  if (locBtn)
    locBtn.addEventListener("click", async () => {
      const location = await requestUserLocation();
      if (location) mapInstance.flyTo([location.lat, location.lng], 12);
    });
  window.addEventListener("user-location-ready", (event) => {
    const coords = event.detail;
    if (!isValidRouteCoordinates(coords)) return;
    if (userLocationMarker) mapInstance.removeLayer(userLocationMarker);
    userLocationMarker = L.circleMarker([coords.lat, coords.lng], {
      radius: 7,
      color: "#fff",
      weight: 2,
      fillColor: "#2563eb",
      fillOpacity: 1,
    })
      .addTo(mapInstance)
      .bindTooltip(mapText("myLocation", "Mening joylashuvim"));
  });
  window.addEventListener("destinations-filtered", (event) =>
    renderMapMarkers(event.detail.items),
  );
  window.addEventListener("language-changed", () => {
    updateMapLayerControl();
    updateRoutingAttribution();
    if (userLocationMarker)
      userLocationMarker.setTooltipContent(
        mapText("myLocation", "Mening joylashuvim"),
      );
  });
}

function addNukusCapitalMarker() {
  const icon = L.divIcon({
    html: '<div class="capital-pin"><span aria-hidden="true">★</span></div>',
    className: "custom-nukus-pin",
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
  L.marker([NUKUS_COORDS.lat, NUKUS_COORDS.lng], {
    icon,
    zIndexOffset: 500,
    title: "Nukus",
  })
    .addTo(mapInstance)
    .bindPopup("Nukus");
}

function renderMapMarkers(items) {
  currentMapItems = Array.isArray(items) ? items : [];
  if (!markersGroup) return;
  markersGroup.clearLayers();
  currentMapItems.forEach((item) => {
    if (!isValidRouteCoordinates(item.coordinates)) return;
    const isSelected = item.id === activeMarkerId;
    const style = CATEGORY_COLORS[item.category] || {
      bg: "#0EA5E9",
      icon: "📍",
    };
    const icon = L.divIcon({
      html: `<div class="map-pin${isSelected ? " map-pin--selected" : ""}" style="background-color:${style.bg}"><span class="map-pin__symbol" aria-hidden="true">${style.icon}</span></div>`,
      className: "custom-destination-pin",
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });
    const title =
      typeof getLocalized === "function"
        ? getLocalized(item.name)
        : item.name.uz;
    const marker = L.marker([item.coordinates.lat, item.coordinates.lng], {
      icon,
      title,
      alt: title,
      zIndexOffset: isSelected ? 1000 : 0,
    });
    marker.on("click", () => {
      selectMapDestination(item.id);
      if (typeof selectDestinationById === "function")
        selectDestinationById(item.id, false);
    });
    markersGroup.addLayer(marker);
  });
}

function selectMapDestination(destId) {
  const changed = activeMarkerId !== destId;
  activeMarkerId = destId;
  renderMapMarkers(currentMapItems);
  if (changed) clearRoutePolyline();
}

function drawRoutePolyline(geometry, destCoords, routeMeta = {}) {
  if (!routeLineGroup || !isValidRouteCoordinates(destCoords)) return;
  routeLineGroup.clearLayers();
  const hasGeometry = isValidRouteGeometry(geometry);
  const meta = { ...((geometry && geometry.routing) || {}), ...routeMeta };
  const origin = isValidRouteCoordinates(meta.originCoordinates)
    ? meta.originCoordinates
    : NUKUS_COORDS;
  const isStraightLine = !hasGeometry || Boolean(meta.isStraightLine);
  const points = hasGeometry
    ? geometry.coordinates.map((pt) => [pt[1], pt[0]])
    : [
        [origin.lat, origin.lng],
        [destCoords.lat, destCoords.lng],
      ];
  const routeLine = L.polyline(points, {
    color: isStraightLine ? "#b7791f" : "#0d9488",
    weight: 4,
    opacity: 0.9,
    dashArray: isStraightLine ? "7, 7" : null,
  });
  const distance = isStraightLine ? meta.distanceKm : meta.roadDistanceKm;
  if (Number.isFinite(distance)) {
    routeLine.bindTooltip(
      () => `${mapText(isStraightLine ? "straightLineDistance" : "mappedRoadDistance", "Masofa")}: ${distance} km`,
    );
  }
  routeLineGroup.addLayer(routeLine);
  if (!isStraightLine) {
    const first = points[0];
    const last = points[points.length - 1];
    const endGap = calculateHaversine(
      last[0],
      last[1],
      destCoords.lat,
      destCoords.lng,
    );
    const startGap = calculateHaversine(
      origin.lat,
      origin.lng,
      first[0],
      first[1],
    );
    if (endGap > ROUTE_APPROACH_THRESHOLD_KM) {
      routeLineGroup.addLayer(
        L.polyline([last, [destCoords.lat, destCoords.lng]], {
          color: "#b7791f",
          weight: 3,
          opacity: 0.9,
          dashArray: "7, 7",
        }).bindTooltip(
          () => `${mapText("routeApproachDistance", "Yo'l nuqtasidan obyektgacha")}: ${endGap.toFixed(3)} km · ${mapText("straightLineDistance", "To'g'ri chiziq")}`,
        ),
      );
      // The visible road endpoint is distinct from the destination/representative pin.
      routeLineGroup.addLayer(
        L.circleMarker(last, { radius: 5, color: "#0d9488", weight: 2, fillColor: "#fff", fillOpacity: 1 }),
      );
    }
    if (startGap > ROUTE_APPROACH_THRESHOLD_KM) {
      routeLineGroup.addLayer(
        L.polyline([[origin.lat, origin.lng], first], {
          color: "#b7791f",
          weight: 3,
          opacity: 0.9,
          dashArray: "7, 7",
        }),
      );
    }
  }
  if (!hasGeometry) emitNavigationStatus("routeGeometryUnavailable", "warning");
  mapInstance.fitBounds(routeLineGroup.getBounds(), {
    padding: [35, 35],
    maxZoom: 12,
  });
}

function clearRoutePolyline() {
  if (routeLineGroup) routeLineGroup.clearLayers();
}

function centerMapOn(lat, lng, zoom = 9) {
  if (mapInstance && isValidRouteCoordinates({ lat, lng }))
    mapInstance.flyTo([lat, lng], zoom, { duration: 1 });
}
