/**
 * Validación de métodos permitidos y error asociado.
 *
 * Este módulo implementa la segunda capa de defensa en profundidad de Iron Brain
 * respecto al acceso a Odoo. La primera capa es la configuración del usuario
 * técnico en Odoo con permisos de solo lectura; la segunda, implementada aquí,
 * rechaza a nivel de aplicación cualquier invocación a métodos no permitidos.
 */

import { ALLOWED_ODOO_METHODS, type AllowedOdooMethod } from "./types";

/**
 * Error lanzado cuando se intenta invocar un método de Odoo no incluido en
 * la lista blanca (`ALLOWED_ODOO_METHODS`).
 *
 * Extiende `Error` con el método intentado y el modelo afectado, de forma que
 * los mensajes de error sean auditables y permitan identificar el intento
 * sin ambigüedad.
 */
export class OdooReadOnlyViolationError extends Error {
  public readonly method: string;
  public readonly model: string;

  constructor(method: string, model: string) {
    const message =
      `Intento de invocar el método "${method}" sobre el modelo "${model}" en Odoo. ` +
      `Iron Brain solo permite los métodos: ${ALLOWED_ODOO_METHODS.join(", ")}.`;
    super(message);
    this.name = "OdooReadOnlyViolationError";
    this.method = method;
    this.model = model;

    // Preserva la traza de error correctamente al extender Error en TS.
    Object.setPrototypeOf(this, OdooReadOnlyViolationError.prototype);
  }
}

/**
 * Comprueba si un método arbitrario es miembro de la lista blanca.
 *
 * Esta función actúa como type guard: tras invocarla con resultado `true`,
 * TypeScript estrecha el tipo de `method` a `AllowedOdooMethod`.
 */
export function isAllowedOdooMethod(method: string): method is AllowedOdooMethod {
  return (ALLOWED_ODOO_METHODS as readonly string[]).includes(method);
}

/**
 * Verifica que el método proporcionado esté permitido. Si no lo está, lanza
 * `OdooReadOnlyViolationError`. Esta función es el punto de entrada único de
 * validación para cualquier llamada que realice el cliente Odoo.
 */
export function assertAllowedOdooMethod(method: string, model: string): asserts method is AllowedOdooMethod {
  if (!isAllowedOdooMethod(method)) {
    throw new OdooReadOnlyViolationError(method, model);
  }
}