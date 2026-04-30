/**
 * Cliente de Supabase para Server Components, Server Actions y Route Handlers.
 *
 * Se ejecuta en el servidor (Node.js / Vercel functions). Utiliza las cookies
 * de la petición HTTP para mantener la sesión del usuario autenticado y
 * consume las credenciales públicas de entorno.
 *
 * Para operaciones administrativas que deban saltarse las políticas de Row
 * Level Security, utilizar el cliente con `service_role_key`, definido en
 * el archivo `service.ts` (a crear cuando sea necesario).
 */

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Devuelve un cliente de Supabase configurado para uso server-side, con
 * gestión de cookies para sesión de usuario.
 *
 * Debe llamarse dentro de un Server Component, Server Action o Route Handler.
 * No se puede usar en Client Components.
 */
export async function createSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Variables de entorno de Supabase no configuradas: " +
        "NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son obligatorias."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // El método set() de cookies puede fallar si se llama desde un
          // Server Component (que no puede modificar cookies).
          // El middleware se encarga de refrescar la sesión, así que esta
          // excepción es esperada y se puede ignorar con seguridad.
        }
      },
    },
  });
}