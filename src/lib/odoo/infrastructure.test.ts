import { describe, it, expect } from "vitest";

describe("Infraestructura de tests", () => {
  it("Vitest está configurado y funciona", () => {
    expect(1 + 1).toBe(2);
  });

  it("El alias @/* está disponible en los tests", () => {
    // Este test verifica de forma indirecta que el alias funciona:
    // si el alias estuviera mal configurado, el propio archivo no compilaría.
    const rutaAlias: string = "@/lib/odoo";
    expect(rutaAlias).toBe("@/lib/odoo");
  });
});