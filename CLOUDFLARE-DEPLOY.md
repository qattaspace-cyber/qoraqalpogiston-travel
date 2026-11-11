# DiscoverKarakalpakstan: publication and Google Search

Canonical address: https://discoverkarakalpakstan.uz/
Target brand query: **DiscoverKarakalpakstan** (also written Discover Karakalpakstan).

Source repository: https://github.com/qattaspace-cyber/qoraqalpogiston-travel
The source fork exists. Cloudflare connection, domain activation and Search Console
submission must be confirmed separately; repository creation alone does not publish the site.

## Primary deployment: Cloudflare Pages Git integration

Connect the source GitHub repository to Cloudflare Pages using Git integration.
Authorize the Cloudflare GitHub app to access
that repository. Use a separate Pages project, preferably named `discoverkarakalpakstan`.

- Production branch: `main`.
- Framework preset: `None`.
- Root directory: leave empty (the repository root).
- Build command: `node scripts/prepare-pages.js`.
- Build output directory: `_site`.

Once connected, Cloudflare builds and deploys updates pushed to `main`.
Commit source files, including the build script and public media; do not commit `_site/`,
release ZIPs, credentials or local configuration. No separate GitHub Actions deployment
workflow or Cloudflare API token is required for this Git integration.

The copied `.github/workflows/pages.yml` is a **manual legacy GitHub Pages** workflow.
Its only trigger is `workflow_dispatch`; pushing to `main` does not start it.
It is not part of the Cloudflare deployment process.

## Fallback: Direct Upload

Run `node scripts/prepare-pages.js` from this source folder. The output is `_site/`.
Only public website assets are copied. The command does not launch the application.

If Git integration cannot be used, create a **separate Direct Upload project** and upload
the contents of `_site/`, or a prepared ZIP whose root contains `index.html`.
Do not upload the entire source repository, `.git`, research files or local configuration
through Direct Upload. A Direct Upload project cannot later be switched to Git integration;
that requires a new Pages project. Use Git integration for the primary project from the start.

## Custom domain and DNS

In the same Cloudflare account, add the zone `discoverkarakalpakstan.uz`, select Free,
and copy the two assigned nameservers into the domain settings at Sayt.uz.
The actual nameserver names are account-specific: do not guess them.

Once the zone is active, add `discoverkarakalpakstan.uz` in the Pages project's Custom domains.
If using `www`, add `www.discoverkarakalpakstan.uz` there too. The included `_redirects`
then redirects `www` to the main domain. Keep other existing mail/DNS records if any.

After the custom domain works, redirect the production `PROJECT.pages.dev` hostname
to the main domain using Cloudflare's documented Bulk Redirect setup. Preserve paths
and query strings. Do not guess the generated Pages hostname or add a redirect to
an unconfigured domain before checking its HTTPS certificate.

## Google Search Console

1. Add a Domain property for `discoverkarakalpakstan.uz`.
2. Copy the exact verification TXT value Google supplies into Cloudflare DNS.
3. Complete verification; keep the TXT record after verification.
4. Submit `https://discoverkarakalpakstan.uz/sitemap.xml`.
5. Inspect `https://discoverkarakalpakstan.uz/`, run the live URL check, inspect the rendered
   page and request indexing. Confirm that Google sees the preferred brand name.
6. Check indexing and impressions for DiscoverKarakalpakstan and its spaced form after
   Google has crawled the site. Record the search country, language and date when comparing positions.

The sitemap intentionally lists only the canonical atlas home page. `?place=...` URLs
are selection states of the same map and keep the homepage canonical. The four interface
languages share one URL, so no unsupported language alternates are declared.

The old GitHub Pages site remains separately controlled by its owner. Ask that owner
to update public links to the new address, and arrange redirects if this is a permanent
move. This local copy cannot change the old site or migrate its search signals by itself.

Search Console submission and site-name markup help discovery and interpretation; they
do not guarantee indexing, a particular result title, or the first search position.

## References

- https://developers.cloudflare.com/pages/get-started/git-integration/
- https://developers.cloudflare.com/pages/configuration/build-configuration/
- https://developers.cloudflare.com/pages/get-started/direct-upload/
- https://developers.cloudflare.com/pages/configuration/custom-domains/
- https://developers.cloudflare.com/pages/how-to/redirect-to-custom-domain/
- https://support.google.com/webmasters/answer/9008080
- https://developers.google.com/search/docs/appearance/site-names
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
