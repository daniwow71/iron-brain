# ADR-0002: Cliente Odoo de solo lectura con allowlist

- **Fecha**: 2026-04-21
- **Estado**: aceptado
- **Decisor**: Daniel Sanagustín López
- **Revisor técnico**: CTO de TodoCESPED

## Contexto

Iron Brain necesita acceder a la información del sistema ERP corporativo (Odoo 15) para alimentar su almacén propio y los módulos departamentales. Tres restricciones condicionan el diseño del cliente:

- **Solo lectura**. La regla innegociable del proyecto establece que Iron Brain no debe modificar datos en el ERP bajo ninguna circunstancia, ni siquiera por error o ataque deliberado. Toda capacidad de escritura debe estar físicamente imposibilitada por diseño.
- **Defensa en profundidad**. La restricción de solo lectura no puede depender únicamente de la configuración del usuario técnico en Odoo. Un error de configuración en el sistema externo (gestionado por la empresa Sygel) no debería poder traducirse en escrituras efectivas desde Iron Brain.
- **Compatibilidad con futuras versiones de Odoo**. El producto prevé una vida útil superior a la versión 15 del ERP. El cliente debe elegirse de forma que el coste de migrar a versiones posteriores sea mínimo.

## Alternativas consideradas

### Protocolo de comunicación

Odoo 15 expone dos protocolos para integración remota:

- **Alternativa A — XML-RPC.** Protocolo clásico, soportado por Odoo desde versiones muy antiguas. Utiliza XML como formato de mensaje.
- **Alternativa B — JSON-RPC (seleccionada).** Protocolo moderno que utiliza JSON como formato de mensaje. Soportado en Odoo 15 y favorecido en versiones posteriores.

Ventajas de JSON-RPC sobre XML-RPC:

- El formato JSON pesa menos que su equivalente XML, reduciendo el volumen de datos transferido en cada petición.
- El parseo de JSON es nativo en JavaScript y TypeScript: no requiere bibliotecas adicionales para serialización ni deserialización.
- Los mensajes JSON-RPC son más legibles en logs y herramientas de depuración.
- Odoo favorece JSON-RPC en versiones posteriores a la 15. Elegir este protocolo reduce el coste de una eventual migración.

XML-RPC queda descartado por los motivos anteriores, a pesar de estar igualmente soportado en Odoo 15.

### Modelo de imposición de la regla de solo lectura

- **Alternativa A — Delegar en la configuración del usuario en Odoo.** Confiar en que el usuario técnico utilizado por Iron Brain tenga únicamente permisos de lectura configurados en el ERP.
- **Alternativa B — Allowlist en el cliente (seleccionada, complementaria a A).** Implementar en el propio cliente una lista blanca estricta de métodos permitidos del ORM de Odoo. Cualquier invocación a un método no incluido en la lista resulta rechazada a nivel de aplicación, antes de enviarse a la red.

Ventajas de la allowlist frente a la delegación en Odoo:

- La allowlist opera como segunda capa de defensa. Aunque el usuario técnico quedara mal configurado (por error de Sygel, por revisión futura o por compromiso del sistema), el código de Iron Brain no es capaz de pedir una operación de escritura: el propio cliente la rechaza antes de enviarla.
- Separa la responsabilidad de seguridad entre las dos partes implicadas. Sygel mantiene el permiso correctamente en Odoo; el autor mantiene la restricción correctamente en el cliente. Las dos capas son independientes y protegen ante fallos en la otra.
- Es verificable de forma automatizada mediante pruebas unitarias, independientes del estado de Odoo.

La alternativa A (permiso a nivel de usuario) se mantiene también, pero como capa complementaria, no como única defensa. La solicitud a Sygel de reconfigurar el usuario técnico con permisos de solo lectura está registrada en el estado del proyecto.

## Decisión

Se implementa el cliente Odoo sobre el protocolo **JSON-RPC 2.0**, comunicándose con el endpoint `/jsonrpc` de la instancia de Odoo. El acceso a los métodos del ORM se restringe mediante una **allowlist** que contiene exclusivamente los métodos necesarios para lectura e introspección:

- `search`
- `read`
- `search_read`
- `search_count`
- `fields_get`
- `name_search`

Cualquier invocación a un método no incluido en la lista, incluidos `create`, `write` y `unlink`, resulta rechazada por el cliente con una excepción `OdooReadOnlyViolationError` antes de enviarse a Odoo. La restricción se valida mediante pruebas unitarias automatizadas que forman parte del conjunto de pruebas obligatorias del proyecto.

Las peticiones son diferenciadas, teniendo un metodo call() y jsonRPC() para tratar por una parte la recepcion del fetch correctamente (tratamos la recepcion json con jsonRPC() ) y call() se encarga de la realizacion de la peticion tratada desde json, de esta forma conseguimos que en caso de tener que capturar nuevas respuestas json que no vengan de Odoo, tengamos la logica de la allowlist en call (procesado del fetch) y la recepcion de la llamada en formato JSON en jsonRPC, beneficiandonos en caso de la ampliacion de otros servicios a futuro.

## Consecuencias

### Positivas

- El sistema satisface la regla innegociable de solo lectura mediante defensa en profundidad: la configuración del usuario en Odoo y la allowlist del cliente actúan como capas independientes.
- El uso de JSON-RPC facilita la migración a versiones posteriores de Odoo sin cambios sustanciales en el cliente.
- La allowlist es verificable de forma automatizada. Los tests unitarios validan que cada método permitido es aceptado y cada método prohibido (incluidos los no contemplados) es rechazado.
- El cliente se integra de forma nativa con TypeScript. Los tipos `AllowedOdooMethod` y `OdooCallParams` aportan seguridad en tiempo de compilación sobre los métodos invocados.

### Negativas o riesgos asumidos

- Si en el futuro aparece una necesidad legítima de invocar un método no incluido en la lista, la allowlist debe modificarse de forma deliberada. Esto es voluntario: obliga a evaluar cada incorporación como una decisión arquitectónica consciente, no como una modificación trivial.
- El uso de JSON-RPC implica que algunos ejemplos de la documentación oficial de Odoo (orientados a XML-RPC) deben adaptarse al formato JSON-RPC. La adaptación no es conceptualmente compleja pero requiere verificación.

### Acciones derivadas

- [x] Implementar el cliente Odoo con soporte JSON-RPC en `src/lib/odoo/`.
- [x] Implementar `assertAllowedOdooMethod` como validación centralizada.
- [x] Definir las clases de error `OdooReadOnlyViolationError`, `OdooTransportError`, `OdooRemoteError`, `OdooNotAuthenticatedError` y `OdooAuthenticationError`.
- [x] Redactar pruebas unitarias que verifiquen que los métodos prohibidos son rechazados.
- [ ] Verificar la conexión real con la instancia Odoo de TodoCESPED una vez Sygel proporcione el usuario técnico de solo lectura.
- [ ] Implementar el endpoint `GET /api/odoo/health` que utilice el método `healthCheck()` del cliente.

## Referencias

- Briefing inicial del proyecto (ACTIONS.pdf), facilitado por el cliente.
- Documentación de JSON-RPC 2.0: https://www.jsonrpc.org/specification
- Documentación oficial de integración con Odoo por JSON-RPC.
- OWASP Top 10:2021, A01: Broken Access Control.