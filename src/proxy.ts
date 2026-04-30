/**
 * Proxy de Next.js (anteriormente "middleware").
 *
 * Se ejecuta antes de cada peticion y se encarga de mantener vigente la
 * sesion de Supabase Auth refrescando los tokens almacenados en cookies.
 *
 * No realiza autorizacion: la autorizacion por rol y por ruta se hara en
 * una capa posterior, una vez se haya implementado el sistema de roles.
 *
 * En Next.js 16 la convencion de fichero "middleware" se renombro a "proxy".
 * El comportamiento es identico; el cambio de nombre clarifica el rol de
 * la pieza como capa de proxy ante el resto de la aplicacion.
 */

import { type NextRequest } from "next/server";
import { updateSupabaseSession } from "@/lib/supabase/middleware";

export async function proxy(request: NextRequest) {
  return await updateSupabaseSession(request);
}

/**
 * Lista de rutas en las que el proxy se ejecuta.
 *
 * Se excluyen explicitamente los assets estaticos y los archivos de
 * imagen para evitar refrescos de sesion innecesarios y reducir overhead.
 */
export const config = {
  matcher: [
    /*
     * Todas las rutas excepto:
     * - _next/static (archivos estaticos del build)
     * - _next/image (optimizacion de imagenes)
     * - favicon.ico
     * - archivos publicos comunes (imagenes, fuentes)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff|woff2|ttf|otf)$).*)",
  ],
};