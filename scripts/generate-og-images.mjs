// Generates OG/social-share images from real HTML + CSS (Satori -> SVG -> PNG),
// run before `hugo build`. Hugo's own image pipeline can't draw rounded rects,
// so precise padding/centering/opacity for the title badge belongs here instead.
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
function walk(dir, urlPrefix, pages) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    // Hugo lowercases URLs by default (disablePathToLower is not set), but
    // content directory/file names on disk aren't necessarily lowercase --
    // use the real filesystem name for I/O, the lowercased name for URLs.
    const urlName = entry.name.toLowerCase();
    if (entry.isDirectory()) {
      const sub = path.join(dir, entry.name);
      const leafIndex = path.join(sub, "index.md");
      const sectionIndex = path.join(sub, "_index.md");
      if (fs.existsSync(leafIndex)) {
        pages.push({
          url: `${urlPrefix}/${urlName}/`,
          title: readFrontMatterTitle(leafIndex),
          images: listImages(sub),
          dir: sub,
        });
      } else if (fs.existsSync(sectionIndex)) {
        pages.push({
          url: `${urlPrefix}/${urlName}/`,
          title: readFrontMatterTitle(sectionIndex),
          images: [],
          dir: sub,
        });
        walk(sub, `${urlPrefix}/${urlName}`, pages);
      } else {
        walk(sub, `${urlPrefix}/${urlName}`, pages);
      }
    } else if (entry.name.endsWith(".md") && !entry.name.startsWith("_index") && entry.name !== "index.md") {
      const slug = urlName.replace(/\.md$/, "");
      pages.push({
        url: `${urlPrefix}/${slug}/`,
        title: readFrontMatterTitle(path.join(dir, entry.name)),
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
      images: [],
      dir: CONTENT_DIR,
    },
  ];
  walk(CONTENT_DIR, "", pages);
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

  const captionFont = fs.readFileSync(
    path.join(ROOT, "assets", "common-partials", "opengraph", "opengraph-font.ttf")
  );
  const paperBgPath = path.join(ROOT, "static", "images", "img_bg.jpg");
  const logoPath = path.join(ROOT, "static", "images", "louisestrawbridge.png");
  const paperBgUri = toDataUri(paperBgPath);
  const logoUri = toDataUri(logoPath);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const pages = collectPages();
  console.log(`Generating ${pages.length} OG images...`);

  for (const page of pages) {
    const title = (page.title || siteDescription).replace(/^<\s*/, "");
    const isHome = page.url === "/";
    const captionTitle = isHome ? siteDescription : title;
    const captionText = `${captionTitle} @ ${siteDomain}`;

    let backgroundChild;
    if (page.images.length > 0) {
      const imgUri = toDataUri(path.join(page.dir, page.images[0]));
      backgroundChild = {
        type: "img",
        props: {
          src: imgUri,
          style: {
            position: "absolute",
            top: 0,
            left: 0,
            width: CANVAS_W,
            height: CANVAS_H,
            objectFit: "cover",
          },
        },
      };
    } else {
      backgroundChild = {
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
                src: paperBgUri,
                style: {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: CANVAS_W,
                  height: CANVAS_H,
                  objectFit: "cover",
                },
              },
            },
            {
              type: "img",
              props: {
                src: logoUri,
                // Satori needs explicit numeric dimensions -- no intrinsic
                // sizing / "auto", unlike a real browser. Logo is 586x193.
                style: { position: "relative", width: 620, height: 204 },
              },
            },
          ],
        },
      };
    }

    const element = {
      type: "div",
      props: {
        style: {
          width: CANVAS_W,
          height: CANVAS_H,
          display: "flex",
          position: "relative",
        },
        children: [
          backgroundChild,
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                left: 40,
                bottom: 40,
                display: "flex",
                alignItems: "center",
                padding: "18px 32px",
                borderRadius: 16,
                backgroundColor: "rgba(20,20,20,0.6)",
                color: "#ffffff",
                fontSize: 38,
                fontFamily: "OGFont",
                lineHeight: 1,
              },
              children: captionText,
            },
          },
        ],
      },
    };

    const svg = await satori(element, {
      width: CANVAS_W,
      height: CANVAS_H,
      fonts: [{ name: "OGFont", data: captionFont, weight: 400, style: "normal" }],
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
