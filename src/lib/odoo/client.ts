/**
 * Cliente de alto nivel para Odoo 15 sobre JSON-RPC.
 *
 * Coordina la autenticación, la validación contra la allowlist de métodos
 * permitidos y el envío de las peticiones a través del transporte JSON-RPC.
 *
 * El cliente mantiene como estado interno la sesión autenticada (en concreto,
 * el `uid` devuelto por Odoo al autenticar) de forma que llamadas sucesivas
 * no requieran reautenticación.
 */

import type { OdooCallParams, OdooCredentials } from "./types";
import { assertAllowedOdooMethod } from "./allowlist";
import { jsonRpcCall, OdooRemoteError } from "./transport";

/**
 * Error lanzado cuando se intenta invocar un método del ORM de Odoo sin
 * haberse autenticado previamente. Indica un uso incorrecto del cliente
 * por parte del código superior.
 */
export class OdooNotAuthenticatedError extends Error {
  constructor() {
    super(
      "OdooClient: se intentó invocar el ORM sin sesión autenticada. " +
        "Llama a authenticate() antes de call()."
    );
    this.name = "OdooNotAuthenticatedError";
    Object.setPrototypeOf(this, OdooNotAuthenticatedError.prototype);
  }
}

/**
 * Error lanzado cuando el servidor Odoo rechaza las credenciales durante
 * la autenticación. Se distingue del error remoto genérico para permitir
 * al código superior tratarlo de forma específica (por ejemplo, refrescar
 * credenciales o redirigir a una página de error).
 */
export class OdooAuthenticationError extends Error {
  constructor() {
    super("OdooClient: las credenciales proporcionadas fueron rechazadas por Odoo.");
    this.name = "OdooAuthenticationError";
    Object.setPrototypeOf(this, OdooAuthenticationError.prototype);
  }
}

/**
 * Cliente Odoo sobre JSON-RPC con validación de allowlist.
 *
 * Uso típico:
 *   const client = new OdooClient(credentials);
 *   await client.authenticate();
 *   const partners = await client.call({
 *     model: "res.partner",
 *     method: "search_read",
 *     args: [[["is_company", "=", true]], ["id", "name"]],
 *     kwargs: { limit: 10 },
 *   });
 */
export class OdooClient {
  private readonly credentials: OdooCredentials;
  private uid: number | null = null;

  constructor(credentials: OdooCredentials) {
    this.credentials = credentials;
  }

  /**
   * Indica si el cliente tiene una sesión autenticada activa.
   */
  public isAuthenticated(): boolean {
    return this.uid !== null;
  }

  /**
   * Devuelve el identificador numérico del usuario autenticado (`uid`) o
   * `null` si aún no se ha autenticado.
   */
  public getAuthenticatedUid(): number | null {
    return this.uid;
  }

  /**
   * Autentica contra la instancia Odoo usando las credenciales proporcionadas
   * al construir el cliente. Al tener éxito, almacena el `uid` devuelto por
   * Odoo para su uso en llamadas posteriores.
   *
   * @throws OdooAuthenticationError si Odoo rechaza las credenciales.
   */
  public async authenticate(): Promise<number> {
    const result = await jsonRpcCall<number | false>(
      this.credentials.url,
      "common",
      "login",
      [this.credentials.database, this.credentials.username, this.credentials.secret]
    );

    if (result === false || typeof result !== "number") {
      throw new OdooAuthenticationError();
    }

    this.uid = result;
    return result;
  }

  /**
   * Ejecuta un método del ORM de Odoo tras validar que esté permitido por
   * la allowlist del proyecto. Requiere una sesión autenticada previa.
   *
   * @throws OdooNotAuthenticatedError si no se ha llamado a authenticate() antes.
   * @throws OdooReadOnlyViolationError si el método no está en la allowlist.
   * @throws OdooRemoteError si Odoo devuelve un error en la respuesta.
   * @throws OdooTransportError si falla la comunicación.
   */
  public async call<TResult = unknown>(params: OdooCallParams): Promise<TResult> {
    if (this.uid === null) {
      throw new OdooNotAuthenticatedError();
    }

    // Primera línea de defensa: valida el método contra la allowlist.
    // Lanza OdooReadOnlyViolationError si el método no está permitido.
    assertAllowedOdooMethod(params.method, params.model);

    const args = [
      this.credentials.database,
      this.uid,
      this.credentials.secret,
      params.model,
      params.method,
      params.args,
      params.kwargs ?? {},
    ];

    return jsonRpcCall<TResult>(this.credentials.url, "object", "execute_kw", args);
  }

  /**
   * Comprueba la disponibilidad del servicio Odoo realizando una autenticación
   * contra el endpoint `common.login`. Devuelve `true` si la instancia responde
   * y las credenciales son aceptadas; `false` en cualquier otro caso.
   *
   * No propaga excepciones: cualquier fallo se traduce en `false`. Pensado para
   * el endpoint de health check del sistema.
   */
  public async healthCheck(): Promise<boolean> {
    try {
      await this.authenticate();
      return true;
    } catch (error) {
      // En health checks tratamos cualquier fallo como "no disponible",
      // sin distinguir entre auth error, transport error o remote error.
      // El detalle del fallo lo proporcionarán los logs de la capa superior.
      void error;
      return false;
    }
  }
}