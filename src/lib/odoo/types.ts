/**
 * Tipos comunes del cliente Odoo.
 *
 * Iron Brain accede al sistema Odoo de TodoCESPED exclusivamente en modo de
 * solo lectura. Los tipos definidos en este archivo formalizan a nivel de
 * TypeScript las restricciones de acceso y la forma de las llamadas JSON-RPC.
 */

/**
 * Métodos del ORM de Odoo permitidos por Iron Brain.
 *
 * La lista corresponde al conjunto mínimo necesario para lectura e inspección
 * del modelo de datos. Cualquier método no presente en esta lista (como
 * `create`, `write` o `unlink`) debe ser rechazado por el cliente antes de
 * enviarse a Odoo.
 */
export const ALLOWED_ODOO_METHODS = [
  "search",
  "read",
  "search_read",
  "search_count",
  "fields_get",
  "name_search",
] as const;

/**
 * Tipo unión con los métodos permitidos. Derivado de `ALLOWED_ODOO_METHODS`
 * para evitar duplicación: basta con editar la constante para actualizar
 * el tipo.
 */
export type AllowedOdooMethod = (typeof ALLOWED_ODOO_METHODS)[number];

/**
 * Parámetros de una llamada `execute_kw` a Odoo.
 *
 * - `model`: nombre técnico del modelo (por ejemplo `res.partner`).
 * - `method`: método del ORM a invocar. Restringido a los métodos permitidos.
 * - `args`: argumentos posicionales (dominios, listas de IDs, campos, etc.).
 * - `kwargs`: argumentos con nombre (opcionales: `limit`, `offset`, `order`).
 */
export interface OdooCallParams<TMethod extends AllowedOdooMethod = AllowedOdooMethod> {
  model: string;
  method: TMethod;
  args: unknown[];
  kwargs?: Record<string, unknown>;
}

/**
 * Credenciales para autenticación con Odoo.
 *
 * Odoo 15 admite dos modos para autenticación JSON-RPC: contraseña de usuario
 * y clave de API específica del usuario. El cliente admite ambos de forma
 * transparente. La clave de API se considera más segura por no circular con
 * las operaciones cotidianas del usuario.
 */
export interface OdooCredentials {
  /** URL base de la instancia (por ejemplo: `https://odoo.todocesped.es`). */
  url: string;
  /** Nombre de la base de datos de Odoo. */
  database: string;
  /** Identificador del usuario (típicamente el email). */
  username: string;
  /** Contraseña o clave de API del usuario. */
  secret: string;
}