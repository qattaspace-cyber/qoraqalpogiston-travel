// GitHub Pages serves these public datasets; no account tokens or backend are needed.
let appDestinations = [];
let appCategories = [];
let appDistricts = [];
let appRoutes = [];
let appConfig = { routing: { liveRoutingEnabled: false, endpoint: null } };
let startupRequest = null;
let mapStarted = false;
let languageSwitcherBound = false;

async function fetchPublicJSON(file, optional = false) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(file, { signal: controller.signal });
    if (!response.ok) throw new Error(`${file}: HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    if (optional) return null;
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

function setApplicationStatus(key, error = false) {
  const status = document.getElementById("app-status");
  status.hidden = !key;
  status.classList.toggle("status-banner--error", error);
  document.getElementById("app-status-message").textContent = key ? t(key) : "";
  document.getElementById("btn-retry-load").hidden = !error;
}

async function initializeApplication() {
  if (startupRequest) return startupRequest;
  startupRequest = (async () => {
    await loadLocale(currentLang);
    updateAccessibleLabels();
    setApplicationStatus("loading");
    try {
      const [
        destinations,
        categories,
        districts,
        routes,
        configuration,
        coordinateAudit,
      ] = await Promise.all([
        fetchPublicJSON("data/destinations.json"),
        fetchPublicJSON("data/categories.json"),
        fetchPublicJSON("data/districts.json"),
        fetchPublicJSON("data/routes.json", true),
        fetchPublicJSON("data/app-config.json", true),
        fetchPublicJSON("data/coordinate-sources.json", true),
      ]);
      if (
        !Array.isArray(destinations) ||
        !destinations.length ||
        !Array.isArray(categories) ||
        !Array.isArray(districts)
      )
        throw new Error("Invalid public datasets");
      const ids = new Set();
      for (const destination of destinations) {
        if (
          !destination ||
          !destination.id ||
          ids.has(destination.id) ||
          !isValidRouteCoordinates(destination.coordinates)
        )
          throw new Error("Invalid destination identity or coordinates");
        ids.add(destination.id);
        const evidence =
          coordinateAudit && Array.isArray(coordinateAudit.records)
            ? coordinateAudit.records.find(
                (record) => record.destinationId === destination.id,
              )
            : null;
        destination.coordinateVerification = evidence
          ? {
              status: evidence.status,
              sourceUrl: evidence.sourceUrl,
              pointPublicationVerified:
                evidence.pointPublicationVerified === true,
              entranceVerified: evidence.entranceVerified === true,
            }
          : {
              status: "not-reviewed",
              pointPublicationVerified: false,
              entranceVerified: false,
            };
      }
      appDestinations = destinations;
      appCategories = categories;
      appDistricts = districts;
      appRoutes = Array.isArray(routes)
        ? routes.filter(
            (route) =>
              Array.isArray(route.stops) &&
              route.stops.length &&
              route.stops.every((id) => ids.has(id)),
          )
        : [];
      if (configuration && typeof configuration === "object")
        appConfig = configuration;
      configureRouting(appConfig.routing || {});
      await Promise.all([loadMediaStorage(), initRoutingCache()]);
      if (!mapStarted) {
        initMapEngine();
        mapStarted = true;
      }
      initFilters(appDestinations, appCategories, appDistricts);
      initSearch();
      initUI(appDestinations, appRoutes);
      setupLanguageSwitcher();
      applyAllFilters();
      setApplicationStatus(null);
    } catch (error) {
      console.error("Application data could not be loaded:", error);
      setApplicationStatus("loadError", true);
    }
  })();
  try {
    await startupRequest;
  } finally {
    startupRequest = null;
  }
}

function setupLanguageSwitcher() {
  if (languageSwitcherBound) return;
  languageSwitcherBound = true;
  const select = document.getElementById("language-select");
  select.value = currentLang;
  select.addEventListener("change", async (event) => {
    const changed = await loadLocale(event.target.value);
    if (!changed) return;
    renderDistrictDropdown(appDistricts);
    renderCategoryFilters(appCategories);
    applyAllFilters();
  });
}

document.addEventListener("DOMContentLoaded", () => {
  document
    .getElementById("btn-retry-load")
    .addEventListener("click", initializeApplication);
  initializeApplication();
});
