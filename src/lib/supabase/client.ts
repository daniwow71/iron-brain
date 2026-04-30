/**
 * Cliente de Supabase para Client Components.
 *
 * Se ejecuta en el navegador. Utiliza únicamente las credenciales públicas
 * (URL y anon key). El control de acceso real lo aplica Row Level Security
 * en la base de datos.
 */

import { createBrowserClient } from "@supabase/ssr";

/**
 * Devuelve un cliente de Supabase configurado para uso en Client Components.
 *
 * Las credenciales se leen de las variables públicas de entorno expuestas
 * en el navegador (`NEXT_PUBLIC_*`).
 */
export function createSupabaseBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Variables de entorno de Supabase no configuradas: " +
        "NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY son obligatorias."
    );
  }

  return createBrowserClient(url, anonKey);
}