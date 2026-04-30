import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

describe("Cliente Supabase para Client Components", () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    vi.resetModules();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("crea un cliente cuando las variables de entorno están configuradas", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    const { createSupabaseBrowserClient } = await import("./client");
    const client = createSupabaseBrowserClient();

    expect(client).toBeDefined();
    expect(client.auth).toBeDefined();
  });

  it("lanza un error explícito cuando NEXT_PUBLIC_SUPABASE_URL no está definida", async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "test-anon-key";

    const { createSupabaseBrowserClient } = await import("./client");

    expect(() => createSupabaseBrowserClient()).toThrowError(
      /Variables de entorno de Supabase no configuradas/
    );
  });

  it("lanza un error explícito cuando NEXT_PUBLIC_SUPABASE_ANON_KEY no está definida", async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://test.supabase.co";
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    const { createSupabaseBrowserClient } = await import("./client");

    expect(() => createSupabaseBrowserClient()).toThrowError(
      /Variables de entorno de Supabase no configuradas/
    );
  });
});