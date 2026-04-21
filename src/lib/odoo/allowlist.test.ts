import { describe, it, expect } from "vitest";
import {
  isAllowedOdooMethod,
  assertAllowedOdooMethod,
  OdooReadOnlyViolationError,
} from "./allowlist";
import { ALLOWED_ODOO_METHODS } from "./types";

describe("Allowlist de métodos Odoo", () => {
  describe("isAllowedOdooMethod", () => {
    it.each(ALLOWED_ODOO_METHODS)("acepta el método permitido %s", (method) => {
      expect(isAllowedOdooMethod(method)).toBe(true);
    });

    it.each(["create", "write", "unlink", "copy", "execute"])(
      "rechaza el método no permitido %s",
      (method) => {
        expect(isAllowedOdooMethod(method)).toBe(false);
      }
    );

    it("rechaza cadenas vacías", () => {
      expect(isAllowedOdooMethod("")).toBe(false);
    });

    it("rechaza cadenas que parecen métodos permitidos pero con mayúsculas", () => {
      expect(isAllowedOdooMethod("SEARCH")).toBe(false);
    });
  });

  describe("assertAllowedOdooMethod", () => {
    it("no lanza para un método permitido", () => {
      expect(() => assertAllowedOdooMethod("search", "res.partner")).not.toThrow();
    });

    it("lanza OdooReadOnlyViolationError para un método prohibido", () => {
      expect(() => assertAllowedOdooMethod("write", "res.partner")).toThrow(
        OdooReadOnlyViolationError
      );
    });

    it("incluye el método y el modelo en la instancia de error", () => {
      try {
        assertAllowedOdooMethod("unlink", "sale.order");
        // Si no lanza, fallamos el test explícitamente.
        expect.fail("Debería haber lanzado OdooReadOnlyViolationError");
      } catch (error) {
        expect(error).toBeInstanceOf(OdooReadOnlyViolationError);
        if (error instanceof OdooReadOnlyViolationError) {
          expect(error.method).toBe("unlink");
          expect(error.model).toBe("sale.order");
        }
      }
    });

    it("el mensaje de error contiene los métodos permitidos para ayudar en auditoría", () => {
      try {
        assertAllowedOdooMethod("create", "res.partner");
        expect.fail("Debería haber lanzado OdooReadOnlyViolationError");
      } catch (error) {
        if (error instanceof OdooReadOnlyViolationError) {
          for (const permitido of ALLOWED_ODOO_METHODS) {
            expect(error.message).toContain(permitido);
          }
        }
      }
    });
  });
});