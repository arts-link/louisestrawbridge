# Migration checklist: GitHub Pages → Cloudflare Workers

Canonical domain is **`www.louisestrawbridge.com`** (apex `louisestrawbridge.com`
redirects to `www`). Free plan only, no paid Cloudflare features.

## 1. Cloudflare account setup

1. Add `louisestrawbridge.com` as a site/zone in Cloudflare (Free plan). Cloudflare
   will scan existing DNS records — review them against the "DNS records" section
   below before continuing, since the scan can miss or mis-copy records.
2. Create GitHub repository secrets (Settings → Secrets and variables → Actions):
   - `CLOUDFLARE_API_TOKEN` — a Cloudflare API token scoped to **Account → Workers
     Scripts → Edit** (and **Account → Workers Custom Domains → Edit**, if you want
     the same token to manage custom domains via the dashboard/API instead of only
     via the dashboard UI). Create it under My Profile → API Tokens → Create Token.
   - `CLOUDFLARE_ACCOUNT_ID` — found on the right sidebar of any zone's Overview page
     in the Cloudflare dashboard.
   Do not commit either value anywhere in the repo.
3. First deploy: push this branch (or merge the PR) so
   `.github/workflows/deploy-cloudflare.yml` runs, or run `npx wrangler deploy`
   locally after `wrangler login`. This creates the Worker (named `louisestrawbridge`,
   per `wrangler.jsonc`) and gives you a working `https://louisestrawbridge.<your
   subdomain>.workers.dev` URL — verify the site there before touching DNS.
4. In the Cloudflare dashboard, go to the `louisestrawbridge` Worker → **Settings →
   Domains & Routes → Add → Custom Domain**, and add both:
   - `www.louisestrawbridge.com`
   - `louisestrawbridge.com`
   Cloudflare will create/adjust the necessary DNS records automatically when you add
   each Custom Domain (this is what replaces the GitHub Pages A/CNAME records — see
   below).

## 2. DNS records in Cloudflare

Once the zone is active in Cloudflare and nameservers are cut over (see order below),
the zone's DNS tab should end up with:

**Added automatically by "Add Custom Domain" in step 1.4 above** (apex + www pointing
at the Worker) — you generally don't need to hand-create these, just confirm they
appear after adding each Custom Domain.

**Keep / add manually** (email — do not remove, this is unrelated to hosting):
- `MX @ mx1.improvmx.com` — priority `10`
- `MX @ mx2.improvmx.com` — priority `20`
- `TXT @ "v=spf1 include:spf.improvmx.com ~all"`
- `TXT @ "google-site-verification=PmWcdfj5HRe_DNV2nAD13u_W_9ERpcRDiat4zpgNsgk"`
**Safe to remove whenever you like** (found during the Cloudflare DNS import scan,
not visible from the repo — leftover Mailchimp DKIM keys from a mailing-list
integration that's no longer in use, per repo owner):
- `CNAME k2._domainkey → dkim2.mcsv.net`
- `CNAME k3._domainkey → dkim3.mcsv.net`

**Remove — but only after the Worker's Custom Domains are confirmed working**
(step 1.4 already replaces what these did):
- The four GitHub Pages A records on `@`: `185.199.108.153`, `185.199.109.153`,
  `185.199.110.153`, `185.199.111.153`
- Any existing `www` CNAME pointing at `<user>.github.io`

## 3. Cutover order

1. Deploy to the Worker's `*.workers.dev` URL (step 1.3 above) and click through the
   home page, a few inner pages, images, and a broken link to confirm the 404 page —
   all while GitHub Pages is still live and DNS hasn't moved.
2. At your domain registrar, switch nameservers from `dns1–5.name-services.com` to
   the two Cloudflare-assigned nameservers shown on the zone's Overview page
   (assigned for this zone: `jessica.ns.cloudflare.com` and `leland.ns.cloudflare.com`).
   **Before switching, confirm DNSSEC is OFF** at the registrar (a DNSSEC record
   pointing at the old nameservers will break resolution once Cloudflare's
   nameservers take over — disable it first, or Cloudflare's own DNSSEC after
   cutover, but not both old+new at once).
3. Wait for nameserver propagation (Cloudflare emails you when the zone is active;
   can take a few hours up to ~24h).
4. Add both Custom Domains to the Worker (step 1.4), if you haven't already.
5. Test:
   - `https://www.louisestrawbridge.com/` loads the site
   - `https://louisestrawbridge.com/` redirects (301) to `https://www.louisestrawbridge.com/`
   - HTTPS has a valid certificate on both hostnames (Cloudflare issues this
     automatically for Custom Domains, usually within minutes)
   - Send a test email to an address at the domain and confirm it still forwards via
     ImprovMX (email routing is untouched by this migration, but DNS record edits are
     always worth double-checking)

## 4. Rollback

If something goes wrong after the nameserver switch:
1. At the registrar, switch nameservers back to `dns1–5.name-services.com`.
2. GitHub Pages was never disabled during this migration, so once DNS propagates back,
   the site resolves through Pages again exactly as before.
3. No repo changes need reverting — the Cloudflare-specific files
   (`wrangler.jsonc`, `static/_redirects`, `deploy-cloudflare.yml`) are inert unless
   DNS points at Cloudflare.

## 5. Post-cutover cleanup (only after the new setup is confirmed stable)

1. GitHub repo → Settings → Pages → set source to "None" / disable Pages.
2. Delete `.github/workflows/hugo.yml` (the old GitHub Pages build/deploy workflow).
3. There is no `CNAME` file to remove — this repo never had one; the GitHub Pages
   custom domain was configured only in the repo's Pages settings (now disabled in
   step 1 above).
4. Optionally remove the `github-pages` deployment environment under repo Settings →
   Environments, once you're confident you won't roll back.
