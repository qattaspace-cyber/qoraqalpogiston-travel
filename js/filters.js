// Shared category, district, distance, search and saved-place filters.
let allDestinations = [];
let activeCategories = new Set();
let activeDistrict = "all";
let activeDistanceRange = "all";
let activeFavoritesOnly = false;
const boundFilterControls = new WeakSet();

function initFilters(destinationsList, categoriesList, districtsList) {
  allDestinations = destinationsList;

  // Render Category checkboxes in Left Panel
  renderCategoryFilters(categoriesList);

  // Render Districts Dropdown
  renderDistrictDropdown(districtsList);

  // Setup Event Listeners
  setupFilterListeners();
}

function renderCategoryFilters(categories) {
  const container = document.getElementById("category-filters-container");
  if (!container) return;

  container.innerHTML = "";

  categories.forEach((cat) => {
    // Count how many destinations in this category
    const count = allDestinations.filter((d) => d.category === cat.id).length;

    const row = document.createElement("label");
    row.className = "category-option";

    const label = document.createElement("div");
    label.className = "category-label";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = cat.id;
    checkbox.className = "category-checkbox category-input";
    checkbox.checked = activeCategories.has(cat.id);
    const icon = document.createElement("span");
    icon.setAttribute("aria-hidden", "true");
    icon.textContent = cat.emoji || "";
    const name = document.createElement("span");
    name.textContent = getLocalized(cat.name);
    label.append(checkbox, icon, name);
    const countLabel = document.createElement("span");
    countLabel.className = "category-count";
    countLabel.textContent = String(count);
    row.append(label, countLabel);
    checkbox.addEventListener("change", (e) => {
      if (e.target.checked) {
        activeCategories.add(cat.id);
      } else {
        activeCategories.delete(cat.id);
      }
      applyAllFilters();
    });

    container.appendChild(row);
  });
}

function renderDistrictDropdown(districts) {
  const select = document.getElementById("district-select");
  if (!select) return;

  select.innerHTML = "";
  districts.forEach((dist) => {
    const opt = document.createElement("option");
    opt.value = dist.id;
    opt.textContent = getLocalized(dist.name);
    select.appendChild(opt);
  });

  select.value = activeDistrict;
  if (select.value !== activeDistrict) {
    activeDistrict = "all";
    select.value = activeDistrict;
  }
}

function setupFilterListeners() {
  const districtSelect = document.getElementById("district-select");
  bindFilterControl(districtSelect, "change", (e) => {
    activeDistrict = e.target.value;
    applyAllFilters();
  });

  // Distance Filter
  const distanceSelect = document.getElementById("distance-filter-select");
  bindFilterControl(distanceSelect, "change", (e) => {
    activeDistanceRange = e.target.value;
    applyAllFilters();
  });

  // Clear Filters button
  const clearBtn = document.getElementById("btn-clear-filters");
  bindFilterControl(clearBtn, "click", () => {
    resetFilters();
  });
}

function bindFilterControl(element, eventName, listener) {
  if (!element || boundFilterControls.has(element)) return;
  element.addEventListener(eventName, listener);
  boundFilterControls.add(element);
}

function setFavoritesOnly(enabled) {
  activeFavoritesOnly = Boolean(enabled);
  applyAllFilters();
}

function resetFilters() {
  activeCategories.clear();
  activeDistrict = "all";
  activeDistanceRange = "all";
  activeFavoritesOnly = false;

  document.querySelectorAll(".category-checkbox").forEach((cb) => (cb.checked = false));

  const distSelect = document.getElementById("district-select");
  if (distSelect) distSelect.value = "all";

  const distRangeSelect = document.getElementById("distance-filter-select");
  if (distRangeSelect) distRangeSelect.value = "all";

  const searchInput = document.getElementById("map-search-input");
  if (searchInput) searchInput.value = "";

  applyAllFilters();
}

// Normalize only the comparison text; original destination content stays intact.
function normalizeSearchText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/['\u2018\u2019\u02bb\u02bc`\u00b4]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

function getDestinationDistance(destination) {
  if (typeof precomputedRoutingIndex === "undefined") return null;
  const route = precomputedRoutingIndex[destination.id];
  if (!route || route.isStraightLine || typeof route.distanceKm !== "number" ||
    (typeof isValidCachedRoute === "function" && !isValidCachedRoute(route, destination))) return null;
  return Number.isFinite(route.distanceKm) && route.distanceKm >= 0 ? route.distanceKm : null;
}

function matchesDistanceRange(distanceKm) {
  if (activeDistanceRange === "all") return true;
  if (distanceKm === null) return false;
  if (activeDistanceRange === "50") return distanceKm < 50;
  if (activeDistanceRange === "150") return distanceKm >= 50 && distanceKm < 150;
  if (activeDistanceRange === "300") return distanceKm >= 150 && distanceKm <= 300;
  if (activeDistanceRange === "remote") return distanceKm > 300;
  return true;
}

function getFilteredDestinations() {
  const searchInput = document.getElementById("map-search-input");
  const query = normalizeSearchText(searchInput ? searchInput.value : "");
  const favorites = new Set(activeFavoritesOnly ? getFavorites() : []);

  return allDestinations.filter((d) => {
    if (activeFavoritesOnly && !favorites.has(d.id)) return false;

    // 1. Category Filter (if none selected, shows all)
    if (activeCategories.size > 0 && !activeCategories.has(d.category)) {
      return false;
    }

    // 2. District Filter
    if (activeDistrict !== "all" && d.district !== activeDistrict) {
      return false;
    }

    // Cached distance is the mapped road segment from Nukus, not a GPS distance.
    if (!matchesDistanceRange(getDestinationDistance(d))) return false;

    // Search all available translations, including district names.
    if (query !== "") {
      const searchable = [d.name, d.description, d.districtName, d.routeHint]
        .flatMap((value) => typeof value === "string" ? [value] : Object.values(value || {}))
        .filter((value) => typeof value === "string")
        .map(normalizeSearchText)
        .join(" ");
      if (!searchable.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

function applyAllFilters() {
  const filtered = getFilteredDestinations();
  const missingDistanceCount = allDestinations.filter((d) => getDestinationDistance(d) === null).length;
  const partialDistanceCount = filtered.filter((d) => {
    if (typeof precomputedRoutingIndex === "undefined") return false;
    return Boolean(precomputedRoutingIndex[d.id] && precomputedRoutingIndex[d.id].isPartial);
  }).length;

  window.dispatchEvent(new CustomEvent("destinations-filtered", {
    detail: {
      items: filtered,
      favoritesOnly: activeFavoritesOnly,
      distanceRange: activeDistanceRange,
      distanceBasis: "precomputed-nukus",
      missingDistanceCount,
      partialDistanceCount
    }
  }));
}
