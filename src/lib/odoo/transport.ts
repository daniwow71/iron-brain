/**
 * Transporte JSON-RPC.
 *
 * Esta capa se encarga exclusivamente de formar, enviar y procesar peticiones
 * JSON-RPC 2.0 al endpoint de Odoo. No conoce ni modelos, ni métodos, ni la
 * lógica de la allowlist: solo habla el protocolo JSON-RPC.
 *
 * Aislar el transporte permite testearlo con `fetch` mockeado y cambiar de
 * mecanismo de red en el futuro (por ejemplo, un proxy interno) sin afectar
 * al resto del cliente.
 */

/** Forma de una petición JSON-RPC 2.0 válida. */
interface JsonRpcRequest {
  jsonrpc: "2.0";
  method: "call";
  params: {
    service: string;
    method: string;
    args: unknown[];
  };
  id: number;
}

/**
 * Forma de una respuesta JSON-RPC 2.0 de Odoo.
 *
 * La respuesta puede contener un campo `result` con el dato devuelto, o un
 * campo `error` con el detalle del fallo. Nunca ambos.
 */
interface JsonRpcResponse<TResult = unknown> {
  jsonrpc: "2.0";
  id: number;
  result?: TResult;
  error?: {
    code: number;
    message: string;
    data?: unknown;
  };
}

/**
 * Error lanzado cuando la petición JSON-RPC falla por motivos de red o de
 * estado HTTP no exitoso. No se aplica a errores devueltos por Odoo dentro
 * de una respuesta HTTP 200 (esos usan `OdooRemoteError`).
 */
export class OdooTransportError extends Error {
  public readonly statusCode?: number;

  constructor(message: string, statusCode?: number) {
    super(message);
    this.name = "OdooTransportError";
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, OdooTransportError.prototype);
  }
}

/**
 * Error lanzado cuando Odoo devuelve una respuesta HTTP 200 con el campo
 * `error` poblado. Típicamente corresponde a errores de autenticación,
 * permisos insuficientes, modelos inexistentes, etc.
 */
export class OdooRemoteError extends Error {
  public readonly code: number;
  public readonly data?: unknown;

  constructor(code: number, message: string, data?: unknown) {
    super(message);
    this.name = "OdooRemoteError";
    this.code = code;
    this.data = data;
    Object.setPrototypeOf(this, OdooRemoteError.prototype);
  }
}

let requestIdCounter = 0;

/**
 * Genera un identificador incremental para las peticiones JSON-RPC. El valor
 * no es sensible desde el punto de vista de seguridad; se utiliza únicamente
 * para correlación de peticiones en logs.
 */
function nextRequestId(): number {
  requestIdCounter += 1;
  return requestIdCounter;
}

/**
 * Ejecuta una petición JSON-RPC 2.0 al endpoint de Odoo.
 *
 * La función es deliberadamente genérica: no conoce los servicios, métodos ni
 * argumentos específicos de Odoo. Su responsabilidad es formar el sobre JSON-RPC,
 * enviarlo por HTTP y devolver el `result` o lanzar el error apropiado.
 *
 * @param url      URL base de la instancia Odoo (por ejemplo `https://odoo.todocesped.es`).
 * @param service  Servicio JSON-RPC de Odoo (`"common"` o `"object"`).
 * @param method   Método dentro del servicio (por ejemplo `"login"` o `"execute_kw"`).
 * @param args     Argumentos posicionales del método.
 */
export async function jsonRpcCall<TResult>(
  url: string,
  service: string,
  method: string,
  args: unknown[]
): Promise<TResult> {
  const endpoint = `${url.replace(/\/+$/, "")}/jsonrpc`;

  const body: JsonRpcRequest = {
    jsonrpc: "2.0",
    method: "call",
    params: { service, method, args },
    id: nextRequestId(),
  };

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch (cause) {
    throw new OdooTransportError(
      `Fallo de red al contactar con Odoo (${endpoint}): ${(cause as Error).message}`
    );
  }

  if (!response.ok) {
    throw new OdooTransportError(
      `Odoo devolvió un estado HTTP no exitoso: ${response.status} ${response.statusText}`,
      response.status
    );
  }

  let payload: JsonRpcResponse<TResult>;
  try {
    payload = (await response.json()) as JsonRpcResponse<TResult>;
  } catch (cause) {
    throw new OdooTransportError(
      `No se pudo parsear la respuesta JSON de Odoo: ${(cause as Error).message}`
    );
  }

  if (payload.error) {
    throw new OdooRemoteError(payload.error.code, payload.error.message, payload.error.data);
  }

  if (payload.result === undefined) {
    throw new OdooTransportError(
      "La respuesta JSON-RPC no contiene ni 'result' ni 'error'; formato inesperado."
    );
  }

  return payload.result;
}