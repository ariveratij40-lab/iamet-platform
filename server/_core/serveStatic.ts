import {
  cablingPath,
  cablingTitle,
  cablingDescription,
  cablingHostname,
  cablingOrigin,
} from "../../shared/cabling-campaign";
import { ENV } from "./env";
import { homeBannerPreload } from "../../shared/banner-images";
/**
 * serveStatic.ts — Sirve los archivos estáticos del build de producción.
 * Este archivo NO importa 'vite' para que funcione en producción
 * donde vite es una devDependency no instalada.
 */
import express, { type Express } from "express";
import fs from "fs";
import path from "path";

export function serveStatic(app: Express) {
  const distPath =
    process.env.NODE_ENV === "development"
      ? path.resolve(import.meta.dirname, "../..", "dist", "public")
      : path.resolve(import.meta.dirname, "public");

  if (!fs.existsSync(distPath)) {
    console.error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }

  // The preload must be in the initial home HTML, before React discovers the image.
  const homeHtml = fs
    .readFileSync(path.join(distPath, "index.html"), "utf8")
    .replace("</head>", `${homeBannerPreload}</head>`);

  const escapeAttribute = (value: string) =>
    value.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const campaignUrl = escapeAttribute(
    `${(ENV.appUrl || "https://staging.iamet.mx").replace(/\/$/, "")}${cablingPath}`
  );
  const campaignHtml = homeHtml
    .replace(/<title>.*?<\/title>/, `<title>${cablingTitle}</title>`)
    .replace(
      /(<meta name="description" content=")[^"]*/,
      `$1${cablingDescription}`
    )
    .replace(/(<link rel="canonical" href=")[^"]*/, `$1${campaignUrl}`)
    .replace(/(<meta property="og:url" content=")[^"]*/, `$1${campaignUrl}`)
    .replace(
      /(<meta (?:property="og:|name="twitter:)title" content=")[^"]*/g,
      `$1${cablingTitle}`
    )
    .replace(
      /(<meta (?:property="og:|name="twitter:)description" content=")[^"]*/g,
      `$1${cablingDescription}`
    );
  const subdomainHtml = campaignHtml.replaceAll(
    campaignUrl,
    `${cablingOrigin}/`
  );
  app.get("/", (req, res) =>
    res
      .type("html")
      .send(req.hostname === cablingHostname ? subdomainHtml : homeHtml)
  );
  app.get(cablingPath, (req, res) => {
    if (req.hostname === cablingHostname) return res.redirect(302, "/");
    res.type("html").send(campaignHtml);
  });
  app.get(`${cablingPath}/gracias`, (_req, res) => {
    res.setHeader("X-Robots-Tag", "noindex, nofollow");
    res
      .type("html")
      .send(
        homeHtml.replace(
          /<meta name="robots" content="[^"]*"/,
          '<meta name="robots" content="noindex, nofollow"'
        )
      );
  });
  app.use(express.static(distPath));
  // Missing machine-readable files must not return the SPA's HTML with status 200.
  app.get(
    [
      "/llms.txt",
      "/ai-catalog.json",
      "/.well-known/ai-catalog.json",
      "/.well-known/ard.json",
    ],
    (_req, res) => {
      res.status(404).type("text").send("Not found");
    }
  );

  // fall through to index.html if the file doesn't exist
  app.use("*", (_req, res) => {
    res.sendFile(path.resolve(distPath, "index.html"));
  });
}
