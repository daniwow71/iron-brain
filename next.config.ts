import type { NextConfig } from "next";

/**
 * Cabeceras HTTP de seguridad aplicadas a todas las rutas.
 *
 * Cubren los controles básicos recomendados por OWASP para mitigar ataques
 * de clickjacking, MIME sniffing y filtración de referrers. La política de
 * seguridad de contenido (CSP) se definirá de forma estricta más adelante,
 * cuando se incorporen fuentes externas de scripts.
 */
const securityHeaders = [
  {
    key: "X-Frame-Options",
    value: "DENY",
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff",
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
];

const nextConfig: NextConfig = {
  // Fija explícitamente la raíz del workspace para evitar la detección
  // incorrecta de lockfiles huérfanos fuera del repositorio.
  turbopack: {
    root: __dirname,
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};
export default nextConfig;
