# Setup
- Install git submodules  
```bash
git submodule init
git submodule update
```

- Install hugo  
```bash
brew install hugo
```

- add `node_modules` to .gitignore  

- install javascript packages
```bash
npm install
```

- build the site
```bash
rm -rf public # for a full clean install remove 
hugo --gc # add --gc for full garbage collection
```

- run the site
```bash
hugo serveer --disableFastRender # enable for full rebuilds on change
```

## Cloudflare Workers deployment

The site is deployed as a static-assets Cloudflare Worker (`wrangler.jsonc`,
`assets.directory` pointing at Hugo's `public/` output).

- Preview the built site the way it will actually be served (clean URLs, the 404
  page), after running a Hugo build:
```bash
hugo --gc --minify
npx wrangler dev
```
- Deploy manually (requires `wrangler login` or `CLOUDFLARE_API_TOKEN`/`CLOUDFLARE_ACCOUNT_ID`
  env vars):
```bash
hugo --gc --minify
npx wrangler deploy
```
- Normally you don't need to deploy manually — pushing to `main` runs
  `.github/workflows/deploy-cloudflare.yml`, which builds with Hugo and deploys with
  `wrangler` using the `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` repository
  secrets. See `MIGRATION.md` for the one-time Cloudflare/DNS setup.

### Inspirations

https://www.matthewharriscloth.co.uk/see/


### Points to disucss

- github?
- static page copy  
- gallery captions  
- mailchimp setup  
-- physical address  

### Investigate

- https://buttondown.email/ for newsletters