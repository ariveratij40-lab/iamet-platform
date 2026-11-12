import { describe, it, expect, vi, beforeEach } from "vitest";
import { parsearRss, limpiarTexto, titularesDelDia } from "./sources";
import { parsearBlog } from "./writer";

describe("fuentes del blog (parseo de titulares)", () => {
  const rss = `<rss><channel>
    <title>Google Noticias</title>
    <item><title>Sale un nuevo videojuego de aventuras - IGN</title>
      <description>&lt;p&gt;El juego llega en diciembre&lt;/p&gt;</description>
      <link>https://ej.com/1</link></item>
    <item><title>La NASA presenta un avión experimental - La Jornada</title>
      <description>Nave de pruebas</description>
      <link>https://ej.com/2</link></item>
  </channel></rss>`;

  it("extrae titulares y separa la fuente", () => {
    const t = parsearRss(rss, "videojuegos");
    expect(t).toHaveLength(2);
    expect(t[0].titulo).toBe("Sale un nuevo videojuego de aventuras");
    expect(t[0].fuente).toBe("IGN");
    expect(t[0].tema).toBe("videojuegos");
  });

  it("limpia HTML y entidades del resumen", () => {
    expect(limpiarTexto("<p>Hola &amp; adiós</p>")).toBe("Hola & adiós");
  });

  it("descarta titulares demasiado cortos", () => {
    const corto = `<rss><channel><item><title>Hola</title></item></channel></rss>`;
    expect(parsearRss(corto, "tech")).toHaveLength(0);
  });
});

describe("parseo del blog que escribe la IA", () => {
  const json = JSON.stringify({
    titulo: "Un videojuego que no esperabas",
    entradilla: "Lo nuevo del mes.",
    cuerpo: "Primer párrafo con suficiente texto para pasar.\n\nSegundo párrafo con más detalle del tema.",
    metaDescripcion: "Resumen corto",
    palabraImagen: "video game",
    temaElegido: "Sale un nuevo videojuego - IGN",
  });

  it("genera un slug válido del título", () => {
    const b = parsearBlog(json)!;
    expect(b.slug).toBe("un-videojuego-que-no-esperabas");
    expect(b.titulo).toBe("Un videojuego que no esperabas");
  });

  it("tolera texto alrededor del JSON", () => {
    expect(parsearBlog("Claro:\n" + json + "\nlisto")?.titulo).toBe("Un videojuego que no esperabas");
  });

  it("rechaza respuestas sin cuerpo suficiente", () => {
    expect(parsearBlog('{"titulo":"Hola","cuerpo":"x"}')).toBeNull();
    expect(parsearBlog("no json")).toBeNull();
  });
});

describe("titularesDelDia resiliente", () => {
  beforeEach(() => vi.restoreAllMocks());
  it("devuelve [] si ninguna fuente responde (no rompe)", async () => {
    vi.spyOn(global, "fetch").mockRejectedValue(new Error("sin red"));
    expect(await titularesDelDia()).toEqual([]);
  });
});
