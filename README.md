<p align="center">
  <a href="https://louisestrawbridge.com/"><img src="static/images/louisestrawbridge.png" alt="Louise Strawbridge" width="360"></a>
</p>

<h1 align="center">Louise Strawbridge</h1>

<p align="center"><em>collage · assemblage · artist's books</em></p>

<p align="center">
  <a href="https://louisestrawbridge.com/"><img alt="Website status" src="https://img.shields.io/website?url=https%3A%2F%2Flouisestrawbridge.com&up_message=online&down_message=in%20the%20studio&style=for-the-badge&logo=googlechrome&logoColor=white"></a>
  <a href="https://developers.cloudflare.com/workers/static-assets/"><img alt="Deployed on Cloudflare Workers" src="https://img.shields.io/badge/deploys-Cloudflare%20Workers-F38020?style=for-the-badge&logo=cloudflare&logoColor=white"></a>
  <a href="https://www.arts-link.com/"><img alt="Built by Arts-Link" src="https://img.shields.io/badge/built%20by-Arts--Link-0F766E?style=for-the-badge"></a>
</p>

<p align="center">
  <a href="https://gohugo.io/"><img alt="Built with Hugo" src="https://img.shields.io/badge/built%20with-Hugo-FF4088?style=flat-square&logo=hugo&logoColor=white"></a>
  <a href="https://github.com/nicokaiser/hugo-theme-gallery"><img alt="Gallery theme" src="https://img.shields.io/badge/theme-Gallery-2563EB?style=flat-square&logo=github&logoColor=white"></a>
</p>

<p align="center">
  <a href="https://github.com/arts-link/louisestrawbridge/commits/main"><img alt="Last commit" src="https://img.shields.io/github/last-commit/arts-link/louisestrawbridge?style=flat-square&logo=github"></a>
  <a href="https://github.com/arts-link/louisestrawbridge/graphs/commit-activity"><img alt="Commit activity" src="https://img.shields.io/github/commit-activity/m/arts-link/louisestrawbridge?style=flat-square&logo=github"></a>
  <a href="https://github.com/arts-link/louisestrawbridge"><img alt="Repository size" src="https://img.shields.io/github/repo-size/arts-link/louisestrawbridge?style=flat-square&logo=github"></a>
</p>

This repository is the source for [louisestrawbridge.com](https://louisestrawbridge.com/) —
the work of Louise Strawbridge, a collage, sculpture, and artist's-book maker working in
Philadelphia.

## What's here

**[Collage](https://louisestrawbridge.com/collage/)** — handmade papers and dye joined
together in collage form, including the *Black Lives Matter*, *Red Brings Good Fortune*,
and *Seeing in the Dark* series.

**[Sculpture](https://louisestrawbridge.com/sculpture/)** — boxes, vessels, stele, and the
life-size poetry people and papier-mâché hands.

**[Artist's Books](https://louisestrawbridge.com/artistsbooks/)** — handmade artist's books
and paper, from *Findings* to *Street Talk*.

## About the artist

> Louise Strawbridge uses a wide range of materials and textures to explore the
> possibilities of disturbing qualities in the commonplace. In her work, mystery is not to
> be solved but valued and explored. She received a M.A. in Literature from The University
> of Chicago in 1971 and taught English for many years. Making art became her full-time
> occupation when she moved to London in 1998. She has lived in Philadelphia with her
> husband, David, since 2003. Her work is in the permanent collection of Zhengzhou Art
> Museum, China.

## Built by Arts-Link

This site was built and is maintained by [Arts-Link](https://www.arts-link.com/), a
practice exploring how thoughtful websites, open-source tools, and practical technical
support can give artists, photographers, musicians, and galleries more time for the work
that matters — and less time fighting their websites. The
[Arts-Link GitHub organization](https://github.com/arts-link) is home to
[Ryder](https://github.com/arts-link/ryder) and other tools growing out of that idea.

## Under the hood

Static Hugo site — no CMS, no database, no backend. Each gallery is a page bundle: a
`index.md` alongside the full-resolution images, which Hugo resizes and serves as
responsive thumbnails via the [Gallery](https://github.com/nicokaiser/hugo-theme-gallery)
theme. Deployed as a Cloudflare Worker (static assets) via GitHub Actions on every push to
`main`; see [`MIGRATION.md`](./MIGRATION.md) for the full hosting/DNS setup this site
migrated to from GitHub Pages.

Local development:

```bash
git submodule update --init --recursive   # pulls in the theme
npm install
npm run build                             # hugo --gc --minify -> public/
npm run dev                               # hugo server, for editing content
npm run preview                           # wrangler dev, to preview the deploy exactly
```

---

[Visit the site](https://louisestrawbridge.com/) ·
[Collage](https://louisestrawbridge.com/collage/) ·
[Sculpture](https://louisestrawbridge.com/sculpture/) ·
[Artist's Books](https://louisestrawbridge.com/artistsbooks/) ·
[About](https://louisestrawbridge.com/about/) ·
[Arts-Link](https://www.arts-link.com/) ·
[louisestrawbridge@gmail.com](mailto:louisestrawbridge@gmail.com)
