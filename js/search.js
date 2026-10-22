// Real-time Search Controller
const initializedSearchInputs = new WeakSet();

function initSearch() {
  const searchInput = document.getElementById("map-search-input");
  if (!searchInput || initializedSearchInputs.has(searchInput)) return;
  initializedSearchInputs.add(searchInput);

  searchInput.addEventListener("input", () => {
    if (typeof applyAllFilters === "function") {
      applyAllFilters();
    }
  });

  searchInput.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      searchInput.value = "";
      if (typeof applyAllFilters === "function") {
        applyAllFilters();
      }
    }
  });
}
