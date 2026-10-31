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
  app.get("/", (_req, res) => {
    res.type("html").send(homeHtml);
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
