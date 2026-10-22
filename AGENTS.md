# Qoraqalpog‘iston Travel — first phase

This repository is a buildless HTML/CSS/JavaScript tourism map intended for GitHub Pages. The active catalog is `data/destinations.json`; legacy `data/destinations.js` is not the application data source.

- The user explicitly prohibits writing or running tests and launching the application, a development server, or a browser during this phase. Review source and data statically. Downloading real media, collecting public-source metadata, formatting files, and checking syntax without executing application code are maintenance operations, not application runs.
- Keep destination IDs stable. Other catalogs, routes, photo metadata, and routing geometries reference them.
- Google Drive stores media; `data/media-storage.json` contains public file IDs/URLs and permission state only. Never commit account credentials, OAuth tokens, API secrets, or signed URLs. Small local previews and local image fallbacks keep public pages usable.
- Only mark a photo verified after checking both the pictured subject and its actual source/license. Preserve source URL, author, license URL, changes, and an honest `photo`/`overview` distinction. Use two distinct photos where available; never substitute an unrelated landmark or duplicate crop to meet a count.
- Preserve successful media when a collection request fails. New/legacy catalog generators write candidates, not the active catalog.
- Routes must distinguish mapped roads, remaining unverified approaches, straight-line distance, and representative coordinates. Do not invent driving times or claim a road reaches an inaccessible pin.
- Public visitors use static Nukus routes and external Google/Yandex navigation. Live routing is disabled by default and needs an explicitly configured suitable provider.
- All four locales are `uz`, `kaa`, `ru`, and `en`. Keep visible controls translated, accessible, responsive, and free of runtime Tailwind dependencies.
- Prepare GitHub Pages configuration locally. Do not push or publish unless the user requests it.
