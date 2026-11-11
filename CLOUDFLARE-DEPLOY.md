# DiscoverKarakalpakstan: publication and Google Search

Canonical address: https://discoverkarakalpakstan.uz/
Target brand query: **DiscoverKarakalpakstan** (also written Discover Karakalpakstan).

Source repository: https://github.com/qattaspace-cyber/qoraqalpogiston-travel
The source fork exists. Cloudflare connection, domain activation and Search Console
submission must be confirmed separately; repository creation alone does not publish the site.

## Primary deployment: Cloudflare Workers Static Assets with Git integration

The dashboard project `qoraqalpogiston-travel` uses Workers and the deploy command
`npx wrangler deploy`. Connect it to the source repository and production branch `main`.
The committed `wrangler.jsonc` makes this an assets-only deployment without a Worker
request handler. It runs the assembly command and publishes only `_site/`.

- Production branch: `main`.
- Root directory: leave empty (the repository root).
- Dashboard build command: can be empty; Wrangler runs `node scripts/prepare-pages.js`.
- Deploy command: `npx wrangler deploy`.
- Static assets directory: `./_site`, declared in `wrangler.jsonc`.
- Missing paths: serve `404.html` with HTTP 404, as configured by `not_found_handling`.
- Canonical custom domain: `discoverkarakalpakstan.uz`, declared in `wrangler.jsonc` routes.
- The `www.discoverkarakalpakstan.uz` alias is also attached to the same static assets.
  Both hostnames serve the site; its canonical URL remains the apex domain.

Once connected, Cloudflare builds and deploys updates pushed to `main`.
Commit source files, including the build script and public media; do not commit `_site/`,
release ZIPs, credentials or local configuration. The existing Cloudflare Git integration
manages its deployment credentials; do not add credentials to this repository.

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

The apex custom domain is declared in `wrangler.jsonc`; deployments keep that mapping
associated with the Worker. Its dashboard location is Settings → Domains & Routes.
If using `www`, add `www.discoverkarakalpakstan.uz` there too. Configure the `www`
redirect in the domain zone's Redirect Rules after DNS and HTTPS work: match hostname
`www.discoverkarakalpakstan.uz`, redirect with status 301 to
`concat("https://discoverkarakalpakstan.uz", http.request.uri.path)`, and enable
Preserve query string. Keep other existing mail/DNS records if any.

The asset `_redirects` format accepts paths as sources, not domain names. Do not put
a hostname-specific `www` rule in that file or replace it with a catch-all redirect
to the main domain: a catch-all would also redirect the main domain to itself.

After the custom domain works, use it as the public address. The HTML canonical and
sitemap already point there. Record the actual `*.workers.dev` deployment URL when
verifying the release; do not guess that hostname. Any extra hostname redirect must
be configured for that specific hostname and preserve paths and query strings.

## Alternative: Cloudflare Pages Git integration

Pages is a separate project type. If using it instead, select framework `None`,
build command `node scripts/prepare-pages.js` and output directory `_site` in its Git
import. It does not use the Workers deploy command. The current `wrangler.jsonc` is
for the existing Worker, not a Pages configuration; review that configuration before
changing project type. Do not deploy both products accidentally.

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
- https://developers.cloudflare.com/pages/configuration/redirects/
- https://developers.cloudflare.com/workers/static-assets/redirects/
- https://developers.cloudflare.com/workers/static-assets/routing/static-site-generation/
- https://developers.cloudflare.com/workers/wrangler/configuration/
- https://developers.cloudflare.com/workers/configuration/routing/custom-domains/
- https://developers.cloudflare.com/fundamentals/manage-domains/redirect-domain/
- https://support.google.com/webmasters/answer/9008080
- https://developers.google.com/search/docs/appearance/site-names
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
