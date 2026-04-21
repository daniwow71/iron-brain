import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { jsonRpcCall, OdooTransportError, OdooRemoteError } from "./transport";

describe("Transporte JSON-RPC", () => {
  const originalFetch = globalThis.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    globalThis.fetch = originalFetch;
  });

  it("construye correctamente la petición JSON-RPC y envía POST al endpoint /jsonrpc", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ jsonrpc: "2.0", id: 1, result: 42 }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    const result = await jsonRpcCall<number>(
      "https://odoo.example.com",
      "common",
      "login",
      ["db", "user", "pass"]
    );

    expect(result).toBe(42);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [calledUrl, calledOptions] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe("https://odoo.example.com/jsonrpc");
    expect(calledOptions.method).toBe("POST");
    expect((calledOptions.headers as Record<string, string>)["Content-Type"]).toBe("application/json");

    const parsedBody = JSON.parse(calledOptions.body as string);
    expect(parsedBody.jsonrpc).toBe("2.0");
    expect(parsedBody.method).toBe("call");
    expect(parsedBody.params).toEqual({
      service: "common",
      method: "login",
      args: ["db", "user", "pass"],
    });
    expect(typeof parsedBody.id).toBe("number");
  });

  it("elimina la barra final de la URL base al componer el endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ jsonrpc: "2.0", id: 1, result: true }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await jsonRpcCall("https://odoo.example.com///", "common", "version", []);

    const [calledUrl] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(calledUrl).toBe("https://odoo.example.com/jsonrpc");
  });

  it("lanza OdooTransportError cuando fetch falla por red", async () => {
    const fetchMock = vi.fn().mockRejectedValue(new TypeError("fetch failed"));
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      jsonRpcCall("https://odoo.example.com", "common", "login", [])
    ).rejects.toBeInstanceOf(OdooTransportError);
  });

  it("lanza OdooTransportError con statusCode cuando el HTTP no es exitoso", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      statusText: "Internal Server Error",
      json: async () => ({}),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      await jsonRpcCall("https://odoo.example.com", "common", "login", []);
      expect.fail("Debería haber lanzado OdooTransportError");
    } catch (error) {
      expect(error).toBeInstanceOf(OdooTransportError);
      if (error instanceof OdooTransportError) {
        expect(error.statusCode).toBe(500);
      }
    }
  });

  it("lanza OdooRemoteError cuando la respuesta contiene 'error'", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        jsonrpc: "2.0",
        id: 1,
        error: {
          code: 200,
          message: "Odoo Server Error",
          data: { name: "odoo.exceptions.AccessError", arguments: ["Denegado"] },
        },
      }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    try {
      await jsonRpcCall("https://odoo.example.com", "object", "execute_kw", []);
      expect.fail("Debería haber lanzado OdooRemoteError");
    } catch (error) {
      expect(error).toBeInstanceOf(OdooRemoteError);
      if (error instanceof OdooRemoteError) {
        expect(error.code).toBe(200);
        expect(error.message).toBe("Odoo Server Error");
      }
    }
  });

  it("lanza OdooTransportError cuando el JSON de respuesta no es válido", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => {
        throw new SyntaxError("Unexpected token");
      },
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      jsonRpcCall("https://odoo.example.com", "common", "login", [])
    ).rejects.toBeInstanceOf(OdooTransportError);
  });

  it("lanza OdooTransportError cuando la respuesta no contiene ni result ni error", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ jsonrpc: "2.0", id: 1 }),
    });
    globalThis.fetch = fetchMock as unknown as typeof fetch;

    await expect(
      jsonRpcCall("https://odoo.example.com", "common", "login", [])
    ).rejects.toBeInstanceOf(OdooTransportError);
  });
});