// Views share the same filtered data; navigation responses belong to one selection.
let currentSelectedDestination = null;
let selectedRenderVersion = 0;
let currentViewItems = [];
let visiblePlaceCount = 12;
let currentRoutes = [];
let uiInitialized = false;
let modalContext = null;
let modalReturnFocus = null;
let toastTimer = null;
let renderedCardLanguage = null;
let workspaceResizeFrame = null;
let workspaceResizeObserver = null;

function initUI(destinations, routes = []) {
  currentRoutes = routes;
  currentViewItems = destinations;
  if (!uiInitialized) {
    uiInitialized = true;
    window.addEventListener("destinations-filtered", (event) => {
      const changedItems =
        currentViewItems.map((item) => item.id).join("|") !==
        event.detail.items.map((item) => item.id).join("|");
      currentViewItems = event.detail.items;
      if (changedItems) visiblePlaceCount = 12;
      updateFavoritesViewState(
        event.detail.favoritesOnly,
        currentViewItems.length,
      );
      if (changedItems || renderedCardLanguage !== currentLang ||
          !document.getElementById("popular-cards-container").childElementCount) {
        renderPopularCards(currentViewItems);
      }
      const title = document.getElementById("places-title");
      if (title)
        title.textContent = t(
          event.detail.favoritesOnly
            ? "savedFavorites"
            : "allDestinationsTitle",
        );
      if (!currentViewItems.length) {
        currentSelectedDestination = null;
        selectedRenderVersion++;
        clearRoutePolyline();
        const panel = document.getElementById("right-details-panel");
        panel.classList.add("details-panel--empty");
        panel.replaceChildren(
          createEmptyState(emptyPlacesKey(event.detail.favoritesOnly)),
        );
      } else if (
        !currentSelectedDestination ||
        !currentViewItems.some(
          (item) => item.id === currentSelectedDestination.id,
        )
      ) {
        selectDestinationById(currentViewItems[0].id, false);
      }
    });
    window.addEventListener("favorites-updated", () => {
      updateFavoriteButtons();
      applyAllFilters();
    });
    window.addEventListener("language-changed", () => {
      updateAccessibleLabels();
      renderMapLegend();
      renderRoutes(currentRoutes);
      if (currentSelectedDestination)
        renderRightDetailsPanel(currentSelectedDestination);
      if (modalContext) refreshOpenModal();
      updateFavoriteButtons();
    });
    window.addEventListener("user-location-ready", () => {
      if (currentSelectedDestination)
        renderRightDetailsPanel(currentSelectedDestination);
    });
    window.addEventListener("navigation-status", (event) => {
      showToast(t(event.detail.key, event.detail.params || {}));
    });
    document.getElementById("btn-more-places").addEventListener("click", (event) => {
      const previousCount = visiblePlaceCount;
      visiblePlaceCount += 12;
      renderPopularCards(currentViewItems);
      if (event.detail === 0) {
        const nextCard = document.getElementById("popular-cards-container")
          .children[previousCount];
        if (nextCard) nextCard.querySelector(".place-card__open").focus();
      }
    });
    document
      .getElementById("btn-show-all")
      .addEventListener("click", resetFilters);
    document
      .getElementById("btn-exit-filter")
      .addEventListener("click", resetFilters);
    document
      .getElementById("btn-clear-route")
      .addEventListener("click", clearRoutePolyline);
    document.querySelectorAll("[data-action]").forEach((button) =>
      button.addEventListener("click", () => {
        const action = button.dataset.action;
        if (action === "favorites") {
          const enableFavorites = !activeFavoritesOnly;
          resetFilters();
          if (enableFavorites) setFavoritesOnly(true);
          scrollToSection("popular-destinations-section");
        } else if (action === "sources") openSourcesModal();
        else openInformationModal(action);
      }),
    );
    setupWorkspacePanels();
    setupModal();
  }
  renderMapLegend();
  renderRoutes(routes);
  updateAccessibleLabels();
  updateFavoriteButtons();
  document.getElementById("atlas-count-places").textContent = String(destinations.length);
  document.getElementById("atlas-count-categories").textContent = String(appCategories.length);
  const url = new URL(window.location.href);
  const requested = destinations.find(
    (item) => item.id === url.searchParams.get("place"),
  );
  const preferred =
    requested ||
    destinations.find((item) => item.id === "07-ayaz-qala-i") ||
    destinations[0];
  if (preferred) selectDestinationById(preferred.id, Boolean(requested));
}

function createEmptyState(key) {
  const element = document.createElement("div");
  element.className = "empty-state";
  const message = document.createElement("p");
  message.textContent = t(key);
  const showAll = document.createElement("button");
  showAll.type = "button";
  showAll.className = "button button--secondary";
  showAll.textContent = t("showAll");
  showAll.addEventListener("click", resetFilters);
  element.append(message, showAll);
  return element;
}

function updateFavoritesViewState(enabled, count) {
  document.querySelectorAll('[data-action="favorites"]').forEach((button) => {
    button.setAttribute("aria-pressed", String(enabled));
  });
  const status = document.getElementById("filter-status");
  status.hidden = !enabled;
  document.getElementById("filter-status-message").textContent = enabled
    ? `${t("favoritesOnlyActive")} · ${t("placesFound", { count })}`
    : "";
}

function emptyPlacesKey(favoritesOnly) {
  const savedCount = getFavorites().filter((id) =>
    allDestinations.some((destination) => destination.id === id),
  ).length;
  return favoritesOnly && !savedCount ? "noSavedPlaces" : "noResults";
}

function updateAccessibleLabels() {
  document.querySelectorAll("[data-i18n-title]").forEach((element) => {
    const label = t(element.dataset.i18nTitle);
    element.title = label;
    element.setAttribute("aria-label", label);
  });
  updateWorkspacePanelControls();
}

function scheduleWorkspaceMapResize() {
  if (workspaceResizeFrame !== null) cancelAnimationFrame(workspaceResizeFrame);
  workspaceResizeFrame = requestAnimationFrame(() => {
    workspaceResizeFrame = null;
    if (typeof mapInstance !== "undefined" && mapInstance) {
      mapInstance.invalidateSize({ pan: false, debounceMoveend: true });
    }
  });
}

function updateWorkspacePanelControls() {
  document.querySelectorAll("[data-panel-toggle]").forEach((button) => {
    const panel = document.getElementById(button.getAttribute("aria-controls"));
    if (!panel) return;
    const expanded = !panel.hidden;
    const kind = button.dataset.panelToggle === "filters" ? "Filters" : "Details";
    const key = `${expanded ? "hide" : "show"}${kind}`;
    const label = t(key);
    button.dataset.i18nAriaLabel = key;
    button.setAttribute("aria-expanded", String(expanded));
    button.setAttribute("aria-label", label);
    button.title = label;
    button.querySelector("[data-panel-label]").textContent = label;
    button.querySelector(".panel-toggle__arrow").textContent = expanded ? "−" : "+";
  });
}

function setWorkspacePanelState(name, expanded) {
  if (name !== "filters" && name !== "details") return;
  const panel = document.getElementById(
    name === "filters" ? "filters-panel" : "right-details-panel",
  );
  const workspace = document.querySelector(".workspace");
  if (!panel || !workspace) return;
  if (!expanded && panel.contains(document.activeElement)) {
    document.querySelector(`[data-panel-toggle="${name}"]`).focus();
  }
  panel.hidden = !expanded;
  workspace.classList.toggle(`workspace--${name}-collapsed`, !expanded);
  updateWorkspacePanelControls();
  scheduleWorkspaceMapResize();
}

function setupWorkspacePanels() {
  document.querySelectorAll("[data-panel-toggle]").forEach((button) => {
    button.addEventListener("click", () => {
      const panel = document.getElementById(button.getAttribute("aria-controls"));
      if (panel) setWorkspacePanelState(button.dataset.panelToggle, panel.hidden);
    });
  });
  const mapContainer = document.getElementById("map-container");
  if (typeof ResizeObserver !== "undefined" && mapContainer) {
    workspaceResizeObserver = new ResizeObserver(scheduleWorkspaceMapResize);
    workspaceResizeObserver.observe(mapContainer);
  } else {
    window.addEventListener("resize", scheduleWorkspaceMapResize);
  }
  updateWorkspacePanelControls();
  scheduleWorkspaceMapResize();
}

function scrollToSection(id) {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.getElementById(id).scrollIntoView({
    behavior: reducedMotion ? "instant" : "smooth",
    block: "start",
  });
}

function getCategoryName(id) {
  const category = appCategories.find((item) => item.id === id);
  return category ? getLocalized(category.name) : id;
}

function coordinateNotice(destination) {
  if (destination.coordinateType !== "exact" || destination.approximate)
    return t("coordinatesApproximate");
  if (
    !destination.coordinateVerification ||
    !destination.coordinateVerification.pointPublicationVerified
  )
    return t("coordinatesUnverified");
  return "";
}

function getHeritageLabel(value) {
  if (value && typeof value === "object") return getLocalized(value);
  const labels = {
    "UNESCO Tentative": "heritageUNESCOTentative",
    "UNESCO Tentative (2025)": "heritageUNESCOTentative2025",
    "Madaniy meros": "heritageCultural",
    "Tarixiy nekropol": "heritageNecropolis",
    "Oltin O'rda me'morchiligi": "heritageGoldenHorde",
    "Ipak Yo'li merosi": "heritageSilkRoad",
    "Ustyurt qal'asi": "heritageUstyurtFortress",
    "Ziyoratgoh": "heritagePilgrimage",
    "Muqaddas qadamjo": "heritageSacred",
    "Xalqaro ahamiyatga ega ornitologik hudud": "heritageBirdArea",
    "UNESCO Biosphere Reserve (2021)": "heritageBiosphere",
    "Jahonga mashhur 'Sahrodagi Luvr'": "heritageSavitsky",
  };
  return labels[value] ? t(labels[value]) : String(value || "");
}

function renderMapLegend() {
  const container = document.getElementById("map-legend");
  container.replaceChildren();
  appCategories.forEach((category) => {
    const label = document.createElement("span");
    const dot = document.createElement("i");
    dot.style.backgroundColor =
      (CATEGORY_COLORS[category.id] || {}).bg || "#0f766e";
    dot.setAttribute("aria-hidden", "true");
    label.append(dot, document.createTextNode(getLocalized(category.name)));
    container.append(label);
  });
}

function createFavoriteButton(destination, id) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "favorite-button";
  if (id) button.id = id;
  button.dataset.favoriteId = destination.id;
  button.setAttribute("aria-label", t("toggleFavorite"));
  const saved = isFavorite(destination.id);
  button.setAttribute("aria-pressed", String(saved));
  button.textContent = saved ? "♥" : "♡";
  button.addEventListener("click", (event) => {
    event.stopPropagation();
    const wasFocused = document.activeElement === button;
    const originalPanel = button.closest(".details-panel, .modal-gallery");
    toggleFavorite(destination.id);
    if (wasFocused && !button.isConnected && document.activeElement === document.body) {
      const next = originalPanel && originalPanel.querySelector(".favorite-button");
      (next || document.getElementById("btn-show-all")).focus({ preventScroll: true });
    }
  });
  return button;
}

function createPhotoCredit(photo) {
  const credit = document.createElement("p");
  credit.className = "photo-credit";
  const caption = getLocalized(photo.caption);
  if (caption) {
    const line = document.createElement("span");
    line.className = "photo-credit__caption";
    line.textContent = caption;
    credit.append(line, document.createElement("br"));
  }
  credit.append(
    document.createTextNode(
      photo.author ? `${photo.author} · ` : `${t("attributionPending")} · `,
    ),
  );
  if (photo.license) {
    const licenseURL = safeMediaURL(photo.licenseUrl);
    if (licenseURL) {
      const license = document.createElement("a");
      license.href = licenseURL;
      license.target = "_blank";
      license.rel = "noopener noreferrer";
      license.textContent = photo.license;
      credit.append(license);
    } else credit.append(document.createTextNode(photo.license));
  }
  const sourceURL = safeMediaURL(photo.sourceUrl);
  if (sourceURL) {
    const link = document.createElement("a");
    link.href = sourceURL;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = t("photoSource");
    credit.append(document.createTextNode(" · "), link);
  }
  if (Array.isArray(photo.requiredAttribution)) {
    const citation = document.createElement("span");
    citation.className = "photo-credit__required";
    photo.requiredAttribution.forEach((part) => {
      if (!part || typeof part.text !== "string" || !part.text.trim()) return;
      if (citation.childNodes.length) citation.append(document.createTextNode(" "));
      const url = safeMediaURL(part.url);
      if (url) {
        const link = document.createElement("a");
        link.href = url;
        link.target = "_blank";
        link.rel = "noopener noreferrer";
        link.textContent = part.text;
        citation.append(link);
      } else citation.append(document.createTextNode(part.text));
    });
    if (citation.childNodes.length) credit.append(citation);
  }
  return credit;
}

function createGallery(destination, options = {}) {
  const wrapper = document.createElement("div");
  wrapper.className = options.modal ? "modal-gallery" : "detail-gallery";
  const photos = getDestinationPhotos(destination);
  const stage = document.createElement("div");
  stage.className = "gallery";
  wrapper.append(stage);
  if (!photos.length) {
    wrapper.hidden = true;
    return wrapper;
  }
  let photoIndex = 0;
  let credit = null;
  const thumbnails =
    options.modal && photos.length > 1 ? document.createElement("div") : null;
  function showPhoto(index) {
    const focusDirection = stage.contains(document.activeElement)
      ? document.activeElement.dataset.galleryDirection
      : null;
    photoIndex = (index + photos.length) % photos.length;
    const photo = photos[photoIndex];
    stage.replaceChildren(
      createMediaImage(photo, {
        alt: getLocalized(photo.caption) || getLocalized(destination.name),
        className: "gallery__image",
        thumbnail: !options.modal,
        priority: true,
      }),
    );
    const badge = document.createElement("span");
    badge.className = `photo-badge${photo.kind === "overview" ? " photo-badge--overview" : ""}`;
    badge.textContent =
      photo.kind === "overview"
        ? t("illustrativePhoto")
        : photo.verified
          ? t("realPhotoBadge")
          : t("photoSource");
    stage.append(
      badge,
      createFavoriteButton(
        destination,
        options.modal ? undefined : "btn-toggle-fav",
      ),
    );
    const controls = document.createElement("div");
    controls.className = "gallery__controls";
    if (photos.length > 1) {
      for (const [delta, symbol, key] of [
        [-1, "‹", "galleryPrevious"],
        [1, "›", "galleryNext"],
      ]) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.galleryDirection = String(delta);
        button.textContent = symbol;
        button.setAttribute("aria-label", t(key));
        button.addEventListener("click", () => showPhoto(photoIndex + delta));
        controls.append(button);
      }
    }
    const counter = document.createElement("span");
    counter.className = "gallery__counter";
    counter.textContent = `${photoIndex + 1} / ${photos.length}`;
    controls.append(counter);
    stage.append(controls);
    if (focusDirection) {
      const focusButton = controls.querySelector(
        `[data-gallery-direction="${focusDirection}"]`,
      );
      if (focusButton) focusButton.focus({ preventScroll: true });
    }
    if (credit) credit.remove();
    credit = createPhotoCredit(photo);
    stage.after(credit);
    if (thumbnails)
      thumbnails
        .querySelectorAll("button")
        .forEach((button, index) =>
          button.setAttribute("aria-pressed", String(index === photoIndex)),
        );
  }
  showPhoto(0);
  if (thumbnails) {
    thumbnails.className = "gallery-thumbnails";
    photos.forEach((photo, index) => {
      const button = document.createElement("button");
      button.type = "button";
      button.setAttribute("aria-label", `${t("photoCaption")} ${index + 1}`);
      button.setAttribute("aria-pressed", String(index === 0));
      button.append(
        createMediaImage(photo, {
          alt: getLocalized(photo.caption) || getLocalized(destination.name),
          thumbnail: true,
        }),
      );
      button.addEventListener("click", () => showPhoto(index));
      thumbnails.append(button);
    });
    wrapper.append(thumbnails);
  }
  return wrapper;
}

function formatDistance(route) {
  if (!route) return t("routingUnavailable");
  if (route.isStraightLine)
    return `${route.distanceKm} km · ${t("straightLineDistance")}`;
  return `${route.distanceKm} km`;
}

function describeRouteNotes(route, destination) {
  const notes = [];
  const precision = coordinateNotice(destination);
  if (precision) notes.push(precision);
  if (route && route.cacheStale) notes.push(t("routeCacheStale"));
  if (route && route.fetchedAt) {
    const fetched = new Date(route.fetchedAt);
    if (Number.isFinite(fetched.getTime())) {
      const dateLocale = { uz: "uz-UZ", kaa: "uz-UZ", ru: "ru-RU", en: "en-GB" }[currentLang];
      notes.push(`${t("routeDataDate")}: ${new Intl.DateTimeFormat(dateLocale, {
        year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Tashkent",
      }).format(fetched)}`);
    }
  }
  if (route && route.isStraightLine) notes.push(t("routingUnavailable"));
  if (route && route.isPartial) {
    notes.push(t("routePartial"));
    if (route.approachDistanceKm > ROUTE_APPROACH_THRESHOLD_KM)
      notes.push(
        `${t("routeApproachDistance")}: ${route.approachDistanceKm} km · ${t("straightLineDistance")}`,
      );
    if (route.originApproachDistanceKm > ROUTE_APPROACH_THRESHOLD_KM)
      notes.push(
        `${t("distanceFromYou")}: ${route.originApproachDistanceKm} km · ${t("straightLineDistance")}`,
      );
  }
  return notes.join(". ");
}

function createNavigationLinks(destination) {
  const container = document.createElement("div");
  container.className = "navigation-links";
  container.setAttribute("role", "group");
  container.setAttribute("aria-label", t("howToGetThere"));
  const links = buildNavigationLinks(destination, userLocation || undefined);
  for (const [url, key] of [
    [links.google, "openGoogleMaps"],
    [links.yandex, "openYandexMaps"],
  ]) {
    if (!url) continue;
    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.className = "button button--secondary";
    link.textContent = t(key);
    container.append(link);
  }
  return container;
}

async function renderRightDetailsPanel(destination) {
  currentSelectedDestination = destination;
  const version = ++selectedRenderVersion;
  const panel = document.getElementById("right-details-panel");
  panel.classList.remove("details-panel--empty");
  const coordinates = destination.coordinates;
  const precision = coordinateNotice(destination);
  panel.innerHTML = `
    <h2 class="destination-title">${escapeHTML(getLocalized(destination.name))}</h2>
    <p class="destination-district">⌖ ${escapeHTML(getLocalized(destination.districtName))}</p>
    <div class="destination-tags"><span class="tag">${escapeHTML(getCategoryName(destination.category))}</span>${destination.unesco ? `<span class="tag tag--sand">${escapeHTML(getHeritageLabel(destination.unesco))}</span>` : ""}${precision ? `<span class="tag tag--sand">${escapeHTML(precision)}</span>` : ""}</div>
    <p class="destination-description">${escapeHTML(getLocalized(destination.description))}</p>
    <dl class="stats"><div class="stat"><dt>${escapeHTML(t("distanceFromNukus"))}</dt><dd id="right-panel-nukus-km">${escapeHTML(t("loading"))}</dd></div>${userLocation ? `<div class="stat"><dt>${escapeHTML(t("distanceFromYou"))}</dt><dd id="right-panel-user-km">${escapeHTML(t("loading"))}</dd></div>` : ""}</dl>
    <p class="route-note" id="right-panel-route-note"></p>
    <div class="detail-actions"><button type="button" id="btn-open-modal" class="button button--secondary">${escapeHTML(t("btnDetails"))}</button><button type="button" id="btn-draw-route" class="button" disabled>${escapeHTML(t("btnShowRoute"))}</button></div>
    <p class="coordinates-line">${escapeHTML(t("coordinateLabel"))}: ${coordinates.lat.toFixed(6)}, ${coordinates.lng.toFixed(6)}${precision ? `<br>${escapeHTML(t("navigationTargetWarning"))}` : ""}</p>`;
  panel.prepend(createGallery(destination));
  panel.querySelector(".detail-actions").after(createNavigationLinks(destination));
  const coordinateSource = safeMediaURL(
    destination.coordinateVerification &&
      destination.coordinateVerification.sourceUrl,
  );
  if (coordinateSource) {
    const source = document.createElement("a");
    source.href = coordinateSource;
    source.target = "_blank";
    source.rel = "noopener noreferrer";
    source.textContent = t("coordinateSource");
    panel
      .querySelector(".coordinates-line")
      .append(document.createElement("br"), source);
  }
  const nukusDistance = panel.querySelector("#right-panel-nukus-km");
  const userDistance = panel.querySelector("#right-panel-user-km");
  const note = panel.querySelector("#right-panel-route-note");
  const routeButton = panel.querySelector("#btn-draw-route");
  panel
    .querySelector("#btn-open-modal")
    .addEventListener("click", () => openFullDetailsModal(destination));
  try {
    const routing = await getDestinationRouting(destination);
    if (
      version !== selectedRenderVersion ||
      currentSelectedDestination.id !== destination.id
    )
      return;
    nukusDistance.textContent = formatDistance(routing.nukus);
    if (userDistance) userDistance.textContent = formatDistance(routing.user);
    const displayedRoute = routing.user && !routing.user.isStraightLine
      ? routing.user : routing.nukus;
    const nukusNotes = describeRouteNotes(routing.nukus, destination);
    const userNotes = routing.user
      ? describeRouteNotes(routing.user, destination)
      : "";
    note.textContent = [
      nukusNotes ? `${t("distanceFromNukus")}: ${nukusNotes}` : "",
      userNotes ? `${t("distanceFromYou")}: ${userNotes}` : "",
    ]
      .filter(Boolean)
      .join(" • ");
    routeButton.disabled = !displayedRoute;
    routeButton.addEventListener("click", async () => {
      if (version !== selectedRenderVersion) return;
      routeButton.disabled = true;
      try {
        const geometry = await getRouteGeometry(
          destination.id,
          displayedRoute && displayedRoute.geometry,
        );
        if (version !== selectedRenderVersion) return;
        if (geometry) drawRoutePolyline(geometry, coordinates, displayedRoute);
        else showToast(t("routeGeometryUnavailable"));
      } finally {
        if (version === selectedRenderVersion) routeButton.disabled = false;
      }
    });
  } catch (error) {
    if (version !== selectedRenderVersion) return;
    nukusDistance.textContent = t("routingUnavailable");
    if (userDistance) userDistance.textContent = t("routingUnavailable");
  }
}

function renderPopularCards(destinations) {
  const container = document.getElementById("popular-cards-container");
  const active = document.activeElement;
  const focusedCard = active && container.contains(active) ? active.closest(".place-card") : null;
  const focusedFavoriteId = focusedCard && active.dataset.favoriteId;
  const focusedPlaceId = focusedCard && focusedCard.querySelector("[data-place-id]").dataset.placeId;
  const focusedIndex = focusedCard ? [...container.children].indexOf(focusedCard) : -1;
  container.replaceChildren();
  if (!destinations.length)
    container.append(createEmptyState(emptyPlacesKey(activeFavoritesOnly)));
  const fragment = document.createDocumentFragment();
  destinations.slice(0, visiblePlaceCount).forEach((destination) => {
    const card = document.createElement("article");
    card.className = "place-card";
    const open = document.createElement("button");
    open.type = "button";
    open.className = "place-card__open";
    open.dataset.placeId = destination.id;
    const photo = getDestinationPhotos(destination)[0];
    if (photo) {
      open.append(createMediaImage(photo, {
            alt: getLocalized(destination.name),
            className: "place-card__photo",
            thumbnail: true,
          }));
    }
    const body = document.createElement("div");
    body.className = "place-card__body";
    const cached = precomputedRoutingIndex[destination.id];
    const mappedDistance = getDestinationDistance(destination);
    body.innerHTML = `<h3>${escapeHTML(getLocalized(destination.name))}</h3><p class="place-card__district">${escapeHTML(getLocalized(destination.districtName))}</p><div class="place-card__meta"><span class="tag">${escapeHTML(getCategoryName(destination.category))}</span>${mappedDistance !== null ? `<span>${cached.isPartial ? "~" : ""}${escapeHTML(mappedDistance)} km</span>` : ""}</div>`;
    open.append(body);
    open.addEventListener("click", () => {
      selectDestinationById(destination.id, true);
      if (window.matchMedia("(max-width: 800px)").matches)
        scrollToSection("right-details-panel");
    });
    card.append(open, createFavoriteButton(destination));
    fragment.append(card);
  });
  container.append(fragment);
  document.getElementById("btn-more-places").hidden =
    destinations.length <= visiblePlaceCount;
  renderedCardLanguage = currentLang;
  if (focusedCard) {
    const controls = [...container.querySelectorAll(focusedFavoriteId
      ? "[data-favorite-id]" : "[data-place-id]")];
    const retained = controls.find((button) => focusedFavoriteId
      ? button.dataset.favoriteId === focusedFavoriteId
      : button.dataset.placeId === focusedPlaceId);
    const next = retained || controls[Math.min(focusedIndex, controls.length - 1)] ||
      document.getElementById("btn-show-all");
    next.focus({ preventScroll: true });
  }
}

function selectDestinationById(id, shouldFly = true) {
  const destination = allDestinations.find((item) => item.id === id);
  if (!destination) return;
  selectMapDestination(id);
  renderRightDetailsPanel(destination);
  if (shouldFly) {
    setWorkspacePanelState("details", true);
    requestAnimationFrame(() => {
      if (currentSelectedDestination && currentSelectedDestination.id === id)
        centerMapOn(destination.coordinates.lat, destination.coordinates.lng, 10);
    });
  }
  const url = new URL(window.location.href);
  url.searchParams.set("place", id);
  try {
    window.history.replaceState(null, "", url);
  } catch (_) {
    /* Selection still works without history access. */
  }
}

function buildItineraryLink(route) {
  const stops = route.stops
    .map((id) => allDestinations.find((destination) => destination.id === id))
    .filter(Boolean);
  if (!stops.length) return "";
  const target = stops[stops.length - 1].coordinates;
  const url = new URL("https://www.google.com/maps/dir/");
  url.search = new URLSearchParams({
    api: "1",
    origin: `${NUKUS_COORDS.lat},${NUKUS_COORDS.lng}`,
    destination: `${target.lat},${target.lng}`,
    travelmode: "driving",
  });
  if (stops.length > 1)
    url.searchParams.set(
      "waypoints",
      stops
        .slice(0, -1)
        .map((stop) => `${stop.coordinates.lat},${stop.coordinates.lng}`)
        .join("|"),
    );
  return url.href;
}

function renderRoutes(routes) {
  const container = document.getElementById("routes-container");
  container.replaceChildren();
  routes.forEach((route) => {
    const card = document.createElement("article");
    card.className = "route-card";
    card.innerHTML = `<h3>${escapeHTML(getLocalized(route.name))}</h3><p class="route-card__meta">~${escapeHTML(route.durationDays)} ${escapeHTML(t("durationDays"))} · ${escapeHTML(route.vehicle === "4x4" ? t("road4x4") : t("roadAsphalt"))}<br>${escapeHTML(t("routeEstimated"))}</p>`;
    const stops = document.createElement("ol");
    let approximate = false;
    (route.stops || []).forEach((id) => {
      const destination = allDestinations.find((item) => item.id === id);
      if (!destination) return;
      approximate = approximate || Boolean(coordinateNotice(destination));
      const stop = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = getLocalized(destination.name);
      button.addEventListener("click", () => {
        resetFilters();
        selectDestinationById(id, true);
        scrollToSection("map-workspace");
      });
      stop.append(button);
      stops.append(stop);
    });
    card.append(stops);
    if (approximate) {
      const note = document.createElement("p");
      note.className = "field-note";
      note.textContent = t("navigationTargetWarning");
      card.append(note);
    }
    const url = buildItineraryLink(route);
    if (url) {
      const link = document.createElement("a");
      link.className = "button button--secondary";
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = t("openGoogleMaps");
      card.append(link);
    }
    container.append(card);
  });
}

function updateFavoriteButtons() {
  document.querySelectorAll("[data-favorite-id]").forEach((button) => {
    const saved = isFavorite(button.dataset.favoriteId);
    button.setAttribute("aria-pressed", String(saved));
    button.setAttribute("aria-label", t("toggleFavorite"));
    button.textContent = saved ? "♥" : "♡";
  });
}

function setupModal() {
  const modal = document.getElementById("full-details-modal");
  document
    .getElementById("btn-close-modal")
    .addEventListener("click", closeFullDetailsModal);
  modal.addEventListener("click", (event) => {
    if (event.target === modal) closeFullDetailsModal();
  });
  document.addEventListener("keydown", (event) => {
    if (modal.hidden) return;
    if (event.key === "Escape") {
      event.preventDefault();
      closeFullDetailsModal();
    }
    if (event.key === "Tab") {
      const controls = [
        ...modal.querySelectorAll(
          'a[href],button:not([disabled]),[tabindex="0"]',
        ),
      ].filter((element) => !element.hidden);
      if (!controls.length) return;
      const first = controls[0],
        last = controls[controls.length - 1];
      if (
        event.shiftKey &&
        (document.activeElement === first ||
          !modal.contains(document.activeElement))
      ) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        (document.activeElement === last ||
          !modal.contains(document.activeElement))
      ) {
        event.preventDefault();
        first.focus();
      }
    }
  });
}

function showFullDetailsModal(context) {
  const modal = document.getElementById("full-details-modal");
  if (modal.hidden) modalReturnFocus = document.activeElement;
  modalContext = context;
  modal.hidden = false;
  document.body.style.overflow = "hidden";
  modal.scrollTop = 0;
  modal.querySelector(".modal__dialog").scrollTop = 0;
  document.getElementById("btn-close-modal").focus();
}

function closeFullDetailsModal() {
  document.getElementById("full-details-modal").hidden = true;
  document.body.style.overflow = "";
  modalContext = null;
  if (modalReturnFocus && modalReturnFocus.isConnected)
    modalReturnFocus.focus();
}

function openFullDetailsModal(destination) {
  const body = document.getElementById("modal-body-content");
  const summary = getLocalized(destination.description).trim() || getLocalized(destination.history).trim();
  const history = getLocalized(destination.history).trim();
  const legend = getLocalized(destination.legend).trim();
  const routeHint = getLocalized(destination.routeHint).trim();
  const precision = coordinateNotice(destination);
  body.innerHTML = `<h2 id="modal-title">${escapeHTML(getLocalized(destination.name))}</h2><p class="destination-district">${escapeHTML(getLocalized(destination.districtName))}</p>${summary ? `<section class="modal-section"><h3>${escapeHTML(t("placeSummary"))}</h3><p class="place-summary">${escapeHTML(summary)}</p></section>` : ""}`;
  body.append(createNavigationLinks(destination), createGallery(destination, { modal: true }));
  if (history && history !== summary) {
    const section = document.createElement("section");
    section.className = "modal-section";
    section.innerHTML = `<h3>${escapeHTML(t("historicalFacts"))}</h3><p>${escapeHTML(history)}</p>`;
    body.append(section);
  }
  if (legend) {
    const section = document.createElement("section");
    section.className = "modal-section";
    section.innerHTML = `<h3>${escapeHTML(t("legends"))}</h3><p>${escapeHTML(legend)}</p>`;
    body.append(section);
  }
  if (routeHint || precision) {
    const section = document.createElement("section");
    section.className = "modal-section";
    section.innerHTML = `<h3>${escapeHTML(t("howToGetThere"))}</h3>${routeHint ? `<p>${escapeHTML(routeHint)}</p>` : ""}${precision ? `<p>${escapeHTML(precision)}. ${escapeHTML(t("navigationTargetWarning"))}</p>` : ""}`;
    body.append(section);
  }
  showFullDetailsModal({ type: "destination", destination });
}

function openInformationModal(action) {
  if (action !== "about") return;
  const body = document.getElementById("modal-body-content");
  body.innerHTML = `<div class="about-profile"><span class="eyebrow about-profile__eyebrow">${escapeHTML(t("aboutEyebrow"))}</span><h2 id="modal-title">${escapeHTML(t("aboutTitle"))}</h2><strong class="about-profile__name">${escapeHTML(t("aboutAuthor"))}</strong><p class="about-profile__position">${escapeHTML(t("aboutPosition"))}</p><p class="about-profile__text">${escapeHTML(t("aboutText"))}</p></div>`;
  showFullDetailsModal({ type: "information", action });
}

function openSourcesModal() {
  const body = document.getElementById("modal-body-content");
  body.innerHTML = `<h2 id="modal-title">${escapeHTML(t("photoSource"))}</h2>`;
  const list = document.createElement("ul");
  list.className = "source-list";
  allDestinations.forEach((destination) =>
    getDestinationPhotos(destination).forEach((photo) => {
      const row = document.createElement("li");
      const heading = document.createElement("strong");
      heading.textContent = getLocalized(destination.name);
      row.append(heading, createPhotoCredit(photo));
      list.append(row);
    }),
  );
  body.append(list);
  showFullDetailsModal({ type: "sources" });
}

function refreshOpenModal() {
  if (modalContext.type === "destination")
    openFullDetailsModal(modalContext.destination);
  else if (modalContext.type === "sources") openSourcesModal();
  else openInformationModal(modalContext.action);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.hidden = false;
  toastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 5500);
}
