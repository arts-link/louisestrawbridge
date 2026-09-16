# Migration checklist: GitHub Pages → Cloudflare Workers

**Status: migration is live.** DNS points at Cloudflare, both custom domains are
attached to the Worker, and GitHub Pages is disabled. Canonical domain is
**`louisestrawbridge.com`** (apex) — `www.louisestrawbridge.com` redirects to it.
(Originally set up the other way around during migration, then reversed after
checking Google Search Console: 100% of the site's indexed pages, clicks, and
impressions over the last 12 months were on the apex domain, so apex keeps that SEO
history rather than starting over on `www`.) Free plan only, no paid Cloudflare
features.

## 1. Cloudflare setup (done)

1. Zone added in Cloudflare (Free plan).
2. GitHub repository secrets added (Settings → Secrets and variables → Actions):
   `CLOUDFLARE_API_TOKEN` (scoped to Workers Scripts: Edit) and
   `CLOUDFLARE_ACCOUNT_ID`.
3. `deploy-cloudflare.yml` has deployed the Worker (`louisestrawbridge`) — its
   `*.workers.dev` URL is visible on the Worker's Overview page in the dashboard.
4. Both Custom Domains are attached to the Worker (Worker → Domains tab):
   `louisestrawbridge.com` and `www.louisestrawbridge.com`. Note: Cloudflare refuses
   to attach a Custom Domain while a conflicting DNS record (e.g. an imported
   GitHub Pages A/CNAME record) already exists for that hostname — those records had
   to be deleted first, which is effectively also the real DNS cutover moment for
   that hostname, not something that happens separately afterward.
5. **Redirect Rule** (Rules → Redirect Rules in the zone dashboard) — redirects
   `www` → apex, preserving the path:
   - When incoming requests match: **Custom filter expression** →
     `(http.host eq "www.louisestrawbridge.com")`
   - Then: **Dynamic**, expression:
     `concat("https://louisestrawbridge.com", http.request.uri.path, http.request.uri.query == "" ? "" : concat("?", http.request.uri.query))`
   - Status code: **301**
   This is a Free-plan feature (Redirect Rules are part of the free Rulesets
   engine). **If a rule was created earlier in the apex→www direction, it needs to
   be edited to this direction instead — it was set up before the canonical domain
   was reversed.**

## 2. DNS records in Cloudflare

**In place** (apex + www pointing at the Worker, created automatically when each
Custom Domain was added in step 1.4).

**Kept** (email — unrelated to hosting, do not remove):
- `MX @ mx1.improvmx.com` — priority `10`
- `MX @ mx2.improvmx.com` — priority `20`
- `TXT @ "v=spf1 include:spf.improvmx.com ~all"`
- `TXT @ "google-site-verification=PmWcdfj5HRe_DNV2nAD13u_W_9ERpcRDiat4zpgNsgk"`

**Safe to remove whenever convenient** (found during the Cloudflare DNS import
scan, not visible from the repo — leftover Mailchimp DKIM keys from a mailing-list
integration that's no longer in use, per repo owner):
- `CNAME k2._domainkey → dkim2.mcsv.net`
- `CNAME k3._domainkey → dkim3.mcsv.net`

**Removed**: the four GitHub Pages A records on `@` (`185.199.108.153`,
`185.199.109.153`, `185.199.110.153`, `185.199.111.153`) and the old `www` CNAME
pointing at GitHub Pages.

## 3. Nameservers (done)

Switched at the registrar from `dns1–5.name-services.com` to:
- `jessica.ns.cloudflare.com`
- `leland.ns.cloudflare.com`

No DNSSEC was configured at the registrar, so there was nothing to disable there.

## 4. Verify

- `https://louisestrawbridge.com/` loads the site directly.
- `https://www.louisestrawbridge.com/` redirects (301) to
  `https://louisestrawbridge.com/` — test a deep link too, e.g.
  `https://www.louisestrawbridge.com/about/`, to confirm the path is preserved by
  the Redirect Rule.
- HTTPS has a valid certificate on both hostnames.
- View source (or check the sitemap at `/sitemap.xml`) and confirm canonical/OG
  tags and URLs now read `https://louisestrawbridge.com/...` — this requires the
  Worker to have been redeployed after the `baseURL` change in
  `config/_default/hugo.toml` (apex now, was `www`).
- Send a test email to an address at the domain and confirm it still forwards via
  ImprovMX (email routing is untouched by this migration, but DNS record edits are
  always worth double-checking).

## 5. Rollback

If something needs to be undone:
1. At the registrar, switch nameservers back to `dns1–5.name-services.com`.
2. GitHub repo → Settings → Pages → re-enable Pages (it was explicitly disabled
   during this migration, unlike a typical in-progress cutover — so rollback needs
   this extra step, not just a DNS revert).
3. No repo changes need reverting to fall back — `wrangler.jsonc` and
   `deploy-cloudflare.yml` are inert once DNS points elsewhere again. The Redirect
   Rule is dashboard config, not a repo file; same story.

## 6. Cleanup (done)

1. GitHub Pages disabled in repo settings.
2. `.github/workflows/hugo.yml` deleted.
3. There was never a `CNAME` file to remove — this repo never had one; the GitHub
   Pages custom domain was configured only in the repo's Pages settings.
4. Optional: remove the `github-pages` deployment environment under repo Settings →
   Environments, once you're confident you won't roll back.
