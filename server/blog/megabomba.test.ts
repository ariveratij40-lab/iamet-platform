import { describe, it, expect } from "vitest";
import { parsearVolumen, parsearTrends } from "./megabomba";

describe("detector de mega noticia", () => {
  it("convierte el volumen de búsquedas a número", () => {
    expect(parsearVolumen("100,000+")).toBe(100000);
    expect(parsearVolumen("500+")).toBe(500);
    expect(parsearVolumen("2 mil")).toBe(2000);
    expect(parsearVolumen("")).toBe(0);
  });

  it("extrae tendencias con su volumen del RSS de Trends", () => {
    const xml = `<rss><channel>
      <item><title>GTA VI</title><ht:approx_traffic>500,000+</ht:approx_traffic>
        <ht:news_item_title>Rockstar anuncia la fecha de GTA VI</ht:news_item_title></item>
      <item><title>Club Tigres</title><ht:approx_traffic>200+</ht:approx_traffic></item>
    </channel></rss>`;
    const t = parsearTrends(xml);
    expect(t[0].titulo).toBe("GTA VI");
    expect(t[0].volumen).toBe(500000);
    expect(t[0].contexto).toMatch(/Rockstar/);
    expect(t[1].volumen).toBe(200);
  });
});
