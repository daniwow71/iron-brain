/**
 * Helper de Supabase para el middleware de Next.js.
 *
 * El middleware se ejecuta antes de cada petición y se encarga de mantener
 * vigente la sesión del usuario refrescando los tokens de Supabase Auth
 * a partir de las cookies de la petición.
 *
 * No realiza autorización: solo gestión de sesión. La autorización por rol
 * y por ruta se hará en una capa posterior.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Refresca la sesión de Supabase a partir de las cookies de la petición.
 * Devuelve la respuesta de Next.js con las cookies actualizadas para que
 * la sesión se mantenga sincronizada entre cliente y servidor.
 */
export async function updateSupabaseSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Variables de entorno de Supabase no configuradas en middleware."
    );
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        supabaseResponse = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          supabaseResponse.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresca la sesión sin disparar redirecciones aquí: la autorización
  // por ruta es responsabilidad de una capa superior.
  await supabase.auth.getUser();

  return supabaseResponse;
}