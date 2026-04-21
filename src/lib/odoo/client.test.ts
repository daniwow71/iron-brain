import { describe, it, expect, beforeEach, vi } from "vitest";
import { OdooClient, OdooNotAuthenticatedError, OdooAuthenticationError } from "./client";
import { OdooReadOnlyViolationError } from "./allowlist";
import { OdooRemoteError } from "./transport";
import type { OdooCredentials } from "./types";

// Mockeamos el transporte entero. Todas las llamadas a jsonRpcCall pasan por mocks.
vi.mock("./transport", async () => {
  const actual = await vi.importActual<typeof import("./transport")>("./transport");
  return {
    ...actual,
    jsonRpcCall: vi.fn(),
  };
});

import { jsonRpcCall } from "./transport";

const mockedJsonRpcCall = vi.mocked(jsonRpcCall);

const credenciales: OdooCredentials = {
  url: "https://odoo.example.com",
  database: "todocesped",
  username: "api@todocesped.es",
  secret: "secret123",
};

describe("OdooClient", () => {
  beforeEach(() => {
    mockedJsonRpcCall.mockReset();
  });

  describe("autenticación", () => {
    it("authenticate guarda el uid cuando Odoo lo devuelve", async () => {
      mockedJsonRpcCall.mockResolvedValueOnce(7);

      const client = new OdooClient(credenciales);
      const uid = await client.authenticate();

      expect(uid).toBe(7);
      expect(client.isAuthenticated()).toBe(true);
      expect(client.getAuthenticatedUid()).toBe(7);
    });

    it("authenticate lanza OdooAuthenticationError cuando Odoo devuelve false", async () => {
      mockedJsonRpcCall.mockResolvedValueOnce(false);

      const client = new OdooClient(credenciales);

      await expect(client.authenticate()).rejects.toBeInstanceOf(OdooAuthenticationError);
      expect(client.isAuthenticated()).toBe(false);
    });

    it("authenticate envía las credenciales al endpoint common.login", async () => {
      mockedJsonRpcCall.mockResolvedValueOnce(1);

      const client = new OdooClient(credenciales);
      await client.authenticate();

      expect(mockedJsonRpcCall).toHaveBeenCalledWith(
        "https://odoo.example.com",
        "common",
        "login",
        ["todocesped", "api@todocesped.es", "secret123"]
      );
    });
  });

  describe("call", () => {
    it("lanza OdooNotAuthenticatedError si no se ha autenticado previamente", async () => {
      const client = new OdooClient(credenciales);

      await expect(
        client.call({
          model: "res.partner",
          method: "search_read",
          args: [[]],
        })
      ).rejects.toBeInstanceOf(OdooNotAuthenticatedError);
    });

    it("lanza OdooReadOnlyViolationError al invocar un método no permitido", async () => {
      mockedJsonRpcCall.mockResolvedValueOnce(1);
      const client = new OdooClient(credenciales);
      await client.authenticate();

      await expect(
        client.call({
          model: "res.partner",
          // @ts-expect-error probamos deliberadamente un método no permitido
          method: "write",
          args: [[1], { name: "Nuevo" }],
        })
      ).rejects.toBeInstanceOf(OdooReadOnlyViolationError);
    });

    it("no llega a invocar el transporte cuando el método no está permitido", async () => {
      mockedJsonRpcCall.mockResolvedValueOnce(1);
      const client = new OdooClient(credenciales);
      await client.authenticate();
      mockedJsonRpcCall.mockClear();

      await client
        .call({
          model: "res.partner",
          // @ts-expect-error método prohibido
          method: "unlink",
          args: [[1]],
        })
        .catch(() => undefined);

      expect(mockedJsonRpcCall).not.toHaveBeenCalled();
    });

    it("envía correctamente los argumentos a execute_kw cuando el método es permitido", async () => {
      mockedJsonRpcCall
        .mockResolvedValueOnce(7) // autenticación
        .mockResolvedValueOnce([{ id: 1, name: "TodoCESPED" }]); // search_read

      const client = new OdooClient(credenciales);
      await client.authenticate();

      const result = await client.call({
        model: "res.partner",
        method: "search_read",
        args: [[["is_company", "=", true]], ["id", "name"]],
        kwargs: { limit: 10 },
      });

      expect(result).toEqual([{ id: 1, name: "TodoCESPED" }]);
      expect(mockedJsonRpcCall).toHaveBeenLastCalledWith(
        "https://odoo.example.com",
        "object",
        "execute_kw",
        [
          "todocesped",
          7,
          "secret123",
          "res.partner",
          "search_read",
          [[["is_company", "=", true]], ["id", "name"]],
          { limit: 10 },
        ]
      );
    });

    it("pasa objeto vacío como kwargs cuando no se proporciona", async () => {
      mockedJsonRpcCall.mockResolvedValueOnce(1).mockResolvedValueOnce([]);

      const client = new OdooClient(credenciales);
      await client.authenticate();

      await client.call({
        model: "res.partner",
        method: "search",
        args: [[]],
      });

      const lastCall = mockedJsonRpcCall.mock.lastCall;
      const lastArgs = lastCall?.[3] as unknown[];
      expect(lastArgs[lastArgs.length - 1]).toEqual({});
    });

    it("propaga OdooRemoteError cuando el transporte lo lanza", async () => {
      mockedJsonRpcCall
        .mockResolvedValueOnce(1)
        .mockRejectedValueOnce(new OdooRemoteError(200, "Access Denied"));

      const client = new OdooClient(credenciales);
      await client.authenticate();

      await expect(
        client.call({
          model: "res.partner",
          method: "search_read",
          args: [[]],
        })
      ).rejects.toBeInstanceOf(OdooRemoteError);
    });
  });

  describe("healthCheck", () => {
    it("devuelve true cuando la autenticación tiene éxito", async () => {
      mockedJsonRpcCall.mockResolvedValueOnce(1);

      const client = new OdooClient(credenciales);
      const healthy = await client.healthCheck();

      expect(healthy).toBe(true);
    });

    it("devuelve false cuando la autenticación falla", async () => {
      mockedJsonRpcCall.mockResolvedValueOnce(false);

      const client = new OdooClient(credenciales);
      const healthy = await client.healthCheck();

      expect(healthy).toBe(false);
    });

    it("devuelve false cuando el transporte lanza error", async () => {
      mockedJsonRpcCall.mockRejectedValueOnce(new Error("network down"));

      const client = new OdooClient(credenciales);
      const healthy = await client.healthCheck();

      expect(healthy).toBe(false);
    });
  });
});