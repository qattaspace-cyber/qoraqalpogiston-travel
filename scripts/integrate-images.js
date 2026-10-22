'use strict';

// Retired: the old importer guessed archive licences and replaced successful assignments.
// Media now comes from individually reviewed records in data/media-sources.json:
// destinationId, src, kind, subjectVerified, status, metadata.sourceUrl,
// metadata.author, metadata.license, metadata.licenseUrl, metadata.licenseVerified.
// This compatibility entrypoint deliberately performs no downloads or file mutations.
console.error('Legacy integrate-images.js is retired. Current images and destination data were not changed.');
console.error('Use scripts/collect-images.ps1 and the reviewed data/media-sources.json catalogue.');
console.error('Review both subject identity and licence metadata before assigning a photograph.');
process.exitCode = 1;
