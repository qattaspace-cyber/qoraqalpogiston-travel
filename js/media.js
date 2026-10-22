// Public media configuration contains file IDs and URLs only, never credentials.
let mediaStorage = { provider: "local", folder: null, files: {} };

function escapeHTML(value) {
  return String(value == null ? "" : value).replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
}

function safeMediaURL(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  const input = value.trim();
  if (/^[a-z][a-z\d+.-]*:/i.test(input)) {
    try {
      const url = new URL(input);
      return url.protocol === "https:" ? url.href : "";
    } catch (_) {
      return "";
    }
  }
  if (
    input.startsWith("//") ||
    input.startsWith("/") ||
    input.includes("\\") ||
    input.split("/").includes("..")
  )
    return "";
  return input;
}

async function loadMediaStorage() {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000);
  try {
    const response = await fetch("data/media-storage.json", {
      cache: "no-cache",
      signal: controller.signal,
    });
    if (!response.ok) return;
    const data = await response.json();
    if (
      data &&
      data.files &&
      typeof data.files === "object" &&
      !Array.isArray(data.files)
    )
      mediaStorage = data;
  } catch (_) {
    /* Local copies remain available when Drive configuration cannot load. */
  } finally {
    clearTimeout(timeout);
  }
}

function getDestinationPhotos(destination) {
  const photos = Array.isArray(destination.photos) ? destination.photos : [];
  return photos
    .filter(
      (photo) =>
        photo &&
        photo.subjectVerified === true &&
        ((photo.verified === true && photo.licenseVerified === true) ||
          (photo.publicationRequested === true && safeMediaURL(photo.sourceUrl))) &&
        safeMediaURL(photo.src),
    )
    .map((photo) => ({
      ...photo,
      src: safeMediaURL(photo.src),
      thumbnail: safeMediaURL(photo.thumbnail || photo.src),
    }));
}

function getMediaSources(photo, thumbnail) {
  const entry = mediaStorage.files && mediaStorage.files[photo.src];
  const urls = [];
  // Cards use small local previews; full galleries can use public Drive media.
  if (thumbnail) urls.push(photo.thumbnail);
  if (!thumbnail && entry && entry.publicReadable === true)
    urls.push(entry.publicUrl);
  urls.push(photo.src, photo.thumbnail, photo.sourceImageUrl);
  return [...new Set(urls.map(safeMediaURL).filter(Boolean))];
}

function createMediaImage(photo, options = {}) {
  const image = document.createElement("img");
  image.alt = options.alt || getLocalized(photo.caption) || "";
  image.className = options.className || "";
  image.loading = options.priority ? "eager" : "lazy";
  image.decoding = "async";
  if (Number.isFinite(photo.width) && photo.width > 0 &&
      Number.isFinite(photo.height) && photo.height > 0) {
    image.width = photo.width;
    image.height = photo.height;
  }
  image.referrerPolicy = "no-referrer";
  if (options.priority) image.fetchPriority = "high";
  const sources = getMediaSources(photo, options.thumbnail !== false);
  let nextSource = 0;
  image.addEventListener("error", () => {
    if (nextSource < sources.length) {
      image.src = sources[nextSource++];
      return;
    }
    const placeholder = createPhotoPlaceholder(image.alt);
    placeholder.classList.add("media-failed");
    image.replaceWith(placeholder);
  });
  if (sources.length) image.src = sources[nextSource++];
  return image;
}

function createPhotoPlaceholder(message) {
  const placeholder = document.createElement("div");
  placeholder.className = "photo-placeholder";
  const icon = document.createElement("span");
  icon.textContent = "⌑";
  icon.setAttribute("aria-hidden", "true");
  const text = document.createElement("span");
  text.textContent = message || t("brandRegion");
  placeholder.append(icon, text);
  return placeholder;
}
