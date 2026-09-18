// Generates OG/social-share images from real HTML + CSS (Satori -> SVG -> PNG),
// run before `hugo build`. Hugo's own image pipeline can't draw rounded rects,
// can't measure real glyph widths, and can't wrap text -- all of which this
// design needs, so it's done here instead.
import fs from "node:fs";
import path from "node:path";
import satori from "satori";
import { Resvg } from "@resvg/resvg-js";
import sharp from "sharp";

const ROOT = process.cwd();
const CONTENT_DIR = path.join(ROOT, "content");
const OUT_DIR = path.join(ROOT, "assets", "generated", "og");
const IMAGE_EXT = /\.(jpe?g|png)$/i;

const CANVAS_W = 1200;
const CANVAS_H = 630;

const INK = "#1c1a17";
const SECTION_GREEN = "#3c4f3d";
const URL_COLOR = "#d8d2c6";
const PAPER = "#e8e5de";

// Top-level content sections that get a "SECTION" chip; value is used only to
// look up each section's own _index.md title (e.g. "Artists' Books").
const GALLERY_SECTIONS = new Set(["collage", "sculpture", "artistsbooks"]);

function readFrontMatterTitle(filePath) {
  const raw = fs.readFileSync(filePath, "utf8");
  const m = raw.match(/^\+\+\+([\s\S]*?)\+\+\+/);
  if (!m) return null;
  const titleMatch = m[1].match(/^\s*title\s*=\s*(['"])(.*?)\1/m);
  return titleMatch ? titleMatch[2] : null;
}

function readTomlString(filePath, key) {
  const raw = fs.readFileSync(filePath, "utf8");
  const m = raw.match(new RegExp(`^\\s*${key}\\s*=\\s*(['"])(.*?)\\1`, "m"));
  return m ? m[2] : null;
}

function listImages(dir) {
  return fs
    .readdirSync(dir)
    .filter((f) => IMAGE_EXT.test(f))
    .sort();
}

function slugFromUrl(url) {
  const trimmed = url.replace(/^\/|\/$/g, "");
  return trimmed === "" ? "home" : trimmed.replace(/\//g, "-");
}

// Mirrors this site's content layout 1:1 onto URL paths (confirmed no custom
// permalinks are configured), so recursing content/ gives the same structure
// Hugo would build.
function walk(dir, urlPrefix, pages, sectionTitle) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // Hugo lowercases URLs by default (disablePathToLower is not set), but
    // content directory/file names on disk aren't necessarily lowercase --
    // use the real filesystem name for I/O, the lowercased name for URLs.
    const urlName = entry.name.toLowerCase();
    if (entry.isDirectory()) {
      const sub = path.join(dir, entry.name);
      const leafIndex = path.join(sub, "index.md");
      const sectionIndex = path.join(sub, "_index.md");
      const isGallerySection = urlPrefix === "" && GALLERY_SECTIONS.has(urlName);
      if (fs.existsSync(leafIndex)) {
        pages.push({
          url: `${urlPrefix}/${urlName}/`,
          title: readFrontMatterTitle(leafIndex),
          section: sectionTitle,
          images: listImages(sub),
          dir: sub,
        });
      } else if (fs.existsSync(sectionIndex)) {
        const title = readFrontMatterTitle(sectionIndex);
        pages.push({
          url: `${urlPrefix}/${urlName}/`,
          title,
          section: isGallerySection ? title : sectionTitle,
          images: [],
          dir: sub,
        });
        walk(sub, `${urlPrefix}/${urlName}`, pages, isGallerySection ? title : sectionTitle);
      } else {
        walk(sub, `${urlPrefix}/${urlName}`, pages, sectionTitle);
      }
    } else if (entry.name.endsWith(".md") && !entry.name.startsWith("_index") && entry.name !== "index.md") {
      const slug = urlName.replace(/\.md$/, "");
      pages.push({
        url: `${urlPrefix}/${slug}/`,
        title: readFrontMatterTitle(path.join(dir, entry.name)),
        section: sectionTitle,
        images: [],
        dir,
      });
    }
  }
}

function collectPages() {
  const pages = [
    {
      url: "/",
      title: readFrontMatterTitle(path.join(CONTENT_DIR, "_index.md")),
      section: null,
      images: [],
      dir: CONTENT_DIR,
    },
  ];
  walk(CONTENT_DIR, "", pages, null);
  return pages;
}

function toDataUri(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = ext === ".png" ? "image/png" : "image/jpeg";
  const data = fs.readFileSync(filePath).toString("base64");
  return `data:${mime};base64,${data}`;
}

async function main() {
  const hugoConfig = path.join(ROOT, "config", "_default", "hugo.toml");
  const siteDomain = readTomlString(hugoConfig, "site") || "louisestrawbridge.com";
  const siteDescription = readTomlString(hugoConfig, "description") || "";

  const fontDir = path.join(ROOT, "assets", "common-partials", "opengraph", "fonts");
  const archivo500 = fs.readFileSync(path.join(fontDir, "archivo-500.ttf"));
  const archivo600 = fs.readFileSync(path.join(fontDir, "archivo-600.ttf"));
  const instrumentSerif = fs.readFileSync(path.join(fontDir, "instrument-serif-400.ttf"));

  const paperBgUri = toDataUri(path.join(ROOT, "static", "images", "img_bg.jpg"));
  const logoUri = toDataUri(path.join(ROOT, "static", "images", "louisestrawbridge.png"));

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const pages = collectPages();
  console.log(`Generating ${pages.length} OG images...`);

  for (const page of pages) {
    const isHome = page.url === "/";
    const title = ((isHome ? siteDescription : page.title) || siteDescription).replace(/^<\s*/, "");
    const titleSize = title.length > 40 ? 68 : 84;
    const hasImage = page.images.length > 0;

    const children = [];

    if (hasImage) {
      children.push({
        type: "img",
        props: {
          src: toDataUri(path.join(page.dir, page.images[0])),
          style: {
            position: "absolute",
            inset: 0,
            width: CANVAS_W,
            height: CANVAS_H,
            objectFit: "cover",
            objectPosition: "center",
          },
        },
      });
    } else {
      // No page photo: the site's own paper texture + signature/name/tagline
      // lockup as the hero, same as before this redesign.
      children.push({
        type: "img",
        props: {
          src: paperBgUri,
          style: {
            position: "absolute",
            inset: 0,
            width: CANVAS_W,
            height: CANVAS_H,
            objectFit: "cover",
          },
        },
      });
      children.push({
        type: "div",
        props: {
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            width: CANVAS_W,
            height: CANVAS_H,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
          children: [
            {
              type: "img",
              props: {
                src: logoUri,
                // Satori needs explicit numeric dimensions -- no intrinsic
                // sizing / "auto". Logo is 586x193.
                style: { width: 620, height: 204 },
              },
            },
          ],
        },
      });
    }

    const stack = [];
    if (page.section) {
      stack.push({
        type: "div",
        props: {
          style: {
            alignSelf: "flex-start",
            background: SECTION_GREEN,
            color: "#fff",
            padding: "12px 40px 12px 64px",
            fontSize: 19,
            fontWeight: 600,
            letterSpacing: "0.22em",
            fontFamily: "Archivo600",
          },
          children: page.section.toUpperCase(),
        },
      });
    }
    stack.push({
      type: "div",
      props: {
        style: {
          alignSelf: "flex-start",
          background: INK,
          color: "#fff",
          padding: "30px 64px 34px 64px",
          display: "flex",
          flexDirection: "column",
          gap: 10,
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                fontFamily: "InstrumentSerif",
                fontSize: titleSize,
                lineHeight: 0.96,
                maxWidth: 900,
              },
              children: title,
            },
          },
          {
            type: "div",
            props: {
              style: {
                fontSize: 21,
                letterSpacing: "0.06em",
                color: URL_COLOR,
                fontFamily: "Archivo500",
              },
              children: siteDomain,
            },
          },
        ],
      },
    });

    children.push({
      type: "div",
      props: {
        style: {
          position: "absolute",
          left: 0,
          bottom: 0,
          display: "flex",
          flexDirection: "column",
        },
        children: stack,
      },
    });

    const element = {
      type: "div",
      props: {
        style: {
          width: CANVAS_W,
          height: CANVAS_H,
          display: "flex",
          position: "relative",
          overflow: "hidden",
          background: hasImage ? INK : PAPER,
          fontFamily: "Archivo500",
        },
        children,
      },
    };

    const svg = await satori(element, {
      width: CANVAS_W,
      height: CANVAS_H,
      fonts: [
        { name: "Archivo500", data: archivo500, weight: 500, style: "normal" },
        { name: "Archivo600", data: archivo600, weight: 600, style: "normal" },
        { name: "InstrumentSerif", data: instrumentSerif, weight: 400, style: "normal" },
      ],
    });

    const png = new Resvg(svg, { fitTo: { mode: "width", value: CANVAS_W } }).render().asPng();
    // Rendered as PNG (Resvg doesn't emit JPEG directly), but that's ~1MB+ per
    // photo-background card -- re-encode to JPEG so these stay reasonably
    // sized for social crawlers.
    const jpeg = await sharp(png).jpeg({ quality: 85 }).toBuffer();
    const slug = slugFromUrl(page.url);
    fs.writeFileSync(path.join(OUT_DIR, `${slug}.jpg`), jpeg);
  }

  console.log(`Done. Wrote ${pages.length} images to ${path.relative(ROOT, OUT_DIR)}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
