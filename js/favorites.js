// Favorites Manager (Saved places in localStorage)
const FAVORITES_KEY = "karakalpakstan_favorites";
let sessionFavorites = null;

function sanitizeFavorites(value) {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((id) =>
    typeof id === "string" && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)
  ))];
}

function getFavorites() {
  if (sessionFavorites !== null) return [...sessionFavorites];
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    sessionFavorites = sanitizeFavorites(raw ? JSON.parse(raw) : []);
  } catch (e) {
    sessionFavorites = [];
  }
  return [...sessionFavorites];
}

function isFavorite(destId) {
  const favs = getFavorites();
  return favs.includes(destId);
}

function toggleFavorite(destId) {
  if (typeof destId !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(destId)) return false;
  let favs = getFavorites();
  if (favs.includes(destId)) {
    favs = favs.filter((id) => id !== destId);
  } else {
    favs.push(destId);
  }
  sessionFavorites = favs;
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  } catch (e) {
    // Saving still works for this tab when browser storage is unavailable.
  }
  window.dispatchEvent(new CustomEvent("favorites-updated", { detail: { favorites: favs, toggledId: destId } }));
  return favs.includes(destId);
}

window.addEventListener("storage", (event) => {
  if (event.key !== FAVORITES_KEY && event.key !== null) return;
  try {
    sessionFavorites = sanitizeFavorites(event.newValue ? JSON.parse(event.newValue) : []);
  } catch (e) {
    sessionFavorites = [];
  }
  window.dispatchEvent(new CustomEvent("favorites-updated", {
    detail: { favorites: getFavorites(), toggledId: null }
  }));
});
