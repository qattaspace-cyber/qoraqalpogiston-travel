// Assemble public static files only. This maintenance command never runs the app.
const fs = require('fs');
const path = require('path');

const root = fs.realpathSync(path.join(__dirname, '..'));
const output = path.join(root, '_site');
const files = new Set([
  'index.html', '404.html', '.nojekyll', 'favicon.svg', 'robots.txt', 'sitemap.xml',
  '_redirects', 'css/app.css',
  'js/app.js', 'js/favorites.js', 'js/filters.js', 'js/i18n.js', 'js/map.js',
  'js/media.js', 'js/routing.js', 'js/search.js', 'js/ui.js',
  'data/destinations.json', 'data/categories.json', 'data/districts.json',
  'data/routes.json', 'data/app-config.json', 'data/media-storage.json',
  'data/photo_attribution.json', 'data/coordinate-sources.json',
  'data/routing/index.json'
]);

function addDirectory(relative) {
  for (const entry of fs.readdirSync(path.join(root, relative), { withFileTypes: true })) {
    const child = `${relative}/${entry.name}`;
    if (entry.isDirectory()) addDirectory(child);
    else if (entry.isFile()) files.add(child);
    else throw new Error(`Unsupported link in public assets: ${child}`);
  }
}

const destinations = JSON.parse(fs.readFileSync(path.join(root, 'data/destinations.json'), 'utf8'));
const routing = JSON.parse(fs.readFileSync(path.join(root, 'data/routing/index.json'), 'utf8'));
for (const destination of destinations) {
  for (const photo of destination.photos || []) {
    const approved = photo.verified === true && photo.licenseVerified === true;
    const requested = photo.publicationRequested === true && /^https:\/\//.test(photo.sourceUrl || '');
    if (photo.subjectVerified !== true || (!approved && !requested)) continue;
    for (const relative of [photo.src, photo.thumbnail]) {
      if (typeof relative !== 'string' || !relative.startsWith('assets/images/destinations/') ||
          relative.includes('/research/') || relative.split('/').includes('..') || relative.includes('\\')) {
        throw new Error(`Invalid public photo path for ${destination.id}`);
      }
      files.add(relative);
    }
  }
  if (routing[destination.id]) files.add(`data/routing/geometry/${destination.id}.json`);
}
if (!files.has('assets/images/destinations/07-ayaz-qala-i-02.jpg')) {
  throw new Error('The hero photograph must remain in the verified public catalogue.');
}
addDirectory('data/locales');
addDirectory('vendor/leaflet');

// Resolve every input before touching the generated directory. Missing media cannot
// silently produce a partial release. Archives and research downloads are never copied.
for (const relative of files) {
  const source = fs.realpathSync(path.join(root, relative));
  const withinRoot = path.relative(root, source);
  if (withinRoot.startsWith(`..${path.sep}`) || path.isAbsolute(withinRoot) || !fs.statSync(source).isFile()) {
    throw new Error(`Public input is outside the project: ${relative}`);
  }
}
if (fs.existsSync(output)) {
  if (fs.lstatSync(output).isSymbolicLink() || fs.realpathSync(output) !== path.join(root, '_site')) {
    throw new Error('Refusing to replace a redirected output directory.');
  }
  fs.rmSync(output, { recursive: true, force: true });
}
for (const relative of files) {
  const target = path.join(output, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(path.join(root, relative), target);
}
const bytes = [...files].reduce((total, relative) => total + fs.statSync(path.join(output, relative)).size, 0);
console.log(`Prepared ${files.size} public files (${(bytes / 1048576).toFixed(2)} MiB) in ${output}`);
console.log('Only source/data assembly completed; the website was not launched or published.');
